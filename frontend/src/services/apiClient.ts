import type { User } from '../types/user';
import type { Document } from '../types/document';
import { MOCK_USERS, MOCK_CREDENTIALS, MOCK_DOCUMENTS } from '../mocks/data';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

// In-memory token store (never localStorage — Zero-Trust requirement)
let _token: string | null = null;
let _currentUser: User | null = null;
let _signinTime: number | null = null;
let _lastActivity: number = Date.now();

export function getToken() { return _token; }
export function getCurrentUser() { return _currentUser; }
export function getSigninTime() { return _signinTime; }
export function getLastActivity() { return _lastActivity; }
export function touchActivity() { _lastActivity = Date.now(); }

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    // FastAPI wraps errors in { detail: { reason_code, reason } }
    const detail = (err as any).detail ?? err;
    throw { code: res.status, ...detail };
  }
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────
function mockLogin(email: string, password: string): User {
  if (MOCK_CREDENTIALS[email] !== password) {
    throw { code: 401, reason_code: 'INVALID_CREDENTIALS', message: 'The ID or password is incorrect.' };
  }
  const user = MOCK_USERS.find(u => u.email === email);
  if (!user) throw { code: 401, reason_code: 'INVALID_CREDENTIALS', message: 'The ID or password is incorrect.' };
  _token = `mock-token-${user.uid}`;
  _currentUser = user;
  _signinTime = Date.now();
  _lastActivity = Date.now();
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 400));
    return mockLogin(email, password);
  }
  try {
    const data = await request<{ token: string; user: User }>('/api/v1/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    _token = data.token;
    _currentUser = data.user;
    _signinTime = Date.now();
    _lastActivity = Date.now();
    return data.user;
  } catch (err: any) {
    if (err?.reason_code === 'INVALID_CREDENTIALS') {
      throw err;
    }
    // Graceful fallback for network / mixed-content / unreachable backend (e.g. Vercel)
    console.warn('Backend API unavailable, falling back to local credentials mode:', err);
    try {
      return mockLogin(email, password);
    } catch {
      throw err;
    }
  }
}

export async function logout(): Promise<void> {
  if (!USE_MOCKS) await request('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
  _token = null; _currentUser = null; _signinTime = null;
}

export async function reauth(password: string): Promise<void> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 600));
    if (!_currentUser || MOCK_CREDENTIALS[_currentUser.email] !== password)
      throw { code: 401, reason_code: 'INVALID_CREDENTIALS', message: 'The ID or password is incorrect.' };
    _signinTime = Date.now();
    return;
  }
  await request('/api/v1/auth/reauth', { method: 'POST', body: JSON.stringify({ password }) });
  _signinTime = Date.now();
}

export async function logoutTab(): Promise<void> {
  if (_token) {
    navigator.sendBeacon(`${API_BASE}/api/v1/auth/logout-tab`, JSON.stringify({ token: _token }));
  }
  _token = null; _currentUser = null; _signinTime = null;
}

export async function getMe(): Promise<User> {
  if (_currentUser) return _currentUser;
  if (USE_MOCKS) {
    throw { code: 401, reason_code: 'SESSION_INVALID', message: 'No session.' };
  }
  try {
    return await request<User>('/api/v1/auth/me');
  } catch (err) {
    if (_currentUser) return _currentUser;
    throw err;
  }
}

// ── Documents ─────────────────────────────────────────────────────────────────
export async function listDocuments(): Promise<Document[]> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 400));
    return MOCK_DOCUMENTS;
  }
  try {
    return await request<Document[]>('/api/v1/documents');
  } catch (err) {
    console.warn('Backend unavailable, falling back to cached documents:', err);
    return MOCK_DOCUMENTS;
  }
}

export interface AccessDecisionResponse {
  allowed: boolean;
  reason_code?: string;
  reason?: string;
  download: boolean;
  share: boolean;
  document?: Document;
}

