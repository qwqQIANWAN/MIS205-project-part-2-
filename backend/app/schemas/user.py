from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class WechatLoginRequest(BaseModel):
    code: str


class UserInfo(BaseModel):
    id: int
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    is_admin: bool = False
    is_verified: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WechatLoginResponse(BaseModel):
    token: str
    user: UserInfo


class UserProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None


class AlumnusInfoOut(BaseModel):
    id: int
    real_name: str
    student_id: str
    id_number: Optional[str] = None
    department: Optional[str] = None
    major: Optional[str] = None
    grade: Optional[str] = None
    graduation_year: Optional[str] = None
    education: Optional[str] = None
    certificate_image: Optional[str] = None
    verification_status: str
    verification_remark: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(BaseModel):
    id: int
    openid: str
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    is_admin: bool = False
    is_active: bool = True
    created_at: datetime
    alumni_info: Optional[AlumnusInfoOut] = None

    model_config = ConfigDict(from_attributes=True)


class AlumniVerifyRequest(BaseModel):
    real_name: str
    student_id: str
    id_number: Optional[str] = None
    department: Optional[str] = None
    major: Optional[str] = None
    grade: Optional[str] = None
    graduation_year: Optional[str] = None
    education: Optional[str] = None
    certificate_image: Optional[str] = None
