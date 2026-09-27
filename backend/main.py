import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from backend.models.models import Base, engine
from backend.routes import user, exam, quiz, activity
import json

app = FastAPI(title="Quiz Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
