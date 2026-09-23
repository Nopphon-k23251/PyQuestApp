from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.problem import Problem
from app.models.test_case import TestCase
from app.models.problem_star import ProblemStar
from app.models.user_problem_progress import UserProblemProgress
from app.schemas.problem import (
    ProblemCreate,
    ProblemUpdate,
    ProblemResponse,
    ProblemAdminResponse,
)
from app.schemas.test_case import (
    TestCaseCreate,
    TestCaseUpdate,
    TestCaseResponse,
    SampleTestCaseResponse,
)
from app.repositories.problem_repository import ProblemRepository
from app.repositories.course_repository import CourseRepository


class ProblemService:
    def __init__(self, db: Session):
        self.db = db
        self.problem_repo = ProblemRepository(db)
        self.course_repo = CourseRepository(db)

    def get_problem(self, problem_id: int, current_user: Optional[User] = None, published_only: bool = True) -> ProblemResponse:
        problem = self.problem_repo.get_by_id(problem_id, published_only=published_only)
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "PROBLEM_NOT_FOUND", "message": "Problem not found"},
            )

        # Fetch only non-hidden sample test cases for normal user view
        sample_cases = self.problem_repo.get_test_cases(problem.id, include_hidden=False)
        sample_responses = [
            SampleTestCaseResponse(
                id=tc.id,
                input_data=tc.input_data,
                expected_output=tc.expected_output,
            )
            for tc in sample_cases
        ]

        is_solved = False
        is_starred = False
        if current_user:
            progress = (
                self.db.query(UserProblemProgress)
                .filter(UserProblemProgress.user_id == current_user.id, UserProblemProgress.problem_id == problem.id)
                .first()
            )
            if progress and progress.solved:
                is_solved = True

            star = (
                self.db.query(ProblemStar)
                .filter(ProblemStar.user_id == current_user.id, ProblemStar.problem_id == problem.id)
                .first()
            )
            if star:
                is_starred = True

        return ProblemResponse(
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
            sample_test_cases=sample_responses,
            is_solved=is_solved,
            is_starred=is_starred,
        )

    def list_admin_problems(self, course_id: Optional[int] = None) -> List[ProblemAdminResponse]:
        query = self.db.query(Problem)
        if course_id:
            query = query.filter(Problem.course_id == course_id)
        problems = query.order_by(Problem.created_at.desc()).all()

        results = []
        for p in problems:
            tc_count = self.db.query(func.count(TestCase.id)).filter(TestCase.problem_id == p.id).scalar() or 0
            results.append(
                ProblemAdminResponse(
                    id=p.id,
                    course_id=p.course_id,
                    title=p.title,
                    slug=p.slug,
                    description=p.description,
                    input_description=p.input_description,
                    output_description=p.output_description,
                    constraints_text=p.constraints_text,
                    difficulty=p.difficulty,
                    points=p.points,
                    time_limit_ms=p.time_limit_ms,
                    memory_limit_mb=p.memory_limit_mb,
                    is_published=p.is_published,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                    test_cases_count=tc_count,
                )
            )
        return results

    def create_problem(self, data: ProblemCreate) -> Problem:
        course = self.course_repo.get_by_id(data.course_id, published_only=False)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "COURSE_NOT_FOUND", "message": f"Course ID {data.course_id} not found"},
            )

        existing = self.problem_repo.get_by_course_and_slug(data.course_id, data.slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "PROBLEM_SLUG_EXISTS",
                    "message": f"Problem with slug '{data.slug}' already exists in this course.",
                },
            )

        return self.problem_repo.create(
            course_id=data.course_id,
            title=data.title,
            slug=data.slug,
            description=data.description,
            input_description=data.input_description,
            output_description=data.output_description,
            constraints_text=data.constraints_text,
            difficulty=data.difficulty.value if hasattr(data.difficulty, 'value') else data.difficulty,
            points=data.points,
            time_limit_ms=data.time_limit_ms,
            memory_limit_mb=data.memory_limit_mb,
            is_published=data.is_published,
        )

    def update_problem(self, problem_id: int, data: ProblemUpdate) -> Problem:
        problem = self.problem_repo.get_by_id(problem_id, published_only=False)
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "PROBLEM_NOT_FOUND", "message": "Problem not found"},
            )

        if data.slug and data.slug != problem.slug:
            existing = self.problem_repo.get_by_course_and_slug(problem.course_id, data.slug)
            if existing and existing.id != problem.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "PROBLEM_SLUG_EXISTS",
                        "message": f"Problem with slug '{data.slug}' already exists in this course.",
                    },
                )

        update_dict = data.model_dump(exclude_unset=True)
        if "difficulty" in update_dict and hasattr(update_dict["difficulty"], 'value'):
            update_dict["difficulty"] = update_dict["difficulty"].value

        return self.problem_repo.update(problem, **update_dict)

    def delete_problem(self, problem_id: int) -> None:
        problem = self.problem_repo.get_by_id(problem_id, published_only=False)
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "PROBLEM_NOT_FOUND", "message": "Problem not found"},
            )
        self.problem_repo.delete(problem)

    # --- Test Case Admin Operations ---
    def get_test_cases_admin(self, problem_id: int) -> List[TestCaseResponse]:
        problem = self.problem_repo.get_by_id(problem_id, published_only=False)
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "PROBLEM_NOT_FOUND", "message": "Problem not found"},
            )
        test_cases = self.problem_repo.get_test_cases(problem_id, include_hidden=True)
        return [TestCaseResponse.model_validate(tc) for tc in test_cases]

    def add_test_case(self, problem_id: int, data: TestCaseCreate) -> TestCaseResponse:
        problem = self.problem_repo.get_by_id(problem_id, published_only=False)
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "PROBLEM_NOT_FOUND", "message": "Problem not found"},
            )
        tc = self.problem_repo.add_test_case(
            problem_id=problem_id,
            input_data=data.input_data,
            expected_output=data.expected_output,
            is_hidden=data.is_hidden,
            points=data.points,
        )
        return TestCaseResponse.model_validate(tc)

    def update_test_case(self, test_case_id: int, data: TestCaseUpdate) -> TestCaseResponse:
        tc = self.problem_repo.get_test_case_by_id(test_case_id)
        if not tc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "TEST_CASE_NOT_FOUND", "message": "Test case not found"},
            )
        updated = self.problem_repo.update_test_case(tc, **data.model_dump(exclude_unset=True))
        return TestCaseResponse.model_validate(updated)

    def delete_test_case(self, test_case_id: int) -> None:
        tc = self.problem_repo.get_test_case_by_id(test_case_id)
        if not tc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "TEST_CASE_NOT_FOUND", "message": "Test case not found"},
            )
        self.problem_repo.delete_test_case(tc)
