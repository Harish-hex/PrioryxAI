"""
Fetches and persists the Student Digital Twin (career_graph table) via the
Supabase service-role client. This is the only place in ai-service that
talks to `career_graph` directly - routers call through here rather than
touching the Supabase client themselves.
"""

from datetime import datetime, timezone

from supabase import Client

from models.career_graph import CareerGraph, ScoreBreakdown


def _row_to_career_graph(row: dict) -> CareerGraph:
    breakdown_data = row.get("score_breakdown") or {}
    return CareerGraph(
        id=row.get("id"),
        user_id=row["user_id"],
        skills={},  # populated from row.get("skills") once skill-embedding lands (Phase 2)
        github_username=row.get("github_username"),
        github_health_score=row.get("github_health_score"),
        github_data=row.get("github_data") or {},
        github_last_synced_at=row.get("github_last_synced_at"),
        leetcode_username=row.get("leetcode_username"),
        hackerrank_username=row.get("hackerrank_username"),
        dsa_score=row.get("dsa_score"),
        dsa_data=row.get("dsa_data") or {},
        academic_data=row.get("academic_data") or {},
        calendar_connected=row.get("calendar_connected") or False,
        resume_url=row.get("resume_url"),
        resume_parsed_at=row.get("resume_parsed_at"),
        resume_skills=row.get("resume_skills") or [],
        resume_score=row.get("resume_score"),
        resume_data=row.get("resume_data") or {},
        career_state=row.get("career_state") or {},
        behavior_data=row.get("behavior_data") or {},
        readiness_score=row.get("readiness_score"),
        score_breakdown=ScoreBreakdown(**breakdown_data) if breakdown_data else ScoreBreakdown(),
        score_last_calculated_at=row.get("score_last_calculated_at"),
    )


def fetch_career_graph(db: Client, user_id: str) -> CareerGraph | None:
    resp = db.table("career_graph").select("*").eq("user_id", user_id).limit(1).execute()
    if not resp.data:
        return None
    return _row_to_career_graph(resp.data[0])


def persist_score(db: Client, user_id: str, readiness_score: int, breakdown: ScoreBreakdown) -> None:
    now = datetime.now(timezone.utc).isoformat()
    db.table("career_graph").update({
        "readiness_score": readiness_score,
        "score_breakdown": breakdown.model_dump(),
        "score_last_calculated_at": now,
    }).eq("user_id", user_id).execute()

    db.table("score_history").insert({
        "user_id": user_id,
        "readiness_score": readiness_score,
        "score_breakdown": breakdown.model_dump(),
    }).execute()
