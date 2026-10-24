import React, { useState } from 'react';
import { 
  X, Sparkles, User as UserIcon, Mail, Lock, Check, 
  BookOpen, Feather, Eye, EyeOff, Shield, ArrowRight, Palette,
  KeyRound, Smartphone, ArrowLeft, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { KairoLogo } from './KairoLogo';
import { ImageUploader } from './ImageUploader';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  initialRole?: 'USER' | 'WRITER';
  onAdminLogin?: () => void;
}

const AVATAR_PRESETS = [
  { label: 'Anime Protagonist', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
  { label: 'Knight of Light', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
  { label: 'Cosmic Scholar', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80' },
  { label: 'Cyber Rebel', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80' },
  { label: 'Ethereal Mage', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80' },
  { label: 'Mystic Scribe', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80' },
];

type ModalView = 'login' | 'signup' | 'mfa_challenge' | 'forgot_password' | 'reset_token';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login',
  initialRole = 'USER',
}) => {
  const { login, signup, completeMfaLogin, recoverPassword, clearMfaChallenge } = useAuth();
  const [view, setView] = useState<ModalView>(initialMode === 'signup' ? 'signup' : 'login');
  const [role, setRole] = useState<'USER' | 'WRITER'>(initialRole);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Fantasy', 'Anime-Inspired', 'Light Novel']);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'creds' | 'profile'>('creds');

  // MFA Challenge state (PASSWORD_VERIFIED -> FULLY_AUTHENTICATED)
  const [mfaChallengeToken, setMfaChallengeToken] = useState('');
  const [mfaMaskedEmail, setMfaMaskedEmail] = useState('');
  const [mfaMethod, setMfaMethod] = useState<'totp' | 'recovery_code'>('totp');
  const [mfaCode, setMfaCode] = useState('');

  // Password Reset state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  if (!isOpen) return null;

  const isSignUp = view === 'signup';

  const genresList = [
    'Fantasy', 'Sci-Fi', 'Light Novel', 'Romance', 'Dark Fantasy', 
    'Anime-Inspired', 'Cyberpunk', 'Mystery', 'Action', 'Isekai', 'Supernatural'
  ];

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter(g => g !== genre));
      }
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccessNotice('');
    setMfaCode('');
    setMfaChallengeToken('');
    clearMfaChallenge();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    if (isSignUp && step === 'creds') {
      if (!username.trim() || !email.trim() || !password) {
        setError('Please fill in username, email, and password.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long for account security.');
        return;
      }
      setStep('profile');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signup({
          username: username.trim().toLowerCase().replace(/\s+/g, '_'),
          email: email.trim().toLowerCase(),
          password,
          displayName: displayName.trim() || username.trim(),
          role,
          bio: bio.trim() || (role === 'WRITER' ? 'Author and worldbuilder crafting light novels on KAIRO.' : 'Story enthusiast and reader on KAIRO.'),
          avatar: selectedAvatar,
          favoriteGenres: selectedGenres,
        });
        sessionStorage.setItem('kairo_just_registered', 'true');
        handleClose();
      } else {
        sessionStorage.removeItem('kairo_just_registered');
        const loginRes = await login(username.trim() || email.trim(), password);
        if (loginRes && loginRes.mfaRequired) {
          // Transition to Two-Factor Authentication verification step (PASSWORD_VERIFIED)
          setMfaChallengeToken(loginRes.mfaChallengeToken);
          setMfaMaskedEmail(loginRes.maskedEmail || '');
          setMfaMethod('totp');
          setMfaCode('');
          setView('mfa_challenge');
          return;
        }
        handleClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!mfaCode.trim()) {
      setError(mfaMethod === 'totp' ? 'Please enter your 6-digit authenticator code.' : 'Please enter your one-time recovery code.');
      return;
    }

    setLoading(true);
    try {
      await completeMfaLogin(mfaChallengeToken, mfaCode.trim(), mfaMethod);
      handleClose();
    } catch (err: any) {
      if (err?.data?.mfaChallengeToken) {
        setMfaChallengeToken(err.data.mfaChallengeToken);
      }
      if (err?.code === 'MFA_CHALLENGE_EXPIRED') {
        setView('login');
        setPassword('');
      }
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');
    if (!resetIdentifier.trim()) {
      setError('Please enter your email address or username.');
      return;
    }

    setLoading(true);
    try {
      const res = await recoverPassword(resetIdentifier.trim());
      setSuccessNotice(res.message || "If an account exists for that address, you'll receive recovery instructions.");
    } catch (err: any) {
      setError(err.message || 'Unable to process recovery request right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');
    if (!resetTokenInput.trim() || !resetNewPassword) {
      setError('Please enter both your reset token and your new password.');
      return;
    }
    if (resetNewPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.confirmPasswordReset({
        token: resetTokenInput.trim(),
        newPassword: resetNewPassword,
      });
      setSuccessNotice(res.message || 'Password reset complete. You can now sign in with your new password.');
      setResetTokenInput('');
      setResetNewPassword('');
      setTimeout(() => {
        setView('login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired reset token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#26152b]/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-pink-200/90 relative max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="auth-modal-close-btn"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#544246] hover:bg-pink-100/70 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <KairoLogo size="md" layout="icon-only" />
          </div>
          <h2 className="text-2xl font-black font-display text-[#26152b]">
            {view === 'mfa_challenge'
              ? 'Two-Factor Authentication'
              : view === 'forgot_password' || view === 'reset_token'
              ? 'Account Recovery'
              : isSignUp 
              ? (step === 'creds' ? 'Join KAIRO' : (role === 'WRITER' ? 'Set Up Your Author Profile' : 'Personalize Reading Realm')) 
              : 'Welcome Back to KAIRO'}
          </h2>
          <p className="text-xs sm:text-sm text-[#877276] mt-1 max-w-sm mx-auto">
            {view === 'mfa_challenge'
              ? 'Your password was verified. Complete two-factor verification to establish your authenticated session.'
              : view === 'forgot_password' || view === 'reset_token'
              ? 'Request a secure single-use password reset or verify an existing recovery token.'
              : isSignUp 
              ? (step === 'creds' 
                  ? 'Sign up as a Reader or Writer to experience serialized stories and interactive lore.' 
                  : 'Customize your pen name, avatar, and genre tastes.') 
              : 'Sign in to access your reading progress, personalized library, and fandom discussions.'}
          </p>
        </div>

        {/* Mode Selector Tabs (only on primary Sign In / Sign Up views) */}
        {(view === 'login' || view === 'signup') && (
          <div className="flex bg-pink-100/60 p-1 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => { setView('login'); setStep('creds'); setError(''); setSuccessNotice(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                view === 'login' 
                  ? 'bg-white text-[#9e3b5f] shadow-xs' 
                  : 'text-[#544246] hover:text-[#26152b]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setView('signup'); setStep('creds'); setError(''); setSuccessNotice(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                view === 'signup' 
                  ? 'bg-white text-[#9e3b5f] shadow-xs' 
                  : 'text-[#544246] hover:text-[#26152b]'
              }`}
            >
              Create New Account
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3.5 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* VIEW 1: MFA LOGIN CHALLENGE (PASSWORD_VERIFIED -> FULLY_AUTHENTICATED) */}
        {view === 'mfa_challenge' && (
          <form onSubmit={handleMfaVerify} className="space-y-4 animate-in fade-in duration-150">
            <div className="p-3.5 rounded-2xl bg-purple-50/90 border border-purple-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#635882] text-white flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#26152b]">Step 2 of 2: Verify Identity</div>
                  <div className="text-[11px] text-[#544246]">
                    {mfaMaskedEmail ? `Account: ${mfaMaskedEmail}` : 'Protected with TOTP Two-Factor Authentication'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                2FA Required
              </span>
            </div>

            {/* Method Toggle */}
            <div className="flex bg-pink-100/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setMfaMethod('totp'); setMfaCode(''); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mfaMethod === 'totp'
                    ? 'bg-white text-[#9e3b5f] shadow-xs'
                    : 'text-[#544246] hover:text-[#26152b]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Authenticator App</span>
              </button>
              <button
                type="button"
                onClick={() => { setMfaMethod('recovery_code'); setMfaCode(''); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mfaMethod === 'recovery_code'
                    ? 'bg-white text-[#9e3b5f] shadow-xs'
                    : 'text-[#544246] hover:text-[#26152b]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Recovery Code</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
                {mfaMethod === 'totp' ? '6-Digit Authenticator Code' : 'One-Time Recovery Code'}
              </label>
              <input
                type="text"
                inputMode={mfaMethod === 'totp' ? 'numeric' : 'text'}
                autoComplete="one-time-code"
                autoFocus
                required
                maxLength={mfaMethod === 'totp' ? 8 : 16}
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value)}
                placeholder={mfaMethod === 'totp' ? '000000' : 'XXXX-XXXX-XX'}
                className="w-full h-12 px-4 rounded-xl bg-white border border-pink-200/90 focus:border-[#9e3b5f] focus:ring-2 focus:ring-pink-200/50 outline-none text-center font-mono text-lg tracking-widest text-[#26152b] transition-all"
              />
              <p className="text-[11px] text-[#877276] mt-1.5 text-center">
                {mfaMethod === 'totp'
                  ? 'Open Google Authenticator, Microsoft Authenticator, Authy, 1Password, or Bitwarden to view your 6-digit code.'
                  : 'Enter one of the unused 10-character recovery codes saved when you enabled 2FA.'}
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setMfaChallengeToken('');
                  setMfaCode('');
                  setError('');
                }}
                className="w-1/3 h-11 bg-white border border-pink-200 rounded-xl font-semibold text-xs text-[#544246] hover:bg-pink-50 cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 h-11 btn-gradient rounded-xl font-bold text-sm cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: FORGOT PASSWORD / ACCOUNT RECOVERY */}
        {(view === 'forgot_password' || view === 'reset_token') && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex bg-pink-100/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setView('forgot_password'); setError(''); setSuccessNotice(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  view === 'forgot_password'
                    ? 'bg-white text-[#9e3b5f] shadow-xs'
                    : 'text-[#544246] hover:text-[#26152b]'
                }`}
              >
                Request Reset Link
              </button>
              <button
                type="button"
                onClick={() => { setView('reset_token'); setError(''); setSuccessNotice(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  view === 'reset_token'
                    ? 'bg-white text-[#9e3b5f] shadow-xs'
                    : 'text-[#544246] hover:text-[#26152b]'
                }`}
              >
                Enter Reset Token
              </button>
            </div>

            {view === 'forgot_password' ? (
              <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
                    Account Email or Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#877276] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={resetIdentifier}
                      onChange={e => setResetIdentifier(e.target.value)}
                      placeholder="you@domain.com or username"
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/90 border border-pink-200/80 focus:border-[#9e3b5f] focus:ring-2 focus:ring-pink-200/50 outline-none text-sm text-[#26152b] transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-[#877276] mt-1.5">
                    For security, we never disclose whether an email or username is registered. Recovery tokens expire after 30 minutes.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(''); setSuccessNotice(''); }}
                    className="w-1/3 h-11 bg-white border border-pink-200 rounded-xl font-semibold text-xs text-[#544246] hover:bg-pink-50 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 h-11 btn-gradient rounded-xl font-bold text-sm cursor-pointer shadow-md hover:shadow-lg transition-all"
                  >
                    {loading ? 'Sending...' : 'Send Recovery Instructions'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
                    Single-Use Recovery Token
                  </label>
                  <input
                    type="text"
                    required
                    value={resetTokenInput}
                    onChange={e => setResetTokenInput(e.target.value)}
                    placeholder="Paste your recovery token"
                    className="w-full h-10 px-3.5 rounded-xl bg-white/90 border border-pink-200/80 focus:border-[#9e3b5f] outline-none text-xs font-mono text-[#26152b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
                    New Password (Min. 8 Characters)
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={resetNewPassword}
                    onChange={e => setResetNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 px-3.5 rounded-xl bg-white/90 border border-pink-200/80 focus:border-[#9e3b5f] outline-none text-sm text-[#26152b]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(''); setSuccessNotice(''); }}
                    className="w-1/3 h-11 bg-white border border-pink-200 rounded-xl font-semibold text-xs text-[#544246] hover:bg-pink-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 h-11 btn-gradient rounded-xl font-bold text-sm cursor-pointer shadow-md hover:shadow-lg transition-all"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* VIEW 3: PRIMARY SIGN IN / SIGN UP FORM */}
        {(view === 'login' || view === 'signup') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Sign Up: Step 1 Role Selection */}
            {isSignUp && step === 'creds' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-2">
                  I am joining KAIRO as a:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('USER')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      role === 'USER'
                        ? 'bg-pink-50/80 border-[#9e3b5f] ring-2 ring-pink-200 shadow-xs'
                        : 'bg-white/70 border-pink-200/80 hover:bg-white text-[#544246]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center text-[#9e3b5f]">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      {role === 'USER' && <Check className="w-4 h-4 text-[#9e3b5f]" />}
                    </div>
                    <div className="font-bold text-xs text-[#26152b]">Reader & Explorer</div>
                    <div className="text-[11px] text-[#877276] mt-0.5 leading-tight">
                      Read novels, follow universes, craft theories.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('WRITER')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      role === 'WRITER'
                        ? 'bg-purple-50/90 border-[#635882] ring-2 ring-purple-200 shadow-xs'
                        : 'bg-white/70 border-pink-200/80 hover:bg-white text-[#544246]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-[#635882]">
                        <Feather className="w-4 h-4" />
                      </div>
                      {role === 'WRITER' && <Check className="w-4 h-4 text-[#635882]" />}
                    </div>
                    <div className="font-bold text-xs text-[#26152b]">Writer & Creator</div>
                    <div className="text-[11px] text-[#877276] mt-0.5 leading-tight">
                      Publish serials, worldbuild lore & characters.
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Credentials Step (Sign in or Sign up Step 1) */}
            {(!isSignUp || step === 'creds') && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
                    {isSignUp ? 'Username' : 'Username or Email'}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#877276] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder={isSignUp ? (role === 'WRITER' ? 'e.g. archon_scribe' : 'e.g. star_wanderer') : 'Username or email'}
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/90 border border-pink-200/80 focus:border-[#9e3b5f] focus:ring-2 focus:ring-pink-200/50 outline-none text-sm text-[#26152b] transition-all"
                    />
                  </div>
                </div>

                {isSignUp && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
                        {role === 'WRITER' ? 'Pen Name / Display Name' : 'Display Name'}
                      </label>
                      <div className="relative">
                        <Sparkles className="w-4 h-4 text-[#877276] absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          placeholder={role === 'WRITER' ? 'e.g. Cynthia Vance' : 'e.g. Starlight Dreamer'}
                          className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/90 border border-pink-200/80 focus:border-[#9e3b5f] focus:ring-2 focus:ring-pink-200/50 outline-none text-sm text-[#26152b] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#877276] absolute left-3.5 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@domain.com"
                          className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/90 border border-pink-200/80 focus:border-[#9e3b5f] focus:ring-2 focus:ring-pink-200/50 outline-none text-sm text-[#26152b] transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#544246]">
                      {isSignUp ? 'Password (Min. 8 Characters)' : 'Password'}
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => { setView('forgot_password'); setError(''); setSuccessNotice(''); }}
                        className="text-[11px] font-bold text-[#9e3b5f] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#877276] absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 pl-10 pr-10 rounded-xl bg-white/90 border border-pink-200/80 focus:border-[#9e3b5f] focus:ring-2 focus:ring-pink-200/50 outline-none text-sm text-[#26152b] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#877276] hover:text-[#26152b] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 btn-gradient rounded-xl font-bold text-sm mt-2 cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? 'Processing...' : isSignUp ? (
                    <>
                      <span>Continue to Profile Setup</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </>
            )}

            {/* Sign Up: Step 2 Profile Personalization */}
            {isSignUp && step === 'profile' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                
                {/* Avatar Selector */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[#9e3b5f]" />
                      <span>Set Profile Avatar</span>
                    </span>
                    <span className="text-[10px] text-[#9e3b5f] font-semibold lowercase">
                      upload or pick preset
                    </span>
                  </label>

                  {/* Upload from Gallery / Internal Storage */}
                  <ImageUploader
                    id="auth-signup-avatar-upload"
                    value={selectedAvatar}
                    onChange={(url) => setSelectedAvatar(url)}
                    avatarMode={true}
                    allowUrlFallback={false}
                    helperText="Upload your avatar directly from gallery or storage"
                  />

                  {/* Quick Presets */}
                  <div>
                    <span className="block text-[10px] font-bold text-[#877276] uppercase tracking-wider mb-1.5">
                      Or select a character preset:
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {AVATAR_PRESETS.map((preset, idx) => {
                        const isSelected = selectedAvatar === preset.url;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedAvatar(preset.url)}
                            title={preset.label}
                            className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                              isSelected ? 'border-[#9e3b5f] scale-105 shadow-md ring-2 ring-pink-200' : 'border-pink-200 hover:border-pink-300 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#9e3b5f]/30 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white drop-shadow" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bio / Pen Tagline */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
                    {role === 'WRITER' ? 'Author Bio & Writing Style' : 'Reader Bio'}
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder={role === 'WRITER' ? 'e.g. Crafting high-fantasy light novels with intricate magic systems and character arcs.' : 'e.g. Avid binge reader of dark fantasy, anime adaptations, and cosmic lore.'}
                    className="w-full p-2.5 rounded-xl bg-white/90 border border-pink-200/80 focus:border-[#9e3b5f] focus:ring-2 focus:ring-pink-200/50 outline-none text-xs text-[#26152b] transition-all resize-none"
                  />
                </div>

                {/* Genres */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-2 flex items-center justify-between">
                    <span>{role === 'WRITER' ? 'Primary Writing Genres' : 'Favorite Reading Genres'}</span>
                    <span className="text-[10px] text-[#877276]">Select multiple</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {genresList.map(genre => {
                      const active = selectedGenres.includes(genre);
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => toggleGenre(genre)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                            active
                              ? 'bg-[#9e3b5f] text-white shadow-xs'
                              : 'bg-white/80 border border-pink-200/80 text-[#544246] hover:bg-white'
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          <span>{genre}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('creds')}
                    className="w-1/3 h-11 bg-white border border-pink-200 rounded-xl font-semibold text-xs text-[#544246] hover:bg-pink-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 h-11 btn-gradient rounded-xl font-bold text-sm cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? 'Creating account...' : `Complete & Enter as ${role === 'WRITER' ? 'Writer' : 'Reader'}`}
                  </button>
                </div>

              </div>
            )}

          </form>
        )}

      </div>
    </div>
  );
};
