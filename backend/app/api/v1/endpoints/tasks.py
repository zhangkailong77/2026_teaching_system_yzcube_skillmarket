from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps.admin_auth import get_user_permission_codes
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.hall_user import HallUser
from app.models.task import Task
from app.models.task_claim import TaskClaim
from app.models.user import User
from app.schemas.task import MyTaskItem, MyTaskListResponse, TaskClaimResponse, TaskListResponse, TaskPublic

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
            selection_mode=row.selection_mode,
            accept_quota=row.accept_quota,
            enterprise_name=(row.enterprise_name or (row.publisher.username if row.publisher else '未知企业')),
            tags_json=row.tags_json,
            attachments_json=row.attachments_json,
            created_at=row.created_at,
        )
        for row in rows
    ]

    return TaskListResponse(items=items, total=total, page=page, page_size=page_size)


def _get_current_user_for_claim(
    db: Session,
    authorization: str | None,
) -> tuple[User, str, str]:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='missing bearer token')

    token = authorization.split(' ', 1)[1]
    try:
        payload = decode_access_token(token)
        subject = str(payload['sub'])
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid access token') from exc

    if subject.startswith('hall:'):
        try:
            hall_user_id = int(subject.split(':', 1)[1])
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid access token') from exc
        hall_user = db.query(HallUser).filter(HallUser.id == hall_user_id).first()
        if not hall_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid access token')
        user = db.query(User).filter(User.username == hall_user.username).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid access token')
        return user, hall_user.school_id, hall_user.source_user_id

    try:
        user_id = int(subject)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid access token') from exc
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid access token')

    hall_user = db.query(HallUser).filter(HallUser.username == user.username).first()
    if hall_user:
        return user, hall_user.school_id, hall_user.source_user_id
    return user, 'local', str(user.id)


@router.post('/{task_id}/claim', response_model=TaskClaimResponse)
def claim_task(
    task_id: int,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> TaskClaimResponse:
    user, school_id, source_user_id = _get_current_user_for_claim(db, authorization)
    permission_codes = get_user_permission_codes(db, user.id)
    can_claim = 'hall.task.claim' in permission_codes
    if not can_claim:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='no claim permission')

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='task not found')
    if task.status != 'open':
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='task not claimable')
    if task.deadline_at <= datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='task expired')

    existing_claim = (
        db.query(TaskClaim)
        .filter(TaskClaim.task_id == task.id, TaskClaim.claimer_user_id == user.id)
        .first()
    )
    if existing_claim:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='already claimed')

    claim = TaskClaim(
        task_id=task.id,
        claimer_user_id=user.id,
        claimer_school_id=school_id,
        claimer_source_user_id=source_user_id,
        status='claimed',
    )

    db.add(claim)
    db.commit()
    db.refresh(claim)

    return TaskClaimResponse(task_id=task.id, claim_id=claim.id)


@router.get('/my', response_model=MyTaskListResponse)
def my_tasks(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> MyTaskListResponse:
    user, _, _ = _get_current_user_for_claim(db, authorization)
    rows = (
        db.query(TaskClaim, Task)
        .join(Task, Task.id == TaskClaim.task_id)
        .filter(TaskClaim.claimer_user_id == user.id)
        .order_by(TaskClaim.created_at.desc())
        .all()
    )

    items = [
        MyTaskItem(
            claim_id=claim.id,
            task_id=task.id,
            title=task.title,
            enterprise_name=(task.enterprise_name or (task.publisher.username if task.publisher else '未知企业')),
            category=task.category,
            bounty_points=task.bounty_points,
            claim_status=claim.status,
            deadline_at=task.deadline_at,
            claimed_at=claim.claimed_at,
        )
        for claim, task in rows
    ]
    return MyTaskListResponse(items=items)
