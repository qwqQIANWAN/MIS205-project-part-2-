from datetime import datetime
from sqlalchemy import String, DateTime, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    cover_image: Mapped[str | None] = mapped_column(String(512), nullable=True)
    summary: Mapped[str | None] = mapped_column(String(512), nullable=True)
    url: Mapped[str] = mapped_column(String(512), nullable=False)  # 公众号文章链接
    source: Mapped[str | None] = mapped_column(String(128), nullable=True)  # 文章来源
    category: Mapped[str | None] = mapped_column(String(32), nullable=True)  # 文章分类
    is_published: Mapped[bool] = mapped_column(default=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    cover_image: Mapped[str | None] = mapped_column(String(512), nullable=True)
    alumnus_name: Mapped[str] = mapped_column(String(64), nullable=False)
    alumnus_avatar: Mapped[str | None] = mapped_column(String(512), nullable=True)
    department: Mapped[str | None] = mapped_column(String(128), nullable=True)
    grade: Mapped[str | None] = mapped_column(String(4), nullable=True)
    current_position: Mapped[str | None] = mapped_column(String(256), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)  # HTML 富文本
    is_published: Mapped[bool] = mapped_column(default=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
