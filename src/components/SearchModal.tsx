import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, User, Sparkles, Tv, Users, Lightbulb, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { SearchResult } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStory: (storyId: string) => void;
  onSelectUniverse: (universeId: string) => void;
  onSelectCommunity: (communitySlug: string) => void;
  onSelectAnime: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStory,
  onSelectUniverse,
  onSelectCommunity,
  onSelectAnime,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      doSearch('');
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const doSearch = async (q: string) => {
    setLoading(true);
    try {
      const res = await api.search(q);
      setResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    doSearch(val);
  };

  if (!isOpen) return null;

  const totalResults = results 
    ? (results.stories.length + results.characters.length + results.anime.length + results.communities.length + results.theories.length)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#26152b]/40 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl glass-card rounded-3xl p-6 shadow-2xl border border-pink-200/90 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 pb-4 border-b border-pink-100">
          <Search className="w-5 h-5 text-[#9e3b5f]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search stories, characters, lore, anime..."
            className="flex-1 bg-transparent text-base sm:text-lg text-[#26152b] placeholder-[#877276] outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); doSearch(''); }}
              className="p-1 rounded-full text-[#877276] hover:bg-pink-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#544246] hover:bg-pink-100/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-6 hide-scrollbar">
          {loading && (
            <div className="text-center py-8 text-sm text-[#877276]">Searching across the KAIRO cosmos...</div>
          )}

          {!loading && results && (
            <>
              {/* Stories Section */}
              {results.stories.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#9e3b5f] mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Stories & Serials ({results.stories.length})</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {results.stories.map(story => (
                      <div
                        key={story.id}
                        id={`search-story-${story.id}`}
                        onClick={() => { onSelectStory(story.slug || story.id); onClose(); }}
                        className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-[#fee7ff]/60 border border-transparent hover:border-pink-200 transition-all cursor-pointer group"
                      >
                        <img
                          src={story.coverImage}
                          alt={story.title}
                          className="w-12 h-16 object-cover rounded-xl shadow-xs"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-[#26152b] group-hover:text-[#9e3b5f] transition-colors truncate">
                            {story.title}
                          </h4>
                          <p className="text-xs text-[#877276] line-clamp-1 mt-0.5">
                            {story.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#544246]">
                            <span className="font-semibold text-[#9e3b5f]">{story.genre}</span>
                            <span>•</span>
                            <span>{story.chaptersCount} Chapters</span>
                            <span>•</span>
                            <span>★ {story.rating}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#877276] group-hover:text-[#9e3b5f] group-hover:translate-x-1 transition-all mr-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Characters Section */}
              {results.characters.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#635882] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Characters & Lore ({results.characters.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.characters.map(char => (
                      <div
                        key={char.id}
                        onClick={() => { onSelectUniverse('the-astral-universe'); onClose(); }}
                        className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/60 hover:bg-[#fee7ff]/40 border border-pink-100 transition-all cursor-pointer group"
                      >
                        <img
                          src={char.portrait}
                          alt={char.name}
                          className="w-10 h-10 rounded-full object-cover border border-pink-200"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#26152b] group-hover:text-[#9e3b5f] truncate">
                            {char.name}
                          </div>
                          <div className="text-[10px] text-[#877276] truncate">{char.primaryPower || char.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Anime & Streaming Section */}
              {results.anime.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#466273] mb-2 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5" />
                    <span>Anime Discovery ({results.anime.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.anime.map(ani => (
                      <div
                        key={ani.id}
                        onClick={() => { onSelectAnime(); onClose(); }}
                        className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/60 hover:bg-[#fee7ff]/40 border border-pink-100 transition-all cursor-pointer group"
                      >
                        <img
                          src={ani.poster}
                          alt={ani.title}
                          className="w-10 h-14 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#26152b] group-hover:text-[#9e3b5f] truncate">
                            {ani.title}
                          </div>
                          <div className="text-[10px] text-[#877276]">★ {ani.score} • {ani.episodes} eps</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Communities & Theories */}
              {results.communities.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#9e3b5f] mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Communities ({results.communities.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.communities.map(comm => (
                      <div
                        key={comm.id}
                        onClick={() => { onSelectCommunity(comm.slug); onClose(); }}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#fee7ff]/50 border border-pink-100/60 cursor-pointer"
                      >
                        <img src={comm.iconImage} alt={comm.name} className="w-8 h-8 rounded-lg object-cover" />
                        <span className="text-xs font-semibold text-[#26152b] truncate">{comm.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalResults === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm font-semibold text-[#26152b]">No results found for "{query}"</p>
                  <p className="text-xs text-[#877276] mt-1">Try searching for "Celestial", "Aethelgard", "Frieren", or "Astral"</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
