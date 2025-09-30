"""Authentication endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user
from typing import Dict, Any

router = APIRouter()


@router.get("/me")
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user information."""
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "role": current_user["role"]
    }


@router.post("/verify")
async def verify_token(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Verify if the provided token is valid."""
    return {
        "valid": True,
        "user_id": current_user["user_id"],
        "message": "Token is valid"
    }
