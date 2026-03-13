from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.task import Task
from app.schemas.task import TaskListResponse, TaskPublic

router = APIRouter(prefix='/tasks', tags=['tasks'])


@router.get('', response_model=TaskListResponse)
def list_tasks(
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    bounty_min: int | None = Query(default=None, ge=0),
    bounty_max: int | None = Query(default=None, ge=0),
    min_score: int | None = Query(default=None, ge=0),
    deadline_days: int | None = Query(default=None, ge=1),
    sort: str = Query(default='latest'),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    include_closed: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> TaskListResponse:
    query = db.query(Task)

    if not include_closed:
        query = query.filter(Task.status == 'open')
    if q:
        keyword = f'%{q.strip()}%'
        query = query.filter((Task.title.like(keyword)) | (Task.description.like(keyword)) | (Task.category.like(keyword)))
    if category:
        query = query.filter(Task.category == category)
    if bounty_min is not None:
        query = query.filter(Task.bounty_points >= bounty_min)
    if bounty_max is not None:
        query = query.filter(Task.bounty_points <= bounty_max)
    if min_score is not None:
        query = query.filter(Task.required_score >= min_score)
    if deadline_days is not None:
        end_time = datetime.now(UTC) + timedelta(days=deadline_days)
        query = query.filter(Task.deadline_at <= end_time)

    if sort == 'bounty_desc':
        query = query.order_by(Task.bounty_points.desc(), Task.created_at.desc())
    elif sort == 'deadline_asc':
        query = query.order_by(Task.deadline_at.asc(), Task.created_at.desc())
    else:
        query = query.order_by(Task.created_at.desc())

    total = query.count()
    offset = (page - 1) * page_size
    rows = query.offset(offset).limit(page_size).all()

    items = [
        TaskPublic(
            id=row.id,
            title=row.title,
            category=row.category,
            description=row.description,
            bounty_points=row.bounty_points,
            required_score=row.required_score,
            deadline_at=row.deadline_at,
            status=row.status,
            enterprise_name=(row.publisher.username if row.publisher else '未知企业'),
            tags_json=row.tags_json,
            attachments_json=row.attachments_json,
            created_at=row.created_at,
        )
        for row in rows
    ]

    return TaskListResponse(items=items, total=total, page=page, page_size=page_size)
