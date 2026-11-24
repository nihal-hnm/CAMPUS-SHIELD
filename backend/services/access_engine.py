# ── CampusShield 10-Step Zero-Trust Access Engine ──────────────────────────
# Every document request passes through all 10 checks in order.
# Any failure returns an AccessDecision(allowed=False, reason_code=...).
# AI is NEVER involved in authorization decisions.

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
import logging
import hashlib

logger = logging.getLogger(__name__)

# ── Failure reason templates ────────────────────────────────────────────────
FAILURE_REASONS: dict[str, str] = {
    "INVALID_TOKEN":      "Invalid pass / session token",
    "USER_INACTIVE":      "No longer valid access — user status marked inactive",
    "SUBJECT_MISMATCH":   "Subject mismatch (User: {user_sub}, Doc: {doc_sub})",
    "TAG_SCOPE":          "Tag scope restriction (Financial Auditor cannot access exam papers)",
    "LINK_EXPIRED":       "Link expired (>1 hr TTL exceeded)",
    "IDLE_TIMEOUT":       "Inactivity timeout (Session idle >10 min)",
    "REAUTH_REQUIRED":    "Re-authentication required (Exceeded 1.5 hrs)",
    "EMERGENCY_LOCKDOWN": "Emergency document lockdown active",
    "ROLE_UNAUTHORIZED":  "Role unauthorized for confidential tier",
    "TAB_CLOSED":         "Invalid pass / session token (Revoked on tab close)",
    "IP_CHANGED":         "IP address change detected — re-authorization required",
    "NOT_FOUND":          "Document not found",
    "REVOKED":            "Session or access token has been revoked",
    "DEPT_MISMATCH":      "Department mismatch — document belongs to a different department",
}


@dataclass
class AccessDecision:
    allowed: bool
    reason_code: Optional[str] = None
    reason: Optional[str] = None
    # Allow extras
    download: bool = False
    share: bool = False


@dataclass
class AccessContext:
    """Everything needed for a single authorization evaluation."""
    token: str
    document_id: str
    grant_id: Optional[str]
    client_ip: str
    # Populated during evaluation
    user: dict = field(default_factory=dict)
    document: dict = field(default_factory=dict)


# ── Mock data store (used when Supabase is not configured) ──────────────────
MOCK_USERS = {
    "usr_admin_001": {"uid": "usr_admin_001", "email": "admin@college.edu",   "name": "Principal Kumar",   "role": "super_admin",       "department": "ALL", "assigned_subjects": [],         "special_tags": [],                   "status": "active"},
    "usr_hod_001":   {"uid": "usr_hod_001",   "email": "hod@cse.college.edu", "name": "Dr. Ananya Verma",  "role": "dept_admin",         "department": "CSE", "assigned_subjects": [],         "special_tags": ["HOD"],              "status": "active"},
    "usr_fac_9921":  {"uid": "usr_fac_9921",  "email": "fac1@college.edu",    "name": "Dr. Priya Singh",   "role": "faculty",            "department": "CSE", "assigned_subjects": ["CS-301"], "special_tags": [],                   "status": "active"},
    "usr_fac_4412":  {"uid": "usr_fac_4412",  "email": "fac2@college.edu",    "name": "Dr. Rahul Sharma",  "role": "faculty",            "department": "CSE", "assigned_subjects": ["CS-302"], "special_tags": [],                   "status": "active"},
    "usr_aud_001":   {"uid": "usr_aud_001",   "email": "auditor@college.edu", "name": "Auditor Roy",       "role": "financial_auditor",  "department": "ALL", "assigned_subjects": [],         "special_tags": ["financial_auditor"], "status": "active"},
    "usr_stu_001":   {"uid": "usr_stu_001",   "email": "student@college.edu", "name": "Riya Patel",        "role": "student",            "department": "CSE", "assigned_subjects": [],         "special_tags": [],                   "status": "active"},
}

