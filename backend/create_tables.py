"""
CampusShield — Supabase table creation via Management API (chunked)
Run: python create_tables.py
"""
import os, sys, httpx, time
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SERVICE_KEY  = os.getenv("SUPABASE_SERVICE_KEY", "")

# Project ref from URL
PROJECT_REF = SUPABASE_URL.split("//")[1].split(".")[0]  # xalhgjacioulkqcxfleu

# The Management API requires a Supabase access token (not anon key).
# We'll use the direct Postgres connection via supabase-py's rpc if available,
# or fall back to running individual table creates via POST to /rest/v1/rpc

HEADERS = {
    "apikey":        SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type":  "application/json",
}

REST = f"{SUPABASE_URL}/rest/v1"

# DDL statements split into individual chunks (each small enough for the API)
DDL_STATEMENTS = [
    # 1. Users table
    """
CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'ALL',
  assigned_subjects TEXT[] DEFAULT '{}',
  special_tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
""",
    # 2. Documents table
    """
CREATE TABLE IF NOT EXISTS documents (
  document_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'ALL',
  subject_id TEXT,
  category TEXT NOT NULL,
  classification TEXT NOT NULL,
  uploaded_by TEXT,
  storage_path TEXT,
  file_size BIGINT,
  mime_type TEXT DEFAULT 'application/pdf',
  emergency_locked BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
""",
    # 3. Access grants
    """
CREATE TABLE IF NOT EXISTS access_grants (
  grant_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  granted_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
""",
    # 4. Revocations
    """
CREATE TABLE IF NOT EXISTS revocations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT,
  revoked_by TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lifted_at TIMESTAMPTZ,
  lifted_by TEXT
)
""",
    # 5. Audit logs
    """
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT,
  user_role TEXT,
  special_tags TEXT[] DEFAULT '{}',
  document_id TEXT,
  action TEXT NOT NULL,
  failure_reason TEXT,
  reason_code TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
""",
    # 6. Sessions
    """
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_ip TEXT,
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reauth_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE
)
""",
    # 7. Indexes
    "CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_audit_doc ON audit_logs(document_id)",
    "CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_revocations_target ON revocations(target_id)",
    "CREATE INDEX IF NOT EXISTS idx_docs_dept ON documents(department)",
]


def run_sql(sql: str, label: str) -> bool:
    """Execute SQL via Supabase Management API."""
    r = httpx.post(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
        },
        json={"query": sql.strip()},
        timeout=30,
    )
    if r.status_code in (200, 201, 204):
        print(f"  ✅ {label}")
        return True
    else:
        print(f"  ⚠️  {label}: {r.status_code} — {r.text[:150]}")
        return False


def upsert(table: str, rows: list[dict]) -> None:
    r = httpx.post(
        f"{REST}/{table}",
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=rows,
        timeout=20,
    )
    if r.status_code in (200, 201, 204):
        print(f"  ✅ Seeded {table}: {len(rows)} rows")
    else:
        print(f"  ⚠️  Seed {table}: {r.status_code} — {r.text[:200]}")


USERS = [
    {"uid": "usr_admin_001", "email": "admin@college.edu",    "name": "Principal Kumar",   "role": "super_admin",       "department": "ALL", "assigned_subjects": [],         "special_tags": [],                   "status": "active"},
    {"uid": "usr_hod_001",   "email": "hod@cse.college.edu",  "name": "Dr. Ananya Verma",  "role": "dept_admin",         "department": "CSE", "assigned_subjects": [],         "special_tags": ["HOD"],              "status": "active"},
    {"uid": "usr_fac_9921",  "email": "fac1@college.edu",     "name": "Dr. Priya Singh",   "role": "faculty",            "department": "CSE", "assigned_subjects": ["CS-301"], "special_tags": [],                   "status": "active"},
    {"uid": "usr_fac_4412",  "email": "fac2@college.edu",     "name": "Dr. Rahul Sharma",  "role": "faculty",            "department": "CSE", "assigned_subjects": ["CS-302"], "special_tags": [],                   "status": "active"},
    {"uid": "usr_aud_001",   "email": "auditor@college.edu",  "name": "Auditor Roy",       "role": "financial_auditor",  "department": "ALL", "assigned_subjects": [],         "special_tags": ["financial_auditor"], "status": "active"},
    {"uid": "usr_stu_001",   "email": "student@college.edu",  "name": "Riya Patel",        "role": "student",            "department": "CSE", "assigned_subjects": [],         "special_tags": [],                   "status": "active"},
]

DOCUMENTS = [
    {"document_id": "DOC_EXAM_CS301_2024", "title": "CS-301 End-Sem Examination Paper",   "department": "CSE", "subject_id": "CS-301", "category": "exam_paper", "classification": "confidential", "uploaded_by": "usr_fac_9921",  "emergency_locked": False, "status": "active"},
    {"document_id": "DOC_EXAM_CS302_2024", "title": "CS-302 End-Sem Examination Paper",   "department": "CSE", "subject_id": "CS-302", "category": "exam_paper", "classification": "confidential", "uploaded_by": "usr_fac_4412",  "emergency_locked": False, "status": "active"},
    {"document_id": "DOC_FIN_AUDIT_2024",  "title": "Annual Financial Audit Report 2024", "department": "ALL", "subject_id": None,      "category": "financial",  "classification": "restricted",   "uploaded_by": "usr_admin_001", "emergency_locked": False, "status": "active"},
    {"document_id": "DOC_CIRC_001",        "title": "Exam Schedule Circular Nov 2024",    "department": "ALL", "subject_id": None,      "category": "circular",   "classification": "public",       "uploaded_by": "usr_admin_001", "emergency_locked": False, "status": "active"},
    {"document_id": "DOC_SYL_CS301",       "title": "CS-301 Course Syllabus 2024-25",     "department": "CSE", "subject_id": "CS-301",  "category": "syllabus",   "classification": "internal",     "uploaded_by": "usr_fac_9921",  "emergency_locked": False, "status": "active"},
]


def main():
    print(f"\n🛡️  CampusShield — Supabase Table Creator")
    print(f"   Project: {PROJECT_REF}")
    print(f"   Key type: {'service' if 'secret' in SERVICE_KEY else 'publishable/anon'}\n")

    print("── Creating tables ───────────────────────────────────")
    labels = [
        "CREATE TABLE users",
        "CREATE TABLE documents",
        "CREATE TABLE access_grants",
        "CREATE TABLE revocations",
        "CREATE TABLE audit_logs",
        "CREATE TABLE sessions",
        "CREATE INDEX audit_user",
        "CREATE INDEX audit_doc",
        "CREATE INDEX audit_created",
        "CREATE INDEX revocations_target",
        "CREATE INDEX docs_dept",
    ]
    for sql, label in zip(DDL_STATEMENTS, labels):
        run_sql(sql, label)
        time.sleep(0.3)

    print("\n── Seeding data ──────────────────────────────────────")
    # Check if tables exist first by trying a select
    r = httpx.get(f"{REST}/users?select=uid&limit=1", headers=HEADERS, timeout=10)
    if r.status_code == 200:
        upsert("users", USERS)
        upsert("documents", DOCUMENTS)
        print("\n🎉 Done! Tables created and seeded.")
    else:
        print(f"\n⚠️  Tables not accessible via REST yet ({r.status_code}).")
        print("   The service key may need RLS policies disabled, or use the Supabase dashboard:")
        print("   → SQL Editor → paste supabase_schema.sql → Run")
        print("   Then re-run: python setup_db.py\n")


if __name__ == "__main__":
    main()
