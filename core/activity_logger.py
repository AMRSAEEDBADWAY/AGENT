"""
📝 Activity Logger — Records all user actions
================================================
Stores every action performed by users for admin monitoring.
"""

from datetime import datetime
from typing import Optional
from core.firebase_config import get_db

# In-memory fallback when Firestore is in mock mode
_activity_log = []

 
def log_activity(
    user_email: str,
    action: str,
    details: str = "",
    page: str = "",
    user_name: str = "",
):
    """Log a user activity."""
    entry = {
        "user_email": user_email,
        "user_name": user_name,
        "action": action,
        "details": details,
        "page": page,
        "timestamp": datetime.now().isoformat(),
    }

    # Save to Firestore
    db = get_db()
    if db:
        try:
            db.collection("activity_log").document().set(entry)
        except Exception:
            pass

    # Also keep in memory (always available)
    _activity_log.append(entry)
    # Keep last 1000 entries in memory
    if len(_activity_log) > 1000:
        _activity_log.pop(0)


def get_all_activities(limit: int = 200):
    """Get recent activity logs."""
    db = get_db()
    if db:
        try:
            docs = db.collection("activity_log").order_by("timestamp").stream()
            results = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                results.append(data)
            # Return last N entries (most recent first)
            return list(reversed(results[-limit:]))
        except Exception:
            pass

    # Fallback to in-memory
    return list(reversed(_activity_log[-limit:]))
