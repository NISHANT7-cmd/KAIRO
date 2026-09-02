import React, { useState } from 'react';
import { 
  X, Sparkles, User as UserIcon, Mail, Lock, Check, 
  BookOpen, Feather, Eye, EyeOff, Shield, ArrowRight, Palette, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login',
  initialRole = 'USER',
  onAdminLogin
}) => {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
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
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'creds' | 'profile'>('creds');

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp && step === 'creds') {
      if (!username.trim() || !email.trim() || !password) {
        setError('Please fill in username, email, and password.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
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
      } else {
        await login(username.trim() || email.trim(), password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickUsername: string, pass: string) => {
    setError('');
    setLoading(true);
    try {
      await login(quickUsername, pass);
      if (quickUsername === 'admin' && onAdminLogin) {
        onAdminLogin();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
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
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#544246] hover:bg-pink-100/70 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9e3b5f] to-[#f47fa5] flex items-center justify-center text-white mx-auto shadow-md shadow-pink-900/20 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black font-display text-[#26152b]">
            {isSignUp 
              ? (step === 'creds' ? 'Join KAIRO' : (role === 'WRITER' ? 'Set Up Your Author Profile' : 'Personalize Reading Realm')) 
              : 'Welcome Back to KAIRO'}
          </h2>
          <p className="text-xs sm:text-sm text-[#877276] mt-1 max-w-sm mx-auto">
            {isSignUp 
              ? (step === 'creds' 
                  ? 'Sign up as a Reader or Writer to experience serialized stories and interactive lore.' 
                  : 'Customize your pen name, avatar, and genre tastes.') 
              : 'Sign in to access your reading progress, creator studio, and fandom discussions.'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-pink-100/60 p-1 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setStep('creds'); setError(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isSignUp 
                ? 'bg-white text-[#9e3b5f] shadow-xs' 
                : 'text-[#544246] hover:text-[#26152b]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setStep('creds'); setError(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isSignUp 
                ? 'bg-white text-[#9e3b5f] shadow-xs' 
                : 'text-[#544246] hover:text-[#26152b]'
            }`}
          >
            Create New Account
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1.5">
                  Password
                </label>
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
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#9e3b5f]" />
                  <span>Choose Your Avatar</span>
                </label>
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

        {/* Fast Instant Demo Test Accounts */}
        {!isSignUp && (
          <div className="mt-6 pt-5 border-t border-pink-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#877276]">
                Instant Quick-Login Accounts:
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('sakura_dreamer', 'password123')}
                className="p-2 rounded-xl bg-pink-50/70 hover:bg-pink-100/80 border border-pink-200/60 text-left transition-colors cursor-pointer flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-[#9e3b5f] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-[11px] text-[#26152b] truncate">Sakura Dreamer</div>
                  <div className="text-[9px] text-[#877276]">Reader Persona</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('althea_v', 'password123')}
                className="p-2 rounded-xl bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/60 text-left transition-colors cursor-pointer flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-[#635882] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  <Feather className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-[11px] text-[#26152b] truncate">Althea Vance</div>
                  <div className="text-[9px] text-[#877276]">Writer Persona</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('voidknight', 'password123')}
                className="p-2 rounded-xl bg-pink-50/70 hover:bg-pink-100/80 border border-pink-200/60 text-left transition-colors cursor-pointer flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-[#544246] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-[11px] text-[#26152b] truncate">Void Knight</div>
                  <div className="text-[9px] text-[#877276]">Writer Persona</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-300 text-left transition-colors cursor-pointer flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="font-black text-[11px] text-[#26152b] truncate flex items-center gap-1">
                    <span>Master Admin</span>
                    <span className="text-[8px] bg-amber-500 text-white px-1 py-0.2 rounded">PORTAL</span>
                  </div>
                  <div className="text-[9px] text-amber-800 font-medium">admin / admin123</div>
                </div>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
