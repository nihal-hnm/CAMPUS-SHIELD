export interface AuditLog {
  log_id: string;
  timestamp: string;
  user_id: string;
  user_name?: string;
  user_role: string;
  special_tags: string[];
  document_id?: string;
  document_title?: string;
  action: 'ALLOW' | 'DENY';
  failure_reason?: string;
  reason_code?: string;
  ip_address: string;
  event_type?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'request_approved' | 'request_rejected' | 'permission_granted' | 'permission_expiring'
      | 'permission_revoked' | 'document_shared' | 'session_terminated' | 'security_notice';
  title: string;
  message: string;
  link?: string;
  created_at: string;
  read_at?: string;
  is_persistent?: boolean;
}
