from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class SkillEvidence(BaseModel):
    score: int = Field(ge=0, le=100)
    evidence: list[str] = Field(default_factory=list)
    last_demonstrated: datetime | None = None
    trajectory: Literal["improving", "stable", "declining"] | None = None


class ScoreBreakdown(BaseModel):
    """The 7 readiness-score dimensions, each 0-100."""

    technical_skills: int = Field(ge=0, le=100, default=0)
    coding_dsa: int = Field(ge=0, le=100, default=0)
    projects_portfolio: int = Field(ge=0, le=100, default=0)
    github_activity: int = Field(ge=0, le=100, default=0)
    resume_quality: int = Field(ge=0, le=100, default=0)
    interview_readiness: int = Field(ge=0, le=100, default=0)
    consistency: int = Field(ge=0, le=100, default=0)


class CareerGraph(BaseModel):
    """Mirrors the `career_graph` table (public.career_graph)."""

    id: str | None = None
    user_id: str

    skills: dict[str, SkillEvidence] = Field(default_factory=dict)

    github_username: str | None = None
    github_health_score: int | None = None
    github_data: dict[str, Any] = Field(default_factory=dict)
    github_last_synced_at: datetime | None = None

    leetcode_username: str | None = None
    hackerrank_username: str | None = None
    dsa_score: int | None = None
    dsa_data: dict[str, Any] = Field(default_factory=dict)

    academic_data: dict[str, Any] = Field(default_factory=dict)
    calendar_connected: bool = False

    resume_url: str | None = None
    resume_parsed_at: datetime | None = None
    resume_skills: list[str] = Field(default_factory=list)
    resume_score: int | None = None
    resume_data: dict[str, Any] = Field(default_factory=dict)

    career_state: dict[str, Any] = Field(default_factory=dict)
    behavior_data: dict[str, Any] = Field(default_factory=dict)

    readiness_score: int | None = None
    score_breakdown: ScoreBreakdown = Field(default_factory=ScoreBreakdown)
    score_last_calculated_at: datetime | None = None

    def to_context_string(self) -> str:
        """
        Serialize for LLM context - token-efficient, evidence-first, no
        raw jsonb blobs (those are for the score/action engines, not the
        prompt). This is what every Claude call in claude_client.py
        includes as system context, per the spec's rule that no AI call
        may reason without the student's full state.
        """
        lines = [
            f"User: {self.user_id}",
            f"Readiness score: {self.readiness_score if self.readiness_score is not None else 'not yet computed'}/100",
        ]
        if self.readiness_score is not None:
            b = self.score_breakdown
            lines.append(
                "Breakdown: "
                f"technical={b.technical_skills}, coding/dsa={b.coding_dsa}, "
                f"projects={b.projects_portfolio}, github={b.github_activity}, "
                f"resume={b.resume_quality}, interview={b.interview_readiness}, "
                f"consistency={b.consistency}"
            )
        if self.github_username:
            lines.append(
                f"GitHub: @{self.github_username}, health score "
                f"{self.github_health_score if self.github_health_score is not None else 'unknown'}"
            )
        if self.leetcode_username:
            lines.append(f"LeetCode: @{self.leetcode_username}, DSA score {self.dsa_score}")
        if self.resume_skills:
            lines.append(f"Resume skills: {', '.join(self.resume_skills[:20])}")
        if self.skills:
            top = sorted(self.skills.items(), key=lambda kv: kv[1].score, reverse=True)[:10]
            lines.append(
                "Top evidenced skills: "
                + ", ".join(f"{name} ({ev.score}/100)" for name, ev in top)
            )
        return "\n".join(lines)
