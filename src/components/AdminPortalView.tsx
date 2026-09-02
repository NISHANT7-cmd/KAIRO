import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, BookOpen, Feather, Search, 
  Trash2, AlertTriangle, RefreshCw, Star, 
  Globe, MessageSquare, Flame, CheckCircle, Ban, 
  Sparkles, ExternalLink
} from 'lucide-react';
import { User, Story, AdminPlatformStats, CommunityPost, Theory } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AdminPortalViewProps {
  onOpenStory: (slug: string) => void;
  onOpenUniverse: (slug: string) => void;
  onExitAdmin: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  onOpenStory,
  onOpenUniverse,
  onExitAdmin,
}) => {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [theories, setTheories] = useState<Theory[]>([]);
  
  const [activeTab, setActiveTab] = useState<'users' | 'stories' | 'moderation' | 'overview'>('users');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [storySearch, setStorySearch] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('ALL');

  // Load Admin Data
  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [statsRes, usersRes, storiesRes, postsRes, theoriesRes] = await Promise.all([
        api.adminGetStats(),
        api.adminGetUsers(),
        api.getStories(),
        api.getCommunityPosts(),
        api.getTheories(),
      ]);

      setStats(statsRes.stats);
      setUsers(usersRes.users || []);
      setStories(storiesRes.stories || []);
      setPosts(postsRes.posts || []);
      setTheories(theoriesRes.theories || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load master admin data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // User Actions
  const handleRoleChange = async (userId: string, newRole: 'USER' | 'WRITER' | 'MODERATOR' | 'ADMIN') => {
    setActionLoading(`role_${userId}`);
    try {
      const isWriter = newRole === 'WRITER';
      const res = await api.adminUpdateUser(userId, { 
        role: newRole,
        isVerifiedWriter: isWriter 
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...res.user } : u));
      showNotification('success', `Updated user role to ${newRole}`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (userToUpdate: User) => {
    setActionLoading(`status_${userToUpdate.id}`);
    const nextStatus = userToUpdate.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      const res = await api.adminUpdateUser(userToUpdate.id, { status: nextStatus });
      setUsers(prev => prev.map(u => u.id === userToUpdate.id ? { ...u, ...res.user } : u));
      showNotification('success', `User account set to ${nextStatus}`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVerifiedWriter = async (userToUpdate: User) => {
    setActionLoading(`verify_${userToUpdate.id}`);
    const nextVerified = !userToUpdate.isVerifiedWriter;
    try {
      const res = await api.adminUpdateUser(userToUpdate.id, { isVerifiedWriter: nextVerified });
      setUsers(prev => prev.map(u => u.id === userToUpdate.id ? { ...u, ...res.user } : u));
      showNotification('success', `Author verification status updated`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update verification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user @${username}?`)) return;
    setActionLoading(`del_user_${userId}`);
    try {
      await api.adminDeleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showNotification('success', `User @${username} removed`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  // Story Actions
  const handleToggleStoryFeatured = async (story: Story) => {
    setActionLoading(`story_feat_${story.id}`);
    const nextFeatured = !(story.featured ?? story.isFeatured);
    try {
      const res = await api.adminUpdateStory(story.id, { 
        featured: nextFeatured,
        isFeatured: nextFeatured 
      });
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, ...res.story, featured: nextFeatured, isFeatured: nextFeatured } : s));
      showNotification('success', `Updated story featured status`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update story');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteStory = async (storyId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove story "${title}"?`)) return;
    setActionLoading(`del_story_${storyId}`);
    try {
      await api.adminDeleteStory(storyId);
      setStories(prev => prev.filter(s => s.id !== storyId));
      showNotification('success', `Story removed from platform`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to remove story');
    } finally {
      setActionLoading(null);
    }
  };

  // Moderation Actions
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete this community post?')) return;
    setActionLoading(`del_post_${postId}`);
    try {
      await api.adminDeletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      showNotification('success', 'Community post removed');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete post');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTheory = async (theoryId: string) => {
    if (!window.confirm('Delete this fan theory?')) return;
    setActionLoading(`del_theory_${theoryId}`);
    try {
      await api.adminDeleteTheory(theoryId);
      setTheories(prev => prev.filter(t => t.id !== theoryId));
      showNotification('success', 'Theory removed');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete theory');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || (u.status || 'ACTIVE') === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredStories = stories.filter(s => {
    const matchesSearch = 
      s.title.toLowerCase().includes(storySearch.toLowerCase()) ||
      s.authorDisplayName.toLowerCase().includes(storySearch.toLowerCase()) ||
      s.authorUsername.toLowerCase().includes(storySearch.toLowerCase());
    const matchesGenre = genreFilter === 'ALL' || s.genre.toLowerCase() === genreFilter.toLowerCase();
    return matchesSearch && matchesGenre;
  });

  // Guard: if current user is not admin
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-display text-[#26152b] mb-2">Master Admin Portal Restricted</h2>
        <p className="text-sm text-[#877276] max-w-md mx-auto mb-6">
          You are currently logged in as <strong>{currentUser?.displayName || 'User'}</strong> ({currentUser?.role || 'Guest'}). 
          Access to the Master Admin Portal requires the Master Admin role.
        </p>
        <button
          onClick={onExitAdmin}
          className="btn-gradient px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
        >
          Return to Platform
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-150">
      
      {/* Top Banner / Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 mb-8 border border-purple-200/90 shadow-xl bg-gradient-to-r from-purple-900/95 via-[#26152b] to-[#4a1c38] text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-pink-500/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Master Admin Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Platform Administration & Content Operations
            </h1>
            <p className="text-xs sm:text-sm text-pink-200/80 mt-1 max-w-xl">
              Manage user accounts, verified writers, story publications, lore universes, and community discussions across KAIRO.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer"
              title="Refresh platform statistics and tables"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
            <button
              onClick={onExitAdmin}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
            >
              Return to Reader App
            </button>
          </div>
        </div>

        {/* Global KPIs */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <div className="text-[11px] font-semibold text-pink-200/70 uppercase">Total Users</div>
              <div className="text-xl font-black text-white mt-0.5">{stats.totalUsers}</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Active Network</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <div className="text-[11px] font-semibold text-pink-200/70 uppercase">Writers / Authors</div>
              <div className="text-xl font-black text-white mt-0.5">{stats.totalWriters}</div>
              <div className="text-[10px] text-purple-300 mt-0.5">Verified Creators</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <div className="text-[11px] font-semibold text-pink-200/70 uppercase">Stories Published</div>
              <div className="text-xl font-black text-white mt-0.5">{stats.totalStories}</div>
              <div className="text-[10px] text-pink-300 mt-0.5">{stats.totalChapters} Chapters</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <div className="text-[11px] font-semibold text-pink-200/70 uppercase">Total Reads</div>
              <div className="text-xl font-black text-white mt-0.5">{stats.totalReads.toLocaleString()}</div>
              <div className="text-[10px] text-amber-300 mt-0.5">Engagement Views</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <div className="text-[11px] font-semibold text-pink-200/70 uppercase">Lore Universes</div>
              <div className="text-xl font-black text-white mt-0.5">{stats.totalUniverses}</div>
              <div className="text-[10px] text-cyan-300 mt-0.5">Canon Worldspaces</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <div className="text-[11px] font-semibold text-pink-200/70 uppercase">Theories & Posts</div>
              <div className="text-xl font-black text-white mt-0.5">{stats.totalTheories + stats.totalPosts}</div>
              <div className="text-[10px] text-orange-300 mt-0.5">Community Threads</div>
            </div>
          </div>
        )}
      </div>

      {/* Action Notification Banner */}
      {message && (
        <div className={`p-4 mb-6 rounded-2xl border flex items-center gap-3 animate-in fade-in duration-150 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span className="text-xs font-semibold">{message.text}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-pink-100/80 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'users'
              ? 'bg-[#9e3b5f] text-white shadow-md'
              : 'text-[#544246] hover:bg-pink-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User & Writer Management ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'stories'
              ? 'bg-[#9e3b5f] text-white shadow-md'
              : 'text-[#544246] hover:bg-pink-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Story Publications ({stories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'moderation'
              ? 'bg-[#9e3b5f] text-white shadow-md'
              : 'text-[#544246] hover:bg-pink-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Community & Theories ({posts.length + theories.length})</span>
        </button>
      </div>

      {/* TAB 1: USERS & WRITERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          
          {/* Controls & Filter Bar */}
          <div className="glass-card rounded-2xl p-4 border border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#877276] absolute left-3.5 top-3" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search username, pen name, email..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-pink-200/80 focus:border-[#9e3b5f] outline-none text-xs text-[#26152b]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-[#544246]">
                <span className="font-semibold">Role:</span>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="h-9 px-2.5 rounded-lg bg-white border border-pink-200 text-xs font-semibold text-[#26152b] outline-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="USER">Readers (USER)</option>
                  <option value="WRITER">Writers (WRITER)</option>
                  <option value="MODERATOR">Moderators</option>
                  <option value="ADMIN">Master Admins</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#544246]">
                <span className="font-semibold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="h-9 px-2.5 rounded-lg bg-white border border-pink-200 text-xs font-semibold text-[#26152b] outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="glass-card rounded-2xl border border-pink-200/80 shadow-md overflow-hidden bg-white/90">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#544246]">
                <thead className="bg-pink-50/80 text-[11px] uppercase tracking-wider text-[#877276] font-bold border-b border-pink-100">
                  <tr>
                    <th className="py-3.5 px-4">User / Author</th>
                    <th className="py-3.5 px-3">Role & Permissions</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-3">Publications & Reads</th>
                    <th className="py-3.5 px-3">Level & XP</th>
                    <th className="py-3.5 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-[#877276]">
                        No users or writers found matching the query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(userItem => {
                      const isSelf = userItem.id === currentUser?.id;
                      const isSuspended = userItem.status === 'SUSPENDED';

                      return (
                        <tr key={userItem.id} className={`hover:bg-pink-50/40 transition-colors ${isSuspended ? 'bg-red-50/30' : ''}`}>
                          
                          {/* User info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={userItem.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                                alt={userItem.displayName}
                                className="w-9 h-9 rounded-full object-cover border border-pink-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-[#26152b] flex items-center gap-1.5 truncate">
                                  <span>{userItem.displayName}</span>
                                  {userItem.isVerifiedWriter && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold" title="Verified Writer">
                                      <Feather className="w-2.5 h-2.5" />
                                      <span>Writer</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#877276] truncate">@{userItem.username} • {userItem.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role selector */}
                          <td className="py-3 px-3">
                            <select
                              value={userItem.role}
                              disabled={isSelf || actionLoading === `role_${userItem.id}`}
                              onChange={e => handleRoleChange(userItem.id, e.target.value as any)}
                              className={`h-8 px-2 rounded-lg text-xs font-bold border cursor-pointer outline-none ${
                                userItem.role === 'ADMIN'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : userItem.role === 'WRITER'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                                  : userItem.role === 'MODERATOR'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-pink-100/70 text-[#9e3b5f] border-pink-200'
                              }`}
                            >
                              <option value="USER">Reader (USER)</option>
                              <option value="WRITER">Writer (WRITER)</option>
                              <option value="MODERATOR">Moderator</option>
                              <option value="ADMIN">Master Admin</option>
                            </select>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isSuspended
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isSuspended ? <Ban className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                              <span>{isSuspended ? 'SUSPENDED' : 'ACTIVE'}</span>
                            </span>
                          </td>

                          {/* Stats */}
                          <td className="py-3 px-3">
                            <div className="text-xs font-semibold text-[#26152b]">
                              {userItem.publishedStoriesCount || 0} stories
                            </div>
                            <div className="text-[10px] text-[#877276]">
                              {(userItem.totalReads || 0).toLocaleString()} reads • {userItem.followersCount || 0} followers
                            </div>
                          </td>

                          {/* Level / XP */}
                          <td className="py-3 px-3">
                            <div className="text-xs font-bold text-[#9e3b5f]">
                              Level {userItem.level || 1}
                            </div>
                            <div className="text-[10px] text-[#877276]">
                              {userItem.xp || 0} XP • {userItem.readingStreak || 1}d streak
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Toggle verified writer */}
                              <button
                                onClick={() => handleToggleVerifiedWriter(userItem)}
                                disabled={actionLoading === `verify_${userItem.id}`}
                                className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                                  userItem.isVerifiedWriter
                                    ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200'
                                    : 'bg-white border-pink-200 text-[#877276] hover:bg-pink-50'
                                }`}
                                title={userItem.isVerifiedWriter ? 'Revoke Verified Writer Badge' : 'Grant Verified Writer Badge'}
                              >
                                <Feather className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Suspend / Reactivate */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleToggleStatus(userItem)}
                                  disabled={actionLoading === `status_${userItem.id}`}
                                  className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                                    isSuspended
                                      ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200'
                                      : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                  }`}
                                  title={isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                                >
                                  {isSuspended ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              {/* Delete */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                                  disabled={actionLoading === `del_user_${userItem.id}`}
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STORIES MANAGEMENT */}
      {activeTab === 'stories' && (
        <div className="space-y-6">
          
          {/* Controls */}
          <div className="glass-card rounded-2xl p-4 border border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#877276] absolute left-3.5 top-3" />
              <input
                type="text"
                value={storySearch}
                onChange={e => setStorySearch(e.target.value)}
                placeholder="Search story title or author..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-pink-200/80 focus:border-[#9e3b5f] outline-none text-xs text-[#26152b]"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#544246]">
              <span className="font-semibold">Genre:</span>
              <select
                value={genreFilter}
                onChange={e => setGenreFilter(e.target.value)}
                className="h-9 px-2.5 rounded-lg bg-white border border-pink-200 text-xs font-semibold text-[#26152b] outline-none"
              >
                <option value="ALL">All Genres</option>
                <option value="Fantasy">Fantasy</option>
                <option value="Dark Fantasy">Dark Fantasy</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Anime-Inspired">Anime-Inspired</option>
                <option value="Light Novel">Light Novel</option>
                <option value="Romance">Romance</option>
              </select>
            </div>
          </div>

          {/* Stories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStories.map(story => (
              <div 
                key={story.id} 
                className="glass-card rounded-2xl p-4 border border-pink-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between bg-white/95"
              >
                <div>
                  <div className="flex gap-3 mb-3">
                    <img 
                      src={story.coverImage} 
                      alt={story.title} 
                      className="w-16 h-22 rounded-xl object-cover border border-pink-200 shrink-0 shadow-xs"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[#9e3b5f] text-[9px] font-bold">
                          {story.genre}
                        </span>
                        {(story.featured || story.isFeatured) && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            <span>Spotlight</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-[#26152b] truncate leading-tight">{story.title}</h3>
                      <p className="text-[11px] text-[#877276] mt-0.5 truncate">by {story.authorDisplayName} (@{story.authorUsername})</p>
                      <div className="text-[10px] text-[#877276] mt-1 flex items-center gap-2">
                        <span>{story.views.toLocaleString()} reads</span>
                        <span>•</span>
                        <span>{story.chaptersCount || 0} chapters</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#544246] line-clamp-2 mb-3">
                    {story.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-pink-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenStory(story.slug)}
                    className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-xs font-semibold text-[#9e3b5f] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStoryFeatured(story)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                        (story.featured || story.isFeatured)
                          ? 'bg-amber-100 border-amber-300 text-amber-900'
                          : 'bg-white border-pink-200 text-[#544246] hover:bg-pink-50'
                      }`}
                      title="Toggle Platform Spotlight / Featured"
                    >
                      <Star className={`w-3 h-3 ${(story.featured || story.isFeatured) ? 'fill-amber-500 text-amber-500' : ''}`} />
                      <span>{(story.featured || story.isFeatured) ? 'Featured' : 'Feature'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteStory(story.id, story.title)}
                      className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer"
                      title="Remove Story"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: COMMUNITY & THEORIES MODERATION */}
      {activeTab === 'moderation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Community Discussions */}
          <div className="glass-card rounded-2xl p-5 border border-pink-200/80 shadow-sm bg-white/90">
            <h2 className="text-base font-bold font-display text-[#26152b] mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#9e3b5f]" />
                <span>Community Posts Moderation</span>
              </span>
              <span className="text-xs text-[#877276] font-normal">{posts.length} posts</span>
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {posts.map(post => (
                <div key={post.id} className="p-3 rounded-xl bg-pink-50/40 border border-pink-100 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-[#26152b]">{post.authorDisplayName || post.username}</span>
                      <span className="text-[10px] text-[#877276]">@{post.username}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-pink-100 text-[#9e3b5f] font-semibold">{post.type}</span>
                    </div>
                    <p className="text-xs text-[#544246] line-clamp-3">{post.content}</p>
                    <div className="text-[10px] text-[#877276] mt-1">
                      {post.likes || 0} likes • {post.commentsCount || 0} comments
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer shrink-0"
                    title="Remove Community Post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Fan Theories */}
          <div className="glass-card rounded-2xl p-5 border border-pink-200/80 shadow-sm bg-white/90">
            <h2 className="text-base font-bold font-display text-[#26152b] mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Fan Theories Moderation</span>
              </span>
              <span className="text-xs text-[#877276] font-normal">{theories.length} theories</span>
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {theories.map(theory => (
                <div key={theory.id} className="p-3 rounded-xl bg-purple-50/30 border border-purple-100 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-[#26152b]">{theory.title}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-semibold">{theory.status}</span>
                    </div>
                    <div className="text-[10px] text-[#877276] mb-1">by @{theory.authorUsername} • {theory.storyTitle || 'Universal'}</div>
                    <p className="text-xs text-[#544246] line-clamp-3">{theory.description}</p>
                    <div className="text-[10px] text-[#877276] mt-1">
                      {theory.upvotes || 0} upvotes • {theory.credibilityScore || 85}% credibility
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTheory(theory.id)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer shrink-0"
                    title="Remove Fan Theory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