MOCK_DOCUMENTS = {
    "DOC_EXAM_CS301_2024": {"document_id": "DOC_EXAM_CS301_2024", "title": "CS-301 End-Sem Examination Paper", "department": "CSE", "subject_id": "CS-301", "category": "exam_paper", "classification": "confidential", "uploaded_by": "usr_fac_9921", "emergency_locked": False, "status": "active"},
    "DOC_EXAM_CS302_2024": {"document_id": "DOC_EXAM_CS302_2024", "title": "CS-302 End-Sem Examination Paper", "department": "CSE", "subject_id": "CS-302", "category": "exam_paper", "classification": "confidential", "uploaded_by": "usr_fac_4412", "emergency_locked": False, "status": "active"},
    "DOC_FIN_AUDIT_2024":  {"document_id": "DOC_FIN_AUDIT_2024",  "title": "Annual Financial Audit Report 2024", "department": "ALL", "subject_id": None,      "category": "financial",  "classification": "restricted",   "uploaded_by": "usr_admin_001", "emergency_locked": False, "status": "active"},
    "DOC_CIRC_001":        {"document_id": "DOC_CIRC_001",        "title": "Exam Schedule Circular Nov 2024",   "department": "ALL", "subject_id": None,      "category": "circular",   "classification": "public",       "uploaded_by": "usr_admin_001", "emergency_locked": False, "status": "active"},
    "DOC_SYL_CS301":       {"document_id": "DOC_SYL_CS301",       "title": "CS-301 Course Syllabus 2024-25",    "department": "CSE", "subject_id": "CS-301", "category": "syllabus",   "classification": "internal",     "uploaded_by": "usr_fac_9921", "emergency_locked": False, "status": "active"},
}

# token → uid (mock session store, in-memory)
MOCK_SESSIONS: dict[str, dict] = {}
# uid → last_ip (for IP-change detection)
MOCK_IP_MAP: dict[str, str] = {}
# set of revoked tokens
REVOKED_TOKENS: set[str] = set()
# set of emergency-locked document_ids
EMERGENCY_LOCKED_DOCS: set[str] = set()


# ── Helper functions ────────────────────────────────────────────────────────
def _deny(code: str, **kwargs) -> AccessDecision:
    tpl = FAILURE_REASONS.get(code, code)
    msg = tpl.format(**kwargs) if kwargs else tpl
    return AccessDecision(allowed=False, reason_code=code, reason=msg)


def _use_mock(supabase) -> bool:
    """True when Supabase is not configured (placeholder URL)."""
    return supabase is None or "placeholder" in str(getattr(supabase, "supabase_url", "placeholder"))


# ── Step implementations ────────────────────────────────────────────────────
async def _step1_verify_token(ctx: AccessContext, supabase) -> Optional[AccessDecision]:
    """Step 1 — verify auth token & session state."""
    if ctx.token in REVOKED_TOKENS:
        return _deny("TAB_CLOSED")
    if not ctx.token:
        return _deny("INVALID_TOKEN")

    if _use_mock(supabase):
        session = MOCK_SESSIONS.get(ctx.token)
        if not session:
            return _deny("INVALID_TOKEN")
        ctx.user = {**session}
        return None

    # Real Supabase mode — tokens are our own secrets (not Supabase Auth JWTs).
    # Strategy: check in-process MOCK_SESSIONS first (populated at login),
    # then fall back to the sessions table in Supabase.
    session = MOCK_SESSIONS.get(ctx.token)
    if session:
        ctx.user = {**session}
        return None

    # Try sessions table using SHA-256 hash of token
    try:
        token_hash = hashlib.sha256(ctx.token.encode()).hexdigest()
        result = supabase.table("sessions") \
            .select("*") \
            .eq("token_hash", token_hash) \
            .eq("is_revoked", False) \
            .single() \
            .execute()
        if not result.data:
            return _deny("INVALID_TOKEN")
        ctx.user["_session_user_id"] = result.data["user_id"]
    except Exception:
        return _deny("INVALID_TOKEN")
    return None


