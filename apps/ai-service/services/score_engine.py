"""
Readiness Score engine - pure, deterministic, no I/O. All inputs come from
an already-fetched CareerGraph (see graph_engine.py for the DB fetch).

Weights match the spec's 7 dimensions exactly:
  Technical Skills 20% | Coding/DSA 20% | Projects & Portfolio 20% |
  GitHub Activity 15% | Resume Quality 10% | Interview Readiness 10% |
  Consistency 5%

Honesty note: `career_graph` currently carries one GitHub evidence source
(github_health_score) rather than separate "portfolio quality" and
"activity" signals - Phase 2's graph_engine skill-embedding work is what
splits those cleanly. Until then, both dimensions read the same value
rather than fabricating a second number. Dimensions with no evidence at
all yet (interview_readiness, consistency) score 0, not a guessed value -
0 is an honest floor for missing evidence, not mock data.
"""

from models.career_graph import CareerGraph, ScoreBreakdown

SCORE_VERSION = 1

WEIGHTS: dict[str, float] = {
    "technical_skills": 0.20,
    "coding_dsa": 0.20,
    "projects_portfolio": 0.20,
    "github_activity": 0.15,
    "resume_quality": 0.10,
    "interview_readiness": 0.10,
    "consistency": 0.05,
}


def _clamp(value: float) -> int:
    return max(0, min(100, round(value)))


def compute_score(career_graph: CareerGraph) -> tuple[int, ScoreBreakdown]:
    skill_scores = [s.score for s in career_graph.skills.values()]
    technical_skills = (
        sum(skill_scores) / len(skill_scores)
        if skill_scores
        else (career_graph.resume_score or 0)
    )

    coding_dsa = career_graph.dsa_score or 0

    github_signal = career_graph.github_health_score or 0
    projects_portfolio = github_signal
    github_activity = github_signal

    resume_quality = career_graph.resume_score or 0

    interview_readiness = 0

    consistency_raw = career_graph.behavior_data.get("nba_completion_rate")
    if isinstance(consistency_raw, (int, float)):
        consistency = _clamp(consistency_raw * 100 if consistency_raw <= 1 else consistency_raw)
    else:
        consistency = 0

    breakdown = ScoreBreakdown(
        technical_skills=_clamp(technical_skills),
        coding_dsa=_clamp(coding_dsa),
        projects_portfolio=_clamp(projects_portfolio),
        github_activity=_clamp(github_activity),
        resume_quality=_clamp(resume_quality),
        interview_readiness=_clamp(interview_readiness),
        consistency=consistency,
    )

    total = _clamp(
        breakdown.technical_skills * WEIGHTS["technical_skills"]
        + breakdown.coding_dsa * WEIGHTS["coding_dsa"]
        + breakdown.projects_portfolio * WEIGHTS["projects_portfolio"]
        + breakdown.github_activity * WEIGHTS["github_activity"]
        + breakdown.resume_quality * WEIGHTS["resume_quality"]
        + breakdown.interview_readiness * WEIGHTS["interview_readiness"]
        + breakdown.consistency * WEIGHTS["consistency"]
    )

    return total, breakdown


def weakest_dimension(breakdown: ScoreBreakdown) -> str:
    """Used by action_engine to bias NBA generation toward the biggest gap."""
    values = breakdown.model_dump()
    return min(values, key=lambda k: values[k])
