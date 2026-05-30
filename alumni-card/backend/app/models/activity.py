from datetime import datetime, date
from sqlalchemy import String, DateTime, Integer, Enum as SAEnum, Text, Date, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import enum

class ActivityStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    ENDED = "ended"
    CANCELLED = "cancelled"

class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    cover_image: Mapped[str | None] = mapped_column(String(512), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(256), nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    signup_deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    max_participants: Mapped[int | None] = mapped_column(Integer, nullable=True)
    current_participants: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[ActivityStatus] = mapped_column(
        SAEnum(ActivityStatus), default=ActivityStatus.UPCOMING
    )
    organizer: Mapped[str | None] = mapped_column(String(128), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_published: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    registrations: Mapped[list["ActivityRegistration"]] = relationship(back_populates="activity")

class ActivityRegistration(Base):
    __tablename__ = "activity_registrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    activity_id: Mapped[int] = mapped_column(Integer, nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    registered_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    activity: Mapped["Activity"] = relationship(back_populates="registrations")
    user: Mapped["User"] = relationship(back_populates="activity_registrations")
