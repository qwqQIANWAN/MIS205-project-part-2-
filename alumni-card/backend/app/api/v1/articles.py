from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.article import Article, Interview
from app.schemas.article import (
    ArticleCreate,
    ArticleUpdate,
    ArticleListItem,
    ArticleDetailOut,
    InterviewCreate,
    InterviewUpdate,
    InterviewListItem,
    InterviewDetailOut,
)
from app.schemas.common import ApiResponse, PaginatedData
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()


@router.get("", response_model=ApiResponse[PaginatedData[ArticleListItem]])
async def list_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Article).where(Article.is_published == True)
    count_query = (
        select(func.count())
        .select_from(Article)
        .where(Article.is_published == True)
    )

    if category:
        query = query.where(Article.category == category)
        count_query = count_query.where(Article.category == category)

    total = (await db.execute(count_query)).scalar()

    offset = (page - 1) * page_size
    query = (
        query.order_by(Article.sort_order.desc(), Article.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = (await db.execute(query)).scalars().all()

    item_list = [ArticleListItem.model_validate(item) for item in items]

    return ApiResponse(
        data=PaginatedData(
            items=item_list, total=total, page=page, page_size=page_size
        )
    )


@router.get("/{id}", response_model=ApiResponse[ArticleDetailOut])
async def get_article_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Article).where(Article.id == id))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在"
        )

    article.view_count = (article.view_count or 0) + 1
    await db.commit()
    await db.refresh(article)

    return ApiResponse(data=ArticleDetailOut.model_validate(article))


@router.post("", response_model=ApiResponse[ArticleDetailOut])
async def create_article(
    request: ArticleCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    article = Article(**request.model_dump())
    db.add(article)
    await db.commit()
    await db.refresh(article)

    return ApiResponse(
        data=ArticleDetailOut.model_validate(article),
        message="创建成功",
    )


@router.put("/{id}", response_model=ApiResponse[ArticleDetailOut])
async def update_article(
    id: int,
    request: ArticleUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Article).where(Article.id == id))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在"
        )

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(article, key, value)

    await db.commit()
    await db.refresh(article)

    return ApiResponse(
        data=ArticleDetailOut.model_validate(article),
        message="更新成功",
    )


@router.delete("/{id}", response_model=ApiResponse[str])
async def delete_article(
    id: int,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Article).where(Article.id == id))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在"
        )

    await db.delete(article)
    await db.commit()

    return ApiResponse(message="删除成功")
