from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.course import Difficulty


class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(220), nullable=False)
    description = Column(Text, nullable=False)
    input_description = Column(Text, nullable=False)
    output_description = Column(Text, nullable=False)
    constraints_text = Column(Text, nullable=True)
    difficulty = Column(String(20), nullable=False, default=Difficulty.EASY.value)
    points = Column(Integer, nullable=False, default=10)
    time_limit_ms = Column(Integer, nullable=False, default=1000)
    memory_limit_mb = Column(Integer, nullable=False, default=128)
    is_published = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("course_id", "slug", name="uq_course_problem_slug"),
    )

    # Relationships
    course = relationship("Course", back_populates="problems")
    test_cases = relationship("TestCase", back_populates="problem", cascade="all, delete-orphan", order_by="TestCase.id")
    submissions = relationship("Submission", back_populates="problem", cascade="all, delete-orphan")
    stars = relationship("ProblemStar", back_populates="problem", cascade="all, delete-orphan")
    progress = relationship("UserProblemProgress", back_populates="problem", cascade="all, delete-orphan")
