import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Star, BookOpen, Heart, Bookmark, Share2, 
  UserPlus, UserCheck, ChevronRight, Clock, MessageSquare, 
  Lightbulb, Shield, Globe, ArrowLeft, Play 
} from 'lucide-react';
import { Story, Chapter, Review, Character, Theory, ReadingProgress } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface StoryDetailViewProps {
  storyIdOrSlug: string;
  onBack: () => void;
  onReadChapter: (storySlug: string, chapterNumber: number) => void;
  onOpenUniverse: (universeSlug: string) => void;
  onOpenAuthor: (username: string) => void;
}

export const StoryDetailView: React.FC<StoryDetailViewProps> = ({
  storyIdOrSlug,
  onBack,
  onReadChapter,
  onOpenUniverse,
  onOpenAuthor,
}) => {
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [theories, setTheories] = useState<Theory[]>([]);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);
  const [inLibrary, setInLibrary] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [activeTab, setActiveTab] = useState<'synopsis' | 'chapters' | 'characters' | 'reviews' | 'theories'>('synopsis');
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [userRating, setUserRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadStoryData();
  }, [storyIdOrSlug, user]);

  const loadStoryData = async () => {
    setLoading(true);
    try {
      const res = await api.getStory(storyIdOrSlug);
      setStory(res.story);
      setChapters(res.chapters || []);
      setReviews(res.reviews || []);

      const [charsRes, theoriesRes] = await Promise.all([
        api.getCharacters(),
        api.getTheories(res.story.id),
      ]);

      const storyChars = (charsRes.characters || []).filter(c => c.storyId === res.story.id || c.worldId);
      setCharacters(storyChars);
      setTheories(theoriesRes.theories || []);

      if (user) {
        const libRes = await api.getLibrary();
        const isInLib = (libRes.library || []).some(l => l.storyId === res.story.id);
        setInLibrary(isInLib);

        const progRes = await api.getReadingProgress();
        const curProg = (progRes.progress || []).find(p => p.storyId === res.story.id);
        setReadingProgress(curProg || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLibrary = async () => {
    if (!story || !user) return;
    try {
      const res = await api.toggleLibrary(story.id);
      setInLibrary(res.inLibrary);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLike = async () => {
    if (!story || !user) return;
    try {
      const res = await api.toggleLike(story.id);
      setIsLiked(res.liked);
      setStory(prev => prev ? { ...prev, likes: res.totalLikes } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFollow = async () => {
    if (!story || !user) return;
    try {
      const res = await api.toggleFollow(story.authorId);
      setIsFollowingAuthor(res.following);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!story || !user || !reviewText.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await api.addReview(story.id, userRating, reviewText);
      setReviews(prev => [res.review, ...prev.filter(r => r.userId !== user.id)]);
      setReviewText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-28 text-[#877276]">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#9e3b5f] animate-spin" />
        <p className="font-semibold text-sm">Opening story codex...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="text-center py-28 space-y-4">
        <h2 className="text-2xl font-bold text-[#26152b]">Story Not Found</h2>
        <button onClick={onBack} className="btn-gradient px-6 py-2.5 rounded-xl text-xs font-bold">
          Return Home
        </button>
      </div>
    );
  }

  const startChapterNum = readingProgress ? readingProgress.chapterNumber : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-28">
      
      {/* Back button */}
      <button
        id="story-back-btn"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-xs font-bold text-[#544246] border border-pink-100 shadow-2xs transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Stories</span>
      </button>

      {/* Cinematic Hero Header */}
      <section className="relative rounded-3xl overflow-hidden glass-card border border-pink-200/90 shadow-xl">
        {/* Background Blurred Cover */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={story.coverImage}
            alt={story.title}
            className="w-full h-full object-cover blur-2xl scale-125 opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fff7fb] via-[#fff7fb]/80 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Cover Art */}
          <div className="lg:col-span-4 max-w-[280px] mx-auto lg:mx-0">
            <div className="relative rounded-2xl overflow-hidden aspect-3/4 shadow-2xl border-2 border-white/80 group">
              <img
                src={story.coverImage}
                alt={story.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-[#9e3b5f] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                {story.genre}
              </div>
            </div>
          </div>

          {/* Story Meta & Actions */}
          <div className="lg:col-span-8 space-y-5">
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#fee7ff] text-[#9e3b5f] text-xs font-bold">
                {story.storyType}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 text-[#544246] border border-pink-100 text-xs font-semibold">
                {story.ageRating}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 text-[#544246] border border-pink-100 text-xs font-semibold">
                {story.status}
              </span>
              {story.universeName && (
                <button
                  onClick={() => onOpenUniverse(story.universeId || 'the-astral-universe')}
                  className="px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-[#635882] border border-purple-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-[#635882]" />
                  <span>{story.universeName}</span>
                </button>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-[#26152b] tracking-tight leading-tight">
              {story.title}
            </h1>

            {/* Author bar */}
            <div className="flex items-center gap-3">
              <img
                src={story.authorAvatar}
                alt={story.authorDisplayName}
                className="w-10 h-10 rounded-full object-cover border border-pink-200"
              />
              <div>
                <button
                  onClick={() => onOpenAuthor(story.authorUsername)}
                  className="font-bold text-sm text-[#26152b] hover:text-[#9e3b5f] transition-colors cursor-pointer text-left block"
                >
                  {story.authorDisplayName}
                </button>
                <div className="text-xs text-[#877276]">@{story.authorUsername}</div>
              </div>

              <button
                id="story-follow-author-btn"
                onClick={handleToggleFollow}
                className={`ml-2 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isFollowingAuthor
                    ? 'bg-purple-100 text-[#635882]'
                    : 'bg-white border border-pink-200 text-[#9e3b5f] hover:bg-[#fee7ff]'
                }`}
              >
                {isFollowingAuthor ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>{isFollowingAuthor ? 'Following' : 'Follow'}</span>
              </button>
            </div>

            {/* Stats Bento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-xs">
              <div className="p-3 rounded-2xl bg-white/70 border border-pink-100 text-center">
                <div className="font-black text-lg text-[#9e3b5f] flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-[#9e3b5f]" />
                  <span>{story.rating ?? 0}</span>
                </div>
                <div className="text-[#877276] text-[10px] font-semibold mt-0.5">({story.ratingCount ?? 0} reviews)</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/70 border border-pink-100 text-center">
                <div className="font-black text-lg text-[#26152b]">
                  {(story.views ?? 0).toLocaleString()}
                </div>
                <div className="text-[#877276] text-[10px] font-semibold mt-0.5">Total Reads</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/70 border border-pink-100 text-center">
                <div className="font-black text-lg text-[#26152b]">
                  {story.chaptersCount ?? 0}
                </div>
                <div className="text-[#877276] text-[10px] font-semibold mt-0.5">Chapters</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/70 border border-pink-100 text-center">
                <div className="font-black text-lg text-[#9e3b5f]">
                  {(story.likes ?? 0).toLocaleString()}
                </div>
                <div className="text-[#877276] text-[10px] font-semibold mt-0.5">Likes</div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="story-primary-read-btn"
                onClick={() => onReadChapter(story.slug || story.id, startChapterNum)}
                className="btn-gradient px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>{readingProgress ? `Resume Chapter ${readingProgress.chapterNumber}` : 'Start Reading'}</span>
              </button>

              <button
                id="story-toggle-library-btn"
                onClick={handleToggleLibrary}
                className={`px-4 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  inLibrary
                    ? 'bg-[#fee7ff] text-[#9e3b5f] border border-[#f47fa5]/50'
                    : 'bg-white/90 hover:bg-white text-[#544246] border border-pink-200'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${inLibrary ? 'fill-[#9e3b5f] text-[#9e3b5f]' : ''}`} />
                <span>{inLibrary ? 'In Library' : 'Add to Library'}</span>
              </button>

              <button
                id="story-like-btn"
                onClick={handleToggleLike}
                className={`p-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isLiked
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-white/90 hover:bg-white text-[#544246] border border-pink-200'
                }`}
                title="Like story"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-pink-100 overflow-x-auto hide-scrollbar">
        {[
          { id: 'synopsis', label: 'Synopsis & Lore' },
          { id: 'chapters', label: `Chapters (${chapters.length})` },
          { id: 'characters', label: `Characters (${characters.length})` },
          { id: 'reviews', label: `Reviews (${reviews.length})` },
          { id: 'theories', label: `Theories (${theories.length})` },
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`story-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                active 
                  ? 'border-[#9e3b5f] text-[#9e3b5f]' 
                  : 'border-transparent text-[#877276] hover:text-[#26152b]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: Synopsis */}
      {activeTab === 'synopsis' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-pink-100 space-y-4">
              <h3 className="font-bold text-lg text-[#26152b] font-display">Synopsis</h3>
              <p className="text-sm sm:text-base text-[#544246] leading-relaxed whitespace-pre-line">
                {story.description}
              </p>

              <div className="pt-4 border-t border-pink-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#877276] mb-2">Themes & Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {story.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-xl bg-[#fee7ff]/70 text-[#9e3b5f] text-xs font-bold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick First Chapter Preview CTA */}
            {chapters.length > 0 && (
              <div className="glass-card rounded-3xl p-6 border border-pink-100 flex items-center justify-between gap-4 bg-gradient-to-r from-pink-50/50 to-purple-50/50">
                <div>
                  <div className="text-xs font-bold text-[#9e3b5f]">FIRST CHAPTER AVAILABLE</div>
                  <h4 className="font-bold text-base text-[#26152b] font-display">
                    Chapter 1: {chapters[0].title}
                  </h4>
                  <p className="text-xs text-[#877276]">{chapters[0].readingTime} min read</p>
                </div>
                <button
                  onClick={() => onReadChapter(story.slug || story.id, 1)}
                  className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Read Chapter 1</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar: Story Meta Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-pink-100 space-y-4">
              <h4 className="font-bold text-sm text-[#26152b] font-display">Publication Details</h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-pink-50">
                  <span className="text-[#877276]">Format</span>
                  <span className="font-bold text-[#26152b]">{story.storyType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pink-50">
                  <span className="text-[#877276]">Language</span>
                  <span className="font-bold text-[#26152b]">{story.language}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pink-50">
                  <span className="text-[#877276]">Age Rating</span>
                  <span className="font-bold text-[#26152b]">{story.ageRating}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pink-50">
                  <span className="text-[#877276]">First Published</span>
                  <span className="font-bold text-[#26152b]">{new Date(story.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#877276]">Last Update</span>
                  <span className="font-bold text-[#26152b]">{new Date(story.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Chapters List */}
      {activeTab === 'chapters' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-pink-100 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-pink-100">
            <h3 className="font-bold text-lg text-[#26152b] font-display">All Serialized Chapters</h3>
            <span className="text-xs font-bold text-[#877276]">{chapters.length} Chapters Released</span>
          </div>

          <div className="divide-y divide-pink-100">
            {chapters.map(chap => (
              <div
                key={chap.id}
                id={`chapter-row-${chap.chapterNumber}`}
                onClick={() => onReadChapter(story.slug || story.id, chap.chapterNumber)}
                className="py-4 flex items-center justify-between gap-4 hover:bg-[#fee7ff]/30 px-3 rounded-2xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-pink-100/70 text-[#9e3b5f] font-black text-sm flex items-center justify-center font-display group-hover:bg-[#9e3b5f] group-hover:text-white transition-colors">
                    {chap.chapterNumber}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#26152b] group-hover:text-[#9e3b5f] transition-colors">
                      {chap.title}
                    </h4>
                    {chap.subtitle && (
                      <p className="text-xs text-[#877276] line-clamp-1">{chap.subtitle}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#877276]">
                      <Clock className="w-3 h-3" />
                      <span>{chap.readingTime} min read</span>
                      <span>•</span>
                      <span>{(chap.wordCount ?? 0).toLocaleString()} words</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#9e3b5f] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Read</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 3: Characters */}
      {activeTab === 'characters' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map(char => (
              <div
                key={char.id}
                className="glass-card rounded-3xl p-5 border border-pink-100 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={char.portrait}
                    alt={char.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-pink-200 shadow-xs"
                  />
                  <div>
                    <div className="px-2 py-0.5 rounded-md bg-[#fee7ff] text-[#9e3b5f] text-[10px] font-bold uppercase inline-block">
                      {char.role}
                    </div>
                    <h4 className="font-bold text-base text-[#26152b] font-display mt-0.5">
                      {char.name}
                    </h4>
                    <span className="text-xs text-[#877276]">Age: {char.age}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 pt-2 border-t border-pink-100">
                  <div className="text-[#9e3b5f] font-semibold">
                    Power: {char.primaryPower}
                  </div>
                  <p className="text-[#544246] line-clamp-3 leading-relaxed">
                    {char.biography}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 4: Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-8">
          {/* Review input form */}
          {user && (
            <form onSubmit={handleSubmitReview} className="glass-card rounded-3xl p-6 border border-pink-200/80 space-y-4">
              <h4 className="font-bold text-base text-[#26152b] font-display">Leave a Reader Review</h4>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#544246]">Your Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star className={`w-5 h-5 ${star <= userRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                required
                rows={3}
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Share your thoughts on the worldbuilding, character dynamics, and pacing..."
                className="w-full p-3.5 rounded-2xl bg-white border border-pink-200/80 focus:border-[#9e3b5f] outline-none text-xs sm:text-sm text-[#26152b]"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="btn-gradient px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          )}

          {/* Existing reviews list */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-[#877276]">
                No reviews yet. Be the first to leave a review!
              </div>
            ) : (
              reviews.map(rev => (
                <div key={rev.id} className="glass-card rounded-3xl p-5 border border-pink-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={rev.userAvatar} alt={rev.username} className="w-8 h-8 rounded-full object-cover" />
                      <span className="font-bold text-xs text-[#26152b]">{rev.username}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{rev.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-[#544246] leading-relaxed pt-1">
                    {rev.reviewText}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab Content 5: Theories */}
      {activeTab === 'theories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-[#26152b] font-display">Canon & Fan Theories</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {theories.map(th => (
              <div key={th.id} className="glass-card rounded-3xl p-5 border border-pink-100 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    th.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-pink-100 text-[#9e3b5f]'
                  }`}>
                    {th.status}
                  </span>
                  <span className="text-[11px] text-[#877276]">Ch. {th.chapterReference} Ref</span>
                </div>

                <h4 className="font-bold text-sm text-[#26152b] font-display">
                  {th.title}
                </h4>

                <p className="text-xs text-[#544246] leading-relaxed line-clamp-3">
                  {th.description}
                </p>

                <div className="flex items-center justify-between text-xs font-bold text-[#877276] pt-2 border-t border-pink-50">
                  <span>By @{th.authorUsername}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#9e3b5f]">+{th.agreeCount} agreed</span>
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
