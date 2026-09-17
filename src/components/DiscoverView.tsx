import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Sparkles, Star, BookOpen, Clock, 
  Flame, ChevronDown, Check 
} from 'lucide-react';
import { Story } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface DiscoverViewProps {
  initialSort?: string;
  onOpenStory: (storySlug: string) => void;
  onReadChapter: (storySlug: string, chapterNumber: number) => void;
  onOpenAuthor?: (username: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  initialSort = 'popular',
  onOpenStory,
  onReadChapter,
  onOpenAuthor,
}) => {
  const { currentLanguage, t } = useLanguage();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [sortBy, setSortBy] = useState(initialSort);

  const genres = [
    'All', 'Fantasy', 'Dark Fantasy', 'Sci-Fi', 'Light Novel', 
    'Romance', 'Action', 'Cyberpunk', 'Mystery', 'Isekai'
  ];

  const storyTypes = [
    'All', 'Light Novel', 'Serialized Novel', 'Short Story', 
    'Manga-Style Story', 'Original Fiction'
  ];

  const contentLanguages = [
    'All', 'English', 'Japanese', 'Spanish', 'French', 'Korean', 'Hindi', 'Marathi', 'German', 'Portuguese'
  ];

  useEffect(() => {
    fetchStories();
  }, [selectedGenre, sortBy, selectedStatus]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const res = await api.getStories({
        genre: selectedGenre !== 'All' ? selectedGenre : undefined,
        sort: sortBy,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      });
      setStories(res.stories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter(s => {
    if (selectedType !== 'All' && s.storyType !== selectedType) return false;
    if (selectedLanguage !== 'All' && (s.language || 'English') !== selectedLanguage) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q)) ||
        s.authorDisplayName.toLowerCase().includes(q) ||
        (s.language && s.language.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8 pb-24">
      
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-[#fee7ff] border border-pink-200 text-[#9e3b5f] text-[10px] sm:text-xs font-bold">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#f47fa5]" />
          <span>ORIGINAL FICTION & SERIALIZED LIGHT NOVELS</span>
        </div>
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-display text-[#26152b]">
          Discover your next <span className="gradient-text">obsession.</span>
        </h1>
        <p className="text-xs sm:text-base text-[#544246]">
          Filter through hundreds of serialized chapters, light novels, and anime-inspired lore.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-pink-200/90 shadow-2xs space-y-3 sm:space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#9e3b5f] absolute left-3.5 sm:left-4 top-3 sm:top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search stories, characters, or authors..."
            className="w-full h-10 sm:h-12 pl-10 sm:pl-12 pr-4 rounded-xl sm:rounded-2xl bg-white/90 border border-pink-200/80 focus:border-[#9e3b5f] focus:ring-2 focus:ring-pink-200/50 outline-none text-xs sm:text-sm font-medium text-[#26152b] transition-all"
          />
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {genres.map(genre => {
            const active = selectedGenre === genre;
            return (
              <button
                key={genre}
                id={`genre-pill-${genre.toLowerCase()}`}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'btn-gradient shadow-xs'
                    : 'bg-white/80 hover:bg-[#fee7ff] text-[#544246] border border-pink-100'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-pink-100/70 text-xs">
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#877276] uppercase tracking-wider text-[11px]">{t('nav_language', 'Language')}:</span>
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                className="bg-white px-3 py-1.5 rounded-xl border border-pink-200 font-semibold text-[#26152b] outline-none cursor-pointer"
              >
                {contentLanguages.map(l => (
                  <option key={l} value={l}>{l === 'All' ? 'All Languages' : l}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-[#877276] uppercase tracking-wider text-[11px]">Format:</span>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="bg-white px-3 py-1.5 rounded-xl border border-pink-200 font-semibold text-[#26152b] outline-none cursor-pointer"
              >
                {storyTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-[#877276] uppercase tracking-wider text-[11px]">Status:</span>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-white px-3 py-1.5 rounded-xl border border-pink-200 font-semibold text-[#26152b] outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-[#877276] uppercase tracking-wider text-[11px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white px-3 py-1.5 rounded-xl border border-pink-200 font-semibold text-[#9e3b5f] outline-none cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="recent">Recently Updated</option>
            </select>
          </div>

        </div>
      </div>

      {/* Stories Results Grid */}
      <div>
        {loading ? (
          <div className="text-center py-20 text-[#877276]">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#9e3b5f] animate-spin" />
            <p className="font-semibold text-sm">Gathering stories across realms...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-3xl p-8 border border-pink-200">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-[#877276] opacity-50" />
            <h3 className="font-bold text-lg text-[#26152b] font-display">No stories matched your filters</h3>
            <p className="text-xs text-[#877276] mt-1">Try resetting the genre or searching with different keywords.</p>
            <button
              onClick={() => { setSelectedGenre('All'); setSelectedType('All'); setSelectedLanguage('All'); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#9e3b5f] text-white text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredStories.map(story => (
              <div
                key={story.id}
                id={`discover-card-${story.id}`}
                onClick={() => onOpenStory(story.slug || story.id)}
                className="glass-card rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 border border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-3/4 mb-2.5 sm:mb-3.5 shadow-2xs">
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex items-center gap-1">
                      <span className="bg-black/60 backdrop-blur-md text-white px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase">
                        {story.genre}
                      </span>
                      {story.language && story.language !== 'English' && (
                        <span className="bg-amber-600/90 backdrop-blur-md text-white px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold">
                          {story.language}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2.5 sm:left-2.5 sm:right-2.5 flex items-center justify-between text-white text-[9px] sm:text-[10px] font-bold">
                      <span className="bg-[#9e3b5f]/90 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded-full truncate max-w-[60%]">
                        {story.storyType}
                      </span>
                      <span className="bg-black/70 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
                        <span>{story.rating}</span>
                      </span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-xs sm:text-base text-[#26152b] font-display group-hover:text-[#9e3b5f] transition-colors line-clamp-1">
                    {story.title}
                  </h3>

                  <p className="text-[11px] sm:text-xs text-[#544246] line-clamp-2 mt-0.5 sm:mt-1 leading-relaxed hidden sm:block">
                    {story.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2.5">
                    {story.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-1.5 sm:px-2 py-0.5 rounded-md bg-[#fee7ff]/70 text-[#9e3b5f] text-[9px] sm:text-[10px] font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-pink-100 flex items-center justify-between gap-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (onOpenAuthor) {
                        onOpenAuthor(story.authorUsername || story.authorId);
                      }
                    }}
                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity text-left cursor-pointer group/author min-w-0"
                    title={`View @${story.authorUsername}'s profile`}
                  >
                    <img
                      src={story.authorAvatar}
                      alt={story.authorDisplayName}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover ring-1 ring-pink-200 group-hover/author:ring-[#9e3b5f] shrink-0"
                    />
                    <span className="text-[10px] sm:text-[11px] font-medium text-[#544246] group-hover/author:text-[#9e3b5f] truncate max-w-[70px] sm:max-w-[100px]">
                      {story.authorDisplayName}
                    </span>
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onReadChapter(story.slug || story.id, 1);
                    }}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-pink-50 hover:bg-[#9e3b5f] text-[#9e3b5f] hover:text-white font-bold text-[10px] sm:text-[11px] transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>Read</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
