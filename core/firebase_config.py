"""
🔥 Firebase Configuration
==========================
Initializes Firebase Admin SDK for the backend.
Uses a service account JSON file or environment variables.

Setup:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key" 
3. Save the JSON file as `firebase-key.json` in the backend/ directory
4. Add firebase-key.json to .gitignore!
"""

import os
import firebase_admin
from firebase_admin import credentials, firestore, auth

_db = None
_mock_mode = False

class MockFirestore:
    """A minimal mock for Firestore to allow UI testing without credentials."""
    def __init__(self):
        self.data = {"projects": {}, "users": {}}
        print("MOCK FIRESTORE INITIALIZED (No credentials found)")
        
    def collection(self, name):
        return MockCollection(self.data.setdefault(name, {}))

class MockCollection:
    def __init__(self, data_ref):
        self.data_ref = data_ref
        self._filters = []
        self._order_by = None
        
    def document(self, doc_id=None):
        if not doc_id:
            import uuid
            doc_id = str(uuid.uuid4())
        return MockDocument(self.data_ref, doc_id)
        
    def where(self, field, op, value):
        self._filters.append((field, op, value))
        return self
        
    def order_by(self, field):
        self._order_by = field
        return self
        
    def stream(self):
        results = []
        for doc_id, doc_data in self.data_ref.items():
            if doc_id == "__subs__": continue
            
            # evaluate where clauses
            match = True
            for f, op, v in self._filters:
                doc_val = doc_data.get(f)
                if op == "==" and doc_val != v:
                    match = False
                elif op == ">" and doc_val <= v:
                    match = False
                elif op == "<" and doc_val >= v:
                    match = False
            if match:
                results.append(MockSnapshot(doc_id, doc_data))
        
        if self._order_by:
            results.sort(key=lambda s: s._data.get(self._order_by, ""))
            
        return results

class MockDocument:
    def __init__(self, data_ref, doc_id):
        self.data_ref = data_ref
        self.doc_id = doc_id
        
    def set(self, data):
        self.data_ref[self.doc_id] = data
        
    def get(self):
        return MockSnapshot(self.doc_id, self.data_ref.get(self.doc_id))
        
    def update(self, data):
        if self.doc_id in self.data_ref:
            self.data_ref[self.doc_id].update(data)
            
    def delete(self):
        self.data_ref.pop(self.doc_id, None)
        
    def collection(self, name):
        # Nested subcollections
        # In firestore mock data_ref is a dict of documents for that collection
        if self.doc_id not in self.data_ref:
            self.data_ref[self.doc_id] = {}
            
        doc_data = self.data_ref[self.doc_id]
        if "__subs__" not in doc_data:
            doc_data["__subs__"] = {}
            
        if name not in doc_data["__subs__"]:
            doc_data["__subs__"][name] = {}
            
        return MockCollection(doc_data["__subs__"][name])

class MockSnapshot:
    def __init__(self, id, data):
        self.id = id
        self._data = data
        self.exists = data is not None
        
    def to_dict(self):
        return self._data or {}

def init_firebase():
    """Initialize Firebase Admin SDK."""
    global _db, _mock_mode
    
    if _db is not None:
        return
    
    key_path = os.path.join(os.path.dirname(__file__), "..", "firebase-key.json")
    env_path = os.getenv("FIREBASE_KEY_PATH")
    
    try:
        if os.path.exists(key_path):
            cred = credentials.Certificate(key_path)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            _db = firestore.client(database_id="ai-agent-cc829")
            print("Firebase initialized with key file!")
        elif env_path and os.path.exists(env_path):
            cred = credentials.Certificate(env_path)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            _db = firestore.client(database_id="ai-agent-cc829")
            print("Firebase initialized via Environment Variable!")
        else:
            print("Firebase key missing. Falling back to MOCK mode.")
            _mock_mode = True
            _db = MockFirestore()
    except Exception as e:
        print(f"Firebase Init Error: {e}. Falling back to MOCK mode.")
        _mock_mode = True
        _db = MockFirestore()

def get_db():
    """Get Firestore client."""
    global _db
    if _db is None:
        init_firebase()
    return _db

def verify_token(id_token: str) -> dict:
    """Verify a Firebase ID token from the frontend."""
    if _mock_mode:
        if id_token == "demo_token":
            return {"valid": True, "uid": "demo_user_001", "email": "demo@baseerflow.com"}
        
        # Try to extract real email from JWT even in mock mode
        import base64
        import json
        try:
            parts = id_token.split('.')
            if len(parts) == 3:
                payload = parts[1]
                padded = payload + '=' * (4 - len(payload) % 4)
                decoded = json.loads(base64.b64decode(padded).decode('utf-8'))
                return {"valid": True, "uid": decoded.get("user_id", "mock_user"), "email": decoded.get("email", "mock@example.com")}
        except:
            pass
            
        return {"valid": True, "uid": "mock_user_123", "email": "amrsaeedbadwey@gmail.com"}
    
    try:
        decoded = auth.verify_id_token(id_token)
        return {"valid": True, "uid": decoded["uid"], "email": decoded.get("email", "")}
    except Exception as e:
        return {"valid": False, "error": str(e)}

def create_user(email: str, password: str, display_name: str = "") -> dict:
    """Create a new Firebase user."""
    if _mock_mode:
        import uuid
        uid = str(uuid.uuid4())
        # Store mock user
        db = get_db()
        db.collection("users").document(uid).set({
            "email": email,
            "display_name": display_name,
            "role": "user"
        })
        return {"success": True, "uid": uid}
        
    try:
        user = auth.create_user(
            email=email,
            password=password,
            display_name=display_name,
        )
        return {"success": True, "uid": user.uid}
    except Exception as e:
        return {"success": False, "error": str(e)}
