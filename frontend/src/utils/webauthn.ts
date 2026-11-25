/**
 * W3C WebAuthn / FIDO2 Hardware Passkey Step-Up Authentication
 * Provides phishing-resistant biometric/hardware-key verification for sensitive actions.
 */

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  );
}

export function generateWebAuthnChallenge(byteLength = 32): Uint8Array<ArrayBuffer> {
  const challenge = new Uint8Array(new ArrayBuffer(byteLength));
  crypto.getRandomValues(challenge);
  return challenge;
}

const PASSKEY_STORAGE_PREFIX = 'campusshield_passkey_';

export function getStoredPasskeyId(userId: string): string | null {
  try {
    return localStorage.getItem(`${PASSKEY_STORAGE_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export async function registerPasskey(userId: string, email: string, displayName: string): Promise<string> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn / FIDO2 is not supported in this browser.');
  }

  const userIdBytes = new TextEncoder().encode(userId);
  const userIdBuf = new Uint8Array(new ArrayBuffer(userIdBytes.byteLength));
  userIdBuf.set(userIdBytes);

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: generateWebAuthnChallenge(),
      rp: {
        name: 'CampusShield Zero-Trust',
        id: window.location.hostname,
      },
      user: {
        id: userIdBuf,
        name: email,
        displayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Passkey registration was cancelled.');
  }

  localStorage.setItem(`${PASSKEY_STORAGE_PREFIX}${userId}`, credential.id);
  return credential.id;
}

export async function verifyPasskeyAssertion(userId: string): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn / FIDO2 is not supported in this browser.');
  }

  const storedId = getStoredPasskeyId(userId);
  const allowCredentials: PublicKeyCredentialDescriptor[] | undefined = storedId
    ? [{
        id: Uint8Array.from(atob(storedId.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
        type: 'public-key',
      }]
    : undefined;

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: generateWebAuthnChallenge(),
      rpId: window.location.hostname,
      allowCredentials,
      userVerification: 'required',
      timeout: 60_000,
    },
  });

  return assertion !== null;
}
