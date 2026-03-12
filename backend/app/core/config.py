from functools import lru_cache
import os

from pydantic import BaseModel


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


@lru_cache
def get_settings() -> Settings:
    return Settings()
