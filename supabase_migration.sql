-- ============================================================
--  CampusShield — Supabase Postgres Multi-Laptop Sync Migration
--  Run this ONCE in Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

-- 1. Update public.users for ultra_admin, password_hash, roll_no, and single-device session
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('ultra_admin','super_admin','dept_admin','faculty','financial_auditor','student'));

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS roll_no TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active_session_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_reauth_at TIMESTAMPTZ DEFAULT NOW();

-- Remove old dummy seed data
DELETE FROM public.documents WHERE document_id IN (
  'DOC_EXAM_CS301_2024','DOC_EXAM_CS302_2024','DOC_FIN_AUDIT_2024','DOC_CIRC_001','DOC_SYL_CS301'
);
DELETE FROM public.users WHERE uid IN (
  'usr_admin_001','usr_hod_001','usr_fac_9921','usr_fac_4412','usr_aud_001','usr_stu_001'
);

-- Seed Ultra Admin (Password hashed with SHA-256)
INSERT INTO public.users (uid, email, name, role, department, assigned_subjects, special_tags, status, password_hash)
VALUES (
  'usr_ultra_001',
  'ultraadmin@campusvault.edu',
  'Ultra Admin',
  'ultra_admin',
  'ALL',
  '{}',
  '{ultra_admin}',
  'active',
  '61945ae48355a6e9fa6764c604accceee3279d26d62f4401387d785cc7676700'
)
ON CONFLICT (email) DO UPDATE SET
  role = 'ultra_admin',
  status = 'active',
  password_hash = EXCLUDED.password_hash;

-- 2. Update public.documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS uploader_name TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_category_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_category_check
  CHECK (category IN ('exam_paper','financial','circular','syllabus','assignment','research','general','other'));

-- 3. Departments table (7 core departments)
CREATE TABLE IF NOT EXISTS public.departments (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  code          TEXT UNIQUE NOT NULL,
  hod_id        TEXT,
  hod_name      TEXT,
  subjects      TEXT[] DEFAULT '{}',
  student_count INT NOT NULL DEFAULT 0,
  faculty_count INT NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active',
  faculties     JSONB NOT NULL DEFAULT '[]'::jsonb,
  students      JSONB NOT NULL DEFAULT '[]'::jsonb
);

INSERT INTO public.departments (id, name, code, subjects, student_count, faculty_count, status, faculties, students)
VALUES
  ('dept_cse', 'B.Tech CSE',       'CSE', ARRAY['Python','Web Development','Maths','Generative AI'], 0, 0, 'active', '[]', '[]'),
  ('dept_bph', 'B.Pharmacy',       'BPH', ARRAY['Anatomy','Physiology','Chemistry'],                 0, 0, 'active', '[]', '[]'),
  ('dept_for', 'Forensic Science', 'FOR', '{FS-101,FS-201,FS-301}',               0, 0, 'active', '[]', '[]'),
  ('dept_hm',  'Hotel Management', 'HM',  '{HM-101,HM-201,HM-301}',               0, 0, 'active', '[]', '[]'),
  ('dept_agr', 'Agriculture',      'AGR', '{AG-101,AG-201,AG-301,AG-401}',        0, 0, 'active', '[]', '[]'),
  ('dept_bba', 'BBA',              'BBA', '{BBA-101,BBA-201,BBA-301}',            0, 0, 'active', '[]', '[]'),
  ('dept_law', 'Law',              'LAW', '{LAW-101,LAW-201,LAW-301,LAW-401}',    0, 0, 'active', '[]', '[]')
ON CONFLICT (id) DO NOTHING;

UPDATE public.departments SET subjects = ARRAY['Python','Web Development','Maths','Generative AI'] WHERE id = 'dept_cse';
UPDATE public.departments SET subjects = ARRAY['Anatomy','Physiology','Chemistry'] WHERE id = 'dept_bph';

-- 4. Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  user_name       TEXT,
  resource_id     TEXT NOT NULL,
  resource_title  TEXT,
  resource_type   TEXT NOT NULL DEFAULT 'document',
  level           TEXT NOT NULL,
  source          TEXT NOT NULL DEFAULT 'Direct',
  granted_by      TEXT NOT NULL,
  granted_by_name TEXT,
  granted_on      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'active'
);

-- 5. Access Requests table
CREATE TABLE IF NOT EXISTS public.access_requests (
  id              TEXT PRIMARY KEY,
  requester_id    TEXT NOT NULL,
  requester_name  TEXT,
  requester_role  TEXT,
  resource_id     TEXT NOT NULL,
  resource_title  TEXT,
  resource_type   TEXT NOT NULL DEFAULT 'document',
  permission      TEXT NOT NULL,
  reason          TEXT NOT NULL,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'pending',
  reviewed_by     TEXT,
  reviewed_by_name TEXT,
  reviewed_at     TIMESTAMPTZ
);

-- 6. Magic Links table
CREATE TABLE IF NOT EXISTS public.magic_links (
  token           TEXT PRIMARY KEY,
  document_id     TEXT NOT NULL,
  document_title  TEXT NOT NULL,
  created_by      TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  accessed        BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7. Assignment Tasks (Faculty problem statements)
CREATE TABLE IF NOT EXISTS public.assignment_tasks (
  id                TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  subject           TEXT NOT NULL,
  department        TEXT NOT NULL,
  due_date          TEXT,
  assigned_by       TEXT NOT NULL,
  assigned_by_name  TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Assignment Submissions & Grades
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id              TEXT PRIMARY KEY,
  task_id         TEXT,
  title           TEXT NOT NULL,
  subject         TEXT NOT NULL,
  department      TEXT NOT NULL,
  student_uid     TEXT NOT NULL,
  student_name    TEXT NOT NULL,
  student_roll    TEXT,
  file_name       TEXT NOT NULL,
  file_size       BIGINT NOT NULL DEFAULT 0,
  file_type       TEXT NOT NULL DEFAULT 'pdf',
  file_data_url   TEXT,
  notes           TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  grade           TEXT,
  feedback        TEXT,
  graded_by       TEXT,
  graded_by_name  TEXT,
  graded_at       TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'submitted'
);

-- 9. Row Level Security policies for multi-laptop DB sync
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_links            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs             ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_anon_users"       ON public.users;
DROP POLICY IF EXISTS "deny_anon_docs"        ON public.documents;
DROP POLICY IF EXISTS "deny_anon_audit"       ON public.audit_logs;
DROP POLICY IF EXISTS "app_all_users"         ON public.users;
DROP POLICY IF EXISTS "app_all_docs"          ON public.documents;
DROP POLICY IF EXISTS "app_all_depts"         ON public.departments;
DROP POLICY IF EXISTS "app_all_perms"         ON public.permissions;
DROP POLICY IF EXISTS "app_all_reqs"          ON public.access_requests;
DROP POLICY IF EXISTS "app_all_magic"         ON public.magic_links;
DROP POLICY IF EXISTS "app_all_tasks"         ON public.assignment_tasks;
DROP POLICY IF EXISTS "app_all_subs"          ON public.assignment_submissions;
DROP POLICY IF EXISTS "app_all_audit"         ON public.audit_logs;

CREATE POLICY "app_all_users"  ON public.users                  FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "app_all_docs"   ON public.documents              FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "app_all_depts"  ON public.departments            FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "app_all_perms"  ON public.permissions            FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "app_all_reqs"   ON public.access_requests        FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "app_all_magic"  ON public.magic_links            FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "app_all_tasks"  ON public.assignment_tasks       FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "app_all_subs"   ON public.assignment_submissions FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "app_all_audit"  ON public.audit_logs             FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- 10. Refresh PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
