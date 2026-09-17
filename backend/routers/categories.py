import re
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel
from typing import Optional

from config.database import get_db, serialize_doc, to_object_id
from middleware.auth import get_current_admin

router = APIRouter(prefix="/api/categories", tags=["categories"])

class CategoryCreateRequest(BaseModel):
    name: str
    image: Optional[str] = ""
    description: Optional[str] = ""
    status: Optional[str] = "active"

class CategoryUpdateRequest(BaseModel):
    name: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

def generate_slug(name: str) -> str:
    cleaned = re.sub(r'[^a-z0-9]+', '-', name.lower())
    return cleaned.strip('-')

@router.get("")
async def get_categories(includeInactive: Optional[str] = Query(None)):
    db = get_db()
    query = {}
    if includeInactive != "true":
        query["status"] = "active"

    cursor = db.categories.find(query).sort("name", 1)
    categories = await cursor.to_list(length=200)
    serialized = serialize_doc(categories)

    return {
        "success": True,
        "count": len(serialized),
        "categories": serialized
    }

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_category(
    req: CategoryCreateRequest,
    current_admin: dict = Depends(get_current_admin)
):
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required")

    db = get_db()
    # Case insensitive duplicate check
    existing = await db.categories.find_one({
        "name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}
    })
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    now = datetime.utcnow()
    slug = generate_slug(name)

    cat_doc = {
        "name": name,
        "slug": slug,
        "image": req.image or "",
        "description": req.description or "",
        "status": req.status or "active",
        "createdAt": now,
        "updatedAt": now
    }

    result = await db.categories.insert_one(cat_doc)
    cat_doc["_id"] = result.inserted_id

    return {
        "success": True,
        "message": "Category created",
        "category": serialize_doc(cat_doc)
    }

@router.put("/{cat_id}")
async def update_category(
    cat_id: str,
    req: CategoryUpdateRequest,
    current_admin: dict = Depends(get_current_admin)
):
    db = get_db()
    obj_id = to_object_id(cat_id)
    if not obj_id:
        raise HTTPException(status_code=404, detail="Category not found")

    category = await db.categories.find_one({"_id": obj_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    updates = {"updatedAt": datetime.utcnow()}
    if req.name is not None:
        updates["name"] = req.name.strip()
        updates["slug"] = generate_slug(req.name.strip())
    if req.image is not None:
        updates["image"] = req.image
    if req.description is not None:
        updates["description"] = req.description
    if req.status is not None:
        updates["status"] = req.status

    await db.categories.update_one({"_id": obj_id}, {"$set": updates})
    updated = await db.categories.find_one({"_id": obj_id})

    return {
        "success": True,
        "message": "Category updated",
        "category": serialize_doc(updated)
    }

@router.delete("/{cat_id}")
async def delete_category(
    cat_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    db = get_db()
    obj_id = to_object_id(cat_id)
    if not obj_id:
        raise HTTPException(status_code=404, detail="Category not found")

    result = await db.categories.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")

    return {
        "success": True,
        "message": "Category deleted successfully"
    }
