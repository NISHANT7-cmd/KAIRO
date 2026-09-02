import React, { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, ThumbsUp, Sparkles, Send, Plus, 
  HelpCircle, CheckCircle2, Flame, Share2, Tag, ArrowRight 
} from 'lucide-react';
import { Community, CommunityPost } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CommunityViewProps {
  initialCommunitySlug?: string;
  onOpenStory: (storySlug: string) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  initialCommunitySlug = 'astral-universe-fandom',
  onOpenStory,
}) => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  // New Post Form
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'DISCUSSION' | 'POLL' | 'THEORY'>('DISCUSSION');
  const [pollOptionsInput, setPollOptionsInput] = useState('Option 1, Option 2, Option 3');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Post Commenting
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInputText, setCommentInputText] = useState('');

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const commRes = await api.getCommunities();
      const list = commRes.communities || [];
      setCommunities(list);

      const target = list.find(c => c.slug === initialCommunitySlug) || list[0];
      if (target) {
        selectCommunity(target.slug);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectCommunity = async (slug: string) => {
    try {
      const res = await api.getCommunity(slug);
      setActiveCommunity(res.community);
      setPosts(res.posts || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommunity || !user || !postTitle.trim() || !postContent.trim()) return;
    setSubmittingPost(true);
    try {
      const pollOptions = postType === 'POLL'
        ? pollOptionsInput.split(',').map((o, idx) => ({ id: `opt_${idx}`, text: o.trim(), votes: 0 }))
        : undefined;

      const res = await api.createCommunityPost({
        communityId: activeCommunity.id,
        title: postTitle,
        content: postContent,
        type: postType,
        pollOptions,
      });

      setPosts(prev => [res.post, ...prev]);
      setShowCreatePost(false);
      setPostTitle('');
      setPostContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const res = await api.likeCommunityPost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: res.likes } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleVotePoll = async (postId: string, optionId: string) => {
    if (!user) return;
    try {
      const res = await api.voteCommunityPoll(postId, optionId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, pollOptions: res.post.pollOptions, userVotedOptionId: optionId } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !commentInputText.trim()) return;
    try {
      const res = await api.addCommunityPostComment(postId, commentInputText);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...(p.comments || []), res.comment],
          };
        }
        return p;
      }));
      setCommentInputText('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      
      {/* Community Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#fee7ff] border border-pink-200 text-[#9e3b5f] text-xs font-bold">
          <Users className="w-3.5 h-3.5" />
          <span>FANDOM & CREATOR DISCUSSIONS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-display text-[#26152b]">
          Community & <span className="gradient-text">Theories</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#544246]">
          Discuss latest chapter cliffhangers, vote on polls, and share theories.
        </p>
      </div>

      {/* Main Grid: Sidebar + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar: Communities List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card rounded-3xl p-5 border border-pink-100 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#9e3b5f]">
              Fandom Channels ({communities.length})
            </h3>

            <div className="space-y-2">
              {communities.map(comm => {
                const active = activeCommunity?.id === comm.id;
                return (
                  <div
                    key={comm.id}
                    id={`community-channel-${comm.slug}`}
                    onClick={() => selectCommunity(comm.slug)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                      active
                        ? 'bg-[#fee7ff] border-[#9e3b5f] shadow-xs'
                        : 'bg-white/70 border-pink-100 hover:bg-white'
                    }`}
                  >
                    <img src={comm.iconImage} alt={comm.name} className="w-10 h-10 rounded-xl object-cover shadow-xs" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-[#26152b] truncate">{comm.name}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-[#877276] mt-0.5">
                        <span>{(comm.membersCount ?? comm.memberCount ?? 0).toLocaleString()} members</span>
                        <span>•</span>
                        <span>{comm.postsCount ?? 0} posts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Area: Feed & Posts */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Community Banner & Create Post Trigger */}
          {activeCommunity && (
            <div className="glass-card rounded-3xl p-6 border border-pink-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-[#fff7fb] to-[#fee7ff]/50">
              <div>
                <h2 className="text-xl font-black font-display text-[#26152b]">{activeCommunity.name}</h2>
                <p className="text-xs text-[#544246] mt-0.5 max-w-lg">{activeCommunity.description}</p>
              </div>

              {user && (
                <button
                  id="open-create-post-btn"
                  onClick={() => setShowCreatePost(!showCreatePost)}
                  className="btn-gradient px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start Discussion</span>
                </button>
              )}
            </div>
          )}

          {/* Create Post Form */}
          {showCreatePost && user && (
            <form onSubmit={handleCreatePost} className="glass-card rounded-3xl p-6 border border-pink-200 shadow-md space-y-4 animate-in fade-in">
              <h3 className="font-bold text-base font-display text-[#26152b]">Create a New Community Thread</h3>

              <div className="flex gap-2">
                {(['DISCUSSION', 'POLL', 'THEORY'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      postType === type ? 'bg-[#9e3b5f] text-white border-[#9e3b5f]' : 'bg-white text-[#544246] border-pink-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <input
                type="text"
                required
                value={postTitle}
                onChange={e => setPostTitle(e.target.value)}
                placeholder="Topic Title / Question / Theory"
                className="w-full h-11 px-4 rounded-xl bg-white border border-pink-200 outline-none text-xs font-semibold text-[#26152b]"
              />

              <textarea
                required
                rows={3}
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder="Write your discussion points, background evidence, or questions..."
                className="w-full p-3.5 rounded-xl bg-white border border-pink-200 outline-none text-xs text-[#26152b] leading-relaxed"
              />

              {postType === 'POLL' && (
                <div>
                  <label className="block text-xs font-bold text-[#544246] mb-1">
                    Poll Choices (Comma separated):
                  </label>
                  <input
                    type="text"
                    value={pollOptionsInput}
                    onChange={e => setPollOptionsInput(e.target.value)}
                    placeholder="Choice 1, Choice 2, Choice 3"
                    className="w-full h-10 px-3 rounded-xl bg-white border border-pink-200 text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePost(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-pink-200 text-xs font-semibold text-[#544246]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPost}
                  className="btn-gradient px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {submittingPost ? 'Posting...' : 'Publish Thread'}
                </button>
              </div>
            </form>
          )}

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-16 text-[#877276]">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-sm">No discussions in this channel yet.</p>
                <p className="text-xs mt-1">Start the very first conversation!</p>
              </div>
            ) : (
              posts.map(post => {
                const getVoteCount = (v: any) => Array.isArray(v) ? v.length : (typeof v === 'number' ? v : 0);
                const totalVotes = post.pollOptions?.reduce((acc, o) => acc + getVoteCount(o.votes), 0) || (post.poll?.totalVotes || 0);

                return (
                  <div key={post.id} className="glass-card rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img src={post.authorAvatar} alt={post.authorDisplayName} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <span className="font-bold text-xs text-[#26152b]">{post.authorDisplayName}</span>
                          <span className="text-[10px] text-[#877276] ml-2">@{post.authorUsername}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        post.type === 'POLL' ? 'bg-amber-100 text-amber-800' : post.type === 'THEORY' ? 'bg-purple-100 text-[#635882]' : 'bg-pink-100 text-[#9e3b5f]'
                      }`}>
                        {post.type}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-[#26152b] font-display">{post.title}</h3>
                    <p className="text-xs sm:text-sm text-[#544246] leading-relaxed whitespace-pre-line">{post.content}</p>

                    {/* Interactive Poll Section */}
                    {post.type === 'POLL' && post.pollOptions && (
                      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-2.5">
                        <div className="text-xs font-bold text-amber-900 mb-2">Community Poll ({totalVotes} votes)</div>
                        {post.pollOptions.map(opt => {
                          const count = getVoteCount(opt.votes);
                          const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleVotePoll(post.id, opt.id)}
                              className="w-full relative overflow-hidden rounded-xl border border-amber-200/90 p-2.5 text-left text-xs font-semibold hover:bg-amber-100/60 transition-all cursor-pointer flex items-center justify-between"
                            >
                              <div
                                className="absolute inset-0 bg-amber-200/50 -z-10 transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                              <span className="text-amber-950 font-medium">{opt.text}</span>
                              <span className="text-[11px] font-bold text-amber-900">{percent}% ({count})</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Action footer */}
                    <div className="pt-2 border-t border-pink-50 flex items-center justify-between text-xs text-[#877276] font-semibold">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className="flex items-center gap-1 hover:text-[#9e3b5f] cursor-pointer"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>{post.likes} Likes</span>
                        </button>

                        <button
                          onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                          className="flex items-center gap-1 hover:text-[#9e3b5f] cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.commentsCount} Comments</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-[#877276]">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Comments drawer for post */}
                    {activeCommentPostId === post.id && (
                      <div className="pt-3 border-t border-pink-100 space-y-3">
                        {user && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={commentInputText}
                              onChange={e => setCommentInputText(e.target.value)}
                              placeholder="Write a comment..."
                              className="flex-1 px-3 py-2 rounded-xl bg-white border border-pink-200 text-xs outline-none"
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Reply
                            </button>
                          </div>
                        )}

                        {post.comments && post.comments.length > 0 && (
                          <div className="space-y-2 pt-2">
                            {post.comments.map(c => (
                              <div key={c.id} className="p-2.5 rounded-xl bg-white/80 border border-pink-100 space-y-1">
                                <div className="flex items-center gap-2">
                                  <img src={c.userAvatar} alt={c.username} className="w-5 h-5 rounded-full object-cover" />
                                  <span className="font-bold text-[11px] text-[#26152b]">{c.username}</span>
                                </div>
                                <p className="text-xs text-[#544246]">{c.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
