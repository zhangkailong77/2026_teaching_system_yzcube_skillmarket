from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from jose import ExpiredSignatureError, JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password, hmac_sha256_hex, secure_equals
from app.db.session import get_db
from app.models.hall_user import HallUser
from app.models.user import User
from app.schemas.federation import (
    FederationExchangeRequest,
    FederationExchangeResponse,
    FederationUserPublic,
    FederationUserSyncRequest,
    FederationUserSyncResponse,
)
from app.services.replay_store import ReplayStore

sso_router = APIRouter(prefix='/hall/federation/sso', tags=['federation-sso'])
users_router = APIRouter(prefix='/hall/federation/users', tags=['federation-users'])
settings = get_settings()
replay_store = ReplayStore()


def _federation_verify_key() -> str:
    if settings.federation_public_key:
        return settings.federation_public_key
    if settings.federation_secret:
        return settings.federation_secret
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='federation key not configured')


def _upsert_user_mapping(
    db: Session,
    *,
    school_id: str,
    source_user_id: str,
    username: str,
    role: str,
    password_hash: str | None = None,
) -> tuple[User, HallUser]:
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        user = User(username=username, password_hash=password_hash or hash_password(source_user_id))
        db.add(user)
    elif password_hash:
        user.password_hash = password_hash

    hall_user = (
        db.query(HallUser)
        .filter(HallUser.school_id == school_id, HallUser.source_user_id == source_user_id)
        .first()
    )
    if hall_user is None:
        hall_user = HallUser(
            school_id=school_id,
            source_user_id=source_user_id,
            username=username,
            role=role,
        )
        db.add(hall_user)
    else:
        hall_user.username = username
        hall_user.role = role

    db.commit()
    db.refresh(user)
    db.refresh(hall_user)
    return user, hall_user


@sso_router.post('/exchange', response_model=FederationExchangeResponse)
def exchange_ticket(payload: FederationExchangeRequest, db: Session = Depends(get_db)) -> FederationExchangeResponse:
    try:
        claims = jwt.decode(
            payload.ticket,
            _federation_verify_key(),
            algorithms=['HS256', 'RS256'],
            audience=settings.federation_expected_aud,
            options={'require_exp': True, 'require_aud': True, 'verify_signature': True},
        )
    except ExpiredSignatureError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='ticket expired') from exc
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid ticket signature') from exc

    typ = str(claims.get('typ', '')).strip()
    if typ != 'federation_sso_ticket':
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid ticket type')

    issuer = str(claims.get('iss', '')).strip()
    if not issuer or issuer not in settings.federation_trusted_issuers:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='untrusted issuer')

    school_id = str(claims.get('school_id', '')).strip()
    source_user_id = str(claims.get('uid', '')).strip()
    username = str(claims.get('sub', '')).strip() or source_user_id
    role = str(claims.get('role', '')).strip() or 'student'
    jti = str(claims.get('jti', '')).strip()
    exp = int(claims.get('exp', 0) or 0)
    if not school_id or not source_user_id or not jti or exp <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='missing required claims')

    now_epoch = int(datetime.now(UTC).timestamp())
    ttl_seconds = max(1, exp - now_epoch)
    consumed = replay_store.consume_once(f'federation:jti:{jti}', ttl_seconds)
    if not consumed:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='ticket already used')

    _, hall_user = _upsert_user_mapping(
        db,
        school_id=school_id,
        source_user_id=source_user_id,
        username=username,
        role=role,
    )

    session_expires_at = datetime.now(UTC) + timedelta(minutes=settings.session_expire_minutes)
    session_token = jwt.encode(
        {
            'sub': f'hall:{hall_user.id}',
            'school_id': hall_user.school_id,
            'uid': hall_user.source_user_id,
            'username': hall_user.username,
            'role': hall_user.role,
            'typ': 'hall_session',
            'exp': session_expires_at,
        },
        settings.session_secret,
        algorithm=settings.jwt_algorithm,
    )

    return FederationExchangeResponse(
        access_token=session_token,
        expires_in=settings.session_expire_minutes * 60,
        user=FederationUserPublic(
            id=hall_user.id,
            school_id=hall_user.school_id,
            source_user_id=hall_user.source_user_id,
            username=hall_user.username,
            role=hall_user.role,
        ),
    )


@users_router.post('/sync', response_model=FederationUserSyncResponse)
def sync_user(payload: FederationUserSyncRequest, db: Session = Depends(get_db)) -> FederationUserSyncResponse:
    now_epoch = int(datetime.now(UTC).timestamp())
    if abs(now_epoch - int(payload.ts)) > settings.federation_sync_max_skew_seconds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='ts_out_of_window')

    if payload.school_id not in settings.federation_trusted_issuers:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='untrusted_school')

    sign_source = '|'.join(
        [
            payload.school_id,
            payload.uid,
            payload.username,
            payload.role,
            payload.password_hash or '',
            payload.password or '',
            str(payload.ts),
            payload.nonce,
        ]
    )
    expected_sign = hmac_sha256_hex(_federation_verify_key(), sign_source)
    if not secure_equals(expected_sign, payload.sign):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid_signature')

    nonce_key = f'federation:sync:nonce:{payload.school_id}:{payload.nonce}'
    nonce_exists = replay_store.exists(nonce_key)
    nonce_set_result = replay_store.set_once(
        nonce_key,
        settings.federation_sync_max_skew_seconds,
    )
    if not nonce_set_result:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='nonce_replayed')

    if not payload.password_hash and not payload.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='password or password_hash required')

    next_password_hash = payload.password_hash or hash_password(payload.password or '')
    _, hall_user = _upsert_user_mapping(
        db,
        school_id=payload.school_id,
        source_user_id=payload.uid,
        username=payload.username,
        role=payload.role or 'student',
        password_hash=next_password_hash,
    )
    return FederationUserSyncResponse(
        user=FederationUserPublic(
            id=hall_user.id,
            school_id=hall_user.school_id,
            source_user_id=hall_user.source_user_id,
            username=hall_user.username,
            role=hall_user.role,
        )
    )
