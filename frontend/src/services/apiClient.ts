import type { User } from '../types/user';
import type { Document } from '../types/document';
import { MOCK_DOCUMENTS } from '../mocks/data';
import { supabase } from './supabaseClient';
import { hashPassword, syncAllFromSupabase } from './dbSync';
import {
  generateSessionId, setCurrentSessionId, getCurrentSessionId,
  setStoredUid, getStoredUid, clearSessionId
} from './sessionGuard';

let _currentUser: User | null = null;
let _signinTime: number | null = null;
let _lastActivity: number = Date.now();

export function getToken() { return getCurrentSessionId(); }
export function getCurrentUser() { return _currentUser; }
export function getSigninTime() { return _signinTime; }
export function getLastActivity() { return _lastActivity; }
export function touchActivity() { _lastActivity = Date.now(); }

// ── Auth (Backed by Supabase Postgres `public.users` + hashed password) ───────
export async function login(email: string, password: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const { data: row, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (error) {
    throw {
      code: 500,
      reason_code: 'INVALID_CREDENTIALS',
      message: `Database error: ${error.message}. Make sure supabase_migration.sql has been run in Supabase SQL Editor.`,
    };
  }

  if (!row) {
    throw {
      code: 401,
      reason_code: 'INVALID_CREDENTIALS',
      message: 'No account found with this email.',
    };
  }

  const inputHash = await hashPassword(password);
  if (!row.password_hash || row.password_hash !== inputHash) {
    throw {
      code: 401,
      reason_code: 'INVALID_CREDENTIALS',
      message: 'The email or password is incorrect.',
    };
  }

  if (row.status !== 'active') {
    throw {
      code: 403,
      reason_code: 'ACCOUNT_DISABLED',
      message: 'Your account is inactive or suspended. Contact your administrator.',
    };
  }

  // Enforce single-device session in Supabase
  const sid = generateSessionId();
  setCurrentSessionId(sid);
  setStoredUid(row.uid);

  await supabase
    .from('users')
    .update({ active_session_id: sid, last_active_at: new Date().toISOString() })
    .eq('uid', row.uid);

  const { password_hash: _ph, ...safeUser } = row;
  _currentUser = safeUser as User;
  _signinTime = Date.now();
  _lastActivity = Date.now();

  await syncAllFromSupabase();
  return _currentUser;
}

export async function logout(): Promise<void> {
  clearSessionId();
  _currentUser = null;
  _signinTime = null;
}

export async function reauth(password: string): Promise<void> {
  if (!_currentUser?.email) {
    throw { code: 401, reason_code: 'SESSION_INVALID', message: 'No active session.' };
  }
  const { data: row } = await supabase
    .from('users')
    .select('password_hash')
    .eq('uid', _currentUser.uid)
    .maybeSingle();
  const inputHash = await hashPassword(password);
  if (!row || row.password_hash !== inputHash) {
    throw { code: 401, reason_code: 'INVALID_CREDENTIALS', message: 'Password is incorrect.' };
  }
  _signinTime = Date.now();
}

export async function logoutTab(): Promise<void> {
  _currentUser = null;
  _signinTime = null;
}

export async function getMe(): Promise<User> {
  const uid = getStoredUid();
  const localSid = getCurrentSessionId();
  if (!uid || !localSid) {
    throw { code: 401, reason_code: 'SESSION_INVALID', message: 'Not authenticated' };
  }

  const { data: row, error } = await supabase
    .from('users')
    .select('uid,email,name,role,department,assigned_subjects,special_tags,roll_no,status,active_session_id,last_active_at,last_reauth_at,created_at')
    .eq('uid', uid)
    .maybeSingle();

  if (error || !row) {
    clearSessionId();
    throw { code: 401, reason_code: 'SESSION_INVALID', message: 'Session expired' };
  }

  if (row.active_session_id && row.active_session_id !== localSid) {
    clearSessionId();
    throw { code: 401, reason_code: 'SESSION_INVALID', message: 'Logged in elsewhere' };
  }

  _currentUser = row as User;
  if (!_signinTime) _signinTime = Date.now();

  await syncAllFromSupabase();
  return _currentUser;
}

// ── Documents ─────────────────────────────────────────────────────────────────
export interface AccessDecisionResponse {
  allowed: boolean;
  reason_code?: string;
  reason?: string;
  download: boolean;
  share: boolean;
  document?: Document;
}

export async function fetchDocuments(): Promise<Document[]> {
  await syncAllFromSupabase();
  return MOCK_DOCUMENTS;
}

export const listDocuments = fetchDocuments;

export async function checkDocumentAccess(documentId: string): Promise<AccessDecisionResponse> {
  const doc = MOCK_DOCUMENTS.find(d => d.document_id === documentId);
  const user = _currentUser;
  if (!user) return { allowed: false, reason_code: 'SESSION_INVALID', reason: 'Not signed in.', download: false, share: false };
  if (!doc) return { allowed: false, reason_code: 'NO_PERMISSION', reason: 'Document not found.', download: false, share: false };
  if (doc.emergency_locked) return { allowed: false, reason_code: 'EMERGENCY_LOCKDOWN', reason: 'Document is under emergency lockdown.', download: false, share: false };
  if ((user.role as string) === 'super_admin' || (user.role as string) === 'ultra_admin') return { allowed: true, download: true, share: true, document: doc };
  if (user.role === 'dept_admin' && doc.department !== 'ALL' && doc.department !== user.department) return { allowed: false, reason_code: 'DEPARTMENT_MISMATCH', reason: 'Different department.', download: false, share: false };
  if (user.role === 'student' && doc.classification !== 'public') return { allowed: false, reason_code: 'ROLE_UNAUTHORIZED', reason: 'Role unauthorized for this classification.', download: false, share: false };
  if (doc.classification === 'restricted' && !user.special_tags?.includes('financial_auditor')) return { allowed: false, reason_code: 'ROLE_UNAUTHORIZED', reason: 'Role unauthorized for restricted tier.', download: false, share: false };
  if (user.role === 'faculty' && doc.classification === 'confidential' && doc.subject_id) {
    const assigned: string[] = user.assigned_subjects ?? [];
    if (!assigned.includes(doc.subject_id)) {
      return { allowed: false, reason_code: 'SUBJECT_MISMATCH', reason: `Subject mismatch (User: ${assigned.join(', ')}, Doc: ${doc.subject_id})`, download: false, share: false };
    }
  }
  return { allowed: true, download: true, share: false, document: doc };
}

export async function downloadDocument(documentId: string): Promise<Blob> {
  const doc = MOCK_DOCUMENTS.find(d => d.document_id === documentId);
  const content = `CampusShield Document: ${doc?.title ?? documentId}\nDepartment: ${doc?.department ?? 'N/A'}\nClassification: ${doc?.classification ?? 'N/A'}\n`;
  return new Blob([content], { type: 'text/plain' });
}

// ── Audit Logs ────────────────────────────────────────────────────────────────
export interface AuditEntry {
  id: string;
  timestamp: string;
  user_uid: string;
  user_email: string;
  document_id: string;
  action: 'ALLOW' | 'DENY';
  reason_code?: string;
  client_ip: string;
  metadata: Record<string, unknown>;
}

export async function fetchAuditLogs(): Promise<AuditEntry[]> {
  const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    timestamp: r.created_at,
    user_uid: r.user_id ?? '',
    user_email: r.user_id ?? '',
    document_id: r.document_id ?? '',
    action: r.action,
    reason_code: r.reason_code,
    client_ip: r.ip_address ?? '',
    metadata: {},
  }));
}

export async function emergencyRevoke(payload: {
  document_id: string;
  scope: 'document' | 'department' | 'all';
  action_type: string;
  reason?: string;
}): Promise<{ success: boolean; locked_document_ids: string[]; message: string }> {
  await supabase.from('documents').update({ emergency_locked: true }).eq('document_id', payload.document_id);
  return { success: true, locked_document_ids: [payload.document_id], message: 'Emergency lockdown applied in Supabase.' };
}

export async function revokeSession(_token: string): Promise<void> {}

export async function fetchActiveSessions(): Promise<Record<string, unknown>[]> {
  const { data } = await supabase.from('users').select('uid,email,name,role,active_session_id,last_active_at').not('active_session_id', 'is', null);
  return (data ?? []) as Record<string, unknown>[];
}

export async function fetchEmergencyStatus(): Promise<{
  locked_documents: string[];
  active_sessions: number;
  revoked_tokens_count: number;
}> {
  const { data: locked } = await supabase.from('documents').select('document_id').eq('emergency_locked', true);
  return {
    locked_documents: (locked ?? []).map((d: any) => d.document_id),
    active_sessions: 0,
    revoked_tokens_count: 0,
  };
}
