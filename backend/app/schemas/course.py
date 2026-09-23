from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.course import Difficulty
from app.schemas.problem import ProblemListItemResponse


class CourseBase(BaseModel):
    title: str = Field(..., max_length=150)
    slug: str = Field(..., max_length=180, pattern=r"^[a-z0-9-]+$")
    description: str
    thumbnail_url: Optional[str] = None
    difficulty: Difficulty = Difficulty.EASY
    is_published: bool = False


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=150)
    slug: Optional[str] = Field(default=None, max_length=180, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    difficulty: Optional[Difficulty] = None
    is_published: Optional[bool] = None


class CourseResponse(CourseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    total_problems: int = 0
    solved_problems: int = 0
    progress_percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class CourseDetailResponse(CourseResponse):
    problems: List[ProblemListItemResponse] = []
