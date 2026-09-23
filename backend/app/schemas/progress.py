from pydantic import BaseModel


class UserProgressResponse(BaseModel):
    total_points: int
    solved_problems: int
    starred_problems: int


class CourseProgressResponse(BaseModel):
    course_id: int
    total_problems: int
    solved_problems: int
    percentage: float


class StarResponse(BaseModel):
    problem_id: int
    is_starred: bool
