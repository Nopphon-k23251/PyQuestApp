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
        is_admin_email = bool(email and email.lower() in [e.lower() for e in settings.ADMIN_EMAILS])

        # Check if user already exists with this firebase_uid
        existing_user = self.user_repo.get_by_firebase_uid(firebase_uid)
        if existing_user:
            if email and existing_user.email != email:
                existing_user.email = email
            if is_admin_email and existing_user.role != UserRole.ADMIN.value:
                existing_user.role = UserRole.ADMIN.value
            self.user_repo.update(existing_user)
            return existing_user

        # Check if user already exists by email
        if email:
            existing_by_email = self.user_repo.get_by_email(email)
            if existing_by_email:
                existing_by_email.firebase_uid = firebase_uid
                if is_admin_email and existing_by_email.role != UserRole.ADMIN.value:
                    existing_by_email.role = UserRole.ADMIN.value
                self.user_repo.update(existing_by_email)
                return existing_by_email

        # If username is already taken, append number
        final_username = username
        counter = 1
        while self.user_repo.get_by_username(final_username):
            final_username = f"{username}_{counter}"
            counter += 1

        role = UserRole.ADMIN.value if is_admin_email else UserRole.USER.value

        return self.user_repo.create(
            firebase_uid=firebase_uid,
            username=final_username,
            email=email or f"{final_username}@example.com",
            role=role,
        )

