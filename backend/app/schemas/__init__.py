from app.schemas.common import ApiResponse, ApiError, PaginatedResponse
from app.schemas.user import UserResponse
from app.schemas.auth import SyncUserRequest, SyncUserData
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseDetailResponse
from app.schemas.problem import (
    ProblemCreate,
    ProblemUpdate,
    ProblemResponse,
    ProblemListItemResponse,
    ProblemAdminResponse,
)
from app.schemas.test_case import (
    TestCaseCreate,
    TestCaseUpdate,
    TestCaseResponse,
    SampleTestCaseResponse,
)
from app.schemas.submission import (
    CodeRunRequest,
    CodeRunResponse,
    SubmissionCreate,
    SubmissionSubmitResponse,
    SubmissionResponse,
)
from app.schemas.progress import (
    UserProgressResponse,
    CourseProgressResponse,
    StarResponse,
)

__all__ = [
    "ApiResponse",
    "ApiError",
    "PaginatedResponse",
    "UserResponse",
    "SyncUserRequest",
    "SyncUserData",
    "CourseCreate",
    "CourseUpdate",
    "CourseResponse",
    "CourseDetailResponse",
    "ProblemCreate",
    "ProblemUpdate",
    "ProblemResponse",
    "ProblemListItemResponse",
    "ProblemAdminResponse",
    "TestCaseCreate",
    "TestCaseUpdate",
    "TestCaseResponse",
    "SampleTestCaseResponse",
    "CodeRunRequest",
    "CodeRunResponse",
    "SubmissionCreate",
    "SubmissionSubmitResponse",
    "SubmissionResponse",
    "UserProgressResponse",
    "CourseProgressResponse",
    "StarResponse",
]
