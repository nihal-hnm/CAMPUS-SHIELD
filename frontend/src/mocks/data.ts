// Mock data for all roles and states — used when VITE_USE_MOCKS=true
import type { User } from '../types/user';
import type { Document } from '../types/document';
import type { AuditLog } from '../types/audit';
import type { AccessRequest, Permission } from '../types/permission';

// ── Departments ───────────────────────────────────────────────────────────────
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
}

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept_cse',  name: 'B.Tech CSE',         code: 'CSE',   hod_id: 'usr_hod_001', hod_name: 'Dr. Ananya Verma',   subjects: ['CS-101','CS-201','CS-301','CS-302','CS-401'], student_count: 180, faculty_count: 12, status: 'active' },
  { id: 'dept_bph',  name: 'B.Pharmacy',          code: 'BPH',   hod_id: undefined,     hod_name: undefined,            subjects: ['PH-101','PH-201','PH-301','PH-401'],         student_count: 120, faculty_count: 8,  status: 'active' },
  { id: 'dept_for',  name: 'Forensic Science',    code: 'FOR',   hod_id: undefined,     hod_name: undefined,            subjects: ['FS-101','FS-201','FS-301'],                   student_count: 90,  faculty_count: 6,  status: 'active' },
  { id: 'dept_hm',   name: 'Hotel Management',    code: 'HM',    hod_id: undefined,     hod_name: undefined,            subjects: ['HM-101','HM-201','HM-301'],                   student_count: 110, faculty_count: 7,  status: 'active' },
  { id: 'dept_agr',  name: 'Agriculture',         code: 'AGR',   hod_id: undefined,     hod_name: undefined,            subjects: ['AG-101','AG-201','AG-301','AG-401'],          student_count: 150, faculty_count: 10, status: 'active' },
  { id: 'dept_bba',  name: 'BBA',                 code: 'BBA',   hod_id: undefined,     hod_name: undefined,            subjects: ['BBA-101','BBA-201','BBA-301'],                student_count: 200, faculty_count: 9,  status: 'active' },
  { id: 'dept_law',  name: 'Law',                 code: 'LAW',   hod_id: undefined,     hod_name: undefined,            subjects: ['LAW-101','LAW-201','LAW-301','LAW-401'],      student_count: 95,  faculty_count: 7,  status: 'active' },
  { id: 'dept_all',  name: 'Administration (ALL)', code: 'ALL',  hod_id: 'usr_admin_001', hod_name: 'Principal Kumar',  subjects: [],                                            student_count: 0,   faculty_count: 0,  status: 'active' },
];

export const DEPT_NAMES = MOCK_DEPARTMENTS.map(d => d.code);

// ── Users ─────────────────────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { uid: 'usr_admin_001', email: 'admin@college.edu',     name: 'Principal Kumar',      role: 'super_admin',       department: 'ALL', assigned_subjects: [],         special_tags: [],                   status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { uid: 'usr_hod_001',   email: 'hod@cse.college.edu',   name: 'Dr. Ananya Verma',     role: 'dept_admin',        department: 'CSE', assigned_subjects: [],         special_tags: ['HOD'],              status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { uid: 'usr_fac_9921',  email: 'fac1@college.edu',      name: 'Dr. Priya Singh',      role: 'faculty',           department: 'CSE', assigned_subjects: ['CS-301'], special_tags: [],                   status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { uid: 'usr_fac_4412',  email: 'fac2@college.edu',      name: 'Dr. Rahul Sharma',     role: 'faculty',           department: 'CSE', assigned_subjects: ['CS-302'], special_tags: [],                   status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { uid: 'usr_fac_bph',   email: 'fac.bph@college.edu',   name: 'Dr. Meena Joshi',      role: 'faculty',           department: 'BPH', assigned_subjects: ['PH-301'], special_tags: [],                   status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { uid: 'usr_fac_law',   email: 'fac.law@college.edu',   name: 'Prof. Arvind Kapoor',  role: 'faculty',           department: 'LAW', assigned_subjects: ['LAW-201'],special_tags: [],                   status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { uid: 'usr_aud_001',   email: 'auditor@college.edu',   name: 'Auditor Roy',          role: 'financial_auditor', department: 'ALL', assigned_subjects: [],         special_tags: ['financial_auditor'],status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { uid: 'usr_stu_001',   email: 'student@college.edu',   name: 'Riya Patel',           role: 'student',           department: 'CSE', assigned_subjects: [],         special_tags: [],                   status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { uid: 'usr_stu_002',   email: 'stu2@college.edu',      name: 'Arjun Mehta',          role: 'student',           department: 'BBA', assigned_subjects: [],         special_tags: [],                   status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-02-01T00:00:00Z' },
  { uid: 'usr_stu_003',   email: 'stu3@college.edu',      name: 'Fatima Khan',          role: 'student',           department: 'LAW', assigned_subjects: [],         special_tags: [],                   status: 'inactive', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-02-10T00:00:00Z' },
];

