import React from 'react';
import { Plus, Users, MessageSquare, Radio, Sparkles, Trophy, Calendar, Compass } from 'lucide-react';

interface CommunityHeaderProps {
  activeTab: 'feed' | 'rooms' | 'communities' | 'events' | 'quotes';
  onTabChange: (tab: 'feed' | 'rooms' | 'communities' | 'events' | 'quotes') => void;
  onCreatePost: () => void;
  onCreateCommunity: () => void;
  onJoinRoom: () => void;
  onOpenDMs: () => void;
  unreadDMsCount?: number;
}

export const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  activeTab,
  onTabChange,
  onCreatePost,
  onCreateCommunity,
  onJoinRoom,
  onOpenDMs,
  unreadDMsCount = 0
}) => {
  return (
    <div className="space-y-6">
      {/* Hero Banner with exact user requested title & subtitle */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#26152b] via-[#3d1838] to-[#1e0f22] p-8 md:p-12 text-white shadow-xl">
        {/* Ambient background glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#f47fa5]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#9e3b5f]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-pink-200 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            <span>KAIRO Social Universe & Fandom Ecosystem</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display tracking-tight text-white">
            Find your people.
          </h1>

          <p className="text-base md:text-lg text-pink-100/90 font-medium leading-relaxed max-w-2xl">
            Talk about what you love. Discover new worlds. Meet the people creating them.
          </p>

          {/* Top Actions: Create Post, Create Community, Join a Room */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              id="action-create-post"
              onClick={onCreatePost}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#f47fa5] to-[#9e3b5f] text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-pink-900/30 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Post</span>
            </button>

            <button
              id="action-create-community"
              onClick={onCreateCommunity}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-pink-300" />
              <span>Create Community</span>
            </button>

            <button
              id="action-join-room"
              onClick={onJoinRoom}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Join a Room</span>
            </button>

            <button
              id="action-open-dms"
              onClick={onOpenDMs}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer relative ml-auto"
              title="Direct Messages"
            >
              <MessageSquare className="w-4 h-4 text-pink-200" />
              <span>Direct Messages</span>
              {unreadDMsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Primary Section Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-pink-100 pb-1 overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="tab-feed"
            onClick={() => onTabChange('feed')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'feed'
                ? 'bg-[#9e3b5f] text-white shadow-sm'
                : 'text-[#544246] hover:bg-pink-50/70'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Discussions & Feed</span>
          </button>

          <button
            id="tab-rooms"
            onClick={() => onTabChange('rooms')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rooms'
                ? 'bg-[#9e3b5f] text-white shadow-sm'
                : 'text-[#544246] hover:bg-pink-50/70'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-500" />
            <span>Live Chat Rooms</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold">LIVE</span>
          </button>

          <button
            id="tab-communities"
            onClick={() => onTabChange('communities')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'communities'
                ? 'bg-[#9e3b5f] text-white shadow-sm'
                : 'text-[#544246] hover:bg-pink-50/70'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Fandom Communities</span>
          </button>

          <button
            id="tab-events"
            onClick={() => onTabChange('events')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'events'
                ? 'bg-[#9e3b5f] text-white shadow-sm'
                : 'text-[#544246] hover:bg-pink-50/70'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Events & Contests</span>
          </button>

          <button
            id="tab-quotes"
            onClick={() => onTabChange('quotes')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'quotes'
                ? 'bg-[#9e3b5f] text-white shadow-sm'
                : 'text-[#544246] hover:bg-pink-50/70'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Quote Cards</span>
          </button>
        </div>
      </div>
    </div>
  );
};
