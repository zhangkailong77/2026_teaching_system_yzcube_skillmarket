from functools import lru_cache
import os
from pathlib import Path

from pydantic import BaseModel


def _parse_cors_origins(raw: str) -> list[str]:
    return [item.strip() for item in raw.split(',') if item.strip()]


def _load_local_env() -> None:
    env_path = Path(__file__).resolve().parents[2] / '.env'
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        # Local .env should be the source of truth for this project runtime.
        os.environ[key] = value


_load_local_env()


class Settings(BaseModel):
    app_name: str = os.getenv('APP_NAME', 'YZCube SkillMarket API')
    app_version: str = os.getenv('APP_VERSION', '0.1.0')
    api_v1_prefix: str = os.getenv('API_V1_PREFIX', '/api/v1')
    debug: bool = os.getenv('DEBUG', 'false').lower() == 'true'
    database_url: str = os.getenv(
        'DATABASE_URL',
        'sqlite:///./backend_local.db',
    )
    jwt_secret_key: str = os.getenv('JWT_SECRET_KEY', 'replace-this-in-production')
    jwt_algorithm: str = os.getenv('JWT_ALGORITHM', 'HS256')
    access_token_expire_minutes: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30'))
    refresh_token_expire_days: int = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', '7'))
    session_secret: str = os.getenv('SESSION_SECRET', os.getenv('JWT_SECRET_KEY', 'replace-this-in-production'))
    session_expire_minutes: int = int(os.getenv('SESSION_EXPIRE_MINUTES', '120'))
    redis_url: str = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/0')
    federation_public_key: str | None = os.getenv('FEDERATION_PUBLIC_KEY')
    federation_secret: str | None = os.getenv(
        'FEDERATION_SECRET',
        os.getenv('SESSION_SECRET', os.getenv('JWT_SECRET_KEY', 'replace-this-in-production')),
    )
    federation_expected_aud: str = os.getenv('FEDERATION_EXPECTED_AUD', 'yzcube-skillmarket')
    federation_trusted_issuers: list[str] = _parse_cors_origins(
        os.getenv('FEDERATION_TRUSTED_ISSUERS', 'teaching-yzcube-school')
    )
    federation_sync_max_skew_seconds: int = int(os.getenv('FEDERATION_SYNC_MAX_SKEW_SECONDS', '300'))
    cors_origins: list[str] = _parse_cors_origins(
        os.getenv(
            'CORS_ORIGINS',
            'http://localhost:3000,http://127.0.0.1:3000,http://192.168.31.66:3000',
        )
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
