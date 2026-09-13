from datetime import datetime

from pydantic import BaseModel


class StudentProfile(BaseModel):
    """Mirrors the `profiles` table (public.profiles)."""

    id: str
    email: str
    full_name: str | None = None
    username: str | None = None
    college: str | None = None
    graduation_year: int | None = None
    degree: str | None = None
    branch: str | None = None
    country: str = "IN"
    career_goal: str | None = None
    target_companies: list[str] = []
    onboarding_completed: bool = False
    created_at: datetime | None = None
