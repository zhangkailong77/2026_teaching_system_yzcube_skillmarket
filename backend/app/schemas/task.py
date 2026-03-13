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


class TaskClaimResponse(BaseModel):
    ok: bool = True
    task_id: int
    claim_id: int


class MyTaskItem(BaseModel):
    claim_id: int
    task_id: int
    title: str
    enterprise_name: str
    category: str
    bounty_points: int
    claim_status: str
    deadline_at: datetime
    claimed_at: datetime


class MyTaskListResponse(BaseModel):
    items: list[MyTaskItem]
