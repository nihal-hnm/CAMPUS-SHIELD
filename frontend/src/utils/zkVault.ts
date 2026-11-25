/**
 * Client-Side Zero-Knowledge Document Envelope Encryption (CS-ZK-V1)
 * Uses W3C Web Crypto API: PBKDF2-SHA256 key derivation + AES-256-GCM authenticated encryption.
 * Plaintext documents and keys never leave the client unencrypted.
 */

export interface EncryptedEnvelope {
  version: 'CS-ZK-V1';
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string; // base64
  iv: string; // base64 (96-bit)
  ciphertext: string; // base64
  plaintextSha256: string; // hex integrity digest
}

const PBKDF2_ITERATIONS = 100_000;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function sha256Hex(data: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveAesKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, usage: KeyUsage[]): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    usage,
  );
}

export async function encryptDocumentZK(plaintext: string, passphrase: string): Promise<EncryptedEnvelope> {
  const enc = new TextEncoder();
  const encoded = enc.encode(plaintext);
  const plainBytes = new Uint8Array(new ArrayBuffer(encoded.byteLength));
  plainBytes.set(encoded);

  const salt = new Uint8Array(new ArrayBuffer(16));
  crypto.getRandomValues(salt);
  const iv = new Uint8Array(new ArrayBuffer(12));
  crypto.getRandomValues(iv);

  const key = await deriveAesKey(passphrase, salt, ['encrypt']);
  const encryptedBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plainBytes);

  return {
    version: 'CS-ZK-V1',
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encryptedBuf)),
    plaintextSha256: await sha256Hex(plainBytes),
  };
}

export async function decryptDocumentZK(envelope: EncryptedEnvelope, passphrase: string): Promise<string> {
  if (envelope.version !== 'CS-ZK-V1' || envelope.algorithm !== 'AES-256-GCM') {
    throw new Error('Unsupported Zero-Knowledge envelope version');
  }

  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  const ciphertext = fromBase64(envelope.ciphertext);

  const key = await deriveAesKey(passphrase, salt, ['decrypt']);
  const decryptedBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  const plainBytes = new Uint8Array(new ArrayBuffer(decryptedBuf.byteLength));
  plainBytes.set(new Uint8Array(decryptedBuf));

  const digest = await sha256Hex(plainBytes);
  if (digest !== envelope.plaintextSha256) {
    throw new Error('Zero-Knowledge integrity verification failed');
  }

  return new TextDecoder().decode(plainBytes);
}