// ── Documents ─────────────────────────────────────────────────────────────────
export const MOCK_DOCUMENTS: Document[] = [
  { document_id: 'DOC_EXAM_CS301_2024', title: 'CS-301 End-Sem Examination Paper',    department: 'CSE', subject_id: 'CS-301', category: 'exam_paper', classification: 'confidential', uploaded_by: 'usr_fac_9921', uploader_name: 'Dr. Priya Singh',    emergency_locked: false, status: 'active',   created_at: '2024-10-20T14:00:00Z', file_size: 512000,  file_type: 'pdf' },
  { document_id: 'DOC_EXAM_CS302_2024', title: 'CS-302 End-Sem Examination Paper',    department: 'CSE', subject_id: 'CS-302', category: 'exam_paper', classification: 'confidential', uploaded_by: 'usr_fac_4412', uploader_name: 'Dr. Rahul Sharma',   emergency_locked: false, status: 'active',   created_at: '2024-10-20T14:00:00Z', file_size: 480000,  file_type: 'pdf' },
  { document_id: 'DOC_EXAM_PH301_2024', title: 'PH-301 Pharmacy Exam Paper 2024',     department: 'BPH', subject_id: 'PH-301', category: 'exam_paper', classification: 'confidential', uploaded_by: 'usr_fac_bph',  uploader_name: 'Dr. Meena Joshi',    emergency_locked: false, status: 'active',   created_at: '2024-10-21T14:00:00Z', file_size: 460000,  file_type: 'pdf' },
  { document_id: 'DOC_EXAM_LAW201',    title: 'LAW-201 Constitutional Law Exam',      department: 'LAW', subject_id: 'LAW-201', category: 'exam_paper', classification: 'restricted',   uploaded_by: 'usr_fac_law',  uploader_name: 'Prof. Arvind Kapoor', emergency_locked: false, status: 'active',   created_at: '2024-10-22T10:00:00Z', file_size: 390000,  file_type: 'pdf' },
  { document_id: 'DOC_FIN_AUDIT_2024', title: 'Annual Financial Audit Report 2024',   department: 'ALL', subject_id: undefined, category: 'financial',  classification: 'restricted',   uploaded_by: 'usr_admin_001', uploader_name: 'Principal Kumar',   emergency_locked: false, status: 'active',   created_at: '2024-09-01T09:00:00Z', file_size: 1024000, file_type: 'pdf' },
  { document_id: 'DOC_CIRC_001',       title: 'Exam Schedule Circular Nov 2024',       department: 'ALL', subject_id: undefined, category: 'circular',   classification: 'public',       uploaded_by: 'usr_admin_001', uploader_name: 'Principal Kumar',   emergency_locked: false, status: 'active',   created_at: '2024-10-15T10:00:00Z', file_size: 128000,  file_type: 'pdf' },
  { document_id: 'DOC_SYL_CS301',      title: 'CS-301 Course Syllabus 2024-25',        department: 'CSE', subject_id: 'CS-301', category: 'syllabus',   classification: 'internal',     uploaded_by: 'usr_fac_9921', uploader_name: 'Dr. Priya Singh',    emergency_locked: false, status: 'active',   created_at: '2024-07-01T08:00:00Z', file_size: 256000,  file_type: 'pdf' },
  { document_id: 'DOC_SYL_BBA101',     title: 'BBA-101 Business Management Syllabus',  department: 'BBA', subject_id: 'BBA-101', category: 'syllabus',  classification: 'internal',     uploaded_by: 'usr_admin_001', uploader_name: 'Principal Kumar',   emergency_locked: false, status: 'active',   created_at: '2024-07-05T08:00:00Z', file_size: 180000,  file_type: 'pdf' },
  { document_id: 'DOC_RES_AGR_001',    title: 'Soil Quality Research Report 2024',     department: 'AGR', subject_id: undefined, category: 'research',   classification: 'internal',     uploaded_by: 'usr_admin_001', uploader_name: 'Principal Kumar',   emergency_locked: false, status: 'active',   created_at: '2024-08-10T09:00:00Z', file_size: 2048000, file_type: 'pdf' },
  { document_id: 'DOC_GEN_HM_001',     title: 'Hotel Management Internship Guidelines', department: 'HM', subject_id: undefined,  category: 'general',    classification: 'public',       uploaded_by: 'usr_admin_001', uploader_name: 'Principal Kumar',   emergency_locked: false, status: 'active',   created_at: '2024-06-20T10:00:00Z', file_size: 95000,   file_type: 'pdf' },
];

