// ─── CampusVault Mock Data ────────────────────────────────────────────────────
// All dummy data removed. Only seed accounts remain for demo purposes.
// Real data is managed via the admin panel (Add User, Add Dept, etc.)
import type { User } from '../types/user';
import type { Document } from '../types/document';
import type { AuditLog } from '../types/audit';
import type { AccessRequest, Permission } from '../types/permission';

// ── Departments ────────────────────────────────────────────────────────────────
export interface Department {
  id: string;
  name: string;
  code: string;
  hod_id?: string;
  hod_name?: string;
  subjects: string[];
  student_count: number;
  faculty_count: number;
  status: 'active' | 'inactive';
  faculties?: FacultyEntry[];
}

export interface FacultyEntry {
  uid: string;
  name: string;
  email: string;
  subject?: string;
  role: 'hod' | 'faculty';
}

export interface Student {
  uid: string;
  name: string;
  email: string;
  roll_no: string;
  year: number;
  status: 'active' | 'inactive' | 'graduated';
}

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept_cse', name: 'B.Tech CSE',       code: 'CSE', subjects: ['CS-101','CS-201','CS-301','CS-302','CS-401'], student_count: 0, faculty_count: 0, status: 'active', faculties: [] },
  { id: 'dept_bph', name: 'B.Pharmacy',        code: 'BPH', subjects: ['PH-101','PH-201','PH-301','PH-401'],         student_count: 0, faculty_count: 0, status: 'active', faculties: [] },
  { id: 'dept_for', name: 'Forensic Science',  code: 'FOR', subjects: ['FS-101','FS-201','FS-301'],                   student_count: 0, faculty_count: 0, status: 'active', faculties: [] },
  { id: 'dept_hm',  name: 'Hotel Management',  code: 'HM',  subjects: ['HM-101','HM-201','HM-301'],                   student_count: 0, faculty_count: 0, status: 'active', faculties: [] },
  { id: 'dept_agr', name: 'Agriculture',       code: 'AGR', subjects: ['AG-101','AG-201','AG-301','AG-401'],          student_count: 0, faculty_count: 0, status: 'active', faculties: [] },
  { id: 'dept_bba', name: 'BBA',               code: 'BBA', subjects: ['BBA-101','BBA-201','BBA-301'],                student_count: 0, faculty_count: 0, status: 'active', faculties: [] },
  { id: 'dept_law', name: 'Law',               code: 'LAW', subjects: ['LAW-101','LAW-201','LAW-301','LAW-401'],      student_count: 0, faculty_count: 0, status: 'active', faculties: [] },
];

export const DEPT_NAMES = MOCK_DEPARTMENTS.map(d => d.code);

// ── Students (per department, stored in localStorage keyed by dept id) ─────────
export const MOCK_STUDENTS: Record<string, Student[]> = {
  dept_cse: [], dept_bph: [], dept_for: [], dept_hm: [], dept_agr: [], dept_bba: [], dept_law: [],
};

// ── Users ──────────────────────────────────────────────────────────────────────
// Only the ultra_admin seed account exists. All other users are added via the panel.
export let MOCK_USERS: User[] = [
  {
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
  },
];

// ── Documents ──────────────────────────────────────────────────────────────────
export let MOCK_DOCUMENTS: Document[] = [];

// ── Permissions ────────────────────────────────────────────────────────────────
export let MOCK_PERMISSIONS: Permission[] = [];

// ── Audit Logs ─────────────────────────────────────────────────────────────────
export const MOCK_AUDIT_LOGS: AuditLog[] = [];

// ── Access Requests ────────────────────────────────────────────────────────────
export let MOCK_REQUESTS: AccessRequest[] = [];

// ── Magic Links ────────────────────────────────────────────────────────────────
export interface MagicLink {
  token: string;
  document_id: string;
  document_title: string;
  created_by: string;
  created_by_name: string;
  expires_at: string; // ISO
  accessed: boolean;
}
export let MOCK_MAGIC_LINKS: MagicLink[] = [];

// ── Ultra Admin Credentials (shown here only, never on frontend UI) ───────────
// Email:    ultraadmin@campusvault.edu
// Password: UltraSecure@2024!
// Role:     ultra_admin — can create admins and HODs
// ─────────────────────────────────────────────────────────────────────────────

// ── Mock credential store (for offline/demo login) ─────────────────────────────
export const MOCK_CREDENTIALS: Record<string, { password: string; uid: string }> = {
  'ultraadmin@campusvault.edu': { password: 'UltraSecure@2024!', uid: 'usr_ultra_001' },
};
