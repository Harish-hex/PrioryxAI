from fastapi import FastAPI

from routers import actions, graph, jobs, resume, score

app = FastAPI(title="PrioryxAI AI Service", version="0.1.0")

app.include_router(score.router)
app.include_router(actions.router)
app.include_router(resume.router)
app.include_router(graph.router)
app.include_router(jobs.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
