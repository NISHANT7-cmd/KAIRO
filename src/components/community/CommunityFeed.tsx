import React, { useState } from 'react';
import { 
  ThumbsUp, MessageSquare, Bookmark, Share2, Pin, Lock, 
  AlertTriangle, CheckCircle2, Flame, Sparkles, Send, MoreVertical,
  Flag, Heart, BookOpen, UserPlus, Eye, Filter, ArrowUpRight
} from 'lucide-react';
import { CommunityPost, User } from '../../types';
import { api } from '../../services/api';

interface CommunityFeedProps {
  posts: CommunityPost[];
  user: User | null;
  onPostUpdated: (updatedPost: CommunityPost) => void;
  onOpenStory?: (slug: string) => void;
  onRequireAuth?: () => void;
  onReportContent: (type: string, id: string) => void;
  activeTagFilter: string;
  onTagFilterChange: (tag: string) => void;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  posts,
  user,
  onPostUpdated,
  onOpenStory,
  onRequireAuth,
  onReportContent,
  activeTagFilter,
  onTagFilterChange
}) => {
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentIsSpoiler, setCommentIsSpoiler] = useState<Record<string, boolean>>({});
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleSpoilerReveal = (postId: string) => {
    setRevealedSpoilers(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    try {
      const res = await api.likeCommunityPost(postId);
      const target = posts.find(p => p.id === postId);
      if (target) {
        const isLiked = target.likedByUsers?.includes(user.id);
        const updatedUsers = isLiked 
          ? target.likedByUsers.filter(id => id !== user.id)
          : [...(target.likedByUsers || []), user.id];
        onPostUpdated({ ...target, likes: res.likes, likedByUsers: updatedUsers });
      }
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleSave = async (postId: string) => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    try {
      const res = await api.saveCommunityPost(postId);
      const target = posts.find(p => p.id === postId);
      if (target) {
        onPostUpdated({ ...target, isSaved: res.isSaved });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = async (postId: string) => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    try {
      const res = await api.followCommunityPost(postId);
      const target = posts.find(p => p.id === postId);
      if (target) {
        onPostUpdated({ ...target, isFollowing: res.isFollowing });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVotePoll = async (postId: string, optionId: string) => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    try {
      const res = await api.voteCommunityPoll(postId, optionId);
      onPostUpdated(res.post);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoteTheory = async (postId: string, vote: 'agree' | 'disagree') => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    try {
      const res = await api.voteCommunityPost(postId, vote);
      onPostUpdated(res.post);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await api.addCommunityPostComment(postId, {
        content: text,
        isSpoiler: commentIsSpoiler[postId] || false
      });
      const target = posts.find(p => p.id === postId);
      if (target) {
        onPostUpdated({
          ...target,
          commentsCount: (target.commentsCount || 0) + 1,
          comments: [...(target.comments || []), res.comment]
        });
      }
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setCommentIsSpoiler(prev => ({ ...prev, [postId]: false }));
    } catch (err) {
      console.error('Failed to comment:', err);
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Filter and sort posts
  const filteredPosts = posts.filter(post => {
    if (activeTagFilter === 'ALL') return true;
    if (activeTagFilter === 'THEORY') return post.type === 'THEORY' || post.tag?.toLowerCase().includes('theory');
    if (activeTagFilter === 'POLL') return post.type === 'POLL' || post.poll;
    if (activeTagFilter === 'ART') return post.type === 'ART' || post.mediaType === 'image';
    if (activeTagFilter === 'RECOMMENDATION') return post.type === 'RECOMMENDATION' || post.recommendation;
    if (activeTagFilter === 'ANNOUNCEMENT') return post.type === 'ANNOUNCEMENT' || post.isPinned;
    return true;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'new') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'top') {
      return (b.likes || 0) - (a.likes || 0);
    }
    // Hot (likes + comments)
    const hotA = (a.likes || 0) * 2 + (a.commentsCount || 0) * 3;
    const hotB = (b.likes || 0) * 2 + (b.commentsCount || 0) * 3;
    return hotB - hotA;
  });

  return (
    <div className="space-y-6">
      {/* Feed Filters & Sorting */}
      <div className="glass-card rounded-2xl p-3 border border-pink-100 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* Category Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Topics' },
            { id: 'THEORY', label: 'Theories & Lore' },
            { id: 'POLL', label: 'Polls' },
            { id: 'ART', label: 'Fan Art & Media' },
            { id: 'RECOMMENDATION', label: 'Recommendations' },
            { id: 'ANNOUNCEMENT', label: 'Announcements' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => onTagFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTagFilter === tab.id
                  ? 'bg-[#9e3b5f] text-white shadow-2xs'
                  : 'bg-white/70 text-[#544246] hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1 bg-white/70 p-1 rounded-xl border border-pink-100/80 text-xs font-semibold">
          <button
            onClick={() => setSortBy('hot')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              sortBy === 'hot' ? 'bg-[#9e3b5f] text-white' : 'text-[#544246] hover:text-[#9e3b5f]'
            }`}
          >
            🔥 Hot
          </button>
          <button
            onClick={() => setSortBy('new')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              sortBy === 'new' ? 'bg-[#9e3b5f] text-white' : 'text-[#544246] hover:text-[#9e3b5f]'
            }`}
          >
            ✨ Newest
          </button>
          <button
            onClick={() => setSortBy('top')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              sortBy === 'top' ? 'bg-[#9e3b5f] text-white' : 'text-[#544246] hover:text-[#9e3b5f]'
            }`}
          >
            🏆 Top
          </button>
        </div>
      </div>

      {/* Posts Stream */}
      {sortedPosts.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-pink-100 space-y-3">
          <Sparkles className="w-8 h-8 text-pink-300 mx-auto" />
          <h3 className="font-display font-bold text-base text-[#26152b]">No posts found in this category</h3>
          <p className="text-xs text-[#877276]">Be the first to start a conversation, poll, or theory!</p>
        </div>
      ) : (
        sortedPosts.map(post => {
          const isLiked = user ? post.likedByUsers?.includes(user.id) : false;
          const isSpoilerHidden = post.isSpoiler && !revealedSpoilers[post.id];
          const hasCommentsOpen = expandedComments[post.id];

          return (
            <article 
              key={post.id}
              id={`community-post-${post.id}`}
              className="glass-card rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-sm space-y-4 hover:border-pink-200 transition-all bg-white/80"
            >
              {/* Post Header: Author, Community & Badges */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={post.authorDisplayName || post.authorUsername}
                    className="w-10 h-10 rounded-2xl object-cover border border-pink-100 shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-[#26152b]">
                        {post.authorDisplayName || post.authorUsername}
                      </span>
                      {post.isAuthorOfStory && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[10px] font-black tracking-wide">
                          CREATOR
                        </span>
                      )}
                      {post.isPinned && (
                        <span className="px-1.5 py-0.2 rounded bg-pink-100 text-[#9e3b5f] text-[10px] font-bold flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" /> PINNED
                        </span>
                      )}
                      {post.isLocked && (
                        <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 text-[10px] font-bold flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> LOCKED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#877276] mt-0.5">
                      <span className="font-semibold text-[#9e3b5f]">{post.communityName || 'KAIRO Community'}</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      {post.tag && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-0.2 rounded-md bg-pink-50 text-[#9e3b5f] font-semibold text-[10px]">
                            {post.tag}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* More actions: Report */}
                <button
                  onClick={() => onReportContent('post', post.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                  title="Report Post"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                {post.title && (
                  <h3 className="font-display font-black text-base sm:text-lg text-[#26152b] leading-snug">
                    {post.title}
                  </h3>
                )}

                {/* Spoiler Handling */}
                {isSpoilerHidden ? (
                  <div
                    onClick={() => toggleSpoilerReveal(post.id)}
                    className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 cursor-pointer flex items-center justify-between group hover:bg-amber-100/70 transition-all"
                  >
                    <div className="flex items-center gap-2.5 text-amber-900 text-xs font-semibold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Contains Spoilers {post.spoilerChapter ? `(Through Chapter ${post.spoilerChapter})` : ''}</span>
                    </div>
                    <span className="text-xs font-bold text-amber-700 group-hover:underline">
                      Click to reveal
                    </span>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-[#3a2830] leading-relaxed whitespace-pre-line">
                    {post.content}
                    {post.isSpoiler && (
                      <span 
                        onClick={() => toggleSpoilerReveal(post.id)}
                        className="block text-[11px] text-amber-700 font-bold mt-1.5 cursor-pointer hover:underline"
                      >
                        Hide spoiler
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Special Payload: Theory Agree/Disagree Poll */}
              {post.type === 'THEORY' && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-100 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#26152b]">
                    <span className="flex items-center gap-1.5 text-purple-700">
                      <Sparkles className="w-3.5 h-3.5" /> Community Theory Consensus
                    </span>
                    <span>
                      {((post.agreeCount || 0) + (post.disagreeCount || 0))} votes
                    </span>
                  </div>

                  {/* Agree vs Disagree Bar */}
                  {((post.agreeCount || 0) + (post.disagreeCount || 0)) > 0 && (
                    <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden flex">
                      <div 
                        className="bg-purple-600 h-full transition-all" 
                        style={{ width: `${Math.round(((post.agreeCount || 0) / ((post.agreeCount || 0) + (post.disagreeCount || 0))) * 100)}%` }}
                      />
                      <div 
                        className="bg-pink-400 h-full transition-all" 
                        style={{ width: `${Math.round(((post.disagreeCount || 0) / ((post.agreeCount || 0) + (post.disagreeCount || 0))) * 100)}%` }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleVoteTheory(post.id, 'agree')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        post.userVote === 'agree'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                          : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Agree ({post.agreeCount || 0})</span>
                    </button>

                    <button
                      onClick={() => handleVoteTheory(post.id, 'disagree')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        post.userVote === 'disagree'
                          ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                          : 'bg-white text-pink-700 border-pink-200 hover:bg-pink-50'
                      }`}
                    >
                      <span>Disagree ({post.disagreeCount || 0})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Special Payload: Poll Card */}
              {post.poll && (
                <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-2.5">
                  <h4 className="font-bold text-xs text-[#26152b]">{post.poll.question}</h4>
                  <div className="space-y-2">
                    {post.poll.options.map(opt => {
                      const total = post.poll?.totalVotes || 1;
                      const count = opt.votes.length;
                      const percent = Math.round((count / total) * 100);
                      const isSelected = post.userVotedOptionId === opt.id || (user && opt.votes.includes(user.id));

                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleVotePoll(post.id, opt.id)}
                          className={`relative overflow-hidden p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-white border-[#9e3b5f] shadow-2xs' 
                              : 'bg-white/70 border-pink-100 hover:bg-white'
                          }`}
                        >
                          <div 
                            className="absolute top-0 bottom-0 left-0 bg-pink-200/40 pointer-events-none transition-all"
                            style={{ width: `${percent}%` }}
                          />
                          <div className="relative z-10 flex items-center justify-between text-xs font-medium">
                            <span className="text-[#26152b] font-semibold">{opt.text}</span>
                            <span className="text-[11px] font-bold text-[#9e3b5f]">{percent}% ({count})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-[#877276] text-right">
                    {post.poll.totalVotes} total votes
                  </p>
                </div>
              )}

              {/* Special Payload: Fan Art Media Image */}
              {post.mediaUrl && post.mediaType === 'image' && (
                <div className="rounded-2xl overflow-hidden border border-pink-100 max-h-96">
                  <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Special Payload: Recommendation Card */}
              {post.recommendation && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#9e3b5f]">
                      Recommended {post.recommendation.category}
                    </span>
                    <h4 className="font-bold text-xs text-[#26152b] mt-0.5">{post.recommendation.title}</h4>
                    {post.recommendation.note && (
                      <p className="text-[11px] text-[#877276] italic mt-0.5">{post.recommendation.note}</p>
                    )}
                  </div>
                  {post.recommendation.linkSlug && onOpenStory && (
                    <button
                      onClick={() => onOpenStory(post.recommendation!.linkSlug!)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-xs font-bold text-[#9e3b5f] flex items-center gap-1 hover:bg-pink-50 cursor-pointer shadow-2xs"
                    >
                      <span>Read Story</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Interaction Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-pink-100/70 text-xs text-[#877276]">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                      isLiked 
                        ? 'bg-pink-100/80 text-[#9e3b5f] font-bold' 
                        : 'hover:bg-pink-50 text-[#544246]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
                    <span>{post.likes || 0}</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl hover:bg-pink-50 text-[#544246] transition-all cursor-pointer font-semibold"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentsCount || post.comments?.length || 0}</span>
                  </button>

                  <button
                    onClick={() => handleSave(post.id)}
                    className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl hover:bg-pink-50 transition-all cursor-pointer ${
                      post.isSaved ? 'text-[#9e3b5f] font-bold' : 'text-[#544246]'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-[#9e3b5f]' : ''}`} />
                    <span className="hidden sm:inline">{post.isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFollow(post.id)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                      post.isFollowing 
                        ? 'bg-purple-50 text-purple-700 border-purple-200' 
                        : 'border-transparent text-[#877276] hover:bg-pink-50'
                    }`}
                  >
                    {post.isFollowing ? 'Following updates' : 'Follow'}
                  </button>
                </div>
              </div>

              {/* Threaded Comments Section */}
              {hasCommentsOpen && (
                <div className="pt-4 border-t border-pink-100 space-y-4 animate-in fade-in">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#9e3b5f]">
                    Discussion Replies ({post.comments?.length || 0})
                  </h4>

                  {/* Comment Input */}
                  {!post.isLocked && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder={user ? "Add to the discussion..." : "Sign in to leave a reply"}
                          disabled={!user || submittingComment[post.id]}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          className="flex-1 h-10 px-3.5 rounded-xl bg-pink-50/50 border border-pink-200 focus:bg-white focus:border-[#9e3b5f] outline-none text-xs font-medium text-[#26152b]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!user || !commentInputs[post.id]?.trim() || submittingComment[post.id]}
                          className="h-10 px-4 rounded-xl bg-[#9e3b5f] text-white font-bold text-xs flex items-center gap-1 shadow-2xs disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCommentIsSpoiler(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                            commentIsSpoiler[post.id]
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-transparent text-[#877276] border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          Spoiler tag
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List Comments */}
                  <div className="space-y-3">
                    {(!post.comments || post.comments.length === 0) ? (
                      <p className="text-xs text-[#877276] italic">No replies yet. Join the discussion above!</p>
                    ) : (
                      post.comments.map(c => (
                        <div key={c.id} className="p-3 rounded-2xl bg-pink-50/30 border border-pink-100/60 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={c.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80'}
                                alt={c.authorDisplayName || c.authorUsername}
                                className="w-6 h-6 rounded-lg object-cover"
                              />
                              <span className="font-bold text-[#26152b]">{c.authorDisplayName || c.authorUsername}</span>
                              {c.isSpoiler && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 rounded font-bold">
                                  SPOILER
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#877276]">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[#3a2830] pl-8">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
};
