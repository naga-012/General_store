from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel, Field
from typing import Optional

from config.database import get_db, serialize_doc, to_object_id
from middleware.auth import (
    verify_password,
    get_password_hash,
    generate_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    name: str
    email: str
    mobile: str
    password: str
    confirmPassword: Optional[str] = None
    address: Optional[str] = ""

class LoginRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    password: str

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    password: Optional[str] = None

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    try:
        name = req.name.strip()
        email = req.email.strip().lower()
        mobile = req.mobile.strip()
        password = req.password
        address = (req.address or "").strip()

        if not name or not email or not mobile or not password:
            raise HTTPException(
                status_code=400,
                detail="Please fill in all required fields (Name, Email, Mobile, Password)"
            )

        if req.confirmPassword and password != req.confirmPassword:
            raise HTTPException(status_code=400, detail="Passwords do not match")

        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

        db = get_db()

        # Check if email exists
        email_exists = await db.users.find_one({"email": email})
        if email_exists:
            raise HTTPException(status_code=400, detail="An account with this email already exists")

        # Check if mobile exists
        mobile_exists = await db.users.find_one({"mobile": mobile})
        if mobile_exists:
            raise HTTPException(status_code=400, detail="An account with this mobile number already exists")

        now = datetime.utcnow()
        hashed_pwd = get_password_hash(password)

        user_doc = {
            "name": name,
            "email": email,
            "mobile": mobile,
            "password": hashed_pwd,
            "address": address,
            "role": "customer",
            "createdAt": now,
            "updatedAt": now
        }

        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)

        return {
            "success": True,
            "message": "Registration Successful",
            "user": {
                "_id": user_id,
                "name": name,
                "email": email,
                "mobile": mobile,
                "address": address,
                "role": "customer"
            },
            "token": generate_token(user_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login")
async def login(req: LoginRequest):
    try:
        identifier = (req.identifier or req.email or req.mobile or "").strip()
        if not identifier or not req.password:
            raise HTTPException(
                status_code=400,
                detail="Please provide Email or Mobile Number and Password"
            )

        db = get_db()
        user = await db.users.find_one({
            "$or": [
                {"email": identifier.lower()},
                {"mobile": identifier}
            ]
        })

        if not user or not verify_password(req.password, user.get("password", "")):
            raise HTTPException(
                status_code=401,
                detail="Invalid email/mobile or password"
            )

        user_id = str(user["_id"])
        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "_id": user_id,
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "mobile": user.get("mobile", ""),
                "address": user.get("address", ""),
                "role": user.get("role", "customer")
            },
            "token": generate_token(user_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/profile")
@router.get("/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "user": current_user
    }

@router.put("/profile")
async def update_profile(
    req: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = to_object_id(current_user["_id"])
    user = await db.users.find_one({"_id": user_id})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_fields = {"updatedAt": datetime.utcnow()}

    if req.name is not None:
        update_fields["name"] = req.name.strip()
    if req.mobile is not None:
        update_fields["mobile"] = req.mobile.strip()
    if req.address is not None:
        update_fields["address"] = req.address.strip()
    if req.password:
        if len(req.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        update_fields["password"] = get_password_hash(req.password)

    await db.users.update_one({"_id": user_id}, {"$set": update_fields})
    updated_user = await db.users.find_one({"_id": user_id})
    updated_user.pop("password", None)
    serialized = serialize_doc(updated_user)

    return {
        "success": True,
        "message": "Profile updated successfully",
        "user": serialized,
        "token": generate_token(str(user_id))
    }
