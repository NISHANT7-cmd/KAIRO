import React, { useState, useEffect } from 'react';
import { 
  Feather, BookOpen, Plus, Globe, Sparkles, TrendingUp, 
  Users, Star, Eye, Clock, Edit3, Trash2, ArrowRight, BarChart3,
  Download, ChevronDown, ChevronUp, Check, Search, Filter,
  Settings, X, Shield, RefreshCw, AlertCircle
} from 'lucide-react';
import { Story, Chapter, CreatorStats, StoryStatus, StoryType, AgeRating } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ImageUploader } from './ImageUploader';

interface StudioDashboardViewProps {
  onCreateStory: () => void;
  onEditChapter: (storyId: string, chapterId?: string) => void;
  onOpenWorldBuilder: () => void;
  onOpenCharacterBuilder: () => void;
  onOpenStoryDetail: (storySlug: string) => void;
  onReadChapter?: (storySlug: string, chapterNumber: number) => void;
}

const COVER_PRESETS = [
  { label: 'Celestial Astral', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80' },
  { label: 'Dark Spire', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80' },
  { label: 'Cyberpunk Neon', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80' },
  { label: 'Starry Library', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80' },
  { label: 'Floating Islands', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80' },
];

export const StudioDashboardView: React.FC<StudioDashboardViewProps> = ({
  onCreateStory,
  onEditChapter,
  onOpenWorldBuilder,
  onOpenCharacterBuilder,
  onOpenStoryDetail,
  onReadChapter,
}) => {
  const { user, login, openAuthModal, updateProfile } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Ongoing' | 'Completed'>('All');

  // Expanded Chapters Accordion
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(null);
  const [storyChapters, setStoryChapters] = useState<{ [storyId: string]: Chapter[] }>({});
  const [loadingChapters, setLoadingChapters] = useState<string | null>(null);

  // Story Edit Modal
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editStatus, setEditStatus] = useState<StoryStatus>('Ongoing');
  const [editTags, setEditTags] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirmations
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadStudioData();
    } else {
      setLoading(false);
    }
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

  // Toggle chapter management accordion for a story
  const toggleManageChapters = async (storyId: string) => {
    if (expandedStoryId === storyId) {
      setExpandedStoryId(null);
      return;
    }

    setExpandedStoryId(storyId);
    if (!storyChapters[storyId]) {
      setLoadingChapters(storyId);
      try {
        const res = await api.getStoryChapters(storyId);
        setStoryChapters(prev => ({
          ...prev,
          [storyId]: res.chapters || []
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingChapters(null);
      }
    }
  };

  // Delete a chapter from within the studio
  const handleDeleteChapter = async (storyId: string, chapterId: string) => {
    setIsDeleting(true);
    try {
      await api.deleteChapter(chapterId);
      setStoryChapters(prev => ({
        ...prev,
        [storyId]: (prev[storyId] || []).filter(c => c.id !== chapterId)
      }));
      // Update story chaptersCount
      setStories(prev => prev.map(s => s.id === storyId ? { ...s, chaptersCount: Math.max(0, (s.chaptersCount || 1) - 1) } : s));
      setDeletingChapterId(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete chapter');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete an entire story
  const handleDeleteStory = async () => {
    if (!deletingStoryId) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await api.deleteStory(deletingStoryId);
      setStories(prev => prev.filter(s => s.id !== deletingStoryId));
      setDeletingStoryId(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete story');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Story Edit Modal
  const openEditStoryModal = (story: Story) => {
    setEditingStory(story);
    setEditTitle(story.title);
    setEditDescription(story.description);
    setEditGenre(story.genre);
    setEditCoverImage(story.coverImage);
    setEditStatus(story.status);
    setEditTags(story.tags ? story.tags.join(', ') : '');
  };

  // Save Story Edit
  const handleSaveStoryEdit = async () => {
    if (!editingStory || !editTitle.trim()) return;
    setSavingEdit(true);
    try {
      const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.updateStory(editingStory.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        genre: editGenre,
        coverImage: editCoverImage,
        status: editStatus,
        tags,
      });

      setStories(prev => prev.map(s => s.id === editingStory.id ? { ...s, ...res.story } : s));
      setEditingStory(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update story');
    } finally {
      setSavingEdit(false);
    }
  };

  // Export Manuscript (Download complete book in Markdown format)
  const handleExportManuscript = async (story: Story) => {
    try {
      let chaps = storyChapters[story.id];
      if (!chaps) {
        const res = await api.getStoryChapters(story.id);
        chaps = res.chapters || [];
      }

      let markdown = `# ${story.title}\n\n`;
      markdown += `**Author:** ${story.authorDisplayName} (@${story.authorUsername})\n`;
      markdown += `**Genre:** ${story.genre} | **Format:** ${story.storyType} | **Status:** ${story.status}\n`;
      markdown += `**Tags:** ${story.tags?.join(', ') || 'None'}\n\n`;
      markdown += `## Synopsis\n${story.description}\n\n`;
      markdown += `---\n\n`;

      if (chaps.length === 0) {
        markdown += `*(No chapters written yet)*\n`;
      } else {
        chaps.sort((a, b) => a.chapterNumber - b.chapterNumber).forEach(c => {
          markdown += `## Chapter ${c.chapterNumber}: ${c.title}\n`;
          if (c.subtitle) markdown += `*${c.subtitle}*\n\n`;
          markdown += `${c.content}\n\n`;
          if (c.authorNote) {
            markdown += `> **Author's Note:** ${c.authorNote}\n\n`;
          }
          markdown += `---\n\n`;
        });
      }

      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.slug || 'story'}-manuscript.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError('Failed to export manuscript');
    }
  };

  // Filtered stories
  const filteredStories = stories.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        s.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All' ? true : s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // -------------------------------------------------------------
  // READER ACCOUNT RESTRICTION (Creator studio removed for readers)
  // -------------------------------------------------------------
  if (user && user.role === 'USER') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 pb-28 text-center">
        <div className="glass-card rounded-3xl p-8 sm:p-14 border border-pink-200/90 shadow-xl bg-gradient-to-br from-[#fee7ff] via-white to-[#ffeffe] space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-white shadow-md border border-pink-200 flex items-center justify-center text-[#9e3b5f] mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fee7ff] text-[#9e3b5f] text-xs font-bold border border-pink-200">
              <span>READER ACCOUNT ACCESS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-display text-[#26152b]">
              Creator Studio is Reserved for Authors & Writers
            </h1>
            <p className="text-sm text-[#544246] leading-relaxed">
              Your account persona is set to <strong className="text-[#9e3b5f]">Reader</strong>. Readers cannot write or publish stories, but you have full access to our light novel catalog, interactive reader, community discussions, and library bookmarks.
            </p>
          </div>

          <div className="bg-white/90 rounded-2xl p-5 border border-pink-100 max-w-md mx-auto text-left text-xs space-y-2 text-[#544246]">
            <div className="font-bold text-[#26152b] text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#9e3b5f]" />
              <span>Want to start writing your own light novel?</span>
            </div>
            <p>
              You can upgrade your persona to Author / Writer at any time to unlock manuscript authoring, auto-saving chapter drafts, and universe lore tools.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <button
              id="upgrade-to-writer-btn"
              onClick={async () => {
                await updateProfile({ role: 'WRITER', isVerifiedWriter: true });
                onCreateStory();
              }}
              className="btn-gradient px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer hover:scale-102 transition-transform"
            >
              <Feather className="w-4 h-4" />
              <span>Become a Writer & Start Writing</span>
            </button>
            <button
              onClick={async () => {
                await updateProfile({ role: 'WRITER', isVerifiedWriter: true });
              }}
              className="px-5 py-3.5 rounded-2xl font-bold text-sm bg-white text-[#544246] border border-pink-200 hover:bg-pink-50 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>Explore Writer Studio</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // GUEST / UNAUTHENTICATED AUTHOR LANDING
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 pb-28">
        
        {/* Hero Pitch Banner */}
        <section className="relative overflow-hidden rounded-3xl p-8 sm:p-14 border border-pink-200/90 shadow-xl bg-gradient-to-br from-[#fee7ff] via-white to-[#ffeffe] text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-pink-200 text-[#9e3b5f] text-xs font-bold shadow-xs">
            <Feather className="w-4 h-4 text-[#f47fa5]" />
            <span>KAIRO AUTHOR & WRITER STUDIO</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black font-display text-[#26152b] tracking-tight">
            Where light novels & original anime fiction <br />
            <span className="gradient-text">come alive.</span>
          </h1>

          <p className="text-sm sm:text-base text-[#544246] max-w-2xl mx-auto leading-relaxed">
            Welcome to the creative suite built specifically for serialized fiction writers, light novel authors, and anime worldbuilders.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
            <button
              id="guest-studio-login-btn"
              onClick={openAuthModal}
              className="btn-gradient px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer hover:scale-102 transition-transform"
            >
              <Feather className="w-4 h-4" />
              <span>Sign In / Join as Author</span>
            </button>

            <button
              id="guest-studio-demo-btn"
              onClick={async () => {
                await login('astral_scribe', 'pass123');
              }}
              className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-white hover:bg-pink-50 text-[#635882] border border-pink-200 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#9e3b5f]" />
              <span>Instant Author Demo</span>
            </button>
          </div>
        </section>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-3xl p-6 border border-pink-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9e3b5f] to-[#f47fa5] text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#26152b] font-display">Serialized Chapters & Auto-Save</h3>
            <p className="text-xs sm:text-sm text-[#544246] leading-relaxed">
              Distraction-free manuscript editor with live reader preview, word count targets, Japanese & Western dialogue formatting shortcuts, and local draft backup.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-purple-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#635882] text-white flex items-center justify-center shadow-md">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#26152b] font-display">Lore & World Codex Builder</h3>
            <p className="text-xs sm:text-sm text-[#544246] leading-relaxed">
              Organize continents, magic rules, technology matrices, and chronological era timelines so your fandom can immerse themselves in deep worldbuilding.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-pink-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f47fa5] text-white flex items-center justify-center shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#26152b] font-display">Character Relationship Webs</h3>
            <p className="text-xs sm:text-sm text-[#544246] leading-relaxed">
              Create rich character dossiers with ability ranks, personality traits, and an interactive connection network showing rivals, allies, and secret bonds.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#26152b] font-display">Reader Engagement Analytics</h3>
            <p className="text-xs sm:text-sm text-[#544246] leading-relaxed">
              Monitor reading streaks, follower retention, chapter completion rates, and reader comment sentiment across all your published works.
            </p>
          </div>
        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED CREATOR STUDIO DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:text-rose-800 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Studio Header Banner */}
      <section className="glass-card rounded-3xl p-6 sm:p-10 border border-pink-200/90 shadow-sm relative overflow-hidden bg-gradient-to-br from-[#fee7ff] via-white to-[#ffeffe]">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-pink-200 text-[#9e3b5f] text-xs font-bold">
              <Feather className="w-3.5 h-3.5" />
              <span>KAIRO CREATOR STUDIO</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-display text-[#26152b]">
              Welcome, <span className="gradient-text">{user.displayName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#544246] max-w-xl leading-relaxed">
              Manage your serial publications, build deep fictional continuity lore, and inspect reader engagement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="studio-new-story-btn"
              onClick={onCreateStory}
              className="btn-gradient px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer hover:scale-102 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Write New Story</span>
            </button>
          </div>
        </div>
      </section>

      {/* World & Character Quick Launch Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          id="studio-world-builder-card"
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
          id="studio-character-builder-card"
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
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#9e3b5f]" />
            <h2 className="text-xl font-bold font-display text-[#26152b]">Creator Analytics</h2>
          </div>
          <button
            onClick={loadStudioData}
            className="text-xs text-[#877276] hover:text-[#9e3b5f] flex items-center gap-1 cursor-pointer font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-4 border border-pink-100">
            <div className="text-xs font-bold text-[#877276] uppercase tracking-wider">Total Publications</div>
            <div className="text-2xl font-black font-display text-[#9e3b5f] mt-1">
              {stories.length}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-pink-100">
            <div className="text-xs font-bold text-[#877276] uppercase tracking-wider">Total Reads</div>
            <div className="text-2xl font-black font-display text-[#26152b] mt-1">
              {(stats?.totalReads ?? stories.reduce((acc, s) => acc + (s.views || 0), 0)).toLocaleString()}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-pink-100">
            <div className="text-xs font-bold text-[#877276] uppercase tracking-wider">Followers</div>
            <div className="text-2xl font-black font-display text-purple-700 mt-1">
              {(user.followersCount ?? stats?.followersCount ?? 0).toLocaleString()}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-pink-100">
            <div className="text-xs font-bold text-[#877276] uppercase tracking-wider">Completion Rate</div>
            <div className="text-2xl font-black font-display text-emerald-600 mt-1">
              {stats?.chapterCompletionRate ?? 88}%
            </div>
          </div>
        </div>
      </section>

      {/* Stories Section with Search & Filtering */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#9e3b5f]" />
            <h2 className="text-xl font-bold font-display text-[#26152b]">
              My Authored Stories ({stories.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#877276]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className="w-full h-8 pl-8 pr-3 rounded-xl bg-white border border-pink-200 text-xs text-[#26152b] outline-none focus:border-[#9e3b5f]"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="inline-flex p-0.5 bg-white rounded-xl border border-pink-100 text-xs">
              {(['All', 'Ongoing', 'Completed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === tab 
                      ? 'bg-[#fee7ff] text-[#9e3b5f] shadow-2xs' 
                      : 'text-[#544246] hover:text-[#26152b]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={onCreateStory}
              className="btn-gradient px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Story</span>
            </button>
          </div>
        </div>

        {/* Stories List */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-3xl p-8 border border-pink-100 space-y-4">
            <BookOpen className="w-12 h-12 mx-auto text-[#877276] opacity-40" />
            <h3 className="font-bold text-lg text-[#26152b]">No stories found</h3>
            <p className="text-xs text-[#877276] max-w-sm mx-auto">
              {stories.length === 0 
                ? "You haven't written any stories yet. Launch your first serialized novel or fanfiction!" 
                : "No stories match your current search and filter criteria."}
            </p>
            {stories.length === 0 && (
              <button
                onClick={onCreateStory}
                className="btn-gradient px-6 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-md"
              >
                Create First Story
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStories.map(story => {
              const isExpanded = expandedStoryId === story.id;
              const chaps = storyChapters[story.id] || [];
              const isChapsLoading = loadingChapters === story.id;

              return (
                <div
                  key={story.id}
                  className="glass-card rounded-3xl border border-pink-100 shadow-xs hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Story Card Header Bar */}
                  <div className="p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 bg-white/70">
                    <div className="flex items-start gap-4">
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        className="w-16 h-22 sm:w-20 sm:h-28 object-cover rounded-2xl shadow-xs shrink-0"
                      />
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#fee7ff] text-[#9e3b5f] text-[10px] font-bold uppercase">
                            {story.genre}
                          </span>
                          <span className="text-xs font-bold text-[#877276]">
                            {story.chaptersCount} Chapters
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            story.status === 'Ongoing' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : story.status === 'Completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-pink-100 text-[#9e3b5f]'
                          }`}>
                            {story.status}
                          </span>
                          <span className="text-[10px] text-[#877276] font-medium hidden sm:inline">
                            {story.storyType}
                          </span>
                        </div>

                        <h3 
                          onClick={() => onOpenStoryDetail(story.slug || story.id)}
                          className="font-bold text-base sm:text-lg text-[#26152b] font-display hover:text-[#9e3b5f] transition-colors cursor-pointer"
                        >
                          {story.title}
                        </h3>

                        <p className="text-xs text-[#544246] line-clamp-2 max-w-xl leading-relaxed">
                          {story.description}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-[#877276] font-medium pt-1">
                          <span>★ {story.rating ?? 0} ({story.ratingCount ?? 0})</span>
                          <span>•</span>
                          <span>{(story.views ?? 0).toLocaleString()} reads</span>
                          <span>•</span>
                          <span>{story.likes ?? 0} likes</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-pink-100">
                      
                      {/* Primary: Write Next Chapter */}
                      <button
                        id={`write-chapter-btn-${story.id}`}
                        onClick={() => onEditChapter(story.id)}
                        className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs hover:scale-102 transition-transform"
                      >
                        <Feather className="w-3.5 h-3.5" />
                        <span>+ Write Chapter</span>
                      </button>

                      {/* Manage Chapters Toggle */}
                      <button
                        id={`toggle-chapters-btn-${story.id}`}
                        onClick={() => toggleManageChapters(story.id)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                          isExpanded 
                            ? 'bg-[#fee7ff] text-[#9e3b5f] border-pink-300' 
                            : 'bg-white border-pink-200 text-[#544246] hover:bg-pink-50'
                        }`}
                      >
                        <span>Chapters ({story.chaptersCount})</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {/* Edit Story Metadata */}
                      <button
                        onClick={() => openEditStoryModal(story)}
                        className="p-2 rounded-xl bg-white border border-pink-200 text-[#544246] hover:bg-pink-50 cursor-pointer"
                        title="Edit story info & cover"
                      >
                        <Settings className="w-4 h-4" />
                      </button>

                      {/* Export Manuscript Backup */}
                      <button
                        onClick={() => handleExportManuscript(story)}
                        className="p-2 rounded-xl bg-white border border-pink-200 text-[#544246] hover:bg-pink-50 cursor-pointer"
                        title="Export manuscript as Markdown file"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* View Story in Reader */}
                      <button
                        onClick={() => onOpenStoryDetail(story.slug || story.id)}
                        className="px-3 py-2 rounded-xl bg-white border border-pink-200 text-[#544246] hover:bg-pink-50 text-xs font-semibold cursor-pointer"
                      >
                        Preview
                      </button>

                      {/* Delete Story */}
                      <button
                        onClick={() => setDeletingStoryId(story.id)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 cursor-pointer transition-colors"
                        title="Delete story"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Chapters Management Drawer */}
                  {isExpanded && (
                    <div className="border-t border-pink-100 bg-[#fffbfe] p-5 sm:p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Feather className="w-4 h-4 text-[#9e3b5f]" />
                          <h4 className="font-bold text-sm text-[#26152b] font-display">
                            Manage Published Chapters & Drafts
                          </h4>
                        </div>
                        <button
                          onClick={() => onEditChapter(story.id)}
                          className="btn-gradient px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Next Chapter</span>
                        </button>
                      </div>

                      {isChapsLoading ? (
                        <div className="text-center py-6 text-xs text-[#877276]">
                          <Sparkles className="w-4 h-4 animate-spin mx-auto mb-1 text-[#9e3b5f]" />
                          <span>Loading chapters...</span>
                        </div>
                      ) : chaps.length === 0 ? (
                        <div className="text-center py-6 glass-card rounded-2xl p-4 border border-dashed border-pink-200 text-xs text-[#877276]">
                          No chapters published yet. Click "Add Next Chapter" to write Chapter 1.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {chaps
                            .sort((a, b) => a.chapterNumber - b.chapterNumber)
                            .map(chap => (
                              <div
                                key={chap.id}
                                className="glass-card rounded-2xl p-3.5 sm:p-4 border border-pink-100 hover:border-pink-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-[#fee7ff] text-[#9e3b5f] font-black text-xs flex items-center justify-center shrink-0">
                                    {chap.chapterNumber}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-bold text-xs sm:text-sm text-[#26152b]">
                                        {chap.title}
                                      </h5>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        chap.status === 'Draft' || chap.status === 'draft' 
                                          ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {chap.status === 'Draft' || chap.status === 'draft' ? 'Draft' : 'Published'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-[#877276] mt-0.5">
                                      <span>{(chap.wordCount ?? 0).toLocaleString()} words</span>
                                      <span>•</span>
                                      <span>~{chap.readingTime ?? 1} min read</span>
                                      {chap.updatedAt && (
                                        <>
                                          <span>•</span>
                                          <span>Updated {new Date(chap.updatedAt).toLocaleDateString()}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                  {/* Read in reader */}
                                  {onReadChapter && (
                                    <button
                                      onClick={() => onReadChapter(story.slug || story.id, chap.chapterNumber)}
                                      className="px-2.5 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#9e3b5f] text-xs font-semibold cursor-pointer"
                                    >
                                      Read
                                    </button>
                                  )}

                                  {/* Edit chapter manuscript */}
                                  <button
                                    id={`edit-chapter-manuscript-${chap.id}`}
                                    onClick={() => onEditChapter(story.id, chap.id)}
                                    className="px-3 py-1.5 rounded-lg bg-white border border-pink-200 hover:bg-pink-50 text-[#544246] hover:text-[#9e3b5f] text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>

                                  {/* Delete chapter */}
                                  <button
                                    onClick={() => setDeletingChapterId(chap.id)}
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                                    title="Delete chapter"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Story Metadata Edit Modal */}
      {editingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl glass-card rounded-3xl p-6 sm:p-8 border border-pink-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#9e3b5f]" />
                <h3 className="font-black text-lg text-[#26152b] font-display">Edit Story Details</h3>
              </div>
              <button
                onClick={() => setEditingStory(null)}
                className="p-1.5 rounded-full hover:bg-pink-100 text-[#877276] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
                  Story Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-white border border-pink-200 text-sm font-semibold text-[#26152b] outline-none focus:border-[#9e3b5f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
                  Synopsis *
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-pink-200 text-xs text-[#544246] outline-none focus:border-[#9e3b5f]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
                    Genre
                  </label>
                  <select
                    value={editGenre}
                    onChange={e => setEditGenre(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-pink-200 text-xs font-medium text-[#26152b]"
                  >
                    {['Fantasy', 'Sci-Fi', 'Light Novel', 'Romance', 'Action', 'Isekai', 'Dark Fantasy', 'Mystery', 'Anime-Inspired'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
                    Publication Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as StoryStatus)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-pink-200 text-xs font-medium text-[#26152b]"
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#544246] mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  placeholder="e.g. Magic, Reincarnation, Academy"
                  className="w-full h-10 px-3.5 rounded-xl bg-white border border-pink-200 text-xs text-[#26152b] outline-none focus:border-[#9e3b5f]"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#544246]">
                  Cover Artwork
                </label>
                <ImageUploader
                  id="studio-edit-story-cover"
                  value={editCoverImage}
                  onChange={setEditCoverImage}
                  aspect="cover"
                  helperText="Upload a new cover image directly from your phone gallery or device storage"
                  placeholder="https://..."
                />
                <div>
                  <span className="block text-[10px] font-bold text-[#877276] uppercase tracking-wider mb-1.5">
                    Or select a preset artwork:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {COVER_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditCoverImage(p.url)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#9e3b5f] font-bold border border-pink-200 cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-100">
              <button
                type="button"
                onClick={() => setEditingStory(null)}
                className="px-4 py-2 rounded-xl bg-white border border-pink-200 text-xs font-bold text-[#544246] hover:bg-pink-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStoryEdit}
                disabled={savingEdit}
                className="btn-gradient px-5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Story Confirmation Modal */}
      {deletingStoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6 border border-pink-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-lg text-[#26152b] font-display">Delete this Story?</h3>
              <p className="text-xs text-[#877276]">
                This will permanently delete the entire story and all associated chapters. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeletingStoryId(null)}
                className="flex-1 py-2.5 rounded-xl bg-white border border-pink-200 text-xs font-bold text-[#544246] hover:bg-pink-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStory}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Story'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chapter Confirmation Modal */}
      {deletingChapterId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6 border border-pink-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-lg text-[#26152b] font-display">Delete this Chapter?</h3>
              <p className="text-xs text-[#877276]">
                This will permanently delete this chapter manuscript. Readers will no longer be able to read it.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeletingChapterId(null)}
                className="flex-1 py-2.5 rounded-xl bg-white border border-pink-200 text-xs font-bold text-[#544246] hover:bg-pink-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (expandedStoryId) {
                    handleDeleteChapter(expandedStoryId, deletingChapterId);
                  }
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Delete Chapter'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
