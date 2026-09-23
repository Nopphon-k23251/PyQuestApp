from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserProblemProgress(Base):
    __tablename__ = "user_problem_progress"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), primary_key=True)
    solved = Column(Boolean, nullable=False, default=False)
    best_score = Column(Integer, nullable=False, default=0)
    solved_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="progress")
    problem = relationship("Problem", back_populates="progress")
