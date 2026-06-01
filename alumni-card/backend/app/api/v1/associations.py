from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.association import Association, AssociationMember
from app.schemas.association import (
    AssociationCreate,
    AssociationUpdate,
    AssociationListItem,
    AssociationDetailOut,
    AssociationMemberItem,
)
from app.schemas.common import ApiResponse, PaginatedData
from app.api.deps import get_current_user, get_current_admin, verified_required

router = APIRouter()


@router.get("", response_model=ApiResponse[PaginatedData[AssociationListItem]])
async def list_associations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    province: str = None,
    city: str = None,
    district: str = None,
    keyword: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Association).where(Association.is_active == True)
    count_query = (
        select(func.count()).select_from(Association).where(Association.is_active == True)
    )

    if province:
        query = query.where(Association.province == province)
        count_query = count_query.where(Association.province == province)
    if city:
        query = query.where(Association.city == city)
        count_query = count_query.where(Association.city == city)
    if district:
        query = query.where(Association.district == district)
        count_query = count_query.where(Association.district == district)
    if keyword:
        like_filter = Association.name.ilike(f"%{keyword}%") | Association.address.ilike(f"%{keyword}%")
        if province or city or district:
            pass
        query = query.where(like_filter)
        count_query = count_query.where(like_filter)

    total = (await db.execute(count_query)).scalar()

    offset = (page - 1) * page_size
    query = query.order_by(Association.sort_order.desc(), Association.id.asc())
    query = query.offset(offset).limit(page_size)
    items = (await db.execute(query)).scalars().all()

    item_list = [
        AssociationListItem.model_validate(item) for item in items
    ]

    return ApiResponse(
        data=PaginatedData(
            items=item_list, total=total, page=page, page_size=page_size
        )
    )


@router.get("/my", response_model=ApiResponse[list[AssociationListItem]])
async def my_associations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AssociationMember).where(AssociationMember.user_id == current_user.id)
    )
    memberships = result.scalars().all()
    association_ids = [m.association_id for m in memberships]

    if not association_ids:
        return ApiResponse(data=[])

    result = await db.execute(
        select(Association).where(Association.id.in_(association_ids))
        .where(Association.is_active == True)
        .order_by(Association.sort_order.desc())
    )
    associations = result.scalars().all()

    return ApiResponse(
        data=[AssociationListItem.model_validate(a) for a in associations]
    )


@router.get("/{id}", response_model=ApiResponse[AssociationDetailOut])
async def get_association_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Association).where(Association.id == id))
    assoc = result.scalar_one_or_none()
    if not assoc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="校友会不存在"
        )

    return ApiResponse(data=AssociationDetailOut.model_validate(assoc))


@router.post("/{id}/join", response_model=ApiResponse[str])
async def join_association(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    alumni = current_user.alumni_info
    if not alumni or alumni.verification_status.value != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="需要完成校友认证"
        )

    result = await db.execute(select(Association).where(Association.id == id))
    assoc = result.scalar_one_or_none()
    if not assoc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="校友会不存在"
        )

    result = await db.execute(
        select(AssociationMember).where(
            AssociationMember.association_id == id,
            AssociationMember.user_id == current_user.id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="已加入该校友会"
        )

    member = AssociationMember(association_id=id, user_id=current_user.id)
    db.add(member)

    assoc.member_count = (assoc.member_count or 0) + 1

    await db.commit()

    return ApiResponse(message="加入成功")


@router.post("/{id}/leave", response_model=ApiResponse[str])
async def leave_association(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AssociationMember).where(
            AssociationMember.association_id == id,
            AssociationMember.user_id == current_user.id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="未加入该校友会"
        )

    await db.delete(membership)

    result = await db.execute(select(Association).where(Association.id == id))
    assoc = result.scalar_one_or_none()
    if assoc:
        assoc.member_count = max(0, (assoc.member_count or 1) - 1)

    await db.commit()

    return ApiResponse(message="已退出")


@router.post("", response_model=ApiResponse[AssociationDetailOut])
async def create_association(
    request: AssociationCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    assoc = Association(**request.model_dump())
    db.add(assoc)
    await db.commit()
    await db.refresh(assoc)

    return ApiResponse(
        data=AssociationDetailOut.model_validate(assoc),
        message="创建成功",
    )


@router.put("/{id}", response_model=ApiResponse[AssociationDetailOut])
async def update_association(
    id: int,
    request: AssociationUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Association).where(Association.id == id))
    assoc = result.scalar_one_or_none()
    if not assoc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="校友会不存在"
        )

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(assoc, key, value)

    await db.commit()
    await db.refresh(assoc)

    return ApiResponse(
        data=AssociationDetailOut.model_validate(assoc),
        message="更新成功",
    )


@router.delete("/{id}", response_model=ApiResponse[str])
async def delete_association(
    id: int,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Association).where(Association.id == id))
    assoc = result.scalar_one_or_none()
    if not assoc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="校友会不存在"
        )

    await db.delete(assoc)
    await db.commit()

    return ApiResponse(message="删除成功")
