from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from config.database import get_db, serialize_doc, to_object_id
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

def get_notification_query(current_user: dict) -> dict:
    user_id = to_object_id(current_user["_id"])
    if current_user.get("role") == "admin":
        return {
            "$or": [
                {"forRole": "admin"},
                {"forRole": "all"},
                {"recipient": user_id}
            ]
        }
    return {"recipient": user_id}

@router.get("")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    db = get_db()
    query = get_notification_query(current_user)

    cursor = db.notifications.find(query).sort("createdAt", -1).limit(30)
    notifications = await cursor.to_list(length=30)
    serialized = serialize_doc(notifications)

    unread_count = await db.notifications.count_documents({**query, "read": False})

    return {
        "success": True,
        "count": len(serialized),
        "unreadCount": unread_count,
        "notifications": serialized
    }

@router.put("/{notif_id}/read")
@router.patch("/{notif_id}/read")
async def mark_as_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    obj_id = to_object_id(notif_id)
    if not obj_id:
        raise HTTPException(status_code=404, detail="Notification not found")

    result = await db.notifications.update_one(
        {"_id": obj_id},
        {"$set": {"read": True, "updatedAt": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"success": True, "message": "Notification marked as read"}

@router.put("/mark-all-read")
@router.patch("/mark-all-read")
async def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    db = get_db()
    query = get_notification_query(current_user)

    await db.notifications.update_many(
        query,
        {"$set": {"read": True, "updatedAt": datetime.utcnow()}}
    )

    return {"success": True, "message": "All notifications marked as read"}
