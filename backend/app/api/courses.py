from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user_optional, require_authenticated_user
from app.models.user import User
from app.models.course import Difficulty
from app.schemas.common import ApiResponse, PaginatedResponse
from app.schemas.course import CourseResponse, CourseDetailResponse
from app.schemas.progress import CourseProgressResponse
from app.services.course_service import CourseService
from app.services.progress_service import ProgressService

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("", response_model=ApiResponse[PaginatedResponse[CourseResponse]])
def get_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    difficulty: Optional[Difficulty] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    course_service = CourseService(db)
    items, total = course_service.list_courses(
        page=page,
        page_size=page_size,
        difficulty=difficulty,
        current_user=current_user,
        published_only=True,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return ApiResponse(
        success=True,
        data=PaginatedResponse[CourseResponse](
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


@router.get("/{course_id}", response_model=ApiResponse[CourseDetailResponse])
def get_course_detail(
    course_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    course_service = CourseService(db)
    detail = course_service.get_course(
        course_id=course_id,
        current_user=current_user,
        published_only=True,
    )
    return ApiResponse(success=True, data=detail)


@router.get("/{course_id}/progress", response_model=ApiResponse[CourseProgressResponse])
def get_course_progress(
    course_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    progress_service = ProgressService(db)
    progress = progress_service.get_course_progress(
        user_id=current_user.id,
        course_id=course_id,
    )
    return ApiResponse(success=True, data=progress)
