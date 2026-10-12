import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.database import init_db
from app.config import BASE_DIR
from app.routers.auth import router as auth_router
from app.routers.subjects import router as subjects_router, chapter_router, topic_router
from app.routers.notes import router as notes_router
from app.routers.flashcards import router as flashcards_router
from app.routers.tests import router as tests_router
from app.routers.mistakes import router as mistakes_router
from app.routers.pyqs import router as pyqs_router
from app.routers.analytics import router as analytics_router
from app.routers.settings import router as settings_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and tables
    init_db()
    yield

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Rankion | SSC CHSL 2027 Preparation Platform",
    description="Personalized preparation system with active recall, SM-2 spaced repetition, and real analytics for SSC CHSL 2027.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for external frontends (e.g. Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# Include all API routers
app.include_router(auth_router)
app.include_router(subjects_router)
app.include_router(chapter_router)
app.include_router(topic_router)
app.include_router(notes_router)
app.include_router(flashcards_router)
app.include_router(tests_router)
app.include_router(mistakes_router)
app.include_router(pyqs_router)
app.include_router(analytics_router)
app.include_router(settings_router)

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_file = BASE_DIR / "templates" / "index.html"
    return FileResponse(index_file)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Rankion SSC CHSL 2027 System"}
