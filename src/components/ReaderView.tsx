import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Settings, MessageSquare, ChevronLeft, ChevronRight, 
  Sparkles, Heart, Bookmark, Eye, EyeOff, ThumbsUp, Send, Share2, 
  CheckCircle2, Type 
} from 'lucide-react';
import { Chapter, Story, ChapterComment } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useReader } from '../context/ReaderContext';
import confetti from 'canvas-confetti';

interface ReaderViewProps {
  storySlug: string;
  chapterNumber: number;
  onExit: () => void;
  onSelectChapter: (num: number) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  storySlug,
  chapterNumber,
  onExit,
  onSelectChapter,
}) => {
  const { user } = useAuth();
  const { settings, updateSettings } = useReader();

  const [story, setStory] = useState<Story | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings & comments drawers
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [spoilersUnlocked, setSpoilersUnlocked] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Scroll Progress
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChapterData();
    window.scrollTo(0, 0);
  }, [storySlug, chapterNumber]);

  const loadChapterData = async () => {
    setLoading(true);
    try {
      const storyRes = await api.getStory(storySlug);
      setStory(storyRes.story);
      const chaps = storyRes.chapters || [];
      setAllChapters(chaps);

      const targetChap = chaps.find(c => c.chapterNumber === Number(chapterNumber)) || chaps[0];
      if (targetChap) {
        setChapter(targetChap);
        const commRes = await api.getChapterComments(targetChap.id);
        setComments(commRes.comments || []);

        if (user) {
          await api.saveReadingProgress({
            storyId: storyRes.story.id,
            chapterId: targetChap.id,
            chapterNumber: targetChap.chapterNumber,
            progressPercent: Math.round((targetChap.chapterNumber / chaps.length) * 100),
            lastPosition: 0,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Scroll Progress Handler
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const current = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, current)));

        if (current >= 95 && chapterNumber === allChapters.length) {
          // Trigger celebratory confetti on finishing final chapter!
          try {
            confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
          } catch (e) {}
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [allChapters.length, chapterNumber]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapter || !story || !user || !newCommentText.trim()) return;
    try {
      const res = await api.addChapterComment(chapter.id, story.id, newCommentText);
      setComments(prev => [res.comment, ...prev]);
      setNewCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostReply = async (parentId: string) => {
    if (!chapter || !story || !user || !replyText.trim()) return;
    try {
      const res = await api.addChapterComment(chapter.id, story.id, replyText, parentId);
      setComments(prev => prev.map(c => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies || []), res.comment] };
        }
        return c;
      }));
      setReplyText('');
      setReplyingToId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;
    try {
      const res = await api.likeComment(commentId);
      if (res.comment) {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: res.comment.likes, likedByUsers: res.comment.likedByUsers } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#877276] space-y-3 bg-[#fff7fb]">
        <Sparkles className="w-8 h-8 mx-auto text-[#9e3b5f] animate-spin" />
        <p className="font-semibold text-sm">Opening chapter...</p>
      </div>
    );
  }

  if (!chapter || !story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#877276] space-y-4 px-4 bg-[#fff7fb]">
        <h2 className="text-2xl font-bold font-display text-[#26152b]">Chapter Not Found</h2>
        <p className="text-sm text-[#877276] text-center max-w-sm">The chapter or story you were trying to read could not be loaded.</p>
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9e3b5f] text-white text-xs font-bold shadow-md hover:bg-[#852e4e] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Story</span>
        </button>
      </div>
    );
  }

  const prevChapter = allChapters.find(c => c.chapterNumber === chapter.chapterNumber - 1);
  const nextChapter = allChapters.find(c => c.chapterNumber === chapter.chapterNumber + 1);

  // Styling theme classes
  const themeClass = 
    settings.theme === 'sepia' 
      ? 'reader-theme-sepia' 
      : settings.theme === 'dark' 
      ? 'reader-theme-dark' 
      : 'reader-theme-light';

  const fontClass = 
    settings.fontFamily === 'serif' 
      ? 'font-serif' 
      : settings.fontFamily === 'mono' 
      ? 'font-mono' 
      : 'font-sans';

  const widthClass = 
    settings.readerWidth === 'narrow' 
      ? 'max-w-xl' 
      : settings.readerWidth === 'wide' 
      ? 'max-w-4xl' 
      : 'max-w-2xl';

  return (
    <div className={`min-h-screen transition-colors duration-200 ${themeClass}`}>
      
      {/* Top Floating Reading Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-pink-200/50 backdrop-blur-md">
        {/* Top Scroll Indicator */}
        <div className="w-full h-1 bg-pink-100/40">
          <div 
            className="h-full bg-gradient-to-r from-[#9e3b5f] to-[#f47fa5] transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="reader-exit-btn"
              onClick={onExit}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Exit Reader"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="overflow-hidden">
              <h2 className="font-bold text-xs sm:text-sm truncate">{story.title}</h2>
              <p className="text-[11px] opacity-70 truncate">
                Chapter {chapter.chapterNumber}: {chapter.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="reader-settings-toggle"
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Reader Settings"
            >
              <Type className="w-5 h-5" />
            </button>

            <button
              id="reader-comments-toggle"
              onClick={() => setShowCommentsDrawer(!showCommentsDrawer)}
              className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Chapter Discussion"
            >
              <MessageSquare className="w-5 h-5" />
              {comments.length > 0 && (
                <span className="absolute top-1 right-1 px-1 py-0.2 bg-[#9e3b5f] text-white text-[9px] font-bold rounded-full">
                  {comments.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Reader Settings Drawer */}
      {showSettingsDrawer && (
        <div className="max-w-md mx-auto px-4 mt-2 mb-6">
          <div className="glass-card rounded-3xl p-5 border border-pink-200/80 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#9e3b5f]">Reader Customization</h4>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="text-xs font-semibold hover:underline"
              >
                Done
              </button>
            </div>

            {/* Themes */}
            <div>
              <label className="text-xs font-bold block mb-1.5 opacity-80">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light', label: 'Ethereal Light', bg: 'bg-[#fff7fb] text-[#26152b]' },
                  { id: 'sepia', label: 'Vintage Sepia', bg: 'bg-[#f7eedb] text-[#433324]' },
                  { id: 'dark', label: 'Midnight Dark', bg: 'bg-[#1a151e] text-[#f5e8f4]' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => updateSettings({ theme: t.id as any })}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${t.bg} ${
                      settings.theme === t.id ? 'border-[#9e3b5f] ring-2 ring-pink-300' : 'border-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family & Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold block mb-1.5 opacity-80">Typography</label>
                <div className="flex rounded-xl overflow-hidden border border-pink-200">
                  {['sans', 'serif', 'mono'].map(f => (
                    <button
                      key={f}
                      onClick={() => updateSettings({ fontFamily: f as any })}
                      className={`flex-1 py-1.5 text-xs font-bold capitalize ${
                        settings.fontFamily === f ? 'bg-[#9e3b5f] text-white' : 'bg-white text-[#544246]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1.5 opacity-80">Font Size ({settings.fontSize}px)</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })}
                    className="flex-1 py-1.5 bg-white border border-pink-200 rounded-xl text-xs font-bold text-[#26152b]"
                  >
                    A-
                  </button>
                  <button
                    onClick={() => updateSettings({ fontSize: Math.min(26, settings.fontSize + 1) })}
                    className="flex-1 py-1.5 bg-white border border-pink-200 rounded-xl text-xs font-bold text-[#26152b]"
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Chapter Content Container */}
      <main ref={containerRef} className={`${widthClass} mx-auto px-5 sm:px-8 py-10 sm:py-16 space-y-8`}>
        
        {/* Chapter Header */}
        <div className="text-center space-y-3 pb-8 border-b border-pink-200/50">
          <span className="px-3.5 py-1 rounded-full bg-[#fee7ff] text-[#9e3b5f] text-xs font-bold uppercase tracking-widest inline-block">
            CHAPTER {chapter.chapterNumber}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight">
            {chapter.title}
          </h1>
          {chapter.subtitle && (
            <p className="text-sm sm:text-base opacity-75 font-serif italic">
              — {chapter.subtitle} —
            </p>
          )}
          <div className="text-xs opacity-60 flex items-center justify-center gap-3 pt-1">
            <span>{chapter.wordCount} words</span>
            <span>•</span>
            <span>{chapter.readingTime} min read</span>
          </div>
        </div>

        {/* Chapter Body Manuscript */}
        <div 
          className={`space-y-6 leading-relaxed ${fontClass}`}
          style={{ 
            fontSize: `${settings.fontSize}px`, 
            lineHeight: settings.lineHeight 
          }}
        >
          {chapter.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-justify indent-6 sm:indent-8">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Chapter End & Navigation Controls */}
        <div className="pt-12 pb-8 border-t border-pink-200/50 space-y-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#9e3b5f]">
              End of Chapter {chapter.chapterNumber}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            {prevChapter ? (
              <button
                id="reader-prev-chapter-btn"
                onClick={() => onSelectChapter(prevChapter.chapterNumber)}
                className="flex-1 px-4 py-3 rounded-2xl glass-card border border-pink-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-[#fee7ff]/50 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev: Chapter {prevChapter.chapterNumber}</span>
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {nextChapter ? (
              <button
                id="reader-next-chapter-btn"
                onClick={() => onSelectChapter(nextChapter.chapterNumber)}
                className="flex-1 px-4 py-3 rounded-2xl btn-gradient font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Next: Chapter {nextChapter.chapterNumber}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex-1 text-center py-3 rounded-2xl bg-pink-100/50 text-[#9e3b5f] font-bold text-xs">
                You've caught up to the latest chapter!
              </div>
            )}
          </div>
        </div>

        {/* Spoiler-Protected Chapter Discussions Section */}
        <section className="glass-card rounded-3xl p-6 sm:p-8 border border-pink-200/80 shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#9e3b5f]" />
              <h3 className="font-bold text-lg font-display">Chapter Discussions</h3>
            </div>
            
            <button
              id="toggle-spoiler-btn"
              onClick={() => setSpoilersUnlocked(!spoilersUnlocked)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                spoilersUnlocked
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800 animate-pulse'
              }`}
            >
              {spoilersUnlocked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{spoilersUnlocked ? 'Spoilers Unlocked' : 'Unlock Chapter Spoilers'}</span>
            </button>
          </div>

          {!spoilersUnlocked ? (
            <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-center space-y-3">
              <EyeOff className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="font-bold text-sm text-amber-900">Chapter Comments Are Hidden to Protect Spoilers</h4>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                Discussions in this section directly reference plot developments in Chapter {chapter.chapterNumber}. Click below when you are ready.
              </p>
              <button
                onClick={() => setSpoilersUnlocked(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
              >
                Reveal Discussion
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Comment Input */}
              {user && (
                <form onSubmit={handlePostComment} className="space-y-3">
                  <textarea
                    rows={2}
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    placeholder={`Share your reaction to Chapter ${chapter.chapterNumber}...`}
                    className="w-full p-3.5 rounded-2xl bg-white border border-pink-200 focus:border-[#9e3b5f] outline-none text-xs sm:text-sm text-[#26152b]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newCommentText.trim()}
                      className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Reaction</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Comments Thread */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#877276]">
                    No comments on this chapter yet. Share your theory or reaction first!
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="p-4 rounded-2xl bg-white/70 border border-pink-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={comment.userAvatar}
                            alt={comment.username}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <span className="font-bold text-xs text-[#26152b]">{comment.username}</span>
                        </div>
                        <span className="text-[10px] text-[#877276]">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-[#544246] leading-relaxed">
                        {comment.content}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-semibold text-[#877276] pt-1">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className="flex items-center gap-1 hover:text-[#9e3b5f] cursor-pointer"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{comment.likes}</span>
                        </button>

                        <button
                          onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                          className="hover:text-[#9e3b5f] cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>

                      {/* Reply input */}
                      {replyingToId === comment.id && (
                        <div className="pt-2 flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-xs outline-none"
                          />
                          <button
                            onClick={() => handlePostReply(comment.id)}
                            className="btn-gradient px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Send
                          </button>
                        </div>
                      )}

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="pl-6 pt-2 space-y-2 border-l-2 border-pink-200">
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="p-2.5 rounded-xl bg-[#fee7ff]/40 space-y-1">
                              <div className="flex items-center gap-2">
                                <img src={reply.userAvatar} alt={reply.username} className="w-5 h-5 rounded-full object-cover" />
                                <span className="font-bold text-[11px] text-[#26152b]">{reply.username}</span>
                              </div>
                              <p className="text-[11px] text-[#544246]">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

      </main>

    </div>
  );
};
