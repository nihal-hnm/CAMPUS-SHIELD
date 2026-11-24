// Single-device session enforcement via BroadcastChannel + localStorage
// When a user logs in on device B while already logged in on device A,
// device A receives "LOGIN_ELSEWHERE" and shows a "Logged in elsewhere" screen.

export const SESSION_KEY = 'cv_session_id';
export const SESSION_CHANNEL = 'cv_session';

export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export function getCurrentSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setCurrentSessionId(id: string): void {
  localStorage.setItem(SESSION_KEY, id);
}

export function clearSessionId(): void {
  localStorage.removeItem(SESSION_KEY);
}

// Broadcast that a new login happened on another tab/device
export function broadcastNewLogin(sessionId: string): void {
  try {
    const channel = new BroadcastChannel(SESSION_CHANNEL);
    channel.postMessage({ type: 'NEW_LOGIN', sessionId });
    channel.close();
  } catch {
    // BroadcastChannel not supported — fallback: use storage event
    localStorage.setItem('cv_new_session', sessionId);
    localStorage.removeItem('cv_new_session');
  }
}

// Listen for logins on other tabs/devices
export function listenForSessionConflict(
  mySessionId: string,
  onConflict: () => void
): () => void {
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(SESSION_CHANNEL);
    channel.onmessage = (e) => {
      if (e.data?.type === 'NEW_LOGIN' && e.data.sessionId !== mySessionId) {
        onConflict();
      }
    };
  } catch {
    // fallback: storage event
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'cv_new_session' && e.newValue && e.newValue !== mySessionId) {
      onConflict();
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    channel?.close();
    window.removeEventListener('storage', handleStorage);
  };
}
