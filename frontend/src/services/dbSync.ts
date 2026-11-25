import { supabase } from './supabaseClient';
import {
  MOCK_USERS, MOCK_DEPARTMENTS, MOCK_DOCUMENTS, MOCK_PERMISSIONS,
  MOCK_REQUESTS, MOCK_MAGIC_LINKS, MOCK_ASSIGNMENT_TASKS, MOCK_ASSIGNMENTS, MOCK_AUDIT_LOGS,
  type Department, type MagicLink, type AssignedTask, type AssignmentSubmission
} from '../mocks/data';
import type { User } from '../types/user';
import type { Document } from '../types/document';
import type { AccessRequest, Permission } from '../types/permission';
import type { AuditLog } from '../types/audit';

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode('cv_salt:' + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

let _syncPromise: Promise<void> | null = null;

export async function syncAllFromSupabase(): Promise<void> {
  if (_syncPromise) return _syncPromise;
  _syncPromise = (async () => {
    try {
      const [uRes, dRes, docRes, pRes, rRes, mRes, tRes, aRes, logRes] = await Promise.all([
        supabase.from('users').select('uid,email,name,role,department,assigned_subjects,special_tags,roll_no,status,active_session_id,last_active_at,last_reauth_at,created_at').order('created_at', { ascending: true }),
        supabase.from('departments').select('*').order('name', { ascending: true }),
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
        supabase.from('permissions').select('*').order('granted_on', { ascending: false }),
        supabase.from('access_requests').select('*').order('submitted_at', { ascending: false }),
        supabase.from('magic_links').select('*').order('expires_at', { ascending: false }),
        supabase.from('assignment_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('assignment_submissions').select('*').order('submitted_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      if (!uRes.error && uRes.data) {
        MOCK_USERS.splice(0, MOCK_USERS.length, ...(uRes.data as User[]));
      }
      if (!dRes.error && dRes.data && dRes.data.length > 0) {
        MOCK_DEPARTMENTS.splice(0, MOCK_DEPARTMENTS.length, ...(dRes.data as Department[]));
      }
      if (!docRes.error && docRes.data) {
        MOCK_DOCUMENTS.splice(0, MOCK_DOCUMENTS.length, ...(docRes.data as Document[]));
      }
      if (!pRes.error && pRes.data) {
        MOCK_PERMISSIONS.splice(0, MOCK_PERMISSIONS.length, ...(pRes.data as Permission[]));
      }
      if (!rRes.error && rRes.data) {
        MOCK_REQUESTS.splice(0, MOCK_REQUESTS.length, ...(rRes.data as AccessRequest[]));
      }
      if (!mRes.error && mRes.data) {
        MOCK_MAGIC_LINKS.splice(0, MOCK_MAGIC_LINKS.length, ...(mRes.data as MagicLink[]));
      }
      if (!tRes.error && tRes.data) {
        MOCK_ASSIGNMENT_TASKS.splice(0, MOCK_ASSIGNMENT_TASKS.length, ...(tRes.data as AssignedTask[]));
      }
      if (!aRes.error && aRes.data) {
        MOCK_ASSIGNMENTS.splice(0, MOCK_ASSIGNMENTS.length, ...(aRes.data as AssignmentSubmission[]));
      }
      if (!logRes.error && logRes.data) {
        const mapped: AuditLog[] = logRes.data.map((r: any) => {
          const u = MOCK_USERS.find(usr => usr.uid === r.user_id || usr.email === r.user_id);
          const doc = MOCK_DOCUMENTS.find(d => d.document_id === r.document_id);
          return {
            log_id: r.id,
            timestamp: r.created_at,
            user_id: r.user_id ?? 'anonymous',
            user_name: u?.name ?? r.user_id ?? 'Anonymous',
            user_role: r.user_role ?? u?.role ?? 'unknown',
            special_tags: r.special_tags ?? [],
            document_id: r.document_id ?? undefined,
            document_title: doc?.title ?? r.document_id ?? undefined,
            action: r.action,
            failure_reason: r.failure_reason ?? undefined,
            reason_code: r.reason_code ?? undefined,
            ip_address: r.ip_address ?? 'web-client',
          };
        });
        MOCK_AUDIT_LOGS.splice(0, MOCK_AUDIT_LOGS.length, ...mapped);
      }
    } catch (err) {
      console.warn('Supabase sync warning:', err);
    } finally {
      _syncPromise = null;
    }
  })();
  return _syncPromise;
}

export async function createDbUser(
  email: string,
  password: string,
  profile: Omit<User, 'uid'> & { uid?: string; roll_no?: string }
): Promise<{ user: User; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const uid = profile.uid ?? `usr_${profile.role.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const password_hash = await hashPassword(password);

  const row = {
    uid,
    email: cleanEmail,
    name: profile.name.trim(),
    role: profile.role,
    department: profile.department,
    assigned_subjects: profile.assigned_subjects ?? [],
    special_tags: profile.special_tags ?? [],
    status: profile.status ?? 'active',
    roll_no: profile.roll_no ?? null,
    password_hash,
    last_active_at: profile.last_active_at ?? new Date().toISOString(),
    last_reauth_at: profile.last_reauth_at ?? new Date().toISOString(),
    created_at: profile.created_at ?? new Date().toISOString(),
  };

  const { error } = await supabase.from('users').insert(row);
  if (error) {
    return { user: null as any, error: error.message };
  }

  const { password_hash: _ph, ...safeUser } = row;
  return { user: safeUser as unknown as User };
}

export async function deleteDbUser(uid: string): Promise<void> {
  await supabase.from('users').delete().eq('uid', uid);
}

export async function upsertUsersToSupabase(users: User[]): Promise<void> {
  if (!users.length) return;
  const rows = users.map(u => ({
    uid: u.uid,
    email: u.email,
    name: u.name,
    role: u.role,
    department: u.department,
    assigned_subjects: u.assigned_subjects ?? [],
    special_tags: u.special_tags ?? [],
    status: u.status ?? 'active',
    roll_no: (u as any).roll_no ?? null,
    last_active_at: u.last_active_at ?? new Date().toISOString(),
    last_reauth_at: u.last_reauth_at ?? new Date().toISOString(),
    created_at: u.created_at ?? new Date().toISOString(),
  }));
  await supabase.from('users').upsert(rows, { onConflict: 'uid' });
}

export async function upsertDepartmentsToSupabase(depts: Department[]): Promise<void> {
  if (!depts.length) return;
  await supabase.from('departments').upsert(depts, { onConflict: 'id' });
}

export async function upsertDocumentsToSupabase(docs: Document[]): Promise<void> {
  if (!docs.length) return;
  const rows = docs.map(d => ({
    document_id: d.document_id,
    title: d.title,
    department: d.department,
    subject_id: d.subject_id ?? null,
    category: d.category,
    classification: d.classification,
    uploaded_by: d.uploaded_by,
    uploader_name: d.uploader_name ?? null,
    storage_path: d.storage_path ?? null,
    file_size: d.file_size ?? null,
    file_type: d.file_type ?? null,
    emergency_locked: d.emergency_locked ?? false,
    status: d.status ?? 'active',
    created_at: d.created_at ?? new Date().toISOString(),
  }));
  await supabase.from('documents').upsert(rows, { onConflict: 'document_id' });
}

export async function upsertPermissionsToSupabase(perms: Permission[]): Promise<void> {
  if (!perms.length) return;
  await supabase.from('permissions').upsert(perms, { onConflict: 'id' });
}

export async function deletePermissionFromSupabase(id: string): Promise<void> {
  await supabase.from('permissions').delete().eq('id', id);
}

export async function deleteDocumentFromSupabase(documentId: string): Promise<void> {
  await supabase.from('documents').delete().eq('document_id', documentId);
}

export async function upsertRequestsToSupabase(reqs: AccessRequest[]): Promise<void> {
  if (!reqs.length) return;
  await supabase.from('access_requests').upsert(reqs, { onConflict: 'id' });
}

export async function upsertMagicLinksToSupabase(links: MagicLink[]): Promise<void> {
  if (!links.length) return;
  await supabase.from('magic_links').upsert(links, { onConflict: 'token' });
}

export async function upsertAssignmentTasksToSupabase(tasks: AssignedTask[]): Promise<void> {
  if (!tasks.length) return;
  await supabase.from('assignment_tasks').upsert(tasks, { onConflict: 'id' });
}

export async function upsertAssignmentsToSupabase(subs: AssignmentSubmission[]): Promise<void> {
  if (!subs.length) return;
  await supabase.from('assignment_submissions').upsert(subs, { onConflict: 'id' });
}

export async function logAuditEvent(params: {
  user_id?: string | null;
  user_name?: string;
  user_role?: string;
  special_tags?: string[];
  document_id?: string | null;
  document_title?: string;
  action: 'ALLOW' | 'DENY';
  failure_reason?: string;
  reason_code?: string;
}): Promise<void> {
  const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const entry: AuditLog = {
    log_id: id,
    timestamp: now,
    user_id: params.user_id ?? 'anonymous',
    user_name: params.user_name ?? params.user_id ?? 'Anonymous',
    user_role: params.user_role ?? 'unknown',
    special_tags: params.special_tags ?? [],
    document_id: params.document_id ?? undefined,
    document_title: params.document_title ?? params.document_id ?? undefined,
    action: params.action,
    failure_reason: params.failure_reason,
    reason_code: params.reason_code,
    ip_address: 'web-client',
  };
  MOCK_AUDIT_LOGS.unshift(entry);
  try {
    await supabase.from('audit_logs').insert({
      id,
      user_id: params.user_id ?? null,
      user_role: params.user_role ?? null,
      special_tags: params.special_tags ?? [],
      document_id: params.document_id ?? null,
      action: params.action,
      failure_reason: params.failure_reason ?? null,
      reason_code: params.reason_code ?? null,
      ip_address: 'web-client',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : null,
      created_at: now,
    });
  } catch (err) {
    console.warn('Audit log write warning:', err);
  }
}
