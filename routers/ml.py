"""
🧠 ML Router — Machine Learning Training & Prediction
======================================================
Supports scikit-learn, XGBoost, and LightGBM.
"""

from fastapi import APIRouter, HTTPException, Header, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import io

router = APIRouter()


class TrainRequest(BaseModel):
    target_column: str
    algorithm: str = "random_forest"  # random_forest, xgboost, lightgbm, svm, logistic
    test_size: float = 0.2
    data: List[Dict[str, Any]]  # rows of data


class PredictRequest(BaseModel):
    model_id: str
    features: Dict[str, Any]


# Store trained models in memory (for demo — in production use joblib + storage)
_trained_models = {}


@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """Upload a CSV file and return its preview."""
    try:
        import pandas as pd
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        return {
            "filename": file.filename,
            "rows": len(df),
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "preview": df.head(10).to_dict(orient="records"),
            "data": df.to_dict(orient="records"),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"خطأ في قراءة الملف: {str(e)}")


@router.post("/train")
async def train_model(req: TrainRequest):
    """Train a ML model on the provided data."""
    try:
        import pandas as pd
        import numpy as np
        df = pd.DataFrame(req.data)
        
        if req.target_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"العمود '{req.target_column}' غير موجود")
        
        # Separate features and target
        X = df.drop(columns=[req.target_column])
        y = df[req.target_column]
        
        # Drop rows where target is NaN
        valid_mask = y.notna()
        X = X[valid_mask]
        y = y[valid_mask]
        
        if len(y) < 10:
            raise HTTPException(status_code=400, detail="عدد العينات الصالحة قليل جداً (أقل من 10). تأكد من أن العمود المستهدف لا يحتوي على قيم فارغة كثيرة.")
        
        # Prevent regression targets from crashing the classification pipeline
        if pd.api.types.is_numeric_dtype(y) and len(y.dropna().unique()) > 20:
            raise HTTPException(status_code=400, detail="هذا العمود يحتوي على قيم رقمية متنوعة جداً (Regression). النماذج الحالية تدعم التصنيف (Classification) والتنبؤ بالفئات المحددة فقط. يرجى محاولة التنبؤ بعمود آخر أو تحويل هذا العمود إلى فئات.")
            
        # Handle categorical columns
        X = pd.get_dummies(X, drop_first=True)
        
        # Fill remaining NaN in features with median/mode
        for col in X.columns:
            if X[col].isna().any():
                if pd.api.types.is_numeric_dtype(X[col]):
                    X[col] = X[col].fillna(X[col].median())
                else:
                    X[col] = X[col].fillna(X[col].mode().iloc[0] if len(X[col].mode()) > 0 else 0)
        
        # Split
        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=req.test_size, random_state=42)
        
        # Select algorithm
        if req.algorithm == "random_forest":
            from sklearn.ensemble import RandomForestClassifier
            model = RandomForestClassifier(n_estimators=100, random_state=42)
        elif req.algorithm == "xgboost":
            from xgboost import XGBClassifier
            model = XGBClassifier(n_estimators=100, random_state=42, use_label_encoder=False, eval_metric="logloss")
        elif req.algorithm == "lightgbm":
            from lightgbm import LGBMClassifier
            model = LGBMClassifier(n_estimators=100, random_state=42, verbose=-1)
        elif req.algorithm == "svm":
            from sklearn.svm import SVC
            model = SVC(kernel="rbf", random_state=42, probability=True)
        elif req.algorithm == "logistic":
            from sklearn.linear_model import LogisticRegression
            model = LogisticRegression(max_iter=1000, random_state=42)
        else:
            raise HTTPException(status_code=400, detail=f"الخوارزمية '{req.algorithm}' غير مدعومة")
        
        # Train
        model.fit(X_train, y_train)
        
        # Evaluate
        from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        # Feature importance
        feature_importance = {}
        if hasattr(model, "feature_importances_"):
            for fname, fimp in zip(X.columns, model.feature_importances_):
                feature_importance[fname] = round(float(fimp), 4)
        
        # Store model with all info needed for prediction
        model_id = f"model_{len(_trained_models)}"
        _trained_models[model_id] = {
            "model": model,
            "columns": list(X.columns),
            "algorithm": req.algorithm,
            "target_column": req.target_column,
            "classes": [str(c) for c in model.classes_] if hasattr(model, "classes_") else [],
            "original_columns": list(df.drop(columns=[req.target_column]).columns),
        }
        
        return {
            "success": True,
            "model_id": model_id,
            "algorithm": req.algorithm,
            "accuracy": round(accuracy, 4),
            "classification_report": report,
            "confusion_matrix": cm,
            "feature_importance": feature_importance,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "features": list(X.columns),
            "original_features": list(df.drop(columns=[req.target_column]).columns),
            "classes": [str(c) for c in model.classes_] if hasattr(model, "classes_") else [],
            "target_column": req.target_column,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في التدريب: {str(e)}")


@router.post("/predict")
async def predict(req: PredictRequest):
    """Predict using a trained model."""
    if req.model_id not in _trained_models:
        raise HTTPException(status_code=404, detail="النموذج غير موجود. قم بالتدريب أولاً.")
    
    try:
        import pandas as pd
        import numpy as np
        
        stored = _trained_models[req.model_id]
        model = stored["model"]
        expected_columns = stored["columns"]
        
        # Build a DataFrame from the features
        input_df = pd.DataFrame([req.features])
        
        # Apply same one-hot encoding
        input_df = pd.get_dummies(input_df, drop_first=True)
        
        # Align columns with training data
        for col in expected_columns:
            if col not in input_df.columns:
                input_df[col] = 0
        input_df = input_df[expected_columns]
        
        # Fill NaN
        input_df = input_df.fillna(0)
        
        # Predict
        prediction = model.predict(input_df)[0]
        
        # Get probabilities if available
        probabilities = {}
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(input_df)[0]
            classes = stored.get("classes", [])
            for i, cls in enumerate(classes):
                if i < len(proba):
                    probabilities[str(cls)] = round(float(proba[i]), 4)
        
        return {
            "success": True,
            "prediction": str(prediction),
            "probabilities": probabilities,
            "model_id": req.model_id,
            "target_column": stored["target_column"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في التنبؤ: {str(e)}")


@router.get("/download-model/{model_id}")
async def download_model(model_id: str):
    """Download the trained model as a .joblib file."""
    if model_id not in _trained_models:
        raise HTTPException(status_code=404, detail="النموذج غير موجود.")
    
    try:
        import joblib
        
        stored = _trained_models[model_id]
        buffer = io.BytesIO()
        
        # Save model + metadata together
        export_data = {
            "model": stored["model"],
            "columns": stored["columns"],
            "algorithm": stored["algorithm"],
            "target_column": stored["target_column"],
            "classes": stored.get("classes", []),
            "original_columns": stored.get("original_columns", []),
        }
        joblib.dump(export_data, buffer)
        buffer.seek(0)
        
        filename = f"{model_id}_{stored['algorithm']}.joblib"
        return StreamingResponse(
            buffer,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ImportError:
        # Fallback to pickle if joblib not available
        import pickle
        stored = _trained_models[model_id]
        buffer = io.BytesIO()
        pickle.dump(stored["model"], buffer)
        buffer.seek(0)
        filename = f"{model_id}_{stored['algorithm']}.pkl"
        return StreamingResponse(
            buffer,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
