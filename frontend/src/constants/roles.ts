import type { Role } from '../types/user';

export const ROLES: Record<Role, string> = {
  ultra_admin:       'Ultra Admin',
  super_admin:       'Super Admin',
  dept_admin:        'H.O.D',
  faculty:           'Faculty',
  student:           'Student',
  financial_auditor: 'Financial Auditor',
};

export const ROLE_DISPLAY: Record<Role, string> = {
  ultra_admin:       'Ultra Admin',
  super_admin:       'Admin',
  dept_admin:        'H.O.D',
  faculty:           'Faculty',
  student:           'Student',
  financial_auditor: 'Auditor',
};

export function formatRole(role?: string | null): string {
  if (!role) return '—';
  if (role in ROLE_DISPLAY) return ROLE_DISPLAY[role as Role];
  return role.replace(/_/g, ' ');
}

export const ADMIN_ROLES: Role[] = ['ultra_admin', 'super_admin'];
export const HOD_ROLES: Role[]   = ['dept_admin'];

export function isAdmin(role: Role): boolean {
  return role === 'ultra_admin' || role === 'super_admin';
}
export function isHOD(role: Role): boolean {
  return role === 'dept_admin';
}
