from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from auth import verify_internal_secret
from db import get_db
from services import graph_engine, job_matcher

router = APIRouter(prefix="/jobs", tags=["jobs"], dependencies=[Depends(verify_internal_secret)])


@router.get("/{user_id}/matches")
def get_matches(user_id: str, db: Client = Depends(get_db)) -> dict:
    graph = graph_engine.fetch_career_graph(db, user_id)
    if graph is None:
        raise HTTPException(status_code=404, detail="No career_graph row for this user")

    jobs_resp = db.table("jobs").select("*").eq("is_active", True).execute()

    matches = []
    for job in jobs_resp.data:
        score, gap_skills = job_matcher.match_score(
            graph,
            job.get("required_skills") or [],
            job.get("preferred_skills") or [],
        )
        matches.append({
            "job_id": job["id"],
            "title": job["title"],
            "company": job["company"],
            "match_score": score,
            "gap_skills": gap_skills,
        })

        db.table("job_matches").upsert({
            "user_id": user_id,
            "job_id": job["id"],
            "match_score": score,
            "match_breakdown": {"required": job.get("required_skills") or [], "gap": gap_skills},
            "gap_skills": gap_skills,
        }, on_conflict="user_id,job_id").execute()

    matches.sort(key=lambda m: m["match_score"], reverse=True)
    return {"matches": matches}
