"""
main.py
--------
This file initializes the FastAPI app, handles startup events, and mounts the /ask router.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ask import router as ask_router, load_messages

# ---------- Initialize FastAPI ----------
app = FastAPI(title="Aurora Q&A (Mini-RAG + FLAN-T5-Large)")

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

# ---------- Load dataset on startup ----------
@app.on_event("startup")
async def startup_event():
    await load_messages()

