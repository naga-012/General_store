from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel
from typing import Optional, List, Any

from config.database import get_db, serialize_doc, to_object_id
from middleware.auth import get_current_user, get_current_admin
from utils.order_id import generate_order_id
from services.socket_service import (
    emit_new_order_to_admin,
    emit_order_status_update,
    emit_low_stock_alert
)

router = APIRouter(prefix="/api/orders", tags=["orders"])

class OrderItemInput(BaseModel):
    product: Optional[str] = None
    productId: Optional[str] = None
    name: Optional[str] = None
    unit: str
    quantity: int

class CreateOrderRequest(BaseModel):
    items: List[OrderItemInput]
    customerAddress: Optional[str] = None
    customerMobile: Optional[str] = None
    notes: Optional[str] = None
    orderType: Optional[str] = "Pickup from Shop"

class UpdateOrderStatusRequest(BaseModel):
    status: str
    note: Optional[str] = None
    rejectionReason: Optional[str] = None

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_order(
    req: CreateOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    if not req.items or len(req.items) == 0:
        raise HTTPException(status_code=400, detail="Your cart is empty")

    db = get_db()
    validated_items = []
    subtotal = 0.0

    for item in req.items:
        prod_id_str = item.productId or item.product
        prod_obj_id = to_object_id(prod_id_str)
        if not prod_obj_id:
            raise HTTPException(status_code=400, detail=f"Invalid product id: {prod_id_str}")

        product = await db.products.find_one({"_id": prod_obj_id})
        if not product or product.get("status") != "active":
            p_name = item.name or (product.get("name") if product else "Product")
            raise HTTPException(status_code=400, detail=f'Product "{p_name}" is currently unavailable or inactive')

        # Find specific variant
        variants = product.get("variants", [])
        variant = next((v for v in variants if v.get("unit") == item.unit), None)
        if not variant:
            raise HTTPException(
                status_code=400,
                detail=f'Unit "{item.unit}" is no longer available for {product.get("name")}'
            )

        if variant.get("stock", 0) < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f'Insufficient stock for {product.get("name")} ({item.unit}). Only {variant.get("stock")} available.'
            )

        price = float(variant.get("price", 0))
        line_total = price * item.quantity
        subtotal += line_total

        validated_items.append({
            "product": prod_obj_id,
            "name": product.get("name"),
            "image": product.get("image", ""),
            "unit": variant.get("unit"),
            "price": price,
            "quantity": item.quantity,
            "lineTotal": line_total
        })

    order_id = await generate_order_id()
    is_delivery = req.orderType in ["delivery", "Home Delivery"]
    delivery_fee = 40.0 if is_delivery else 0.0
    grand_total = subtotal + delivery_fee
    now = datetime.utcnow()

    cust_obj_id = to_object_id(current_user["_id"])
    cust_mobile = req.customerMobile or current_user.get("mobile", "")
    cust_address = req.customerAddress or (current_user.get("address", "") if is_delivery else "Store Counter Pickup")

    order_doc = {
        "orderId": order_id,
        "customer": cust_obj_id,
        "customerName": current_user.get("name", ""),
        "customerMobile": cust_mobile,
        "customerAddress": cust_address,
        "items": validated_items,
        "subtotal": subtotal,
        "deliveryFee": delivery_fee,
        "discount": 0.0,
        "grandTotal": grand_total,
        "orderType": "Home Delivery" if is_delivery else "Pickup from Shop",
        "paymentMethod": "Cash / UPI on Delivery" if is_delivery else "Cash on Pickup",
        "paymentStatus": "PENDING",
        "orderStatus": "ORDER_PLACED",
        "statusHistory": [
            {
                "status": "ORDER_PLACED",
                "timestamp": now,
                "note": "Order successfully placed by customer"
            }
        ],
        "isStockDeducted": False,
        "pickupNotes": req.notes or ("Deliver to customer address" if is_delivery else "Please pick up from the store counter once packed."),
        "rejectionReason": "",
        "createdAt": now,
        "updatedAt": now
    }

    result = await db.orders.insert_one(order_doc)
    order_doc["_id"] = result.inserted_id
    serialized_order = serialize_doc(order_doc)

    # Customer notification
    await db.notifications.insert_one({
        "recipient": cust_obj_id,
        "forRole": "customer",
        "order": result.inserted_id,
        "orderIdStr": order_id,
        "title": "Order Placed Successfully",
        "message": f"Your order {order_id} has been sent to the shop for confirmation.",
        "type": "ORDER_PLACED",
        "read": False,
        "createdAt": now,
        "updatedAt": now
    })

    # Admin notification
    await db.notifications.insert_one({
        "recipient": None,
        "forRole": "admin",
        "order": result.inserted_id,
        "orderIdStr": order_id,
        "title": "New Order Received",
        "message": f"New order {order_id} received from {current_user.get('name')} (₹{grand_total}).",
        "type": "ORDER_PLACED",
        "read": False,
        "createdAt": now,
        "updatedAt": now
    })

    # Emit socket alert to Admin
    await emit_new_order_to_admin({
        "orderId": order_id,
        "_id": str(result.inserted_id),
        "customerName": current_user.get("name"),
        "customerMobile": cust_mobile,
        "itemsCount": len(validated_items),
        "items": serialized_order.get("items", []),
        "grandTotal": grand_total,
        "createdAt": now.isoformat(),
        "orderStatus": "ORDER_PLACED"
    })

    return {
        "success": True,
        "message": "Order Placed Successfully!",
        "order": serialized_order
    }

