from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.submission import SubmissionStatus


class CodeRunRequest(BaseModel):
    code: str
    input_data: Optional[str] = ""


class CodeRunResponse(BaseModel):
    status: SubmissionStatus
    stdout: str
    stderr: str
    execution_time_ms: int


class SubmissionCreate(BaseModel):
    code: str


class SubmissionSubmitResponse(BaseModel):
    submission_id: int
    status: SubmissionStatus


class SubmissionResponse(BaseModel):
    id: int
    user_id: int
    problem_id: int
    problem_title: Optional[str] = None
    language: str
    status: SubmissionStatus
    score: int
    execution_time_ms: Optional[int] = None
    memory_used_mb: Optional[int] = None
    error_code: Optional[str] = None
    code: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
