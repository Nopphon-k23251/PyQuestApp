import pytest
from app.core.seed_thai_problems import seed_thai_problems
from app.models.course import Course
from app.models.problem import Problem
from app.models.test_case import TestCase
from app.models.submission import SubmissionStatus


def test_thai_problems_seeding_and_retrieval(client, db_session):
    # Seed Thai problems into test db
    course1 = Course(
        title="Python Fundamentals",
        slug="python-fundamentals",
        description="Desc",
        difficulty="EASY",
        is_published=True,
    )
    course2 = Course(
        title="Control Flow & Logic",
        slug="control-flow-and-logic",
        description="Desc",
        difficulty="EASY",
        is_published=True,
    )
    course3 = Course(
        title="Data Structures in Python",
        slug="data-structures-in-python",
        description="Desc",
        difficulty="MEDIUM",
        is_published=True,
    )
    db_session.add_all([course1, course2, course3])
    db_session.commit()

    # Run seeder
    seed_thai_problems(db=db_session)

    # Query problems
    all_problems = db_session.query(Problem).all()
    assert len(all_problems) >= 10

    # Check Grade Calculator problem
    grade_prob = db_session.query(Problem).filter(Problem.slug == "grade-calculator").first()
    assert grade_prob is not None
    assert "ตัดเกรด" in grade_prob.title
    assert grade_prob.points == 10

    # Ensure hidden test cases exist
    tcs = db_session.query(TestCase).filter(TestCase.problem_id == grade_prob.id).all()
    sample_tcs = [tc for tc in tcs if not tc.is_hidden]
    hidden_tcs = [tc for tc in tcs if tc.is_hidden]
    assert len(sample_tcs) >= 2
    assert len(hidden_tcs) >= 4

    # Verify public API hides hidden test cases
    res = client.get(f"/api/problems/{grade_prob.id}")
    assert res.status_code == 200
    prob_data = res.json()["data"]
    assert "ตัดเกรด" in prob_data["title"]
    assert len(prob_data["sample_test_cases"]) == len(sample_tcs)


def test_grade_calculator_submission_verdict(client, db_session):
    # Setup courses and problems in test db
    course2 = Course(
        title="Control Flow & Logic",
        slug="control-flow-and-logic",
        description="Desc",
        difficulty="EASY",
        is_published=True,
    )
    db_session.add(course2)
    db_session.commit()
    seed_thai_problems(db=db_session)

    # Sync a student user
    headers = {"Authorization": "Bearer dev_student_token"}
    client.post("/api/auth/sync", headers=headers, json={"username": "thaistudent"})

    grade_prob = db_session.query(Problem).filter(Problem.slug == "grade-calculator").first()
    assert grade_prob is not None

    # Correct solution for Grade Calculator
    correct_solution = """
import sys

def main():
    score = int(input().strip())
    if score >= 80:
        print("A")
    elif score >= 70:
        print("B")
    elif score >= 60:
        print("C")
    elif score >= 50:
        print("D")
    else:
        print("F")

if __name__ == '__main__':
    main()
"""

    sub_res = client.post(
        f"/api/problems/{grade_prob.id}/submit",
        headers=headers,
        json={"code": correct_solution},
    )
    assert sub_res.status_code == 200
    sub_data = sub_res.json()["data"]
    sub_id = sub_data["submission_id"]

    # Check judged verdict
    status_res = client.get(f"/api/submissions/{sub_id}", headers=headers)
    assert status_res.status_code == 200
    judged = status_res.json()["data"]
    assert judged["status"] == SubmissionStatus.ACCEPTED.value
    assert judged["score"] == grade_prob.points

    # Check user progress reflects points
    prog_res = client.get("/api/me/progress", headers=headers)
    assert prog_res.status_code == 200
    prog_data = prog_res.json()["data"]
    assert prog_data["solved_problems"] >= 1
    assert prog_data["total_points"] >= 10


def test_all_eight_modules_seeded(client, db_session):
    seed_thai_problems(db=db_session)
    unified = db_session.query(Course).filter(Course.slug == "python-fundamentals").first()
    assert unified is not None
    assert "แบบฝึกหัดเขียนโปรแกรมภาษา Python" in unified.title

    # Verify problem count across all modules under this single course
    problems = db_session.query(Problem).filter(Problem.course_id == unified.id).all()
    assert len(problems) >= 30

    # Verify API get_course returns problems in ordered sequence with topics
    res = client.get(f"/api/courses/{unified.id}")
    assert res.status_code == 200
    course_data = res.json()["data"]
    res_probs = course_data["problems"]
    assert len(res_probs) >= 30
    assert res_probs[0]["slug"] == "calculate-sum"
    assert res_probs[0]["topic"] == "พื้นฐานและตัวแปร"
    assert res_probs[-1]["slug"] == "student-ranking"
    assert res_probs[-1]["topic"] == "แบบฝึกหัดทบทวนและโจทย์ประยุกต์"
