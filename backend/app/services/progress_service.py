from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.problem import Problem
from app.models.problem_star import ProblemStar
from app.models.user_problem_progress import UserProblemProgress
from app.schemas.progress import UserProgressResponse, CourseProgressResponse, StarResponse
from app.repositories.course_repository import CourseRepository


class ProgressService:
    def __init__(self, db: Session):
        self.db = db
        self.course_repo = CourseRepository(db)

    def star_problem(self, user_id: int, problem_id: int) -> StarResponse:
        problem = self.db.query(Problem).filter(Problem.id == problem_id).first()
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "PROBLEM_NOT_FOUND", "message": "Problem not found"},
            )

        existing = (
            self.db.query(ProblemStar)
            .filter(ProblemStar.user_id == user_id, ProblemStar.problem_id == problem_id)
            .first()
        )
        if not existing:
            star = ProblemStar(user_id=user_id, problem_id=problem_id)
            self.db.add(star)
            self.db.commit()

        return StarResponse(problem_id=problem_id, is_starred=True)

    def unstar_problem(self, user_id: int, problem_id: int) -> StarResponse:
        star = (
            self.db.query(ProblemStar)
            .filter(ProblemStar.user_id == user_id, ProblemStar.problem_id == problem_id)
            .first()
        )
        if star:
            self.db.delete(star)
            self.db.commit()

        return StarResponse(problem_id=problem_id, is_starred=False)

    def get_user_progress(self, user_id: int) -> UserProgressResponse:
        # Sum of points for solved problems
        solved_points = (
            self.db.query(func.coalesce(func.sum(Problem.points), 0))
            .join(UserProblemProgress, UserProblemProgress.problem_id == Problem.id)
            .filter(UserProblemProgress.user_id == user_id, UserProblemProgress.solved == True)
            .scalar()
            or 0
        )

        solved_count = (
            self.db.query(func.count(UserProblemProgress.problem_id))
            .filter(UserProblemProgress.user_id == user_id, UserProblemProgress.solved == True)
            .scalar()
            or 0
        )

        starred_count = (
            self.db.query(func.count(ProblemStar.problem_id))
            .filter(ProblemStar.user_id == user_id)
            .scalar()
            or 0
        )

        return UserProgressResponse(
            total_points=int(solved_points),
            solved_problems=int(solved_count),
            starred_problems=int(starred_count),
        )

    def get_course_progress(self, user_id: int, course_id: int) -> CourseProgressResponse:
        course = self.course_repo.get_by_id(course_id, published_only=True)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "COURSE_NOT_FOUND", "message": "Course not found"},
            )

        total_probs, solved_probs = self.course_repo.get_problem_stats(course_id, user_id=user_id, published_only=True)
        percentage = (solved_probs / total_probs * 100.0) if total_probs > 0 else 0.0

        return CourseProgressResponse(
            course_id=course_id,
            total_problems=total_probs,
            solved_problems=solved_probs,
            percentage=round(percentage, 1),
        )
