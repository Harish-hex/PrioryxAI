from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from auth import verify_internal_secret
from db import get_db
from services import claude_client, graph_engine

router = APIRouter(prefix="/graph", tags=["graph"], dependencies=[Depends(verify_internal_secret)])


class AskRequest(BaseModel):
    question: str


@router.get("/{user_id}")
def get_graph(user_id: str, db: Client = Depends(get_db)) -> dict:
    graph = graph_engine.fetch_career_graph(db, user_id)
    if graph is None:
        raise HTTPException(status_code=404, detail="No career_graph row for this user")
    return graph.model_dump()


@router.post("/{user_id}/ask")
def ask(user_id: str, body: AskRequest, db: Client = Depends(get_db)) -> dict:
    graph = graph_engine.fetch_career_graph(db, user_id)
    if graph is None:
        raise HTTPException(status_code=404, detail="No career_graph row for this user")
    answer = claude_client.ask(graph, body.question)
    return {"answer": answer}
