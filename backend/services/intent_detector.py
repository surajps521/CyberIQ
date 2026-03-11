# backend/services/intent_detector.py

import json
from anthropic import Anthropic

# Create the Claude client (reads API key from environment)
client = Anthropic()

# This is the instruction we give Claude to classify queries
# It's called a "system prompt" — it defines Claude's role
INTENT_PROMPT = """
You are a query classifier for a police intelligence system.

Classify ANY user query into exactly ONE of these:
- NL2SQL     → questions needing database queries (counts, filters, lists)
- RAG        → questions needing document/FIR content search
- GRAPH      → questions about criminal networks, connections, associates
- PREDICTION → questions about future crime patterns or hotspots
- SUMMARY    → requests to summarize a specific case
- GENERAL    → general law/police knowledge questions

Also extract any named entities (criminal names, case IDs, locations, dates).

Respond ONLY in this exact JSON format, nothing else:
{
  "intent": "NL2SQL",
  "confidence": 0.95,
  "entities": {
    "location": "Mysuru",
    "crime_type": "theft",
    "date_range": "last 3 months"
  }
}
"""

async def detect_intent(query: str) -> dict:
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        system=INTENT_PROMPT,
        messages=[
            {"role": "user", "content": query}
        ]
    )

    # response.content[0].text contains Claude's reply
    # json.loads converts the text string into a Python dictionary
    result = json.loads(response.content[0].text)
    return result

# ── TEST IT ──────────────────────────
# Run this file directly to test
if __name__ == "__main__":
    import asyncio

    test_queries = [
        "Show all theft cases in Mysuru last month",
        "Who are the associates of Bullet Ravi?",
        "Summarize case KSP-2024-1045",
        "Which areas will have high crime next week?"
    ]

    for q in test_queries:
        result = asyncio.run(detect_intent(q))
        print(f"Query: {q}")
        print(f"Intent: {result['intent']} ({result['confidence']*100:.0f}% confident)")
        print()


