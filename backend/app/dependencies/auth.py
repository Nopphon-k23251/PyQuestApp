from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_firebase_id_token
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


def get_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> Optional[str]:
    if not credentials or not credentials.credentials:
        return None
    return credentials.credentials


def get_current_user_optional(
    token: Optional[str] = Depends(get_token),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not token:
        return None
    try:
        token_data = verify_firebase_id_token(token)
        uid = token_data.get("uid")
        if not uid:
            return None
        user = db.query(User).filter(User.firebase_uid == uid, User.is_active == True).first()
        return user
    except Exception:
        return None


def get_current_user(
    token: Optional[str] = Depends(get_token),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Missing authentication token"},
        )
    try:
        token_data = verify_firebase_id_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": f"Invalid authentication token: {str(e)}"},
        )

    uid = token_data.get("uid")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Token has no user identifier"},
        )

    user = db.query(User).filter(User.firebase_uid == uid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "USER_NOT_FOUND", "message": "User account not synced with database. Please sync user first."},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "USER_INACTIVE", "message": "User account is deactivated"},
        )

    return user


def require_authenticated_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN.value and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Admin privileges required"},
        )
    return current_user
