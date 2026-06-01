from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin, get_current_teacher, get_current_user
from app.core.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.teacher import Teacher
from app.models.user import AlumnusInfo, User
from app.schemas.appointment import AppointmentApprove, AppointmentDetailOut, AppointmentReject
from app.schemas.common import ApiResponse
from app.schemas.teacher import (
    TeacherBindRequest,
    TeacherCreate,
    TeacherListItem,
    TeacherProfileOut,
    TeacherSimpleOut,
)
from app.api.v1.appointments import _approve_appointment_record, _reject_appointment_record

router = APIRouter()


@router.get("/options", response_model=ApiResponse[list[TeacherSimpleOut]])
async def list_teacher_options(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Teacher)
        .where(Teacher.is_active.is_(True))
        .order_by(Teacher.name.asc())
    )
    teachers = result.scalars().all()
    return ApiResponse(data=[TeacherSimpleOut.model_validate(item) for item in teachers])


@router.get("", response_model=ApiResponse[list[TeacherListItem]])
async def list_teachers(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            Teacher,
            func.count(Appointment.id).filter(Appointment.status == AppointmentStatus.PENDING),
        )
        .outerjoin(Appointment, Appointment.teacher_id == Teacher.id)
        .group_by(Teacher.id)
        .order_by(Teacher.created_at.desc())
    )
    rows = result.all()
    items = [
        TeacherListItem(
            id=teacher.id,
            user_id=teacher.user_id,
            name=teacher.name,
            phone=teacher.phone,
            subject=teacher.subject,
            title=teacher.title,
            is_active=teacher.is_active,
            pending_count=pending_count or 0,
            created_at=teacher.created_at,
        )
        for teacher, pending_count in rows
    ]
    return ApiResponse(data=items)


@router.post("", response_model=ApiResponse[TeacherProfileOut])
async def create_teacher(
    request: TeacherCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    teacher = Teacher(
        name=request.name.strip(),
        phone=request.phone.strip(),
        subject=request.subject.strip() if request.subject else None,
        title=request.title.strip() if request.title else None,
    )
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)
    return ApiResponse(data=TeacherProfileOut.model_validate(teacher), message="老师创建成功")


@router.post("/bind", response_model=ApiResponse[TeacherProfileOut])
async def bind_teacher_identity(
    request: TeacherBindRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Teacher).where(
            Teacher.name == request.name.strip(),
            Teacher.phone == request.phone.strip(),
            Teacher.is_active.is_(True),
        )
    )
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到匹配的老师档案，请联系管理员创建",
        )

    if teacher.user_id and teacher.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该老师档案已绑定其他账号",
        )

    teacher.user_id = current_user.id
    await db.commit()
    await db.refresh(teacher)
    return ApiResponse(data=TeacherProfileOut.model_validate(teacher), message="老师身份绑定成功")


@router.get("/me", response_model=ApiResponse[TeacherProfileOut])
async def get_my_teacher_profile(
    teacher: Teacher = Depends(get_current_teacher),
):
    return ApiResponse(data=TeacherProfileOut.model_validate(teacher))


@router.get("/me/appointments", response_model=ApiResponse[list[AppointmentDetailOut]])
async def get_my_pending_appointments(
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.companions), selectinload(Appointment.teacher))
        .where(Appointment.teacher_id == teacher.id)
        .order_by(Appointment.created_at.desc())
    )
    appointments = result.scalars().all()

    items: list[AppointmentDetailOut] = []
    for appointment in appointments:
        alumni_result = await db.execute(
            select(AlumnusInfo).where(AlumnusInfo.user_id == appointment.user_id)
        )
        alumni = alumni_result.scalar_one_or_none()
        items.append(
            AppointmentDetailOut(
                id=appointment.id,
                user_id=appointment.user_id,
                visit_date=appointment.visit_date,
                companion_count=appointment.companion_count,
                purpose=appointment.purpose,
                status=appointment.status.value,
                qr_code=appointment.qr_code,
                qr_code_expire_at=appointment.qr_code_expire_at,
                remark=appointment.remark,
                teacher_id=teacher.id,
                teacher_name=teacher.name,
                teacher_title=teacher.title,
                teacher_comment=appointment.teacher_comment,
                teacher_reviewed_at=appointment.teacher_reviewed_at,
                reject_reason=appointment.reject_reason,
                created_at=appointment.created_at,
                updated_at=appointment.updated_at,
                real_name=alumni.real_name if alumni else None,
                companions=appointment.companions,
            )
        )
    return ApiResponse(data=items)


@router.put("/me/appointments/{appointment_id}/approve", response_model=ApiResponse[str])
async def approve_my_appointment(
    appointment_id: int,
    request: AppointmentApprove,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    appointment = await _load_teacher_appointment(appointment_id, teacher.id, db)
    if appointment.status != AppointmentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只能审批待审核的预约",
        )

    alumni_result = await db.execute(
        select(AlumnusInfo).where(AlumnusInfo.user_id == appointment.user_id)
    )
    alumni = alumni_result.scalar_one_or_none()
    await _approve_appointment_record(
        appointment=appointment,
        alumni=alumni,
        remark=request.remark,
        qr_code_expire_days=request.qr_code_expire_days,
        reviewer_label=f"{teacher.name}老师审批通过",
    )
    await db.commit()
    return ApiResponse(message="审批通过")


@router.put("/me/appointments/{appointment_id}/reject", response_model=ApiResponse[str])
async def reject_my_appointment(
    appointment_id: int,
    request: AppointmentReject,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    appointment = await _load_teacher_appointment(appointment_id, teacher.id, db)
    if appointment.status != AppointmentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只能审批待审核的预约",
        )

    _reject_appointment_record(
        appointment=appointment,
        reason=request.reason,
        reviewer_label=f"{teacher.name}老师审批拒绝",
    )
    appointment.teacher_reviewed_at = datetime.now()
    await db.commit()
    return ApiResponse(message="已拒绝")


async def _load_teacher_appointment(
    appointment_id: int,
    teacher_id: int,
    db: AsyncSession,
) -> Appointment:
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.companions), selectinload(Appointment.teacher))
        .where(
            Appointment.id == appointment_id,
            Appointment.teacher_id == teacher_id,
        )
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到分配给当前老师的预约",
        )
    return appointment