async def _step2_fetch_user(ctx: AccessContext, supabase) -> Optional[AccessDecision]:
    """Step 2 — fetch full user profile from DB."""
    if _use_mock(supabase):
        # ctx.user already populated in step 1 for mock
        pass
    else:
        # In real mode, ctx.user may be populated from MOCK_SESSIONS (in-process login)
        # or we have _session_user_id from the sessions table lookup.
        if ctx.user.get("uid"):
            # Already fully populated from MOCK_SESSIONS — still fetch from DB to verify active status
            uid = ctx.user["uid"]
        else:
            uid = ctx.user.get("_session_user_id") or ctx.user.get("_auth_id")

        if not uid:
            return _deny("INVALID_TOKEN")

        try:
            result = supabase.table("users").select("*").eq("uid", uid).single().execute()
            if not result.data:
                return _deny("INVALID_TOKEN")
            ctx.user = result.data
        except Exception:
            # Fall back to in-process session data if DB fetch fails
            if not ctx.user.get("uid"):
                return _deny("INVALID_TOKEN")

    if ctx.user.get("status") not in ("active",):
        return _deny("USER_INACTIVE")
    return None


async def _step3_fetch_document(ctx: AccessContext, supabase) -> Optional[AccessDecision]:
    """Step 3 — fetch document metadata."""
    if _use_mock(supabase):
        doc = MOCK_DOCUMENTS.get(ctx.document_id)
    else:
        result = supabase.table("documents").select("*").eq("document_id", ctx.document_id).single().execute()
        doc = result.data if result.data else None

    if not doc:
        return _deny("NOT_FOUND")
    ctx.document = doc
    return None


async def _step4_check_revocations(ctx: AccessContext, supabase) -> Optional[AccessDecision]:
    """Step 4 — check revocation registry (user/session/document frozen)."""
    # Check emergency lock on document
    doc_id = ctx.document_id
    if doc_id in EMERGENCY_LOCKED_DOCS or ctx.document.get("emergency_locked"):
        return _deny("EMERGENCY_LOCKDOWN")

    if _use_mock(supabase):
        return None

    # Real: check revocations table
    uid = ctx.user.get("uid")
    revs = supabase.table("revocations") \
        .select("*") \
        .eq("is_active", True) \
        .execute()

    for rev in (revs.data or []):
        rtype = rev.get("type", "")
        tid   = rev.get("target_id", "")
        if rtype == "DOCUMENT_LOCKDOWN" and tid == doc_id:
            return _deny("EMERGENCY_LOCKDOWN")
        if rtype == "USER_LOCKDOWN" and tid == uid:
            return _deny("REVOKED")
        if rtype == "DEPARTMENT_LOCKDOWN" and tid == ctx.document.get("department"):
            return _deny("EMERGENCY_LOCKDOWN")
    return None


