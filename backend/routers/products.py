import os
import re
import uuid
import aiofiles
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status, Query, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List, Any

from config.database import get_db, serialize_doc, to_object_id
from middleware.auth import get_current_admin
from services.socket_service import emit_product_change

router = APIRouter(prefix="/api/products", tags=["products"])

class VariantItem(BaseModel):
    unit: str
    price: float
    stock: Optional[int] = 0
    isAvailable: Optional[bool] = True

class ProductCreateRequest(BaseModel):
    name: str
    image: Optional[str] = ""
    category: str
    description: Optional[str] = ""
    variants: List[VariantItem]
    status: Optional[str] = "active"
    isFeatured: Optional[bool] = False
    lowStockThreshold: Optional[int] = 10

class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    image: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    variants: Optional[List[VariantItem]] = None
    status: Optional[str] = None
    isFeatured: Optional[bool] = None
    lowStockThreshold: Optional[int] = None

async def populate_product(product: dict, db) -> dict:
    if not product:
        return product
    p = serialize_doc(product)
    cat_id = product.get("category")
    if cat_id:
        category = await db.categories.find_one({"_id": to_object_id(cat_id)})
        if category:
            p["category"] = {
                "_id": str(category["_id"]),
                "name": category.get("name", ""),
                "slug": category.get("slug", "")
            }

    # Add virtuals
    variants = p.get("variants", [])
    p["totalStock"] = sum(v.get("stock", 0) for v in variants)
    p["minPrice"] = min((v.get("price", 0) for v in variants), default=0)
    return p

@router.get("")
async def get_products(
    keyword: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    minPrice: Optional[float] = Query(None),
    maxPrice: Optional[float] = Query(None),
    inStock: Optional[str] = Query(None),
    sort: Optional[str] = Query(None),
    includeInactive: Optional[str] = Query(None)
):
    db = get_db()
    query = {}

    if includeInactive != "true":
        query["status"] = "active"

    if keyword and keyword.strip():
        k = re.escape(keyword.strip())
        query["$or"] = [
            {"name": {"$regex": k, "$options": "i"}},
            {"description": {"$regex": k, "$options": "i"}}
        ]

    if category and category != "all":
        if re.match(r"^[0-9a-fA-F]{24}$", category):
            query["category"] = to_object_id(category)
        else:
            cat_obj = await db.categories.find_one({
                "$or": [
                    {"slug": category.lower()},
                    {"name": {"$regex": f"^{re.escape(category)}$", "$options": "i"}}
                ]
            })
            if cat_obj:
                query["category"] = cat_obj["_id"]

    if inStock == "true":
        query["variants.stock"] = {"$gt": 0}

    sort_order = [("createdAt", -1)]
    if sort == "price-asc":
        sort_order = [("variants.0.price", 1)]
    elif sort == "price-desc":
        sort_order = [("variants.0.price", -1)]
    elif sort == "popular":
        sort_order = [("isFeatured", -1), ("createdAt", -1)]
    elif sort == "newest":
        sort_order = [("createdAt", -1)]

    cursor = db.products.find(query).sort(sort_order)
    raw_products = await cursor.to_list(length=500)

    # Pre-fetch categories in a single query for maximum speed
    all_cats = await db.categories.find().to_list(length=200)
    cat_map = {
        str(c["_id"]): {
            "_id": str(c["_id"]),
            "name": c.get("name", ""),
            "slug": c.get("slug", "")
        }
        for c in all_cats
    }

    populated_products = []
    for p in raw_products:
        pop = serialize_doc(p)
        cat_id = str(p.get("category", ""))
        if cat_id in cat_map:
            pop["category"] = cat_map[cat_id]

        variants = pop.get("variants", [])
        pop["totalStock"] = sum(v.get("stock", 0) for v in variants)
        pop["minPrice"] = min((v.get("price", 0) for v in variants), default=0)

        if minPrice is not None or maxPrice is not None:
            min_val = minPrice if minPrice is not None else 0
            max_val = maxPrice if maxPrice is not None else float("inf")
            has_match = any(min_val <= v.get("price", 0) <= max_val for v in variants)
            if not has_match:
                continue

        populated_products.append(pop)

    return {
        "success": True,
        "count": len(populated_products),
        "products": populated_products
    }

