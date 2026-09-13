"""
apps/web already extracts resume text/skills (pdf-parse/mammoth,
src/app/api/resume/process). ai-service's job is the reasoning layer -
running the SWOT analysis against the student's career goal - not
re-implementing PDF extraction.
"""

import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from auth import verify_internal_secret
from db import get_db
from services import claude_client, graph_engine

router = APIRouter(prefix="/resume", tags=["resume"], dependencies=[Depends(verify_internal_secret)])


class SwotRequest(BaseModel):
    resume_text: str
    skills: list[str]
    career_goal: str | None = None


@router.post("/{user_id}/swot")
def analyze_swot(user_id: str, body: SwotRequest, db: Client = Depends(get_db)) -> dict:
    graph = graph_engine.fetch_career_graph(db, user_id)
    if graph is None:
        raise HTTPException(status_code=404, detail="No career_graph row for this user")

    question = (
        "Run a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) on this "
        f"resume against the career goal '{body.career_goal or 'not specified'}'. "
        "Reply as strict JSON with exactly these keys: strengths, weaknesses, "
        "opportunities, threats - each a list of short strings.\n\n"
        f"Resume skills already extracted: {', '.join(body.skills)}\n\n"
        f"Resume text:\n{body.resume_text[:6000]}"
    )
    raw = claude_client.ask(graph, question, max_tokens=1024)

    try:
        swot = json.loads(raw)
    except json.JSONDecodeError:
        # Claude occasionally wraps JSON in prose despite instructions -
        # surface the raw text rather than silently losing the analysis.
        swot = {"raw": raw}

    db.table("career_graph").update({
        "resume_data": {**graph.resume_data, "swot": swot},
        "resume_skills": body.skills,
    }).eq("user_id", user_id).execute()

    return {"swot": swot}
