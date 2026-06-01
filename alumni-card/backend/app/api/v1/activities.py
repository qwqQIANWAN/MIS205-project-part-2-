from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.user import User
from app.models.activity import Activity, ActivityRegistration, ActivityStatus
from app.schemas.activity import (
    ActivityCreate,
    ActivityUpdate,
    ActivityListItem,
    ActivityDetailOut,
    RegistrationItem,
)
from app.schemas.common import ApiResponse, PaginatedData
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()


@router.get("", response_model=ApiResponse[PaginatedData[ActivityListItem]])
async def list_activities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Activity).where(Activity.is_published == True)
    count_query = (
        select(func.count())
        .select_from(Activity)
        .where(Activity.is_published == True)
    )

    if status_filter:
        query = query.where(Activity.status == ActivityStatus(status_filter))
        count_query = count_query.where(
            Activity.status == ActivityStatus(status_filter)
        )

    total = (await db.execute(count_query)).scalar()

    offset = (page - 1) * page_size
    query = query.order_by(Activity.created_at.desc()).offset(offset).limit(page_size)
    items = (await db.execute(query)).scalars().all()

    item_list = [ActivityListItem.model_validate(item) for item in items]

    return ApiResponse(
        data=PaginatedData(
            items=item_list, total=total, page=page, page_size=page_size
        )
    )


@router.get("/my", response_model=ApiResponse[list[ActivityListItem]])
async def my_activities(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ActivityRegistration).where(
            ActivityRegistration.user_id == current_user.id
        )
    )
    registrations = result.scalars().all()
    activity_ids = [r.activity_id for r in registrations]

    if not activity_ids:
        return ApiResponse(data=[])

    result = await db.execute(
        select(Activity)
        .where(Activity.id.in_(activity_ids))
        .order_by(Activity.start_time.desc())
    )
    activities = result.scalars().all()

    return ApiResponse(
        data=[ActivityListItem.model_validate(a) for a in activities]
    )


@router.get("/{id}", response_model=ApiResponse[ActivityDetailOut])
async def get_activity_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Activity).where(Activity.id == id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="活动不存在"
        )

    result = await db.execute(
        select(ActivityRegistration).where(
            ActivityRegistration.activity_id == id,
            ActivityRegistration.user_id == current_user.id,
        )
    )
    is_registered = result.scalar_one_or_none() is not None

    detail = ActivityDetailOut.model_validate(activity)
    detail.is_registered = is_registered

    return ApiResponse(data=detail)


@router.post("/{id}/register", response_model=ApiResponse[str])
async def register_activity(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    alumni = current_user.alumni_info
    if not alumni or alumni.verification_status.value != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="需要完成校友认证"
        )

    result = await db.execute(select(Activity).where(Activity.id == id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="活动不存在"
        )

    if activity.status not in (ActivityStatus.UPCOMING, ActivityStatus.ONGOING):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="活动不在报名状态"
        )

    if activity.max_participants and activity.current_participants >= activity.max_participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="报名已满"
        )

    result = await db.execute(
        select(ActivityRegistration).where(
            ActivityRegistration.activity_id == id,
            ActivityRegistration.user_id == current_user.id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="已报名该活动"
        )

    registration = ActivityRegistration(
        activity_id=id, user_id=current_user.id
    )
    db.add(registration)
    activity.current_participants = (activity.current_participants or 0) + 1

    await db.commit()

    return ApiResponse(message="报名成功")


@router.post("/{id}/cancel", response_model=ApiResponse[str])
async def cancel_registration(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ActivityRegistration).where(
            ActivityRegistration.activity_id == id,
            ActivityRegistration.user_id == current_user.id,
        )
    )
    registration = result.scalar_one_or_none()
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="未报名该活动"
        )

    await db.delete(registration)

    result = await db.execute(select(Activity).where(Activity.id == id))
    activity = result.scalar_one_or_none()
    if activity:
        activity.current_participants = max(0, (activity.current_participants or 1) - 1)

    await db.commit()

    return ApiResponse(message="已取消报名")


@router.post("", response_model=ApiResponse[ActivityDetailOut])
async def create_activity(
    request: ActivityCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    activity = Activity(**request.model_dump())
    db.add(activity)
    await db.commit()
    await db.refresh(activity)

    return ApiResponse(
        data=ActivityDetailOut.model_validate(activity),
        message="创建成功",
    )


@router.put("/{id}", response_model=ApiResponse[ActivityDetailOut])
async def update_activity(
    id: int,
    request: ActivityUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Activity).where(Activity.id == id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="活动不存在"
        )

    update_data = request.model_dump(exclude_unset=True)
    if "status" in update_data:
        update_data["status"] = ActivityStatus(update_data["status"])
    for key, value in update_data.items():
        setattr(activity, key, value)

    await db.commit()
    await db.refresh(activity)

    return ApiResponse(
        data=ActivityDetailOut.model_validate(activity),
        message="更新成功",
    )


@router.delete("/{id}", response_model=ApiResponse[str])
async def delete_activity(
    id: int,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Activity).where(Activity.id == id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="活动不存在"
        )

    await db.delete(activity)
    await db.commit()

    return ApiResponse(message="删除成功")
