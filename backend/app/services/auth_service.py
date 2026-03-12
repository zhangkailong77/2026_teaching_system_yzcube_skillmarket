from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User

settings = get_settings()


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, username: str, password: str) -> User:
        existing = self.db.query(User).filter(User.username == username).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='username already exists')

        user = User(username=username, password_hash=hash_password(password))
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def login(self, username: str, password: str) -> tuple[str, str]:
        user = self.db.query(User).filter(User.username == username).first()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid credentials')
        return self._issue_token_pair(user)

    def refresh(self, raw_refresh_token: str) -> tuple[str, str]:
        token_hash = hash_refresh_token(raw_refresh_token)
        token = self.db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
        now = datetime.utcnow()
        if not token or token.revoked or token.expires_at < now:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid refresh token')

        token.revoked = True
        self.db.commit()

        user = self.db.query(User).filter(User.id == token.user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='invalid refresh token')

        return self._issue_token_pair(user)

    def _issue_token_pair(self, user: User) -> tuple[str, str]:
        access_token = create_access_token(subject=str(user.id))
        raw_refresh_token = generate_refresh_token()
        refresh = RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(raw_refresh_token),
            expires_at=datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days),
            revoked=False,
        )
        self.db.add(refresh)
        self.db.commit()
        return access_token, raw_refresh_token
