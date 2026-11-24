"""
Documents router — list, access check, and streaming download
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from routers.auth import get_current_user
from services.access_engine import (
    MOCK_DOCUMENTS,
    MOCK_SESSIONS,
    REVOKED_TOKENS,
    EMERGENCY_LOCKED_DOCS,
    AccessContext,
    run_access_engine,
)
from services.supabase_client import get_service_supabase
from services.streaming import stream_document_chunks
from models.document import DocumentResponse, AccessGrantResponse
from routers.audit import append_audit

router = APIRouter()

# ── Synthetic document content (mock bytes for download demo) ─────────────────
MOCK_CONTENT: dict[str, bytes] = {
    "DOC_EXAM_CS301_2024": b"[CONFIDENTIAL] CS-301 End-Sem Examination Paper 2024\n\n"
                           b"Section A: Multiple Choice (20 marks)\n"
                           b"Section B: Short Answer (30 marks)\n"
                           b"Section C: Long Answer (50 marks)\n\n"
                           b"[This document is protected by CampusShield Zero-Trust Access Control]\n",
    "DOC_EXAM_CS302_2024": b"[CONFIDENTIAL] CS-302 End-Sem Examination Paper 2024\n\n"
                           b"Section A: Multiple Choice (20 marks)\n"
                           b"Section B: Programming (80 marks)\n\n"
                           b"[This document is protected by CampusShield Zero-Trust Access Control]\n",
    "DOC_FIN_AUDIT_2024":  b"[RESTRICTED] Annual Financial Audit Report 2024\n\n"
                           b"Total Revenue: INR 12,50,00,000\n"
                           b"Total Expenditure: INR 11,80,00,000\n"
                           b"Surplus: INR 70,00,000\n\n"
                           b"[This document is protected by CampusShield Zero-Trust Access Control]\n",
    "DOC_CIRC_001":        b"[PUBLIC] Exam Schedule Circular Nov 2024\n\n"
                           b"End-Sem exams: 15 Nov - 30 Nov 2024\n"
                           b"Results: 10 Dec 2024\n",
    "DOC_SYL_CS301":       b"[INTERNAL] CS-301 Course Syllabus 2024-25\n\n"
                           b"Unit 1: Data Structures\nUnit 2: Algorithms\nUnit 3: Complexity\n",
}


def _doc_to_response(d: dict) -> DocumentResponse:
    return DocumentResponse(
        document_id=d["document_id"],
        title=d["title"],
        department=d["department"],
        subject_id=d.get("subject_id"),
        category=d["category"],
        classification=d["classification"],
        uploaded_by=d["uploaded_by"],
        emergency_locked=d.get("emergency_locked", False) or d["document_id"] in EMERGENCY_LOCKED_DOCS,
        status=d["status"],
    )


@router.get("", response_model=list[DocumentResponse])
async def list_documents(user: dict = Depends(get_current_user)):
    """
    Return documents the user is *potentially* allowed to see based on role.
    The actual access check happens at download time (access engine).
    """
    docs = []
    role = user.get("role", "")
    dept = user.get("department", "")

    for d in MOCK_DOCUMENTS.values():
        if d["status"] != "active":
            continue
        # Super admin sees all
        if role == "super_admin":
            docs.append(_doc_to_response(d))
        # Dept admin sees their dept + public
        elif role == "dept_admin":
            if d["department"] in (dept, "ALL"):
                docs.append(_doc_to_response(d))
        # Faculty sees their subject + public
        elif role == "faculty":
            assigned = user.get("assigned_subjects", [])
            if d["classification"] in ("public", "internal") and d["department"] in (dept, "ALL"):
                docs.append(_doc_to_response(d))
            elif d.get("subject_id") in assigned:
                docs.append(_doc_to_response(d))
        # Financial auditor sees financial + public
        elif role == "financial_auditor":
            if d["category"] in ("financial", "circular") or d["classification"] == "public":
                docs.append(_doc_to_response(d))
        # Student sees public only
        elif role == "student":
            if d["classification"] == "public":
                docs.append(_doc_to_response(d))
        else:
            if d["classification"] == "public":
                docs.append(_doc_to_response(d))

    return docs


@router.get("/{document_id}/access", response_model=AccessGrantResponse)
async def check_access(document_id: str, request: Request, user: dict = Depends(get_current_user)):
    """
    Run the 10-step Zero-Trust access engine and return the decision.
    Does NOT stream — only returns ALLOW/DENY metadata.
    """
    token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    client_ip = request.client.host if request.client else "127.0.0.1"
    supabase = get_service_supabase()

    decision = await run_access_engine(
        token=token,
        document_id=document_id,
        client_ip=client_ip,
        supabase=supabase,
    )

    # Audit log
    append_audit({
        "user_uid": user.get("uid", "unknown"),
        "user_email": user.get("email", ""),
        "document_id": document_id,
        "action": "ALLOW" if decision.allowed else "DENY",
        "reason_code": decision.reason_code,
        "client_ip": client_ip,
        "metadata": {},
    })

    doc = MOCK_DOCUMENTS.get(document_id)
    return AccessGrantResponse(
        allowed=decision.allowed,
        reason_code=decision.reason_code,
        reason=decision.reason,
        download=decision.download,
        share=decision.share,
        document=_doc_to_response(doc) if doc and decision.allowed else None,
    )


@router.get("/{document_id}/download")
async def download_document(document_id: str, request: Request, user: dict = Depends(get_current_user)):
    """
    Run access engine → stream document in 64 KB chunks with per-chunk revocation check.
    Any DENY → 403 immediately.
    """
    token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    client_ip = request.client.host if request.client else "127.0.0.1"
    supabase = get_service_supabase()

    decision = await run_access_engine(
        token=token,
        document_id=document_id,
        client_ip=client_ip,
        supabase=supabase,
    )

    # Audit
    append_audit({
        "user_uid": user.get("uid", "unknown"),
        "user_email": user.get("email", ""),
        "document_id": document_id,
        "action": "ALLOW" if decision.allowed else "DENY",
        "reason_code": decision.reason_code,
        "client_ip": client_ip,
        "metadata": {"action": "download"},
    })

    if not decision.allowed:
        raise HTTPException(
            403,
            detail={
                "reason_code": decision.reason_code,
                "reason": decision.reason,
            },
        )

    # Fetch content
    content = MOCK_CONTENT.get(document_id, b"[No content available]")
    doc = MOCK_DOCUMENTS.get(document_id, {})
    filename = f"{document_id}.txt"

    return StreamingResponse(
        stream_document_chunks(document_id, token, content),
        media_type="text/plain",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Document-ID": document_id,
            "X-Classification": doc.get("classification", "unknown"),
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache",
        },
    )
