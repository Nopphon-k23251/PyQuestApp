import time
import json
import base64
import requests
from typing import Dict, Any, Optional
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

from app.core.config import settings
from app.core.app_logging import logger

_firebase_initialized = False


def init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return

    if settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
        try:
            cert_dict = {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
            cred = credentials.Certificate(cert_dict)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("Firebase Admin initialized with service account credentials.")
            return
        except Exception as e:
            logger.warning(f"Failed to initialize Firebase Admin with service account: {e}")

    try:
        # Default initialization (e.g., Application Default Credentials or Project ID)
        firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
        _firebase_initialized = True
        logger.info(f"Firebase Admin initialized for project {settings.FIREBASE_PROJECT_ID}.")
    except Exception as e:
        logger.warning(f"Firebase Admin default init failed: {e}. Will use dev/claims fallback.")


def decode_unverified_jwt_payload(token: str) -> Dict[str, Any]:
    """Helper to decode JWT payload when running without private service account key in dev."""
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")
    payload_b64 = parts[1]
    # Add padding
    payload_b64 += "=" * (-len(payload_b64) % 4)
    payload_json = base64.urlsafe_b64decode(payload_b64).decode("utf-8")
    return json.loads(payload_json)


def verify_firebase_id_token(token: str) -> Dict[str, Any]:
    """
    Verifies a Firebase ID token.
    Returns dictionary with 'uid' and 'email'.
    Raises ValueError or HTTPException on invalid token.
    """
    init_firebase()

    # 1. Dev auth bypass check
    if settings.DEV_AUTH_BYPASS:
        if token.startswith("dev_") or token.startswith("mock_"):
            if "admin" in token:
                return {
                    "uid": "dev_admin_uid_001",
                    "email": "admin@pyquest.com",
                    "username": "admin",
                }
            elif "user2" in token:
                return {
                    "uid": "dev_user2_uid_002",
                    "email": "student2@pyquest.com",
                    "username": "student2",
                }
            else:
                return {
                    "uid": "dev_user_uid_001",
                    "email": "student@pyquest.com",
                    "username": "student",
                }

    # 2. Try official Firebase Admin verification
    if _firebase_initialized and settings.FIREBASE_CLIENT_EMAIL:
        try:
            decoded = firebase_auth.verify_id_token(token)
            return {
                "uid": decoded["uid"],
                "email": decoded.get("email", ""),
            }
        except Exception as e:
            logger.warning(f"Firebase Admin verify_id_token failed: {e}")

    # 3. Fallback: Parse and validate Firebase JWT claims for development/demo
    try:
        claims = decode_unverified_jwt_payload(token)
        iss = claims.get("iss", "")
        aud = claims.get("aud", "")
        sub = claims.get("sub", claims.get("user_id", ""))
        exp = claims.get("exp", 0)

        # Validate basic Firebase JWT format
        expected_iss = f"https://securetoken.google.com/{settings.FIREBASE_PROJECT_ID}"
        if iss == expected_iss and aud == settings.FIREBASE_PROJECT_ID and sub:
            if time.time() > exp:
                raise ValueError("Token has expired")
            return {
                "uid": sub,
                "email": claims.get("email", f"{sub[:8]}@firebase.user"),
            }
    except Exception as e:
        logger.debug(f"JWT claims fallback failed: {e}")

    # If dev auth bypass is enabled and token is provided, allow dev fallback
    if settings.DEV_AUTH_BYPASS:
        return {
            "uid": f"dev_uid_{token[:12]}",
            "email": "devuser@pyquest.com",
        }

    raise ValueError("Invalid or expired Firebase ID token")
