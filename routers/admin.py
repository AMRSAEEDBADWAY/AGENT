"""
🛡️ Admin Router — Admin Panel & Activity Logs
================================================
Provides activity monitoring for administrators.
"""

from fastapi import APIRouter, HTTPException, Request
from core.firebase_config import get_db

router = APIRouter()


@router.get("/logs")
async def get_activity_logs(request: Request):
    """Get all activity logs for admin monitoring."""
    uid = request.headers.get("X-User-ID")
    if not uid:
        raise HTTPException(status_code=401, detail="غير مصرح")
    
    db = get_db()
    if not db:
        return []
    
    try:
        # Try to get logs from Firestore
        docs = db.collection("activity_logs").get()
        logs = []
        for doc in docs:
            d = doc.to_dict()
            d["id"] = doc.id
            logs.append(d)
        
        # Sort by timestamp descending (newest first)
        logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return logs
    except Exception:
        # If collection doesn't exist, return empty
        return []
