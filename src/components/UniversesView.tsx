import React, { useState, useEffect } from 'react';
import { Globe, Sparkles, BookOpen, Users, Compass, ArrowRight, Star, Plus } from 'lucide-react';
import { Universe } from '../types';
import { api } from '../services/api';

interface UniversesViewProps {
  onOpenUniverse: (universeSlug: string) => void;
  onCreateUniverse?: () => void;
}

export const UniversesView: React.FC<UniversesViewProps> = ({ onOpenUniverse, onCreateUniverse }) => {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUniverses();
  }, []);

  const loadUniverses = async () => {
    setLoading(true);
    try {
      const res = await api.getUniverses();
      setUniverses(res.universes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-[#635882] text-xs font-bold">
          <Globe className="w-3.5 h-3.5 text-[#635882]" />
          <span>EXPANSIVE MULTI-STORY CONTINUITIES</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-[#26152b]">
          Fictional Universes & <span className="gradient-text">Lore Codexes</span>
        </h1>
        <p className="text-sm sm:text-base text-[#544246]">
          Step into shared fictional universes where multiple stories, creators, and characters coexist across deep canon lore.
        </p>
      </div>

      {/* Universes Grid */}
      {loading ? (
        <div className="text-center py-20 text-[#877276]">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#635882] animate-spin" />
          <p className="font-semibold text-sm">Loading universe archives...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {universes.map(uni => (
            <div
              key={uni.id}
              id={`universe-card-${uni.id}`}
              onClick={() => onOpenUniverse(uni.slug || uni.id)}
              className="glass-card rounded-3xl overflow-hidden border border-purple-200/80 shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Banner Image */}
                <div className="lg:col-span-5 relative h-64 lg:h-auto overflow-hidden">
                  <img
                    src={uni.bannerImage}
                    alt={uni.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                  
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-[#635882] text-white text-[10px] font-bold uppercase tracking-widest shadow-md">
                      Canon Continuity
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white lg:hidden">
                    <h3 className="text-2xl font-black font-display">{uni.name}</h3>
                    <p className="text-xs text-pink-200 font-serif italic">"{uni.tagline}"</p>
                  </div>
                </div>

                {/* Info & Stats */}
                <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 space-y-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="hidden lg:block">
                      <h3 className="text-3xl font-black font-display text-[#26152b] group-hover:text-[#635882] transition-colors">
                        {uni.name}
                      </h3>
                      <p className="text-sm font-serif italic text-[#9e3b5f] mt-1">
                        "{uni.tagline}"
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-[#544246] leading-relaxed line-clamp-3">
                      {uni.description}
                    </p>

                    {/* Magic Rules / Canon preview */}
                    <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-[#544246] space-y-1">
                      <span className="font-bold text-[#635882] block text-[11px] uppercase tracking-wider">
                        Cosmic Lore & Laws of Magic:
                      </span>
                      <p className="line-clamp-2">{uni.magicSystemRules}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2.5 rounded-xl bg-white/80 border border-pink-100">
                        <div className="font-bold text-base text-[#26152b]">{uni.storiesCount}</div>
                        <div className="text-[10px] text-[#877276]">Stories</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 border border-pink-100">
                        <div className="font-bold text-base text-[#26152b]">{uni.charactersCount}</div>
                        <div className="text-[10px] text-[#877276]">Characters</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 border border-pink-100">
                        <div className="font-bold text-base text-[#635882]">★ {uni.rating}</div>
                        <div className="text-[10px] text-[#877276]">Rating</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <img src={uni.creatorAvatar} alt={uni.creatorName} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-xs font-semibold text-[#544246]">Curated by {uni.creatorName}</span>
                      </div>

                      <span className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs group-hover:translate-x-1 transition-transform">
                        <span>Open Codex</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
