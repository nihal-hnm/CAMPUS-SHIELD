import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '../types/user';
import { login as apiLogin, logout as apiLogout, reauth as apiReauth, getMe, logoutTab, touchActivity } from '../services/apiClient';
import {
  generateSessionId, getCurrentSessionId, setCurrentSessionId,
  clearSessionId, broadcastNewLogin, listenForSessionConflict
} from '../services/sessionGuard';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signinTime: number | null;
  loggedInElsewhere: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  reauth: (password: string) => Promise<void>;
  refresh: () => Promise<void>;
  forceRelogin: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signinTime, setSigninTime] = useState<number | null>(null);
  const [loggedInElsewhere, setLoggedInElsewhere] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const u = await getMe();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Tab close beacon
  useEffect(() => {
    const handle = () => logoutTab();
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, []);

  // Track activity
  useEffect(() => {
    const events = ['mousemove', 'keypress', 'touchstart', 'click'];
    const handler = () => touchActivity();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, handler));
  }, []);

  // Single-device session guard
  useEffect(() => {
    if (!user || !sessionId) return;
    const unsubscribe = listenForSessionConflict(sessionId, () => {
      setLoggedInElsewhere(true);
      setUser(null);
    });
    return unsubscribe;
  }, [user, sessionId]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    const sid = generateSessionId();
    setCurrentSessionId(sid);
    broadcastNewLogin(sid); // kick any other active sessions
    setSessionId(sid);
    setUser(u);
    setSigninTime(Date.now());
    setLoggedInElsewhere(false);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    clearSessionId();
    setUser(null);
    setSigninTime(null);
    setSessionId(null);
    setLoggedInElsewhere(false);
  }, []);

  const reauth = useCallback(async (password: string) => {
    await apiReauth(password);
    setSigninTime(Date.now());
  }, []);

  const forceRelogin = useCallback(() => {
    setLoggedInElsewhere(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signinTime, loggedInElsewhere, login, logout, reauth, refresh, forceRelogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
