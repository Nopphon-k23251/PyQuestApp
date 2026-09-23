import os
import sys
import time
import shutil
import tempfile
import subprocess
from typing import Tuple, List, Optional
from dataclasses import dataclass
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.app_logging import logger
from app.models.submission import Submission, SubmissionStatus
from app.models.problem import Problem
from app.models.test_case import TestCase
from app.models.user_problem_progress import UserProblemProgress


@dataclass
class ExecutionResult:
    status: SubmissionStatus
    stdout: str
    stderr: str
    execution_time_ms: int
    memory_used_mb: Optional[int] = None
    error_code: Optional[str] = None


class OutputComparator:
    @staticmethod
    def normalize(text: str) -> str:
        """
        Normalizes output for fair comparison:
        - Normalizes Windows CRLF to LF
        - Trims trailing spaces on each line
        - Trims leading and trailing empty lines
        """
        if not text:
            return ""
        lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
        trimmed_lines = [line.rstrip() for line in lines]
        normalized = "\n".join(trimmed_lines).strip()
        return normalized

    @classmethod
    def compare(cls, actual: str, expected: str) -> bool:
        return cls.normalize(actual) == cls.normalize(expected)


class SubprocessSandbox:
    MAX_OUTPUT_BYTES = 100 * 1024  # 100 KB limit for output

    @classmethod
    def execute_code(
        cls,
        code: str,
        input_data: str = "",
        timeout_ms: int = 2000,
        memory_limit_mb: int = 128,
    ) -> ExecutionResult:
        """
        Executes Python code in an isolated local subprocess with:
        - Clean environment (scrubbed of host secrets & DB credentials)
        - Python isolated mode (-I -s)
        - Isolated temp folder
        - Enforced timeout limit
        - Output size capping
        """
        timeout_seconds = max(0.5, timeout_ms / 1000.0)
        # Ensure input data ends with newline so Python's input() does not hang
        if input_data and not input_data.endswith("\n"):
            input_data = input_data + "\n"

        # Create isolated temp directory
        temp_dir = tempfile.mkdtemp(prefix="pyquest_sandbox_")
        script_path = os.path.join(temp_dir, "solution.py")

        try:
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(code)

            # Scrub environment variables to prevent access to host credentials
            clean_env = {
                "SYSTEMROOT": os.environ.get("SYSTEMROOT", "C:\\Windows"),
                "PATH": os.environ.get("PATH", ""),
                "PYTHONIOENCODING": "utf-8",
                "PYTHONUTF8": "1",
            }

            python_executable = sys.executable

            start_time = time.perf_counter()

            try:
                # -I runs in isolated mode (ignores PYTHONPATH, PYTHONHOME, and user site-packages)
                # -s disables user site directory
                proc = subprocess.run(
                    [python_executable, "-I", "-s", script_path],
                    input=input_data,
                    text=True,
                    capture_output=True,
                    cwd=temp_dir,
                    env=clean_env,
                    timeout=timeout_seconds,
                )
                duration_ms = int((time.perf_counter() - start_time) * 1000)

                stdout = proc.stdout[:cls.MAX_OUTPUT_BYTES]
                stderr = proc.stderr[:cls.MAX_OUTPUT_BYTES]

                if proc.returncode != 0:
                    # Sanitize paths in stderr for security
                    sanitized_stderr = stderr.replace(script_path, "solution.py").replace(temp_dir, "")
                    return ExecutionResult(
                        status=SubmissionStatus.RUNTIME_ERROR,
                        stdout=stdout,
                        stderr=sanitized_stderr.strip(),
                        execution_time_ms=duration_ms,
                        error_code="RUNTIME_ERROR",
                    )

                return ExecutionResult(
                    status=SubmissionStatus.ACCEPTED,
                    stdout=stdout,
                    stderr=stderr.strip(),
                    execution_time_ms=duration_ms,
                )

            except subprocess.TimeoutExpired:
                duration_ms = int(timeout_seconds * 1000)
                return ExecutionResult(
                    status=SubmissionStatus.TIME_LIMIT,
                    stdout="",
                    stderr=f"Time limit exceeded ({timeout_ms} ms)",
                    execution_time_ms=duration_ms,
                    error_code="TIME_LIMIT",
                )
            except Exception as e:
                logger.error(f"Sandbox execution error: {e}")
                return ExecutionResult(
                    status=SubmissionStatus.SYSTEM_ERROR,
                    stdout="",
                    stderr="System execution error occurred.",
                    execution_time_ms=0,
                    error_code="SYSTEM_ERROR",
                )

        finally:
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception:
                pass


