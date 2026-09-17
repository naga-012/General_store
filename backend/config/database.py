import os
import re
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

client = None
db = None

def get_database_name(uri: str) -> str:
    """Extract database name from MongoDB URI if present, else fallback to kirana_store"""
    try:
        # Match ...mongodb.net/dbname?... or ...mongodb.net/dbname
        match = re.search(r'mongodb(?:\+srv)?://[^/]+/([^?/\s]+)', uri)
        if match and match.group(1):
            return match.group(1)
    except Exception:
        pass
    return "kirana_store"

def get_db():
    global client, db
    if db is None:
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/kirana_store")
        client = AsyncIOMotorClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        db_name = get_database_name(mongo_uri)
        db = client[db_name]
    return db

last_db_error = None

async def check_db_connection():
    """Check if MongoDB connection is active and responding, returning (bool, str)"""
    global last_db_error
    try:
        database = get_db()
        await database.command("ping")
        last_db_error = None
        return True, "connected"
    except Exception as e:
        last_db_error = str(e)
        print(f"MongoDB ping failed: {e}")
        return False, str(e)

def serialize_doc(doc):
    """Recursively convert MongoDB document (ObjectId, datetime) to JSON serializable dictionary"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == "_id":
                result["_id"] = str(value)
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, (dict, list)):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc

def to_object_id(val):
    if not val:
        return None
    if isinstance(val, ObjectId):
        return val
    try:
        return ObjectId(str(val))
    except Exception:
        return None
