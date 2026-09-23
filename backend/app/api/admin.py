from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse
from app.schemas.problem import (
    ProblemCreate,
    ProblemUpdate,
    ProblemAdminResponse,
)
from app.schemas.test_case import (
    TestCaseCreate,
    TestCaseUpdate,
    TestCaseResponse,
)
from app.schemas.submission import SubmissionResponse
from app.services.course_service import CourseService
from app.services.problem_service import ProblemService
from app.services.submission_service import SubmissionService

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


# --- Course Management ---
@router.get("/courses", response_model=ApiResponse[PaginatedResponse[CourseResponse]])
def admin_list_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    course_service = CourseService(db)
    items, total = course_service.list_courses(
        page=page,
        page_size=page_size,
        current_user=admin_user,
        published_only=False,
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


@router.post("/courses", response_model=ApiResponse[CourseResponse], status_code=status.HTTP_201_CREATED)
def admin_create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
):
    course_service = CourseService(db)
    course = course_service.create_course(payload)
    return ApiResponse(
        success=True,
        data=CourseResponse.model_validate(course),
    )


@router.patch("/courses/{course_id}", response_model=ApiResponse[CourseResponse])
def admin_update_course(
    course_id: int,
    payload: CourseUpdate,
    db: Session = Depends(get_db),
):
    course_service = CourseService(db)
    updated = course_service.update_course(course_id, payload)
    return ApiResponse(
        success=True,
        data=CourseResponse.model_validate(updated),
    )


@router.delete("/courses/{course_id}", response_model=ApiResponse[dict])
def admin_delete_course(
    course_id: int,
    db: Session = Depends(get_db),
):
    course_service = CourseService(db)
    course_service.delete_course(course_id)
    return ApiResponse(success=True, data={"message": "Course deleted successfully"})


# --- Problem Management ---
@router.get("/problems", response_model=ApiResponse[List[ProblemAdminResponse]])
def admin_list_problems(
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    problem_service = ProblemService(db)
    problems = problem_service.list_admin_problems(course_id=course_id)
    return ApiResponse(success=True, data=problems)


@router.post("/problems", response_model=ApiResponse[ProblemAdminResponse], status_code=status.HTTP_201_CREATED)
def admin_create_problem(
    payload: ProblemCreate,
    db: Session = Depends(get_db),
):
    problem_service = ProblemService(db)
    problem = problem_service.create_problem(payload)
    return ApiResponse(
        success=True,
        data=ProblemAdminResponse(
            id=problem.id,
            course_id=problem.course_id,
            title=problem.title,
            slug=problem.slug,
            description=problem.description,
            input_description=problem.input_description,
            output_description=problem.output_description,
            constraints_text=problem.constraints_text,
            difficulty=problem.difficulty,
            points=problem.points,
            time_limit_ms=problem.time_limit_ms,
            memory_limit_mb=problem.memory_limit_mb,
            is_published=problem.is_published,
            created_at=problem.created_at,
            updated_at=problem.updated_at,
            test_cases_count=0,
        ),
    )


@router.patch("/problems/{problem_id}", response_model=ApiResponse[ProblemAdminResponse])
def admin_update_problem(
    problem_id: int,
    payload: ProblemUpdate,
    db: Session = Depends(get_db),
):
    problem_service = ProblemService(db)
    updated = problem_service.update_problem(problem_id, payload)
    test_cases = problem_service.get_test_cases_admin(updated.id)
    return ApiResponse(
        success=True,
        data=ProblemAdminResponse(
            id=updated.id,
            course_id=updated.course_id,
            title=updated.title,
            slug=updated.slug,
            description=updated.description,
            input_description=updated.input_description,
            output_description=updated.output_description,
            constraints_text=updated.constraints_text,
            difficulty=updated.difficulty,
            points=updated.points,
            time_limit_ms=updated.time_limit_ms,
            memory_limit_mb=updated.memory_limit_mb,
            is_published=updated.is_published,
            created_at=updated.created_at,
            updated_at=updated.updated_at,
            test_cases_count=len(test_cases),
        ),
    )


@router.delete("/problems/{problem_id}", response_model=ApiResponse[dict])
def admin_delete_problem(
    problem_id: int,
    db: Session = Depends(get_db),
):
    problem_service = ProblemService(db)
    problem_service.delete_problem(problem_id)
    return ApiResponse(success=True, data={"message": "Problem deleted successfully"})


# --- Test Case Management ---
@router.get("/problems/{problem_id}/test-cases", response_model=ApiResponse[List[TestCaseResponse]])
def admin_get_test_cases(
    problem_id: int,
    db: Session = Depends(get_db),
):
    problem_service = ProblemService(db)
    test_cases = problem_service.get_test_cases_admin(problem_id)
    return ApiResponse(success=True, data=test_cases)


@router.post("/problems/{problem_id}/test-cases", response_model=ApiResponse[TestCaseResponse], status_code=status.HTTP_201_CREATED)
def admin_add_test_case(
    problem_id: int,
    payload: TestCaseCreate,
    db: Session = Depends(get_db),
):
    problem_service = ProblemService(db)
    tc = problem_service.add_test_case(problem_id, payload)
    return ApiResponse(success=True, data=tc)


@router.patch("/test-cases/{test_case_id}", response_model=ApiResponse[TestCaseResponse])
def admin_update_test_case(
    test_case_id: int,
    payload: TestCaseUpdate,
    db: Session = Depends(get_db),
):
    problem_service = ProblemService(db)
    tc = problem_service.update_test_case(test_case_id, payload)
    return ApiResponse(success=True, data=tc)


@router.delete("/test-cases/{test_case_id}", response_model=ApiResponse[dict])
def admin_delete_test_case(
    test_case_id: int,
    db: Session = Depends(get_db),
):
    problem_service = ProblemService(db)
    problem_service.delete_test_case(test_case_id)
    return ApiResponse(success=True, data={"message": "Test case deleted successfully"})


# --- Submissions Inspection ---
@router.get("/submissions", response_model=ApiResponse[PaginatedResponse[SubmissionResponse]])
def admin_inspect_submissions(
    problem_id: Optional[int] = None,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    submission_service = SubmissionService(db)
    items, total = submission_service.list_admin_submissions(
        problem_id=problem_id,
        user_id=user_id,
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
