import { describe, it, expect } from 'vitest';
import { normalizeDept, sameDepartment, formatBytes } from '../utils/format';
import { formatRole, isAdmin, isHOD } from '../constants/roles';
import { hashPassword } from '../services/dbSync';

describe('Department Isolation (Fail-Closed)', () => {
  it('normalizes department aliases consistently', () => {
    expect(normalizeDept('B.Tech CSE')).toBe('CSE');
    expect(normalizeDept('cse')).toBe('CSE');
    expect(normalizeDept('B.Pharmacy')).toBe('BPH');
    expect(normalizeDept('pharmacy')).toBe('BPH');
  });

  it('prevents cross-department access between BPH and CSE', () => {
    expect(sameDepartment('BPH', 'CSE')).toBe(false);
    expect(sameDepartment('B.Pharmacy', 'B.Tech CSE')).toBe(false);
    expect(sameDepartment('B.Pharmacy', 'BPH')).toBe(true);
    expect(sameDepartment('B.Tech CSE', 'CSE')).toBe(true);
  });

  it('fails closed when either department is missing or empty', () => {
    expect(sameDepartment(undefined, 'CSE')).toBe(false);
    expect(sameDepartment('CSE', '')).toBe(false);
    expect(sameDepartment(null, null)).toBe(false);
  });
});

describe('Role Hierarchy & Display Formatting', () => {
  it('displays dept_admin as H.O.D', () => {
    expect(formatRole('dept_admin')).toBe('H.O.D');
  });

  it('grants admin privileges to ultra_admin and super_admin only', () => {
    expect(isAdmin('ultra_admin')).toBe(true);
    expect(isAdmin('super_admin')).toBe(true);
    expect(isAdmin('dept_admin')).toBe(false);
    expect(isAdmin('faculty')).toBe(false);
    expect(isAdmin('student')).toBe(false);
  });

  it('identifies H.O.D role accurately', () => {
    expect(isHOD('dept_admin')).toBe(true);
    expect(isHOD('faculty')).toBe(false);
  });
});

describe('Security Utilities', () => {
  it('hashes passwords deterministically with SHA-256', async () => {
    const h1 = await hashPassword('TestPass@123');
    const h2 = await hashPassword('TestPass@123');
    const h3 = await hashPassword('DifferentPass@123');
    expect(h1).toHaveLength(64);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
  });

  it('formats file sizes cleanly', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
  });
});

describe('Cryptographic Audit Hash Chain', () => {
  const sampleLogs = [
    {
      log_id: 'log-1',
      timestamp: '2026-11-25T00:00:00.000Z',
      user_id: 'u1',
      user_name: 'Alice',
      user_role: 'hod',
      special_tags: [],
      document_id: 'doc-1',
      document_title: 'Syllabus.pdf',
      action: 'ALLOW' as const,
      reason_code: 'POLICY_OK',
      ip_address: '127.0.0.1',
    },
    {
      log_id: 'log-2',
      timestamp: '2026-11-25T00:01:00.000Z',
      user_id: 'u2',
      user_name: 'Bob',
      user_role: 'student',
      special_tags: [],
      document_id: 'doc-1',
      document_title: 'Syllabus.pdf',
      action: 'DENY' as const,
      reason_code: 'DEPT_MISMATCH',
      ip_address: '127.0.0.1',
    },
  ];

  it('builds and verifies an untampered SHA-256 audit chain', async () => {
    const { buildAuditChain, verifyAuditChain } = await import('../utils/auditChain');
    const chain = await buildAuditChain(sampleLogs);
    expect(chain).toHaveLength(2);
    expect(chain[1].prev_hash).toBe(chain[0].block_hash);

    const verification = await verifyAuditChain(chain);
    expect(verification).toEqual({ valid: true, checked: 2 });
  });

  it('detects tampering in any audit block', async () => {
    const { buildAuditChain, verifyAuditChain } = await import('../utils/auditChain');
    const chain = await buildAuditChain(sampleLogs);
    chain[1] = { ...chain[1], action: 'ALLOW' };

    const verification = await verifyAuditChain(chain);
    expect(verification.valid).toBe(false);
    expect(verification.brokenAt).toBe(1);
  });
});
