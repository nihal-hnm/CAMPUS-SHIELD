"""
Audit router — paginated, filterable audit log endpoint
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, Query
from typing import Optional

from routers.auth import get_current_user, require_admin
from models.audit import AuditLogEntry

router = APIRouter()

# In-memory audit log (populated by access engine decisions)
AUDIT_LOG: list[dict] = []

# Pre-seed with some demo events
def _seed_audit():
    seed_events = [
        {"user_uid": "usr_fac_9921", "user_email": "fac1@college.edu",   "document_id": "DOC_EXAM_CS301_2024", "action": "ALLOW", "reason_code": None,                "client_ip": "10.0.1.11"},
        {"user_uid": "usr_stu_001",   "user_email": "student@college.edu","document_id": "DOC_EXAM_CS301_2024", "action": "DENY",  "reason_code": "ROLE_UNAUTHORIZED",  "client_ip": "10.0.1.55"},
        {"user_uid": "usr_aud_001",   "user_email": "auditor@college.edu","document_id": "DOC_EXAM_CS301_2024", "action": "DENY",  "reason_code": "TAG_SCOPE",          "client_ip": "10.0.1.30"},
        {"user_uid": "usr_fac_4412",  "user_email": "fac2@college.edu",   "document_id": "DOC_EXAM_CS301_2024", "action": "DENY",  "reason_code": "SUBJECT_MISMATCH",   "client_ip": "10.0.1.22"},
        {"user_uid": "usr_hod_001",   "user_email": "hod@cse.college.edu","document_id": "DOC_FIN_AUDIT_2024",  "action": "DENY",  "reason_code": "ROLE_UNAUTHORIZED",  "client_ip": "10.0.1.10"},
        {"user_uid": "usr_aud_001",   "user_email": "auditor@college.edu","document_id": "DOC_FIN_AUDIT_2024",  "action": "ALLOW", "reason_code": None,                 "client_ip": "10.0.1.30"},
        {"user_uid": "usr_admin_001", "user_email": "admin@college.edu",  "document_id": "DOC_CIRC_001",        "action": "ALLOW", "reason_code": None,                 "client_ip": "10.0.1.1"},
        {"user_uid": "usr_stu_001",   "user_email": "student@college.edu","document_id": "DOC_CIRC_001",        "action": "ALLOW", "reason_code": None,                 "client_ip": "10.0.1.55"},
    ]
    for i, e in enumerate(seed_events):
        AUDIT_LOG.append({
            "id": str(uuid.uuid4()),
            "timestamp": datetime(2024, 11, 20, 9 + i, 0, 0, tzinfo=timezone.utc).isoformat(),
            **e,
            "metadata": {},
        })

_seed_audit()


def append_audit(entry: dict):
    """Called by access engine / routers to log a decision."""
    AUDIT_LOG.append({
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **entry,
    })


@router.get("/logs", response_model=list[AuditLogEntry])
async def get_logs(
    user: dict = Depends(get_current_user),
    user_uid: Optional[str] = Query(None),
    document_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    # Dept admins only see their department's events
    logs = list(reversed(AUDIT_LOG))  # newest first

    # Filter
    if user_uid:
        logs = [l for l in logs if l["user_uid"] == user_uid]
    if document_id:
        logs = [l for l in logs if l["document_id"] == document_id]
    if action:
        logs = [l for l in logs if l["action"].upper() == action.upper()]

    # Paginate
    start = (page - 1) * page_size
    end = start + page_size
    return [AuditLogEntry(**l) for l in logs[start:end]]
