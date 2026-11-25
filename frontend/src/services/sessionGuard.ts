// Single-device session enforcement via sessionStorage + Supabase active_session_id
// Works across different PCs, laptops, and browser tabs.

export const SESSION_KEY = 'cv_session_id';
export const UID_KEY = 'cv_uid';

export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export function getCurrentSessionId(): string | null {
  try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; }
}

export function setCurrentSessionId(id: string): void {
  try { sessionStorage.setItem(SESSION_KEY, id); } catch {}
}

export function getStoredUid(): string | null {
  try { return sessionStorage.getItem(UID_KEY); } catch { return null; }
}

export function setStoredUid(uid: string): void {
  try { sessionStorage.setItem(UID_KEY, uid); } catch {}
}

export function clearSessionId(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(UID_KEY);
  } catch {}
}
