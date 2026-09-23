from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def sync_user(self, firebase_uid: str, email: str, username: str) -> User:
        # Check if user already exists with this firebase_uid
        existing_user = self.user_repo.get_by_firebase_uid(firebase_uid)
        if existing_user:
            # Sync email if changed
            if email and existing_user.email != email:
                existing_user.email = email
                self.user_repo.update(existing_user)
            return existing_user

        # Check if username is already taken
        if self.user_repo.get_by_username(username):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "USER_ALREADY_EXISTS", "message": f"Username '{username}' is already taken."},
            )

        # Check if email is already registered with another account
        if email and self.user_repo.get_by_email(email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "EMAIL_ALREADY_EXISTS", "message": f"Email '{email}' is already in use."},
            )

        # Determine role: check bootstrap admin list
        role = UserRole.USER.value
        if email and email.lower() in [e.lower() for e in settings.ADMIN_EMAILS]:
            role = UserRole.ADMIN.value

        return self.user_repo.create(
            firebase_uid=firebase_uid,
            username=username,
            email=email or f"{username}@example.com",
            role=role,
        )
