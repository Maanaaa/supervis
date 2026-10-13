import type { ISessionPayload } from '@/types/user';

export const SESSION_COOKIE_NAME = 'supervis_session';
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'supervis-default-jwt-secret-key-at-least-32-characters-long';
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

export interface ISessionData extends ISessionPayload {
  exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Génère un jeton de session HMAC SHA-256 (100% Web Standards, compatible Edge Runtime et Node.js).
 */
export async function createSessionToken(payload: ISessionPayload): Promise<string> {
  const sessionData: ISessionData = {
    ...payload,
    exp: Date.now() + SESSION_EXPIRY_MS,
  };

  const encoder = new TextEncoder();
  const payloadJson = JSON.stringify(sessionData);
  const payloadBase64 = base64UrlEncode(encoder.encode(payloadJson));

  const keyData = encoder.encode(SESSION_SECRET);
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await globalThis.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(payloadBase64)
  );
  const signatureBase64 = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${payloadBase64}.${signatureBase64}`;
}

/**
 * Vérifie et décode un jeton de session HMAC SHA-256 (100% Web Standards, compatible Edge Runtime et Node.js).
 */
export async function verifySessionToken(token: string): Promise<ISessionData | null> {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, signatureBase64] = parts;
    if (!payloadBase64 || !signatureBase64) return null;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(SESSION_SECRET);
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = base64UrlDecode(signatureBase64);
    const isValid = await globalThis.crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signatureBytes as unknown as BufferSource,
      encoder.encode(payloadBase64)
    );

    if (!isValid) return null;

    const decoder = new TextDecoder();
    const payloadJson = decoder.decode(base64UrlDecode(payloadBase64));
    const sessionData = JSON.parse(payloadJson) as ISessionData;

    if (!sessionData.exp || Date.now() > sessionData.exp) {
      return null;
    }

    return sessionData;
  } catch {
    return null;
  }
}
