import crypto from 'crypto';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { Request, Response } from 'express';

// ============================================================================
// 1. CRYPTOGRAPHIC KEYS & AES-256-GCM TOTP SECRET ENCRYPTION AT REST
// ============================================================================

function getMasterSecretMaterial(): string {
  return (
    process.env.MFA_ENCRYPTION_KEY ||
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'kairo_prod_mfa_aes256_gcm_master_key_v5_98c4e1a27b'
  );
}

let cachedEncryptionKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (!cachedEncryptionKey) {
    const material = getMasterSecretMaterial();
    cachedEncryptionKey = crypto.scryptSync(material, 'kairo_phase5_totp_aes256_salt', 32);
  }
  return cachedEncryptionKey;
}

export function getHmacSigningKey(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    'kairo_jwt_sec_2025_prod_v1_secure_sign_key_93a1f8'
  );
}

/**
 * Encrypts a plaintext Base32 TOTP secret using AES-256-GCM with a random 96-bit IV.
 * Output format: v1:<ivHex>:<authTagHex>:<ciphertextHex>
 */
export function encryptTotpSecret(plainBase32Secret: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainBase32Secret, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM encrypted TOTP secret in server memory only.
 * Never log or return the output of this function after enrollment.
 */
export function decryptTotpSecret(encryptedPayload: string): string {
  if (!encryptedPayload || typeof encryptedPayload !== 'string') {
    throw new Error('Invalid encrypted TOTP secret payload');
  }
  const parts = encryptedPayload.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Unsupported encrypted TOTP secret version');
  }
  const [, ivHex, authTagHex, cipherHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(cipherHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

// ============================================================================
// 2. STANDARD RFC 6238 TOTP GENERATION & VERIFICATION
// ============================================================================

export interface TotpEnrollmentBundle {
  manualSetupKey: string; // Base32 secret shown ONCE during setup
  otpauthUri: string;
  qrCodeDataUrl: string; // Server-rendered PNG Data URL (never hits external URLs)
  encryptedSecret: string; // Stored server-side as pending_encrypted_secret
}

export async function createTotpEnrollment(
  username: string,
  email: string
): Promise<TotpEnrollmentBundle> {
  // 20 bytes = 160 bits of cryptographic randomness (RFC 4226 / RFC 6238 standard)
  const secret = new OTPAuth.Secret({ size: 20 });
  const accountLabel = email || username || 'KairoUser';

  const totp = new OTPAuth.TOTP({
    issuer: 'KAIRO',
    label: accountLabel,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  const otpauthUri = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 240,
    color: {
      dark: '#26152b',
      light: '#ffffff',
    },
  });

  const manualSetupKey = secret.base32;
  const encryptedSecret = encryptTotpSecret(manualSetupKey);

  return {
    manualSetupKey,
    otpauthUri,
    qrCodeDataUrl,
    encryptedSecret,
  };
}

/**
 * Verifies a 6-digit TOTP code against an encrypted secret.
 * Protects against TOTP replay within the same 30-second time step.
 */
export function verifyEncryptedTotpCode(
  encryptedSecret: string,
  rawCode: string,
  lastUsedStep?: number | null
): { valid: boolean; usedStep?: number; replayDetected?: boolean } {
  if (!rawCode || typeof rawCode !== 'string') {
    return { valid: false };
  }
  const cleanCode = rawCode.replace(/\s+/g, '').trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    return { valid: false };
  }

  try {
    const base32Secret = decryptTotpSecret(encryptedSecret);
    const secret = OTPAuth.Secret.fromBase32(base32Secret);
    const totp = new OTPAuth.TOTP({
      issuer: 'KAIRO',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    const nowMs = Date.now();
    // Window = 1 allows ±1 step (30s) for minor client/server clock skew
    const delta = totp.validate({ token: cleanCode, timestamp: nowMs, window: 1 });
    if (delta === null) {
      return { valid: false };
    }

    const currentStep = Math.floor(nowMs / 1000 / 30) + delta;
    if (typeof lastUsedStep === 'number' && currentStep <= lastUsedStep) {
      return { valid: false, replayDetected: true };
    }

    return { valid: true, usedStep: currentStep };
  } catch {
    return { valid: false };
  }
}

// ============================================================================
// 3. ONE-TIME RECOVERY CODES (HASHED AT REST)
// ============================================================================

export interface RecoveryCodeRecord {
  id: string;
  codeHash: string;
  used: boolean;
  usedAt?: string;
  createdAt: string;
}

const RECOVERY_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Unambiguous uppercase alphanumeric

export function normalizeRecoveryCode(code: string): string {
  return String(code || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function hashRecoveryCode(userId: string, rawCode: string): string {
  const normalized = normalizeRecoveryCode(rawCode);
  const key = getEncryptionKey();
  return crypto
    .createHmac('sha256', key)
    .update(`recovery:${userId}:${normalized}`)
    .digest('hex');
}

export function generateRecoveryCodeSet(
  userId: string,
  count = 10
): { plainCodes: string[]; records: RecoveryCodeRecord[] } {
  const plainCodes: string[] = [];
  const records: RecoveryCodeRecord[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < count; i++) {
    const bytes = crypto.randomBytes(12);
    let chars = '';
    for (let j = 0; j < 12; j++) {
      chars += RECOVERY_ALPHABET[bytes[j] % RECOVERY_ALPHABET.length];
    }
    const formatted = `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
    plainCodes.push(formatted);
    records.push({
      id: `rc_${Date.now()}_${i}_${crypto.randomBytes(3).toString('hex')}`,
      codeHash: hashRecoveryCode(userId, formatted),
      used: false,
      createdAt: now,
    });
  }

  return { plainCodes, records };
}

export function verifyAndConsumeRecoveryCode(
  userId: string,
  inputCode: string,
  records: RecoveryCodeRecord[]
): { matched: boolean; updatedRecords: RecoveryCodeRecord[]; consumedId?: string } {
  const normalized = normalizeRecoveryCode(inputCode);
  if (normalized.length < 8) {
    return { matched: false, updatedRecords: records };
  }

  const candidateHash = hashRecoveryCode(userId, normalized);
  const candidateBuf = Buffer.from(candidateHash, 'hex');

  let matchedIndex = -1;
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    if (rec.used) continue;
    try {
      const recBuf = Buffer.from(rec.codeHash, 'hex');
      if (recBuf.length === candidateBuf.length && crypto.timingSafeEqual(recBuf, candidateBuf)) {
        matchedIndex = i;
        break;
      }
    } catch {
      continue;
    }
  }

  if (matchedIndex === -1) {
    return { matched: false, updatedRecords: records };
  }

  const now = new Date().toISOString();
  const updatedRecords = records.map((rec, idx) =>
    idx === matchedIndex ? { ...rec, used: true, usedAt: now } : rec
  );

  return {
    matched: true,
    updatedRecords,
    consumedId: records[matchedIndex].id,
  };
}

// ============================================================================
// 4. PASSWORD SECURITY POLICY & VALIDATION
// ============================================================================

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password1',
  '12345678',
  '123456789',
  '1234567890',
  'qwertyui',
  'qwerty123',
  'iloveyou',
  'adminadmin',
  'letmein1',
  'welcome1',
]);

export function validatePasswordStrength(
  password: string,
  context?: { username?: string; email?: string }
): { valid: boolean; error?: string; message?: string } {
  if (!password || typeof password !== 'string') {
    const msg = 'Password is required.';
    return { valid: false, error: msg, message: msg };
  }
  if (password.length < 8) {
    const msg = 'Password must be at least 8 characters long.';
    return { valid: false, error: msg, message: msg };
  }
  if (password.length > 128) {
    const msg = 'Password cannot exceed 128 characters.';
    return { valid: false, error: msg, message: msg };
  }
  const lower = password.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(lower)) {
    const msg = 'This password is too common. Please choose a stronger phrase or password.';
    return { valid: false, error: msg, message: msg };
  }
  if (context?.username && lower === context.username.toLowerCase().trim()) {
    const msg = 'Password cannot be identical to your username.';
    return { valid: false, error: msg, message: msg };
  }
  if (context?.email && lower === context.email.toLowerCase().trim()) {
    const msg = 'Password cannot be identical to your email address.';
    return { valid: false, error: msg, message: msg };
  }
  return { valid: true };
}

export function maskEmailAddress(email?: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return '***@***';
  }
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***';
  const visibleLocal =
    local.length <= 2
      ? `${local[0] || '*'}*`
      : `${local.slice(0, 2)}${'*'.repeat(Math.min(4, Math.max(2, local.length - 2)))}`;
  return `${visibleLocal}@${domain}`;
}

// ============================================================================
// 5. DEVICE / USER-AGENT PARSING & PRIVACY-PRESERVING IP MASKING
// ============================================================================

export interface ParsedDeviceMetadata {
  deviceInfo: string;
  browser: string;
  os: string;
  ipMasked: string;
  ipHash: string;
  deviceFingerprint: string;
}

export function maskIpAddress(rawIp?: string): string {
  if (!rawIp || typeof rawIp !== 'string') return 'Protected Network';
  const firstIp = rawIp.split(',')[0].trim();
  if (!firstIp || firstIp === '::1' || firstIp === '127.0.0.1') {
    return 'Localhost (127.0.0.x)';
  }
  // IPv4 masking: keep first two octets, mask last two
  if (firstIp.includes('.')) {
    const cleanV4 = firstIp.replace(/^::ffff:/, '');
    const parts = cleanV4.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.*`;
    }
  }
  // IPv6 masking: keep first two blocks
  if (firstIp.includes(':')) {
    const parts = firstIp.split(':').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}:*:*`;
    }
  }
  return 'Protected Network';
}

export function parseDeviceFromRequest(req?: Request): ParsedDeviceMetadata {
  const ua = String(req?.headers?.['user-agent'] || '');
  const rawIp = String(
    req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip || ''
  );

  let browser = 'Web Browser';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';

  let os = 'Desktop';
  if (ua.includes('iPhone')) os = 'iPhone (iOS)';
  else if (ua.includes('iPad')) os = 'iPad (iPadOS)';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';

  const deviceInfo = `${browser} on ${os}`;
  const ipMasked = maskIpAddress(rawIp);
  const ipHash = crypto
    .createHash('sha256')
    .update(`kairo_ip_v5:${rawIp || 'local'}`)
    .digest('hex')
    .slice(0, 16);

  const fpSource = `${browser}|${os}|${ipMasked}`;
  const deviceFingerprint = crypto
    .createHash('sha256')
    .update(fpSource)
    .digest('hex')
    .slice(0, 16);

  return {
    deviceInfo,
    browser,
    os,
    ipMasked,
    ipHash,
    deviceFingerprint,
  };
}

export function extractRequestDeviceMeta(req?: Request): ParsedDeviceMetadata {
  return parseDeviceFromRequest(req);
}

// ============================================================================
// 6. PROGRESSIVE RATE LIMITING (BRUTE-FORCE PROTECTION WITHOUT PERMANENT LOCKOUT)
// ============================================================================

interface RateLimitBucket {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  blockedUntil: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes sliding window

export type RateLimitScope =
  | 'login'
  | 'mfa_verify'
  | 'mfa_enroll'
  | 'recovery_verify'
  | 'password_reset'
  | 'password_change'
  | 'email_verify';

export interface RateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
  maxDelaySeconds?: number;
}

function normalizeRateKeys(
  scopeOrKeys: RateLimitScope | string | string[],
  identifiersOrOptions?: string[] | RateLimitOptions
): { keys: string[]; options: RateLimitOptions } {
  if (Array.isArray(scopeOrKeys)) {
    const opts =
      identifiersOrOptions && !Array.isArray(identifiersOrOptions)
        ? identifiersOrOptions
        : {};
    return {
      keys: scopeOrKeys.filter(Boolean).map(k => k.toLowerCase().trim()),
      options: opts,
    };
  }
  const ids = Array.isArray(identifiersOrOptions) ? identifiersOrOptions : [];
  return {
    keys: ids.filter(Boolean).map(id => `${scopeOrKeys}:${id.toLowerCase().trim()}`),
    options: {},
  };
}

export function checkRateLimit(
  scopeOrKeys: RateLimitScope | string | string[],
  identifiersOrOptions?: string[] | RateLimitOptions
): { allowed: boolean; retryAfterSeconds: number; remainingAttempts: number; attempts: number } {
  const now = Date.now();
  const { keys, options } = normalizeRateKeys(scopeOrKeys, identifiersOrOptions);
  const windowMs = options.windowMs || WINDOW_MS;
  const maxAttempts = options.maxAttempts || 5;
  let highestCount = 0;

  for (const key of keys) {
    const bucket = rateLimitStore.get(key);
    if (!bucket) continue;

    // Reset expired window if not currently in cooldown
    if (now - bucket.lastAttemptAt > windowMs && now >= bucket.blockedUntil) {
      rateLimitStore.delete(key);
      continue;
    }

    if (bucket.count > highestCount) {
      highestCount = bucket.count;
    }

    if (now < bucket.blockedUntil) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.blockedUntil - now) / 1000));
      return {
        allowed: false,
        retryAfterSeconds,
        remainingAttempts: 0,
        attempts: bucket.count,
      };
    }
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, maxAttempts - highestCount),
    attempts: highestCount,
  };
}

export function recordRateLimitFailure(
  scopeOrKeys: RateLimitScope | string | string[],
  identifiers?: string[]
): { blocked: boolean; retryAfterSeconds: number; maxAttempts: number } {
  const now = Date.now();
  const { keys } = normalizeRateKeys(scopeOrKeys, identifiers);
  let maxAttempts = 0;
  let maxBlockedUntil = 0;

  for (const key of keys) {
    let bucket = rateLimitStore.get(key);

    if (!bucket || now - bucket.lastAttemptAt > WINDOW_MS) {
      bucket = {
        count: 0,
        firstAttemptAt: now,
        lastAttemptAt: now,
        blockedUntil: 0,
      };
    }

    bucket.count += 1;
    bucket.lastAttemptAt = now;

    // Progressive cooldowns (Never permanently locks accounts)
    if (bucket.count >= 12) {
      bucket.blockedUntil = now + 5 * 60 * 1000; // 5 minutes
    } else if (bucket.count >= 8) {
      bucket.blockedUntil = now + 2 * 60 * 1000; // 2 minutes
    } else if (bucket.count >= 5) {
      bucket.blockedUntil = now + 30 * 1000; // 30 seconds
    }

    rateLimitStore.set(key, bucket);
    if (bucket.count > maxAttempts) maxAttempts = bucket.count;
    if (bucket.blockedUntil > maxBlockedUntil) maxBlockedUntil = bucket.blockedUntil;
  }

  const retryAfterSeconds =
    maxBlockedUntil > now ? Math.ceil((maxBlockedUntil - now) / 1000) : 0;

  return {
    blocked: retryAfterSeconds > 0,
    retryAfterSeconds,
    maxAttempts,
  };
}

export function clearRateLimit(
  scopeOrKeys: RateLimitScope | string | string[],
  identifiers?: string[]
): void {
  const { keys } = normalizeRateKeys(scopeOrKeys, identifiers);
  for (const key of keys) {
    rateLimitStore.delete(key);
  }
}

// ============================================================================
// 7. SECURE HTTPONLY COOKIE & CSRF HELPERS
// ============================================================================

const SESSION_COOKIE_NAME = 'kairo_session';
const MFA_CHALLENGE_COOKIE_NAME = 'kairo_mfa_challenge';
const CSRF_COOKIE_NAME = 'kairo_csrf';

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers?.cookie;
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  }
  return cookies;
}

function appendSetCookieHeader(res: Response, cookieValue: string): void {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', [cookieValue]);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing.map(String), cookieValue]);
  } else {
    res.setHeader('Set-Cookie', [String(existing), cookieValue]);
  }
}

export function setSecureSessionCookie(
  res: Response,
  sessionToken: string,
  maxAgeMs = 30 * 24 * 60 * 60 * 1000
): void {
  const isSecure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const maxAgeSec = Math.floor(maxAgeMs / 1000);
  const cookie = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
    isSecure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
  appendSetCookieHeader(res, cookie);
}

export function clearSecureSessionCookie(res: Response): void {
  const isSecure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const cookie = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    isSecure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
  appendSetCookieHeader(res, cookie);
}

export function setMfaChallengeCookie(
  res: Response,
  challengeToken: string,
  maxAgeMs = 5 * 60 * 1000
): void {
  const isSecure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const maxAgeSec = Math.floor(maxAgeMs / 1000);
  const cookie = [
    `${MFA_CHALLENGE_COOKIE_NAME}=${encodeURIComponent(challengeToken)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
    isSecure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
  appendSetCookieHeader(res, cookie);
}

export function clearMfaChallengeCookie(res: Response): void {
  const isSecure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const cookie = [
    `${MFA_CHALLENGE_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    isSecure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
  appendSetCookieHeader(res, cookie);
}

export function extractSessionCookie(req: Request): string | null {
  const cookies = parseCookies(req);
  return cookies[SESSION_COOKIE_NAME]?.trim() || null;
}

export function extractMfaChallengeCookie(req: Request): string | null {
  const cookies = parseCookies(req);
  return cookies[MFA_CHALLENGE_COOKIE_NAME]?.trim() || null;
}

export function setAuthCookies(req: Request, res: Response, sessionToken: string, maxAgeMs = 30 * 24 * 60 * 60 * 1000): string {
  const isSecure =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  const maxAgeSec = Math.floor(maxAgeMs / 1000);
  const csrfToken = crypto.randomBytes(24).toString('hex');

  const sessionCookie = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
    isSecure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');

  const csrfCookie = [
    `${CSRF_COOKIE_NAME}=${encodeURIComponent(csrfToken)}`,
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
    isSecure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');

  res.setHeader('Set-Cookie', [sessionCookie, csrfCookie]);
  return csrfToken;
}

export function clearAuthCookies(req: Request, res: Response): void {
  const isSecure =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  const clearSess = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    isSecure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');

  const clearCsrf = [
    `${CSRF_COOKIE_NAME}=`,
    'Path=/',
    'SameSite=Lax',
    'Max-Age=0',
    isSecure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');

  res.setHeader('Set-Cookie', [clearSess, clearCsrf]);
}

export function extractTokenFromRequest(req: Request): { token: string | null; source: 'header' | 'cookie' | 'none' } {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      return { token, source: 'header' };
    }
  }

  const cookies = parseCookies(req);
  if (cookies[SESSION_COOKIE_NAME]) {
    return { token: cookies[SESSION_COOKIE_NAME].trim(), source: 'cookie' };
  }

  return { token: null, source: 'none' };
}

// ============================================================================
// 8. HASHED ONE-TIME TOKENS (PASSWORD RESET & EMAIL VERIFICATION)
// ============================================================================

export function generateSecureOneTimeToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashOneTimeToken(rawToken);
  return { rawToken, tokenHash };
}

export function hashOneTimeToken(rawToken: string): string {
  return crypto
    .createHash('sha256')
    .update(`kairo_ott_v5:${String(rawToken || '').trim()}`)
    .digest('hex');
}

export function getEmailProviderStatus(): {
  configured: boolean;
  provider: string;
  requiredEnvVars: string[];
} {
  if (process.env.RESEND_API_KEY) {
    return {
      configured: true,
      provider: 'Resend API',
      requiredEnvVars: [],
    };
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      configured: true,
      provider: 'SMTP',
      requiredEnvVars: [],
    };
  }
  return {
    configured: false,
    provider: 'Skipped (No Custom Domain Required)',
    requiredEnvVars: [],
  };
}
