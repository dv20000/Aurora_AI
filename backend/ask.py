"""
ask_router.py
Handles the /ask endpoint logic for Aurora Mini-RAG.
Adds a simple local toxicity check using a small Hugging Face model.
"""

import torch
import faiss
import aiohttp
import numpy as np
from fastapi import APIRouter, Query
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    pipeline
)
from sentence_transformers import SentenceTransformer

# ---------- Router setup ----------
router = APIRouter(prefix="", tags=["Aurora Q&A"])

# ---------- Globals ----------
MESSAGES_URL = "https://november7-730026606190.europe-west1.run.app/messages"
messages_cache, embeddings, index, embedder = [], None, None, None

# ---------- Load models ----------
print("Loading models (embedder, T5, toxicity)...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

tokenizer = AutoTokenizer.from_pretrained("MBZUAI/LaMini-Flan-T5-783M")
model = AutoModelForSeq2SeqLM.from_pretrained("MBZUAI/LaMini-Flan-T5-783M")

# Lightweight toxicity model
toxicity_model = pipeline("text-classification", model="unitary/toxic-bert", device=-1)

# ---------- Build FAISS ----------
async def build_index():
    """Builds a FAISS index from the cached messages."""
    global messages_cache, embeddings, index
    texts = [m["message"] for m in messages_cache]
    if not texts:
        print("No messages found to build index.")
        return
    vectors = embedder.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    embeddings = np.array(vectors, dtype="float32")
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)
    print(f"FAISS index built with {len(texts)} messages")

# ---------- Load messages ----------
async def load_messages():
    """Fetches messages from the API and triggers index build."""
    global messages_cache
    print("Fetching messages from Aurora API...")
    async with aiohttp.ClientSession() as session:
        async with session.get(MESSAGES_URL) as res:
            if res.status == 200:
                data = await res.json()
                messages_cache = data.get("items", [])
                await build_index()
            else:
                print(f"Failed to load messages: {res.status}")

# ---------- Ask endpoint ----------
@router.get("/ask")
async def ask(question: str = Query(..., description="Natural language question")):
    """
    Aurora Mini-RAG endpoint:
      1. Checks toxicity of the question.
      2. Retrieves top-k relevant messages (FAISS).
      3. Generates concise answer with FLAN-T5.
    """
    global messages_cache, index

    # --- Step 0: Safety check ---
    tox_result = toxicity_model(question)[0]
    if tox_result["label"].lower() in ["toxic", "LABEL_1"] and tox_result["score"] > 0.5:
        return {"answer": "This question contains unsafe or toxic content and cannot be processed."}

    if not messages_cache or index is None:
        return {"answer": "Dataset unavailable."}

    # --- Step 1: Retrieve top-k relevant messages ---
    q_vec = embedder.encode([question], convert_to_numpy=True)
    k = 5
    D, I = index.search(np.array(q_vec, dtype="float32"), k)
    retrieved = [messages_cache[i] for i in I[0] if i < len(messages_cache)]
    
    # --- Step 2: Build context ---
    context = "\n".join([f"{r['user_name']}: {r['message']}" for r in retrieved])

    # --- Step 3: Reasoning prompt ---
    # Construct a precise, two-path reasoning prompt
    prompt = f"""
You are a precise AI analyst. Your job is to answer the user's question based *only* on the provided messages.

Carefully follow these two rules:

1.  **If a direct, factual answer IS found in the messages:**
    You MUST state the answer. Then, you MUST cite the specific message(s) you used as evidence.
    Format your response like this:
    [The direct answer].

2.  **If a direct, factual answer IS NOT found in the messages:**
    You MUST respond with *only* the exact phrase:
    "I cannot determine the answer from this dataset."
Messages:
{context}

Question:
{question}

Answer:
"""

    # --- Step 4: Generate answer ---
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024)
    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=1024)
    answer = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

    # --- Step 5: Return JSON as per Aurora spec ---
    return {"answer": answer}