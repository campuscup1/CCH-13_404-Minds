from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any
from app.models.schemas import LoginRequest, TokenResponse, UserProfile
from app.core.security import verify_password, create_access_token
from app.core.auth import get_current_user
from app.data.database import db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest):
    """Authenticate Ambulance Driver or Station Admin and return JWT access token."""
    user = db.get_user_by_username(request.username)
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Token payload
    token_data = {
        "sub": user["id"],
        "username": user["username"],
        "role": user["role"]
    }
    access_token = create_access_token(token_data)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user["role"],
        user_id=user["id"],
        username=user["username"],
        ambulance_id=user.get("ambulance_id"),
        station_id=user.get("station_id")
    )

@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve profile of authenticated user."""
    return UserProfile(
        id=current_user["id"],
        username=current_user["username"],
        name=current_user["name"],
        role=current_user["role"],
        ambulance_id=current_user.get("ambulance_id"),
        station_id=current_user.get("station_id")
    )
