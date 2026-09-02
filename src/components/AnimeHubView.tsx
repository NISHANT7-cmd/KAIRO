import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Star, Tv, ExternalLink, BookOpen, Play, 
  ChevronRight, Search, Heart, Share2 
} from 'lucide-react';
import { AnimeEntry } from '../types';
import { api } from '../services/api';

interface AnimeHubViewProps {
  onOpenStory: (storySlug: string) => void;
}

export const AnimeHubView: React.FC<AnimeHubViewProps> = ({ onOpenStory }) => {
  const [animeList, setAnimeList] = useState<AnimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAnime();
  }, []);

  const loadAnime = async () => {
    setLoading(true);
    try {
      const res = await api.getAnime();
      setAnimeList(res.anime || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const genres = ['All', 'Action', 'Fantasy', 'Sci-Fi', 'Dark Fantasy', 'Adventure'];

  const filtered = animeList.filter(a => {
    if (selectedGenre !== 'All' && !a.genres.includes(selectedGenre)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.synopsis.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#fee7ff] border border-pink-200 text-[#9e3b5f] text-xs font-bold">
          <Tv className="w-3.5 h-3.5" />
          <span>ANIME & LIGHT NOVEL CROSSOVER DISCOVERY</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-[#26152b]">
          Anime <span className="gradient-text">Discovery Hub</span>
        </h1>
        <p className="text-sm sm:text-base text-[#544246]">
          Find top anime adaptations, stream official releases, and read connected light novel chapters.
        </p>
      </div>

      {/* Filter & Search */}
      <div className="glass-card rounded-3xl p-4 border border-pink-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto hide-scrollbar">
          {genres.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === g ? 'btn-gradient' : 'bg-white text-[#544246] border border-pink-100'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#877276] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search anime..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-pink-200 outline-none text-xs text-[#26152b]"
          />
        </div>
      </div>

      {/* Anime Grid */}
      {loading ? (
        <div className="text-center py-20 text-[#877276]">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#9e3b5f] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(anime => (
            <div
              key={anime.id}
              className="glass-card rounded-3xl overflow-hidden border border-pink-100 hover:border-pink-300 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-56 overflow-hidden group">
                  <img
                    src={anime.poster}
                    alt={anime.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  <div className="absolute top-3 left-3 bg-[#9e3b5f]/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {anime.season} • {anime.studio}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white flex items-end justify-between">
                    <div>
                      <div className="text-[10px] text-pink-200 uppercase font-semibold">{anime.genres.join(', ')}</div>
                      <h3 className="font-bold text-base font-display line-clamp-1">{anime.title}</h3>
                    </div>
                    <div className="bg-black/70 px-2 py-0.5 rounded-lg text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{anime.score}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <p className="text-xs text-[#544246] leading-relaxed line-clamp-3">
                    {anime.synopsis}
                  </p>

                  <div className="flex items-center justify-between text-xs text-[#877276] pt-1">
                    <span>Episodes: <strong className="text-[#26152b]">{anime.episodes}</strong></span>
                    <span>Studio: <strong className="text-[#26152b]">{anime.studio}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Watch Provider + Read Companion LN */}
              <div className="p-5 pt-0 space-y-2">
                {anime.companionStorySlug && (
                  <button
                    onClick={() => onOpenStory(anime.companionStorySlug!)}
                    className="w-full py-2.5 rounded-xl bg-[#fee7ff] hover:bg-[#fedbff] text-[#9e3b5f] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read Original Light Novel</span>
                  </button>
                )}

                <a
                  href={anime.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-pink-50 text-[#544246] border border-pink-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Stream on {anime.streamingService}</span>
                </a>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
