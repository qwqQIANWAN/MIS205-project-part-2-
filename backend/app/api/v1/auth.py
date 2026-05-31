import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User, AlumnusInfo, VerificationStatus
from app.schemas.user import (
    WechatLoginRequest,
    WechatLoginResponse,
    UserInfo,
    UserProfileResponse,
    UserProfileUpdate,
    AlumniVerifyRequest,
)
from app.schemas.common import ApiResponse
from app.api.deps import get_current_user

router = APIRouter()

WECHAT_API = "https://api.weixin.qq.com/sns/jscode2session"


@router.post("/wechat-login", response_model=ApiResponse[WechatLoginResponse])
async def wechat_login(
    request: WechatLoginRequest, db: AsyncSession = Depends(get_db)
):
    params = {
        "appid": settings.WECHAT_APPID,
        "secret": settings.WECHAT_SECRET,
        "js_code": request.code,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(WECHAT_API, params=params)
        data = resp.json()

    if "errcode" in data and data["errcode"] != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"微信登录失败: {data.get('errmsg', '未知错误')}",
        )

    openid = data["openid"]
    unionid = data.get("unionid")

    result = await db.execute(select(User).where(User.openid == openid))
    user = result.scalar_one_or_none()

    if not user:
        user = User(openid=openid, unionid=unionid)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})

    result = await db.execute(
        select(AlumnusInfo).where(AlumnusInfo.user_id == user.id)
    )
    alumni_info = result.scalar_one_or_none()

    user_info = UserInfo(
        id=user.id,
        nickname=user.nickname,
        avatar_url=user.avatar_url,
        phone=user.phone,
        is_admin=user.is_admin,
        is_verified=(
            alumni_info is not None
            and alumni_info.verification_status == VerificationStatus.APPROVED
        ),
        created_at=user.created_at,
    )

    return ApiResponse(
        data=WechatLoginResponse(token=token, user=user_info)
    )


@router.get("/profile", response_model=ApiResponse[UserProfileResponse])
async def get_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse(data=UserProfileResponse.model_validate(current_user))


@router.put("/profile", response_model=ApiResponse[UserProfileResponse])
async def update_profile(
    request: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    await db.commit()
    await db.refresh(current_user)
    return ApiResponse(data=UserProfileResponse.model_validate(current_user))


@router.post("/alumni-verify", response_model=ApiResponse[UserProfileResponse])
async def submit_alumni_verification(
    request: AlumniVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AlumnusInfo).where(AlumnusInfo.user_id == current_user.id)
    )
    existing = result.scalar_one_or_none()

    if existing and existing.verification_status == VerificationStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已完成认证，无需重复提交",
        )

    if existing:
        update_data = request.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(existing, key, value)
        existing.verification_status = VerificationStatus.PENDING
        existing.verification_remark = None
    else:
        alumni_info = AlumnusInfo(
            user_id=current_user.id,
            **request.model_dump(),
            verification_status=VerificationStatus.PENDING,
        )
        db.add(alumni_info)

    await db.commit()

    result = await db.execute(
        select(User)
        .options(selectinload(User.alumni_info))
        .where(User.id == current_user.id)
    )
    current_user = result.scalar_one()

    return ApiResponse(data=UserProfileResponse.model_validate(current_user))
