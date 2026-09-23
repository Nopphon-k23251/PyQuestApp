from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_authenticated_user
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse
from app.schemas.submission import SubmissionResponse
from app.services.submission_service import SubmissionService

router = APIRouter(tags=["Submissions"])


@router.get("/submissions/{submission_id}", response_model=ApiResponse[SubmissionResponse])
def get_submission_detail(
    submission_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    submission = service.get_submission(submission_id=submission_id, user=current_user)
    return ApiResponse(success=True, data=submission)


@router.get("/me/submissions", response_model=ApiResponse[PaginatedResponse[SubmissionResponse]])
def get_my_submissions(
    problem_id: Optional[int] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    items, total = service.list_user_submissions(
        user_id=current_user.id,
        problem_id=problem_id,
        status_filter=status,
        page=page,
        page_size=page_size,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return ApiResponse(
        success=True,
        data=PaginatedResponse[SubmissionResponse](
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )
