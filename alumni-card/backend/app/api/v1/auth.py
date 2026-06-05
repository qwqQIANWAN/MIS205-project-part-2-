import json

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
    UserRegisterRequest,
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
    appid = settings.WECHAT_APPID.strip()
    secret = settings.WECHAT_SECRET.strip()
    code = request.code.strip()

    if not appid or not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="后端未配置微信登录参数",
        )
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="缺少微信登录凭证 code",
        )

    params = {
        "appid": appid,
        "secret": secret,
        "js_code": code,
        "grant_type": "authorization_code",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(WECHAT_API, params=params)
            resp.raise_for_status()
            data = resp.json()
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="微信登录服务返回了无效响应",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"微信登录服务请求失败: {str(exc)}",
        ) from exc

    if "errcode" in data and data["errcode"] != 0:
        message = data.get("errmsg", "未知错误")
        if data.get("errcode") == 40013:
            message = "AppID 无效，请检查后端环境变量 WECHAT_APPID"
        elif data.get("errcode") == 40125:
            message = "AppSecret 无效，请检查后端环境变量 WECHAT_SECRET"
        elif data.get("errcode") == 40029:
            message = "登录 code 无效或已过期，请重新发起微信登录"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"微信登录失败: {message}",
        )

    openid = data.get("openid")
    if not openid:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="微信登录响应缺少 openid",
        )

    unionid = data.get("unionid")

    result = await db.execute(
        select(User)
        .options(selectinload(User.alumni_info), selectinload(User.teacher_profile))
        .where(User.openid == openid)
    )
    user = result.scalar_one_or_none()

    if not user:
        user = User(openid=openid, unionid=unionid)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    alumni_info = user.alumni_info

    user_info = UserInfo(
        id=user.id,
        real_name=user.real_name,
        nickname=user.nickname,
        avatar_url=user.avatar_url,
        phone=user.phone,
        is_admin=user.is_admin,
        is_registered=bool(user.real_name and user.phone),
        is_verified=(
            alumni_info is not None
            and alumni_info.verification_status == VerificationStatus.APPROVED
        ),
        is_teacher=user.teacher_profile is not None,
        created_at=user.created_at,
    )

    return ApiResponse(
        data=WechatLoginResponse(token=token, user=user_info)
    )


@router.post("/register", response_model=ApiResponse[UserProfileResponse])
async def register_user(
    request: UserRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.real_name = request.real_name.strip()
    current_user.phone = request.phone.strip()
    await db.commit()
    await db.refresh(current_user)

    result = await db.execute(
        select(User)
        .options(selectinload(User.alumni_info), selectinload(User.teacher_profile))
        .where(User.id == current_user.id)
    )
    user = result.scalar_one()
    return ApiResponse(data=_build_profile_response(user), message="注册成功")


@router.get("/profile", response_model=ApiResponse[UserProfileResponse])
async def get_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse(data=_build_profile_response(current_user))


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
    result = await db.execute(
        select(User)
        .options(selectinload(User.alumni_info), selectinload(User.teacher_profile))
        .where(User.id == current_user.id)
    )
    user = result.scalar_one()
    return ApiResponse(data=_build_profile_response(user))


@router.post("/alumni-verify", response_model=ApiResponse[UserProfileResponse])
async def submit_alumni_verification(
    request: AlumniVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.real_name or not current_user.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先完成姓名和手机号注册",
        )

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
        existing.real_name = current_user.real_name
        existing.student_id = request.student_id or existing.student_id or ""
        existing.verification_status = VerificationStatus.PENDING
        existing.verification_remark = None
        existing.verified_at = None
    else:
        alumni_info = AlumnusInfo(
            user_id=current_user.id,
            real_name=current_user.real_name,
            student_id=request.student_id or "",
            **request.model_dump(exclude={"student_id"}),
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

    return ApiResponse(data=_build_profile_response(current_user))


def _build_profile_response(user: User) -> UserProfileResponse:
    alumni_info = user.alumni_info
    is_verified = (
        alumni_info is not None
        and alumni_info.verification_status == VerificationStatus.APPROVED
    )
    return UserProfileResponse(
        id=user.id,
        openid=user.openid,
        real_name=user.real_name,
        nickname=user.nickname,
        avatar_url=user.avatar_url,
        phone=user.phone,
        is_admin=user.is_admin,
        is_active=user.is_active,
        is_registered=bool(user.real_name and user.phone),
        is_verified=is_verified,
        is_teacher=user.teacher_profile is not None,
        created_at=user.created_at,
        alumni_info=alumni_info,
        teacher_profile=user.teacher_profile,
    )
