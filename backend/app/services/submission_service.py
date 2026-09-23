from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.problem import Problem
from app.models.submission import Submission, SubmissionStatus
from app.schemas.submission import SubmissionResponse
from app.services.judge_service import JudgeService


class SubmissionService:
    def __init__(self, db: Session):
        self.db = db
        self.judge = JudgeService(db)

    def submit_solution(self, user: User, problem_id: int, code: str) -> Submission:
        if not code or not code.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "EMPTY_CODE", "message": "Submission code cannot be empty."},
            )

        problem = self.db.query(Problem).filter(Problem.id == problem_id).first()
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "PROBLEM_NOT_FOUND", "message": "Problem not found."},
            )

        if not problem.is_published and user.role != UserRole.ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "PROBLEM_NOT_FOUND", "message": "Problem is not published."},
            )

        submission = Submission(
            user_id=user.id,
            problem_id=problem.id,
            code=code,
            language="PYTHON",
            status=SubmissionStatus.PENDING.value,
            score=0,
        )
        self.db.add(submission)
        self.db.commit()
        self.db.refresh(submission)

        # Judge submission
        judged = self.judge.judge_submission(submission.id)
        return judged

    def get_submission(self, submission_id: int, user: User) -> SubmissionResponse:
        submission = self.db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "SUBMISSION_NOT_FOUND", "message": "Submission not found."},
            )

        if submission.user_id != user.id and user.role != UserRole.ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": "You can only view your own submissions."},
            )

        problem = self.db.query(Problem).filter(Problem.id == submission.problem_id).first()
        prob_title = problem.title if problem else None

        return SubmissionResponse(
            id=submission.id,
            user_id=submission.user_id,
            problem_id=submission.problem_id,
            problem_title=prob_title,
            language=submission.language,
            status=submission.status,
            score=submission.score,
            execution_time_ms=submission.execution_time_ms,
            memory_used_mb=submission.memory_used_mb,
            error_code=submission.error_code,
            code=submission.code,
            passed_test_cases=submission.passed_test_cases or 0,
            total_test_cases=submission.total_test_cases or 0,
            stderr=submission.stderr,
            created_at=submission.created_at,
        )

    def list_user_submissions(
        self,
        user_id: int,
        problem_id: Optional[int] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[SubmissionResponse], int]:
        query = self.db.query(Submission).filter(Submission.user_id == user_id)
        if problem_id:
            query = query.filter(Submission.problem_id == problem_id)
        if status_filter:
            query = query.filter(Submission.status == status_filter)

        total = query.count()
        submissions = (
            query.order_by(Submission.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        items = []
        for s in submissions:
            prob = self.db.query(Problem).filter(Problem.id == s.problem_id).first()
            items.append(
                SubmissionResponse(
                    id=s.id,
                    user_id=s.user_id,
                    problem_id=s.problem_id,
                    problem_title=prob.title if prob else None,
                    language=s.language,
                    status=s.status,
                    score=s.score,
                    execution_time_ms=s.execution_time_ms,
                    memory_used_mb=s.memory_used_mb,
                    error_code=s.error_code,
                    code=s.code,
                    passed_test_cases=s.passed_test_cases or 0,
                    total_test_cases=s.total_test_cases or 0,
                    stderr=s.stderr,
                    created_at=s.created_at,
                )
            )

        return items, total

    def list_admin_submissions(
        self,
        problem_id: Optional[int] = None,
        user_id: Optional[int] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[SubmissionResponse], int]:
        query = self.db.query(Submission)
        if problem_id:
            query = query.filter(Submission.problem_id == problem_id)
        if user_id:
            query = query.filter(Submission.user_id == user_id)
        if status_filter:
            query = query.filter(Submission.status == status_filter)

        total = query.count()
        submissions = (
            query.order_by(Submission.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        items = []
        for s in submissions:
            prob = self.db.query(Problem).filter(Problem.id == s.problem_id).first()
            items.append(
                SubmissionResponse(
                    id=s.id,
                    user_id=s.user_id,
                    problem_id=s.problem_id,
                    problem_title=prob.title if prob else None,
                    language=s.language,
                    status=s.status,
                    score=s.score,
                    execution_time_ms=s.execution_time_ms,
                    memory_used_mb=s.memory_used_mb,
                    error_code=s.error_code,
                    code=s.code,
                    passed_test_cases=s.passed_test_cases or 0,
                    total_test_cases=s.total_test_cases or 0,
                    stderr=s.stderr,
                    created_at=s.created_at,
                )
            )

        return items, total
