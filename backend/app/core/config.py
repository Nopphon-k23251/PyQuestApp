import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PyQuest - Python Practice Platform"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "pyquest-development-secret-key-change-in-production"
    API_V1_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = "sqlite:///./pyquest.db"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # Firebase Authentication
    FIREBASE_PROJECT_ID: str = "nopphonapp-d0c5b"
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    
    # Dev auth bypass: Allows mock/dev token verification during local testing/dev
    DEV_AUTH_BYPASS: bool = True

    # Judge & Sandbox Execution
    JUDGE_TIMEOUT_MS: int = 2000
    JUDGE_MEMORY_LIMIT_MB: int = 128
    MAX_UPLOAD_SIZE_BYTES: int = 1024 * 1024  # 1 MB

    # Admin Email bootstrap list
    ADMIN_EMAILS: List[str] = ["admin@pyquest.com"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
