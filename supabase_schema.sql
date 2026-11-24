-- ============================================================
--  CampusShield — Supabase Database Schema
--  Run this in the Supabase SQL Editor (project → SQL)
--  NexHack 2.0 — PS 07
-- ============================================================

-- ── Enable UUID extension ──────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. Users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  uid                 TEXT PRIMARY KEY,
  email               TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  role                TEXT NOT NULL CHECK (role IN (
                        'super_admin','dept_admin','faculty',
                        'financial_auditor','student')),
  department          TEXT NOT NULL DEFAULT 'ALL',
  assigned_subjects   TEXT[]  DEFAULT '{}',
  special_tags        TEXT[]  DEFAULT '{}',
  status              TEXT    NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','inactive','suspended')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Documents ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  document_id         TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  department          TEXT NOT NULL DEFAULT 'ALL',
  subject_id          TEXT,
  category            TEXT NOT NULL CHECK (category IN (
                        'exam_paper','financial','circular',
                        'syllabus','assignment','other')),
  classification      TEXT NOT NULL CHECK (classification IN (
                        'public','internal','restricted','confidential')),
  uploaded_by         TEXT REFERENCES users(uid),
  storage_path        TEXT,           -- Supabase Storage bucket path
  file_size           BIGINT,
  mime_type           TEXT DEFAULT 'application/pdf',
  emergency_locked    BOOLEAN NOT NULL DEFAULT FALSE,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','archived','deleted')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Access Grants (time-limited share links, ≤1 hr) ─────
CREATE TABLE IF NOT EXISTS access_grants (
  grant_id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id             TEXT NOT NULL REFERENCES users(uid),
  document_id         TEXT NOT NULL REFERENCES documents(document_id),
  granted_by          TEXT NOT NULL REFERENCES users(uid),
  expires_at          TIMESTAMPTZ NOT NULL,
  is_revoked          BOOLEAN NOT NULL DEFAULT FALSE,
  revoke_reason       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Revocations (emergency lockdowns) ───────────────────
CREATE TABLE IF NOT EXISTS revocations (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type                TEXT NOT NULL CHECK (type IN (
                        'DOCUMENT_LOCKDOWN','USER_LOCKDOWN',
                        'DEPARTMENT_LOCKDOWN','TOKEN_REVOKE')),
  target_id           TEXT NOT NULL,   -- doc_id | uid | dept | token
  reason              TEXT,
  revoked_by          TEXT REFERENCES users(uid),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lifted_at           TIMESTAMPTZ,
  lifted_by           TEXT REFERENCES users(uid)
);

-- ── 5. Audit Logs (append-only, immutable) ─────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id             TEXT,            -- NULL for unauthenticated attempts
  user_role           TEXT,
  special_tags        TEXT[] DEFAULT '{}',
  document_id         TEXT,
  action              TEXT NOT NULL CHECK (action IN ('ALLOW','DENY')),
  failure_reason      TEXT,
  reason_code         TEXT,
  ip_address          TEXT,
  user_agent          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs must NEVER be updated or deleted
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- ── 6. Sessions (optional — for server-side session tracking) ──
CREATE TABLE IF NOT EXISTS sessions (
  token_hash          TEXT PRIMARY KEY,  -- SHA-256 of the actual token
  user_id             TEXT NOT NULL REFERENCES users(uid),
  client_ip           TEXT,
  login_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reauth_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL,
  is_revoked          BOOLEAN NOT NULL DEFAULT FALSE
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_doc     ON audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_action  ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revocations_target ON revocations(target_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_grants_expires ON access_grants(expires_at) WHERE is_revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_docs_dept ON documents(department);
CREATE INDEX IF NOT EXISTS idx_docs_classification ON documents(classification);

-- ── Row Level Security ─────────────────────────────────────
-- Enable RLS (backend uses service key to bypass for engine calls)
ALTER TABLE users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE revocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions    ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (used by backend)
-- Anon role: deny everything (all access via backend only)
CREATE POLICY "deny_anon_users"       ON users        FOR ALL TO anon USING (FALSE);
CREATE POLICY "deny_anon_docs"        ON documents    FOR ALL TO anon USING (FALSE);
CREATE POLICY "deny_anon_audit"       ON audit_logs   FOR ALL TO anon USING (FALSE);
CREATE POLICY "deny_anon_revocations" ON revocations  FOR ALL TO anon USING (FALSE);
CREATE POLICY "deny_anon_grants"      ON access_grants FOR ALL TO anon USING (FALSE);
CREATE POLICY "deny_anon_sessions"    ON sessions     FOR ALL TO anon USING (FALSE);

-- ── Seed Data (6 demo users) ───────────────────────────────
INSERT INTO users (uid, email, name, role, department, assigned_subjects, special_tags, status)
VALUES
  ('usr_admin_001', 'admin@college.edu',    'Principal Kumar',   'super_admin',      'ALL', '{}',         '{}',                   'active'),
  ('usr_hod_001',   'hod@cse.college.edu',  'Dr. Ananya Verma',  'dept_admin',       'CSE', '{}',         '{HOD}',                'active'),
  ('usr_fac_9921',  'fac1@college.edu',     'Dr. Priya Singh',   'faculty',          'CSE', '{CS-301}',   '{}',                   'active'),
  ('usr_fac_4412',  'fac2@college.edu',     'Dr. Rahul Sharma',  'faculty',          'CSE', '{CS-302}',   '{}',                   'active'),
  ('usr_aud_001',   'auditor@college.edu',  'Auditor Roy',       'financial_auditor','ALL', '{}',         '{financial_auditor}',  'active'),
  ('usr_stu_001',   'student@college.edu',  'Riya Patel',        'student',          'CSE', '{}',         '{}',                   'active')
ON CONFLICT (uid) DO NOTHING;

INSERT INTO documents (document_id, title, department, subject_id, category, classification, uploaded_by, emergency_locked, status)
VALUES
  ('DOC_EXAM_CS301_2024', 'CS-301 End-Sem Examination Paper',    'CSE','CS-301','exam_paper','confidential','usr_fac_9921',  FALSE,'active'),
  ('DOC_EXAM_CS302_2024', 'CS-302 End-Sem Examination Paper',    'CSE','CS-302','exam_paper','confidential','usr_fac_4412',  FALSE,'active'),
  ('DOC_FIN_AUDIT_2024',  'Annual Financial Audit Report 2024',  'ALL',NULL,   'financial', 'restricted', 'usr_admin_001', FALSE,'active'),
  ('DOC_CIRC_001',        'Exam Schedule Circular Nov 2024',     'ALL',NULL,   'circular',  'public',     'usr_admin_001', FALSE,'active'),
  ('DOC_SYL_CS301',       'CS-301 Course Syllabus 2024-25',      'CSE','CS-301','syllabus', 'internal',   'usr_fac_9921',  FALSE,'active')
ON CONFLICT (document_id) DO NOTHING;
