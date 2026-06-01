from datetime import datetime
import enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    openid: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    unionid: Mapped[str | None] = mapped_column(String(128), nullable=True)
    real_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    nickname: Mapped[str | None] = mapped_column(String(64), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    alumni_info: Mapped["AlumnusInfo | None"] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    teacher_profile: Mapped["Teacher | None"] = relationship(
        back_populates="user",
        uselist=False,
    )
    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    activity_registrations: Mapped[list["ActivityRegistration"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    association_memberships: Mapped[list["AssociationMember"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class AlumnusInfo(Base):
    __tablename__ = "alumnus_info"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    real_name: Mapped[str] = mapped_column(String(64), nullable=False)
    student_id: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    id_number: Mapped[str | None] = mapped_column(String(18), nullable=True)
    grade: Mapped[str | None] = mapped_column(String(4), nullable=True)
    graduation_year: Mapped[str | None] = mapped_column(String(4), nullable=True)
    class_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    current_university: Mapped[str | None] = mapped_column(String(128), nullable=True)
    current_college: Mapped[str | None] = mapped_column(String(128), nullable=True)
    current_major: Mapped[str | None] = mapped_column(String(128), nullable=True)
    department: Mapped[str | None] = mapped_column(String(128), nullable=True)
    major: Mapped[str | None] = mapped_column(String(128), nullable=True)
    education: Mapped[str | None] = mapped_column(String(32), nullable=True)
    certificate_image: Mapped[str | None] = mapped_column(String(512), nullable=True)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus), default=VerificationStatus.PENDING
    )
    verification_remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="alumni_info")
