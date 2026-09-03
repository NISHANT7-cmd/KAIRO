import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, BookOpen, Plus, Quote as QuoteIcon, ArrowUpRight } from 'lucide-react';
import { QuoteSnippet, User } from '../../types';
import { api } from '../../services/api';

interface CommunityQuotesProps {
  user: User | null;
  onOpenStory?: (slug: string) => void;
  onRequireAuth?: () => void;
}

export const CommunityQuotes: React.FC<CommunityQuotesProps> = ({
  user,
  onOpenStory,
  onRequireAuth
}) => {
  const [quotes, setQuotes] = useState<QuoteSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [chapterNum, setChapterNum] = useState(1);
  const [theme, setTheme] = useState<'cosmic' | 'fantasy' | 'dark' | 'cyberpunk'>('cosmic');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const res = await api.getQuoteSnippets();
      setQuotes(res.quotes || []);
    } catch (err) {
      console.error('Failed to load quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeQuote = async (quoteId: string) => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    try {
      const res = await api.likeQuoteSnippet(quoteId);
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, likes: res.likes } : q));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth?.();
      return;
    }
    if (!quoteText.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.createQuoteSnippet({
        text: quoteText.trim(),
        storyTitle: storyTitle.trim() || 'Original Lore',
        authorName: authorName.trim() || 'Unknown',
        chapterNumber: Number(chapterNum) || 1,
        theme
      });
      setQuotes(prev => [res.quote, ...prev]);
      setShowCreateModal(false);
      setQuoteText('');
      setStoryTitle('');
      setAuthorName('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getThemeClasses = (t?: string) => {
    switch (t) {
      case 'dark':
        return 'bg-gradient-to-br from-[#1b121e] to-[#2d1b32] text-white border-purple-900/40';
      case 'fantasy':
        return 'bg-gradient-to-br from-[#fff6e6] to-[#feeacc] text-[#3e2c14] border-amber-200';
      case 'cyberpunk':
        return 'bg-gradient-to-br from-[#0e1726] to-[#1e1b4b] text-cyan-200 border-cyan-500/30';
      case 'cosmic':
      default:
        return 'bg-gradient-to-br from-[#2a132e] to-[#491a45] text-pink-100 border-pink-500/30';
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-xs text-[#877276]">Loading memorable story quotes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-black text-lg sm:text-xl text-[#26152b] flex items-center gap-2">
            <QuoteIcon className="w-5 h-5 text-[#9e3b5f]" />
            Story Highlights & Quotes
          </h2>
          <p className="text-xs text-[#877276] mt-0.5">Memorable prose immortalized by the KAIRO community</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-[#9e3b5f] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:opacity-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Quote</span>
        </button>
      </div>

      {/* Quotes Masonry / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotes.map(quote => (
          <div
            key={quote.id}
            className={`p-6 rounded-3xl border shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden transition-all hover:scale-[1.01] ${getThemeClasses(quote.theme)}`}
          >
            <div className="space-y-3">
              <QuoteIcon className="w-7 h-7 opacity-30" />
              <blockquote className="font-serif italic text-sm sm:text-base leading-relaxed">
                "{quote.text}"
              </blockquote>
            </div>

            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold opacity-90">{quote.storyTitle}</h4>
                  <p className="text-[11px] opacity-70">
                    Ch. {quote.chapterNumber} • {quote.authorName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleLikeQuote(quote.id)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
                  <span>{quote.likes || 0}</span>
                </button>
              </div>

              {quote.storySlug && onOpenStory && (
                <button
                  type="button"
                  onClick={() => onOpenStory(quote.storySlug!)}
                  className="w-full py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-center text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <span>Read Chapter</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Quote Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-pink-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100">
              <h3 className="font-display font-black text-base text-[#26152b]">
                Add Memorable Quote
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#26152b] mb-1">Quote Line</label>
                <textarea
                  required
                  rows={3}
                  value={quoteText}
                  onChange={e => setQuoteText(e.target.value)}
                  placeholder="Paste the memorable excerpt..."
                  className="w-full p-3 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#26152b] mb-1">Story Title</label>
                  <input
                    type="text"
                    required
                    value={storyTitle}
                    onChange={e => setStoryTitle(e.target.value)}
                    placeholder="e.g. Whispers of the Astral Sea"
                    className="w-full h-10 px-3 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#26152b] mb-1">Author Name</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    placeholder="Author"
                    className="w-full h-10 px-3 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#26152b] mb-1">Chapter #</label>
                  <input
                    type="number"
                    min={1}
                    value={chapterNum}
                    onChange={e => setChapterNum(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#9e3b5f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#26152b] mb-1">Card Theme</label>
                  <select
                    value={theme}
                    onChange={e => setTheme(e.target.value as any)}
                    className="w-full h-10 px-2 rounded-xl border border-pink-200 text-xs outline-none focus:border-[#9e3b5f] bg-white font-semibold"
                  >
                    <option value="cosmic">Cosmic Nebula</option>
                    <option value="dark">Midnight Void</option>
                    <option value="fantasy">Parchment Scroll</option>
                    <option value="cyberpunk">Cyber Neon</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#9e3b5f] text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Post Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
