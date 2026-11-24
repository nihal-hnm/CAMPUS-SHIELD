import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '../types/user';
import { login as apiLogin, logout as apiLogout, reauth as apiReauth, getMe, logoutTab, touchActivity } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signinTime: number | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  reauth: (password: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signinTime, setSigninTime] = useState<number | null>(null);

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

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    setUser(u);
    setSigninTime(Date.now());
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setSigninTime(null);
  }, []);

  const reauth = useCallback(async (password: string) => {
    await apiReauth(password);
    setSigninTime(Date.now());
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signinTime, login, logout, reauth, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
