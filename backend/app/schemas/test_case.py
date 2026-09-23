from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class TestCaseBase(BaseModel):
    input_data: str = ""
    expected_output: str
    is_hidden: bool = True
    points: int = Field(default=1, gt=0)


class TestCaseCreate(TestCaseBase):
    pass


class TestCaseUpdate(BaseModel):
    input_data: Optional[str] = None
    expected_output: Optional[str] = None
    is_hidden: Optional[bool] = None
    points: Optional[int] = Field(default=None, gt=0)


class TestCaseResponse(TestCaseBase):
    id: int
    problem_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SampleTestCaseResponse(BaseModel):
    id: int
    input_data: str
    expected_output: str

    model_config = ConfigDict(from_attributes=True)
