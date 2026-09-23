from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.problem import Problem
from app.models.test_case import TestCase


class ProblemRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, problem_id: int, published_only: bool = False) -> Optional[Problem]:
        query = self.db.query(Problem).filter(Problem.id == problem_id)
        if published_only:
            query = query.filter(Problem.is_published == True)
        return query.first()

    def get_by_course_and_slug(self, course_id: int, slug: str) -> Optional[Problem]:
        return self.db.query(Problem).filter(Problem.course_id == course_id, Problem.slug == slug).first()

    def list_by_course(self, course_id: int, published_only: bool = True) -> List[Problem]:
        query = self.db.query(Problem).filter(Problem.course_id == course_id)
        if published_only:
            query = query.filter(Problem.is_published == True)
        return query.order_by(Problem.id.asc()).all()

    def create(self, **kwargs) -> Problem:
        problem = Problem(**kwargs)
        self.db.add(problem)
        self.db.commit()
        self.db.refresh(problem)
        return problem

    def update(self, problem: Problem, **kwargs) -> Problem:
        for key, value in kwargs.items():
            if value is not None:
                setattr(problem, key, value)
        self.db.commit()
        self.db.refresh(problem)
        return problem

    def delete(self, problem: Problem) -> None:
        self.db.delete(problem)
        self.db.commit()

    # --- Test Case Operations ---
    def get_test_cases(self, problem_id: int, include_hidden: bool = True) -> List[TestCase]:
        query = self.db.query(TestCase).filter(TestCase.problem_id == problem_id)
        if not include_hidden:
            query = query.filter(TestCase.is_hidden == False)
        return query.order_by(TestCase.id.asc()).all()

    def get_test_case_by_id(self, test_case_id: int) -> Optional[TestCase]:
        return self.db.query(TestCase).filter(TestCase.id == test_case_id).first()

    def add_test_case(self, problem_id: int, **kwargs) -> TestCase:
        tc = TestCase(problem_id=problem_id, **kwargs)
        self.db.add(tc)
        self.db.commit()
        self.db.refresh(tc)
        return tc

    def update_test_case(self, test_case: TestCase, **kwargs) -> TestCase:
        for key, value in kwargs.items():
            if value is not None:
                setattr(test_case, key, value)
        self.db.commit()
        self.db.refresh(test_case)
        return test_case

    def delete_test_case(self, test_case: TestCase) -> None:
        self.db.delete(test_case)
        self.db.commit()
