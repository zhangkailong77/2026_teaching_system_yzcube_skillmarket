from fastapi import FastAPI

from app.api.v1.api import api_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.models import RefreshToken, User

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)


@app.get('/', tags=['root'])
def root() -> dict[str, str]:
    return {'message': 'YZCube SkillMarket API is running'}


@app.on_event('startup')
def startup() -> None:
    # Import side effect keeps SQLAlchemy models registered before create_all.
    _ = (User, RefreshToken)
    Base.metadata.create_all(bind=engine)


app.include_router(api_router, prefix=settings.api_v1_prefix)
