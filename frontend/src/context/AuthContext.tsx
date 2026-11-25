import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '../types/user';
import { login as apiLogin, logout as apiLogout, reauth as apiReauth, getMe, logoutTab, touchActivity } from '../services/apiClient';
import { supabase } from '../services/supabaseClient';
import { getCurrentSessionId, clearSessionId } from '../services/sessionGuard';

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

  const refresh = useCallback(async () => {
    try {
      const u = await getMe();
      setUser(u);
    } catch (err: any) {
      if (err?.message === 'Logged in elsewhere') {
        setLoggedInElsewhere(true);
      }
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    const handle = () => logoutTab();
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'keypress', 'touchstart', 'click'];
    const handler = () => touchActivity();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, handler));
  }, []);

  // Cross-device single-device session guard via Supabase
  useEffect(() => {
    if (!user) return;
    const localSid = getCurrentSessionId();
    if (!localSid) return;

    const checkSession = async () => {
      const { data } = await supabase
        .from('users')
        .select('active_session_id')
        .eq('uid', user.uid)
        .maybeSingle();

      if (data?.active_session_id && data.active_session_id !== localSid) {
        clearSessionId();
        setLoggedInElsewhere(true);
        setUser(null);
      }
    };

    const interval = setInterval(checkSession, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    setUser(u);
    setSigninTime(Date.now());
    setLoggedInElsewhere(false);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setSigninTime(null);
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
