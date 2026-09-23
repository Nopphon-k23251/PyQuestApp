import pytest
from app.services.judge_service import SubprocessSandbox, OutputComparator
from app.models.submission import SubmissionStatus


def test_output_comparator_normalization():
    # CRLF and trailing spaces normalization
    text1 = "Hello World   \r\n42 \r\n"
    text2 = "Hello World\n42\n"
    assert OutputComparator.compare(text1, text2) is True

    # Whitespace differences
    assert OutputComparator.compare("100\n", "100") is True
    assert OutputComparator.compare("100\n", "101") is False


def test_sandbox_success_execution():
    code = "a, b = map(int, input().split())\nprint(a + b)"
    res = SubprocessSandbox.execute_code(code=code, input_data="10 20\n", timeout_ms=2000)

    assert res.status == SubmissionStatus.ACCEPTED
    assert res.stdout.strip() == "30"
    assert res.execution_time_ms >= 0


def test_sandbox_runtime_error():
    code = "print(10 / 0)"
    res = SubprocessSandbox.execute_code(code=code, input_data="", timeout_ms=2000)

    assert res.status == SubmissionStatus.RUNTIME_ERROR
    assert "ZeroDivisionError" in res.stderr


def test_sandbox_timeout():
    # Infinite loop
    code = "while True:\n    pass"
    res = SubprocessSandbox.execute_code(code=code, input_data="", timeout_ms=1000)

    assert res.status == SubmissionStatus.TIME_LIMIT
    assert res.error_code == "TIME_LIMIT"
