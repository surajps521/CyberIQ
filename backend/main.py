from collections import Counter
from email.message import EmailMessage
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any
import base64
import json, os

import smtplib
import ssl
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'), override=True)

from .mock_db import DISTRICT_ALIASES, MOCK_CASES, MOCK_CRIMINALS
from .services.archive_loader import load_archive_crime_rows

app = FastAPI(title="KSP CrimeIQ API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"✅ CrimeIQ mock dataset loaded: {len(MOCK_CASES)} cases, {len(MOCK_CRIMINALS)} criminals")

ARCHIVE_ROWS = load_archive_crime_rows()
if ARCHIVE_ROWS:
    print(f"✅ Archive dataset loaded: {len(ARCHIVE_ROWS)} rows from archive CSV")


class SosRequest(BaseModel):
    officer_name: str = "Inspector Sharma"
    badge_id: str = "KSP-4521"
    message: str
    emergency_phone: str = "7204770326"
    emergency_email: str = "12bhavish@gmail.com"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_accuracy_m: Optional[float] = None


def evaluate_smtp_health() -> dict:
    email_mode = os.getenv("SOS_EMAIL_MODE", "smtp").lower()
    smtp_host = (os.getenv("SMTP_HOST") or "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = (os.getenv("SMTP_USER") or "").strip()
    smtp_password = (os.getenv("SMTP_PASSWORD") or "").strip()
    use_tls = os.getenv("SMTP_USE_TLS", "1") == "1"
    is_gmail = smtp_host.endswith("gmail.com")

    if email_mode == "mock":
        return {
            "ok": True,
            "status": "mock",
            "detail": "SOS email mode is mock. Real emails are not sent in this mode.",
            "provider": smtp_host,
            "port": smtp_port,
            "tls": use_tls,
        }

    if not smtp_host:
        return {"ok": False, "status": "fail", "detail": "SMTP_HOST is not configured."}

    if is_gmail and smtp_password:
        smtp_password = "".join(smtp_password.split())

    if is_gmail and (not smtp_user or not smtp_password):
        return {
            "ok": False,
            "status": "fail",
            "detail": "Gmail SMTP requires SMTP_USER and SMTP_PASSWORD.",
        }

    if is_gmail and len(smtp_password) < 16:
        return {
            "ok": False,
            "status": "fail",
            "detail": "Gmail SMTP requires a 16-character App Password.",
        }

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            if use_tls:
                context = ssl.create_default_context()
                server.starttls(context=context)
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
    except smtplib.SMTPAuthenticationError:
        return {
            "ok": False,
            "status": "fail",
            "detail": "SMTP authentication failed. Use a valid Gmail App Password.",
        }
    except smtplib.SMTPException as exc:
        return {
            "ok": False,
            "status": "fail",
            "detail": f"SMTP connectivity failed: {exc}",
        }
    except OSError as exc:
        return {
            "ok": False,
            "status": "fail",
            "detail": f"Network error while connecting to SMTP: {exc}",
        }

    return {
        "ok": True,
        "status": "ok",
        "detail": "SMTP connection and authentication succeeded.",
        "provider": smtp_host,
        "port": smtp_port,
        "tls": use_tls,
    }


def build_sos_body(payload: SosRequest) -> str:
    return "\n".join([
        "SOS Alert from CrimeIQ",
        f"Officer: {payload.officer_name}",
        f"Badge: {payload.badge_id}",
        f"Emergency Phone: {payload.emergency_phone}",
        f"Emergency Email: {payload.emergency_email}",
        f"Message: {payload.message}",
        (f"Location: https://maps.google.com/?q={payload.latitude},{payload.longitude}" if (payload.latitude is not None and payload.longitude is not None) else "Location: not provided"),
        (f"Coordinates: {payload.latitude},{payload.longitude} (±{payload.location_accuracy_m} m)" if (payload.latitude is not None and payload.longitude is not None) else ""),
    ])


def send_sms_via_twilio(body: str, to_number: str) -> dict:
    # Default to mock Twilio responses for local testing.
    if os.getenv("SOS_SMS_MODE", "mock").lower() != "twilio":
        print(f"[FAKE SMS] To: +91{to_number}\n{body}")
        return {"sid": "FAKE-SID-12345", "status": "sent", "to": f"+91{to_number}"}
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_FROM_NUMBER")

    if not account_sid or not auth_token or not from_number:
        raise HTTPException(status_code=503, detail="SMS provider is not configured")

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    payload = urlencode({"To": f"+91{to_number}", "From": from_number, "Body": body}).encode("utf-8")
    credentials = base64.b64encode(f"{account_sid}:{auth_token}".encode("utf-8")).decode("utf-8")
    request = Request(url, data=payload, method="POST")
    request.add_header("Authorization", f"Basic {credentials}")
    request.add_header("Content-Type", "application/x-www-form-urlencoded")

    with urlopen(request, timeout=15) as response:
        response_text = response.read().decode("utf-8")
    return json.loads(response_text)


def send_email_via_smtp(subject: str, body: str, to_email: str) -> None:
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = (os.getenv("SMTP_USER") or "").strip() or None
    smtp_password = (os.getenv("SMTP_PASSWORD") or "").strip() or None
    smtp_from = (os.getenv("SMTP_FROM") or "").strip() or None
    use_tls = os.getenv("SMTP_USE_TLS", "1") == "1"
    is_gmail = smtp_host.endswith("gmail.com")

    if not smtp_from:
        smtp_from = smtp_user or "crimeiq@localhost"

    if os.getenv("SOS_EMAIL_MODE", "smtp").lower() == "mock":
        print(f"[FAKE EMAIL] To: {to_email}\nSubject: {subject}\n\n{body}")
        return

    if is_gmail and smtp_password:
        # Gmail app passwords are often pasted with spaces (e.g. xxxx xxxx xxxx xxxx).
        smtp_password = "".join(smtp_password.split())

    if is_gmail and (not smtp_user or not smtp_password):
        raise HTTPException(status_code=503, detail="Gmail SMTP requires SMTP_USER and SMTP_PASSWORD")

    if is_gmail and smtp_password and len(smtp_password) < 16:
        raise HTTPException(
            status_code=503,
            detail="Gmail SMTP requires a 16-character App Password (not your normal Gmail account password).",
        )

    if not smtp_host:
        raise HTTPException(status_code=503, detail="Email provider is not configured")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = smtp_from
    message["To"] = to_email
    message.set_content(body)

    with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
        if use_tls:
            context = ssl.create_default_context()
            server.starttls(context=context)
        try:
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
        except smtplib.SMTPAuthenticationError as exc:
            raise HTTPException(
                status_code=502,
                detail="Gmail rejected the SMTP login. Use a Gmail App Password or verify the SMTP_USER/SMTP_PASSWORD values.",
            ) from exc
        except smtplib.SMTPException as exc:
            raise HTTPException(status_code=502, detail=f"SMTP login failed: {exc}") from exc

        try:
            server.send_message(message)
        except smtplib.SMTPRecipientsRefused as exc:
            raise HTTPException(status_code=502, detail=f"Recipient email address was rejected: {to_email}") from exc
        except smtplib.SMTPException as exc:
            raise HTTPException(status_code=502, detail=f"SMTP send failed: {exc}") from exc


@app.post("/sos/alert")
def send_sos_alert(payload: SosRequest):
    body = build_sos_body(payload)
    sms_result = send_sms_via_twilio(body, payload.emergency_phone)
    send_email_via_smtp(
        subject="SOS Alert - Immediate Assistance Required",
        body=body,
        to_email=payload.emergency_email,
    )

    return {
        "status": "sent",
        "message": "SOS alert delivered to emergency contact",
        "sms": {
            "sid": sms_result.get("sid"),
            "status": sms_result.get("status"),
            "to": sms_result.get("to"),
        },
        "email": {
            "to": payload.emergency_email,
            "subject": "SOS Alert - Immediate Assistance Required",
        },
    }


@app.get("/sos/email/health")
def get_sos_email_health():
    return evaluate_smtp_health()

def detect_intent(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]):
        return "GENERAL"
    if any(w in q for w in ["criminal record", "criminal records", "criminal", "criminals", "offender", "suspect", "wanted"]):
        return "GRAPH"
    if any(w in q for w in ["show","list","find","cases","fir","how many","count"]):
        return "NL2SQL"
    if any(w in q for w in ["network","connection","linked","associate","gang"]):
        return "GRAPH"
    if any(w in q for w in ["summarize","summary","details","tell me about","what happened"]):
        return "SUMMARY"
    if any(w in q for w in ["predict","forecast","hotspot","likely","risk"]):
        return "PREDICTION"
    return "GENERAL"

def normalize_district_query(query: str) -> str:
    q = query.lower()
    for alias, canonical in DISTRICT_ALIASES.items():
        if alias in q:
            return canonical.lower()
    return q

def query_cases(query: str) -> list:
    q = query.lower()
    normalized = normalize_district_query(query)
    results = MOCK_CASES.copy()
    for district in ["bengaluru south", "bengaluru north", "bengaluru east", "bengaluru west", "mysuru", "hubli", "mangalore", "belagavi", "tumakuru", "dharwad"]:
        if district in normalized:
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
    normalized = normalize_district_query(query)
    results = MOCK_CRIMINALS.copy()

    if any(word in q for word in ["wanted", "suspect", "suspects", "offender", "criminal", "criminals"]):
        results = [c for c in results if c["status"].lower() == "wanted" or c["status"].lower() == "arrested"]

    for district in ["bengaluru south", "bengaluru north", "bengaluru east", "bengaluru west", "mysuru", "hubli", "mangalore", "belagavi", "tumakuru", "dharwad"]:
        if district in normalized:
            results = [c for c in results if district.split()[0] in c["area"].lower() or district in c["area"].lower() or district in c["name"].lower()]
            break

    for c in MOCK_CRIMINALS:
        if c["name"].lower() in q or c["alias"].lower() in q:
            return [c]

    return results[:5] if results else MOCK_CRIMINALS[:5]

def build_local_response(intent: str, query: str, data: list) -> str:
    q = query.lower().strip()

    def summarize_archive(q: str) -> str:
        if not ARCHIVE_ROWS:
            return "No archive data available."

        # simple filters: year, month, major/minor head
        rows = ARCHIVE_ROWS
        # year
        import re
        m = re.search(r"\b(20\d{2})\b", q)
        if m:
            yr = int(m.group(1))
            rows = [r for r in rows if r.get("year") == yr]

        # month names
        months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
        for mon in months:
            if mon.lower() in q:
                rows = [r for r in rows if r.get("month") == mon]
                break

        # major/minor head keywords
        if "murder" in q or "homicide" in q:
            rows = [r for r in rows if "murder" in (r.get("major_head") or "").lower() or "murder" in (r.get("minor_head") or "").lower()]
        elif "rape" in q or "sexual" in q:
            rows = [r for r in rows if "rape" in (r.get("major_head") or "").lower() or "rape" in (r.get("minor_head") or "").lower()]
        elif "kidnap" in q or "kidnapping" in q:
            rows = [r for r in rows if "kidnap" in (r.get("major_head") or "").lower() or "kidnap" in (r.get("minor_head") or "").lower()]

        total_current_month = sum(r.get("current_month") or 0.0 for r in rows)
        total_year_upto = sum(r.get("current_year_upto_review") or 0.0 for r in rows)
        total_prev_month = sum(r.get("previous_month") or 0.0 for r in rows)
        total_prev_year = sum(r.get("corresponding_month_previous_year") or 0.0 for r in rows)

        txt = [f"Archive summary ({len(rows)} rows considered):"]
        txt.append(f"- Current month total: {int(total_current_month)}")
        txt.append(f"- Year-to-date total: {int(total_year_upto)}")
        txt.append(f"- Previous month total: {int(total_prev_month)}")
        txt.append(f"- Same month last year: {int(total_prev_year)}")
        if total_prev_month:
            change = (total_current_month - total_prev_month) / total_prev_month * 100
            txt.append(f"- Change vs previous month: {change:.1f}%")
        if total_prev_year:
            change2 = (total_current_month - total_prev_year) / total_prev_year * 100
            txt.append(f"- Change vs same month last year: {change2:.1f}%")

        txt.append("- Tip: ask for a specific month or crime type for finer results.")
        return "\n".join(txt)

    # If user asks for aggregates/trends, prefer archive summarization
    if intent in ("NL2SQL", "PREDICTION") and ARCHIVE_ROWS:
        # simple heuristic: if query mentions month/year or common aggregate words
        agg_words = ["trend","how many","count","total","top","increase","decrease","per month","per year","year","month"]
        if any(w in q for w in agg_words):
            return summarize_archive(q)


    if intent == "GENERAL":
        return (
            "Hello. Ask me about criminal records, case status, locations, FIR numbers, or specific suspects.\n"
            "Examples:\n"
            "- show Bengaluru South robbery cases\n"
            "- criminal records for Raja\n"
            "- cases in Mysuru\n"
            "- hotspots in Belagavi"
        )

    if intent == "GRAPH":
        if not data:
            return "No matching criminal records found. Try a name, alias, area, or crime type."

        lines = []
        crimes = Counter(crime for c in data for crime in c.get("crimes", []))
        for c in data[:5]:
            crimes_list = ", ".join(c.get("crimes", []))
            lines.append(
                f"- {c['name']} ({c['alias']}) | Age: {c['age']} | Area: {c['area']} | Status: {c['status']} | Cases: {c['cases']} | Crimes: {crimes_list}"
            )
        crime_summary = ", ".join(f"{crime} ({count})" for crime, count in crimes.most_common(3)) or "No crime tags available"
        return (
            f"I found {len(data)} criminal record(s) in Karnataka.\n"
            + "\n".join(lines)
            + "\n"
            f"- Common offences: {crime_summary}\n"
            "- Next step: ask for a single name or alias if you want the full record with case history."
        )

    if not data:
        if any(word in q for word in ["location", "locations", "area", "areas", "district", "districts", "hotspot", "where"]):
            district_counts = Counter(case["district"] for case in MOCK_CASES)
            top_districts = ", ".join(f"{district} ({count})" for district, count in district_counts.most_common(5))
            return (
                "No exact location match was found. Current Karnataka case concentration is:\n"
                f"- Top districts: {top_districts}\n"
                "- Try asking for a district name like Bengaluru South, Mysuru, Hubli, or Belagavi."
            )

        return "I couldn't find matching records. Try a case type, district, FIR number, or suspect name."

    if intent == "NL2SQL":
        district_counts = Counter(case["district"] for case in data)
        crime_counts = Counter(case["crime_type"] for case in data)
        status_counts = Counter(case["status"] for case in data)
        sample_cases = ", ".join(case["id"] for case in data[:3])
        hotspot_cases = [case for case in data if case.get("hotspot")]
        hotspot_text = ", ".join(f"{case['district']} - {case['area']}" for case in hotspot_cases[:3]) or "No marked hotspot in this subset"
        return (
            f"I found {len(data)} case(s) matching your query in Karnataka.\n"
            f"- Districts: {', '.join(f'{district} ({count})' for district, count in district_counts.most_common(3))}\n"
            f"- Crime types: {', '.join(f'{crime} ({count})' for crime, count in crime_counts.most_common(3))}\n"
            f"- Status mix: {', '.join(f'{status} ({count})' for status, count in status_counts.most_common(3))}\n"
            f"- Hotspots: {hotspot_text}\n"
            f"- Sample FIRs: {sample_cases}\n"
            "- Action: filter further by district, crime type, or status to narrow the list."
        )

    if intent == "SUMMARY":
        case = data[0]
        return (
            f"Case summary for {case['id']}: {case['crime_type']} in {case['district']} ({case['area']}).\n"
            f"- Date: {case['date']}\n"
            f"- Status: {case['status']}\n"
            f"- Officer: {case['officer']}\n"
            f"- Victims: {case['victims']} | Accused: {case['accused']}\n"
            f"- Pattern: {case['pattern']}\n"
            f"- Recommended action: {case['action']}\n"
            f"- Description: {case['description']}"
        )

    if intent == "PREDICTION":
        district_counts = Counter(case["district"] for case in data)
        top_districts = ", ".join(f"{district} ({count})" for district, count in district_counts.most_common(3))
        return (
            "Based on the current Karnataka case data, likely patrol focus areas are:\n"
            f"- Hot districts: {top_districts}\n"
            "- Recommended action: increase evening patrols, monitor repeat-offence areas, and review active cases in those districts."
        )

    return (
        f"I found {len(data)} related record(s) in Karnataka.\n"
        "- Try asking for case status, district, crime type, or a specific suspect name for a tighter result."
    )

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
            local_response = build_local_response(intent, query, db_data)

            if language == "kn":
                local_response += "\n\nಗಮನಿಸಿ: ಇದು ಕರ್ನಾಟಕ ಪೊಲೀಸ್ ಮಾದರಿ ಡೇಟಾ ಆಧಾರಿತ ಉತ್ತರವಾಗಿದೆ."

            await websocket.send_text(json.dumps({"type": "typing", "status": True}))

            await websocket.send_text(json.dumps({
                "type": "message",
                "text": local_response,
                "intent": intent,
                "data": db_data[:3],
            }))

    except WebSocketDisconnect:
        print("🔌 Disconnected")
    except Exception as e:
        print(f"❌ Error: {e}")

@app.get("/")
def root():
    return {"status":"KSP CrimeIQ API running","version":"1.0","model":"karnataka-mock-assistant"}

@app.get("/health")
def health():
    return {"status":"ok","cases":len(MOCK_CASES),"criminals":len(MOCK_CRIMINALS),"model":"karnataka-mock-assistant"}

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


# ---------------------------
# Evidence capture endpoints
# ---------------------------

from fastapi import Depends, UploadFile, File
from fastapi.security import HTTPAuthorizationCredentials
from fastapi import status
from datetime import datetime, timezone
import uuid
import hashlib

from .evidence.auth_jwt import jwt_auth
from .services.evidence_storage import LocalDiskEvidenceStorage
from .services.evidence_repo import MongoEvidenceRepository, EvidenceMetadata
from .evidence.evidence_utils import validate_image_meta, sha256_bytes, generate_evidence_id


class TokenRequest(BaseModel):
    badge_id: str
    password: str
    role: Optional[str] = None


class EvidenceUploadResponse(BaseModel):
    evidenceId: str
    imageUrlOrPath: str
    latitude: float
    longitude: float
    uploadTime: datetime
    uploadedBy: str
    sha256ImageHash: str
    status: str


def _extract_user_from_token(cred: HTTPAuthorizationCredentials) -> dict:
    return jwt_auth.decode_credentials(cred)


@app.post("/auth/token")
def issue_token(payload: TokenRequest):
    """Issue JWT for authenticated users.

    Note: Frontend currently uses hardcoded demo credentials.
    This endpoint validates badge_id/password against the same demo set in frontend.
    """
    # Keep in sync with frontend Login.tsx VALID_USERS
    valid_users = {
        ("KSP001", "inspector123"): {"user_id": "KSP001", "name": "Inspector Sharma", "role": "inspector", "uploadedBy": "Inspector Sharma"},
        ("KSP002", "constable123"): {"user_id": "KSP002", "name": "Constable Ravi", "role": "constable", "uploadedBy": "Constable Ravi"},
        ("KSP003", "commissioner123"): {"user_id": "KSP003", "name": "Commissioner Patil", "role": "commissioner", "uploadedBy": "Commissioner Patil"},
        ("admin", "admin123"): {"user_id": "admin", "name": "Admin User", "role": "inspector", "uploadedBy": "Admin User"},
    }

    key = (payload.badge_id, payload.password)
    user = valid_users.get(key)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = jwt_auth.create_token(user_id=user["user_id"], uploaded_by=user["uploadedBy"], role=payload.role or user.get("role"))
    return {"accessToken": token, "tokenType": "Bearer"}


@app.post("/evidence/upload", response_model=EvidenceUploadResponse)
async def upload_evidence(
    file: UploadFile = File(...),
    latitude: float = 0.0,
    longitude: float = 0.0,
    # If you prefer client uploadTime you can accept it, but server-side is safer.
    auth: Optional[HTTPAuthorizationCredentials] = Depends(jwt_auth.bearer),
):
    if auth is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid Authorization header")

    decoded = _extract_user_from_token(auth)
    uploaded_by = decoded.get("uploadedBy") or str(decoded.get("sub"))

    # Validate + read bytes
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name")

    MAX_BYTES = int(os.getenv("EVIDENCE_MAX_BYTES", "10000000"))  # 10MB default
    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large. Max allowed is {MAX_BYTES} bytes")

    try:
        image_extension, _mime = validate_image_meta(file.filename, file.content_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    sha256_hash = sha256_bytes(content)
    evidence_id = generate_evidence_id()
    image_storage = LocalDiskEvidenceStorage()

    stored = image_storage.save_image_bytes(
        evidence_id=evidence_id,
        image_bytes=content,
        image_extension=image_extension,
    )

    # Store metadata in MongoDB
    repo = MongoEvidenceRepository()
    meta = EvidenceMetadata(
        evidence_id=evidence_id,
        image_url_or_path=stored.url_or_path,
        uploaded_by=uploaded_by,
        upload_time=datetime.now(timezone.utc),
        latitude=latitude,
        longitude=longitude,
        sha256_image_hash=sha256_hash,
        status="Pending",
    )

    repo.insert(meta=meta)

    # Cleanup temp memory: nothing persisted besides storage
    return EvidenceUploadResponse(
        evidenceId=evidence_id,
        imageUrlOrPath=stored.url_or_path,
        latitude=latitude,
        longitude=longitude,
        uploadTime=meta.upload_time,
        uploadedBy=uploaded_by,
        sha256ImageHash=sha256_hash,
        status=meta.status,
    )


# Best-effort cleanup hook for FastAPI workers.
# (LocalDiskEvidenceStorage writes directly to final location; no temp files are created intentionally.)


