from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.teacher import TeacherProfileOut


class WechatLoginRequest(BaseModel):
    code: str


class UserInfo(BaseModel):
    id: int
    real_name: Optional[str] = None
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    is_admin: bool = False
    is_registered: bool = False
    is_verified: bool = False
    is_teacher: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WechatLoginResponse(BaseModel):
    token: str
    user: UserInfo


class UserRegisterRequest(BaseModel):
    real_name: str
    phone: str


class UserProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None


class AlumnusInfoOut(BaseModel):
    id: int
    real_name: str
    student_id: str
    id_number: Optional[str] = None
    grade: Optional[str] = None
    graduation_year: Optional[str] = None
    class_name: Optional[str] = None
    current_university: Optional[str] = None
    current_college: Optional[str] = None
    current_major: Optional[str] = None
    certificate_image: Optional[str] = None
    verification_status: str
    verification_remark: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(BaseModel):
    id: int
    openid: str
    real_name: Optional[str] = None
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    is_admin: bool = False
    is_active: bool = True
    is_registered: bool = False
    is_verified: bool = False
    is_teacher: bool = False
    created_at: datetime
    alumni_info: Optional[AlumnusInfoOut] = None
    teacher_profile: Optional[TeacherProfileOut] = None

    model_config = ConfigDict(from_attributes=True)


class AlumniVerifyRequest(BaseModel):
    student_id: Optional[str] = None
    id_number: Optional[str] = None
    grade: Optional[str] = None
    graduation_year: str
    class_name: str
    current_university: str
    current_college: str
    current_major: str
    certificate_image: str
