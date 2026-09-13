"""
Batch score recalculation, idempotent (recomputing the same career_graph
state always yields the same score - safe to retry or re-run). Intended
to be triggered by a scheduled job in apps/web (BullMQ/QStash) hitting an
admin endpoint, or run standalone for a full-table recompute:

    python -m workers.score_recalc

github_sync.py and dsa_sync.py from the original spec are intentionally
not included here: apps/web already has real, working sync code
(src/lib/github-sync.ts, src/lib/leetcode/*) with real callers. Duplicating
that in Python with no caller would be placeholder code with no purpose -
if a Python-side sync worker is ever needed, it should be built against a
concrete new requirement, not scaffolded speculatively.
"""

from db import get_db
from services import graph_engine, score_engine


def recalculate_all() -> int:
    db = get_db()
    resp = db.table("career_graph").select("user_id").execute()
    count = 0
    for row in resp.data:
        user_id = row["user_id"]
        graph = graph_engine.fetch_career_graph(db, user_id)
        if graph is None:
            continue
        total, breakdown = score_engine.compute_score(graph)
        graph_engine.persist_score(db, user_id, total, breakdown)
        count += 1
    return count


if __name__ == "__main__":
    n = recalculate_all()
    print(f"Recalculated readiness score for {n} users.")
