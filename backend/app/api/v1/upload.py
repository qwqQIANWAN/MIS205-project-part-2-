import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from app.core.config import settings
from app.models.user import User
from app.schemas.common import ApiResponse
from app.api.deps import get_current_user

router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
MAX_SIZE = settings.MAX_UPLOAD_SIZE


def validate_image(file: UploadFile):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件格式，仅支持: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    return ext


@router.post("/image", response_model=ApiResponse[dict])
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    ext = validate_image(file)

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小不能超过 {MAX_SIZE // 1024 // 1024}MB",
        )

    now = datetime.now()
    sub_dir = os.path.join(
        settings.UPLOAD_DIR, "images", str(now.year), f"{now.month:02d}"
    )
    os.makedirs(sub_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(sub_dir, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    url = f"/uploads/images/{now.year}/{now.month:02d}/{filename}"

    return ApiResponse(data={"url": url, "filename": filename})


@router.post("/certificate", response_model=ApiResponse[dict])
async def upload_certificate(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    ext = validate_image(file)

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小不能超过 {MAX_SIZE // 1024 // 1024}MB",
        )

    now = datetime.now()
    sub_dir = os.path.join(
        settings.UPLOAD_DIR, "certificates", str(now.year), f"{now.month:02d}"
    )
    os.makedirs(sub_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(sub_dir, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    url = f"/uploads/certificates/{now.year}/{now.month:02d}/{filename}"

    return ApiResponse(data={"url": url, "filename": filename})
