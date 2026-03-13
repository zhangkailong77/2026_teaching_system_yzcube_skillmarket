from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TaskClaim(Base):
    __tablename__ = 'task_claims'
    __table_args__ = (
        UniqueConstraint('task_id', 'claimer_user_id', name='uq_task_claim_task_user'),
        Index('ix_task_claims_task_status', 'task_id', 'status'),
        Index('ix_task_claims_user_status', 'claimer_user_id', 'status'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(ForeignKey('tasks.id', ondelete='CASCADE'), index=True)
    claimer_user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    claimer_school_id: Mapped[str] = mapped_column(String(64), index=True)
    claimer_source_user_id: Mapped[str] = mapped_column(String(128), index=True)
    status: Mapped[str] = mapped_column(String(20), default='claimed', index=True)
    submission_text: Mapped[str | None] = mapped_column(String(3000), nullable=True)
    submission_attachments_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    claimed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    settlement_points: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    task = relationship('Task', back_populates='claims')
    claimer = relationship('User', back_populates='task_claims')
