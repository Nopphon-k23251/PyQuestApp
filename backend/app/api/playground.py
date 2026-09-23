from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user_optional
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.submission import CodeRunResponse
from app.services.judge_service import JudgeService

router = APIRouter(prefix="/playground", tags=["Playground"])


class PlaygroundRunRequest(BaseModel):
    code: str
    input_data: Optional[str] = ""
    timeout_ms: Optional[int] = Field(default=3000, ge=100, le=5000)


@router.post("/run", response_model=ApiResponse[CodeRunResponse])
def run_playground_code(
    payload: PlaygroundRunRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Run arbitrary Python code freely in the sandboxed subprocess environment.
    Supports custom standard input (stdin) with a timeout of up to 5 seconds.
    """
    if not payload.code or not payload.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_CODE", "message": "Code content cannot be empty."},
        )

    judge_service = JudgeService(db)
    timeout = min(payload.timeout_ms or 3000, 5000)

    exec_res = judge_service.run_interactive(
        code=payload.code,
        custom_input=payload.input_data or "",
        timeout_ms=timeout,
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
