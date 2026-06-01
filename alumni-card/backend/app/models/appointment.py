from datetime import date, datetime
import enum

from sqlalchemy import (
    Date,
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

class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    teacher_id: Mapped[int | None] = mapped_column(
        ForeignKey("teachers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    visit_date: Mapped[date] = mapped_column(Date, nullable=False)
    companion_count: Mapped[int] = mapped_column(Integer, default=0)
    purpose: Mapped[str | None] = mapped_column(String(256), nullable=True)
    status: Mapped[AppointmentStatus] = mapped_column(
        SAEnum(AppointmentStatus), default=AppointmentStatus.PENDING
    )
    qr_code: Mapped[str | None] = mapped_column(String(512), nullable=True)  # 返校二维码
    qr_code_expire_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)  # 管理员备注
    teacher_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    teacher_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reject_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="appointments")
    teacher: Mapped["Teacher | None"] = relationship(back_populates="appointments")
    companions: Mapped[list["AppointmentCompanion"]] = relationship(
        back_populates="appointment",
        cascade="all, delete-orphan",
    )

class AppointmentCompanion(Base):
    __tablename__ = "appointment_companions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    id_number: Mapped[str | None] = mapped_column(String(18), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    relation: Mapped[str | None] = mapped_column(String(32), nullable=True)  # 与校友关系

    appointment: Mapped["Appointment"] = relationship(back_populates="companions")
