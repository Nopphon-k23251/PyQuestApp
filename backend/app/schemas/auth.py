from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse


class SyncUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")


class SyncUserData(BaseModel):
    user: UserResponse
