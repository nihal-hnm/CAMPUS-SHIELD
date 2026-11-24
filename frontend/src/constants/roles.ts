import type { Role } from '../types/user';

export const ROLES: Record<Role, string> = {
  super_admin:       'Super Admin',
  dept_admin:        'Department Admin (HOD)',
  faculty:           'Faculty',
  student:           'Student',
  financial_auditor: 'Financial Auditor',
};

export const ROLE_DISPLAY: Record<Role, string> = {
  super_admin:       'Admin',
  dept_admin:        'HOD',
  faculty:           'Faculty',
  student:           'Student',
  financial_auditor: 'Auditor',
};

export const ADMIN_ROLES: Role[] = ['super_admin'];
export const HOD_ROLES: Role[]   = ['dept_admin'];

export function isAdmin(role: Role): boolean {
  return role === 'super_admin';
}
export function isHOD(role: Role): boolean {
  return role === 'dept_admin';
}
