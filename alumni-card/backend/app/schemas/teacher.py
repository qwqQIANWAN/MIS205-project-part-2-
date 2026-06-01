from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TeacherSimpleOut(BaseModel):
    id: int
    name: str
    phone: str
    subject: Optional[str] = None
    title: Optional[str] = None
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


class TeacherListItem(TeacherSimpleOut):
    user_id: Optional[int] = None
    pending_count: int = 0
    created_at: Optional[datetime] = None


class TeacherCreate(BaseModel):
    name: str
    phone: str
    subject: Optional[str] = None
    title: Optional[str] = None


class TeacherBindRequest(BaseModel):
    name: str
    phone: str


class TeacherProfileOut(TeacherSimpleOut):
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
