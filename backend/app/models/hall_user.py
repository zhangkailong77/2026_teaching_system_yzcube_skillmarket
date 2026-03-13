from datetime import datetime

from sqlalchemy import DateTime, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HallUser(Base):
    __tablename__ = 'hall_users'
    __table_args__ = (UniqueConstraint('school_id', 'source_user_id', name='uq_hall_user_school_source'),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    school_id: Mapped[str] = mapped_column(String(64), index=True)
    source_user_id: Mapped[str] = mapped_column(String(128), index=True)
    username: Mapped[str] = mapped_column(String(128), index=True)
    role: Mapped[str] = mapped_column(String(64), default='student')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
