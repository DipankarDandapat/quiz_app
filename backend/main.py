import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from backend.models.models import Base, engine
from backend.routes import user, exam, quiz, activity
import json

app = FastAPI(title="Quiz Portal API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to parse JSON body and attach to request.state
@app.middleware("http")
async def parse_body(request: Request, call_next):
    if request.method in ("POST", "PUT", "PATCH"):
        try:
            body = await request.body()
            request.state.body = json.loads(body) if body else {}
        except Exception:
            request.state.body = {}
    else:
        request.state.body = {}
    return await call_next(request)

app.include_router(user.router, prefix="/api")
app.include_router(exam.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(activity.router, prefix="/api")

# Create tables on startup (uses same DB as Flask app)
Base.metadata.create_all(bind=engine)

# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "name": "Quiz Test  API",
        "version": "1.0.0",
        "description": "quiz test backend",
        "docs": "/docs",
        "health": "/health",
        "quiz-tests": "/api/quiz-tests",
        "exams": "/api/exams"
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))

    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
