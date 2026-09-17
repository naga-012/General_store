import socketio

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False
)

@sio.event
async def connect(sid, environ):
    print(f"Socket client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Socket client disconnected: {sid}")

@sio.event
async def join_user_room(sid, user_id):
    if user_id:
        room_name = f"user:{user_id}"
        await sio.enter_room(sid, room_name)
        print(f"Socket {sid} joined user room: {room_name}")

@sio.event
async def join_admin_room(sid):
    await sio.enter_room(sid, "admin_room")
    print(f"Socket {sid} joined admin_room")

async def emit_new_order_to_admin(order_data):
    try:
        await sio.emit("new_order_received", order_data, room="admin_room")
    except Exception as e:
        print(f"Error emitting new order: {e}")

async def emit_order_status_update(user_id, order_data, notification_data=None):
    payload = {
        "order": order_data,
        "notification": notification_data
    }
    try:
        if user_id:
            await sio.emit("order_status_updated", payload, room=f"user:{user_id}")
        await sio.emit("order_status_updated", payload, room="admin_room")
    except Exception as e:
        print(f"Error emitting order status update: {e}")

async def emit_low_stock_alert(alert_data):
    try:
        await sio.emit("low_stock_alert", alert_data, room="admin_room")
    except Exception as e:
        print(f"Error emitting low stock alert: {e}")

async def emit_product_change(change_data):
    try:
        await sio.emit("product_updated", change_data)
    except Exception as e:
        print(f"Error emitting product change: {e}")
