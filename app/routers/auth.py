import secrets
from fastapi import APIRouter, HTTPException, Response, Request
from app.database import db_session
from app.models import PasscodeRequest
from app.config import DEFAULT_PASSCODE, SESSION_COOKIE_NAME

router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-memory valid session tokens
ACTIVE_SESSIONS = set()

def verify_session(request: Request) -> bool:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        # Also allow header for flexibility
        token = request.headers.get("X-Session-Token")
    return token in ACTIVE_SESSIONS if token else False

@router.post("/unlock")
def unlock_website(req: PasscodeRequest, response: Response):
    with db_session() as conn:
        row = conn.execute("SELECT value FROM settings WHERE key = 'passcode';").fetchone()
        stored_passcode = row["value"] if row else DEFAULT_PASSCODE

    if req.passcode.strip() != stored_passcode.strip():
        raise HTTPException(status_code=401, detail="Invalid passcode. Access denied.")

    token = secrets.token_hex(24)
    ACTIVE_SESSIONS.add(token)
    
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 7 # 7 days
    )
    return {"success": True, "token": token, "message": "Unlocked successfully"}

@router.get("/status")
def check_auth_status(request: Request):
    # Always require entering passcode upon page load/refresh
    return {"unlocked": False}

@router.post("/lock")
def lock_website(request: Request, response: Response):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token and token in ACTIVE_SESSIONS:
        ACTIVE_SESSIONS.remove(token)
    response.delete_cookie(SESSION_COOKIE_NAME)
    return {"success": True, "message": "Locked"}
