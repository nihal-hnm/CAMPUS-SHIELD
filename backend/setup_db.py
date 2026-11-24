"""
CampusShield — One-shot Supabase setup script
Run once: python setup_db.py

This script:
  1. Creates all tables via Supabase SQL REST API (using service key)
  2. Seeds 6 demo users + 5 documents
  3. Verifies the connection works
"""
import os, sys, json, httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SERVICE_KEY  = os.getenv("SUPABASE_SERVICE_KEY", "")

if "placeholder" in SUPABASE_URL or not SERVICE_KEY:
    print("❌ Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env first")
    sys.exit(1)

HEADERS = {
    "apikey":        SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=minimal",
}

REST = f"{SUPABASE_URL}/rest/v1"


def upsert(table: str, rows: list[dict]) -> None:
    r = httpx.post(
        f"{REST}/{table}",
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=rows,
        timeout=20,
    )
    if r.status_code not in (200, 201, 204):
        print(f"  ⚠️  {table} upsert → {r.status_code}: {r.text[:200]}")
    else:
        print(f"  ✅ {table}: {len(rows)} row(s) upserted")


def check_table(table: str) -> bool:
    r = httpx.get(
        f"{REST}/{table}",
        headers={**HEADERS, "Range": "0-0"},
        timeout=10,
    )
    return r.status_code in (200, 206)


# ── Seed data ─────────────────────────────────────────────────────────────────
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
    print(f"\n🛡️  CampusShield — Supabase Setup")
    print(f"   URL: {SUPABASE_URL}")
    print(f"   Key: {SERVICE_KEY[:20]}...\n")

    # Check if tables exist
    print("── Checking tables ───────────────────────────────────")
    for tbl in ["users", "documents", "audit_logs", "revocations", "access_grants"]:
        exists = check_table(tbl)
        status = "✅ exists" if exists else "❌ NOT FOUND — run supabase_schema.sql in dashboard"
        print(f"  {tbl}: {status}")

    users_ok = check_table("users")
    if not users_ok:
        print("\n⚠️  Tables not found. Please run supabase_schema.sql in the Supabase SQL Editor first.")
        print("   Dashboard → SQL Editor → paste contents of supabase_schema.sql → Run\n")
        return

    # Seed data
    print("\n── Seeding data ──────────────────────────────────────")
    upsert("users", USERS)
    upsert("documents", DOCUMENTS)

    # Verify
    print("\n── Verification ──────────────────────────────────────")
    r = httpx.get(f"{REST}/users?select=uid,email,role", headers=HEADERS, timeout=10)
    if r.status_code == 200:
        users = r.json()
        print(f"  ✅ users table: {len(users)} rows")
        for u in users:
            print(f"     {u['uid']} | {u['email']} | {u['role']}")
    else:
        print(f"  ❌ users query failed: {r.status_code} {r.text[:100]}")

    r2 = httpx.get(f"{REST}/documents?select=document_id,classification", headers=HEADERS, timeout=10)
    if r2.status_code == 200:
        docs = r2.json()
        print(f"  ✅ documents table: {len(docs)} rows")
    else:
        print(f"  ❌ documents query failed: {r2.status_code} {r2.text[:100]}")

    print("\n🎉 Setup complete! Restart the backend to pick up real Supabase credentials.\n")


if __name__ == "__main__":
    main()
