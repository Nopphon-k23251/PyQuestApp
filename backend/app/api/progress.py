from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_authenticated_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.progress import UserProgressResponse
from app.services.progress_service import ProgressService

router = APIRouter(prefix="/me", tags=["Progress"])


@router.get("/progress", response_model=ApiResponse[UserProgressResponse])
def get_my_overall_progress(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    progress_service = ProgressService(db)
    progress = progress_service.get_user_progress(user_id=current_user.id)
    return ApiResponse(success=True, data=progress)
