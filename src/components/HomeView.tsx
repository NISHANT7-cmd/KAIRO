import React, { useState, useEffect } from 'react';
import { 
  Sparkles, BookOpen, Feather, Flame, ArrowRight, Star, 
  TrendingUp, Compass, Globe, Users, CheckCircle2, ChevronRight, Play,
  Sliders, MoreVertical, EyeOff, VolumeX, Shield, Heart, Info
} from 'lucide-react';
import { Story, Universe, ReadingProgress, CommunityPost, AnimeEntry, PersonalizedHomeFeed, RecommendationStoryItem } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface HomeViewProps {
  onNavigate: (view: string, data?: any) => void;
  onOpenStory: (storySlug: string) => void;
  onReadChapter: (storySlug: string, chapterNumber: number) => void;
  onOpenUniverse: (universeSlug: string) => void;
  onOpenCommunity: (communitySlug: string) => void;
  onOpenTasteSettings?: () => void;
  onOpenOnboarding?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenStory,
  onReadChapter,
  onOpenUniverse,
  onOpenCommunity,
  onOpenTasteSettings,
  onOpenOnboarding,
}) => {
  const { user } = useAuth();
  const { currentLanguage, t } = useLanguage();
  const [stories, setStories] = useState<Story[]>([]);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [continueReading, setContinueReading] = useState<ReadingProgress | null>(null);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [animeList, setAnimeList] = useState<AnimeEntry[]>([]);
  const [personalizedFeed, setPersonalizedFeed] = useState<PersonalizedHomeFeed | null>(null);
  const [activeFeedbackMenuId, setActiveFeedbackMenuId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, [user, currentLanguage]);

  useEffect(() => {
    const handleLangChange = (e: any) => {
      const newLang = e.detail?.language;
      if (newLang) {
        api.getPersonalizedHomeFeed(newLang).then(recRes => {
          if (recRes) setPersonalizedFeed(recRes);
        }).catch(err => console.error(err));
      }
    };
    window.addEventListener('kairo:language-changed', handleLangChange);
    return () => window.removeEventListener('kairo:language-changed', handleLangChange);
  }, []);

  const loadHomeData = async () => {
    try {
      const [storyRes, uniRes, animeRes, commRes, recRes] = await Promise.all([
        api.getStories({ sort: 'popular' }),
        api.getUniverses(),
        api.getAnime(),
        api.getCommunity('astral-universe-fandom').catch(() => ({ posts: [] })),
        api.getPersonalizedHomeFeed(currentLanguage).catch(() => null),
      ]);

      setStories(storyRes.stories || []);
      setUniverses(uniRes.universes || []);
      setAnimeList(animeRes.anime || []);
      if (commRes && (commRes as any).posts) {
        setCommunityPosts((commRes as any).posts);
      }
      if (recRes) {
        setPersonalizedFeed(recRes);
      }

      if (user) {
        const progressRes = await api.getReadingProgress().catch(() => ({ progress: [] }));
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

  const handleFeedback = async (
    e: React.MouseEvent,
    type: 'not_interested' | 'dont_recommend_genre' | 'mute_author',
    targetId: string,
    metadata?: any
  ) => {
    e.stopPropagation();
    setActiveFeedbackMenuId(null);
    try {
      await api.submitRecommendationFeedback({ type, targetId, metadata });
      setFeedbackToast('Preference noted. Updating your recommendation weights...');
      setTimeout(() => setFeedbackToast(null), 3000);

      if (personalizedFeed) {
        const filteredTrending = personalizedFeed.trendingForYou.filter(
          item => item.story.id !== targetId && item.story.genre !== targetId && item.story.authorId !== targetId
        );
        const filteredSerials = personalizedFeed.recommendedSerials.filter(
          item => item.story.id !== targetId && item.story.genre !== targetId && item.story.authorId !== targetId
        );
        setPersonalizedFeed({
          ...personalizedFeed,
          trendingForYou: filteredTrending,
          recommendedSerials: filteredSerials,
        });
      }
    } catch (err) {
      console.error('Failed to submit recommendation feedback:', err);
    }
  };

  const featuredStory = stories.find(s => s.featured) || stories[0];

  return (
    <div className="space-y-6 sm:space-y-10 lg:space-y-12 pb-16 sm:pb-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      
      {/* Hero Banner (Stitch visual fidelity) */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#fee7ff] via-[#fff7fb] to-[#ffeffe] border border-pink-200/80 shadow-xs p-4 sm:p-8 lg:p-12">
        {/* Ambient Decorative Ethereal Blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#f47fa5]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#dbcdfe]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-3.5 sm:space-y-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/80 border border-pink-200 shadow-2xs text-[#9e3b5f] text-[10px] sm:text-xs font-bold tracking-wide">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#f47fa5]" />
              <span>THE NEXT GENERATION OF ANIME FICTION</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-display text-[#26152b] tracking-tight leading-[1.15]">
              Stories beyond <br />
              <span className="gradient-text">imagination.</span>
            </h1>

            <p className="text-xs sm:text-base text-[#544246] max-w-xl leading-relaxed">
              Discover original serialized light novels, explore sprawling multi-author lore codexes, and create fictional universes with fellow fans.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 pt-1 sm:pt-2">
              <button
                id="hero-start-reading-btn"
                onClick={() => onNavigate('discover')}
                className="btn-gradient px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Start Reading</span>
              </button>

              {user?.role !== 'USER' && (
                <button
                  id="hero-write-story-btn"
                  onClick={() => onNavigate('studio')}
                  className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm bg-white/90 hover:bg-white text-[#9e3b5f] border border-pink-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer"
                >
                  <Feather className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9e3b5f]" />
                  <span>Write & Publish</span>
                </button>
              )}

              <button
                id="hero-explore-universes-btn"
                onClick={() => onNavigate('universes')}
                className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm bg-white/80 hover:bg-white text-[#635882] border border-pink-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#635882]" />
                <span>Explore Universes</span>
              </button>
            </div>
          </div>

          {/* Featured Highlight Card */}
          {featuredStory && (
            <div className="lg:col-span-5">
              <div 
                onClick={() => onOpenStory(featuredStory.slug || featuredStory.id)}
                className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-white/90 shadow-md hover:scale-[1.01] transition-all cursor-pointer group"
              >
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-16/10 mb-3 sm:mb-4 shadow-sm">
                  <img
                    src={featuredStory.coverImage}
                    alt={featuredStory.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute top-2.5 left-2.5 bg-[#9e3b5f]/90 backdrop-blur-md text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide uppercase">
                    Featured Original
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-pink-200 mb-0.5 sm:mb-1">
                      <span>{featuredStory.genre}</span>
                      <span>•</span>
                      <span>{featuredStory.storyType}</span>
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-xl font-display line-clamp-1">
                      {featuredStory.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#544246] px-1">
                  <div className="flex items-center gap-2">
                    <img
                      src={featuredStory.authorAvatar}
                      alt={featuredStory.authorDisplayName}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-pink-200"
                    />
                    <span className="font-semibold text-[#26152b] text-[11px] sm:text-xs">{featuredStory.authorDisplayName}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-[#9e3b5f] text-[11px] sm:text-xs">
                    <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#9e3b5f]" />
                    <span>{featuredStory.rating}</span>
                    <span className="text-[#877276] font-normal text-[10px]">({featuredStory.ratingCount})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Feedback Toast */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-zinc-900 text-white border border-zinc-700 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Personalized "Trending For You" Rail */}
      {personalizedFeed && personalizedFeed.trendingForYou && personalizedFeed.trendingForYou.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#9e3b5f]" />
              <h2 className="text-base sm:text-2xl font-black font-display text-[#26152b]">
                {t('home_trending_rail', 'Trending For You')}
              </h2>
              <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-[#fee7ff] text-[#9e3b5f] font-semibold border border-pink-200 hidden sm:inline-block">
                {t('home_match_score', 'Personalized')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              className="text-[11px] sm:text-xs font-bold text-[#9e3b5f] hover:underline flex items-center gap-0.5 sm:gap-1 cursor-pointer"
            >
              <span>{t('home_explore_more', 'Explore All')}</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {personalizedFeed.trendingForYou.map((item) => {
              const s = item?.story;
              if (!s) return null;
              const isMenuOpen = activeFeedbackMenuId === s.id;
              const matchPercent = Math.min(99, Math.max(65, Math.round(item.score * 100)));

              return (
                <div
                  key={`rec-${s.id}`}
                  id={`rec-story-card-${s.id}`}
                  onClick={() => onOpenStory(s.slug || s.id)}
                  className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-pink-100/90 hover:border-pink-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between relative"
                >
                  <div>
                    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-4/3 mb-2.5 sm:mb-3.5">
                      <img
                        src={s.coverImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800'}
                        alt={s.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex items-center gap-1 sm:gap-1.5">
                        <span className="bg-black/60 backdrop-blur-md text-white px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase">
                          {s.genre}
                        </span>
                        <span className="bg-[#9e3b5f]/90 backdrop-blur-md text-white px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold">
                          {matchPercent}% {t('home_match_score', 'Match')}
                        </span>
                        {s.language && s.language !== 'English' && (
                          <span className="bg-amber-600/90 backdrop-blur-md text-white px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold">
                            {s.language}
                          </span>
                        )}
                      </div>

                      {/* Feedback menu button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFeedbackMenuId(isMenuOpen ? null : s.id);
                        }}
                        className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 p-1 sm:p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition cursor-pointer"
                        title="Recommendation options"
                      >
                        <MoreVertical className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>

                      {/* Dropdown feedback menu */}
                      {isMenuOpen && (
                        <div
                          className="absolute top-9 right-2 sm:top-10 sm:right-2.5 w-44 sm:w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1.5 z-30 text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleFeedback(e, 'not_interested', s.id)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 flex items-center gap-2 text-zinc-300 cursor-pointer"
                          >
                            <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{t('home_not_interested', 'Not interested')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleFeedback(e, 'dont_recommend_genre', s.genre)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 flex items-center gap-2 text-zinc-300 cursor-pointer"
                          >
                            <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{t('home_hide_genre', `Hide ${s.genre}`)}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleFeedback(e, 'mute_author', s.authorId)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 flex items-center gap-2 text-rose-300 cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5 text-rose-400" />
                            <span>{t('home_mute_author', 'Mute this author')}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Recommendation reason badge */}
                    {item.recommendationReason && (
                      <div className="mb-1.5 sm:mb-2 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-pink-50 border border-pink-100/90 text-[10px] sm:text-[11px] font-medium text-[#9e3b5f] flex items-center gap-1 sm:gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#f47fa5] shrink-0" />
                        <span className="truncate">{item.recommendationReason}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold text-[#877276] mb-0.5 sm:mb-1">
                      <span>{s.storyType}</span>
                      <span>•</span>
                      <span>{s.chaptersCount} Chs</span>
                    </div>

                    <h3 className="font-extrabold text-sm sm:text-base text-[#26152b] font-display group-hover:text-[#9e3b5f] transition-colors line-clamp-1">
                      {s.title}
                    </h3>

                    <p className="text-[11px] sm:text-xs text-[#544246] line-clamp-2 mt-0.5 sm:mt-1 leading-relaxed">
                      {s.description}
                    </p>
                  </div>

                  <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-pink-100/70 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('profile', s.authorUsername || s.authorId);
                      }}
                      className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity text-left cursor-pointer group/author"
                    >
                      <img
                        src={s.authorAvatar}
                        alt={s.authorDisplayName}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover ring-1 ring-pink-200 group-hover/author:ring-[#9e3b5f]"
                      />
                      <span className="text-[#544246] group-hover/author:text-[#9e3b5f] font-semibold text-[10px] sm:text-[11px] truncate max-w-[110px] sm:max-w-[120px]">
                        {s.authorDisplayName}
                      </span>
                    </button>
                    <div className="flex items-center gap-1 font-bold text-[#9e3b5f] text-[11px] sm:text-xs">
                      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#9e3b5f]" />
                      <span>{s.rating}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Anime to Light Novel Bridges Rail (if matches exist) */}
      {personalizedFeed && personalizedFeed.animeBridges && personalizedFeed.animeBridges.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <h2 className="text-base sm:text-2xl font-black font-display text-[#26152b]">
                {t('home_anime_bridge_title', 'From Screen to Serial: Anime Bridges')}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('anime')}
              className="text-[11px] sm:text-xs font-bold text-purple-700 hover:underline flex items-center gap-0.5 sm:gap-1 cursor-pointer"
            >
              <span>{t('nav_anime', 'Explore Anime')}</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {personalizedFeed.animeBridges.map((bridge, idx) => {
              const mainStory = bridge.connectedStories?.[0] || (bridge as any).recommendedStory;
              if (!mainStory) return null;
              const animeTitle = bridge.anime?.title || (bridge as any).likedAnimeTitle || 'Anime';
              const reason = bridge.bridgeReason || (bridge as any).connectionReason || `Inspired by ${animeTitle}`;
              return (
                <div
                  key={`bridge-${idx}`}
                  onClick={() => onOpenStory(mainStory.slug || mainStory.id)}
                  className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-50 via-white to-pink-50 border border-purple-200/80 shadow-2xs hover:shadow-xs transition flex items-center gap-3 sm:gap-4 cursor-pointer group"
                >
                  <img
                    src={mainStory.coverImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800'}
                    alt={mainStory.title}
                    className="w-16 h-22 sm:w-20 sm:h-28 object-cover rounded-xl sm:rounded-2xl shadow-xs group-hover:scale-105 transition shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-purple-600">
                      If you enjoy {animeTitle}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-[#26152b] font-display group-hover:text-purple-700 transition truncate">
                      {mainStory.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#544246] line-clamp-2 leading-relaxed">
                      {reason}
                    </p>
                    <div className="text-[10px] sm:text-[11px] text-[#877276] font-medium pt-0.5">
                      By {mainStory.authorDisplayName} • {mainStory.genre}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {continueReading && (
        <section className="glass-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-pink-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-5 bg-gradient-to-r from-white/90 via-[#fff7fb] to-[#fee7ff]/60">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <img
              src={continueReading.storyCover}
              alt={continueReading.storyTitle}
              className="w-12 h-16 sm:w-16 sm:h-24 object-cover rounded-lg sm:rounded-xl shadow-sm shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#9e3b5f] flex items-center gap-1 mb-0.5">
                <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 fill-orange-500" />
                <span>CONTINUE READING</span>
              </div>
              <h3 className="font-bold text-sm sm:text-lg text-[#26152b] font-display truncate">
                {continueReading.storyTitle}
              </h3>
              <p className="text-[11px] sm:text-xs text-[#544246] mt-0.5">
                Chapter {continueReading.chapterNumber}: {continueReading.chapterTitle}
              </p>
              
              {/* Progress bar */}
              <div className="w-full sm:w-64 h-1.5 sm:h-2 bg-pink-100 rounded-full mt-1.5 sm:mt-2 overflow-hidden">
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
            className="w-full sm:w-auto btn-gradient px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
            <span>Resume Chapter {continueReading.chapterNumber}</span>
          </button>
        </section>
      )}

      {/* Trending Stories Rail */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#9e3b5f]" />
            <h2 className="text-base sm:text-2xl font-black font-display text-[#26152b]">
              Trending on KAIRO
            </h2>
          </div>
          <button
            onClick={() => onNavigate('discover', { sort: 'popular' })}
            className="text-[11px] sm:text-xs font-bold text-[#9e3b5f] hover:underline flex items-center gap-0.5 sm:gap-1 cursor-pointer"
          >
            <span>Explore all</span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {stories.map(story => (
            <div
              key={story.id}
              id={`story-card-${story.id}`}
              onClick={() => onOpenStory(story.slug || story.id)}
              className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-pink-100/90 hover:border-pink-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-4/3 mb-2.5 sm:mb-3.5">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-black/60 backdrop-blur-md text-white px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase">
                    {story.genre}
                  </div>
                  {story.liveReadersCount && story.liveReadersCount > 0 && (
                    <div className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 bg-[#9e3b5f]/90 backdrop-blur-md text-white px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{story.liveReadersCount} reading</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold text-[#877276] mb-0.5 sm:mb-1">
                  <span>{story.storyType}</span>
                  <span>•</span>
                  <span>{story.chaptersCount} Chs</span>
                </div>

                <h3 className="font-extrabold text-sm sm:text-base text-[#26152b] font-display group-hover:text-[#9e3b5f] transition-colors line-clamp-1">
                  {story.title}
                </h3>

                <p className="text-[11px] sm:text-xs text-[#544246] line-clamp-2 mt-0.5 sm:mt-1 leading-relaxed">
                  {story.description}
                </p>
              </div>

              <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-pink-100/70 flex items-center justify-between text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('profile', story.authorUsername || story.authorId);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity text-left cursor-pointer group/author"
                  title={`View @${story.authorUsername}'s profile`}
                >
                  <img
                    src={story.authorAvatar}
                    alt={story.authorDisplayName}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover ring-1 ring-pink-200 group-hover/author:ring-[#9e3b5f]"
                  />
                  <span className="text-[#544246] group-hover/author:text-[#9e3b5f] font-semibold text-[10px] sm:text-[11px] truncate max-w-[110px] sm:max-w-[120px]">
                    {story.authorDisplayName}
                  </span>
                </button>
                <div className="flex items-center gap-1 font-bold text-[#9e3b5f] text-[11px] sm:text-xs">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#9e3b5f]" />
                  <span>{story.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Authors & Creators Studio Callout (or Reader Discovery Sanctuary if Reader role) */}
      {user?.role !== 'USER' ? (
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 border border-pink-200/90 shadow-sm bg-gradient-to-r from-[#fee7ff] via-white to-[#f6ebff]">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/90 border border-pink-200 text-[#9e3b5f] text-[10px] sm:text-xs font-bold">
                <Feather className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>WRITERS & AUTHORS GUILD</span>
              </div>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black font-display text-[#26152b]">
                Ready to publish your own anime universe?
              </h2>
              <p className="text-xs sm:text-sm text-[#544246] leading-relaxed">
                KAIRO gives authors serialized novel publishing, auto-saving chapter manuscripts, rich lore codexes, character relationship networks, and detailed reader metrics.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
              <button
                id="home-cta-new-story-btn"
                onClick={() => onNavigate('create-story')}
                className="btn-gradient px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer flex-1 sm:flex-none justify-center"
              >
                <Feather className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Publish a Story</span>
              </button>
              <button
                id="home-cta-open-studio-btn"
                onClick={() => onNavigate('studio')}
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm bg-white hover:bg-pink-50 text-[#635882] border border-pink-200 shadow-2xs transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer flex-1 sm:flex-none justify-center"
              >
                <span>Creator Studio</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 border border-pink-200/90 shadow-sm bg-gradient-to-r from-[#fee7ff] via-white to-[#f6ebff]">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/90 border border-pink-200 text-[#9e3b5f] text-[10px] sm:text-xs font-bold">
                <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>IMMERSIVE STORYTELLING REALM</span>
              </div>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black font-display text-[#26152b]">
                Explore thousands of serialized light novel chapters
              </h2>
              <p className="text-xs sm:text-sm text-[#544246] leading-relaxed">
                Follow master storytellers, discuss plot twists with fellow readers in fandom hubs, and dive into original world lore codexes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
              <button
                onClick={() => onNavigate('discover')}
                className="btn-gradient px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer flex-1 sm:flex-none justify-center"
              >
                <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Explore Catalog</span>
              </button>
              <button
                onClick={() => onNavigate('community')}
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm bg-white hover:bg-pink-50 text-[#635882] border border-pink-200 shadow-2xs transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer flex-1 sm:flex-none justify-center"
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Join Discussions</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Universe & World Spotlight */}
      {universes.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[#635882]" />
              <h2 className="text-base sm:text-2xl font-black font-display text-[#26152b]">
                Explore Original Universes
              </h2>
            </div>
            <button
              onClick={() => onNavigate('universes')}
              className="text-[11px] sm:text-xs font-bold text-[#635882] hover:underline flex items-center gap-0.5 sm:gap-1 cursor-pointer"
            >
              <span>All Universes</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {universes.map(uni => (
              <div
                key={uni.id}
                onClick={() => onOpenUniverse(uni.slug || uni.id)}
                className="lg:col-span-12 glass-card rounded-2xl sm:rounded-3xl overflow-hidden border border-purple-200/70 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
                  <div className="md:col-span-5 h-44 sm:h-64 md:h-full relative overflow-hidden">
                    <img
                      src={uni.bannerImage}
                      alt={uni.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 text-white">
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#635882] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                        Shared Lore Continuity
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-7 p-4 sm:p-6 md:p-8 space-y-2.5 sm:space-y-4">
                    <h3 className="text-lg sm:text-2xl md:text-3xl font-black font-display text-[#26152b] group-hover:text-[#635882] transition-colors">
                      {uni.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-[#9e3b5f]">
                      "{uni.tagline}"
                    </p>
                    <p className="text-xs sm:text-sm text-[#544246] leading-relaxed line-clamp-3">
                      {uni.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-1 sm:pt-2 text-[10px] sm:text-xs font-bold text-[#26152b]">
                      <div className="px-2.5 py-1 rounded-lg sm:rounded-xl bg-purple-50 border border-purple-100">
                        {uni.storiesCount} Connected Stories
                      </div>
                      <div className="px-2.5 py-1 rounded-lg sm:rounded-xl bg-purple-50 border border-purple-100">
                        {uni.charactersCount} Lore Characters
                      </div>
                      <div className="px-2.5 py-1 rounded-lg sm:rounded-xl bg-purple-50 border border-purple-100">
                        ★ {uni.rating} Rating
                      </div>
                    </div>

                    <div className="pt-1 sm:pt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#635882] group-hover:translate-x-1 transition-transform">
                        <span>Enter Universe Codex</span>
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#9e3b5f]" />
            <h2 className="text-base sm:text-2xl font-black font-display text-[#26152b]">
              Anime & Fandom Hub
            </h2>
          </div>
          <button
            onClick={() => onNavigate('anime')}
            className="text-[11px] sm:text-xs font-bold text-[#9e3b5f] hover:underline flex items-center gap-0.5 sm:gap-1 cursor-pointer"
          >
            <span>Browse Anime</span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {animeList.slice(0, 3).map(anime => (
            <div
              key={anime.id}
              onClick={() => onNavigate('anime')}
              className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-pink-100/90 hover:shadow-md transition-all cursor-pointer group flex items-center gap-3 sm:gap-4"
            >
              <img
                src={anime.poster}
                alt={anime.title}
                className="w-16 h-22 sm:w-20 sm:h-28 object-cover rounded-xl sm:rounded-2xl shadow-xs group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] sm:text-[10px] font-bold text-[#9e3b5f] uppercase tracking-wider">
                  {anime.genres[0]} • {anime.season}
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-[#26152b] font-display group-hover:text-[#9e3b5f] transition-colors truncate mt-0.5">
                  {anime.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-[#877276] line-clamp-2 mt-0.5 sm:mt-1">
                  {anime.synopsis}
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-bold text-[#26152b]">
                  <span className="text-[#9e3b5f]">★ {anime.score}</span>
                  <span>•</span>
                  <span className="text-[#877276] font-normal">{anime.episodes} Eps</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
