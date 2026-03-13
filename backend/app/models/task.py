from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Task(Base):
    __tablename__ = 'tasks'
    __table_args__ = (
        Index('ix_tasks_status_category_deadline', 'status', 'category', 'deadline_at'),
        Index('ix_tasks_bounty_points', 'bounty_points'),
        Index('ix_tasks_created_at', 'created_at'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    school_id: Mapped[str] = mapped_column(String(64), index=True)
    publisher_user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    enterprise_name: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    category: Mapped[str] = mapped_column(String(32), index=True)
    description: Mapped[str] = mapped_column(Text)
    bounty_points: Mapped[int] = mapped_column(Integer, default=0)
    required_score: Mapped[int] = mapped_column(Integer, default=0)
    deadline_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    status: Mapped[str] = mapped_column(String(20), default='draft', index=True)
    max_claimants: Mapped[int] = mapped_column(Integer, default=1)
    claimed_count: Mapped[int] = mapped_column(Integer, default=0)
    tags_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    attachments_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    publisher = relationship('User', back_populates='published_tasks')
    claims = relationship('TaskClaim', back_populates='task', cascade='all, delete-orphan')
    favorites = relationship('TaskFavorite', back_populates='task', cascade='all, delete-orphan')
