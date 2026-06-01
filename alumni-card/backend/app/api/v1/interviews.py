from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.article import Interview
from app.schemas.article import (
    InterviewCreate,
    InterviewUpdate,
    InterviewListItem,
    InterviewDetailOut,
)
from app.schemas.common import ApiResponse, PaginatedData
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()


@router.get("/", response_model=ApiResponse[PaginatedData[InterviewListItem]])
async def list_interviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Interview).where(Interview.is_published == True)
    count_query = (
        select(func.count())
        .select_from(Interview)
        .where(Interview.is_published == True)
    )

    total = (await db.execute(count_query)).scalar()

    offset = (page - 1) * page_size
    query = (
        query.order_by(Interview.sort_order.desc(), Interview.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = (await db.execute(query)).scalars().all()

    item_list = [InterviewListItem.model_validate(item) for item in items]

    return ApiResponse(
        data=PaginatedData(
            items=item_list, total=total, page=page, page_size=page_size
        )
    )


@router.get("/{id}", response_model=ApiResponse[InterviewDetailOut])
async def get_interview_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Interview).where(Interview.id == id))
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="校友风采不存在"
        )

    interview.view_count = (interview.view_count or 0) + 1
    await db.commit()
    await db.refresh(interview)

    return ApiResponse(data=InterviewDetailOut.model_validate(interview))


@router.post("/", response_model=ApiResponse[InterviewDetailOut])
async def create_interview(
    request: InterviewCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    interview = Interview(**request.model_dump())
    db.add(interview)
    await db.commit()
    await db.refresh(interview)

    return ApiResponse(
        data=InterviewDetailOut.model_validate(interview),
        message="创建成功",
    )


@router.put("/{id}", response_model=ApiResponse[InterviewDetailOut])
async def update_interview(
    id: int,
    request: InterviewUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Interview).where(Interview.id == id))
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="校友风采不存在"
        )

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(interview, key, value)

    await db.commit()
    await db.refresh(interview)

    return ApiResponse(
        data=InterviewDetailOut.model_validate(interview),
        message="更新成功",
    )


@router.delete("/{id}", response_model=ApiResponse[str])
async def delete_interview(
    id: int,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Interview).where(Interview.id == id))
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="校友风采不存在"
        )

    await db.delete(interview)
    await db.commit()

    return ApiResponse(message="删除成功")