export async function checkDocumentAccess(documentId: string): Promise<AccessDecisionResponse> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 600));
    const user = _currentUser;
    const doc = MOCK_DOCUMENTS.find(d => d.document_id === documentId);
    if (!user) return { allowed: false, reason_code: 'SESSION_INVALID', reason: 'No active session.', download: false, share: false };
    if (!doc) return { allowed: false, reason_code: 'NOT_FOUND', reason: 'Document not found.', download: false, share: false };
    if ((doc as any).emergency_locked) return { allowed: false, reason_code: 'EMERGENCY_LOCKDOWN', reason: 'Emergency document lockdown active.', download: false, share: false };
    if (doc.classification === 'confidential' && user.role === 'student') return { allowed: false, reason_code: 'ROLE_UNAUTHORIZED', reason: 'Role unauthorized for confidential tier.', download: false, share: false };
    if (doc.classification === 'restricted' && user.role === 'student') return { allowed: false, reason_code: 'ROLE_UNAUTHORIZED', reason: 'Role unauthorized for restricted tier.', download: false, share: false };
    if ((user as any).special_tags?.includes('financial_auditor') && (doc as any).category === 'exam_paper') return { allowed: false, reason_code: 'TAG_SCOPE', reason: 'Tag scope restriction.', download: false, share: false };
    if (user.role === 'faculty' && doc.classification === 'confidential' && (doc as any).subject_id) {
      const assigned: string[] = (user as any).assigned_subjects ?? [];
      if (!assigned.includes((doc as any).subject_id)) {
        return { allowed: false, reason_code: 'SUBJECT_MISMATCH', reason: `Subject mismatch (User: ${assigned.join(', ')}, Doc: ${(doc as any).subject_id})`, download: false, share: false };
      }
    }
    return { allowed: true, download: true, share: false, document: doc };
  }
  return request<AccessDecisionResponse>(`/api/v1/documents/${documentId}/access`);
}

export async function downloadDocument(documentId: string): Promise<Blob> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 300));
    const content = `[MOCK] Document: ${documentId}\n\nThis is mock content served in mock mode.`;
    return new Blob([content], { type: 'text/plain' });
  }
  const headers: Record<string, string> = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetch(`${API_BASE}/api/v1/documents/${documentId}/download`, { headers, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const detail = (err as any).detail ?? err;
    throw { code: res.status, ...detail };
  }
  return res.blob();
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

export async function fetchAuditLogs(params?: {
  user_uid?: string;
  document_id?: string;
  action?: string;
  page?: number;
  page_size?: number;
}): Promise<AuditEntry[]> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 300));
    return [];
  }
  const qs = new URLSearchParams();
  if (params?.user_uid) qs.set('user_uid', params.user_uid);
  if (params?.document_id) qs.set('document_id', params.document_id);
  if (params?.action) qs.set('action', params.action);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.page_size) qs.set('page_size', String(params.page_size));
  return request<AuditEntry[]>(`/api/v1/audit/logs?${qs.toString()}`);
}

// ── Access / Emergency ────────────────────────────────────────────────────────
export async function emergencyRevoke(payload: {
  document_id: string;
  scope: 'document' | 'department' | 'all';
  action_type: string;
  reason?: string;
}): Promise<{ success: boolean; locked_document_ids: string[]; message: string }> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 800));
    return { success: true, locked_document_ids: [payload.document_id], message: 'Mock emergency revoke applied.' };
  }
  return request('/api/v1/access/emergency-revoke', { method: 'POST', body: JSON.stringify(payload) });
}

export async function revokeSession(token: string): Promise<void> {
  if (USE_MOCKS) return;
  await request('/api/v1/access/revoke', { method: 'POST', body: JSON.stringify({ token }) });
}

export async function fetchActiveSessions(): Promise<Record<string, unknown>[]> {
  if (USE_MOCKS) return [];
  return request<Record<string, unknown>[]>('/api/v1/access/grants');
}

export async function fetchEmergencyStatus(): Promise<{
  locked_documents: string[];
  active_sessions: number;
  revoked_tokens_count: number;
}> {
  if (USE_MOCKS) return { locked_documents: [], active_sessions: 0, revoked_tokens_count: 0 };
  return request('/api/v1/access/emergency-status');
}
