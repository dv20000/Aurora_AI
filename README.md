Aurora_AI
A simple question-answering system that can answer natural-language questions about member data provided by Aurora's public API.
Since user experience matters just as much as functionality, I designed a clean chat interface instead of a plain API call setup. Users can directly type their questions and get instant, conversational answers powered by the backend model. The goal was to make interacting with the data feel natural, intuitive, and easy to use, more like talking to an assistant than running a query.

Approaches under consideration:
1. Simple Regex + Direct API Search
The first idea was to make basic API calls, collect all the messages, and then use simple string or regex matching to find relevant names, dates, or keywords.
It worked for very direct questions like “When is Layla planning her trip?” since you could match words like “Layla” and “trip” in the text.
However, this approach didn’t handle reworded or complex questions well, and it couldn’t reason across multiple messages. It was fast, but not very smart.

2. Sending All Data to a Language Model
The second idea was to send all message data at once to a language model and ask it to find the answer.
This was simple to implement, but not efficient. There’s too much data to fit in one request, and the model might start making up answers if it doesn’t find an exact match.
It also meant re-sending the same data with every question, which makes it slower and more expensive to run.

3. Retrieval-Augmented Generation (FAISS + LLM)
The final approach, which I ended up using, was to build a lightweight retrieval system.
I convert all the messages into embeddings and store them in a FAISS index once during app startup. After that, I don’t need to keep calling the API because all the data is already loaded in memory.
When a question comes in, the system quickly searches for the most relevant messages, sends only those to the language model, and gets a clear, grounded answer.
This setup makes responses more accurate, reduces hallucination, and keeps everything efficient and responsive.
**AI Guardrails play an important role in keeping the system safe. I added a toxicity detection step that scans user input for harmful or inappropriate content and blocks those queries before they reach the model. This ensures the model doesn’t generate or engage with unsafe or offensive material.



Anomalies or Inconsistencies in the member data for feeding the LLM:
1. No conversation grouping, all messages are treated independently.
2. User IDs and names are not normalized or cross-verified.
3. Messages contain repeated boilerplate (“please”, “can you…”) that weakens embeddings.
4. Wide domain variability (travel, payments, reservations) for a small LLM.
5. No semantic deduplication for paraphrased messages.
6. User names have accented characters that may affect matching.
7. Dataset not ordered chronologically
8. Large variation in message length.

**The screen recording contains:
1. Asking Two Valid Queries (Answers Exist in Context)
I begin by asking two different questions whose answers are clearly present in the Aurora messages dataset.
The system retrieves the correct messages through the FAISS semantic index and generates grounded, accurate responses using the FLAN-T5 model.

2. Asking Random / Out-of-Context Queries (Hallucination Check)
Next, I test the model with questions that do NOT exist in the dataset.
The system correctly avoids hallucination and responds with the fallback message:
“I cannot determine the answer from this dataset.”
This step verifies that the model answers only from retrieved context and does not invent information.

3. Asking a Harmful or Unsafe Query (Guardrail Test)
Finally, I test the toxicity guardrail by entering a harmful or unsafe question.
The system blocks the request and returns a safe message, proving that the toxicity filter is active and working correctly.
