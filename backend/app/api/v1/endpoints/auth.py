from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.hall_user import HallUser
from app.models.rbac import Role, UserRole
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPairResponse,
    UserPublic,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix='/auth', tags=['auth'])


def _get_role_codes(db: Session, user_id: int) -> list[str]:
    rows = (
        db.query(Role.code)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user_id, UserRole.is_active.is_(True))
        .all()
    )
    return [code for (code,) in rows]


@router.post('/register', response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> UserPublic:
    user = AuthService(db).register(username=payload.username, password=payload.password)
    return UserPublic(id=user.id, username=user.username, roles=_get_role_codes(db, user.id))


@router.post('/login', response_model=TokenPairResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenPairResponse:
    access_token, refresh_token = AuthService(db).login(payload.username, payload.password)
    return TokenPairResponse(access_token=access_token, refresh_token=refresh_token)


@router.post('/refresh', response_model=TokenPairResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenPairResponse:
    access_token, refresh_token = AuthService(db).refresh(payload.refresh_token)
    return TokenPairResponse(access_token=access_token, refresh_token=refresh_token)


@router.get('/me', response_model=UserPublic)
def me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> UserPublic:
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
        linked_user = db.query(User).filter(User.username == hall_user.username).first()
        if linked_user:
            roles = _get_role_codes(db, linked_user.id)
        else:
            roles = ['school_member']
        return UserPublic(id=hall_user.id, username=hall_user.username, roles=roles)

    try:
        user_id = int(subject)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid access token') from exc

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid access token')

    return UserPublic(id=user.id, username=user.username, roles=_get_role_codes(db, user.id))
