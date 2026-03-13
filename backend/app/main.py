from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.api.v1.endpoints.federation import sso_router, users_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.models import AuditLog, HallUser, Permission, RefreshToken, Role, RolePermission, Task, TaskClaim, TaskFavorite, User, UserRole

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/', tags=['root'])
def root() -> dict[str, str]:
    return {'message': 'YZCube SkillMarket API is running'}


@app.on_event('startup')
def startup() -> None:
    # Import side effect keeps SQLAlchemy models registered before create_all.
    _ = (User, RefreshToken, HallUser, Task, TaskClaim, TaskFavorite, Role, Permission, RolePermission, UserRole, AuditLog)
    Base.metadata.create_all(bind=engine)


app.include_router(api_router, prefix=settings.api_v1_prefix)
app.include_router(sso_router)
app.include_router(users_router)
