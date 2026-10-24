import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, Key, Smartphone, Lock,
  Laptop, Check, Copy, Download, RefreshCw, LogOut, AlertTriangle,
  Eye, EyeOff, Mail, Clock, CheckCircle2, XCircle, Activity
} from 'lucide-react';
import { api } from '../../services/api';
import {
  ActiveSessionInfo,
  SecurityEventItem,
  SecurityOverviewResponse,
  MfaEnrollmentStartResponse
} from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AccountSecuritySection: React.FC = () => {
  const { user, refreshUser, changePassword } = useAuth();

  const [overview, setOverview] = useState<SecurityOverviewResponse | null>(null);
  const [sessions, setSessions] = useState<ActiveSessionInfo[]>([]);
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Banner feedback
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // MFA Enrollment Flow state
  const [enrollStep, setEnrollStep] = useState<'idle' | 'password' | 'qr_verify' | 'recovery_codes'>('idle');
  const [enrollPassword, setEnrollPassword] = useState('');
  const [enrollData, setEnrollData] = useState<MfaEnrollmentStartResponse | null>(null);
  const [enrollTotpCode, setEnrollTotpCode] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [oneTimeRecoveryCodes, setOneTimeRecoveryCodes] = useState<string[] | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedRecoveryCodes, setCopiedRecoveryCodes] = useState(false);
  const [savedCodesConfirmed, setSavedCodesConfirmed] = useState(false);

  // Disable MFA Modal/Section state
  const [showDisableMfa, setShowDisableMfa] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);

  // Regenerate Recovery Codes state
  const [showRegenCodes, setShowRegenCodes] = useState(false);
  const [regenPassword, setRegenPassword] = useState('');
  const [regenTotpCode, setRegenTotpCode] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMfaCode, setPasswordMfaCode] = useState('');
  const [revokeOtherOnPwChange, setRevokeOtherOnPwChange] = useState(true);
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Email Verification state
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  const [emailTokenInput, setEmailTokenInput] = useState('');
  const [showEmailTokenInput, setShowEmailTokenInput] = useState(false);

  // Session Management state
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingAllOthers, setRevokingAllOthers] = useState(false);

  const loadSecurityData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [ov, sessRes, evRes] = await Promise.all([
        api.getSecurityOverview(),
        api.getActiveSessions(),
        api.getSecurityEvents(),
      ]);
      setOverview(ov);
      setSessions(sessRes.sessions || []);
      setEvents(evRes.events || []);
    } catch (err: any) {
      console.warn('[Security] Failed to load security details:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadSecurityData();
  }, [loadSecurityData]);

  // 1. Start MFA Enrollment (Verify Current Password)
  const handleStartMfaEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!enrollPassword) {
      setBanner({ type: 'error', text: 'Please enter your current password to begin 2FA setup.' });
      return;
    }

    setEnrollLoading(true);
    try {
      const res = await api.startMfaEnrollment(enrollPassword);
      setEnrollData(res);
      setEnrollPassword('');
      setEnrollTotpCode('');
      setEnrollStep('qr_verify');
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to verify current password.' });
    } finally {
      setEnrollLoading(false);
    }
  };

  // 2. Verify 6-Digit Authenticator Code & Activate MFA
  const handleVerifyMfaEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!enrollTotpCode.trim()) {
      setBanner({ type: 'error', text: 'Please enter the 6-digit code from your authenticator app.' });
      return;
    }

    setEnrollLoading(true);
    try {
      const res = await api.verifyMfaEnrollment(enrollTotpCode.trim());
      setOneTimeRecoveryCodes(res.recoveryCodes || []);
      setSavedCodesConfirmed(false);
      setEnrollData(null);
      setEnrollTotpCode('');
      setEnrollStep('recovery_codes');
      await refreshUser();
      await loadSecurityData();
      setBanner({
        type: 'success',
        text: 'Two-Factor Authentication is now ENABLED! Save your one-time recovery codes below—they will only be shown once.',
      });
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Invalid 6-digit authenticator code. Please try again.' });
    } finally {
      setEnrollLoading(false);
    }
  };

  // 3. Regenerate Recovery Codes
  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!regenPassword || !regenTotpCode.trim()) {
      setBanner({ type: 'error', text: 'Please provide both your current password and a 6-digit authenticator code.' });
      return;
    }

    setRegenLoading(true);
    try {
      const res = await api.regenerateRecoveryCodes({
        currentPassword: regenPassword,
        totpCode: regenTotpCode.trim(),
      });
      setOneTimeRecoveryCodes(res.recoveryCodes || []);
      setSavedCodesConfirmed(false);
      setShowRegenCodes(false);
      setRegenPassword('');
      setRegenTotpCode('');
      setEnrollStep('recovery_codes');
      await loadSecurityData();
      setBanner({
        type: 'success',
        text: 'New recovery codes generated. Your previous recovery codes have been permanently invalidated.',
      });
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to regenerate recovery codes.' });
    } finally {
      setRegenLoading(false);
    }
  };

  // 4. Disable MFA
  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!disablePassword || !disableCode.trim()) {
      setBanner({ type: 'error', text: 'Both your current password and an authenticator or recovery code are required.' });
      return;
    }

    setDisableLoading(true);
    try {
      const res = await api.disableMfa({
        currentPassword: disablePassword,
        code: disableCode.trim(),
      });
      setShowDisableMfa(false);
      setDisablePassword('');
      setDisableCode('');
      setOneTimeRecoveryCodes(null);
      setEnrollStep('idle');
      await refreshUser();
      await loadSecurityData();
      setBanner({ type: 'info', text: res.message || 'Two-Factor Authentication has been disabled.' });
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to disable Two-Factor Authentication.' });
    } finally {
      setDisableLoading(false);
    }
  };

  // 5. Change Password
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setBanner({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword.length < 8) {
      setBanner({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setBanner({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (overview?.mfaEnabled && !passwordMfaCode.trim()) {
      setBanner({ type: 'error', text: 'Please enter your 6-digit authenticator code to confirm this password change.' });
      return;
    }

    setPwLoading(true);
    try {
      const res = await changePassword(
        currentPassword,
        newPassword,
        overview?.mfaEnabled ? passwordMfaCode.trim() : undefined,
        revokeOtherOnPwChange
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMfaCode('');
      await loadSecurityData();
      setBanner({ type: 'success', text: res.message || 'Password updated successfully.' });
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPwLoading(false);
    }
  };

  // 6. Revoke Single Session
  const handleRevokeSession = async (sessionId: string) => {
    setBanner(null);
    setRevokingSessionId(sessionId);
    try {
      const res = await api.revokeSession(sessionId);
      await loadSecurityData();
      setBanner({ type: 'success', text: res.message || 'Device session signed out.' });
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to revoke session.' });
    } finally {
      setRevokingSessionId(null);
    }
  };

  // 7. Revoke All Other Sessions
  const handleRevokeAllOtherSessions = async () => {
    setBanner(null);
    setRevokingAllOthers(true);
    try {
      const res = await api.revokeAllOtherSessions();
      await loadSecurityData();
      setBanner({ type: 'success', text: res.message || 'Signed out of all other devices.' });
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to sign out other devices.' });
    } finally {
      setRevokingAllOthers(false);
    }
  };

  // 8. Email Verification Request / Confirm
  const handleSendVerificationEmail = async () => {
    setBanner(null);
    setEmailVerifyLoading(true);
    try {
      const res = await api.sendVerificationEmail();
      await loadSecurityData();
      setBanner({
        type: res.emailDeliveryConfigured ? 'success' : 'info',
        text: res.message,
      });
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to request verification email.' });
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  const handleConfirmEmailToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTokenInput.trim()) return;
    setEmailVerifyLoading(true);
    try {
      const res = await api.verifyEmailToken(emailTokenInput.trim());
      setEmailTokenInput('');
      setShowEmailTokenInput(false);
      await refreshUser();
      await loadSecurityData();
      setBanner({ type: 'success', text: res.message || 'Email verified!' });
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Invalid or expired verification token.' });
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  const copyManualKey = () => {
    if (!enrollData?.manualEntryKey) return;
    navigator.clipboard.writeText(enrollData.manualEntryKey.replace(/\s+/g, ''));
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const copyRecoveryCodes = () => {
    if (!oneTimeRecoveryCodes) return;
    const content = [
      'KAIRO TWO-FACTOR AUTHENTICATION RECOVERY CODES',
      `Account: ${user?.username} (${user?.email})`,
      `Generated: ${new Date().toISOString()}`,
      'Each code can only be used once. Store these in a password manager or safe location.',
      '',
      ...oneTimeRecoveryCodes,
    ].join('\n');
    navigator.clipboard.writeText(content);
    setCopiedRecoveryCodes(true);
    setTimeout(() => setCopiedRecoveryCodes(false), 2500);
  };

  const downloadRecoveryCodes = () => {
    if (!oneTimeRecoveryCodes) return;
    const content = [
      'KAIRO TWO-FACTOR AUTHENTICATION RECOVERY CODES',
      `Account: ${user?.username} (${user?.email})`,
      `Generated: ${new Date().toISOString()}`,
      'IMPORTANT: Each recovery code can be used only ONCE. Keep these secret and safe.',
      '------------------------------------------------------------',
      ...oneTimeRecoveryCodes.map((c, i) => `${String(i + 1).padStart(2, '0')}. ${c}`),
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kairo-recovery-codes-${user?.username || 'account'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const mfaEnabled = Boolean(overview?.mfaEnabled ?? user?.mfaEnabled);
  const otherSessionsCount = sessions.filter(s => !s.isCurrent).length;

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {banner && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-start justify-between gap-3 ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : banner.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : banner.type === 'error' ? (
              <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <span>{banner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-[11px] font-bold underline opacity-75 hover:opacity-100 cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================================
          1. TWO-FACTOR AUTHENTICATION (TOTP MFA) & RECOVERY CODES
      ===================================================================== */}
      <div className="p-6 rounded-3xl bg-white/90 border border-pink-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-100 pb-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                mfaEnabled
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-purple-100 text-[#635882] border border-purple-200'
              }`}
            >
              {mfaEnabled ? <ShieldCheck className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h4 className="text-base font-black text-[#26152b]">
                  Two-Factor Authentication (2FA)
                </h4>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    mfaEnabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {mfaEnabled ? 'Enabled (TOTP)' : 'Not Enabled'}
                </span>
              </div>
              <p className="text-xs text-[#877276] mt-1 max-w-xl">
                Protect your KAIRO account with time-based one-time passcodes (TOTP) from Google Authenticator, Microsoft Authenticator, Authy, 1Password, or Bitwarden.
              </p>
            </div>
          </div>

          {!mfaEnabled && enrollStep === 'idle' && (
            <button
              type="button"
              onClick={() => {
                setBanner(null);
                setEnrollStep('password');
              }}
              className="px-4 py-2.5 rounded-xl btn-gradient text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0 flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>Enable Two-Factor Authentication</span>
            </button>
          )}
        </div>

        {/* MFA ENROLLMENT STEP 1: Confirm Current Password */}
        {!mfaEnabled && enrollStep === 'password' && (
          <form onSubmit={handleStartMfaEnroll} className="p-5 rounded-2xl bg-pink-50/50 border border-pink-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-[#9e3b5f]">
                Step 1 of 3 — Confirm Your Current Password
              </div>
              <button
                type="button"
                onClick={() => { setEnrollStep('idle'); setEnrollPassword(''); }}
                className="text-xs font-semibold text-[#877276] hover:text-[#26152b] cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-[#544246]">
              For your security, please verify your current password before generating a new authenticator key.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="password"
                required
                autoFocus
                value={enrollPassword}
                onChange={e => setEnrollPassword(e.target.value)}
                placeholder="Enter current password"
                className="flex-1 h-10 px-3.5 rounded-xl bg-white border border-pink-200 text-sm text-[#26152b] outline-none focus:border-[#9e3b5f]"
              />
              <button
                type="submit"
                disabled={enrollLoading}
                className="px-5 h-10 rounded-xl btn-gradient text-white text-xs font-bold cursor-pointer shrink-0"
              >
                {enrollLoading ? 'Verifying...' : 'Continue to QR Setup'}
              </button>
            </div>
          </form>
        )}

        {/* MFA ENROLLMENT STEP 2: Scan QR Code + Enter 6-Digit Code */}
        {!mfaEnabled && enrollStep === 'qr_verify' && enrollData && (
          <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-[#635882]">
                Step 2 of 3 — Scan QR Code & Verify Authenticator
              </div>
              <button
                type="button"
                onClick={() => {
                  setEnrollStep('idle');
                  setEnrollData(null);
                  setEnrollTotpCode('');
                }}
                className="text-xs font-semibold text-[#877276] hover:text-[#26152b] cursor-pointer"
              >
                Cancel Setup
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* QR Code Box */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-white border border-purple-200/80 shadow-xs">
                <img
                  src={enrollData.qrCodeDataUrl}
                  alt="TOTP QR Code"
                  className="w-44 h-44 object-contain rounded-lg"
                />
                <span className="text-[11px] font-semibold text-[#544246] mt-2 text-center">
                  Scan with Google Authenticator, Authy, 1Password, or Bitwarden
                </span>
              </div>

              {/* Manual Key Fallback + Verification Form */}
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-white border border-pink-200/80">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#877276] mb-1">
                    Manual Setup Key (If you can&apos;t scan the QR code)
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-bold text-[#26152b] break-all select-all">
                      {enrollData.manualEntryKey}
                    </code>
                    <button
                      type="button"
                      onClick={copyManualKey}
                      className="px-2.5 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#9e3b5f] text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedSecret ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleVerifyMfaEnroll} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#26152b] mb-1">
                      Enter 6-Digit Authenticator Code to Activate
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      maxLength={8}
                      value={enrollTotpCode}
                      onChange={e => setEnrollTotpCode(e.target.value)}
                      placeholder="000000"
                      className="w-full h-11 px-4 rounded-xl bg-white border border-purple-300 focus:border-[#9e3b5f] font-mono text-base tracking-widest text-center text-[#26152b] outline-none"
                    />
                    <p className="text-[11px] text-[#877276] mt-1">
                      Two-factor authentication will not be enabled until you verify a valid 6-digit code.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={enrollLoading}
                    className="w-full h-10 rounded-xl btn-gradient text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {enrollLoading ? 'Verifying Code...' : 'Verify Code & Enable 2FA'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ONE-TIME RECOVERY CODES DISPLAY (Shown ONCE after enabling MFA or regenerating) */}
        {enrollStep === 'recovery_codes' && oneTimeRecoveryCodes && (
          <div className="p-5 rounded-2xl bg-amber-50/90 border-2 border-amber-300 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                  <Key className="w-4 h-4 text-amber-700" />
                  <span>Save Your One-Time Recovery Codes (Shown Only Once)</span>
                </div>
                <p className="text-xs text-amber-900 mt-1">
                  If you lose access to your authenticator device, each of these codes can be used <strong>once</strong> to sign in. For security, we only store cryptographic hashes—you will not be able to view these codes again after closing this panel.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-4 rounded-xl bg-white border border-amber-200">
              {oneTimeRecoveryCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-2 rounded-lg bg-amber-50/60 border border-amber-200/70 font-mono text-xs font-bold text-[#26152b] text-center select-all"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyRecoveryCodes}
                  className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-xs font-bold text-amber-950 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedRecoveryCodes ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRecoveryCodes ? 'Copied All Codes' : 'Copy Codes'}</span>
                </button>
                <button
                  type="button"
                  onClick={downloadRecoveryCodes}
                  className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-xs font-bold text-amber-950 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-amber-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={savedCodesConfirmed}
                    onChange={e => setSavedCodesConfirmed(e.target.checked)}
                    className="rounded border-amber-400 text-[#9e3b5f]"
                  />
                  <span>I have saved these recovery codes</span>
                </label>
                <button
                  type="button"
                  disabled={!savedCodesConfirmed}
                  onClick={() => {
                    setOneTimeRecoveryCodes(null);
                    setEnrollStep('idle');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#26152b] text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WHEN MFA IS ENABLED: Recovery Codes Status + Regenerate + Disable Controls */}
        {mfaEnabled && enrollStep === 'idle' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#26152b]">One-Time Recovery Codes</div>
                  <div className="text-[11px] text-[#877276] mt-0.5">
                    {overview?.recoveryCodesRemaining ?? 0} of {overview?.recoveryCodesTotal || 10} unused recovery codes remaining
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegenCodes(!showRegenCodes);
                    setShowDisableMfa(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-white border border-pink-200 hover:bg-pink-50 text-xs font-bold text-[#9e3b5f] flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#26152b]">Authenticator Status</div>
                  <div className="text-[11px] text-[#877276] mt-0.5">
                    {overview?.mfaEnabledAt
                      ? `Enabled ${new Date(overview.mfaEnabledAt).toLocaleDateString()}`
                      : 'Active on your account'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDisableMfa(!showDisableMfa);
                    setShowRegenCodes(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-xs font-bold text-red-600 cursor-pointer"
                >
                  Disable 2FA
                </button>
              </div>
            </div>

            {/* Regenerate Recovery Codes Form */}
            {showRegenCodes && (
              <form onSubmit={handleRegenerateCodes} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="text-xs font-bold text-amber-950">
                  Regenerate Recovery Codes (Invalidates all previous recovery codes)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="password"
                    required
                    value={regenPassword}
                    onChange={e => setRegenPassword(e.target.value)}
                    placeholder="Current password"
                    className="h-10 px-3.5 rounded-xl bg-white border border-amber-300 text-xs text-[#26152b] outline-none"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={8}
                    value={regenTotpCode}
                    onChange={e => setRegenTotpCode(e.target.value)}
                    placeholder="6-digit authenticator code"
                    className="h-10 px-3.5 rounded-xl bg-white border border-amber-300 text-xs font-mono text-[#26152b] outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRegenCodes(false)}
                    className="px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-semibold text-[#544246] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={regenLoading}
                    className="px-4 py-2 rounded-xl bg-[#9e3b5f] text-white text-xs font-bold cursor-pointer"
                  >
                    {regenLoading ? 'Generating...' : 'Generate New Recovery Codes'}
                  </button>
                </div>
              </form>
            )}

            {/* Disable MFA Confirmation Form */}
            {showDisableMfa && (
              <form onSubmit={handleDisableMfa} className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-3">
                <div className="text-xs font-bold text-red-900">
                  Confirm Disabling Two-Factor Authentication
                </div>
                <p className="text-[11px] text-red-700">
                  Disabling 2FA requires both your current password and a valid 6-digit authenticator code (or unused recovery code). All existing recovery codes will be invalidated.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="password"
                    required
                    value={disablePassword}
                    onChange={e => setDisablePassword(e.target.value)}
                    placeholder="Current password"
                    className="h-10 px-3.5 rounded-xl bg-white border border-red-200 text-xs text-[#26152b] outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={disableCode}
                    onChange={e => setDisableCode(e.target.value)}
                    placeholder="6-digit TOTP or recovery code"
                    className="h-10 px-3.5 rounded-xl bg-white border border-red-200 text-xs font-mono text-[#26152b] outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDisableMfa(false)}
                    className="px-3 py-2 rounded-xl bg-white border border-red-200 text-xs font-semibold text-[#544246] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disableLoading}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {disableLoading ? 'Disabling...' : 'Confirm Disable 2FA'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
          2. CHANGE PASSWORD & EMAIL VERIFICATION
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password Card */}
        <div className="p-6 rounded-3xl bg-white/90 border border-pink-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-pink-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-100 text-[#9e3b5f] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#26152b]">Change Password</h4>
                <p className="text-[11px] text-[#877276]">
                  {overview?.passwordChangedAt
                    ? `Last updated ${new Date(overview.passwordChangedAt).toLocaleDateString()}`
                    : 'Protected with scrypt memory-hard hashing'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="p-2 rounded-lg text-[#877276] hover:text-[#26152b] cursor-pointer"
              title={showPasswords ? 'Hide passwords' : 'Show passwords'}
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#544246] mb-1">
                Current Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3.5 rounded-xl bg-pink-50/40 border border-pink-200 text-xs text-[#26152b] outline-none focus:border-[#9e3b5f]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#544246] mb-1">
                  New Password (Min. 8 chars)
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3.5 rounded-xl bg-pink-50/40 border border-pink-200 text-xs text-[#26152b] outline-none focus:border-[#9e3b5f]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#544246] mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3.5 rounded-xl bg-pink-50/40 border border-pink-200 text-xs text-[#26152b] outline-none focus:border-[#9e3b5f]"
                />
              </div>
            </div>

            {mfaEnabled && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635882] mb-1">
                  2FA Confirmation Code (Required because 2FA is active)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={passwordMfaCode}
                  onChange={e => setPasswordMfaCode(e.target.value)}
                  placeholder="6-digit authenticator code"
                  className="w-full h-10 px-3.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs font-mono text-[#26152b] outline-none focus:border-[#9e3b5f]"
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-[#544246] pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={revokeOtherOnPwChange}
                onChange={e => setRevokeOtherOnPwChange(e.target.checked)}
                className="rounded border-pink-300 text-[#9e3b5f]"
              />
              <span>Sign out all other active devices after changing password</span>
            </label>

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full h-10 rounded-xl bg-[#26152b] hover:bg-[#3a2042] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {pwLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Email Verification Status Card */}
        <div className="p-6 rounded-3xl bg-white/90 border border-pink-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-100 text-[#9e3b5f] flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#26152b]">Account Email</h4>
                  <p className="text-[11px] text-[#877276]">{user?.email}</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  overview?.emailVerified
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : overview?.emailDeliveryConfigured
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-purple-100 text-[#635882] border border-purple-200'
                }`}
              >
                {overview?.emailVerified
                  ? 'Verified'
                  : overview?.emailDeliveryConfigured
                  ? 'Pending Verification'
                  : 'Domain Email Skipped'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-pink-50/50 border border-pink-100 text-xs text-[#544246] space-y-1.5">
              <div className="font-bold text-[#26152b]">
                Email Delivery:{' '}
                <span className={overview?.emailDeliveryConfigured ? 'text-emerald-700' : 'text-[#635882]'}>
                  {overview?.emailDeliveryConfigured
                    ? `Active (${overview.emailProviderName})`
                    : 'Skipped (No custom domain required)'}
                </span>
              </div>
              {!overview?.emailDeliveryConfigured && (
                <p className="text-[11px] text-[#877276] leading-relaxed">
                  Outbound email verification is currently skipped since no custom domain is configured. Your account is fully active and protected by password hashing and Authenticator App (TOTP) 2FA. You can enable custom domain email delivery anytime in the future.
                </p>
              )}
            </div>

            {showEmailTokenInput && !overview?.emailVerified && (
              <form onSubmit={handleConfirmEmailToken} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={emailTokenInput}
                  onChange={e => setEmailTokenInput(e.target.value)}
                  placeholder="Paste single-use verification token"
                  className="flex-1 h-9 px-3 rounded-xl bg-white border border-pink-200 text-xs font-mono text-[#26152b] outline-none"
                />
                <button
                  type="submit"
                  disabled={emailVerifyLoading}
                  className="px-3.5 h-9 rounded-xl bg-[#9e3b5f] text-white text-xs font-bold cursor-pointer"
                >
                  Verify
                </button>
              </form>
            )}
          </div>

          {!overview?.emailVerified && overview?.emailDeliveryConfigured && (
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={emailVerifyLoading}
                onClick={handleSendVerificationEmail}
                className="flex-1 h-10 rounded-xl bg-pink-100/80 hover:bg-pink-200/70 text-[#9e3b5f] text-xs font-bold transition-colors cursor-pointer"
              >
                {emailVerifyLoading ? 'Generating Token...' : 'Send Verification Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowEmailTokenInput(!showEmailTokenInput)}
                className="px-3.5 h-10 rounded-xl bg-white border border-pink-200 text-xs font-semibold text-[#544246] hover:bg-pink-50 cursor-pointer"
              >
                Enter Token
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          3. ACTIVE SESSIONS & DEVICE MANAGEMENT
      ===================================================================== */}
      <div className="p-6 rounded-3xl bg-white/90 border border-pink-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-[#9e3b5f] flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-[#26152b]">
                Active Sessions & Devices ({sessions.length})
              </h4>
              <p className="text-xs text-[#877276]">
                Review devices currently signed into your KAIRO account. Revoking a session invalidates it immediately on the server.
              </p>
            </div>
          </div>

          {otherSessionsCount > 0 && (
            <button
              type="button"
              disabled={revokingAllOthers}
              onClick={handleRevokeAllOtherSessions}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{revokingAllOthers ? 'Signing Out...' : `Log Out All Other Devices (${otherSessionsCount})`}</span>
            </button>
          )}
        </div>

        {loadingData ? (
          <div className="text-xs text-[#877276] py-4">Loading active device sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="text-xs text-[#877276] py-4">No active sessions found.</div>
        ) : (
          <div className="divide-y divide-pink-100">
            {sessions.map(sess => (
              <div key={sess.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      sess.isCurrent
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-pink-50 text-[#544246] border border-pink-200/70'
                    }`}
                  >
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-[#26152b]">
                        {sess.deviceInfo || 'Web Browser Session'}
                      </span>
                      {sess.isCurrent && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Current Session
                        </span>
                      )}
                      {sess.mfaVerified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#635882]">
                          2FA Verified
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#877276] mt-1">
                      <span>Network: {sess.ipMasked || 'Masked'}</span>
                      <span>•</span>
                      <span>Created: {new Date(sess.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Last active: {new Date(sess.lastActiveAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={revokingSessionId === sess.id}
                  onClick={() => handleRevokeSession(sess.id)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-pink-200 hover:border-red-300 hover:bg-red-50 text-xs font-bold text-[#544246] hover:text-red-600 transition-colors cursor-pointer self-start sm:self-center shrink-0"
                >
                  {revokingSessionId === sess.id
                    ? 'Revoking...'
                    : sess.isCurrent
                    ? 'Log Out This Device'
                    : 'Revoke Device'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================================
          4. SECURITY ACTIVITY & SUSPICIOUS LOGIN DETECTION LOG
      ===================================================================== */}
      <div className="p-6 rounded-3xl bg-white/90 border border-pink-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-pink-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#635882] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-[#26152b]">
                Recent Security Activity
              </h4>
              <p className="text-xs text-[#877276]">
                Audit trail of sign-ins, 2FA verifications, password changes, and unusual login alerts.
              </p>
            </div>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-xs text-[#877276] py-3">
            No security events recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-pink-100 max-h-72 overflow-y-auto pr-1">
            {events.slice(0, 15).map(ev => (
              <div key={ev.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {ev.isSuspicious ? (
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#877276] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#26152b]">
                        {ev.description}
                      </span>
                      {ev.isSuspicious && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                          Unusual Activity
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#877276] mt-0.5">
                      {ev.deviceInfo} • IP {ev.ipMasked}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-[#877276] shrink-0">
                  {new Date(ev.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
