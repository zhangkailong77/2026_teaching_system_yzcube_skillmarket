from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    refresh_tokens = relationship('RefreshToken', back_populates='user', cascade='all, delete-orphan')
    published_tasks = relationship('Task', back_populates='publisher', cascade='all, delete-orphan')
    task_claims = relationship('TaskClaim', back_populates='claimer', cascade='all, delete-orphan')
    task_favorites = relationship('TaskFavorite', back_populates='user', cascade='all, delete-orphan')
    user_roles = relationship('UserRole', foreign_keys='UserRole.user_id', back_populates='user', cascade='all, delete-orphan')
