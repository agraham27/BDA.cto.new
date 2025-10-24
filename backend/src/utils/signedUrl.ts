import { createHmac } from 'crypto';
import ms from 'ms';
import { STORAGE_CONFIG } from '@/config/storage';

interface SignedUrlPayload {
  fileId: string;
  expiresAt: number;
}

const ENCODING = 'base64url';
const SIGNATURE_PREFIX = 'hvbd';

function getSigningSecret() {
  if (!STORAGE_CONFIG.signedUrlSecret) {
    throw new Error('Signed URL secret is not configured');
  }

  return STORAGE_CONFIG.signedUrlSecret;
}

export function generateSignedToken(fileId: string, expiresIn: number | string = STORAGE_CONFIG.signedUrlExpiry) {
  const expiryMs = typeof expiresIn === 'string' ? ms(expiresIn) : expiresIn;
  const payload: SignedUrlPayload = {
    fileId,
    expiresAt: Date.now() + expiryMs,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadJson).toString(ENCODING);
  const signature = createHmac('sha256', getSigningSecret())
    .update(`${SIGNATURE_PREFIX}:${payloadBase64}`)
    .digest(ENCODING);

  return `${payloadBase64}.${signature}`;
}

export function verifySignedToken(token: string): SignedUrlPayload {
  const [payloadBase64, signature] = token.split('.');

  if (!payloadBase64 || !signature) {
    throw new Error('Invalid signed token');
  }

  const expectedSignature = createHmac('sha256', getSigningSecret())
    .update(`${SIGNATURE_PREFIX}:${payloadBase64}`)
    .digest(ENCODING);

  if (!timingSafeEqual(signature, expectedSignature)) {
    throw new Error('Invalid signed token signature');
  }

  const payloadJson = Buffer.from(payloadBase64, ENCODING).toString('utf8');
  const payload = JSON.parse(payloadJson) as SignedUrlPayload;

  if (Date.now() > payload.expiresAt) {
    throw new Error('Signed token has expired');
  }

  return payload;
}

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a, ENCODING);
  const bBuf = Buffer.from(b, ENCODING);

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return cryptoTimingSafeEqual(aBuf, bBuf);
}

function cryptoTimingSafeEqual(a: Buffer, b: Buffer) {
  try {
    return require('crypto').timingSafeEqual(a, b);
  } catch (error) {
    return false;
  }
}
