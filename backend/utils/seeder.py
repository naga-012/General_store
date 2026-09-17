import os
import json
import re
from datetime import datetime
from config.database import get_db

def generate_slug(name: str) -> str:
    cleaned = re.sub(r'[^a-z0-9]+', '-', name.lower())
    return cleaned.strip('-')

async def auto_seed_catalog():
    """Seed initial categories, products, and store settings if database is empty"""
    try:
        db = get_db()
        prod_count = await db.products.count_documents({})
        if prod_count > 0:
            return {
                "success": True,
                "message": f"Database already has {prod_count} products. Skipping auto-seed."
            }

        curr_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(curr_dir)

        cats_path = os.path.join(backend_dir, "categories_sample.json")
        prods_path = os.path.join(backend_dir, "products_sample.json")

        if not os.path.exists(cats_path) or not os.path.exists(prods_path):
            print("Seed JSON files not found, skipping.")
            return {"success": False, "message": "Seed data files missing"}

        with open(cats_path, "r", encoding="utf-8") as f:
            categories_data = json.load(f)

        with open(prods_path, "r", encoding="utf-8") as f:
            products_data = json.load(f)

        cat_map = {}
        now = datetime.utcnow()

        # Insert categories
        for cat in categories_data:
            existing = await db.categories.find_one({"name": cat["name"]})
            if existing:
                cat_map[cat["name"]] = existing["_id"]
            else:
                doc = {
                    "name": cat["name"],
                    "slug": generate_slug(cat["name"]),
                    "image": cat.get("image", ""),
                    "description": cat.get("description", ""),
                    "status": "active",
                    "createdAt": now,
                    "updatedAt": now
                }
                res = await db.categories.insert_one(doc)
                cat_map[cat["name"]] = res.inserted_id

        # Insert products
        inserted_prods = 0
        for p in products_data:
            cat_name = p.get("category")
            cat_id = cat_map.get(cat_name)
            if not cat_id:
                # Fallback to first category if not matched
                cat_id = list(cat_map.values())[0] if cat_map else None

            prod_doc = {
                "name": p["name"],
                "category": str(cat_id) if cat_id else "",
                "description": p.get("description", ""),
                "image": p.get("image", ""),
                "brand": p.get("brand", ""),
                "tags": p.get("tags", []),
                "isFeatured": p.get("isFeatured", False),
                "variants": p.get("variants", []),
                "status": "active",
                "lowStockThreshold": 10,
                "createdAt": now,
                "updatedAt": now
            }
            await db.products.insert_one(prod_doc)
            inserted_prods += 1

        # Seed default store settings if not present
        existing_setting = await db.settings.find_one()
        if not existing_setting:
            await db.settings.insert_one({
                "shopName": "Manikanta Supermarket",
                "tagline": "Your Trusted Neighborhood Supermarket - Groceries, Dairy, Staples, Care & Essentials",
                "phone": "+91 95730 45430",
                "whatsapp": "+91 95730 45430",
                "email": "contact@manikantasupermarket.com",
                "address": "Domalakunta, near govt school, Telangana",
                "openingTime": "07:00 AM",
                "closingTime": "10:00 PM",
                "isOpen": True,
                "pickupInstructions": "Show your Order ID at the Express Counter for quick packed pickup in 2 minutes!",
                "minOrderAmount": 20,
                "createdAt": now,
                "updatedAt": now
            })

        print(f"Auto-seed completed: {len(categories_data)} categories, {inserted_prods} products inserted.")
        return {
            "success": True,
            "message": f"Successfully seeded {len(categories_data)} categories and {inserted_prods} products."
        }
    except Exception as e:
        print(f"Auto-seed error: {e}")
        return {"success": False, "error": str(e)}
