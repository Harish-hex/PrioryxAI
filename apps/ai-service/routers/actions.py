from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from auth import verify_internal_secret
from db import get_db
from services import action_engine, graph_engine, score_engine

router = APIRouter(prefix="/actions", tags=["actions"], dependencies=[Depends(verify_internal_secret)])


@router.get("/{user_id}")
def list_actions(user_id: str, db: Client = Depends(get_db)) -> dict:
    resp = (
        db.table("actions")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "pending")
        .order("priority_rank")
        .execute()
    )
    return {"actions": resp.data}


@router.post("/{user_id}/generate")
def generate_actions(user_id: str, db: Client = Depends(get_db)) -> dict:
    graph = graph_engine.fetch_career_graph(db, user_id)
    if graph is None:
        raise HTTPException(status_code=404, detail="No career_graph row for this user")

    total, breakdown = score_engine.compute_score(graph)
    graph_engine.persist_score(db, user_id, total, breakdown)

    actions = action_engine.generate_actions(graph, breakdown)
    if not actions:
        return {"actions": []}

    rows = [
        {
            "user_id": a.user_id,
            "title": a.title,
            "description": a.description,
            "category": a.category.value,
            "priority_rank": a.priority_rank,
            "impact_score": a.impact_score,
            "effort_minutes": a.effort_minutes,
            "reasoning": a.reasoning,
            "status": a.status.value,
            "expires_at": a.expires_at.isoformat() if a.expires_at else None,
        }
        for a in actions
    ]
    resp = db.table("actions").insert(rows).execute()
    return {"actions": resp.data}


@router.post("/{action_id}/complete")
def complete_action(action_id: str, db: Client = Depends(get_db)) -> dict:
    resp = (
        db.table("actions")
        .update({"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", action_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Action not found")

    user_id = resp.data[0]["user_id"]
    graph = graph_engine.fetch_career_graph(db, user_id)
    if graph is not None:
        total, breakdown = score_engine.compute_score(graph)
        graph_engine.persist_score(db, user_id, total, breakdown)

    return {"action": resp.data[0]}
