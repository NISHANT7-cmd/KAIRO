import React, { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, Flame, BookOpen, Feather, Sparkles, 
  LogOut, Edit, Shield, ArrowRight, Compass, Share2, Check, 
  UserPlus, UserCheck, Star, Heart, MessageSquare, Globe, 
  Award, Trophy, Eye, Clock, Calendar, Bookmark, Hash, 
  ChevronRight, ArrowLeft, ExternalLink, ThumbsUp, Camera, Loader2, Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Story, PublicUserProfile, User } from '../types';
import { ImageUploader } from './ImageUploader';
import { FALLBACK_USERS, FALLBACK_STORIES, FALLBACK_UNIVERSES } from '../services/fallbackData';

interface ProfileViewProps {
  userIdOrUsername?: string | any;
  initialTab?: string;
  onOpenStory: (storySlug: string) => void;
  onOpenStudio?: () => void;
  onOpenAdmin?: () => void;
  onOpenUniverse?: (universeSlug: string) => void;
  onOpenCommunity?: (communitySlug: string) => void;
  onNavigate?: (view: string, data?: any) => void;
  onBack?: () => void;
  onOpenTasteSettings?: () => void;
  onOpenOnboarding?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  userIdOrUsername,
  initialTab,
  onOpenStory, 
  onOpenStudio,
  onOpenAdmin,
  onOpenUniverse,
  onOpenCommunity,
  onNavigate,
  onBack,
  onOpenTasteSettings,
  onOpenOnboarding,
}) => {
  const { user: currentUser, logout, updateProfile, openAuthModal } = useAuth();
  const { currentLanguage, setLanguage, supportedLanguages, t } = useLanguage();
  
  const [profileData, setProfileData] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stories' | 'posts' | 'universes' | 'theories' | 'shelf' | 'awards' | 'about' | 'taste'>('stories');
  const [tasteProfileData, setTasteProfileData] = useState<{ profile: any; storyDna: any } | null>(null);
  const [loadingTaste, setLoadingTaste] = useState(false);
  
  // Follow action state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingLoading, setFollowingLoading] = useState(false);
  
  // Share notification
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Profile edit state for owner
  const [isEditing, setIsEditing] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [avatarInput, setAvatarInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [quickAvatarUploading, setQuickAvatarUploading] = useState(false);
  const avatarDirectInputRef = useRef<HTMLInputElement>(null);

  const handleDirectAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setEditError('Please select a valid image file');
      return;
    }
    setQuickAvatarUploading(true);
    setEditError(null);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (!result) {
          setQuickAvatarUploading(false);
          return;
        }
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 500;
            let { width, height } = img;
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            const dataUrl = ctx ? canvas.toDataURL('image/jpeg', 0.88) : result;
            if (ctx) ctx.drawImage(img, 0, 0, width, height);
            
            await updateProfile({ avatar: dataUrl });
            if (profileData) {
              setProfileData({
                ...profileData,
                user: { ...profileData.user, avatar: dataUrl }
              });
            }
          } catch (err: any) {
            setEditError(err.message || 'Failed to update avatar');
          } finally {
            setQuickAvatarUploading(false);
          }
        };
        img.onerror = () => {
          setQuickAvatarUploading(false);
          setEditError('Could not decode selected image file');
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setEditError(err.message || 'Error processing avatar');
      setQuickAvatarUploading(false);
    }
    if (avatarDirectInputRef.current) {
      avatarDirectInputRef.current.value = '';
    }
  };

  // Target identifier: safely sanitize input string or object
  let resolvedTarget = '';
  let requestedTab: string | undefined = initialTab;

  if (typeof userIdOrUsername === 'string') {
    if (userIdOrUsername && userIdOrUsername !== '[object Object]' && userIdOrUsername !== 'undefined' && userIdOrUsername !== 'null') {
      resolvedTarget = userIdOrUsername.trim();
    }
  } else if (typeof userIdOrUsername === 'object' && userIdOrUsername !== null) {
    resolvedTarget = (userIdOrUsername.username || userIdOrUsername.userId || userIdOrUsername.id || '').trim();
    if (userIdOrUsername.tab) {
      requestedTab = userIdOrUsername.tab;
    }
  }

  // Target identifier: if none provided, look up current user
  const targetId = resolvedTarget || currentUser?.username || currentUser?.id || 'me';

  useEffect(() => {
    loadProfile();
  }, [targetId, currentUser?.id]);

  useEffect(() => {
    if (requestedTab) {
      const validTabs = ['stories', 'posts', 'universes', 'theories', 'shelf', 'awards', 'about', 'taste'];
      if (validTabs.includes(requestedTab)) {
        setActiveTab(requestedTab as any);
      } else if (requestedTab === 'journey') {
        setActiveTab('about');
      }
    }
  }, [requestedTab]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // Determine what to pass to API
      let queryTarget = targetId;
      if (!queryTarget || queryTarget === 'me') {
        if (!currentUser) {
          setError('Please sign in to view your profile.');
          setLoading(false);
          return;
        }
        queryTarget = currentUser.username || currentUser.id;
      }

      const data = await api.getUserProfile(queryTarget);
      setProfileData(data);
      setIsFollowing(data.isFollowing);
      setFollowersCount(data.stats.followersCount);
      
      // Initialize edit inputs
      setDisplayNameInput(data.user.displayName || data.user.username);
      setBioInput(data.user.bio || '');
      setAvatarInput(data.user.avatar || '');
      setEditError(null);

      // Set initial tab appropriately if not explicitly requested
      if (requestedTab) {
        const validTabs = ['stories', 'posts', 'universes', 'theories', 'shelf', 'awards', 'about', 'taste'];
        if (validTabs.includes(requestedTab)) {
          setActiveTab(requestedTab as any);
        } else if (requestedTab === 'journey') {
          setActiveTab('about');
        }
      } else if (data.stories.length === 0) {
        if (data.readingList.length > 0) {
          setActiveTab('shelf');
        } else if (data.posts.length > 0) {
          setActiveTab('posts');
        } else {
          setActiveTab('about');
        }
      } else {
        setActiveTab('stories');
      }
    } catch (err: any) {
      console.warn('[ProfileView] Unable to load profile directly, checking fallback/offline recovery:', err?.message || err);
      
      // If error occurred for current user, recover gracefully with their authenticated state
      if (currentUser && (targetId === 'me' || targetId === currentUser.username || targetId === currentUser.id)) {
        setProfileData({
          user: currentUser,
          isFollowing: false,
          isSelf: true,
          stories: [],
          posts: [],
          universes: [],
          theories: [],
          readingList: [],
          certificates: [],
          badges: currentUser.role === 'ADMIN' ? ['Platform Admin'] : currentUser.role === 'WRITER' ? ['Verified Author'] : ['Explorer'],
          stats: {
            totalStories: 0,
            totalReads: currentUser.totalReads || 0,
            totalLikes: 0,
            totalPosts: 0,
            totalTheories: 0,
            totalUniverses: 0,
            followersCount: currentUser.followersCount || 0,
            followingCount: currentUser.followingCount || 0,
            chaptersCount: 0,
          }
        });
        setError(null);
      } else {
        // Check if requested user exists in fallback users
        const targetClean = (targetId || '').toLowerCase().replace(/^@/, '');
        const fallbackUser = FALLBACK_USERS.find(
          u => u.username.toLowerCase() === targetClean || u.id.toLowerCase() === targetClean
        );

        if (fallbackUser) {
          const userStories = FALLBACK_STORIES.filter(s => s.authorId === fallbackUser.id || s.authorUsername.toLowerCase() === fallbackUser.username.toLowerCase());
          const userUniverses = FALLBACK_UNIVERSES.filter(u => u.authorId === fallbackUser.id);
          setProfileData({
            user: fallbackUser,
            isFollowing: false,
            isSelf: Boolean(currentUser && currentUser.id === fallbackUser.id),
            stories: userStories,
            posts: [],
            universes: userUniverses,
            theories: [],
            readingList: [],
            certificates: [],
            badges: fallbackUser.role === 'ADMIN' ? ['Platform Admin'] : fallbackUser.role === 'WRITER' ? ['Verified Author'] : ['Explorer'],
            stats: {
              totalStories: userStories.length,
              totalReads: fallbackUser.totalReads || 0,
              totalLikes: userStories.reduce((sum, s) => sum + (s.likes || 0), 0),
              totalPosts: 0,
              totalTheories: 0,
              totalUniverses: userUniverses.length,
              followersCount: fallbackUser.followersCount || 0,
              followingCount: fallbackUser.followingCount || 0,
              chaptersCount: userStories.reduce((sum, s) => sum + (s.chaptersCount || 0), 0),
            }
          });
          setError(null);
        } else {
          const isNetErr = (err?.message || '').toLowerCase().includes('network') || (err?.message || '').toLowerCase().includes('fetch');
          setError(isNetErr ? 'Unable to connect to the server. Please check your network connection.' : (err?.message || 'User profile not found.'));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      openAuthModal?.();
      return;
    }
    if (!profileData) return;
    
    setFollowingLoading(true);
    try {
      const res = await api.toggleFollow(profileData.user.id);
      setIsFollowing(res.following);
      setFollowersCount(res.totalFollowers);
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleShareProfile = () => {
    if (!profileData) return;
    const url = `${window.location.origin}/#profile/${profileData.user.username}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }).catch(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      });
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData) return;
    setSavingProfile(true);
    setEditError(null);
    try {
      const updates: Partial<User> = {
        displayName: displayNameInput.trim() || profileData.user.displayName,
        bio: bioInput.trim(),
        avatar: avatarInput.trim() || profileData.user.avatar
      };
      const res = await api.updateProfile(updates);
      if (res.user) {
        setProfileData(prev => prev ? { ...prev, user: { ...prev.user, ...res.user } } : null);
      }
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center mx-auto text-[#9e3b5f] animate-pulse">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <p className="font-bold text-sm text-[#877276]">Loading explorer profile...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-pink-100 text-[#9e3b5f] flex items-center justify-center mx-auto shadow-inner">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black font-display text-[#26152b]">User Profile Unavailable</h2>
        <p className="text-sm text-[#877276] max-w-md mx-auto">{error || 'This user does not exist or has been relocated.'}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => loadProfile()}
            className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Try Again
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl bg-white border border-pink-200 text-xs font-bold text-[#544246] hover:bg-pink-50 transition-colors cursor-pointer"
            >
              Go Back
            </button>
          )}
          {onNavigate && (
            <button
              onClick={() => onNavigate('home')}
              className="px-5 py-2.5 rounded-xl bg-pink-50 border border-pink-100 text-xs font-bold text-[#9e3b5f] hover:bg-pink-100 transition-colors cursor-pointer"
            >
              Explore Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const { user, isSelf, stories, posts, universes, theories, readingList, certificates, badges, stats } = profileData;
  const userAvatar = user.avatar || user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-10 space-y-4 sm:space-y-6 pb-24 sm:pb-28">
      
      {/* Top Breadcrumb / Back button */}
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-[#877276] hover:text-[#9e3b5f] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#877276]">
            <span>Profile Codex</span>
            <span>•</span>
            <span className="text-[#9e3b5f] font-bold">@{user.username}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {copiedLink && (
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Link copied!</span>
            </span>
          )}
          <button
            onClick={handleShareProfile}
            className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-xs font-bold text-[#544246] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            title="Share Profile Link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Admin Quick Jump Banner (If user is viewing their own profile and is ADMIN) */}
      {isSelf && user.role === 'ADMIN' && onOpenAdmin && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-white">Master Admin Privileges Active</div>
              <div className="text-[11px] sm:text-xs text-amber-100">You have full authority to administer platform operations, verify writers, inspect analytics, and manage competitions.</div>
            </div>
          </div>
          <button
            onClick={onOpenAdmin}
            className="w-full sm:w-auto px-3.5 py-1.5 sm:py-2 rounded-xl bg-white text-amber-900 hover:bg-amber-50 text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Open Master Admin Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Instagram-Grade Aesthetic Profile Header Card */}
      <div className="glass-card rounded-2xl sm:rounded-3xl border border-pink-200/90 shadow-sm relative overflow-hidden bg-white/95">
        
        {/* Atmospheric Header Banner */}
        <div className="h-28 sm:h-44 w-full bg-gradient-to-r from-pink-400/30 via-purple-400/25 to-indigo-500/30 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#9e3b5f_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center gap-2">
            <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1 sm:gap-1.5">
              <Sparkles className="w-3 h-3 text-pink-300" />
              <span>Astral Level {user.level || 1}</span>
            </span>
          </div>
        </div>

        {/* Profile Details Container */}
        <div className="px-4 sm:px-10 pb-5 sm:pb-8 -mt-12 sm:-mt-20 relative z-10 space-y-3.5 sm:space-y-6">
          
          {/* Top Row: Avatar + Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 sm:gap-4">
            
            {/* Avatar with Halo Ring & Direct Gallery/Storage Upload */}
            <div className="relative group">
              <div className="p-1 rounded-2xl sm:rounded-4xl bg-white shadow-lg ring-3 sm:ring-4 ring-pink-200/80 relative overflow-hidden">
                <img
                  src={userAvatar}
                  alt={user.displayName}
                  className="w-20 h-20 sm:w-32 sm:h-32 rounded-xl sm:rounded-3xl object-cover"
                />

                {/* Direct Upload from Gallery/Storage Button for Profile Owner */}
                {isSelf && (
                  <>
                    <button
                      type="button"
                      id="profile-avatar-direct-btn"
                      onClick={() => avatarDirectInputRef.current?.click()}
                      disabled={quickAvatarUploading}
                      className="absolute inset-1 rounded-xl sm:rounded-3xl bg-black/50 hover:bg-black/65 text-white flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer backdrop-blur-2xs"
                      title="Upload avatar photo from your gallery or internal storage"
                    >
                      {quickAvatarUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-pink-300" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-pink-200 drop-shadow" />
                          <span className="text-[9px] font-bold tracking-wide">Upload Photo</span>
                        </>
                      )}
                    </button>
                    <input
                      ref={avatarDirectInputRef}
                      id="profile-avatar-direct-input"
                      type="file"
                      accept="image/*"
                      onChange={handleDirectAvatarUpload}
                      className="hidden"
                    />
                  </>
                )}
              </div>
              
              {user.isVerifiedWriter && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-purple-600 to-[#9e3b5f] text-white flex items-center justify-center shadow-md ring-2 ring-white z-10" title="Verified Author">
                  <Feather className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              )}
            </div>

            {/* Action Buttons (Follow, Edit, Studio, Signout) */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {!isSelf ? (
                <>
                  <button
                    id="profile-follow-btn"
                    onClick={handleToggleFollow}
                    disabled={followingLoading}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-xs ${
                      isFollowing
                        ? 'bg-purple-100 text-[#635882] hover:bg-purple-200 border border-purple-200'
                        : 'btn-gradient'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Follow Author</span>
                      </>
                    )}
                  </button>

                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('community')}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white hover:bg-pink-50 border border-pink-200 text-xs font-bold text-[#544246] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#9e3b5f]" />
                      <span>Fandom</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white hover:bg-pink-50 border border-pink-200 text-xs font-bold text-[#544246] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#9e3b5f]" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    id="profile-tune-taste-btn"
                    onClick={() => {
                      if (onOpenTasteSettings) {
                        onOpenTasteSettings();
                      } else {
                        setActiveTab('taste');
                      }
                    }}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#fee7ff]/80 hover:bg-[#fee7ff] border border-pink-300/80 text-xs font-bold text-[#9e3b5f] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#9e3b5f]" />
                    <span>Tune Taste</span>
                  </button>

                  {(user.role === 'WRITER' || user.role === 'ADMIN') && onOpenStudio && (
                    <button
                      onClick={onOpenStudio}
                      className="btn-gradient px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Feather className="w-3.5 h-3.5" />
                      <span>Creator Studio</span>
                    </button>
                  )}

                  <button
                    onClick={logout}
                    className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 cursor-pointer transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Names, Bio, and Role */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-3xl font-black font-display text-[#26152b] tracking-tight">
                {user.displayName}
              </h1>
              
              <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                user.role === 'ADMIN' 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : user.role === 'WRITER' 
                  ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                  : 'bg-pink-100 text-[#9e3b5f] border border-pink-200'
              }`}>
                {user.role === 'WRITER' ? 'Author' : user.role === 'USER' ? 'Reader' : user.role}
              </span>

              {user.isVerifiedWriter && (
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-[9px] sm:text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                  <Feather className="w-3 h-3 text-purple-600" />
                  <span>Verified Creator</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-[#877276] flex-wrap">
              <span className="font-semibold text-[#544246]">@{user.username}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              </span>
              {user.streakDays !== undefined && user.streakDays > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-orange-600 font-bold">
                    <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-orange-500" />
                    <span>{user.streakDays} Day Streak</span>
                  </span>
                </>
              )}
            </div>

            {/* Bio */}
            <p className="text-[11px] sm:text-sm text-[#544246] leading-relaxed max-w-2xl whitespace-pre-line pt-0.5 sm:pt-1">
              {user.bio || (isSelf ? 'No bio added yet. Click "Edit Profile" to tell readers about your stories or favorite genres.' : 'Storyteller and wanderer in the Astral Universe.')}
            </p>

            {/* Badges Ribbon */}
            {badges && badges.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 sm:pt-2">
                {badges.map(b => (
                  <span 
                    key={b}
                    className="px-2 sm:px-2.5 py-0.5 rounded-full bg-[#fee7ff]/70 text-[#9e3b5f] border border-pink-200/80 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <Award className="w-3 h-3 text-[#9e3b5f]" />
                    <span>{b}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Instagram-Style Stats Counters Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 pt-2.5 sm:pt-4 border-t border-pink-100/90">
            <div className="bg-[#fff9fc] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-pink-100/80 text-center">
              <div className="text-base sm:text-2xl font-black font-display text-[#26152b]">
                {stats.totalStories}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#877276] mt-0.5">
                Stories
              </div>
            </div>

            <div className="bg-[#fff9fc] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-pink-100/80 text-center">
              <div className="text-base sm:text-2xl font-black font-display text-[#9e3b5f]">
                {stats.totalReads > 1000 ? `${(stats.totalReads / 1000).toFixed(1)}k` : stats.totalReads}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#877276] mt-0.5">
                Reads
              </div>
            </div>

            <div className="bg-[#fff9fc] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-pink-100/80 text-center">
              <div className="text-base sm:text-2xl font-black font-display text-[#26152b]">
                {followersCount}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#877276] mt-0.5">
                Followers
              </div>
            </div>

            <div className="bg-[#fff9fc] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-pink-100/80 text-center">
              <div className="text-base sm:text-2xl font-black font-display text-[#26152b]">
                {stats.followingCount}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#877276] mt-0.5">
                Following
              </div>
            </div>

            <div className="bg-[#fff9fc] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-pink-100/80 text-center">
              <div className="text-base sm:text-2xl font-black font-display text-purple-700">
                {stats.totalPosts}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#877276] mt-0.5">
                Posts
              </div>
            </div>

            <div className="bg-[#fff9fc] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-pink-100/80 text-center">
              <div className="text-base sm:text-2xl font-black font-display text-emerald-600">
                {stats.chaptersCount}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#877276] mt-0.5">
                Chapters
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Instagram-Style Tab Navigation Header */}
      <div className="glass-card rounded-2xl p-1.5 border border-pink-100/90 shadow-2xs flex items-center justify-start sm:justify-center gap-1 overflow-x-auto no-scrollbar bg-white/90">
        
        <button
          onClick={() => setActiveTab('stories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'stories'
              ? 'bg-[#9e3b5f] text-white shadow-xs'
              : 'text-[#544246] hover:bg-pink-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Stories ({stories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'posts'
              ? 'bg-[#9e3b5f] text-white shadow-xs'
              : 'text-[#544246] hover:bg-pink-50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Posts & Updates ({posts.length})</span>
        </button>

        {universes.length > 0 && (
          <button
            onClick={() => setActiveTab('universes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'universes'
                ? 'bg-[#9e3b5f] text-white shadow-xs'
                : 'text-[#544246] hover:bg-pink-50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Lore Universes ({universes.length})</span>
          </button>
        )}

        {theories.length > 0 && (
          <button
            onClick={() => setActiveTab('theories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'theories'
                ? 'bg-[#9e3b5f] text-white shadow-xs'
                : 'text-[#544246] hover:bg-pink-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Theories ({theories.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('shelf')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'shelf'
              ? 'bg-[#9e3b5f] text-white shadow-xs'
              : 'text-[#544246] hover:bg-pink-50'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Reading Shelf ({readingList.length})</span>
        </button>

        {certificates.length > 0 && (
          <button
            onClick={() => setActiveTab('awards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'awards'
                ? 'bg-[#9e3b5f] text-white shadow-xs'
                : 'text-[#544246] hover:bg-pink-50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Awards ({certificates.length})</span>
          </button>
        )}

        {isSelf && (
          <button
            onClick={() => {
              setActiveTab('taste');
              if (!tasteProfileData && !loadingTaste) {
                setLoadingTaste(true);
                api.getTasteProfile()
                  .then(res => setTasteProfileData(res))
                  .catch(err => console.error(err))
                  .finally(() => setLoadingTaste(false));
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'taste'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs'
                : 'text-[#544246] hover:bg-pink-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Story DNA & Taste</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'about'
              ? 'bg-[#9e3b5f] text-white shadow-xs'
              : 'text-[#544246] hover:bg-pink-50'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>About</span>
        </button>

      </div>

      {/* TAB: STORY DNA & TASTE (FOR PROFILE OWNER) */}
      {activeTab === 'taste' && (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-pink-200/90 shadow-sm bg-gradient-to-br from-white via-pink-50/40 to-purple-50/30 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-pink-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9e3b5f]">
                    KAIRO Recommendation Profile
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                    {tasteProfileData?.storyDna?.primaryArchetype || 'Imaginative Wanderer'}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-display text-[#26152b]">
                  Your Story DNA & Taste Model
                </h3>
                <p className="text-xs text-[#544246] max-w-xl">
                  This mathematical interest vector powers your home feed, discover sorting, community suggestions, and author spotlights.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {onOpenTasteSettings && (
                  <button
                    type="button"
                    onClick={onOpenTasteSettings}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-pink-50 text-[#9e3b5f] border border-pink-200 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Tune Taste Weights</span>
                  </button>
                )}
                {onOpenOnboarding && (
                  <button
                    type="button"
                    onClick={onOpenOnboarding}
                    className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Retake Onboarding</span>
                  </button>
                )}
              </div>
            </div>

            {loadingTaste ? (
              <div className="py-12 text-center text-xs text-[#877276]">
                <Sparkles className="w-6 h-6 animate-spin mx-auto mb-2 text-[#9e3b5f]" />
                Synthesizing Story DNA...
              </div>
            ) : tasteProfileData ? (
              <div className="space-y-6">
                {/* Top Genres Affinities */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#877276]">Top Genre Affinities</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(tasteProfileData.storyDna?.topGenres || []).map((g: any) => (
                      <div key={g.name} className="p-3.5 rounded-2xl bg-white border border-pink-100/90 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#26152b] flex items-center gap-1.5">
                            <span>{g.emoji}</span>
                            <span>{g.name}</span>
                          </span>
                          <span className="font-bold text-[#9e3b5f]">{g.weight}% Match</span>
                        </div>
                        <div className="w-full bg-pink-100/70 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#9e3b5f] to-[#f47fa5] rounded-full transition-all"
                            style={{ width: `${g.weight}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Narrative Styles & Habits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white border border-pink-100/90 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold text-[#877276] uppercase tracking-wider">Preferred Medium</span>
                    <div className="text-base font-bold text-[#26152b]">{tasteProfileData.storyDna?.primaryMedium || 'Light Novels'}</div>
                    <span className="text-[11px] text-[#544246]">Serialized novel cadence</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-pink-100/90 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold text-[#877276] uppercase tracking-wider">Reading Cadence</span>
                    <div className="text-base font-bold text-[#26152b]">{tasteProfileData.storyDna?.readingPace || 'Daily Pace'}</div>
                    <span className="text-[11px] text-[#544246]">Adaptive notification frequency</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-pink-100/90 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold text-[#877276] uppercase tracking-wider">Content Languages</span>
                    <div className="text-base font-bold text-[#26152b]">{tasteProfileData.storyDna?.languages?.join(', ') || 'English'}</div>
                    <span className="text-[11px] text-[#544246]">Catalog prioritizing</span>
                  </div>
                </div>

                {/* Interface Display Language Section */}
                <div className="p-5 rounded-2xl bg-white border border-pink-100/90 shadow-2xs space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#26152b] flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#9e3b5f]" />
                      <span>{t('taste_active_ui_lang', 'Interface Display Language')}</span>
                    </h4>
                    <p className="text-xs text-[#877276] mt-0.5">
                      Automatically detects your regional language. Choose a language to change the entire interface.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {supportedLanguages.map((lang) => {
                      const isCurrent = currentLanguage === lang.id;
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setLanguage(lang.id)}
                          className={`p-2.5 rounded-xl border text-xs text-left transition flex items-center justify-between cursor-pointer ${
                            isCurrent
                              ? 'bg-[#fee7ff] border-[#f47fa5] text-[#9e3b5f] font-bold shadow-2xs'
                              : 'bg-white hover:bg-pink-50/60 border-pink-100 text-[#26152b]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{lang.flag}</span>
                            <div>
                              <span className="block">{lang.native}</span>
                              <span className="text-[10px] text-[#877276]">{lang.label}</span>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-[#9e3b5f] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-6">
                <div className="space-y-3">
                  <p className="text-xs text-[#877276]">No interest profile saved yet. Complete onboarding to generate your Story DNA!</p>
                  {onOpenOnboarding && (
                    <button
                      type="button"
                      onClick={onOpenOnboarding}
                      className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Start 7-Step Onboarding
                    </button>
                  )}
                </div>

                {/* Interface Display Language Section when no profile data */}
                <div className="p-5 rounded-2xl bg-white border border-pink-100/90 shadow-2xs space-y-3 text-left max-w-xl mx-auto">
                  <div>
                    <h4 className="text-sm font-bold text-[#26152b] flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#9e3b5f]" />
                      <span>{t('taste_active_ui_lang', 'Interface Display Language')}</span>
                    </h4>
                    <p className="text-xs text-[#877276] mt-0.5">
                      Automatically detects your regional language. Choose a language to change the entire interface.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {supportedLanguages.map((lang) => {
                      const isCurrent = currentLanguage === lang.id;
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setLanguage(lang.id)}
                          className={`p-2.5 rounded-xl border text-xs text-left transition flex items-center justify-between cursor-pointer ${
                            isCurrent
                              ? 'bg-[#fee7ff] border-[#f47fa5] text-[#9e3b5f] font-bold shadow-2xs'
                              : 'bg-white hover:bg-pink-50/60 border-pink-100 text-[#26152b]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{lang.flag}</span>
                            <div>
                              <span className="block">{lang.native}</span>
                              <span className="text-[10px] text-[#877276]">{lang.label}</span>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-[#9e3b5f] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: STORIES & COLLECTIONS */}
      {activeTab === 'stories' && (
        <div className="space-y-6">
          {stories.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-pink-100 bg-white/80 space-y-3">
              <BookOpen className="w-10 h-10 text-pink-300 mx-auto" />
              <h3 className="font-bold text-base text-[#26152b] font-display">No Published Stories Yet</h3>
              <p className="text-xs text-[#877276] max-w-md mx-auto">
                {isSelf 
                  ? 'Ready to publish your original fantasy or light novel? Head over to the Creator Studio.'
                  : `${user.displayName} hasn't published stories yet. Check their posts or reading shelf!`}
              </p>
              {isSelf && (user.role === 'WRITER' || user.role === 'ADMIN') && onOpenStudio && (
                <button
                  onClick={onOpenStudio}
                  className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs mt-2"
                >
                  <Feather className="w-3.5 h-3.5" />
                  <span>Start Writing Story</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map(story => (
                <div
                  key={story.id}
                  onClick={() => onOpenStory(story.slug || story.id)}
                  className="glass-card rounded-3xl p-4 border border-pink-100/90 hover:border-pink-300 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between bg-white/90"
                >
                  <div>
                    {/* Story Cover */}
                    <div className="relative rounded-2xl overflow-hidden aspect-4/3 mb-3.5 shadow-xs">
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                        {story.genre}
                      </div>
                      <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-md text-[#26152b] px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {story.status}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-[#877276] mb-1">
                      <span>{story.storyType}</span>
                      <span>•</span>
                      <span>{story.chaptersCount} Chapters</span>
                    </div>

                    <h3 className="font-extrabold text-base text-[#26152b] font-display group-hover:text-[#9e3b5f] transition-colors line-clamp-1">
                      {story.title}
                    </h3>

                    <p className="text-xs text-[#544246] line-clamp-2 mt-1 leading-relaxed">
                      {story.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-pink-100/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-[#877276] font-medium text-[11px]">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-[#9e3b5f]" />
                        <span>{story.views || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                        <span>{story.likes || 0}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-[#9e3b5f]">
                      <Star className="w-3.5 h-3.5 fill-[#9e3b5f]" />
                      <span>{story.rating || 5.0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: POSTS & UPDATES */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-pink-100 bg-white/80 space-y-3">
              <MessageSquare className="w-10 h-10 text-pink-300 mx-auto" />
              <h3 className="font-bold text-base text-[#26152b] font-display">No Fandom Posts Yet</h3>
              <p className="text-xs text-[#877276]">
                {isSelf ? 'Share thoughts, questions, or fan theories in the community hub.' : `${user.displayName} hasn't posted in communities yet.`}
              </p>
            </div>
          ) : (
            posts.map(post => (
              <div
                key={post.id}
                className="glass-card rounded-3xl p-5 sm:p-6 border border-pink-100/90 shadow-2xs space-y-3 bg-white/90"
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-[#9e3b5f] text-[10px] font-bold">
                      {post.communityName || 'Fandom'}
                    </span>
                    <span className="text-[#877276]">
                      {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#877276]">
                    {post.type}
                  </span>
                </div>

                {post.title && (
                  <h4 className="font-bold text-base text-[#26152b] font-display">
                    {post.title}
                  </h4>
                )}

                <p className="text-xs sm:text-sm text-[#544246] leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {post.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden max-h-80 border border-pink-100">
                    <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2 text-xs font-semibold text-[#877276]">
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-[#9e3b5f]" />
                    <span>{post.likes || 0} Likes</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                    <span>{post.commentsCount || 0} Comments</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: UNIVERSES & LORE */}
      {activeTab === 'universes' && (
        <div className="space-y-4">
          {universes.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-pink-100 bg-white/80">
              <Globe className="w-10 h-10 text-pink-300 mx-auto mb-2" />
              <h3 className="font-bold text-base text-[#26152b]">No Universes Founded</h3>
              <p className="text-xs text-[#877276] mt-1">This author hasn't created any canon universe hubs yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {universes.map(uni => (
                <div
                  key={uni.id}
                  onClick={() => onOpenUniverse ? onOpenUniverse(uni.slug || uni.id) : null}
                  className="glass-card rounded-3xl p-5 border border-pink-100 hover:border-pink-300 transition-all cursor-pointer bg-white/90 space-y-3 group shadow-2xs"
                >
                  <div className="h-28 rounded-2xl overflow-hidden relative">
                    <img src={uni.bannerImage} alt={uni.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2.5 left-3 text-white font-bold font-display text-base truncate">
                      {uni.name}
                    </div>
                  </div>
                  <p className="text-xs text-[#544246] line-clamp-2">{uni.tagline || uni.description}</p>
                  <div className="flex items-center justify-between text-xs text-[#877276] pt-1 border-t border-pink-100/70 font-semibold">
                    <span>{uni.storiesCount || 0} Stories Connected</span>
                    <span className="text-[#9e3b5f] font-bold flex items-center gap-1">
                      <span>Explore Lore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: THEORIES */}
      {activeTab === 'theories' && (
        <div className="space-y-4">
          {theories.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-pink-100 bg-white/80">
              <Sparkles className="w-10 h-10 text-pink-300 mx-auto mb-2" />
              <h3 className="font-bold text-base text-[#26152b]">No Fan Theories Submitted</h3>
            </div>
          ) : (
            theories.map(th => (
              <div key={th.id} className="glass-card rounded-3xl p-5 sm:p-6 border border-purple-200/80 bg-white/90 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase">
                    Fan Theory
                  </span>
                  {th.linkedStoryTitle && (
                    <span className="text-xs text-[#877276] font-semibold">
                      Regarding <span className="text-[#26152b]">{th.linkedStoryTitle}</span>
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-base text-[#26152b] font-display">{th.title}</h4>
                <p className="text-xs sm:text-sm text-[#544246] leading-relaxed whitespace-pre-line">{th.content}</p>
                <div className="flex items-center gap-4 text-xs font-semibold text-[#877276] pt-2">
                  <span className="text-emerald-600 font-bold">{th.agreeCount || 0} Agreed</span>
                  <span className="text-rose-600 font-bold">{th.disagreeCount || 0} Disagreed</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: READING SHELF */}
      {activeTab === 'shelf' && (
        <div className="space-y-6">
          {readingList.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-pink-100 bg-white/80 space-y-3">
              <Bookmark className="w-10 h-10 text-pink-300 mx-auto" />
              <h3 className="font-bold text-base text-[#26152b] font-display">Reading Shelf Is Empty</h3>
              <p className="text-xs text-[#877276]">
                {isSelf ? 'Save stories to your library to track chapters and build your reading shelf.' : `${user.displayName} hasn't added public books to their shelf yet.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {readingList.map(item => {
                if (!item?.story) return null;
                return (
                <div
                  key={item.story.id}
                  onClick={() => onOpenStory(item.story.slug || item.story.id)}
                  className="glass-card rounded-3xl p-4 border border-pink-100 hover:border-pink-300 transition-all cursor-pointer group flex flex-col justify-between bg-white/90 shadow-2xs"
                >
                  <div className="flex gap-4">
                    <img
                      src={item.story.coverImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800'}
                      alt={item.story.title}
                      className="w-20 h-28 rounded-2xl object-cover shadow-sm shrink-0 group-hover:scale-103 transition-transform"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="px-2 py-0.5 rounded-md bg-pink-100 text-[#9e3b5f] text-[10px] font-bold uppercase">
                        {item.listType}
                      </span>
                      <h4 className="font-bold text-sm text-[#26152b] truncate font-display group-hover:text-[#9e3b5f] transition-colors">
                        {item.story.title}
                      </h4>
                      <p className="text-xs text-[#877276]">By {item.story.authorDisplayName}</p>
                      <p className="text-[11px] text-[#544246] line-clamp-2 mt-1">{item.story.description}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-pink-100/70 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#877276]">{item.story.chaptersCount} Chapters</span>
                    <span className="text-[#9e3b5f] font-bold text-xs flex items-center gap-1">
                      <span>Read Story</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );})}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AWARDS & CERTIFICATES */}
      {activeTab === 'awards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {certificates.map(cert => (
              <div
                key={cert.id}
                className="bg-gradient-to-br from-amber-500/15 via-white to-amber-500/10 border-2 border-amber-300/80 rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                      <Trophy className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                        {cert.title}
                      </div>
                      <h4 className="font-extrabold text-base text-[#26152b] font-display">
                        {cert.programTitle}
                      </h4>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-200/60 text-amber-900 text-[10px] font-black">
                    VERIFIED
                  </span>
                </div>

                <div className="bg-white/80 rounded-2xl p-4 border border-amber-200/60 text-xs text-[#544246] space-y-1">
                  <div className="font-bold text-[#26152b]">Honoree Citation:</div>
                  <p className="italic">"{cert.notes || 'For exemplary literary craftsmanship and outstanding contribution to the KAIRO creative pantheon.'}"</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#877276] pt-1">
                  <span>Certificate ID: {cert.certificateNumber}</span>
                  <span>Issued {new Date(cert.issueDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: ABOUT & EXPLORER DOSSIER */}
      {activeTab === 'about' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-pink-100/90 shadow-sm bg-white/90 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-[#9e3b5f] flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#26152b] font-display">Explorer Dossier</h3>
              <p className="text-xs text-[#877276]">Public lore and journey statistics across KAIRO.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="bg-[#fff9fc] p-4 rounded-2xl border border-pink-100 space-y-1.5">
              <div className="text-[#877276] font-semibold">Member Handle</div>
              <div className="text-sm font-bold text-[#26152b]">@{user.username}</div>
            </div>

            <div className="bg-[#fff9fc] p-4 rounded-2xl border border-pink-100 space-y-1.5">
              <div className="text-[#877276] font-semibold">Account Role & Status</div>
              <div className="text-sm font-bold text-[#26152b]">
                {user.role} {user.isVerifiedWriter ? '(Verified Author)' : ''}
              </div>
            </div>

            <div className="bg-[#fff9fc] p-4 rounded-2xl border border-pink-100 space-y-1.5">
              <div className="text-[#877276] font-semibold">Astral XP & Progression</div>
              <div className="text-sm font-bold text-[#9e3b5f]">
                Level {user.level || 1} ({user.xp || 0} XP)
              </div>
            </div>

            <div className="bg-[#fff9fc] p-4 rounded-2xl border border-pink-100 space-y-1.5">
              <div className="text-[#877276] font-semibold">Registration Timestamp</div>
              <div className="text-sm font-bold text-[#26152b]">
                {new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </div>
            </div>
          </div>

          {user.favoriteGenres && user.favoriteGenres.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-pink-100">
              <div className="text-xs font-bold text-[#877276] uppercase tracking-wider">Favorite Genres</div>
              <div className="flex items-center gap-2 flex-wrap">
                {user.favoriteGenres.map(g => (
                  <span key={g} className="px-3 py-1 rounded-full bg-pink-100/70 text-[#9e3b5f] text-xs font-bold">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {user.favoriteThemes && user.favoriteThemes.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-[#877276] uppercase tracking-wider">Worldbuilding Themes</div>
              <div className="flex items-center gap-2 flex-wrap">
                {user.favoriteThemes.map(t => (
                  <span key={t} className="px-3 py-1 rounded-full bg-purple-100/70 text-[#635882] text-xs font-bold">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal (For Profile Owner) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-pink-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit className="w-5 h-5 text-[#9e3b5f]" />
                <h3 className="font-extrabold text-lg text-[#26152b] font-display">Edit Public Profile</h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-[#877276] hover:text-[#26152b] font-bold text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#544246] mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={e => setDisplayNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-pink-50/50 border border-pink-200 text-xs font-semibold focus:outline-none focus:border-[#9e3b5f]"
                  placeholder="Your visible name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#544246] mb-1.5">Avatar Image</label>
                <ImageUploader
                  id="profile-edit-avatar-upload"
                  value={avatarInput}
                  onChange={setAvatarInput}
                  avatarMode={true}
                  helperText="Upload avatar directly from phone gallery or internal storage"
                  placeholder="Paste avatar URL or upload from storage"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#544246] mb-1">Public Bio</label>
                <textarea
                  rows={3}
                  value={bioInput}
                  onChange={e => setBioInput(e.target.value)}
                  className="w-full p-3 rounded-xl bg-pink-50/50 border border-pink-200 text-xs focus:outline-none focus:border-[#9e3b5f]"
                  placeholder="Describe your creative work, favorite stories, or reading interests..."
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-pink-200 text-xs font-bold text-[#544246] hover:bg-pink-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-gradient px-5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
