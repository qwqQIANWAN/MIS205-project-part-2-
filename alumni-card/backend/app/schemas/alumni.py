from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AlumnusListItem(BaseModel):
    id: int
    user_id: int
    real_name: str
    student_id: str
    class_name: Optional[str] = None
    graduation_year: Optional[str] = None
    current_university: Optional[str] = None
    current_college: Optional[str] = None
    current_major: Optional[str] = None
    verification_status: str
    verified_at: Optional[datetime] = None
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AlumnusDetailOut(AlumnusListItem):
    id_number: Optional[str] = None
    certificate_image: Optional[str] = None
    verification_remark: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class VerifyRequest(BaseModel):
    action: str
    remark: Optional[str] = None
