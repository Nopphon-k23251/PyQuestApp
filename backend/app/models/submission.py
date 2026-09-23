import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class SubmissionStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    ACCEPTED = "ACCEPTED"
    WRONG_ANSWER = "WRONG_ANSWER"
    TIME_LIMIT = "TIME_LIMIT"
    MEMORY_LIMIT = "MEMORY_LIMIT"
    RUNTIME_ERROR = "RUNTIME_ERROR"
    SYNTAX_ERROR = "SYNTAX_ERROR"
    SYSTEM_ERROR = "SYSTEM_ERROR"


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(Text, nullable=False)
    language = Column(String(20), nullable=False, default="PYTHON")
    status = Column(String(30), nullable=False, default=SubmissionStatus.PENDING.value, index=True)
    score = Column(Integer, nullable=False, default=0)
    execution_time_ms = Column(Integer, nullable=True)
    memory_used_mb = Column(Integer, nullable=True)
    error_code = Column(String(50), nullable=True)
    passed_test_cases = Column(Integer, nullable=False, default=0)
    total_test_cases = Column(Integer, nullable=False, default=0)
    stderr = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        Index("ix_submissions_user_created", "user_id", "created_at"),
        Index("ix_submissions_problem_created", "problem_id", "created_at"),
    )

    # Relationships
    user = relationship("User", back_populates="submissions")
    problem = relationship("Problem", back_populates="submissions")
