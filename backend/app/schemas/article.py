from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ArticleCreate(BaseModel):
    title: str
    cover_image: Optional[str] = None
    summary: Optional[str] = None
    url: str
    source: Optional[str] = None
    category: Optional[str] = None
    is_published: bool = True
    sort_order: int = 0


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    cover_image: Optional[str] = None
    summary: Optional[str] = None
    url: Optional[str] = None
    source: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None
    sort_order: Optional[int] = None


class ArticleListItem(BaseModel):
    id: int
    title: str
    cover_image: Optional[str] = None
    summary: Optional[str] = None
    source: Optional[str] = None
    category: Optional[str] = None
    is_published: bool = True
    view_count: int = 0
    sort_order: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ArticleDetailOut(ArticleListItem):
    url: str
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InterviewCreate(BaseModel):
    title: str
    cover_image: Optional[str] = None
    alumnus_name: str
    alumnus_avatar: Optional[str] = None
    department: Optional[str] = None
    grade: Optional[str] = None
    current_position: Optional[str] = None
    content: str
    is_published: bool = True
    sort_order: int = 0


class InterviewUpdate(BaseModel):
    title: Optional[str] = None
    cover_image: Optional[str] = None
    alumnus_name: Optional[str] = None
    alumnus_avatar: Optional[str] = None
    department: Optional[str] = None
    grade: Optional[str] = None
    current_position: Optional[str] = None
    content: Optional[str] = None
    is_published: Optional[bool] = None
    sort_order: Optional[int] = None


class InterviewListItem(BaseModel):
    id: int
    title: str
    cover_image: Optional[str] = None
    alumnus_name: str
    alumnus_avatar: Optional[str] = None
    department: Optional[str] = None
    grade: Optional[str] = None
    current_position: Optional[str] = None
    is_published: bool = True
    view_count: int = 0
    sort_order: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InterviewDetailOut(InterviewListItem):
    content: str
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