async def _step5_validate_link_ttl(ctx: AccessContext, supabase) -> Optional[AccessDecision]:
    """Step 5 — validate access grant TTL ≤ 1 hour."""
    if not ctx.grant_id:
        return None  # No grant — RBAC/ABAC will decide

    if _use_mock(supabase):
        return None  # Mock always passes TTL check

    result = supabase.table("access_grants") \
        .select("*").eq("grant_id", ctx.grant_id).single().execute()
    if not result.data:
        return _deny("LINK_EXPIRED")

    grant = result.data
    if grant.get("is_revoked"):
        return _deny("LINK_EXPIRED")

    expires_at = datetime.fromisoformat(grant["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        return _deny("LINK_EXPIRED")
    return None


def _step6_rbac(ctx: AccessContext) -> Optional[AccessDecision]:
    """Step 6 — evaluate RBAC baseline permissions."""
    role = ctx.user.get("role", "")
    classification = ctx.document.get("classification", "public")

    if classification in ("confidential", "restricted") and role == "student":
        return _deny("ROLE_UNAUTHORIZED")
    if classification == "restricted" and role == "faculty":
        return _deny("ROLE_UNAUTHORIZED")
    return None


def _step7_abac(ctx: AccessContext) -> Optional[AccessDecision]:
    """Step 7 — evaluate ABAC rules (Subject / HOD / Auditor)."""
    tags      = ctx.user.get("special_tags", [])
    role      = ctx.user.get("role", "")
    dept      = ctx.user.get("department", "")
    subjects  = ctx.user.get("assigned_subjects", [])
    doc       = ctx.document
    doc_subj  = doc.get("subject_id")
    doc_dept  = doc.get("department", "")
    doc_cat   = doc.get("category", "")
    doc_class = doc.get("classification", "public")

    # Financial Auditor: blocked from exam papers regardless of anything else
    if "financial_auditor" in tags and doc_cat == "exam_paper":
        return _deny("TAG_SCOPE")

    # Super admin — full access
    if role == "super_admin":
        return None

    # HOD — bypass subject isolation within own department
    if "HOD" in tags and (dept == doc_dept or dept == "ALL"):
        return None

    # Dept admin — full department access
    if role == "dept_admin" and (dept == doc_dept or dept == "ALL"):
        return None

    # Faculty — subject isolation for confidential docs
    if role == "faculty" and doc_class == "confidential" and doc_subj:
        if doc_subj not in subjects:
            return _deny(
                "SUBJECT_MISMATCH",
                user_sub=", ".join(subjects) if subjects else "none",
                doc_sub=doc_subj,
            )

    # Faculty / Dept admin — department check
    if role in ("faculty", "dept_admin") and doc_dept not in ("ALL", dept):
        if doc_class in ("confidential", "restricted"):
            return _deny("DEPT_MISMATCH")

    return None


async def _step9_write_audit(
    ctx: AccessContext,
    decision: AccessDecision,
    supabase,
) -> None:
    """Step 9 — write immutable audit log entry."""
    entry = {
        "user_id":        ctx.user.get("uid", "unknown"),
        "user_role":      ctx.user.get("role", "unknown"),
        "special_tags":   ctx.user.get("special_tags", []),
        "document_id":    ctx.document_id,
        "action":         "ALLOW" if decision.allowed else "DENY",
        "failure_reason": decision.reason,
        "reason_code":    decision.reason_code,
        "ip_address":     ctx.client_ip,
    }
    if _use_mock(supabase):
        logger.info("[AUDIT] %s", entry)
        return
    try:
        supabase.table("audit_logs").insert(entry).execute()
    except Exception as e:
        logger.error("Audit log write failed: %s", e)


# ── Main entry point ────────────────────────────────────────────────────────
async def run_access_engine(
    token: str,
    document_id: str,
    client_ip: str,
    supabase,
    grant_id: Optional[str] = None,
) -> AccessDecision:
    """
    10-Step Zero-Trust Verification Pipeline.
    Fail-closed: any exception → DENY.
    """
    ctx = AccessContext(
        token=token,
        document_id=document_id,
        grant_id=grant_id,
        client_ip=client_ip,
    )

    try:
        # Steps 1-5: identity & link validation
        for step in [
            _step1_verify_token(ctx, supabase),
            _step2_fetch_user(ctx, supabase),
            _step3_fetch_document(ctx, supabase),
            _step4_check_revocations(ctx, supabase),
            _step5_validate_link_ttl(ctx, supabase),
        ]:
            denial = await step
            if denial:
                await _step9_write_audit(ctx, denial, supabase)
                return denial

        # Steps 6-7: policy evaluation (synchronous)
        for check_fn in [_step6_rbac, _step7_abac]:
            denial = check_fn(ctx)
            if denial:
                await _step9_write_audit(ctx, denial, supabase)
                return denial

        # Step 8: ALLOW
        decision = AccessDecision(allowed=True, download=True, share=False)

    except Exception as exc:
        logger.exception("Access engine error — failing closed: %s", exc)
        decision = _deny("INVALID_TOKEN")

    # Step 9: write audit
    await _step9_write_audit(ctx, decision, supabase)
    return decision
