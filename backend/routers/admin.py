from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any

from config.database import get_db, serialize_doc, to_object_id
from middleware.auth import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])

class UpdateSettingsRequest(BaseModel):
    shopName: Optional[str] = None
    tagline: Optional[str] = None
    ownerName: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    logo: Optional[str] = None
    openingTime: Optional[str] = None
    closingTime: Optional[str] = None
    pickupInstructions: Optional[str] = None
    minOrderAmount: Optional[float] = None
    currencySymbol: Optional[str] = None

@router.get("/dashboard-stats")
@router.get("/dashboard")
async def get_dashboard_stats(current_admin: dict = Depends(get_current_admin)):
    db = get_db()
    now = datetime.utcnow()

    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=7)
    month_start = datetime(now.year, now.month, 1)

    products_cursor = db.products.find()
    all_products = await products_cursor.to_list(length=1000)

    orders_cursor = db.orders.find().sort("createdAt", -1)
    all_orders = await orders_cursor.to_list(length=1000)

    total_customers = await db.users.count_documents({"role": "customer"})
    new_customers = await db.users.count_documents({
        "role": "customer",
        "createdAt": {"$gte": week_start}
    })

    # Product metrics
    total_products = len(all_products)
    active_products = 0
    inactive_products = 0
    out_of_stock = 0
    low_stock_list = []

    for p in all_products:
        if p.get("status") == "active":
            active_products += 1
        else:
            inactive_products += 1

        variants = p.get("variants", [])
        total_variant_stock = sum(v.get("stock", 0) for v in variants)
        threshold = p.get("lowStockThreshold", 10)

        if total_variant_stock == 0:
            out_of_stock += 1
        elif total_variant_stock <= threshold:
            low_stock_list.append(serialize_doc(p))

    # Order metrics & sales
    total_sales = 0.0
    today_sales = 0.0
    week_sales = 0.0
    month_sales = 0.0

    new_orders_count = 0
    accepted_orders_count = 0
    packed_orders_count = 0
    ready_pickup_orders_count = 0
    completed_orders_count = 0
    rejected_orders_count = 0
    cancelled_orders_count = 0

    daily_sales_map = {}
    for i in range(6, -1, -1):
        d = now - timedelta(days=i)
        key = d.strftime("%b %d")
        daily_sales_map[key] = {"date": key, "sales": 0.0, "orders": 0}

    product_sales_map = {}

    for order in all_orders:
        status = order.get("orderStatus")
        if status == "ORDER_PLACED":
            new_orders_count += 1
        elif status == "ORDER_ACCEPTED":
            accepted_orders_count += 1
        elif status == "PACKED":
            packed_orders_count += 1
        elif status == "READY_FOR_PICKUP":
            ready_pickup_orders_count += 1
            packed_orders_count += 1
        elif status == "COMPLETED":
            completed_orders_count += 1
        elif status == "REJECTED":
            rejected_orders_count += 1
        elif status == "CANCELLED":
            cancelled_orders_count += 1

        created_at = order.get("createdAt")
        if isinstance(created_at, datetime) and status == "COMPLETED":
            amount = float(order.get("grandTotal", 0.0))
            total_sales += amount
            if created_at >= today_start:
                today_sales += amount
            if created_at >= week_start:
                week_sales += amount
            if created_at >= month_start:
                month_sales += amount

            day_key = created_at.strftime("%b %d")
            if day_key in daily_sales_map:
                daily_sales_map[day_key]["sales"] += amount
                daily_sales_map[day_key]["orders"] += 1

            for item in order.get("items", []):
                item_name = item.get("name", "Product")
                product_sales_map[item_name] = product_sales_map.get(item_name, 0.0) + float(item.get("lineTotal", 0.0))

    daily_sales_chart = list(daily_sales_map.values())
    top_products_chart = [
        {"name": name, "value": val}
        for name, val in sorted(product_sales_map.items(), key=lambda x: x[1], reverse=True)[:6]
    ]

    return {
        "success": True,
        "stats": {
            "totalProducts": total_products,
            "activeProducts": active_products,
            "inactiveProducts": inactive_products,
            "outOfStock": out_of_stock,
            "lowStock": len(low_stock_list),
            "totalOrders": len(all_orders),
            "newOrders": new_orders_count,
            "acceptedOrders": accepted_orders_count,
            "packedOrders": packed_orders_count,
            "readyForPickup": ready_pickup_orders_count,
            "completedOrders": completed_orders_count,
            "rejectedOrders": rejected_orders_count,
            "cancelledOrders": cancelled_orders_count,
            "todaySales": today_sales,
            "weekSales": week_sales,
            "monthSales": month_sales,
            "totalSales": total_sales,
            "totalCustomers": total_customers,
            "newCustomers": new_customers
        },
        "charts": {
            "dailySales": daily_sales_chart,
            "topProducts": top_products_chart
        },
        "lowStockProducts": low_stock_list,
        "recentOrders": serialize_doc(all_orders[:10])
    }

@router.get("/customers")
async def get_customers(current_admin: dict = Depends(get_current_admin)):
    db = get_db()
    cursor = db.users.find({"role": "customer"}, {"password": 0}).sort("createdAt", -1)
    raw_customers = await cursor.to_list(length=500)

    customers_with_stats = []
    for c in raw_customers:
        c_id = c["_id"]
        order_count = await db.orders.count_documents({"customer": c_id})
        completed_orders_cursor = db.orders.find({"customer": c_id, "orderStatus": "COMPLETED"})
        completed_orders = await completed_orders_cursor.to_list(length=500)
        total_spent = sum(o.get("grandTotal", 0.0) for o in completed_orders)

        serialized_c = serialize_doc(c)
        serialized_c["orderCount"] = order_count
        serialized_c["totalSpent"] = total_spent
        customers_with_stats.append(serialized_c)

    return {
        "success": True,
        "count": len(customers_with_stats),
        "customers": customers_with_stats
    }

@router.get("/settings")
async def get_settings():
    db = get_db()
    settings = await db.settings.find_one()
    if not settings:
        default_settings = {
            "shopName": "Manikanta Supermarket",
            "tagline": "Your One-Stop Supermarket for Fresh Groceries & Daily Essentials",
            "ownerName": "Manikanta Store Management",
            "phone": "+91 95730 45430",
            "email": "contact@manikantasupermarket.com",
            "address": "Domalakunta, near govt school, Telangana",
            "logo": "/logo.png",
            "openingTime": "07:00 AM",
            "closingTime": "10:00 PM",
            "pickupInstructions": "Show your Order ID at the pickup counter. Pay by Cash or UPI on collection.",
            "minOrderAmount": 50,
            "currencySymbol": "₹",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        res = await db.settings.insert_one(default_settings)
        default_settings["_id"] = res.inserted_id
        settings = default_settings

    return {
        "success": True,
        "settings": serialize_doc(settings)
    }

@router.put("/settings")
async def update_settings(
    req: UpdateSettingsRequest,
    current_admin: dict = Depends(get_current_admin)
):
    db = get_db()
    updates = {k: v for k, v in req.dict().items() if v is not None}
    updates["updatedAt"] = datetime.utcnow()

    existing = await db.settings.find_one()
    if not existing:
        res = await db.settings.insert_one({**updates, "createdAt": datetime.utcnow()})
        settings = await db.settings.find_one({"_id": res.inserted_id})
    else:
        await db.settings.update_one({"_id": existing["_id"]}, {"$set": updates})
        settings = await db.settings.find_one({"_id": existing["_id"]})

    return {
        "success": True,
        "message": "Shop settings updated successfully",
        "settings": serialize_doc(settings)
    }
