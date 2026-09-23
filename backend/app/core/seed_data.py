import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.course import Course, Difficulty
from app.models.problem import Problem
from app.models.test_case import TestCase
from app.core.app_logging import logger


def seed_database():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Course).count() > 0:
            logger.info("Database already seeded. Skipping.")
            return

        logger.info("Seeding initial data...")

        # 1. Admin & Test Users
        admin_user = User(
            firebase_uid="dev_admin_uid_001",
            username="admin",
            email="admin@pyquest.com",
            role=UserRole.ADMIN.value,
            is_active=True,
        )
        student_user = User(
            firebase_uid="dev_user_uid_001",
            username="student",
            email="student@pyquest.com",
            role=UserRole.USER.value,
            is_active=True,
        )
        db.add_all([admin_user, student_user])
        db.flush()

        # 2. Courses
        course1 = Course(
            title="Python Fundamentals",
            slug="python-fundamentals",
            description="Master basic Python syntax, arithmetic operations, variables, and input/output processing.",
            difficulty=Difficulty.EASY.value,
            is_published=True,
        )
        course2 = Course(
            title="Control Flow & Logic",
            slug="control-flow-and-logic",
            description="Learn how to make decisions using if-else conditions, loops, and boolean logic in Python.",
            difficulty=Difficulty.EASY.value,
            is_published=True,
        )
        course3 = Course(
            title="Data Structures in Python",
            slug="data-structures-in-python",
            description="Explore lists, dictionaries, sets, tuples, and common data manipulation techniques.",
            difficulty=Difficulty.MEDIUM.value,
            is_published=True,
        )
        db.add_all([course1, course2, course3])
        db.flush()

        # 3. Problems & Test Cases for Course 1
        p1 = Problem(
            course_id=course1.id,
            title="Calculate Sum",
            slug="calculate-sum",
            description="Write a Python program that reads two integers from standard input and prints their sum.",
            input_description="A single line containing two space-separated integers A and B.",
            output_description="Print the integer sum A + B.",
            constraints_text="-10^9 <= A, B <= 10^9",
            difficulty=Difficulty.EASY.value,
            points=10,
            time_limit_ms=1000,
            memory_limit_mb=128,
            is_published=True,
        )
        p2 = Problem(
            course_id=course1.id,
            title="Reverse a String",
            slug="reverse-a-string",
            description="Read a string from standard input and print the string in reverse order.",
            input_description="A single line containing the input text.",
            output_description="The reversed string.",
            constraints_text="1 <= length(S) <= 1000",
            difficulty=Difficulty.EASY.value,
            points=10,
            time_limit_ms=1000,
            memory_limit_mb=128,
            is_published=True,
        )
        db.add_all([p1, p2])
        db.flush()

        # Test cases for p1
        tc1_sample = TestCase(
            problem_id=p1.id,
            input_data="5 7",
            expected_output="12",
            is_hidden=False,
            points=5,
        )
        tc1_hidden1 = TestCase(
            problem_id=p1.id,
            input_data="-10 25",
            expected_output="15",
            is_hidden=True,
            points=5,
        )
        tc1_hidden2 = TestCase(
            problem_id=p1.id,
            input_data="0 0",
            expected_output="0",
            is_hidden=True,
            points=5,
        )
        db.add_all([tc1_sample, tc1_hidden1, tc1_hidden2])

        # Test cases for p2
        tc2_sample = TestCase(
            problem_id=p2.id,
            input_data="python",
            expected_output="nohtyp",
            is_hidden=False,
            points=5,
        )
        tc2_hidden1 = TestCase(
            problem_id=p2.id,
            input_data="racecar",
            expected_output="racecar",
            is_hidden=True,
            points=5,
        )
        tc2_hidden2 = TestCase(
            problem_id=p2.id,
            input_data="Hello World",
            expected_output="dlroW olleH",
            is_hidden=True,
            points=5,
        )
        db.add_all([tc2_sample, tc2_hidden1, tc2_hidden2])

        # 4. Problems for Course 2
        p3 = Problem(
            course_id=course2.id,
            title="Even or Odd",
            slug="even-or-odd",
            description="Given an integer N, determine whether it is even or odd. Print 'Even' or 'Odd'.",
            input_description="A single integer N.",
            output_description="'Even' if N is even, otherwise 'Odd'.",
            constraints_text="-10^6 <= N <= 10^6",
            difficulty=Difficulty.EASY.value,
            points=10,
            time_limit_ms=1000,
            memory_limit_mb=128,
            is_published=True,
        )
        db.add(p3)
        db.flush()

        tc3_sample = TestCase(
            problem_id=p3.id,
            input_data="4",
            expected_output="Even",
            is_hidden=False,
            points=5,
        )
        tc3_sample2 = TestCase(
            problem_id=p3.id,
            input_data="7",
            expected_output="Odd",
            is_hidden=False,
            points=5,
        )
        tc3_hidden = TestCase(
            problem_id=p3.id,
            input_data="0",
            expected_output="Even",
            is_hidden=True,
            points=5,
        )
        db.add_all([tc3_sample, tc3_sample2, tc3_hidden])

        # 5. Problems for Course 3
        p4 = Problem(
            course_id=course3.id,
            title="Find the Maximum Value",
            slug="find-the-maximum-value",
            description="Given a list of space-separated integers, find and print the maximum value in the list.",
            input_description="A single line containing space-separated integers.",
            output_description="The maximum integer in the list.",
            constraints_text="1 <= number of integers <= 10^5",
            difficulty=Difficulty.MEDIUM.value,
            points=20,
            time_limit_ms=1000,
            memory_limit_mb=128,
            is_published=True,
        )
        db.add(p4)
        db.flush()

        tc4_sample = TestCase(
            problem_id=p4.id,
            input_data="3 7 2 9 5",
            expected_output="9",
            is_hidden=False,
            points=10,
        )
        tc4_hidden = TestCase(
            problem_id=p4.id,
            input_data="-5 -1 -10 -20",
            expected_output="-1",
            is_hidden=True,
            points=10,
        )
        db.add_all([tc4_sample, tc4_hidden])

        db.commit()
        logger.info("Successfully seeded database with users, courses, problems, and test cases.")
        
        # Seed comprehensive Thai problems
        from app.core.seed_thai_problems import seed_thai_problems
        seed_thai_problems()
    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
