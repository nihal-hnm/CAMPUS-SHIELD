import type { DenialReasonCode } from '../types/permission';

export const DENIAL_REASONS: Record<DenialReasonCode, { title: string; explanation: string; action: string }> = {
  PERMISSION_EXPIRED:         { title: 'Permission expired',         explanation: 'Your permission to this document has expired.',                            action: 'Request access' },
  PERMISSION_REVOKED:         { title: 'Permission revoked',         explanation: 'An administrator revoked your access.',                                     action: 'Contact admin or request access' },
  DEPARTMENT_MISMATCH:        { title: 'Department mismatch',        explanation: 'This document belongs to a different department than your account.',         action: 'Request access if allowed' },
  MISSING_SPECIAL_TAG:        { title: 'Special permission required', explanation: 'This document requires a special permission tag.',                          action: 'Request the required tag' },
  RESTRICTED_CLASSIFICATION:  { title: 'Restricted document',        explanation: 'Documents of this classification are not available to your role.',           action: 'Contact admin' },
  LINK_EXPIRED:               { title: 'Link expired',               explanation: 'Shared links are valid for at most 1 hour. This link has expired.',          action: 'Ask the owner to share again' },
  LINK_NOT_AUTHORIZED:        { title: 'Link no longer valid',       explanation: 'This link no longer grants access because your current permissions changed.', action: 'Request access' },
  ACCOUNT_DISABLED:           { title: 'Account disabled',           explanation: 'Your account has been disabled.',                                            action: 'Contact your administrator' },
  SESSION_INVALID:            { title: 'Session invalid',            explanation: 'This session is no longer valid. Please sign in again.',                     action: 'Sign in' },
  NO_PERMISSION:              { title: 'No permission',              explanation: "You haven't been granted access to this document.",                          action: 'Request access' },
  ROLE_UNAUTHORIZED:          { title: 'Unauthorized role',          explanation: 'Your role does not have access to documents of this classification.',         action: 'Contact admin' },
  SUBJECT_MISMATCH:           { title: 'Subject mismatch',           explanation: 'You are not assigned to the subject this document belongs to.',              action: 'Contact your HOD' },
  TAG_SCOPE:                  { title: 'Tag scope restriction',      explanation: 'Your permission tag restricts you from accessing documents of this type.',    action: 'Contact admin' },
  IDLE_TIMEOUT:               { title: 'Session idle timeout',       explanation: 'Your session ended after 10 minutes of inactivity.',                         action: 'Sign in again' },
  REAUTH_REQUIRED:            { title: 'Re-authentication required', explanation: 'Please re-authenticate to continue. This happens every 90 minutes.',          action: 'Re-authenticate' },
  EMERGENCY_LOCKDOWN:         { title: 'Emergency lockdown active',  explanation: 'An administrator has activated an emergency lockdown for this resource.',      action: 'Contact admin' },
  INVALID_TOKEN:              { title: 'Invalid session token',      explanation: 'Your session token is invalid or has been revoked.',                          action: 'Sign in again' },
  USER_INACTIVE:              { title: 'Account inactive',           explanation: 'Your account is no longer active in the system.',                             action: 'Contact your administrator' },
  IP_CHANGED:                 { title: 'IP address changed',         explanation: 'Your IP address changed during this session. Re-authorization is required.',   action: 'Sign in again' },
};

export const LOGIN_FAILURE_REASONS: Record<string, string> = {
  INVALID_CREDENTIALS:          'The ID or password is incorrect.',
  ACCOUNT_DISABLED:             'This account has been disabled. Contact your administrator.',
  ACCOUNT_LOCKED:               'Too many attempts. Please try again later.',
  ACCESS_REVOKED_INSTITUTIONAL: 'Your institutional access has ended.',
};

export const SESSION_EXPIRY_REASONS: Record<string, string> = {
  IDLE_TIMEOUT:        'You were signed out after 10 minutes of inactivity.',
  LOGGED_OUT:          'You signed out.',
  ADMIN_TERMINATED:    'An administrator ended your session.',
  EMERGENCY_REVOCATION:'Your access was revoked for security reasons.',
  SESSION_INVALID:     'This session is no longer valid.',
};