class JudgeService:
    def __init__(self, db: Session):
        self.db = db
        self.sandbox = SubprocessSandbox()
        self.comparator = OutputComparator()

    def run_interactive(self, code: str, custom_input: str = "", timeout_ms: int = 2000) -> ExecutionResult:
        """Run code interactively for quick testing without saving a graded submission."""
        return self.sandbox.execute_code(
            code=code,
            input_data=custom_input or "",
            timeout_ms=timeout_ms,
        )

    def judge_submission(self, submission_id: int) -> Submission:
        """
        Orchestrates full judging of a submission against all test cases.
        Guarantees:
        - Atomic score and progress update
        - Idempotent scoring (points awarded strictly once per problem)
        """
        submission = self.db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission:
            raise ValueError(f"Submission {submission_id} not found")

        problem = self.db.query(Problem).filter(Problem.id == submission.problem_id).first()
        if not problem:
            submission.status = SubmissionStatus.SYSTEM_ERROR.value
            submission.error_code = "PROBLEM_NOT_FOUND"
            self.db.commit()
            return submission

        test_cases = (
            self.db.query(TestCase)
            .filter(TestCase.problem_id == problem.id)
            .order_by(TestCase.id.asc())
            .all()
        )

        if not test_cases:
            # If problem has no test cases configured yet
            submission.status = SubmissionStatus.SYSTEM_ERROR.value
            submission.error_code = "NO_TEST_CASES"
            self.db.commit()
            return submission

        submission.status = SubmissionStatus.RUNNING.value
        self.db.commit()

        total_test_cases = len(test_cases)
        passed_test_cases = 0
        final_status = SubmissionStatus.ACCEPTED
        max_exec_time = 0
        failed_error_code = None

        for tc in test_cases:
            res = self.sandbox.execute_code(
                code=submission.code,
                input_data=tc.input_data or "",
                timeout_ms=problem.time_limit_ms,
                memory_limit_mb=problem.memory_limit_mb,
            )

            max_exec_time = max(max_exec_time, res.execution_time_ms)

            if res.status != SubmissionStatus.ACCEPTED:
                if final_status == SubmissionStatus.ACCEPTED:
                    final_status = res.status
                    failed_error_code = res.error_code
                if res.status == SubmissionStatus.TIME_LIMIT:
                    break
                continue

            # Compare stdout against expected output
            if not self.comparator.compare(res.stdout, tc.expected_output):
                if final_status == SubmissionStatus.ACCEPTED:
                    final_status = SubmissionStatus.WRONG_ANSWER
                    failed_error_code = "WRONG_ANSWER"
                continue

            passed_test_cases += 1

        # Calculate score based on final status
        score = problem.points if final_status == SubmissionStatus.ACCEPTED else 0

        # Atomic transaction: Update submission and progress (§51 & §52)
        try:
            submission.status = final_status.value
            submission.score = score
            submission.execution_time_ms = max_exec_time
            submission.error_code = failed_error_code
            submission.passed_test_cases = passed_test_cases
            submission.total_test_cases = total_test_cases

            if final_status == SubmissionStatus.ACCEPTED:
                # Check or create user progress
                progress = (
                    self.db.query(UserProblemProgress)
                    .filter(
                        UserProblemProgress.user_id == submission.user_id,
                        UserProblemProgress.problem_id == submission.problem_id,
                    )
                    .with_for_update()
                    .first()
                )

                if not progress:
                    progress = UserProblemProgress(
                        user_id=submission.user_id,
                        problem_id=submission.problem_id,
                        solved=True,
                        best_score=problem.points,
                        solved_at=submission.created_at,
                    )
                    self.db.add(progress)
                else:
                    if not progress.solved:
                        progress.solved = True
                        progress.best_score = max(progress.best_score, problem.points)
                        progress.solved_at = submission.created_at

            self.db.commit()
            self.db.refresh(submission)
            return submission

        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to persist judging results: {e}")
            submission.status = SubmissionStatus.SYSTEM_ERROR.value
            self.db.commit()
            return submission
