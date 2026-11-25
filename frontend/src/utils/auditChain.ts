import type { AuditLog } from '../types/audit';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeAuditBlockHash(
  prevHash: string,
  entry: Pick<AuditLog, 'timestamp' | 'user_id' | 'document_id' | 'action' | 'reason_code'>
): Promise<string> {
  const payload = [
    prevHash,
    entry.timestamp,
    entry.user_id,
    entry.document_id ?? '',
    entry.action,
    entry.reason_code ?? '',
  ].join('|');
  return sha256Hex(payload);
}

export interface ChainedAuditLog extends AuditLog {
  prev_hash: string;
  block_hash: string;
}

export async function buildAuditChain(logsChronological: AuditLog[]): Promise<ChainedAuditLog[]> {
  let prev = GENESIS_HASH;
  const out: ChainedAuditLog[] = [];
  for (const log of logsChronological) {
    const block_hash = await computeAuditBlockHash(prev, log);
    out.push({ ...log, prev_hash: prev, block_hash });
    prev = block_hash;
  }
  return out;
}

export async function verifyAuditChain(
  chain: ChainedAuditLog[]
): Promise<{ valid: boolean; checked: number; brokenAt?: number }> {
  let expectedPrev = GENESIS_HASH;
  for (let i = 0; i < chain.length; i++) {
    const item = chain[i];
    if (item.prev_hash !== expectedPrev) {
      return { valid: false, checked: i, brokenAt: i };
    }
    const recomputed = await computeAuditBlockHash(expectedPrev, item);
    if (recomputed !== item.block_hash) {
      return { valid: false, checked: i, brokenAt: i };
    }
    expectedPrev = recomputed;
  }
  return { valid: true, checked: chain.length };
}
