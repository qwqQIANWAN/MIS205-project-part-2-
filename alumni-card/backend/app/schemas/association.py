from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AssociationBase(BaseModel):
    name: str
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    cover_image: Optional[str] = None
    description: Optional[str] = None
    president_name: Optional[str] = None
    president_phone: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    wechat_group_qr: Optional[str] = None
    sort_order: int = 0


class AssociationCreate(AssociationBase):
    pass


class AssociationUpdate(BaseModel):
    name: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    cover_image: Optional[str] = None
    description: Optional[str] = None
    president_name: Optional[str] = None
    president_phone: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    wechat_group_qr: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class AssociationListItem(BaseModel):
    id: int
    name: str
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    cover_image: Optional[str] = None
    member_count: int = 0
    sort_order: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssociationDetailOut(AssociationListItem):
    description: Optional[str] = None
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    president_name: Optional[str] = None
    president_phone: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    wechat_group_qr: Optional[str] = None
    is_active: bool = True
    updated_at: Optional[datetime] = None


class AssociationMemberItem(BaseModel):
    id: int
    user_id: int
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    joined_at: datetime
