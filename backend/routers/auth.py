"""
Auth router — login, logout, logout-tab (beacon), reauth, /me
"""
from __future__ import annotations
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, Request, Body

from models.auth import LoginRequest, LoginResponse, ReauthRequest, ReauthResponse, LogoutTabRequest, UserOut
from services.access_engine import MOCK_USERS, MOCK_SESSIONS, REVOKED_TOKENS

router = APIRouter()

# ── Mock credential store (never store real passwords like this in prod) ──────
MOCK_CREDENTIALS = {
    "admin@college.edu":    "admin123",
    "hod@cse.college.edu":  "hod123",
    "fac1@college.edu":     "fac123",
    "fac2@college.edu":     "fac123",
    "auditor@college.edu":  "aud123",
    "student@college.edu":  "stu123",
}

MOCK_EMAIL_TO_UID = {
    "admin@college.edu":    "usr_admin_001",
    "hod@cse.college.edu":  "usr_hod_001",
    "fac1@college.edu":     "usr_fac_9921",
    "fac2@college.edu":     "usr_fac_4412",
    "auditor@college.edu":  "usr_aud_001",
    "student@college.edu":  "usr_stu_001",
}

# ── Dependency: extract & validate token ─────────────────────────────────────
async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if not token or token in REVOKED_TOKENS:
        raise HTTPException(401, detail={"reason_code": "INVALID_TOKEN", "reason": "Missing or revoked token"})
    user = MOCK_SESSIONS.get(token)
    if not user:
        raise HTTPException(401, detail={"reason_code": "INVALID_TOKEN", "reason": "Session not found"})
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") not in ("super_admin", "dept_admin"):
        raise HTTPException(403, detail={"reason_code": "ROLE_UNAUTHORIZED", "reason": "Admin access required"})
    return user


async def require_super_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "super_admin":
        raise HTTPException(403, detail={"reason_code": "ROLE_UNAUTHORIZED", "reason": "Super admin access required"})
    return user


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, request: Request):
    email = body.email.lower().strip()
    password = body.password

    # Validate credentials
    expected = MOCK_CREDENTIALS.get(email)
    if not expected or expected != password:
        raise HTTPException(401, detail={"reason_code": "INVALID_CREDENTIALS", "reason": "Invalid email or password"})

    uid = MOCK_EMAIL_TO_UID[email]
    user_data = MOCK_USERS.get(uid)
    if not user_data or user_data["status"] != "active":
        raise HTTPException(403, detail={"reason_code": "USER_INACTIVE", "reason": "Account is inactive"})

    # Generate secure token
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=24)

    # Store session
    session = {
        **user_data,
        "token": token,
        "login_at": now.isoformat(),
        "last_active_at": now.isoformat(),
        "last_reauth_at": now.isoformat(),
        "client_ip": request.client.host if request.client else "127.0.0.1",
        "expires_at": expires_at.isoformat(),
    }
    MOCK_SESSIONS[token] = session

    return LoginResponse(
        token=token,
        user=UserOut(**user_data),
        expires_at=expires_at.isoformat(),
    )


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user), request: Request = None):
    token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    MOCK_SESSIONS.pop(token, None)
    REVOKED_TOKENS.add(token)
    return {"success": True}


@router.post("/logout-tab")
async def logout_tab(request: Request):
    """
    Beacon endpoint — called by navigator.sendBeacon() on tab close.
    Accepts plain text body OR JSON with token field.
    """
    body_bytes = await request.body()
    token = body_bytes.decode("utf-8").strip().strip('"')
    # Also try JSON
    if not token or token.startswith("{"):
        try:
            import json
            data = json.loads(body_bytes)
            token = data.get("token", "")
        except Exception:
            pass
    if token:
        MOCK_SESSIONS.pop(token, None)
        REVOKED_TOKENS.add(token)
    return {"success": True}


@router.post("/reauth", response_model=ReauthResponse)
async def reauth(body: ReauthRequest, user: dict = Depends(get_current_user), request: Request = None):
    email = user["email"].lower().strip()
    expected = MOCK_CREDENTIALS.get(email)
    if not expected or expected != body.password:
        raise HTTPException(401, detail={"reason_code": "INVALID_CREDENTIALS", "reason": "Wrong password"})

    now = datetime.now(timezone.utc)
    # Update session reauth time
    token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if token in MOCK_SESSIONS:
        MOCK_SESSIONS[token]["last_reauth_at"] = now.isoformat()
        MOCK_SESSIONS[token]["last_active_at"] = now.isoformat()

    return ReauthResponse(success=True, reauthed_at=now.isoformat())


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return UserOut(**{k: user[k] for k in UserOut.model_fields if k in user})
