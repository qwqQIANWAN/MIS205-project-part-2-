import os
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, AlumnusInfo
from app.models.teacher import Teacher
from app.models.appointment import (
    Appointment,
    AppointmentCompanion,
    AppointmentStatus,
)
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentListItem,
    AppointmentDetailOut,
    AppointmentApprove,
    AppointmentReject,
    CompanionOut,
)
from app.schemas.common import ApiResponse, PaginatedData
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()

UPLOAD_DIR = settings.UPLOAD_DIR


@router.post("", response_model=ApiResponse[AppointmentListItem])
async def create_appointment(
    request: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    alumni = current_user.alumni_info
    if not alumni or alumni.verification_status.value != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="需要完成校友认证"
        )

    appointment = Appointment(
        user_id=current_user.id,
        teacher_id=request.teacher_id,
        visit_date=request.visit_date,
        companion_count=len(request.companions),
        purpose=request.purpose,
    )
    teacher = await _get_teacher_or_404(request.teacher_id, db)
    db.add(appointment)
    await db.flush()

    for comp in request.companions:
        companion = AppointmentCompanion(
            appointment_id=appointment.id,
            name=comp.name,
            id_number=comp.id_number,
            phone=comp.phone,
            relation=comp.relation,
        )
        db.add(companion)

    await db.commit()
    await db.refresh(appointment)

    return ApiResponse(
        data=AppointmentListItem(
            id=appointment.id,
            user_id=appointment.user_id,
            visit_date=appointment.visit_date,
            companion_count=appointment.companion_count,
            purpose=appointment.purpose,
            status=appointment.status.value,
            teacher_id=teacher.id,
            teacher_name=teacher.name,
            teacher_title=teacher.title,
            created_at=appointment.created_at,
            nickname=current_user.nickname,
            avatar_url=current_user.avatar_url,
        ),
        message="预约提交成功",
    )


@router.get("", response_model=ApiResponse[list[AppointmentListItem]])
async def my_appointments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.teacher))
        .where(Appointment.user_id == current_user.id)
        .order_by(Appointment.created_at.desc())
    )
    appointments = result.scalars().all()

    item_list = [
        AppointmentListItem(
            id=a.id,
            user_id=a.user_id,
            visit_date=a.visit_date,
            companion_count=a.companion_count,
            purpose=a.purpose,
            status=a.status.value,
            teacher_id=a.teacher_id,
            teacher_name=a.teacher.name if a.teacher else None,
            teacher_title=a.teacher.title if a.teacher else None,
            created_at=a.created_at,
            nickname=current_user.nickname,
            avatar_url=current_user.avatar_url,
        )
        for a in appointments
    ]

    return ApiResponse(data=item_list)


@router.get("/admin", response_model=ApiResponse[PaginatedData[AppointmentDetailOut]])
async def admin_appointments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str = None,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Appointment)
        .options(selectinload(Appointment.teacher))
        .order_by(Appointment.created_at.desc())
    )
    count_query = select(func.count()).select_from(Appointment)

    if status_filter:
        query = query.where(Appointment.status == AppointmentStatus(status_filter))
        count_query = count_query.where(
            Appointment.status == AppointmentStatus(status_filter)
        )

    total = (await db.execute(count_query)).scalar()

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    items = (await db.execute(query)).scalars().all()

    item_list = []
    for a in items:
        result = await db.execute(
            select(User).where(User.id == a.user_id)
        )
        user = result.scalar_one_or_none()
        result = await db.execute(
            select(AlumnusInfo).where(AlumnusInfo.user_id == a.user_id)
        )
        alumni = result.scalar_one_or_none()

        item_list.append(
            AppointmentDetailOut(
                id=a.id,
                user_id=a.user_id,
                visit_date=a.visit_date,
                companion_count=a.companion_count,
                purpose=a.purpose,
                status=a.status.value,
                qr_code=a.qr_code,
                qr_code_expire_at=a.qr_code_expire_at,
                remark=a.remark,
                teacher_id=a.teacher_id,
                teacher_name=a.teacher.name if a.teacher else None,
                teacher_title=a.teacher.title if a.teacher else None,
                teacher_comment=a.teacher_comment,
                teacher_reviewed_at=a.teacher_reviewed_at,
                reject_reason=a.reject_reason,
                created_at=a.created_at,
                updated_at=a.updated_at,
                nickname=user.nickname if user else None,
                avatar_url=user.avatar_url if user else None,
                real_name=alumni.real_name if alumni else None,
            )
        )

    return ApiResponse(
        data=PaginatedData(
            items=item_list, total=total, page=page, page_size=page_size
        )
    )


