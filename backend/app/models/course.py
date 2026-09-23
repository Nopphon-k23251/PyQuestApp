import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Difficulty(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(150), nullable=False)
    slug = Column(String(180), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False)
    thumbnail_url = Column(Text, nullable=True)
    difficulty = Column(String(20), nullable=False, default=Difficulty.EASY.value)
    is_published = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    problems = relationship("Problem", back_populates="course", cascade="all, delete-orphan", order_by="Problem.id")
