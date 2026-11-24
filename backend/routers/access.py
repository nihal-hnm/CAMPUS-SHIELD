"""
Access router — emergency lockdown, session revocation, grants list
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException

from routers.auth import get_current_user, require_super_admin
from services.access_engine import (
    MOCK_DOCUMENTS,
    MOCK_SESSIONS,
    REVOKED_TOKENS,
    EMERGENCY_LOCKED_DOCS,
)
from models.access import RevokeRequest, EmergencyRevokeRequest, EmergencyRevokeResponse

router = APIRouter()


@router.post("/revoke")
async def revoke_session(body: RevokeRequest, _admin: dict = Depends(require_super_admin)):
    """Revoke a specific token (admin only)."""
    token = body.token
    MOCK_SESSIONS.pop(token, None)
    REVOKED_TOKENS.add(token)
    return {"success": True, "revoked": token}


@router.post("/emergency-revoke", response_model=EmergencyRevokeResponse)
async def emergency_revoke(body: EmergencyRevokeRequest, _admin: dict = Depends(require_super_admin)):
    """
    Emergency lockdown — locks one document, a whole department, or all docs.
    Also revokes ALL active sessions (tokens) immediately.
    """
    locked: list[str] = []

    if body.scope == "document":
        EMERGENCY_LOCKED_DOCS.add(body.document_id)
        locked = [body.document_id]
    elif body.scope == "department":
        # Lock all documents belonging to the same department as this doc
        doc = MOCK_DOCUMENTS.get(body.document_id, {})
        dept = doc.get("department", "")
        for doc_id, d in MOCK_DOCUMENTS.items():
            if d.get("department") == dept:
                EMERGENCY_LOCKED_DOCS.add(doc_id)
                locked.append(doc_id)
    elif body.scope == "all":
        for doc_id in MOCK_DOCUMENTS:
            EMERGENCY_LOCKED_DOCS.add(doc_id)
            locked = list(MOCK_DOCUMENTS.keys())

    # Revoke all active sessions
    all_tokens = list(MOCK_SESSIONS.keys())
    for t in all_tokens:
        REVOKED_TOKENS.add(t)
        MOCK_SESSIONS.pop(t, None)

    return EmergencyRevokeResponse(
        success=True,
        locked_document_ids=locked,
        message=f"Emergency lockdown applied. {len(locked)} document(s) locked. {len(all_tokens)} session(s) revoked.",
    )


@router.post("/unlock")
async def unlock_document(document_id: str, _admin: dict = Depends(require_super_admin)):
    """Remove emergency lock from a document."""
    EMERGENCY_LOCKED_DOCS.discard(document_id)
    return {"success": True, "unlocked": document_id}


@router.get("/grants")
async def list_grants(user: dict = Depends(get_current_user)):
    """List all active sessions (admin view) or current user's session."""
    if user.get("role") == "super_admin":
        # Return all sessions (omit token for security)
        return [
            {k: v for k, v in sess.items() if k != "token"}
            for sess in MOCK_SESSIONS.values()
        ]
    else:
        # Return only current user's session info
        return [
            {k: v for k, v in sess.items() if k != "token" and sess["uid"] == user["uid"]}
            for sess in MOCK_SESSIONS.values()
            if sess.get("uid") == user["uid"]
        ]


@router.get("/emergency-status")
async def emergency_status(_admin: dict = Depends(require_super_admin)):
    """Return which documents are currently emergency-locked."""
    return {
        "locked_documents": list(EMERGENCY_LOCKED_DOCS),
        "active_sessions": len(MOCK_SESSIONS),
        "revoked_tokens_count": len(REVOKED_TOKENS),
    }
