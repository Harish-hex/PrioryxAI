from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from auth import verify_internal_secret
from db import get_db
from services import graph_engine, score_engine

router = APIRouter(prefix="/score", tags=["score"], dependencies=[Depends(verify_internal_secret)])


@router.get("/{user_id}")
def get_score(user_id: str, db: Client = Depends(get_db)) -> dict:
    graph = graph_engine.fetch_career_graph(db, user_id)
    if graph is None:
        raise HTTPException(status_code=404, detail="No career_graph row for this user")
    return {
        "readiness_score": graph.readiness_score,
        "score_breakdown": graph.score_breakdown.model_dump(),
        "score_last_calculated_at": graph.score_last_calculated_at,
    }


@router.post("/{user_id}/recalculate")
def recalculate_score(user_id: str, db: Client = Depends(get_db)) -> dict:
    graph = graph_engine.fetch_career_graph(db, user_id)
    if graph is None:
        raise HTTPException(status_code=404, detail="No career_graph row for this user")

    total, breakdown = score_engine.compute_score(graph)
    graph_engine.persist_score(db, user_id, total, breakdown)

    return {"readiness_score": total, "score_breakdown": breakdown.model_dump()}
