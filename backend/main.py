from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ask import router as ask_router, load_messages

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# ---------- Initialize FastAPI ----------
app = FastAPI(title="Aurora Q&A (Mini-RAG)")

# ---------- Enable CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Register the /ask router ----------
app.include_router(ask_router)

# ---------- Serve Frontend (React Build) ----------
frontend_path = os.path.join(os.path.dirname(__file__), "frontend", "dist")

if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(frontend_path, "index.html"))


# ---------- Load dataset on startup ----------
@app.on_event("startup")
async def startup_event():
    await load_messages()

