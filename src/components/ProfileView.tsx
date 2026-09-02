import React, { useState, useEffect } from 'react';
import { 
  User, Flame, BookOpen, Feather, Sparkles, 
  LogOut, Edit, Shield, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Story } from '../types';

interface ProfileViewProps {
  onOpenStory: (storySlug: string) => void;
  onOpenStudio: () => void;
  onOpenAdmin?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  onOpenStory, 
  onOpenStudio,
  onOpenAdmin
}) => {
  const { user, logout, updateProfile } = useAuth();
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user?.bio || '');
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName || '');

  useEffect(() => {
    if (user) {
      setBioInput(user.bio || '');
      setDisplayNameInput(user.displayName);
      api.getStories({ authorId: user.id }).then(res => {
        setUserStories(res.stories || []);
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-28 text-[#877276]">
        Please sign in to view your profile.
      </div>
    );
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ bio: bioInput, displayName: displayNameInput });
      setIsEditingBio(false);
    } catch (err) {
      console.error(err);
    }
  };

  const userAvatar = user.avatar || user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      
      {/* Admin Quick Jump Banner (If user is ADMIN) */}
      {user.role === 'ADMIN' && onOpenAdmin && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-4 sm:p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Master Admin Privileges Active</div>
              <div className="text-xs text-amber-100">You have full permission to manage all users, verified writers, stories, and community content.</div>
            </div>
          </div>
          <button
            onClick={onOpenAdmin}
            className="px-4 py-2 rounded-xl bg-white text-amber-900 hover:bg-amber-50 text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Open Master Admin Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Profile Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-pink-200/90 shadow-md relative overflow-hidden bg-gradient-to-br from-[#fee7ff] via-white to-[#ffeffe]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={userAvatar}
              alt={user.displayName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-4 border-white shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black font-display text-[#26152b]">{user.displayName}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  user.role === 'ADMIN' 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : user.role === 'WRITER' 
                    ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                    : 'bg-[#fee7ff] text-[#9e3b5f]'
                }`}>
                  {user.role}
                </span>
                {user.isVerifiedWriter && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center gap-1">
                    <Feather className="w-3 h-3" />
                    <span>Verified Author</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#877276] mt-0.5">@{user.username} • Joined {new Date(user.createdAt).toLocaleDateString()}</p>
              
              {!isEditingBio ? (
                <p className="text-xs sm:text-sm text-[#544246] mt-2 max-w-lg leading-relaxed">
                  {user.bio || 'Avid reader & fandom explorer.'}
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={e => setDisplayNameInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-xs font-semibold"
                    placeholder="Display Name"
                  />
                  <textarea
                    rows={2}
                    value={bioInput}
                    onChange={e => setBioInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-pink-200 text-xs"
                    placeholder="Short bio..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="btn-gradient px-3 py-1 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingBio(false)}
                      className="px-3 py-1 rounded-lg bg-white border border-pink-200 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingBio && (
              <button
                onClick={() => setIsEditingBio(true)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-xs font-bold text-[#544246] flex items-center gap-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}

            <button
              onClick={logout}
              className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reader Stats Bento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-pink-100 text-center">
          <div className="text-xs font-bold text-[#877276] uppercase tracking-wider flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Daily Streak</span>
          </div>
          <div className="text-2xl font-black font-display text-orange-500 mt-1">
            {user.readingStreak ?? user.streakDays ?? 0} Days
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-pink-100 text-center">
          <div className="text-xs font-bold text-[#877276] uppercase tracking-wider flex items-center justify-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#9e3b5f]" />
            <span>Chapters Read</span>
          </div>
          <div className="text-2xl font-black font-display text-[#9e3b5f] mt-1">
            {user.chaptersReadCount ?? 0}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-pink-100 text-center">
          <div className="text-xs font-bold text-[#877276] uppercase tracking-wider flex items-center justify-center gap-1">
            <Feather className="w-3.5 h-3.5 text-[#635882]" />
            <span>Stories Authored</span>
          </div>
          <div className="text-2xl font-black font-display text-[#635882] mt-1">
            {userStories.length}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-pink-100 text-center">
          <div className="text-xs font-bold text-[#877276] uppercase tracking-wider flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>Followers</span>
          </div>
          <div className="text-2xl font-black font-display text-[#26152b] mt-1">
            {user.followersCount ?? 0}
          </div>
        </div>
      </div>

      {/* Favorite Genres */}
      {user.favoriteGenres && user.favoriteGenres.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border border-pink-100 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#9e3b5f]">Favorite Genres</h3>
          <div className="flex flex-wrap gap-2">
            {user.favoriteGenres.map(genre => (
              <span
                key={genre}
                className="px-3 py-1 rounded-full bg-[#fee7ff] text-[#9e3b5f] text-xs font-bold"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Authored Stories */}
      {userStories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg font-display text-[#26152b]">Authored Publications ({userStories.length})</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userStories.map(story => (
              <div
                key={story.id}
                onClick={() => onOpenStory(story.slug || story.id)}
                className="glass-card rounded-2xl p-4 border border-pink-100 hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
              >
                <img src={story.coverImage} alt={story.title} className="w-14 h-20 object-cover rounded-xl shadow-xs" />
                <div>
                  <span className="text-[10px] font-bold text-[#9e3b5f] uppercase">{story.genre}</span>
                  <h4 className="font-bold text-sm text-[#26152b] font-display line-clamp-1">{story.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#877276] mt-1">
                    <span>{story.chaptersCount ?? 0} Chapters</span>
                    <span>•</span>
                    <span>{(story.views ?? 0).toLocaleString()} Reads</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
