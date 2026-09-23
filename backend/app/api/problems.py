from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.dependencies.auth import get_current_user_optional, require_authenticated_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.problem import ProblemResponse
from app.schemas.submission import CodeRunRequest, CodeRunResponse, SubmissionSubmitResponse
from app.schemas.progress import StarResponse
from app.services.problem_service import ProblemService
from app.services.submission_service import SubmissionService
from app.services.progress_service import ProgressService
from app.services.judge_service import JudgeService

router = APIRouter(prefix="/problems", tags=["Problems"])


@router.get("/{problem_id}", response_model=ApiResponse[ProblemResponse])
def get_problem(
    problem_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    problem_service = ProblemService(db)
    problem = problem_service.get_problem(
        problem_id=problem_id,
        current_user=current_user,
        published_only=True,
    )
    return ApiResponse(success=True, data=problem)


@router.post("/{problem_id}/run", response_model=ApiResponse[CodeRunResponse])
def run_code_interactively(
    problem_id: int,
    payload: CodeRunRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    problem_service = ProblemService(db)
    problem = problem_service.get_problem(problem_id, current_user=current_user, published_only=True)

    judge_service = JudgeService(db)
    exec_res = judge_service.run_interactive(
        code=payload.code,
        custom_input=payload.input_data or "",
        timeout_ms=problem.time_limit_ms,
    )

    return ApiResponse(
        success=True,
        data=CodeRunResponse(
            status=exec_res.status,
            stdout=exec_res.stdout,
            stderr=exec_res.stderr,
            execution_time_ms=exec_res.execution_time_ms,
        ),
    )


@router.post("/{problem_id}/submit", response_model=ApiResponse[SubmissionSubmitResponse])
async def submit_code_solution(
    problem_id: int,
    request: Request,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    code_content = ""
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        form = await request.form()
        uploaded_file = form.get("file")
        if not uploaded_file or not isinstance(uploaded_file, UploadFile):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_FILE", "message": "No file uploaded."},
            )

        filename = uploaded_file.filename or ""
        if not filename.endswith(".py"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_FILE", "message": "Only .py files are supported."},
            )

        content = await uploaded_file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail={"code": "FILE_TOO_LARGE", "message": f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_BYTES} bytes."},
            )

        try:
            code_content = content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_ENCODING", "message": "File must be valid UTF-8 text."},
            )
    else:
        # JSON body
        try:
            body = await request.json()
            code_content = body.get("code", "")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "VALIDATION_ERROR", "message": "Invalid JSON request body."},
            )

    if not code_content or not code_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_CODE", "message": "Code content cannot be empty."},
        )

    submission_service = SubmissionService(db)
    submission = submission_service.submit_solution(
        user=current_user,
        problem_id=problem_id,
        code=code_content,
    )

    return ApiResponse(
        success=True,
        data=SubmissionSubmitResponse(
            submission_id=submission.id,
            status=submission.status,
            passed_test_cases=submission.passed_test_cases or 0,
            total_test_cases=submission.total_test_cases or 0,
        ),
    )


@router.post("/{problem_id}/star", response_model=ApiResponse[StarResponse])
def star_problem(
    problem_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    progress_service = ProgressService(db)
    res = progress_service.star_problem(user_id=current_user.id, problem_id=problem_id)
    return ApiResponse(success=True, data=res)


@router.delete("/{problem_id}/star", response_model=ApiResponse[StarResponse])
def unstar_problem(
    problem_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    progress_service = ProgressService(db)
    res = progress_service.unstar_problem(user_id=current_user.id, problem_id=problem_id)
    return ApiResponse(success=True, data=res)
