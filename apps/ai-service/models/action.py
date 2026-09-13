from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ActionCategory(str, Enum):
    github = "github"
    dsa = "dsa"
    project = "project"
    resume = "resume"
    academic = "academic"
    application = "application"
    interview = "interview"


class ActionStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    skipped = "skipped"


class Action(BaseModel):
    """Mirrors the `actions` table (public.actions)."""

    id: str | None = None
    user_id: str

    title: str = Field(max_length=120)
    description: str | None = None
    category: ActionCategory

    priority_rank: int
    impact_score: int = Field(ge=0, le=10)
    effort_minutes: int | None = None

    reasoning: str | None = None
    evidence: dict[str, Any] = Field(default_factory=dict)

    status: ActionStatus = ActionStatus.pending

    started_at: datetime | None = None
    completed_at: datetime | None = None
    expires_at: datetime | None = None

    metadata: dict[str, Any] = Field(default_factory=dict)
