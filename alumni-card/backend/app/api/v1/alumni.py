from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.user import User, AlumnusInfo, VerificationStatus
from app.schemas.alumni import AlumnusListItem, AlumnusDetailOut, VerifyRequest
from app.schemas.common import ApiResponse, PaginatedData
from app.api.deps import get_current_admin, get_current_user

router = APIRouter()


@router.get(
    "/verifications",
    response_model=ApiResponse[PaginatedData[AlumnusListItem]],
)
async def list_verifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str = Query(None, alias="status"),
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(AlumnusInfo).options(selectinload(AlumnusInfo.user))
    count_query = select(func.count()).select_from(AlumnusInfo)

    if status_filter:
        query = query.where(
            AlumnusInfo.verification_status == VerificationStatus(status_filter)
        )
        count_query = count_query.where(
            AlumnusInfo.verification_status == VerificationStatus(status_filter)
        )

    total = (await db.execute(count_query)).scalar()

    offset = (page - 1) * page_size
    query = query.order_by(AlumnusInfo.created_at.desc()).offset(offset).limit(page_size)
    items = (await db.execute(query)).scalars().all()

    item_list = []
    for info in items:
        user = info.user
        item_list.append(
            AlumnusListItem(
                id=info.id,
                user_id=info.user_id,
                real_name=info.real_name,
                student_id=info.student_id,
                class_name=info.class_name,
                graduation_year=info.graduation_year,
                current_university=info.current_university,
                current_college=info.current_college,
                current_major=info.current_major,
                verification_status=info.verification_status.value,
                verified_at=info.verified_at,
                nickname=user.nickname if user else None,
                avatar_url=user.avatar_url if user else None,
                phone=user.phone if user else None,
            )
        )

    return ApiResponse(
        data=PaginatedData(
            items=item_list, total=total, page=page, page_size=page_size
        )
    )


@router.post("/verify/{id}", response_model=ApiResponse[str])
async def verify_alumnus(
    id: int,
    request: VerifyRequest,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AlumnusInfo).where(AlumnusInfo.id == id))
    info = result.scalar_one_or_none()
    if not info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="记录不存在"
        )

    if request.action == "approve":
        info.verification_status = VerificationStatus.APPROVED
        info.verification_remark = request.remark
        info.verified_at = datetime.now()
    elif request.action == "reject":
        info.verification_status = VerificationStatus.REJECTED
        info.verification_remark = request.remark
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="action 必须是 approve 或 reject",
        )

    await db.commit()
    return ApiResponse(message="操作成功")


@router.get(
    "/directory",
    response_model=ApiResponse[PaginatedData[AlumnusListItem]],
)
async def alumni_directory(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    keyword: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(AlumnusInfo)
        .options(selectinload(AlumnusInfo.user))
        .where(AlumnusInfo.verification_status == VerificationStatus.APPROVED)
    )
    count_query = (
        select(func.count())
        .select_from(AlumnusInfo)
        .where(AlumnusInfo.verification_status == VerificationStatus.APPROVED)
    )

    if keyword:
        keyword_filter = (
            AlumnusInfo.real_name.ilike(f"%{keyword}%")
            | AlumnusInfo.class_name.ilike(f"%{keyword}%")
            | AlumnusInfo.current_university.ilike(f"%{keyword}%")
            | AlumnusInfo.current_college.ilike(f"%{keyword}%")
            | AlumnusInfo.current_major.ilike(f"%{keyword}%")
        )
        query = query.where(keyword_filter)
        count_query = count_query.where(keyword_filter)

    total = (await db.execute(count_query)).scalar()
    offset = (page - 1) * page_size
    items = (
        await db.execute(
            query.order_by(AlumnusInfo.verified_at.desc(), AlumnusInfo.id.desc())
            .offset(offset)
            .limit(page_size)
        )
    ).scalars().all()

    return ApiResponse(
        data=PaginatedData(
            items=[
                AlumnusListItem(
                    id=info.id,
                    user_id=info.user_id,
                    real_name=info.real_name,
                    student_id=info.student_id,
                    class_name=info.class_name,
                    graduation_year=info.graduation_year,
                    current_university=info.current_university,
                    current_college=info.current_college,
                    current_major=info.current_major,
                    verification_status=info.verification_status.value,
                    verified_at=info.verified_at,
                    nickname=info.user.nickname if info.user else None,
                    avatar_url=info.user.avatar_url if info.user else None,
                    phone=info.user.phone if info.user else None,
                )
                for info in items
            ],
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.get(
    "/list",
    response_model=ApiResponse[PaginatedData[AlumnusListItem]],
)
async def list_alumni(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str = None,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(AlumnusInfo)
        .options(selectinload(AlumnusInfo.user))
        .where(AlumnusInfo.verification_status == VerificationStatus.APPROVED)
    )
    count_query = (
        select(func.count())
        .select_from(AlumnusInfo)
        .where(AlumnusInfo.verification_status == VerificationStatus.APPROVED)
    )

    if keyword:
        keyword_filter = (
            AlumnusInfo.real_name.ilike(f"%{keyword}%")
            | AlumnusInfo.student_id.ilike(f"%{keyword}%")
            | AlumnusInfo.class_name.ilike(f"%{keyword}%")
            | AlumnusInfo.current_university.ilike(f"%{keyword}%")
        )
        query = query.where(keyword_filter)
        count_query = count_query.where(keyword_filter)

    total = (await db.execute(count_query)).scalar()

    offset = (page - 1) * page_size
    query = query.order_by(AlumnusInfo.verified_at.desc()).offset(offset).limit(page_size)
    items = (await db.execute(query)).scalars().all()

    item_list = []
    for info in items:
        user = info.user
        item_list.append(
            AlumnusListItem(
                id=info.id,
                user_id=info.user_id,
                real_name=info.real_name,
                student_id=info.student_id,
                class_name=info.class_name,
                graduation_year=info.graduation_year,
                current_university=info.current_university,
                current_college=info.current_college,
                current_major=info.current_major,
                verification_status=info.verification_status.value,
                verified_at=info.verified_at,
                nickname=user.nickname if user else None,
                avatar_url=user.avatar_url if user else None,
                phone=user.phone if user else None,
            )
        )

    return ApiResponse(
        data=PaginatedData(
            items=item_list, total=total, page=page, page_size=page_size
        )
    )


@router.get("/{id}", response_model=ApiResponse[AlumnusDetailOut])
async def get_alumnus_detail(
    id: int,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AlumnusInfo)
        .options(selectinload(AlumnusInfo.user))
        .where(AlumnusInfo.id == id)
    )
    info = result.scalar_one_or_none()
    if not info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="校友信息不存在"
        )

    user = info.user
    return ApiResponse(
        data=AlumnusDetailOut(
            id=info.id,
            user_id=info.user_id,
            real_name=info.real_name,
            student_id=info.student_id,
            id_number=info.id_number,
            graduation_year=info.graduation_year,
            class_name=info.class_name,
            current_university=info.current_university,
            current_college=info.current_college,
            current_major=info.current_major,
            certificate_image=info.certificate_image,
            verification_status=info.verification_status.value,
            verification_remark=info.verification_remark,
            verified_at=info.verified_at,
            created_at=info.created_at,
            updated_at=info.updated_at,
            nickname=user.nickname if user else None,
            avatar_url=user.avatar_url if user else None,
            phone=user.phone if user else None,
        )
    )
