import pytest


def test_playground_run_basic(client):
    res = client.post(
        "/api/playground/run",
        json={"code": "print('Hello PyQuest Playground!')"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "ACCEPTED"
    assert data["stdout"].strip() == "Hello PyQuest Playground!"
    assert data["stderr"] == ""
    assert data["execution_time_ms"] >= 0


def test_playground_run_with_stdin(client):
    code = """
name = input().strip()
age = int(input().strip())
print(f"User: {name}, Next Year: {age + 1}")
"""
    res = client.post(
        "/api/playground/run",
        json={"code": code, "input_data": "Alice\n20\n"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "ACCEPTED"
    assert "User: Alice, Next Year: 21" in data["stdout"]


def test_playground_runtime_error(client):
    res = client.post(
        "/api/playground/run",
        json={"code": "print(10 / 0)"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "RUNTIME_ERROR"
    assert "ZeroDivisionError" in data["stderr"]


def test_playground_timeout(client):
    res = client.post(
        "/api/playground/run",
        json={"code": "while True: pass", "timeout_ms": 300},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "TIME_LIMIT"


def test_playground_empty_code(client):
    res = client.post(
        "/api/playground/run",
        json={"code": "   "},
    )
    assert res.status_code == 400
