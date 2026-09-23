from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.course import Difficulty
from app.schemas.test_case import SampleTestCaseResponse


class ProblemBase(BaseModel):
    title: str = Field(..., max_length=200)
    slug: str = Field(..., max_length=220, pattern=r"^[a-z0-9-]+$")
    description: str
    input_description: str
    output_description: str
    constraints_text: Optional[str] = None
    difficulty: Difficulty = Difficulty.EASY
    points: int = Field(default=10, gt=0)
    time_limit_ms: int = Field(default=1000, gt=0)
    memory_limit_mb: int = Field(default=128, gt=0)
    is_published: bool = False


class ProblemCreate(ProblemBase):
    course_id: int


class ProblemUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    slug: Optional[str] = Field(default=None, max_length=220, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    input_description: Optional[str] = None
    output_description: Optional[str] = None
    constraints_text: Optional[str] = None
    difficulty: Optional[Difficulty] = None
    points: Optional[int] = Field(default=None, gt=0)
    time_limit_ms: Optional[int] = Field(default=None, gt=0)
    memory_limit_mb: Optional[int] = Field(default=None, gt=0)
    is_published: Optional[bool] = None


class ProblemListItemResponse(BaseModel):
    id: int
    course_id: int
    title: str
    slug: str
    difficulty: Difficulty
    points: int
    is_published: bool
    is_solved: bool = False
    is_starred: bool = False
    topic: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProblemResponse(ProblemBase):
    id: int
    course_id: int
    created_at: datetime
    updated_at: datetime
    sample_test_cases: List[SampleTestCaseResponse] = []
    is_solved: bool = False
    is_starred: bool = False

    model_config = ConfigDict(from_attributes=True)


class ProblemAdminResponse(ProblemBase):
    id: int
    course_id: int
    created_at: datetime
    updated_at: datetime
    test_cases_count: int = 0

    model_config = ConfigDict(from_attributes=True)
