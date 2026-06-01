from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user as verify_token
from app.models.user import User
from app.models.teacher import Teacher


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token_user: User = Depends(verify_token),
) -> User:
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.alumni_info),
            selectinload(User.teacher_profile),
        )
        .where(User.id == token_user.id)
    )
    return result.scalar_one()


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限",
        )
    return current_user


async def get_current_teacher(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Teacher:
    result = await db.execute(
        select(Teacher).where(
            Teacher.user_id == current_user.id,
            Teacher.is_active.is_(True),
        )
    )
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要老师审批权限",
        )
    return teacher


async def verified_required(
    current_user: User = Depends(get_current_user),
) -> User:
    if (
        not current_user.alumni_info
        or current_user.alumni_info.verification_status != "approved"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要完成校友认证",
        )
    return current_user