// ── Permissions ───────────────────────────────────────────────────────────────
export let MOCK_PERMISSIONS: Permission[] = [
  { id: 'perm_001', user_id: 'usr_fac_9921', user_name: 'Dr. Priya Singh',    resource_id: 'DOC_EXAM_CS301_2024', resource_title: 'CS-301 End-Sem Exam',         resource_type: 'document', level: 'View',     source: 'Role',   granted_by: 'usr_admin_001', granted_by_name: 'Principal Kumar', granted_on: '2024-10-01T00:00:00Z', expires_at: undefined,                  status: 'active' },
  { id: 'perm_002', user_id: 'usr_hod_001',  user_name: 'Dr. Ananya Verma',   resource_id: 'DOC_EXAM_CS301_2024', resource_title: 'CS-301 End-Sem Exam',         resource_type: 'document', level: 'Download', source: 'Role',   granted_by: 'usr_admin_001', granted_by_name: 'Principal Kumar', granted_on: '2024-10-01T00:00:00Z', expires_at: undefined,                  status: 'active' },
  { id: 'perm_003', user_id: 'usr_stu_001',  user_name: 'Riya Patel',         resource_id: 'DOC_SYL_CS301',      resource_title: 'CS-301 Course Syllabus',       resource_type: 'document', level: 'View',     source: 'Role',   granted_by: 'usr_admin_001', granted_by_name: 'Principal Kumar', granted_on: '2024-07-01T00:00:00Z', expires_at: '2025-07-01T00:00:00Z',    status: 'active' },
  { id: 'perm_004', user_id: 'usr_aud_001',  user_name: 'Auditor Roy',        resource_id: 'DOC_FIN_AUDIT_2024', resource_title: 'Annual Financial Audit Report', resource_type: 'document', level: 'View',     source: 'Tag',    granted_by: 'usr_admin_001', granted_by_name: 'Principal Kumar', granted_on: '2024-09-01T00:00:00Z', expires_at: undefined,                  status: 'active' },
  { id: 'perm_005', user_id: 'usr_stu_002',  user_name: 'Arjun Mehta',        resource_id: 'DOC_SYL_BBA101',    resource_title: 'BBA-101 Business Management',  resource_type: 'document', level: 'View',     source: 'Direct', granted_by: 'usr_admin_001', granted_by_name: 'Principal Kumar', granted_on: '2024-08-01T00:00:00Z', expires_at: '2025-01-01T00:00:00Z',    status: 'active' },
  { id: 'perm_006', user_id: 'usr_fac_bph',  user_name: 'Dr. Meena Joshi',   resource_id: 'DOC_EXAM_PH301_2024',resource_title: 'PH-301 Pharmacy Exam Paper',   resource_type: 'document', level: 'Download', source: 'Role',   granted_by: 'usr_admin_001', granted_by_name: 'Principal Kumar', granted_on: '2024-10-01T00:00:00Z', expires_at: undefined,                  status: 'active' },
];

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { log_id: 'LOG_001', timestamp: new Date(Date.now() - 3*60000).toISOString(),   user_id: 'usr_fac_4412', user_name: 'Dr. Rahul Sharma', user_role: 'faculty', special_tags: [],                   document_id: 'DOC_EXAM_CS301_2024', document_title: 'CS-301 End-Sem Exam',         action: 'DENY',  failure_reason: 'Subject mismatch (User: CS-302, Doc: CS-301)',                     reason_code: 'SUBJECT_MISMATCH',   ip_address: '192.168.1.102' },
  { log_id: 'LOG_002', timestamp: new Date(Date.now() - 5*60000).toISOString(),   user_id: 'usr_hod_001',  user_name: 'Dr. Ananya Verma',  user_role: 'dept_admin', special_tags: ['HOD'],           document_id: 'DOC_EXAM_CS301_2024', document_title: 'CS-301 End-Sem Exam',         action: 'ALLOW', failure_reason: undefined,                                                           reason_code: undefined,            ip_address: '192.168.1.101' },
  { log_id: 'LOG_003', timestamp: new Date(Date.now() - 8*60000).toISOString(),   user_id: 'usr_aud_001',  user_name: 'Auditor Roy',       user_role: 'financial_auditor', special_tags: ['financial_auditor'], document_id: 'DOC_EXAM_CS301_2024', document_title: 'CS-301 End-Sem Exam', action: 'DENY',  failure_reason: 'Tag scope restriction (Financial Auditor cannot access exam papers)', reason_code: 'TAG_SCOPE',          ip_address: '192.168.1.103' },
  { log_id: 'LOG_004', timestamp: new Date(Date.now() - 12*60000).toISOString(),  user_id: 'usr_stu_001',  user_name: 'Riya Patel',        user_role: 'student', special_tags: [],                   document_id: 'DOC_EXAM_CS301_2024', document_title: 'CS-301 End-Sem Exam',         action: 'DENY',  failure_reason: 'Role unauthorized for confidential tier',                           reason_code: 'ROLE_UNAUTHORIZED',  ip_address: '192.168.1.104' },
  { log_id: 'LOG_005', timestamp: new Date(Date.now() - 20*60000).toISOString(),  user_id: 'usr_fac_9921', user_name: 'Dr. Priya Singh',   user_role: 'faculty', special_tags: [],                   document_id: 'DOC_EXAM_CS301_2024', document_title: 'CS-301 End-Sem Exam',         action: 'ALLOW', failure_reason: undefined,                                                           reason_code: undefined,            ip_address: '192.168.1.100' },
  { log_id: 'LOG_006', timestamp: new Date(Date.now() - 35*60000).toISOString(),  user_id: 'usr_stu_002',  user_name: 'Arjun Mehta',       user_role: 'student', special_tags: [],                   document_id: 'DOC_SYL_BBA101',     document_title: 'BBA-101 Business Management', action: 'ALLOW', failure_reason: undefined,                                                           reason_code: undefined,            ip_address: '192.168.1.110' },
  { log_id: 'LOG_007', timestamp: new Date(Date.now() - 60*60000).toISOString(),  user_id: 'usr_fac_law',  user_name: 'Prof. Arvind Kapoor',user_role: 'faculty', special_tags: [],                   document_id: 'DOC_EXAM_LAW201',    document_title: 'LAW-201 Constitutional Law Exam', action: 'ALLOW', failure_reason: undefined,                                                       reason_code: undefined,            ip_address: '192.168.1.120' },
];

