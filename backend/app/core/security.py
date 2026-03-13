from datetime import UTC, datetime, timedelta
import hmac
import hashlib
import secrets

import bcrypt
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(
    schemes=['pbkdf2_sha256', 'bcrypt'],
    deprecated='auto',
)
settings = get_settings()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        if password_hash.startswith(('$2a$', '$2b$', '$2y$')):
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        return pwd_context.verify(password, password_hash)
    except Exception:
        return False


def create_access_token(subject: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {'sub': subject, 'exp': expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    secrets_to_try = [settings.jwt_secret_key]
    if settings.session_secret and settings.session_secret != settings.jwt_secret_key:
        secrets_to_try.append(settings.session_secret)

    for secret in secrets_to_try:
        try:
            return jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])
        except JWTError:
            continue
    raise ValueError('invalid access token')


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def hmac_sha256_hex(secret: str, message: str) -> str:
    return hmac.new(secret.encode('utf-8'), message.encode('utf-8'), hashlib.sha256).hexdigest()


def secure_equals(left: str, right: str) -> bool:
    return hmac.compare_digest(left, right)
