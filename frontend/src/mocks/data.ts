// ─── CampusVault Live Data Store (Backed by Supabase Postgres) ─────────────────
// Zero browser data storage (no localStorage). Every laptop syncs from Supabase.
import type { User } from '../types/user';
import type { Document } from '../types/document';
import type { AuditLog } from '../types/audit';
import type { AccessRequest, Permission } from '../types/permission';
import {
  upsertUsersToSupabase,
  upsertDepartmentsToSupabase,
  upsertDocumentsToSupabase,
  upsertPermissionsToSupabase,
  upsertRequestsToSupabase,
  upsertMagicLinksToSupabase,
  upsertAssignmentTasksToSupabase,
  upsertAssignmentsToSupabase,
} from '../services/dbSync';

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

export let MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept_cse', name: 'B.Tech CSE',       code: 'CSE', subjects: ['Python','Web Development','Maths','Generative AI'], student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
  { id: 'dept_bph', name: 'B.Pharmacy',       code: 'BPH', subjects: ['Anatomy','Physiology','Chemistry'],                 student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
  { id: 'dept_for', name: 'Forensic Science', code: 'FOR', subjects: ['Forensic Biology','Crime Scene Investigation','Toxicology'], student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
  { id: 'dept_hm',  name: 'Hotel Management', code: 'HM',  subjects: ['Food Production','Front Office','Housekeeping'],              student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
  { id: 'dept_agr', name: 'Agriculture',      code: 'AGR', subjects: ['Agronomy','Soil Science','Horticulture','Plant Pathology'],     student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
  { id: 'dept_bba', name: 'BBA',              code: 'BBA', subjects: ['Principles of Management','Marketing','Financial Accounting'],  student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
  { id: 'dept_law', name: 'Law',              code: 'LAW', subjects: ['Constitutional Law','Criminal Law','Contract Law','Corporate Law'], student_count: 0, faculty_count: 0, status: 'active', faculties: [], students: [] },
];

export const DEPT_NAMES = MOCK_DEPARTMENTS.map(d => d.code);

export function saveDepartments(): void {
  void upsertDepartmentsToSupabase(MOCK_DEPARTMENTS);
}

export let MOCK_USERS: User[] = [];

export function saveUsers(): void {
  void upsertUsersToSupabase(MOCK_USERS);
}

export let MOCK_DOCUMENTS: Document[] = [];

export function saveDocuments(): void {
  void upsertDocumentsToSupabase(MOCK_DOCUMENTS);
}

export let MOCK_PERMISSIONS: Permission[] = [];

export function savePermissions(): void {
  void upsertPermissionsToSupabase(MOCK_PERMISSIONS);
}

export const MOCK_AUDIT_LOGS: AuditLog[] = [];

export let MOCK_REQUESTS: AccessRequest[] = [];

export function saveRequests(): void {
  void upsertRequestsToSupabase(MOCK_REQUESTS);
}

export interface MagicLink {
  token: string; document_id: string; document_title: string;
  created_by: string; created_by_name: string;
  expires_at: string; accessed: boolean;
}
export let MOCK_MAGIC_LINKS: MagicLink[] = [];

export function saveMagicLinks(): void {
  void upsertMagicLinksToSupabase(MOCK_MAGIC_LINKS);
}

export interface AssignedTask {
  id: string;
  title: string;
  problem_statement: string;
  subject: string;
  department: string;
  due_date?: string;
  assigned_by: string;
  assigned_by_name: string;
  created_at: string;
}

export let MOCK_ASSIGNMENT_TASKS: AssignedTask[] = [];

export function saveAssignmentTasks(): void {
  void upsertAssignmentTasksToSupabase(MOCK_ASSIGNMENT_TASKS);
}

export interface AssignmentSubmission {
  id: string;
  task_id?: string;
  title: string;
  subject: string;
  department: string;
  student_uid: string;
  student_name: string;
  student_roll?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_data_url?: string;
  notes?: string;
  submitted_at: string;
  grade?: string;
  feedback?: string;
  graded_by?: string;
  graded_by_name?: string;
  graded_at?: string;
  status: 'submitted' | 'graded';
}

export let MOCK_ASSIGNMENTS: AssignmentSubmission[] = [];

export function saveAssignments(): void {
  void upsertAssignmentsToSupabase(MOCK_ASSIGNMENTS);
}
