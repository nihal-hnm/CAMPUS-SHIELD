import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/user';

interface RequireAuthProps { children: React.ReactNode; }
interface RequireRoleProps { roles: string[]; children: React.ReactNode; }

const ADMIN_ROLES = ['super_admin', 'ultra_admin'];

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role as string)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-danger-soft flex items-center justify-center">
          <Lock className="w-5 h-5 text-danger-dark" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold text-text">You don't have access to this page</h2>
        <p className="text-sm text-text-muted max-w-sm">
          Your role does not permit access to this section. Contact your administrator.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

export function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (ADMIN_ROLES.includes(user.role as string)) return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}
