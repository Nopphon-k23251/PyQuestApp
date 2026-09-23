import pytest
from app.models.user import User, UserRole
from app.models.course import Course, Difficulty
from app.models.problem import Problem
from app.models.test_case import TestCase
from app.models.submission import SubmissionStatus


def test_auth_sync_and_me(client, db_session):
    headers = {"Authorization": "Bearer dev_user_uid_001"}
    sync_res = client.post(
        "/api/auth/sync",
        headers=headers,
        json={"username": "alice"},
    )
    assert sync_res.status_code == 200
    data = sync_res.json()
    assert data["success"] is True
    assert data["data"]["user"]["username"] == "alice"
    assert data["data"]["user"]["role"] == "USER"

    # GET /api/auth/me
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["data"]["username"] == "alice"


def test_problem_privacy_and_submission_lifecycle(client, db_session):
    # Setup test data in DB
    course = Course(
        title="Test Course",
        slug="test-course",
        description="A course for testing",
        difficulty=Difficulty.EASY.value,
        is_published=True,
    )
    db_session.add(course)
    db_session.flush()

    prob = Problem(
        course_id=course.id,
        title="Sum Problem",
        slug="sum-problem",
        description="Calculate A + B",
        input_description="A and B",
        output_description="A + B",
        points=10,
        time_limit_ms=3000,
        memory_limit_mb=128,
        is_published=True,
    )
    db_session.add(prob)
    db_session.flush()

    tc_sample = TestCase(
        problem_id=prob.id,
        input_data="1 2",
        expected_output="3",
        is_hidden=False,
        points=5,
    )
    tc_hidden = TestCase(
        problem_id=prob.id,
        input_data="99 1",
        expected_output="100",
        is_hidden=True,
        points=5,
    )
    db_session.add_all([tc_sample, tc_hidden])
    db_session.commit()

    # 1. GET /api/problems/{id}
    # Verify hidden test case is NOT returned to normal user
    res = client.get(f"/api/problems/{prob.id}")
    assert res.status_code == 200
    prob_data = res.json()["data"]
    assert len(prob_data["sample_test_cases"]) == 1
    assert prob_data["sample_test_cases"][0]["input_data"] == "1 2"
    assert "99 1" not in str(prob_data)

    # 2. Sync user
    user_headers = {"Authorization": "Bearer dev_student_token"}
    client.post("/api/auth/sync", headers=user_headers, json={"username": "bob"})

    # 3. Interactive Code Run: POST /api/problems/{id}/run
    run_res = client.post(
        f"/api/problems/{prob.id}/run",
        headers=user_headers,
        json={"code": "a, b = map(int, input().split())\nprint(a + b)", "input_data": "10 5"},
    )
    assert run_res.status_code == 200
    assert run_res.json()["data"]["stdout"].strip() == "15"

    # 4. Wrong Answer Submission: POST /api/problems/{id}/submit
    wrong_sub_res = client.post(
        f"/api/problems/{prob.id}/submit",
        headers=user_headers,
        json={"code": "print(0)"},
    )
    assert wrong_sub_res.status_code == 200
    assert wrong_sub_res.json()["data"]["status"] == SubmissionStatus.WRONG_ANSWER.value

    # 5. Correct Solution Submission: POST /api/problems/{id}/submit
    correct_sub_res = client.post(
        f"/api/problems/{prob.id}/submit",
        headers=user_headers,
        json={"code": "a, b = map(int, input().split())\nprint(a + b)"},
    )
    assert correct_sub_res.status_code == 200
    assert correct_sub_res.json()["data"]["status"] == SubmissionStatus.ACCEPTED.value

    # 6. Check Progress
    progress_res = client.get("/api/me/progress", headers=user_headers)
    assert progress_res.status_code == 200
    assert progress_res.json()["data"]["total_points"] == 10
    assert progress_res.json()["data"]["solved_problems"] == 1

    # 7. Submit ACCEPTED solution again -> Points must NOT duplicate (idempotency §17 & §51)
    repeat_sub_res = client.post(
        f"/api/problems/{prob.id}/submit",
        headers=user_headers,
        json={"code": "import sys\na, b = map(int, sys.stdin.read().split())\nprint(a + b)"},
    )
    assert repeat_sub_res.status_code == 200
    assert repeat_sub_res.json()["data"]["status"] == SubmissionStatus.ACCEPTED.value

    progress_after = client.get("/api/me/progress", headers=user_headers).json()["data"]
    assert progress_after["total_points"] == 10  # Still 10, not 20!

    # 8. Star problem: POST and DELETE
    star_res = client.post(f"/api/problems/{prob.id}/star", headers=user_headers)
    assert star_res.status_code == 200
    assert star_res.json()["data"]["is_starred"] is True

    unstar_res = client.delete(f"/api/problems/{prob.id}/star", headers=user_headers)
    assert unstar_res.status_code == 200
    assert unstar_res.json()["data"]["is_starred"] is False


def test_admin_rbac_security(client, db_session):
    # Regular user attempting admin endpoint
    user_headers = {"Authorization": "Bearer dev_user_token_001"}
    client.post("/api/auth/sync", headers=user_headers, json={"username": "charlie"})

    forbidden_res = client.post(
        "/api/admin/courses",
        headers=user_headers,
        json={
            "title": "Hacked Course",
            "slug": "hacked-course",
            "description": "Exploit",
            "difficulty": "HARD",
        },
    )
    assert forbidden_res.status_code == 403
    assert forbidden_res.json()["error"]["code"] == "FORBIDDEN"

    # Admin user accessing admin endpoint
    admin_headers = {"Authorization": "Bearer dev_admin_token"}
    client.post("/api/auth/sync", headers=admin_headers, json={"username": "superadmin"})

    admin_res = client.post(
        "/api/admin/courses",
        headers=admin_headers,
        json={
            "title": "Admin Created Course",
            "slug": "admin-created-course",
            "description": "Created legally by admin",
            "difficulty": "EASY",
            "is_published": True,
        },
    )
    assert admin_res.status_code == 201
    assert admin_res.json()["data"]["slug"] == "admin-created-course"
