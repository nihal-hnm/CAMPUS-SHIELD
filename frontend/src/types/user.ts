// User types
export type Role = 'ultra_admin' | 'super_admin' | 'dept_admin' | 'faculty' | 'student' | 'financial_auditor';
export type UserStatus = 'active' | 'inactive' | 'exited' | 'graduated';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: Role;
  department: string;
  assigned_subjects: string[];
  special_tags: string[];
  status: UserStatus;
  last_active_at: string;
  last_reauth_at: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  user: Pick<User, 'name' | 'email' | 'role'>;
  device: string;
  browser: string;
  ip_address: string;
  signed_in_at: string;
  last_activity: string;
  reauth_due_at: string;
  status: 'active' | 'idle' | 'expired';
  is_current?: boolean;
}
