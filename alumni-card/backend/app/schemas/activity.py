from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ActivityBase(BaseModel):
    title: str
    cover_image: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime
    signup_deadline: Optional[datetime] = None
    max_participants: Optional[int] = None
    organizer: Optional[str] = None
    contact_phone: Optional[str] = None
    is_published: bool = False


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    cover_image: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    signup_deadline: Optional[datetime] = None
    max_participants: Optional[int] = None
    status: Optional[str] = None
    organizer: Optional[str] = None
    contact_phone: Optional[str] = None
    is_published: Optional[bool] = None


class ActivityListItem(BaseModel):
    id: int
    title: str
    cover_image: Optional[str] = None
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime
    signup_deadline: Optional[datetime] = None
    max_participants: Optional[int] = None
    current_participants: int = 0
    status: str
    organizer: Optional[str] = None
    is_published: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityDetailOut(ActivityListItem):
    description: Optional[str] = None
    contact_phone: Optional[str] = None
    updated_at: Optional[datetime] = None
    is_registered: bool = False

    model_config = ConfigDict(from_attributes=True)


class RegistrationItem(BaseModel):
    id: int
    user_id: int
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    remark: Optional[str] = None
    registered_at: datetime
