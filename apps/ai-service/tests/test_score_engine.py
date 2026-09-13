from models.career_graph import CareerGraph
from services.score_engine import compute_score, weakest_dimension


def test_empty_graph_scores_zero():
    graph = CareerGraph(user_id="test-user")
    total, breakdown = compute_score(graph)
    assert total == 0
    assert breakdown.technical_skills == 0
    assert weakest_dimension(breakdown) is not None


def test_populated_graph_scores_in_range():
    graph = CareerGraph(
        user_id="test-user",
        github_health_score=80,
        dsa_score=65,
        resume_score=70,
    )
    total, breakdown = compute_score(graph)
    assert 0 <= total <= 100
    assert breakdown.coding_dsa == 65
    assert breakdown.resume_quality == 70
    # github_health_score feeds both projects_portfolio and github_activity
    # (documented approximation until Phase 2 splits the evidence source)
    assert breakdown.projects_portfolio == 80
    assert breakdown.github_activity == 80


def test_weakest_dimension_picks_lowest():
    graph = CareerGraph(user_id="test-user", dsa_score=90, resume_score=90, github_health_score=90)
    _total, breakdown = compute_score(graph)
    # interview_readiness and consistency have no evidence source yet, so
    # they stay at 0 and should be reported as the weakest dimension.
    assert weakest_dimension(breakdown) in ("interview_readiness", "consistency")
