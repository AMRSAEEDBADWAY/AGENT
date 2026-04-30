from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any
from core.firebase_config import get_db
from firebase_admin import auth

router = APIRouter()

class SignupRequest(BaseModel):
    email: str
    password: str
    display_name: str

class LoginVerifyRequest(BaseModel):
    id_token: str

class CheckEmailRequest(BaseModel):
    email: str


@router.post("/check-email")
async def check_email(req: CheckEmailRequest):
    """Check if an email is already registered."""
    try:
        user = auth.get_user_by_email(req.email)
        # User exists
        return {
            "exists": True,
            "message": "هذا الحساب مسجل بالفعل. يمكنك تسجيل الدخول."
        }
    except auth.UserNotFoundError:
        return {
            "exists": False,
            "message": "هذا البريد غير مسجل. يمكنك إنشاء حساب جديد."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/signup")
async def signup(req: SignupRequest):
    # Check if email already exists first
    try:
        auth.get_user_by_email(req.email)
        raise HTTPException(
            status_code=409,
            detail="هذا البريد الإلكتروني مسجل بالفعل. جرب تسجيل الدخول."
        )
    except auth.UserNotFoundError:
        pass  # Good — email is available

    try:
        user = auth.create_user(
            email=req.email,
            password=req.password,
            display_name=req.display_name
        )
        db = get_db()
        if db:
            db.collection("users").document(user.uid).set({
                "uid": user.uid,
                "email": req.email,
                "display_name": req.display_name,
                "role": "user",
                "created_at": __import__("datetime").datetime.now().isoformat()
            })
        return {"success": True, "uid": user.uid, "message": "تم إنشاء الحساب بنجاح!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify")
async def verify(req: LoginVerifyRequest):
    try:
        decoded_token = auth.verify_id_token(req.id_token)
        uid = decoded_token['uid']
        email = decoded_token.get('email', '')
        
        db = get_db()
        profile = {}
        if db:
            doc = db.collection("users").document(uid).get()
            if doc.exists:
                profile = doc.to_dict()
                
        return {
            "valid": True,
            "uid": uid,
            "email": email,
            "profile": profile
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token غير صالح")

