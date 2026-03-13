from datetime import datetime

from pydantic import BaseModel


class TaskPublic(BaseModel):
    id: int
    title: str
    category: str
    description: str
    bounty_points: int
    required_score: int
    deadline_at: datetime
    status: str
    enterprise_name: str
    tags_json: dict | list | None = None
    attachments_json: dict | list | None = None
    created_at: datetime


class TaskListResponse(BaseModel):
    items: list[TaskPublic]
    total: int
    page: int
    page_size: int
