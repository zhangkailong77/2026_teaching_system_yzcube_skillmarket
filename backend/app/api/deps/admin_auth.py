from collections.abc import Callable

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.rbac import Permission, Role, RolePermission, UserRole
from app.models.user import User


def get_current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='missing bearer token')

    token = authorization.split(' ', 1)[1]
    try:
        payload = decode_access_token(token)
        subject = str(payload['sub'])
        if subject.startswith('hall:'):
            raise ValueError('hall session is not allowed for admin API')
        user_id = int(subject)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid access token') from exc

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid access token')
    return user


def get_user_permission_codes(db: Session, user_id: int) -> set[str]:
    rows = (
        db.query(Permission.code)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user_id, UserRole.is_active.is_(True))
        .all()
    )
    return {code for (code,) in rows}


def require_permissions(*required: str) -> Callable:
    def dependency(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        permissions = get_user_permission_codes(db, current_user.id)
        missing = [code for code in required if code not in permissions]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f'permission denied: missing {",".join(missing)}',
            )
        return current_user

    return dependency
