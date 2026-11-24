export type AccessAction = 'ALLOW' | 'DENY';
export type RevocationType = 'USER_LOCKDOWN' | 'SESSION_REVOKE' | 'DOCUMENT_LOCKDOWN' | 'DEPARTMENT_LOCKDOWN';
export type PermissionSource = 'Role' | 'Direct' | 'Shared' | 'Tag';
export type PermissionLevel = 'View' | 'Download' | 'Share' | 'Edit';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';

export type DenialReasonCode =
  | 'PERMISSION_EXPIRED'
  | 'PERMISSION_REVOKED'
  | 'DEPARTMENT_MISMATCH'
  | 'MISSING_SPECIAL_TAG'
  | 'RESTRICTED_CLASSIFICATION'
  | 'LINK_EXPIRED'
  | 'LINK_NOT_AUTHORIZED'
  | 'ACCOUNT_DISABLED'
  | 'SESSION_INVALID'
  | 'NO_PERMISSION'
  | 'ROLE_UNAUTHORIZED'
  | 'SUBJECT_MISMATCH'
  | 'TAG_SCOPE'
  | 'IDLE_TIMEOUT'
  | 'REAUTH_REQUIRED'
  | 'EMERGENCY_LOCKDOWN'
  | 'INVALID_TOKEN'
  | 'USER_INACTIVE'
  | 'IP_CHANGED';

export interface AccessDecision {
  allowed: boolean;
  reason_code?: DenialReasonCode;
  message?: string;
  download?: boolean;
  print?: boolean;
  share?: boolean;
  permission_expires_at?: string;
  granted_via?: PermissionSource;
}

export interface Permission {
  id: string;
  user_id: string;
  user_name?: string;
  resource_id: string;
  resource_title?: string;
  resource_type: 'document' | 'subject' | 'department';
  level: PermissionLevel;
  source: PermissionSource;
  granted_by: string;
  granted_by_name?: string;
  granted_on: string;
  expires_at?: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface AccessRequest {
  id: string;
  requester_id: string;
  requester_name?: string;
  requester_role?: string;
  resource_id: string;
  resource_title?: string;
  resource_type: 'document' | 'subject' | 'department';
  permission: PermissionLevel;
  reason: string;
  submitted_at: string;
  status: RequestStatus;
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  reviewer_comment?: string;
  permission_expiry?: string;
}

export interface Revocation {
  revocation_id: string;
  type: RevocationType;
  target_id: string;
  revoked_by: string;
  reason: string;
  timestamp: string;
  is_active: boolean;
  permissions_revoked?: number;
  sessions_ended?: number;
  links_invalidated?: number;
}
