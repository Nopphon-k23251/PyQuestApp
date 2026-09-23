from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_firebase_id_token
from app.dependencies.auth import get_token, get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.auth import SyncUserRequest, SyncUserData
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/sync", response_model=ApiResponse[SyncUserData])
def sync_user(
    payload: SyncUserRequest,
    token: str = Depends(get_token),
    db: Session = Depends(get_db),
):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Missing Firebase ID token in Authorization header"},
        )

    try:
        token_data = verify_firebase_id_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": f"Token verification failed: {str(e)}"},
        )

    uid = token_data.get("uid")
    email = token_data.get("email", "")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_TOKEN", "message": "Token has no user ID"},
        )

    auth_service = AuthService(db)
    user = auth_service.sync_user(
        firebase_uid=uid,
        email=email,
        username=payload.username,
    )

    return ApiResponse(
        success=True,
        data=SyncUserData(user=UserResponse.model_validate(user)),
    )


@router.get("/me", response_model=ApiResponse[UserResponse])
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
    )
