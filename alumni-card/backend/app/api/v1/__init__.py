from fastapi import APIRouter
from app.api.v1 import auth, alumni, associations, appointments, activities, articles, interviews, teachers, upload

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(alumni.router, prefix="/alumni", tags=["校友"])
api_router.include_router(associations.router, prefix="/associations", tags=["地区校友会"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["老师"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["返校预约"])
api_router.include_router(activities.router, prefix="/activities", tags=["活动"])
api_router.include_router(articles.router, prefix="/articles", tags=["文章"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["校友风采"])
api_router.include_router(upload.router, prefix="/upload", tags=["文件上传"])
