import React, { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, ThumbsUp, Sparkles, Send, Plus, 
  HelpCircle, CheckCircle2, Flame, Share2, Tag, ArrowRight,
  Radio, Trophy, Compass, Shield
} from 'lucide-react';
import { Community, CommunityPost } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CommunityHeader } from './community/CommunityHeader';
import { CommunityChatRooms } from './community/CommunityChatRooms';
import { CommunityFeed } from './community/CommunityFeed';
import { CommunityDirectory } from './community/CommunityDirectory';
import { CommunityEventsContests } from './community/CommunityEventsContests';
import { CommunityQuotes } from './community/CommunityQuotes';
import { CommunityDirectMessages } from './community/CommunityDirectMessages';
import { CreatePostModal } from './community/CreatePostModal';
import { CreateCommunityModal } from './community/CreateCommunityModal';
import { ReportModal } from './community/ReportModal';

interface CommunityViewProps {
  initialCommunitySlug?: string;
  onOpenStory: (storySlug: string) => void;
  onRequireAuth?: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  initialCommunitySlug = 'astral-universe-fandom',
  onOpenStory,
  onRequireAuth,
}) => {
  const { user, openAuthModal } = useAuth();

  const handleRequireAuth = () => {
    if (typeof onRequireAuth === 'function') {
      onRequireAuth();
    } else if (typeof openAuthModal === 'function') {
      openAuthModal();
    }
  };
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'feed' | 'rooms' | 'communities' | 'events' | 'quotes'>('feed');
  
  // Community & Feed State
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTagFilter, setActiveTagFilter] = useState('ALL');

  // Modals state
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showDMs, setShowDMs] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: string; id: string } | null>(null);

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

  const handlePostUpdated = (updatedPost: CommunityPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handlePostCreated = (newPost: CommunityPost) => {
    setPosts(prev => [newPost, ...prev]);
    if (activeTab !== 'feed') {
      setActiveTab('feed');
    }
  };

  const handleCommunityCreated = (newComm: Community) => {
    setCommunities(prev => [newComm, ...prev]);
    setActiveCommunity(newComm);
    selectCommunity(newComm.slug);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32">
      {/* Community Hero & Primary Navigation */}
      <CommunityHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCreatePost={() => {
          if (!user) {
            handleRequireAuth();
          } else {
            setShowCreatePost(true);
          }
        }}
        onCreateCommunity={() => {
          if (!user) {
            handleRequireAuth();
          } else {
            setShowCreateCommunity(true);
          }
        }}
        onJoinRoom={() => {
          setActiveTab('rooms');
        }}
        onOpenDMs={() => {
          if (!user) {
            handleRequireAuth();
          } else {
            setShowDMs(true);
          }
        }}
      />

      {/* Main Content Sections */}
      {activeTab === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar: Communities List & Guidelines */}
          <div className="lg:col-span-4 space-y-5">
            <div className="glass-card rounded-3xl p-5 border border-pink-100 shadow-sm space-y-3 bg-white/85">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#9e3b5f]">
                  Fandom Channels ({communities.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('communities')}
                  className="text-xs text-[#9e3b5f] font-bold hover:underline"
                >
                  Browse all →
                </button>
              </div>

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
                          : 'bg-white/70 border-pink-100/70 hover:bg-white'
                      }`}
                    >
                      <img 
                        src={comm.iconImage || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=80&auto=format&fit=crop&q=80'} 
                        alt={comm.name} 
                        className="w-10 h-10 rounded-xl object-cover shadow-xs shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-[#26152b] truncate">{comm.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-[#877276] mt-0.5">
                          <span>{(comm.membersCount ?? comm.memberCount ?? 0).toLocaleString()} members</span>
                          <span>•</span>
                          <span>{comm.postsCount ?? 0} discussions</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Channel Rules & Safety Card */}
            {activeCommunity && (
              <div className="glass-card rounded-3xl p-5 border border-pink-100 shadow-sm space-y-3 bg-white/80">
                <div className="flex items-center gap-2 text-xs font-bold text-[#26152b]">
                  <Shield className="w-4 h-4 text-[#9e3b5f]" />
                  <span>Channel Guidelines</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#544246]">
                  {(activeCommunity.rules && activeCommunity.rules.length > 0
                    ? activeCommunity.rules
                    : [
                        'Be respectful in all discussions and debates',
                        'Tag spoilers with chapter numbers',
                        'Credit fan artists and original creators'
                      ]
                  ).map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#9e3b5f] font-bold">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Area: Feed & Posts */}
          <div className="lg:col-span-8 space-y-6">
            {/* Active Community Banner */}
            {activeCommunity && (
              <div className="glass-card rounded-3xl p-6 border border-pink-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-[#fff7fb] to-[#fee7ff]/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black font-display text-[#26152b]">{activeCommunity.name}</h2>
                    {activeCommunity.isMember && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        JOINED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#544246] max-w-lg leading-relaxed">{activeCommunity.description}</p>
                </div>

                <button
                  id="open-create-post-btn"
                  onClick={() => {
                    if (!user) {
                      handleRequireAuth();
                    } else {
                      setShowCreatePost(true);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f47fa5] to-[#9e3b5f] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs hover:opacity-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Thread</span>
                </button>
              </div>
            )}

            {/* Feed Component */}
            <CommunityFeed
              posts={posts}
              user={user}
              onPostUpdated={handlePostUpdated}
              onOpenStory={onOpenStory}
              onRequireAuth={handleRequireAuth}
              onReportContent={(type, id) => setReportTarget({ type, id })}
              activeTagFilter={activeTagFilter}
              onTagFilterChange={setActiveTagFilter}
            />
          </div>
        </div>
      )}

      {/* Tab: Live Rooms */}
      {activeTab === 'rooms' && (
        <CommunityChatRooms
          user={user}
          onOpenStory={onOpenStory}
          onRequireAuth={handleRequireAuth}
        />
      )}

      {/* Tab: Communities Directory */}
      {activeTab === 'communities' && (
        <CommunityDirectory
          communities={communities}
          user={user}
          onSelectCommunity={(slug) => {
            selectCommunity(slug);
            setActiveTab('feed');
          }}
          onRequireAuth={handleRequireAuth}
          onCreateCommunity={() => {
            if (!user) handleRequireAuth();
            else setShowCreateCommunity(true);
          }}
          onCommunitiesUpdated={setCommunities}
        />
      )}

      {/* Tab: Events & Contests */}
      {activeTab === 'events' && (
        <CommunityEventsContests
          user={user}
          onRequireAuth={handleRequireAuth}
        />
      )}

      {/* Tab: Quote Highlights */}
      {activeTab === 'quotes' && (
        <CommunityQuotes
          user={user}
          onOpenStory={onOpenStory}
          onRequireAuth={handleRequireAuth}
        />
      )}

      {/* Modal: Create Post */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        communities={communities}
        defaultCommunityId={activeCommunity?.id}
        user={user}
        onPostCreated={handlePostCreated}
      />

      {/* Modal: Create Community */}
      <CreateCommunityModal
        isOpen={showCreateCommunity}
        onClose={() => setShowCreateCommunity(false)}
        user={user}
        onCommunityCreated={handleCommunityCreated}
      />

      {/* Modal: Direct Messages */}
      <CommunityDirectMessages
        isOpen={showDMs}
        onClose={() => setShowDMs(false)}
        currentUser={user}
        onRequireAuth={handleRequireAuth}
      />

      {/* Modal: Report Content */}
      {reportTarget && (
        <ReportModal
          isOpen={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}
    </div>
  );
};