// ── Access Requests ───────────────────────────────────────────────────────────
export const MOCK_REQUESTS: AccessRequest[] = [
  { id: 'req_001', requester_id: 'usr_stu_001', requester_name: 'Riya Patel',   requester_role: 'student', resource_id: 'DOC_SYL_CS301',       resource_title: 'CS-301 Syllabus',         resource_type: 'document', permission: 'View', reason: 'Need to review the syllabus for exam prep.',              submitted_at: new Date(Date.now() - 2*3600000).toISOString(), status: 'pending' },
  { id: 'req_002', requester_id: 'usr_stu_002', requester_name: 'Arjun Mehta', requester_role: 'student', resource_id: 'DOC_RES_AGR_001',      resource_title: 'Soil Quality Research',    resource_type: 'document', permission: 'View', reason: 'Cross-departmental research interest for BBA thesis.',   submitted_at: new Date(Date.now() - 5*3600000).toISOString(), status: 'pending' },
  { id: 'req_003', requester_id: 'usr_fac_bph', requester_name: 'Dr. Meena Joshi', requester_role: 'faculty', resource_id: 'DOC_FIN_AUDIT_2024', resource_title: 'Annual Financial Audit', resource_type: 'document', permission: 'View', reason: 'Need budget figures for department funding proposal.',  submitted_at: new Date(Date.now() - 24*3600000).toISOString(), status: 'approved' },
];

// ── Credential map for mock login ─────────────────────────────────────────────
export const MOCK_CREDENTIALS: Record<string, string> = {
  'admin@college.edu':     'admin123',
  'hod@cse.college.edu':   'hod123',
  'fac1@college.edu':      'fac123',
  'fac2@college.edu':      'fac123',
  'fac.bph@college.edu':   'fac123',
  'fac.law@college.edu':   'fac123',
  'auditor@college.edu':   'aud123',
  'student@college.edu':   'stu123',
};
