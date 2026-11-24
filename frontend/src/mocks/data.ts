// ─── CampusVault Mock Data ─────────────────────────────────────────────────────
// Admin-added users, documents, etc. are persisted to localStorage so they
// survive page refreshes. Seed accounts (ultra_admin) are always present.
import type { User } from '../types/user';
import type { Document } from '../types/document';
import type { AuditLog } from '../types/audit';
import type { AccessRequest, Permission } from '../types/permission';

// ── Storage keys ───────────────────────────────────────────────────────────────
const LS_USERS = 'cv_users_v1';
const LS_CREDS = 'cv_creds_v1';
const LS_DOCS  = 'cv_docs_v1';
const LS_PERMS = 'cv_perms_v1';
const LS_REQS  = 'cv_reqs_v1';
const LS_DEPTS = 'cv_depts_v1';

function lsGet<T>(key: string): T | null {
  try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : null; } catch { return null; }
}
function lsSet(key: string, val: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Departments ────────────────────────────────────────────────────────────────
export interface Department {
  id: string; name: string; code: string;
  hod_id?: string; hod_name?: string;
  subjects: string[];
  student_count: number; faculty_count: number;
  status: 'active' | 'inactive';
  faculties?: FacultyEntry[];
  students?: Student[];
}

export interface FacultyEntry {
  uid: string; name: string; email: string; subject?: string; role: 'hod' | 'faculty';
}

export interface Student {
  uid: string; name: string; email: string; roll_no: string; year: number;
  status: 'active' | 'inactive' | 'graduated';
}

const SEED_DEPARTMENTS: Department[] = [
  { id: 'dept_cse', name: 'B.Tech CSE',      code: 'CSE', subjects: ['CS-101','CS-201','CS-301','CS-302','CS-401'], student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
  { id: 'dept_bph', name: 'B.Pharmacy',       code: 'BPH', subjects: ['PH-101','PH-201','PH-301','PH-401'],         student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
  { id: 'dept_for', name: 'Forensic Science', code: 'FOR', subjects: ['FS-101','FS-201','FS-301'],                   student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
  { id: 'dept_hm',  name: 'Hotel Management', code: 'HM',  subjects: ['HM-101','HM-201','HM-301'],                   student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
  { id: 'dept_agr', name: 'Agriculture',      code: 'AGR', subjects: ['AG-101','AG-201','AG-301','AG-401'],          student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
  { id: 'dept_bba', name: 'BBA',              code: 'BBA', subjects: ['BBA-101','BBA-201','BBA-301'],                student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
  { id: 'dept_law', name: 'Law',              code: 'LAW', subjects: ['LAW-101','LAW-201','LAW-301','LAW-401'],      student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
];

// Merge persisted dept changes (student counts, faculty lists) over seed
function loadDepartments(): Department[] {
  const saved = lsGet<Department[]>(LS_DEPTS);
  if (!saved) return SEED_DEPARTMENTS.map(d => ({...d}));
  // Merge: seed provides base, saved overrides per id
  const map = new Map(saved.map(d => [d.id, d]));
  return SEED_DEPARTMENTS.map(d => map.get(d.id) ?? d);
}

export let MOCK_DEPARTMENTS: Department[] = loadDepartments();
export const DEPT_NAMES = MOCK_DEPARTMENTS.map(d => d.code);

export function saveDepartments(): void { lsSet(LS_DEPTS, MOCK_DEPARTMENTS); }

// ── Seed ultra_admin user ──────────────────────────────────────────────────────
const SEED_USER: User = {
  uid: 'usr_ultra_001',
  email: 'ultraadmin@campusvault.edu',
  name: 'Ultra Admin',
  role: 'ultra_admin' as any,
  department: 'ALL',
  assigned_subjects: [],
  special_tags: ['ultra_admin'],
  status: 'active',
  last_active_at: new Date().toISOString(),
  last_reauth_at: new Date().toISOString(),
  created_at: '2024-01-01T00:00:00Z',
};

// Seed credentials — always present, never overwritten
const SEED_CREDENTIALS: Record<string, { password: string; uid: string }> = {
  'ultraadmin@campusvault.edu': { password: 'UltraSecure@2024!', uid: 'usr_ultra_001' },
};

// ── Users (seed + persisted) ───────────────────────────────────────────────────
function loadUsers(): User[] {
  const saved = lsGet<User[]>(LS_USERS) ?? [];
  // Always put seed first, deduplicate by uid
  const all = [SEED_USER, ...saved.filter(u => u.uid !== SEED_USER.uid)];
  return all;
}

function loadCredentials(): Record<string, { password: string; uid: string }> {
  const saved = lsGet<Record<string, { password: string; uid: string }>>(LS_CREDS) ?? {};
  return { ...saved, ...SEED_CREDENTIALS }; // seed always wins
}

export let MOCK_USERS: User[] = loadUsers();
export let MOCK_CREDENTIALS: Record<string, { password: string; uid: string }> = loadCredentials();

export function saveUsers(): void {
  // Persist all except seed
  const toSave = MOCK_USERS.filter(u => u.uid !== SEED_USER.uid);
  lsSet(LS_USERS, toSave);
  // Persist credentials except seed
  const { 'ultraadmin@campusvault.edu': _seed, ...rest } = MOCK_CREDENTIALS;
  lsSet(LS_CREDS, rest);
}

// ── Documents (persisted) ──────────────────────────────────────────────────────
export let MOCK_DOCUMENTS: Document[] = lsGet<Document[]>(LS_DOCS) ?? [];

export function saveDocuments(): void { lsSet(LS_DOCS, MOCK_DOCUMENTS); }

// ── Permissions (persisted) ────────────────────────────────────────────────────
export let MOCK_PERMISSIONS: Permission[] = lsGet<Permission[]>(LS_PERMS) ?? [];

export function savePermissions(): void { lsSet(LS_PERMS, MOCK_PERMISSIONS); }

// ── Audit Logs ─────────────────────────────────────────────────────────────────
export const MOCK_AUDIT_LOGS: AuditLog[] = [];

// ── Access Requests (persisted) ────────────────────────────────────────────────
export let MOCK_REQUESTS: AccessRequest[] = lsGet<AccessRequest[]>(LS_REQS) ?? [];

export function saveRequests(): void { lsSet(LS_REQS, MOCK_REQUESTS); }

// ── Magic Links ────────────────────────────────────────────────────────────────
export interface MagicLink {
  token: string; document_id: string; document_title: string;
  created_by: string; created_by_name: string;
  expires_at: string; accessed: boolean;
}
export let MOCK_MAGIC_LINKS: MagicLink[] = [];

// ── Ultra Admin Credentials (shown here only, never on frontend UI) ────────────
// Email:    ultraadmin@campusvault.edu
// Password: UltraSecure@2024!
// Role:     ultra_admin — can create admins, HODs, faculties, students
// ─────────────────────────────────────────────────────────────────────────────
