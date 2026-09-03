import React, { useState } from 'react';
import { Users, Search, Lock, Globe, Check, Plus, Sparkles, BookOpen, Shield } from 'lucide-react';
import { Community, User } from '../../types';
import { api } from '../../services/api';

interface CommunityDirectoryProps {
  communities: Community[];
  user: User | null;
  onSelectCommunity: (slug: string) => void;
  onRequireAuth?: () => void;
  onCreateCommunity: () => void;
  onCommunitiesUpdated: (updated: Community[]) => void;
}

export const CommunityDirectory: React.FC<CommunityDirectoryProps> = ({
  communities,
  user,
  onSelectCommunity,
  onRequireAuth,
  onCreateCommunity,
  onCommunitiesUpdated
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const categories = [
    { id: 'ALL', label: 'All Communities' },
    { id: 'STORY_FANDOM', label: 'Story Fandoms' },
    { id: 'ANIME_MANGA', label: 'Anime & Manga' },
    { id: 'WRITING_CRAFT', label: 'Writing Craft' },
    { id: 'THEORIES_WORLDBUILDING', label: 'Lore & Worldbuilding' },
    { id: 'FAN_ART', label: 'Fan Art & Creators' },
  ];

  const handleToggleJoin = async (community: Community, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onRequireAuth?.();
      return;
    }

    setJoiningId(community.id);
    try {
      if (community.isMember) {
        await api.leaveCommunity(community.id);
        const updated = communities.map(c => 
          c.id === community.id 
            ? { ...c, isMember: false, membersCount: Math.max(0, (c.membersCount || 1) - 1) } 
            : c
        );
        onCommunitiesUpdated(updated);
      } else {
        await api.joinCommunity(community.id);
        const updated = communities.map(c => 
          c.id === community.id 
            ? { ...c, isMember: true, membersCount: (c.membersCount || 0) + 1 } 
            : c
        );
        onCommunitiesUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to toggle join:', err);
    } finally {
      setJoiningId(null);
    }
  };

  const filtered = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (activeCategory === 'ALL') return true;
    return c.category === activeCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="glass-card rounded-3xl p-5 border border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search communities, stories, universes..."
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white border border-pink-200 outline-none text-xs font-semibold text-[#26152b] focus:border-[#9e3b5f]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#9e3b5f] text-white shadow-2xs'
                  : 'bg-white/70 text-[#544246] hover:bg-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Communities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(community => {
          const isMember = community.isMember;

          return (
            <div
              key={community.id}
              id={`community-card-${community.slug}`}
              onClick={() => onSelectCommunity(community.slug)}
              className="glass-card rounded-3xl border border-pink-100 overflow-hidden shadow-sm hover:shadow-md hover:border-pink-200 transition-all flex flex-col cursor-pointer group bg-white/85"
            >
              {/* Banner Cover */}
              <div className="h-28 relative overflow-hidden bg-gradient-to-r from-[#3d1838] to-[#9e3b5f]">
                {community.bannerImage && (
                  <img
                    src={community.bannerImage}
                    alt={community.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                )}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold">
                  {community.isPrivate ? <Lock className="w-3 h-3 text-amber-300" /> : <Globe className="w-3 h-3 text-emerald-300" />}
                  <span>{community.isPrivate ? 'Private' : 'Public'}</span>
                </div>
              </div>

              {/* Body Info */}
              <div className="p-5 flex-1 flex flex-col space-y-3 relative">
                {/* Icon Avatar */}
                <div className="-mt-12 w-14 h-14 rounded-2xl border-2 border-white overflow-hidden shadow-md bg-white shrink-0">
                  <img
                    src={community.iconImage || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=100&auto=format&fit=crop&q=80'}
                    alt={community.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-display font-black text-base text-[#26152b] group-hover:text-[#9e3b5f] transition-colors leading-snug">
                    {community.name}
                  </h3>
                  <p className="text-xs text-[#877276] line-clamp-2 mt-1 leading-relaxed">
                    {community.description}
                  </p>
                </div>

                {/* Meta stats: members & posts */}
                <div className="flex items-center gap-4 text-xs font-semibold text-[#877276] pt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#9e3b5f]" />
                    {(community.membersCount ?? community.memberCount ?? 0).toLocaleString()} members
                  </span>
                  <span>•</span>
                  <span>{community.postsCount ?? 0} discussions</span>
                </div>

                {/* Bottom Action: Join/Leave */}
                <div className="pt-3 border-t border-pink-100/70 mt-auto flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#9e3b5f] group-hover:underline">
                    Enter Fandom →
                  </span>

                  <button
                    type="button"
                    onClick={e => handleToggleJoin(community, e)}
                    disabled={joiningId === community.id}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                      isMember
                        ? 'bg-pink-100 text-[#9e3b5f] hover:bg-pink-200'
                        : 'bg-gradient-to-r from-[#f47fa5] to-[#9e3b5f] text-white hover:opacity-90'
                    }`}
                  >
                    {isMember ? 'Joined' : 'Join'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