@router.get("/{id}", response_model=ApiResponse[AppointmentDetailOut])
async def get_appointment_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.companions), selectinload(Appointment.teacher))
        .where(Appointment.id == id)
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="预约不存在"
        )

    can_view_as_teacher = (
        current_user.teacher_profile is not None
        and appointment.teacher_id == current_user.teacher_profile.id
    )
    if (
        appointment.user_id != current_user.id
        and not current_user.is_admin
        and not can_view_as_teacher
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="无权查看此预约"
        )

    result = await db.execute(
        select(AlumnusInfo).where(AlumnusInfo.user_id == appointment.user_id)
    )
    alumni = result.scalar_one_or_none()

    return ApiResponse(
        data=AppointmentDetailOut(
            id=appointment.id,
            user_id=appointment.user_id,
            visit_date=appointment.visit_date,
            companion_count=appointment.companion_count,
            purpose=appointment.purpose,
            status=appointment.status.value,
            qr_code=appointment.qr_code,
            qr_code_expire_at=appointment.qr_code_expire_at,
            remark=appointment.remark,
            teacher_id=appointment.teacher_id,
            teacher_name=appointment.teacher.name if appointment.teacher else None,
            teacher_title=appointment.teacher.title if appointment.teacher else None,
            teacher_comment=appointment.teacher_comment,
            teacher_reviewed_at=appointment.teacher_reviewed_at,
            reject_reason=appointment.reject_reason,
            created_at=appointment.created_at,
            updated_at=appointment.updated_at,
            nickname=current_user.nickname,
            avatar_url=current_user.avatar_url,
            real_name=alumni.real_name if alumni else None,
            companions=[
                CompanionOut(
                    id=c.id,
                    name=c.name,
                    id_number=c.id_number,
                    phone=c.phone,
                    relation=c.relation,
                )
                for c in appointment.companions
            ]
            if appointment.companions
            else [],
        )
    )


@router.put("/{id}/cancel", response_model=ApiResponse[str])
async def cancel_appointment(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).where(Appointment.id == id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="预约不存在"
        )

    if appointment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="无权操作此预约"
        )

    if appointment.status == AppointmentStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="预约已取消"
        )

    appointment.status = AppointmentStatus.CANCELLED
    await db.commit()

    return ApiResponse(message="预约已取消")


@router.put("/{id}/approve", response_model=ApiResponse[str])
async def approve_appointment(
    id: int,
    request: AppointmentApprove,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).where(Appointment.id == id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="预约不存在"
        )

    if appointment.status != AppointmentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="只能审批待审核的预约"
        )

    result = await db.execute(
        select(AlumnusInfo).where(AlumnusInfo.user_id == appointment.user_id)
    )
    alumni = result.scalar_one_or_none()
    await _approve_appointment_record(
        appointment=appointment,
        alumni=alumni,
        remark=request.remark,
        qr_code_expire_days=request.qr_code_expire_days,
        reviewer_label="管理员审批通过",
    )

    await db.commit()

    return ApiResponse(message="审批通过")


@router.put("/{id}/reject", response_model=ApiResponse[str])
async def reject_appointment(
    id: int,
    request: AppointmentReject,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).where(Appointment.id == id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="预约不存在"
        )

    if appointment.status != AppointmentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="只能审批待审核的预约"
        )

    _reject_appointment_record(
        appointment=appointment,
        reason=request.reason,
        reviewer_label="管理员审批拒绝",
    )
    await db.commit()

    return ApiResponse(message="已拒绝")


async def _get_teacher_or_404(teacher_id: int, db: AsyncSession) -> Teacher:
    result = await db.execute(
        select(Teacher).where(Teacher.id == teacher_id, Teacher.is_active.is_(True))
    )
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="参访老师不存在或已停用",
        )
    return teacher


async def _approve_appointment_record(
    appointment: Appointment,
    alumni: AlumnusInfo | None,
    remark: str | None,
    qr_code_expire_days: int,
    reviewer_label: str,
):
    try:
        import qrcode
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="qrcode 库未安装",
        )

    qr_data = f"{appointment.id}|{alumni.real_name if alumni else ''}|{appointment.visit_date}"
    img = qrcode.make(qr_data)

    qr_dir = os.path.join(UPLOAD_DIR, "qrcodes")
    os.makedirs(qr_dir, exist_ok=True)
    qr_filename = f"appointment_{appointment.id}_{uuid.uuid4().hex[:8]}.png"
    qr_path = os.path.join(qr_dir, qr_filename)
    img.save(qr_path)

    appointment.status = AppointmentStatus.APPROVED
    appointment.qr_code = f"/uploads/qrcodes/{qr_filename}"
    appointment.qr_code_expire_at = datetime.now() + timedelta(days=qr_code_expire_days)
    appointment.remark = remark or reviewer_label
    appointment.teacher_comment = remark or reviewer_label
    appointment.teacher_reviewed_at = datetime.now()
    appointment.reject_reason = None


def _reject_appointment_record(
    appointment: Appointment,
    reason: str,
    reviewer_label: str,
):
    appointment.status = AppointmentStatus.REJECTED
    appointment.reject_reason = reason
    appointment.teacher_comment = reviewer_label
    appointment.teacher_reviewed_at = datetime.now()
    appointment.qr_code = None
    appointment.qr_code_expire_at = None
