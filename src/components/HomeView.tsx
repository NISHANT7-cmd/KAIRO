import React, { useState, useEffect } from 'react';
import { 
  Sparkles, BookOpen, Feather, Flame, ArrowRight, Star, 
  TrendingUp, Compass, Globe, Users, CheckCircle2, ChevronRight, Play 
} from 'lucide-react';
import { Story, Universe, ReadingProgress, CommunityPost, AnimeEntry } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface HomeViewProps {
  onNavigate: (view: string, data?: any) => void;
  onOpenStory: (storySlug: string) => void;
  onReadChapter: (storySlug: string, chapterNumber: number) => void;
  onOpenUniverse: (universeSlug: string) => void;
  onOpenCommunity: (communitySlug: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenStory,
  onReadChapter,
  onOpenUniverse,
  onOpenCommunity
}) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [continueReading, setContinueReading] = useState<ReadingProgress | null>(null);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [animeList, setAnimeList] = useState<AnimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, [user]);

  const loadHomeData = async () => {
    try {
      const [storyRes, uniRes, animeRes, commRes] = await Promise.all([
        api.getStories({ sort: 'popular' }),
        api.getUniverses(),
        api.getAnime(),
        api.getCommunity('astral-universe-fandom').catch(() => ({ posts: [] })),
      ]);

      setStories(storyRes.stories || []);
      setUniverses(uniRes.universes || []);
      setAnimeList(animeRes.anime || []);
      if (commRes && (commRes as any).posts) {
        setCommunityPosts((commRes as any).posts);
      }

      if (user) {
        const progressRes = await api.getReadingProgress();
        if (progressRes.progress && progressRes.progress.length > 0) {
          setContinueReading(progressRes.progress[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const featuredStory = stories.find(s => s.featured) || stories[0];

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      
      {/* Hero Banner (Stitch visual fidelity) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#fee7ff] via-[#fff7fb] to-[#ffeffe] border border-pink-200/80 shadow-sm p-6 sm:p-10 lg:p-14">
        {/* Ambient Decorative Ethereal Blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#f47fa5]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#dbcdfe]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-pink-200 shadow-2xs text-[#9e3b5f] text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#f47fa5]" />
              <span>THE NEXT GENERATION OF ANIME FICTION</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-[#26152b] tracking-tight leading-[1.1]">
              Stories beyond <br />
              <span className="gradient-text">imagination.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#544246] max-w-xl leading-relaxed">
              Discover original serialized light novels, explore sprawling multi-author lore codexes, and create fictional universes with fellow fans.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                id="hero-start-reading-btn"
                onClick={() => onNavigate('discover')}
                className="btn-gradient px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Start Reading</span>
              </button>

              <button
                id="hero-explore-universes-btn"
                onClick={() => onNavigate('universes')}
                className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-white/80 hover:bg-white text-[#635882] border border-pink-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-[#635882]" />
                <span>Explore Universes</span>
              </button>
            </div>
          </div>

          {/* Featured Highlight Card */}
          {featuredStory && (
            <div className="lg:col-span-5">
              <div 
                onClick={() => onOpenStory(featuredStory.slug || featuredStory.id)}
                className="glass-card rounded-3xl p-4 sm:p-5 border border-white/90 shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
              >
                <div className="relative rounded-2xl overflow-hidden aspect-16/10 mb-4 shadow-md">
                  <img
                    src={featuredStory.coverImage}
                    alt={featuredStory.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3 bg-[#9e3b5f]/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">
                    Featured Original
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="flex items-center gap-2 text-xs font-semibold text-pink-200 mb-1">
                      <span>{featuredStory.genre}</span>
                      <span>•</span>
                      <span>{featuredStory.storyType}</span>
                    </div>
                    <h3 className="font-extrabold text-lg sm:text-xl font-display line-clamp-1">
                      {featuredStory.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#544246] px-1">
                  <div className="flex items-center gap-2">
                    <img
                      src={featuredStory.authorAvatar}
                      alt={featuredStory.authorDisplayName}
                      className="w-6 h-6 rounded-full object-cover border border-pink-200"
                    />
                    <span className="font-semibold text-[#26152b]">{featuredStory.authorDisplayName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-[#9e3b5f]">
                    <Star className="w-3.5 h-3.5 fill-[#9e3b5f]" />
                    <span>{featuredStory.rating}</span>
                    <span className="text-[#877276] font-normal">({featuredStory.ratingCount})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Continue Reading Card (If active reader session) */}
      {continueReading && (
        <section className="glass-card rounded-3xl p-5 sm:p-6 border border-pink-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5 bg-gradient-to-r from-white/90 via-[#fff7fb] to-[#fee7ff]/60">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <img
              src={continueReading.storyCover}
              alt={continueReading.storyTitle}
              className="w-14 h-20 sm:w-16 sm:h-24 object-cover rounded-xl shadow-md"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9e3b5f] flex items-center gap-1 mb-0.5">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span>CONTINUE READING</span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#26152b] font-display truncate">
                {continueReading.storyTitle}
              </h3>
              <p className="text-xs text-[#544246] mt-0.5">
                Chapter {continueReading.chapterNumber}: {continueReading.chapterTitle}
              </p>
              
              {/* Progress bar */}
              <div className="w-full sm:w-64 h-2 bg-pink-100 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#9e3b5f] to-[#f47fa5] rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(10, continueReading.progressPercent)}%` }}
                />
              </div>
            </div>
          </div>

          <button
            id="continue-reading-btn"
            onClick={() => onReadChapter(continueReading.storyId, continueReading.chapterNumber)}
            className="w-full sm:w-auto btn-gradient px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume Chapter {continueReading.chapterNumber}</span>
          </button>
        </section>
      )}

      {/* Trending Stories Rail */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#9e3b5f]" />
            <h2 className="text-2xl font-black font-display text-[#26152b]">
              Trending on KAIRO
            </h2>
          </div>
          <button
            onClick={() => onNavigate('discover', { sort: 'popular' })}
            className="text-xs font-bold text-[#9e3b5f] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Explore all</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map(story => (
            <div
              key={story.id}
              id={`story-card-${story.id}`}
              onClick={() => onOpenStory(story.slug || story.id)}
              className="glass-card rounded-3xl p-4 border border-pink-100/90 hover:border-pink-300 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="relative rounded-2xl overflow-hidden aspect-4/3 mb-3.5">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                    {story.genre}
                  </div>
                  {story.liveReadersCount && story.liveReadersCount > 0 && (
                    <div className="absolute bottom-2.5 right-2.5 bg-[#9e3b5f]/90 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{story.liveReadersCount} reading</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-[#877276] mb-1">
                  <span>{story.storyType}</span>
                  <span>•</span>
                  <span>{story.chaptersCount} Chapters</span>
                </div>

                <h3 className="font-extrabold text-base text-[#26152b] font-display group-hover:text-[#9e3b5f] transition-colors line-clamp-1">
                  {story.title}
                </h3>

                <p className="text-xs text-[#544246] line-clamp-2 mt-1 leading-relaxed">
                  {story.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-pink-100/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={story.authorAvatar}
                    alt={story.authorDisplayName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="text-[#544246] font-medium text-[11px] truncate max-w-[120px]">
                    {story.authorDisplayName}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-bold text-[#9e3b5f]">
                  <Star className="w-3.5 h-3.5 fill-[#9e3b5f]" />
                  <span>{story.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Universe & World Spotlight */}
      {universes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#635882]" />
              <h2 className="text-2xl font-black font-display text-[#26152b]">
                Explore Original Universes
              </h2>
            </div>
            <button
              onClick={() => onNavigate('universes')}
              className="text-xs font-bold text-[#635882] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>All Universes</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {universes.map(uni => (
              <div
                key={uni.id}
                onClick={() => onOpenUniverse(uni.slug || uni.id)}
                className="lg:col-span-12 glass-card rounded-3xl overflow-hidden border border-purple-200/70 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-5 h-64 md:h-full relative overflow-hidden">
                    <img
                      src={uni.bannerImage}
                      alt={uni.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <span className="px-2.5 py-1 rounded-full bg-[#635882] text-[10px] font-bold uppercase tracking-wider">
                        Shared Lore Continuity
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-7 p-6 md:p-8 space-y-4">
                    <h3 className="text-2xl sm:text-3xl font-black font-display text-[#26152b] group-hover:text-[#635882] transition-colors">
                      {uni.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-[#9e3b5f]">
                      "{uni.tagline}"
                    </p>
                    <p className="text-xs sm:text-sm text-[#544246] leading-relaxed line-clamp-3">
                      {uni.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-[#26152b]">
                      <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-100">
                        {uni.storiesCount} Connected Stories
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-100">
                        {uni.charactersCount} Lore Characters
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-100">
                        ★ {uni.rating} Rating
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#635882] group-hover:translate-x-1 transition-transform">
                        <span>Enter Universe Codex</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Anime Discovery Rail */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#9e3b5f]" />
            <h2 className="text-2xl font-black font-display text-[#26152b]">
              Anime & Fandom Hub
            </h2>
          </div>
          <button
            onClick={() => onNavigate('anime')}
            className="text-xs font-bold text-[#9e3b5f] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Browse Anime</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {animeList.slice(0, 3).map(anime => (
            <div
              key={anime.id}
              onClick={() => onNavigate('anime')}
              className="glass-card rounded-3xl p-4 border border-pink-100/90 hover:shadow-lg transition-all cursor-pointer group flex items-center gap-4"
            >
              <img
                src={anime.poster}
                alt={anime.title}
                className="w-20 h-28 object-cover rounded-2xl shadow-md group-hover:scale-105 transition-transform"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-[#9e3b5f] uppercase tracking-wider">
                  {anime.genres[0]} • {anime.season}
                </div>
                <h4 className="font-bold text-sm text-[#26152b] font-display group-hover:text-[#9e3b5f] transition-colors truncate mt-0.5">
                  {anime.title}
                </h4>
                <p className="text-xs text-[#877276] line-clamp-2 mt-1">
                  {anime.synopsis}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs font-bold text-[#26152b]">
                  <span className="text-[#9e3b5f]">★ {anime.score}</span>
                  <span>•</span>
                  <span className="text-[#877276] font-normal">{anime.episodes} Episodes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
