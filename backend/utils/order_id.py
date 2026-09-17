from datetime import datetime
from config.database import get_db

async def generate_order_id() -> str:
    now = datetime.utcnow()
    date_prefix = f"ORD-{now.strftime('%Y%m%d')}"
    db = get_db()
    
    # Find latest order created today with this prefix
    cursor = db.orders.find({"orderId": {"$regex": f"^# {date_prefix}-"}}).sort("createdAt", -1).limit(1)
    orders = await cursor.to_list(length=1)
    
    sequence = 1
    if orders and "orderId" in orders[0]:
        parts = orders[0]["orderId"].split("-")
        try:
            last_seq = int(parts[-1])
            sequence = last_seq + 1
        except (ValueError, IndexError):
            sequence = 1

    return f"# {date_prefix}-{sequence:03d}"