@router.get("/my-orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cust_id = to_object_id(current_user["_id"])
    cursor = db.orders.find({"customer": cust_id}).sort("createdAt", -1)
    orders = await cursor.to_list(length=200)
    serialized = serialize_doc(orders)

    return {
        "success": True,
        "count": len(serialized),
        "orders": serialized
    }

@router.get("/admin/all")
@router.get("")
async def get_admin_orders(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_admin: dict = Depends(get_current_admin)
):
    db = get_db()
    query = {}

    if status and status != "all":
        if status == "new":
            query["orderStatus"] = "ORDER_PLACED"
        elif status == "accepted":
            query["orderStatus"] = "ORDER_ACCEPTED"
        elif status == "packed":
            query["orderStatus"] = {"$in": ["PACKED", "READY_FOR_PICKUP"]}
        elif status == "completed":
            query["orderStatus"] = "COMPLETED"
        elif status == "rejected":
            query["orderStatus"] = "REJECTED"
        elif status == "cancelled":
            query["orderStatus"] = "CANCELLED"
        else:
            query["orderStatus"] = status

    if search and search.strip():
        s = search.strip()
        query["$or"] = [
            {"orderId": {"$regex": s, "$options": "i"}},
            {"customerName": {"$regex": s, "$options": "i"}},
            {"customerMobile": {"$regex": s, "$options": "i"}}
        ]

    cursor = db.orders.find(query).sort("createdAt", -1)
    orders = await cursor.to_list(length=500)
    serialized = serialize_doc(orders)

    return {
        "success": True,
        "count": len(serialized),
        "orders": serialized
    }

@router.get("/{order_id}")
async def get_order_by_id(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    obj_id = to_object_id(order_id)
    if not obj_id:
        raise HTTPException(status_code=404, detail="Order not found")

    order = await db.orders.find_one({"_id": obj_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Authorization check
    if current_user.get("role") != "admin" and str(order.get("customer")) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "success": True,
        "order": serialize_doc(order)
    }

@router.put("/admin/{order_id}/status")
@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str,
    req: UpdateOrderStatusRequest,
    current_admin: dict = Depends(get_current_admin)
):
    db = get_db()
    obj_id = to_object_id(order_id)
    if not obj_id:
        raise HTTPException(status_code=404, detail="Order not found")

    order = await db.orders.find_one({"_id": obj_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    valid_statuses = [
        "ORDER_PLACED",
        "ORDER_ACCEPTED",
        "PACKED",
        "READY_FOR_PICKUP",
        "COMPLETED",
        "REJECTED",
        "CANCELLED"
    ]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status provided")

    new_status = req.status
    default_note = ""
    notif_title = ""
    notif_message = ""
    notif_type = "ORDER_STATUS"

    ord_str = order.get("orderId", "")

    if new_status == "ORDER_ACCEPTED":
        default_note = "Order accepted by shop owner"
        notif_title = "Order Accepted"
        notif_message = f"Your order {ord_str} has been accepted by the shop."
        notif_type = "ORDER_ACCEPTED"

    elif new_status in ["PACKED", "READY_FOR_PICKUP"]:
        new_status = "PACKED"
        default_note = "Items have been packed and are ready for store pickup"
        notif_title = "Order Ready for Pickup"
        notif_message = f"Your order {ord_str} is packed. Please come to the shop for pickup."
        notif_type = "ORDER_PACKED"

    elif new_status == "COMPLETED":
        default_note = "Order collected by customer and marked completed"
        notif_title = "Order Completed"
        notif_message = f"Your order {ord_str} has been completed successfully. Thank you for shopping with us!"
        notif_type = "ORDER_COMPLETED"

        # Deduct stock inventory if not already deducted
        if not order.get("isStockDeducted", False):
            for item in order.get("items", []):
                prod_obj_id = to_object_id(item.get("product"))
                if prod_obj_id:
                    prod = await db.products.find_one({"_id": prod_obj_id})
                    if prod:
                        variants = prod.get("variants", [])
                        for v in variants:
                            if v.get("unit") == item.get("unit"):
                                qty = item.get("quantity", 0)
                                v["stock"] = max(0, v.get("stock", 0) - qty)
                                threshold = prod.get("lowStockThreshold", 10)
                                if v["stock"] <= threshold:
                                    alert_msg = f"⚠️ Low stock alert: {prod.get('name')} ({v.get('unit')}) has only {v['stock']} left."
                                    await db.notifications.insert_one({
                                        "recipient": None,
                                        "forRole": "admin",
                                        "order": obj_id,
                                        "orderIdStr": ord_str,
                                        "title": "Low Stock Warning",
                                        "message": alert_msg,
                                        "type": "LOW_STOCK",
                                        "read": False,
                                        "createdAt": datetime.utcnow(),
                                        "updatedAt": datetime.utcnow()
                                    })
                                    await emit_low_stock_alert({
                                        "productId": str(prod_obj_id),
                                        "productName": prod.get("name"),
                                        "unit": v.get("unit"),
                                        "remainingStock": v["stock"],
                                        "message": alert_msg
                                    })
                        await db.products.update_one({"_id": prod_obj_id}, {"$set": {"variants": variants}})

    elif new_status == "REJECTED":
        default_note = req.rejectionReason or "Order rejected by shop"
        notif_title = "Order Rejected"
        notif_message = f"Your order {ord_str} could not be accepted. {f'Reason: {req.rejectionReason}' if req.rejectionReason else ''}"
        notif_type = "ORDER_REJECTED"

    elif new_status == "CANCELLED":
        default_note = "Order was cancelled"
        notif_title = "Order Cancelled"
        notif_message = f"Your order {ord_str} has been cancelled."
        notif_type = "ORDER_CANCELLED"

    now = datetime.utcnow()
    status_entry = {
        "status": new_status,
        "timestamp": now,
        "note": req.note or default_note
    }

    updates = {
        "orderStatus": new_status,
        "updatedAt": now
    }
    if new_status == "COMPLETED":
        updates["paymentStatus"] = "PAID"
        updates["isStockDeducted"] = True
    if req.rejectionReason:
        updates["rejectionReason"] = req.rejectionReason

    await db.orders.update_one(
        {"_id": obj_id},
        {
            "$set": updates,
            "$push": {"statusHistory": status_entry}
        }
    )

    updated_order = await db.orders.find_one({"_id": obj_id})
    serialized_order = serialize_doc(updated_order)

    # Insert customer notification
    notif_doc = {
        "recipient": order.get("customer"),
        "forRole": "customer",
        "order": obj_id,
        "orderIdStr": ord_str,
        "title": notif_title,
        "message": notif_message,
        "type": notif_type,
        "read": False,
        "createdAt": now,
        "updatedAt": now
    }
    notif_res = await db.notifications.insert_one(notif_doc)
    notif_doc["_id"] = notif_res.inserted_id
    serialized_notif = serialize_doc(notif_doc)

    cust_id_str = str(order.get("customer"))
    await emit_order_status_update(cust_id_str, serialized_order, serialized_notif)

    return {
        "success": True,
        "message": f"Order status updated to {new_status}",
        "order": serialized_order
    }
