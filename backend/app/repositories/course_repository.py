from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.course import Course, Difficulty
from app.models.problem import Problem
from app.models.user_problem_progress import UserProblemProgress


class CourseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, course_id: int, published_only: bool = False) -> Optional[Course]:
        query = self.db.query(Course).filter(Course.id == course_id)
        if published_only:
            query = query.filter(Course.is_published == True)
        return query.first()

    def get_by_slug(self, slug: str) -> Optional[Course]:
        return self.db.query(Course).filter(Course.slug == slug).first()

    def list_courses(
        self,
        page: int = 1,
        page_size: int = 20,
        difficulty: Optional[Difficulty] = None,
        published_only: bool = True,
    ) -> Tuple[List[Course], int]:
        query = self.db.query(Course)
        if published_only:
            query = query.filter(Course.is_published == True)
        if difficulty:
            diff_val = difficulty.value if hasattr(difficulty, 'value') else difficulty
            query = query.filter(
                (Course.difficulty == diff_val) | (Course.slug == "python-fundamentals")
            )

        total = query.count()
        courses = (
            query.order_by(Course.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return courses, total

    def create(self, **kwargs) -> Course:
        course = Course(**kwargs)
        self.db.add(course)
        self.db.commit()
        self.db.refresh(course)
        return course

    def update(self, course: Course, **kwargs) -> Course:
        for key, value in kwargs.items():
            if value is not None:
                setattr(course, key, value)
        self.db.commit()
        self.db.refresh(course)
        return course

    def delete(self, course: Course) -> None:
        self.db.delete(course)
        self.db.commit()

    def get_problem_stats(self, course_id: int, user_id: Optional[int] = None, published_only: bool = True) -> Tuple[int, int]:
        """Returns (total_problems, solved_problems) for a course."""
        prob_query = self.db.query(func.count(Problem.id)).filter(Problem.course_id == course_id)
        if published_only:
            prob_query = prob_query.filter(Problem.is_published == True)
        total_problems = prob_query.scalar() or 0

        solved_problems = 0
        if user_id and total_problems > 0:
            solved_query = (
                self.db.query(func.count(UserProblemProgress.problem_id))
                .join(Problem, UserProblemProgress.problem_id == Problem.id)
                .filter(
                    UserProblemProgress.user_id == user_id,
                    UserProblemProgress.solved == True,
                    Problem.course_id == course_id,
                )
            )
            if published_only:
                solved_query = solved_query.filter(Problem.is_published == True)
            solved_problems = solved_query.scalar() or 0

        return total_problems, solved_problems
