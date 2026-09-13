"""
Next Best Action engine - rule-based generation + priority ranking.

Priority = (Impact x Urgency x Leverage) / Effort, per the spec. Each rule
below sets its own Impact/Urgency/Leverage/Effort based on what the
career_graph actually shows - a rule that has no supporting evidence in
the graph simply does not fire, rather than emitting a generic action
with invented numbers.
"""

from datetime import datetime, timedelta, timezone

from models.action import Action, ActionCategory
from models.career_graph import CareerGraph, ScoreBreakdown
from services.score_engine import weakest_dimension


def _priority(impact: float, urgency: float, leverage: float, effort: float) -> float:
    effort = max(effort, 1.0)
    return (impact * urgency * leverage) / effort


def generate_actions(career_graph: CareerGraph, breakdown: ScoreBreakdown) -> list[Action]:
    now = datetime.now(timezone.utc)
    candidates: list[tuple[float, Action]] = []
    weak = weakest_dimension(breakdown)

    # --- GitHub rules ---
    last_synced = career_graph.github_last_synced_at
    stale_github = last_synced is None or (now - last_synced) > timedelta(days=7)
    if career_graph.github_username and stale_github:
        p = _priority(impact=4, urgency=6, leverage=3, effort=2)
        candidates.append((p, Action(
            user_id=career_graph.user_id,
            title="Push to any active project today",
            description=(
                "No recent GitHub activity detected. A visible commit streak is one of "
                "the cheapest signals recruiters and the readiness score both weight."
            ),
            category=ActionCategory.github,
            priority_rank=0,
            impact_score=4,
            effort_minutes=20,
            reasoning="No GitHub sync/commit activity detected in the last 7 days.",
            expires_at=now + timedelta(days=2),
        )))

    if career_graph.github_health_score is not None and career_graph.github_health_score < 70:
        p = _priority(impact=6, urgency=5, leverage=4, effort=3)
        candidates.append((p, Action(
            user_id=career_graph.user_id,
            title="Improve your weakest GitHub repo's README",
            description=(
                "Your GitHub health score is below 70. A missing or thin README is one "
                "of the most common gaps the analyzer flags, and one of the fastest to fix."
            ),
            category=ActionCategory.github,
            priority_rank=0,
            impact_score=6,
            effort_minutes=30,
            reasoning=f"GitHub health score is {career_graph.github_health_score}/100 (below 70 threshold).",
            expires_at=now + timedelta(days=7),
        )))

    # --- DSA rules ---
    if career_graph.dsa_score is not None and career_graph.dsa_score < 60:
        p = _priority(impact=5, urgency=6, leverage=5, effort=4)
        candidates.append((p, Action(
            user_id=career_graph.user_id,
            title="Solve 2 problems in your weakest DSA topic",
            description=(
                "Your DSA score is below the interview-readiness threshold of 60. "
                "Two focused problems in a weak topic moves this faster than random practice."
            ),
            category=ActionCategory.dsa,
            priority_rank=0,
            impact_score=5,
            effort_minutes=45,
            reasoning=f"DSA score is {career_graph.dsa_score}/100 (below 60 interview-readiness threshold).",
            expires_at=now + timedelta(days=1),
        )))

    total_solved = career_graph.dsa_data.get("total_solved") if career_graph.dsa_data else None
    if isinstance(total_solved, int) and total_solved < 100:
        p = _priority(impact=7, urgency=3, leverage=4, effort=5)
        candidates.append((p, Action(
            user_id=career_graph.user_id,
            title="Reach 100 solved problems milestone",
            description=f"You've solved {total_solved} problems. 100 is a common resume/interview screening threshold.",
            category=ActionCategory.dsa,
            priority_rank=0,
            impact_score=7,
            effort_minutes=60,
            reasoning=f"Only {total_solved} problems solved so far (milestone: 100).",
            expires_at=now + timedelta(days=14),
        )))

    # --- Resume rules ---
    if career_graph.resume_score is None:
        p = _priority(impact=8, urgency=8, leverage=6, effort=3)
        candidates.append((p, Action(
            user_id=career_graph.user_id,
            title="Upload your resume for analysis",
            description="No resume on file yet - this blocks resume-quality scoring and job matching entirely.",
            category=ActionCategory.resume,
            priority_rank=0,
            impact_score=8,
            effort_minutes=10,
            reasoning="career_graph.resume_score is null - no resume has been uploaded.",
            expires_at=now + timedelta(days=3),
        )))
    elif career_graph.resume_score < 70:
        p = _priority(impact=6, urgency=4, leverage=4, effort=4)
        candidates.append((p, Action(
            user_id=career_graph.user_id,
            title="Add quantified results to your resume",
            description=(
                f"Resume score is {career_graph.resume_score}/100. Quantified impact statements "
                "(numbers, %, scale) are the single biggest lever on resume-quality scoring."
            ),
            category=ActionCategory.resume,
            priority_rank=0,
            impact_score=6,
            effort_minutes=30,
            reasoning=f"Resume score is {career_graph.resume_score}/100 (below 70).",
            expires_at=now + timedelta(days=7),
        )))

    # --- Weakest-dimension nudge (only if nothing else fired for it) ---
    if not candidates and weak == "interview_readiness":
        p = _priority(impact=5, urgency=4, leverage=3, effort=3)
        candidates.append((p, Action(
            user_id=career_graph.user_id,
            title="Complete your first mock interview",
            description="Interview readiness has no evidence yet - this is the fastest way to start building it.",
            category=ActionCategory.interview,
            priority_rank=0,
            impact_score=5,
            effort_minutes=45,
            reasoning="interview_readiness dimension has no evidence (score 0) and is currently the weakest.",
            expires_at=now + timedelta(days=10),
        )))

    candidates.sort(key=lambda pair: pair[0], reverse=True)
    ranked: list[Action] = []
    for rank, (_priority_value, action) in enumerate(candidates, start=1):
        action.priority_rank = rank
        ranked.append(action)
    return ranked
