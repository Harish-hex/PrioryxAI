"""
Phase 1 job matcher: exact/substring skill-name overlap. This is an
honest approximation, not the spec's Phase 2 sentence-transformers
semantic matching (SKILL_TAXONOMY + embeddings) - that requires the skill
graph built in graph_engine's Phase 2 work. Swapping the matching
strategy later does not change this function's signature.
"""

from models.career_graph import CareerGraph


def _normalize(skill: str) -> str:
    return skill.strip().lower()


def match_score(career_graph: CareerGraph, required_skills: list[str], preferred_skills: list[str]) -> tuple[int, list[str]]:
    """Returns (match_score 0-100, gap_skills)."""
    known = {_normalize(s) for s in career_graph.resume_skills}
    known |= {_normalize(name) for name in career_graph.skills.keys()}

    if not required_skills and not preferred_skills:
        return 0, []

    required_norm = [_normalize(s) for s in required_skills]
    preferred_norm = [_normalize(s) for s in preferred_skills]

    required_hits = sum(1 for s in required_norm if s in known)
    preferred_hits = sum(1 for s in preferred_norm if s in known)

    required_weight = 0.8
    preferred_weight = 0.2

    required_ratio = required_hits / len(required_norm) if required_norm else 1.0
    preferred_ratio = preferred_hits / len(preferred_norm) if preferred_norm else 1.0

    score = round((required_ratio * required_weight + preferred_ratio * preferred_weight) * 100)

    gap_skills = [s for s in required_skills if _normalize(s) not in known]
    return score, gap_skills