@router.get("/{product_id}")
async def get_product_by_id(product_id: str):
    db = get_db()
    obj_id = to_object_id(product_id)
    if not obj_id:
        raise HTTPException(status_code=404, detail="Product not found")

    product = await db.products.find_one({"_id": obj_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    pop = await populate_product(product, db)
    return {"success": True, "product": pop}

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_product(
    req: ProductCreateRequest,
    current_admin: dict = Depends(get_current_admin)
):
    name = req.name.strip()
    if not name or not req.category or not req.variants:
        raise HTTPException(
            status_code=400,
            detail="Please provide product name, category, and at least one pricing variant"
        )

    cat_obj_id = to_object_id(req.category)
    if not cat_obj_id:
        raise HTTPException(status_code=400, detail="Invalid category ID")

    for v in req.variants:
        if not v.unit or v.price < 0:
            raise HTTPException(
                status_code=400,
                detail="Each variant must have a valid unit (e.g., 250g, 1kg) and non-negative price"
            )

    now = datetime.utcnow()
    variants_data = [v.dict() for v in req.variants]

    prod_doc = {
        "name": name,
        "image": req.image or "",
        "category": cat_obj_id,
        "description": req.description or "",
        "variants": variants_data,
        "status": req.status or "active",
        "isFeatured": bool(req.isFeatured),
        "lowStockThreshold": req.lowStockThreshold if req.lowStockThreshold is not None else 10,
        "createdAt": now,
        "updatedAt": now
    }

    db = get_db()
    result = await db.products.insert_one(prod_doc)
    prod_doc["_id"] = result.inserted_id

    populated = await populate_product(prod_doc, db)
    await emit_product_change({"type": "create", "product": populated})

    return {
        "success": True,
        "message": "Product created successfully",
        "product": populated
    }

@router.put("/{product_id}")
async def update_product(
    product_id: str,
    req: ProductUpdateRequest,
    current_admin: dict = Depends(get_current_admin)
):
    db = get_db()
    obj_id = to_object_id(product_id)
    if not obj_id:
        raise HTTPException(status_code=404, detail="Product not found")

    product = await db.products.find_one({"_id": obj_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    updates = {"updatedAt": datetime.utcnow()}
    if req.name is not None:
        updates["name"] = req.name.strip()
    if req.image is not None:
        updates["image"] = req.image
    if req.category is not None:
        updates["category"] = to_object_id(req.category)
    if req.description is not None:
        updates["description"] = req.description
    if req.variants is not None and len(req.variants) > 0:
        updates["variants"] = [v.dict() for v in req.variants]
    if req.status is not None:
        updates["status"] = req.status
    if req.isFeatured is not None:
        updates["isFeatured"] = req.isFeatured
    if req.lowStockThreshold is not None:
        updates["lowStockThreshold"] = req.lowStockThreshold

    await db.products.update_one({"_id": obj_id}, {"$set": updates})
    updated = await db.products.find_one({"_id": obj_id})
    populated = await populate_product(updated, db)

    await emit_product_change({"type": "update", "product": populated})

    return {
        "success": True,
        "message": "Product updated successfully",
        "product": populated
    }

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    db = get_db()
    obj_id = to_object_id(product_id)
    if not obj_id:
        raise HTTPException(status_code=404, detail="Product not found")

    result = await db.products.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    await emit_product_change({"type": "delete", "productId": product_id})

    return {
        "success": True,
        "message": "Product removed successfully"
    }

@router.patch("/{product_id}/toggle-status")
async def toggle_product_status(
    product_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    db = get_db()
    obj_id = to_object_id(product_id)
    if not obj_id:
        raise HTTPException(status_code=404, detail="Product not found")

    product = await db.products.find_one({"_id": obj_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_status = "inactive" if product.get("status") == "active" else "active"
    await db.products.update_one({"_id": obj_id}, {"$set": {"status": new_status, "updatedAt": datetime.utcnow()}})
    updated = await db.products.find_one({"_id": obj_id})
    populated = await populate_product(updated, db)

    await emit_product_change({"type": "status_toggle", "product": populated})

    return {
        "success": True,
        "message": f"Product marked as {new_status}",
        "product": populated
    }

@router.post("/upload-image")
async def upload_product_image(
    file: UploadFile = File(...),
    current_admin: dict = Depends(get_current_admin)
):
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] or ".png"
    safe_filename = f"prod-{uuid.uuid4().hex[:12]}{ext}"
    dest_path = os.path.join(uploads_dir, safe_filename)

    async with aiofiles.open(dest_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    return {
        "success": True,
        "message": "Image uploaded successfully",
        "imageUrl": f"/uploads/{safe_filename}"
    }
