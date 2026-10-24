-- KAIRO PRODUCTION DATABASE SECURITY & MFA MIGRATION
-- Migration 004: Phase 5 Authentication Hardening, TOTP MFA, Recovery Codes, Session Tracking & Strict RLS
-- Non-destructive, idempotent schema additions

-- 1. Extend profiles with security & verification metadata
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';

-- 2. Extend user_sessions with device metadata, idle tracking, revocation & MFA state
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS device_info TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS os TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS ip_masked TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS mfa_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS auth_state TEXT NOT NULL DEFAULT 'FULLY_AUTHENTICATED';

-- 3. TOTP Multi-Factor Authentication Secrets (AES-256-GCM Encrypted at rest)
CREATE TABLE IF NOT EXISTS user_mfa (
  user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_secret TEXT,
  pending_encrypted_secret TEXT,
  pending_created_at TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  enabled_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  last_used_step BIGINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. One-Time MFA Recovery Codes (Hashed with HMAC-SHA256 / scrypt; plaintext never stored)
CREATE TABLE IF NOT EXISTS user_recovery_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_recovery_codes_user ON user_recovery_codes(user_id);

-- 5. Short-Lived MFA Login Challenges (PASSWORD_VERIFIED temporary state)
CREATE TABLE IF NOT EXISTS mfa_challenges (
  challenge_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  auth_state TEXT NOT NULL DEFAULT 'PASSWORD_VERIFIED',
  device_info TEXT,
  ip_masked TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_user ON mfa_challenges(user_id);

-- 6. Password Reset Tokens (Cryptographically random, hashed, short expiration, single-use)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- 7. Email Verification Tokens (Single-use, hashed, expiring)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user ON email_verification_tokens(user_id);

-- 8. Security Audit & Suspicious Login Events
CREATE TABLE IF NOT EXISTS user_security_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'INFO',
  device_info TEXT,
  ip_masked TEXT,
  is_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_security_events_user ON user_security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);

-- ============================================================================
-- STRICT ROW LEVEL SECURITY FOR ALL AUTHENTICATION & SENSITIVE TABLES
-- ============================================================================

ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mfa ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE universes ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_anime_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_certificates ENABLE ROW LEVEL SECURITY;

-- Sensitive tables: Service Role ONLY (Never accessible directly by anon/client keys)
DROP POLICY IF EXISTS "Service role exclusive access to user_credentials" ON user_credentials;
CREATE POLICY "Service role exclusive access to user_credentials"
  ON user_credentials FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role exclusive access to user_sessions" ON user_sessions;
CREATE POLICY "Service role exclusive access to user_sessions"
  ON user_sessions FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role exclusive access to user_mfa" ON user_mfa;
CREATE POLICY "Service role exclusive access to user_mfa"
  ON user_mfa FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role exclusive access to user_recovery_codes" ON user_recovery_codes;
CREATE POLICY "Service role exclusive access to user_recovery_codes"
  ON user_recovery_codes FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role exclusive access to mfa_challenges" ON mfa_challenges;
CREATE POLICY "Service role exclusive access to mfa_challenges"
  ON mfa_challenges FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role exclusive access to password_reset_tokens" ON password_reset_tokens;
CREATE POLICY "Service role exclusive access to password_reset_tokens"
  ON password_reset_tokens FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role exclusive access to email_verification_tokens" ON email_verification_tokens;
CREATE POLICY "Service role exclusive access to email_verification_tokens"
  ON email_verification_tokens FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view their own security events" ON user_security_events;
CREATE POLICY "Users can view their own security events"
  ON user_security_events FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages security events" ON user_security_events;
CREATE POLICY "Service role manages security events"
  ON user_security_events FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages migration_status" ON migration_status;
CREATE POLICY "Service role manages migration_status"
  ON migration_status FOR ALL USING (auth.role() = 'service_role');
