import React, { useState, useEffect } from 'react';
import { 
  Feather, BookOpen, Plus, Globe, Sparkles, TrendingUp, 
  Users, Star, Eye, Clock, Edit3, Trash2, ArrowRight, BarChart3 
} from 'lucide-react';
import { Story, CreatorStats } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface StudioDashboardViewProps {
  onCreateStory: () => void;
  onEditChapter: (storyId: string, chapterId?: string) => void;
  onOpenWorldBuilder: () => void;
  onOpenCharacterBuilder: () => void;
  onOpenStoryDetail: (storySlug: string) => void;
}

export const StudioDashboardView: React.FC<StudioDashboardViewProps> = ({
  onCreateStory,
  onEditChapter,
  onOpenWorldBuilder,
  onOpenCharacterBuilder,
  onOpenStoryDetail,
}) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudioData();
  }, [user]);

  const loadStudioData = async () => {
    setLoading(true);
    try {
      const [storyRes, statsRes] = await Promise.all([
        api.getStories({ authorId: user?.id }),
        api.getCreatorAnalytics().catch(() => ({ stats: null })),
      ]);
      setStories(storyRes.stories || []);
      setStats(statsRes.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story? This cannot be undone.')) return;
    try {
      await api.deleteStory(storyId);
      setStories(prev => prev.filter(s => s.id !== storyId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      
      {/* Studio Header Banner */}
      <section className="glass-card rounded-3xl p-6 sm:p-10 border border-pink-200/90 shadow-sm relative overflow-hidden bg-gradient-to-br from-[#fee7ff] via-white to-[#ffeffe]">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-pink-200 text-[#9e3b5f] text-xs font-bold">
              <Feather className="w-3.5 h-3.5" />
              <span>KAIRO CREATOR STUDIO</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-display text-[#26152b]">
              Welcome, <span className="gradient-text">{user?.displayName || 'Creator'}</span>
            </h1>
            <p className="text-sm text-[#544246] max-w-xl">
              Manage your serial publications, build deep fictional continuity lore, and inspect reader engagement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="studio-new-story-btn"
              onClick={onCreateStory}
              className="btn-gradient px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Story</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quick Launch Cards for World & Character Builders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={onOpenWorldBuilder}
          className="glass-card rounded-3xl p-5 border border-purple-200/80 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer group flex items-center justify-between bg-gradient-to-r from-white via-purple-50/30 to-purple-100/30"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#635882] text-white flex items-center justify-center shadow-md">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#26152b] font-display group-hover:text-[#635882] transition-colors">
                World & Codex Builder
              </h3>
              <p className="text-xs text-[#877276]">
                Design continents, magic rules, factions, and chronology timelines.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#635882] group-hover:translate-x-1 transition-transform mr-2" />
        </div>

        <div
          onClick={onOpenCharacterBuilder}
          className="glass-card rounded-3xl p-5 border border-pink-200/80 hover:border-pink-300 hover:shadow-lg transition-all cursor-pointer group flex items-center justify-between bg-gradient-to-r from-white via-pink-50/30 to-pink-100/30"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#9e3b5f] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#26152b] font-display group-hover:text-[#9e3b5f] transition-colors">
                Character & Relationship Web
              </h3>
              <p className="text-xs text-[#877276]">
                Forge character profiles, abilities, arcs, and connection networks.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#9e3b5f] group-hover:translate-x-1 transition-transform mr-2" />
        </div>
      </div>

      {/* Analytics Bento Grid */}
      {stats && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#9e3b5f]" />
            <h2 className="text-xl font-bold font-display text-[#26152b]">Creator Analytics</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-pink-100">
              <div className="text-xs font-bold text-[#877276] uppercase tracking-wider">Total Reads</div>
              <div className="text-2xl font-black font-display text-[#9e3b5f] mt-1">
                {(stats?.totalReads ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-pink-100">
              <div className="text-xs font-bold text-[#877276] uppercase tracking-wider">Followers</div>
              <div className="text-2xl font-black font-display text-[#26152b] mt-1">
                {(stats?.followersCount ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-pink-100">
              <div className="text-xs font-bold text-[#877276] uppercase tracking-wider">Completion Rate</div>
              <div className="text-2xl font-black font-display text-emerald-600 mt-1">
                {stats?.chapterCompletionRate ?? 0}%
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-pink-100">
              <div className="text-xs font-bold text-[#877276] uppercase tracking-wider">Avg Read Time</div>
              <div className="text-2xl font-black font-display text-[#635882] mt-1">
                {stats?.avgReadingTimeMinutes ?? 0} min
              </div>
            </div>
          </div>
        </section>
      )}

      {/* My Published Stories Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-[#26152b]">My Stories ({stories.length})</h2>
          <button
            onClick={onCreateStory}
            className="text-xs font-bold text-[#9e3b5f] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Story</span>
          </button>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-3xl p-8 border border-pink-100 space-y-4">
            <BookOpen className="w-12 h-12 mx-auto text-[#877276] opacity-40" />
            <h3 className="font-bold text-lg text-[#26152b]">You haven't written any stories yet</h3>
            <p className="text-xs text-[#877276] max-w-sm mx-auto">
              Bring your characters, light novels, and serialized worlds to life on KAIRO today.
            </p>
            <button
              onClick={onCreateStory}
              className="btn-gradient px-6 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
            >
              Start First Story
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map(story => (
              <div
                key={story.id}
                className="glass-card rounded-3xl p-5 border border-pink-100 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-16 h-22 object-cover rounded-xl shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#fee7ff] text-[#9e3b5f] text-[10px] font-bold">
                        {story.genre}
                      </span>
                      <span className="text-xs font-bold text-[#877276]">
                        {story.chaptersCount} Chapters
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        story.status === 'Ongoing' ? 'bg-emerald-100 text-emerald-800' : 'bg-pink-100 text-[#9e3b5f]'
                      }`}>
                        {story.status}
                      </span>
                    </div>

                    <h3 
                      onClick={() => onOpenStoryDetail(story.slug || story.id)}
                      className="font-bold text-base text-[#26152b] font-display hover:text-[#9e3b5f] transition-colors cursor-pointer mt-1"
                    >
                      {story.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-xs text-[#877276] mt-1 font-medium">
                      <span>★ {story.rating ?? 0} ({story.ratingCount ?? 0})</span>
                      <span>•</span>
                      <span>{(story.views ?? 0).toLocaleString()} reads</span>
                      <span>•</span>
                      <span>{story.likes ?? 0} likes</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    id={`manage-chapters-btn-${story.id}`}
                    onClick={() => onEditChapter(story.id)}
                    className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Feather className="w-3.5 h-3.5" />
                    <span>Write Chapter</span>
                  </button>

                  <button
                    onClick={() => onOpenStoryDetail(story.slug || story.id)}
                    className="px-3 py-2 rounded-xl bg-white border border-pink-200 text-[#544246] hover:bg-pink-50 text-xs font-semibold cursor-pointer"
                  >
                    View Story
                  </button>

                  <button
                    onClick={() => handleDeleteStory(story.id)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 cursor-pointer"
                    title="Delete story"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
