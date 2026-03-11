# backend/services/rag_service.py

from pinecone import Pinecone, ServerlessSpec
from openai import OpenAI
from anthropic import Anthropic
import json

# Initialize all clients
pc        = Pinecone(api_key="")
openai_cl = OpenAI(api_key="")
claude    = Anthropic()

# ── STEP A: Create Pinecone Index (do this ONCE) ──────────
def setup_pinecone():
    """Creates the vector database index"""
    # Check if index already exists
    if "ksp-crimes" not in pc.list_indexes().names():
        pc.create_index(
            name="ksp-crimes",
            dimension=3072,      # text-embedding-3-large produces 3072 numbers
            metric="cosine",     # How similarity is measured
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        print("✅ Pinecone index created")

    return pc.Index("ksp-crimes")

# ── STEP B: Convert text to vector ────────────────────────
def embed_text(text: str) -> list:
    """
    Converts a piece of text into a list of 3072 numbers.
    Similar texts produce similar number lists.
    """
    response = openai_cl.embeddings.create(
        model="text-embedding-3-large",
        input=text
    )
    return response.data[0].embedding  # Returns list of 3072 floats

# ── STEP C: Upload all cases to Pinecone ──────────────────
def index_cases(cases: list):
    """
    Takes your 500 mock cases and uploads them to Pinecone.
    Do this once when setting up.
    """
    index = pc.Index("ksp-crimes")

    # Process in batches of 100 (Pinecone limit)
    batch_size = 100
    for i in range(0, len(cases), batch_size):
        batch = cases[i:i+batch_size]
        vectors = []

        for case in batch:
            # Combine all text fields into one string to embed
            text = f"""
            Case ID: {case['case_id']}
            Type: {case['type']}
            District: {case['district']}
            Description: {case['description']}
            Status: {case['status']}
            """

            vector = embed_text(text)

            vectors.append({
                "id": case["case_id"],       # Unique ID
                "values": vector,             # The 3072 numbers
                "metadata": {                 # Extra info to return with results
                    "case_id": case["case_id"],
                    "type": case["type"],
                    "district": case["district"],
                    "status": case["status"],
                    "content": text[:500]     # Store snippet
                }
            })

        index.upsert(vectors=vectors)
        print(f"✅ Indexed cases {i} to {i+len(batch)}")

# ── STEP D: Answer questions using RAG ───────────────────
async def rag_query(question: str) -> str:
    """Main function: takes question, finds relevant cases, generates answer"""
    index = pc.Index("ksp-crimes")

    # 1. Convert the question to a vector
    question_vector = embed_text(question)

    # 2. Find the 5 most similar cases in Pinecone
    search_results = index.query(
        vector=question_vector,
        top_k=5,
        include_metadata=True
    )

    # 3. Build context string from the found cases
    context_parts = []
    for match in search_results.matches:
        meta = match.metadata
        context_parts.append(
            f"Case {meta['case_id']} ({meta['type']}, {meta['district']}):\n"
            f"{meta['content']}\n"
            f"Status: {meta['status']}\n"
        )
    context = "\n---\n".join(context_parts)

    # 4. Ask Claude to answer using only this context
    response = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system="""You are KSP CrimeIQ, a police intelligence assistant.
Answer the officer's question using ONLY the case context provided.
Always mention which case IDs you're referencing.
If the context doesn't have enough info, say so clearly.
Be precise and professional.""",
        messages=[{
            "role": "user",
            "content": f"Case Context:\n{context}\n\nOfficer's Question: {question}"
        }]
    )

    return response.content[0].text
