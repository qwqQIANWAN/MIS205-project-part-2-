from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CompanionCreate(BaseModel):
    name: str
    id_number: Optional[str] = None
    phone: Optional[str] = None
    relation: Optional[str] = None


class AppointmentCreate(BaseModel):
    visit_date: date
    purpose: Optional[str] = None
    companions: list[CompanionCreate] = []


class CompanionOut(BaseModel):
    id: int
    name: str
    id_number: Optional[str] = None
    phone: Optional[str] = None
    relation: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AppointmentListItem(BaseModel):
    id: int
    user_id: int
    visit_date: date
    companion_count: int
    purpose: Optional[str] = None
    status: str
    created_at: datetime
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AppointmentDetailOut(BaseModel):
    id: int
    user_id: int
    visit_date: date
    companion_count: int
    purpose: Optional[str] = None
    status: str
    qr_code: Optional[str] = None
    qr_code_expire_at: Optional[datetime] = None
    remark: Optional[str] = None
    reject_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    real_name: Optional[str] = None
    companions: list[CompanionOut] = []

    model_config = ConfigDict(from_attributes=True)


class AppointmentApprove(BaseModel):
    remark: Optional[str] = None
    qr_code_expire_days: int = 1


class AppointmentReject(BaseModel):
    reason: str
