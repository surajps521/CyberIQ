from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json, os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'), override=True)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

from groq import Groq
from mock_db import MOCK_CASES, MOCK_CRIMINALS

app = FastAPI(title="KSP CrimeIQ API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=GROQ_API_KEY)
print(f"✅ Groq client ready. Key: {GROQ_API_KEY[:20]}...")

def detect_intent(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["show","list","find","cases","fir","how many","count"]):
        return "NL2SQL"
    if any(w in q for w in ["network","connection","linked","associate","gang"]):
        return "GRAPH"
    if any(w in q for w in ["summarize","summary","details","tell me about","what happened"]):
        return "SUMMARY"
    if any(w in q for w in ["predict","forecast","hotspot","likely","risk"]):
        return "PREDICTION"
    return "GENERAL"

def query_cases(query: str) -> list:
    q = query.lower()
    results = MOCK_CASES.copy()
    for district in ["bengaluru","mysuru","hubli","mangalore","belagavi","tumakuru"]:
        if district in q:
            results = [c for c in results if district in c["district"].lower()]
            break
    for crime in ["theft","robbery","assault","murder","cybercrime","fraud","burglary","snatching","vehicle"]:
        if crime in q:
            results = [c for c in results if crime in c["crime_type"].lower()]
            break
    for status in ["open","closed","investigating","chargesheeted"]:
        if status in q:
            results = [c for c in results if status in c["status"].lower()]
            break
    return results[:10]

def query_criminals(query: str) -> list:
    q = query.lower()
    for c in MOCK_CRIMINALS:
        if c["name"].lower() in q or c["alias"].lower() in q:
            return [c]
    return MOCK_CRIMINALS[:5]

def build_prompt(intent: str, query: str, data: list) -> str:
    data_str = json.dumps(data, indent=2)[:3000]
    base = f"""You are KSP CrimeIQ, an AI assistant for Karnataka State Police intelligence system.
You help police officers analyze crime data, find patterns, and investigate cases.
Be professional, precise, and actionable. Use bullet points for lists.
Current query: "{query}"
Intent: {intent}
Database results:
{data_str}
"""
    if intent == "NL2SQL":
        return base + "\nSummarize the cases found. Mention count, districts, crime types, patterns. End with 1-2 actionable insights for the officer."
    elif intent == "GRAPH":
        return base + "\nAnalyze the criminal network. Identify key connections and recommend surveillance priorities."
    elif intent == "SUMMARY":
        return base + "\nProvide detailed case summary with timeline, accused details, status, and recommended next steps."
    elif intent == "PREDICTION":
        return base + "\nPredict crime hotspots and high-risk periods. Give specific patrol deployment recommendations."
    else:
        return base + "\nAnswer helpfully based on Karnataka Police crime data. Be concise and professional."

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    print("✅ WebSocket connected")
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            query = msg.get("message", "")
            language = msg.get("language", "en")
            print(f"📩 Query: {query}")

            intent = detect_intent(query)
            db_data = query_criminals(query) if intent == "GRAPH" else query_cases(query)
            prompt = build_prompt(intent, query, db_data)

            if language == "kn":
                prompt += "\n\nIMPORTANT: Respond in Kannada (ಕನ್ನಡ)."

            await websocket.send_text(json.dumps({"type":"typing","status":True}))

            try:
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    max_tokens=1000,
                    messages=[
                        {"role":"system","content":"You are KSP CrimeIQ, a professional police intelligence AI assistant for Karnataka State Police. Be precise, professional and actionable."},
                        {"role":"user","content":prompt}
                    ]
                )
                answer = response.choices[0].message.content
                confidence = 92 if len(db_data) > 3 else 78 if len(db_data) > 0 else 65
                print(f"✅ Groq responded: {answer[:80]}...")
            except Exception as e:
                print(f"❌ Groq error: {e}")
                answer = f"AI analysis unavailable: {str(e)[:150]}"
                confidence = 50

            await websocket.send_text(json.dumps({
                "type": "message",
                "text": answer,
                "intent": intent,
                "source": f"KSP Database ({len(db_data)} records) · Llama 3.3 70B",
                "confidence": confidence,
                "data": db_data[:3],
            }))

    except WebSocketDisconnect:
        print("🔌 Disconnected")
    except Exception as e:
        print(f"❌ Error: {e}")

@app.get("/")
def root():
    return {"status":"KSP CrimeIQ API running","version":"1.0","model":"llama-3.3-70b-versatile"}

@app.get("/health")
def health():
    return {"status":"ok","cases":len(MOCK_CASES),"criminals":len(MOCK_CRIMINALS),"model":"llama-3.3-70b"}

@app.get("/cases")
def get_cases(district: str = None, crime_type: str = None, limit: int = 20):
    results = MOCK_CASES.copy()
    if district:
        results = [c for c in results if district.lower() in c["district"].lower()]
    if crime_type:
        results = [c for c in results if crime_type.lower() in c["crime_type"].lower()]
    return {"cases":results[:limit],"total":len(results)}

@app.get("/criminals")
def get_criminals():
    return {"criminals":MOCK_CRIMINALS}

@app.get("/stats")
def get_stats():
    from collections import Counter
    return {
        "total_cases": len(MOCK_CASES),
        "by_crime_type": dict(Counter(c["crime_type"] for c in MOCK_CASES).most_common(5)),
        "by_district": dict(Counter(c["district"] for c in MOCK_CASES).most_common(5)),
        "by_status": dict(Counter(c["status"] for c in MOCK_CASES)),
    }
