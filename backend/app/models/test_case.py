from sqlalchemy import Column, Integer, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class TestCase(Base):
    __tablename__ = "test_cases"
    __test__ = False  # Tells pytest this is an ORM model, not a test suite

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)
    input_data = Column(Text, nullable=False, default="")
    expected_output = Column(Text, nullable=False)
    is_hidden = Column(Boolean, nullable=False, default=True)
    points = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    problem = relationship("Problem", back_populates="test_cases")
