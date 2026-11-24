// Mock data for all roles and states — used when VITE_USE_MOCKS=true
import type { User } from '../types/user';
import type { Document } from '../types/document';
import type { AuditLog } from '../types/audit';
import type { AccessRequest, Permission } from '../types/permission';

export const MOCK_USERS: User[] = [
  { uid: 'usr_admin_001',  email: 'admin@college.edu',   name: 'Principal Kumar',    role: 'super_admin',       department: 'ALL', assigned_subjects: [],          special_tags: [],                  status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { uid: 'usr_hod_001',    email: 'hod@cse.college.edu', name: 'Dr. Ananya Verma',   role: 'dept_admin',        department: 'CSE', assigned_subjects: [],          special_tags: ['HOD'],             status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { uid: 'usr_fac_9921',   email: 'fac1@college.edu',    name: 'Dr. Priya Singh',    role: 'faculty',           department: 'CSE', assigned_subjects: ['CS-301'],  special_tags: [],                  status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { uid: 'usr_fac_4412',   email: 'fac2@college.edu',    name: 'Dr. Rahul Sharma',   role: 'faculty',           department: 'CSE', assigned_subjects: ['CS-302'],  special_tags: [],                  status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { uid: 'usr_aud_001',    email: 'auditor@college.edu', name: 'Auditor Roy',        role: 'financial_auditor', department: 'ALL', assigned_subjects: [],          special_tags: ['financial_auditor'], status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { uid: 'usr_stu_001',    email: 'student@college.edu', name: 'Riya Patel',         role: 'student',           department: 'CSE', assigned_subjects: [],          special_tags: [],                  status: 'active', last_active_at: new Date().toISOString(), last_reauth_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
];

export const MOCK_DOCUMENTS: Document[] = [
  { document_id: 'DOC_EXAM_CS301_2024', title: 'CS-301 End-Sem Examination Paper',    department: 'CSE', subject_id: 'CS-301', category: 'exam_paper', classification: 'confidential', uploaded_by: 'usr_fac_9921', uploader_name: 'Dr. Priya Singh',  emergency_locked: false, status: 'active', created_at: '2024-10-20T14:00:00Z', file_size: 512000,  file_type: 'pdf' },
  { document_id: 'DOC_EXAM_CS302_2024', title: 'CS-302 End-Sem Examination Paper',    department: 'CSE', subject_id: 'CS-302', category: 'exam_paper', classification: 'confidential', uploaded_by: 'usr_fac_4412', uploader_name: 'Dr. Rahul Sharma', emergency_locked: false, status: 'active', created_at: '2024-10-20T14:00:00Z', file_size: 480000,  file_type: 'pdf' },
  { document_id: 'DOC_FIN_AUDIT_2024',  title: 'Annual Financial Audit Report 2024',  department: 'ALL', subject_id: undefined, category: 'financial',  classification: 'restricted',   uploaded_by: 'usr_admin_001', uploader_name: 'Principal Kumar', emergency_locked: false, status: 'active', created_at: '2024-09-01T09:00:00Z', file_size: 1024000, file_type: 'pdf' },
  { document_id: 'DOC_CIRC_001',        title: 'Exam Schedule Circular Nov 2024',      department: 'ALL', subject_id: undefined, category: 'circular',   classification: 'public',       uploaded_by: 'usr_admin_001', uploader_name: 'Principal Kumar', emergency_locked: false, status: 'active', created_at: '2024-10-15T10:00:00Z', file_size: 128000,  file_type: 'pdf' },
  { document_id: 'DOC_SYL_CS301',       title: 'CS-301 Course Syllabus 2024-25',       department: 'CSE', subject_id: 'CS-301', category: 'syllabus',   classification: 'internal',     uploaded_by: 'usr_fac_9921', uploader_name: 'Dr. Priya Singh',  emergency_locked: false, status: 'active', created_at: '2024-07-01T08:00:00Z', file_size: 256000,  file_type: 'pdf' },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { log_id: 'LOG_001', timestamp: new Date(Date.now() - 3*60000).toISOString(),   user_id: 'usr_fac_4412', user_name: 'Dr. Rahul Sharma', user_role: 'faculty', special_tags: [],      document_id: 'DOC_EXAM_CS301_2024', document_title: 'CS-301 End-Sem Exam', action: 'DENY',  failure_reason: 'Subject mismatch (User: CS-302, Doc: CS-301)', reason_code: 'SUBJECT_MISMATCH', ip_address: '192.168.1.102' },
  { log_id: 'LOG_002', timestamp: new Date(Date.now() - 5*60000).toISOString(),   user_id: 'usr_hod_001',  user_name: 'Dr. Ananya Verma',  user_role: 'dept_admin', special_tags: ['HOD'], document_id: 'DOC_EXAM_CS301_2024', document_title: 'CS-301 End-Sem Exam', action: 'ALLOW', failure_reason: undefined,                                              reason_code: undefined,          ip_address: '192.168.1.101' },
  { log_id: 'LOG_003', timestamp: new Date(Date.now() - 8*60000).toISOString(),   user_id: 'usr_aud_001',  user_name: 'Auditor Roy',       user_role: 'financial_auditor', special_tags: ['financial_auditor'], document_id: 'DOC_EXAM_CS301_2024', document_title: 'CS-301 End-Sem Exam', action: 'DENY',  failure_reason: 'Tag scope restriction (Financial Auditor cannot access exam papers)', reason_code: 'TAG_SCOPE', ip_address: '192.168.1.103' },
  { log_id: 'LOG_004', timestamp: new Date(Date.now() - 12*60000).toISOString(),  user_id: 'usr_stu_001',  user_name: 'Riya Patel',        user_role: 'student', special_tags: [],       document_id: 'DOC_EXAM_CS301_2024', document_title: 'CS-301 End-Sem Exam', action: 'DENY',  failure_reason: 'Role unauthorized for confidential tier',       reason_code: 'ROLE_UNAUTHORIZED', ip_address: '192.168.1.104' },
  { log_id: 'LOG_005', timestamp: new Date(Date.now() - 20*60000).toISOString(),  user_id: 'usr_fac_9921', user_name: 'Dr. Priya Singh',   user_role: 'faculty', special_tags: [],       document_id: 'DOC_EXAM_CS301_2024', document_title: 'CS-301 End-Sem Exam', action: 'ALLOW', failure_reason: undefined,                                              reason_code: undefined,          ip_address: '192.168.1.100' },
];

export const MOCK_PERMISSIONS: Permission[] = [
  { id: 'perm_001', user_id: 'usr_fac_9921', user_name: 'Dr. Priya Singh', resource_id: 'DOC_EXAM_CS301_2024', resource_title: 'CS-301 End-Sem Exam', resource_type: 'document', level: 'View', source: 'Role', granted_by: 'usr_admin_001', granted_by_name: 'Principal Kumar', granted_on: '2024-10-01T00:00:00Z', expires_at: undefined, status: 'active' },
];

export const MOCK_REQUESTS: AccessRequest[] = [
  { id: 'req_001', requester_id: 'usr_stu_001', requester_name: 'Riya Patel', requester_role: 'student', resource_id: 'DOC_SYL_CS301', resource_title: 'CS-301 Syllabus', resource_type: 'document', permission: 'View', reason: 'Need to review the syllabus for exam prep.', submitted_at: new Date(Date.now() - 2*3600000).toISOString(), status: 'pending' },
];

// Credential map for mock login
export const MOCK_CREDENTIALS: Record<string, string> = {
  'admin@college.edu':   'admin123',
  'hod@cse.college.edu': 'hod123',
  'fac1@college.edu':    'fac123',
  'fac2@college.edu':    'fac123',
  'auditor@college.edu': 'aud123',
  'student@college.edu': 'stu123',
};
