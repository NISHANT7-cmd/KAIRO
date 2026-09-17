import { dbService } from './db.js';
import {
  User,
  Story,
  Community,
  AnimeEntry,
  ReadingProgress,
  UserInterestProfile,
  UserBehaviorEvent,
  BehaviorEventType,
  RecommendationStoryItem,
  AuthorRecommendationItem,
  AnimeBridgeItem,
  StoryDna,
  PersonalizedHomeFeed,
  PersonalizedDiscoverFeed,
  AdminRecommendationSettings
} from '../src/types.js';

// Default Admin Recommendation Settings
export const DEFAULT_ADMIN_SETTINGS: AdminRecommendationSettings = {
  weights: {
    genreMatch: 0.25,
    themeMatch: 0.15,
    languageMatch: 0.10,
    storyTypeMatch: 0.10,
    behavioralSimilarity: 0.15,
    authorAffinity: 0.10,
    communityAffinity: 0.05,
    contentQuality: 0.05,
    freshness: 0.05
  },
  explorationRate: 0.15,
  trendingThreshold: 1000,
  qualityRatingThreshold: 4.2,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

const GENRE_EMOJIS: Record<string, string> = {
  'Fantasy': '✨',
  'Dark Fantasy': '🌑',
  'Romance': '💞',
  'Sci-Fi': '🚀',
  'Action': '⚔️',
  'Adventure': '🗺️',
  'Thriller': '⚡',
  'Mystery': '🕵️',
  'Horror': '👁️',
  'Supernatural': '🔮',
  'Comedy': '😂',
  'Drama': '🎭',
  'Slice of Life': '🍵',
  'Historical': '🏛️',
  'Psychological': '🧠',
  'Sports': '🏆',
  'Crime': '🔍',
  'School': '🎒',
  'Isekai': '🌀',
  'Mecha': '🤖'
};

const STYLE_ICONS: Record<string, string> = {
  'Fast-paced action': 'zap',
  'Psychological stories': 'brain',
  'Emotional stories': 'heart',
  'Deep world-building': 'globe',
  'Mystery & secrets': 'search',
  'Character-driven drama': 'users',
  'Comedy & lighthearted stories': 'smile',
  'Dark & mature themes': 'moon',
  'Magical adventures': 'sparkles',
  'Futuristic worlds': 'rocket',
  'Slow-burn romance': 'flame',
  'Ensemble casts': 'shield',
  'Character growth': 'trending-up',
  'Plot twists': 'shuffle',
  'Underdog stories': 'award'
};

class RecommendationService {
  // Ensure an interest profile exists for a user
  public getOrInitProfile(userId: string): UserInterestProfile {
    const db = (dbService as any).db;
    if (!db.userInterestProfiles) {
      db.userInterestProfiles = {};
    }

    if (db.userInterestProfiles[userId]) {
      return db.userInterestProfiles[userId];
    }

    const user = dbService.findUserById(userId);
    const now = new Date().toISOString();

    const initialGenres: Record<string, number> = {};
    const genres = user?.favoriteGenres?.length ? user.favoriteGenres : ['Fantasy', 'Action', 'Dark Fantasy'];
    genres.forEach((g, idx) => {
      initialGenres[g] = Math.max(0.7, 1.0 - idx * 0.1);
    });

    const initialStyles: Record<string, number> = {
      'Deep world-building': 0.9,
      'Fast-paced action': 0.85,
      'Plot twists': 0.8
    };

    const newProfile: UserInterestProfile = {
      id: `uip_${userId}`,
      userId,
      preferredGenres: initialGenres,
      preferredSubgenres: [],
      preferredLanguages: ['English'],
      preferredUiLanguage: 'English',
      preferredStoryStyles: initialStyles,
      preferredThemes: user?.favoriteThemes?.length ? user.favoriteThemes : ['World Building', 'Original Universe'],
      preferredStoryLengths: ['Medium', 'Long'],
      preferredSerialization: ['Serialized chapters', 'Light novels'],
      preferredReadingFrequency: 'Daily',
      preferredEndingStyles: ['Unexpected', 'Bittersweet'],
      animePreferences: ['Shonen', 'Dark Fantasy', 'Supernatural'],
      readingMediumPreferences: ['Light Novels', 'Original Fiction', 'Manga-Style Stories'],
      userRoles: user?.role === 'WRITER' ? ['Writer', 'World Builder'] : ['Reader', 'Community Explorer'],
      userInterests: ['Epic Lore', 'Character Development'],
      favoriteAuthorIds: [],
      favoriteAnimeIds: [],
      seededItemIds: [],
      readerScore: 85,
      writerScore: user?.role === 'WRITER' ? 90 : 20,
      communityScore: 65,
      animeScore: 80,
      hasCompletedOnboarding: false,
      onboardingSkipped: false,
      negativeSignals: {
        dislikedStoryIds: [],
        dislikedGenres: [],
        mutedAuthorIds: [],
        hiddenRecommendationIds: []
      },
      createdAt: now,
      updatedAt: now
    };

    db.userInterestProfiles[userId] = newProfile;
    (dbService as any).commit();
    return newProfile;
  }

  // Save complete onboarding data from the 7-step wizard
  public completeOnboarding(userId: string, data: Partial<UserInterestProfile>): UserInterestProfile {
    const profile = this.getOrInitProfile(userId);
    const now = new Date().toISOString();

    // Calculate dynamic weights for genres
    const genreWeights: Record<string, number> = { ...profile.preferredGenres };
    if (data.preferredGenres) {
      // If array or record
      if (Array.isArray(data.preferredGenres)) {
        (data.preferredGenres as string[]).forEach((g: string, index: number) => {
          genreWeights[g] = Math.max(0.6, 1.0 - index * 0.05);
        });
      } else {
        Object.assign(genreWeights, data.preferredGenres);
      }
    }

    // Story styles
    const styleWeights: Record<string, number> = { ...profile.preferredStoryStyles };
    if (data.preferredStoryStyles) {
      if (Array.isArray(data.preferredStoryStyles)) {
        (data.preferredStoryStyles as string[]).forEach((s: string) => {
          styleWeights[s] = 0.9;
        });
      } else {
        Object.assign(styleWeights, data.preferredStoryStyles);
      }
    }

    // Compute persona scores
    const roles = data.userRoles || profile.userRoles || [];
    let readerScore = 50;
    let writerScore = 20;
    let communityScore = 40;
    let animeScore = 40;

    if (roles.includes('Reader')) readerScore += 40;
    if (roles.includes('Writer')) writerScore += 70;
    if (roles.includes('World Builder')) {
      writerScore += 30;
      readerScore += 10;
    }
    if (roles.includes('Community Explorer') || roles.includes('Reviewer')) communityScore += 45;
    if (roles.includes('Anime Explorer')) animeScore += 50;

    const updatedProfile: UserInterestProfile = {
      ...profile,
      preferredGenres: genreWeights,
      preferredLanguages: data.preferredLanguages?.length ? data.preferredLanguages : profile.preferredLanguages,
      preferredUiLanguage: data.preferredUiLanguage || profile.preferredUiLanguage,
      preferredStoryStyles: styleWeights,
      preferredThemes: data.preferredThemes || profile.preferredThemes,
      preferredStoryLengths: data.preferredStoryLengths || profile.preferredStoryLengths,
      preferredSerialization: data.preferredSerialization || profile.preferredSerialization,
      preferredReadingFrequency: data.preferredReadingFrequency || profile.preferredReadingFrequency,
      preferredEndingStyles: data.preferredEndingStyles || profile.preferredEndingStyles,
      animePreferences: data.animePreferences || profile.animePreferences,
      readingMediumPreferences: data.readingMediumPreferences || profile.readingMediumPreferences,
      userRoles: roles,
      userInterests: data.userInterests || profile.userInterests,
      favoriteAuthorIds: data.favoriteAuthorIds || profile.favoriteAuthorIds,
      favoriteAnimeIds: data.favoriteAnimeIds || profile.favoriteAnimeIds,
      seededItemIds: data.seededItemIds || profile.seededItemIds,
      readerScore: Math.min(100, readerScore),
      writerScore: Math.min(100, writerScore),
      communityScore: Math.min(100, communityScore),
      animeScore: Math.min(100, animeScore),
      hasCompletedOnboarding: true,
      onboardingSkipped: false,
      updatedAt: now
    };

    const db = (dbService as any).db;
    db.userInterestProfiles[userId] = updatedProfile;

    // Synchronize favorite genres and themes to the User model
    const topGenres = Object.keys(genreWeights)
      .sort((a, b) => (genreWeights[b] || 0) - (genreWeights[a] || 0))
      .slice(0, 5);

    dbService.updateUser(userId, {
      favoriteGenres: topGenres,
      favoriteThemes: updatedProfile.preferredThemes
    });

    (dbService as any).commit();

    // Record onboarding completed event
    this.recordBehaviorEvent(userId, {
      eventType: 'share', // milestone
      contentType: 'STORY',
      contentId: 'onboarding_milestone',
      metadata: { roles, topGenres }
    });

    return updatedProfile;
  }

  // Skip onboarding with clean baseline
  public skipOnboarding(userId: string): UserInterestProfile {
    const profile = this.getOrInitProfile(userId);
    profile.hasCompletedOnboarding = true;
    profile.onboardingSkipped = true;
    profile.updatedAt = new Date().toISOString();

    const db = (dbService as any).db;
    db.userInterestProfiles[userId] = profile;
    (dbService as any).commit();
    return profile;
  }

  // Update preferences from "My Taste" settings
  public updateProfilePreferences(userId: string, updates: Partial<UserInterestProfile>): UserInterestProfile {
    const profile = this.getOrInitProfile(userId);
    const db = (dbService as any).db;

    const merged: UserInterestProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    db.userInterestProfiles[userId] = merged;

    if (merged.preferredGenres) {
      const topGenres = Object.keys(merged.preferredGenres)
        .sort((a, b) => (merged.preferredGenres[b] || 0) - (merged.preferredGenres[a] || 0))
        .slice(0, 5);
      dbService.updateUser(userId, { favoriteGenres: topGenres });
    }

    (dbService as any).commit();
    return merged;
  }

  // Record user interaction and adjust weights dynamically
  public recordBehaviorEvent(
    userId: string,
    event: {
      eventType: BehaviorEventType;
      contentType: 'STORY' | 'CHAPTER' | 'AUTHOR' | 'COMMUNITY' | 'ANIME' | 'UNIVERSE';
      contentId: string;
      metadata?: Record<string, any>;
    }
  ): void {
    const db = (dbService as any).db;
    if (!db.userBehaviorEvents) {
      db.userBehaviorEvents = [];
    }

    const eventRecord: UserBehaviorEvent = {
      id: `bev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      eventType: event.eventType,
      contentType: event.contentType,
      contentId: event.contentId,
      metadata: event.metadata,
      createdAt: new Date().toISOString()
    };

    db.userBehaviorEvents.push(eventRecord);

    // Keep events list clean (cap at 5,000)
    if (db.userBehaviorEvents.length > 5000) {
      db.userBehaviorEvents = db.userBehaviorEvents.slice(-4000);
    }

    // Dynamic weight adjustments
    this.adjustWeightsFromEvent(userId, eventRecord);

    (dbService as any).commit();
  }

  // Fine-tune interest weights based on behavior signals
  private adjustWeightsFromEvent(userId: string, event: UserBehaviorEvent): void {
    const profile = this.getOrInitProfile(userId);
    let dirty = false;

    if (event.contentType === 'STORY' || event.contentType === 'CHAPTER') {
      const storyId = event.contentType === 'STORY' ? event.contentId : event.metadata?.storyId;
      const story = storyId ? dbService.findStoryByIdOrSlug(storyId) : undefined;

      if (story) {
        const genre = story.genre;
        const currentWeight = profile.preferredGenres[genre] ?? 0.5;

        let delta = 0;
        switch (event.eventType) {
          case 'chapter_completed':
            delta = 0.08;
            break;
          case 'story_completed':
            delta = 0.15;
            break;
          case 'bookmark':
            delta = 0.10;
            break;
          case 'like':
            delta = 0.06;
            break;
          case 'rating':
            const stars = Number(event.metadata?.rating || 5);
            delta = stars >= 4 ? 0.12 : stars <= 2 ? -0.12 : 0.02;
            break;
          case 'review':
            delta = 0.10;
            break;
          case 'story_open':
            delta = 0.02;
            break;
          case 'feedback_not_interested':
            delta = -0.15;
            if (!profile.negativeSignals.dislikedStoryIds.includes(story.id)) {
              profile.negativeSignals.dislikedStoryIds.push(story.id);
            }
            break;
          case 'feedback_dislike_genre':
            delta = -1.0;
            if (!profile.negativeSignals.dislikedGenres.includes(genre)) {
              profile.negativeSignals.dislikedGenres.push(genre);
            }
            break;
          case 'feedback_mute_author':
            if (!profile.negativeSignals.mutedAuthorIds.includes(story.authorId)) {
              profile.negativeSignals.mutedAuthorIds.push(story.authorId);
            }
            break;
        }

        if (delta !== 0) {
          const newWeight = Math.max(0.0, Math.min(1.0, currentWeight + delta));
          profile.preferredGenres[genre] = parseFloat(newWeight.toFixed(3));
          profile.updatedAt = new Date().toISOString();
          dirty = true;
        }

        // Also subtly tune story styles from tags
        if (story.tags?.length && ['bookmark', 'story_completed', 'rating'].includes(event.eventType)) {
          story.tags.forEach(tag => {
            const currentStyle = profile.preferredStoryStyles[tag] ?? 0.5;
            profile.preferredStoryStyles[tag] = Math.min(1.0, parseFloat((currentStyle + 0.05).toFixed(3)));
            dirty = true;
          });
        }
      }
    }

    if (dirty) {
      const db = (dbService as any).db;
      db.userInterestProfiles[userId] = profile;
    }
  }

  // Recommendation Feedback (Not Interested / Mute / Exclude)
  public handleFeedback(
    userId: string,
    action: 'NOT_INTERESTED' | 'DISLIKE_GENRE' | 'MUTE_AUTHOR' | 'DONT_RECOMMEND_STORY',
    targetId: string,
    extraMeta?: any
  ): UserInterestProfile {
    const profile = this.getOrInitProfile(userId);

    if (action === 'NOT_INTERESTED' || action === 'DONT_RECOMMEND_STORY') {
      if (!profile.negativeSignals.dislikedStoryIds.includes(targetId)) {
        profile.negativeSignals.dislikedStoryIds.push(targetId);
      }
      this.recordBehaviorEvent(userId, {
        eventType: 'feedback_not_interested',
        contentType: 'STORY',
        contentId: targetId,
        metadata: extraMeta
      });
    } else if (action === 'DISLIKE_GENRE') {
      if (!profile.negativeSignals.dislikedGenres.includes(targetId)) {
        profile.negativeSignals.dislikedGenres.push(targetId);
      }
      profile.preferredGenres[targetId] = 0.0;
      this.recordBehaviorEvent(userId, {
        eventType: 'feedback_dislike_genre',
        contentType: 'STORY',
        contentId: targetId,
        metadata: extraMeta
      });
    } else if (action === 'MUTE_AUTHOR') {
      if (!profile.negativeSignals.mutedAuthorIds.includes(targetId)) {
        profile.negativeSignals.mutedAuthorIds.push(targetId);
      }
      this.recordBehaviorEvent(userId, {
        eventType: 'feedback_mute_author',
        contentType: 'AUTHOR',
        contentId: targetId,
        metadata: extraMeta
      });
    }

    profile.updatedAt = new Date().toISOString();
    const db = (dbService as any).db;
    db.userInterestProfiles[userId] = profile;
    (dbService as any).commit();
    return profile;
  }

  // Restore negative signal
  public restoreNegativeSignal(
    userId: string,
    type: 'story' | 'genre' | 'author',
    targetId: string
  ): UserInterestProfile {
    const profile = this.getOrInitProfile(userId);
    if (type === 'story') {
      profile.negativeSignals.dislikedStoryIds = profile.negativeSignals.dislikedStoryIds.filter(id => id !== targetId);
    } else if (type === 'genre') {
      profile.negativeSignals.dislikedGenres = profile.negativeSignals.dislikedGenres.filter(g => g !== targetId);
      profile.preferredGenres[targetId] = 0.6; // restore baseline
    } else if (type === 'author') {
      profile.negativeSignals.mutedAuthorIds = profile.negativeSignals.mutedAuthorIds.filter(id => id !== targetId);
    }
    profile.updatedAt = new Date().toISOString();
    (dbService as any).commit();
    return profile;
  }

  // Admin settings management
  public getAdminSettings(): AdminRecommendationSettings {
    const db = (dbService as any).db;
    if (!db.adminRecommendationSettings) {
      db.adminRecommendationSettings = { ...DEFAULT_ADMIN_SETTINGS };
      (dbService as any).commit();
    }
    return db.adminRecommendationSettings;
  }

  public updateAdminSettings(settings: Partial<AdminRecommendationSettings>, adminUser?: User): AdminRecommendationSettings {
    const db = (dbService as any).db;
    const current = this.getAdminSettings();

    const updated: AdminRecommendationSettings = {
      ...current,
      ...settings,
      weights: {
        ...current.weights,
        ...(settings.weights || {})
      },
      updatedAt: new Date().toISOString(),
      updatedBy: adminUser?.username || 'admin'
    };

    db.adminRecommendationSettings = updated;
    (dbService as any).commit();
    return updated;
  }

  // Score a story for a specific user profile
  private scoreStory(
    story: Story,
    profile: UserInterestProfile,
    weights: AdminRecommendationSettings['weights'],
    readingProgress: ReadingProgress[],
    followedAuthorIds: string[]
  ): { score: number; explanation: string; matchedTags: string[] } {
    // 1. Strict Exclusions
    if (profile.negativeSignals.dislikedStoryIds.includes(story.id)) {
      return { score: -999, explanation: 'Disliked story', matchedTags: [] };
    }
    if (profile.negativeSignals.mutedAuthorIds.includes(story.authorId)) {
      return { score: -999, explanation: 'Author muted', matchedTags: [] };
    }
    if (profile.negativeSignals.dislikedGenres.includes(story.genre)) {
      return { score: -999, explanation: 'Genre excluded', matchedTags: [] };
    }

    let totalScore = 0;
    const matchedReasons: string[] = [];
    const matchedTags: string[] = [];

    // Genre match
    const genreWeight = profile.preferredGenres[story.genre] ?? 0.3;
    totalScore += genreWeight * weights.genreMatch * 100;
    if (genreWeight >= 0.7) {
      matchedReasons.push(`You have a strong affinity for ${story.genre}`);
    }

    // Theme / Style match
    let themeScore = 0;
    if (story.tags?.length) {
      story.tags.forEach(tag => {
        if (profile.preferredStoryStyles[tag]) {
          themeScore += profile.preferredStoryStyles[tag];
          matchedTags.push(tag);
        } else if (profile.preferredThemes?.includes(tag)) {
          themeScore += 0.8;
          matchedTags.push(tag);
        }
      });
      themeScore = Math.min(1.0, themeScore / 2);
    }
    totalScore += themeScore * weights.themeMatch * 100;
    if (matchedTags.length > 0) {
      matchedReasons.push(`Matches your themes: ${matchedTags.slice(0, 2).join(', ')}`);
    }

    // Language match (considers preferred reading languages + current UI language)
    const storyLang = story.language || 'English';
    const uiLang = profile.preferredUiLanguage || 'English';
    const isUiMatch = storyLang.toLowerCase() === uiLang.toLowerCase();
    const isPreferredContent = profile.preferredLanguages?.some(l => l.toLowerCase() === storyLang.toLowerCase());

    let langMatch = 0.2;
    if (isUiMatch) {
      langMatch = 1.4;
      matchedReasons.push(`Matches your active interface language (${storyLang})`);
    } else if (isPreferredContent) {
      langMatch = 1.0;
      matchedReasons.push(`Matches your reading language preference (${storyLang})`);
    }
    totalScore += langMatch * weights.languageMatch * 100;

    // Story-type / Medium match
    const storyType = story.storyType || 'Original Fiction';
    let mediumMatch = 0.5;
    if (profile.readingMediumPreferences?.includes(storyType)) {
      mediumMatch = 1.0;
      matchedReasons.push(`Matches your preferred medium (${storyType})`);
    } else if (profile.preferredSerialization?.some(s => s.toLowerCase().includes(storyType.toLowerCase()))) {
      mediumMatch = 0.9;
    }
    totalScore += mediumMatch * weights.storyTypeMatch * 100;

    // Behavioral / Reading history
    const userProgress = readingProgress.find(rp => rp.storyId === story.id);
    let historyScore = 0.5;
    if (userProgress) {
      // In progress but not finished = high affinity
      historyScore = userProgress.progressPercent < 100 ? 0.95 : 0.4;
      if (userProgress.progressPercent < 100) {
        matchedReasons.push('Continue reading from where you left off');
      }
    }
    totalScore += historyScore * weights.behavioralSimilarity * 100;

    // Author Affinity
    const isFollowed = followedAuthorIds.includes(story.authorId);
    const authorScore = isFollowed ? 1.0 : profile.favoriteAuthorIds?.includes(story.authorId) ? 0.9 : 0.3;
    totalScore += authorScore * weights.authorAffinity * 100;
    if (isFollowed) {
      matchedReasons.push(`From @${story.authorUsername}, whom you follow`);
    }

    // Quality (Rating & Engagement)
    const ratingNorm = (story.rating || 4.5) / 5.0;
    totalScore += ratingNorm * weights.contentQuality * 100;

    // Freshness
    const ageDays = (Date.now() - new Date(story.updatedAt || story.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const freshness = Math.max(0.1, 1.0 - Math.min(1.0, ageDays / 60));
    totalScore += freshness * weights.freshness * 100;

    // Build compelling, natural editorial explanation
    let explanation = `Recommended for your taste in ${story.genre}`;
    if (isFollowed) {
      explanation = `From author @${story.authorUsername} whom you follow`;
    } else if (matchedTags.length >= 2) {
      explanation = `Because you enjoy ${matchedTags[0]} and ${matchedTags[1]}`;
    } else if (genreWeight >= 0.8) {
      explanation = `High match with your love for ${story.genre}`;
    } else if (story.views > 20000) {
      explanation = `Trending among readers with similar taste`;
    } else if (userProgress && userProgress.progressPercent < 100) {
      explanation = `Continue reading: ${userProgress.progressPercent}% completed`;
    }

    return {
      score: parseFloat(totalScore.toFixed(2)),
      explanation,
      matchedTags: matchedTags.slice(0, 3)
    };
  }

  // Compute Story DNA breakdown
  public computeStoryDna(profile: UserInterestProfile): StoryDna {
    const genreEntries = Object.entries(profile.preferredGenres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const topGenres = genreEntries.map(([name, weight]) => ({
      name,
      weight: Math.round(weight * 100),
      emoji: GENRE_EMOJIS[name] || '✨'
    }));

    const styleEntries = Object.entries(profile.preferredStoryStyles)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const topStyles = styleEntries.map(([name, weight]) => ({
      name,
      weight: Math.round(weight * 100),
      icon: STYLE_ICONS[name] || 'sparkles'
    }));

    let primaryArchetype = 'The Imaginative Wanderer';
    if (profile.writerScore > 65) primaryArchetype = 'The Cosmic World-Weaver';
    else if (profile.animeScore > 75) primaryArchetype = 'The Shonen & Lore Scholar';
    else if (profile.preferredGenres['Dark Fantasy'] > 0.8) primaryArchetype = 'The Shadowbound Explorer';
    else if (profile.preferredGenres['Romance'] > 0.8) primaryArchetype = 'The Celestial Romantic';
    else if (profile.preferredGenres['Sci-Fi'] > 0.8) primaryArchetype = 'The Cybernetic Visionary';

    const uiLang = profile.preferredUiLanguage || 'English';
    const archetypeTranslations: Record<string, Record<string, string>> = {
      Japanese: {
        'The Cosmic World-Weaver': '宇宙の創造主（ワールド・ウィーバー）',
        'The Shonen & Lore Scholar': '熱血と神話の探求者',
        'The Shadowbound Explorer': '深淵を彷徨う影の開拓者',
        'The Celestial Romantic': '星屑のロマンチスト',
        'The Cybernetic Visionary': 'サイバー・ヴィジョナリー',
        'The Imaginative Wanderer': '夢想の放浪者'
      },
      Spanish: {
        'The Cosmic World-Weaver': 'El Tejedor Cósmico',
        'The Shonen & Lore Scholar': 'Erudito del Shonen y del Lore',
        'The Shadowbound Explorer': 'Explorador de las Sombras',
        'The Celestial Romantic': 'Romántico Celestial',
        'The Cybernetic Visionary': 'Visionario Cibernético',
        'The Imaginative Wanderer': 'Caminante Imaginativo'
      },
      French: {
        'The Cosmic World-Weaver': 'Le Tisseur de Mondes Cosmiques',
        'The Shonen & Lore Scholar': 'Érudit du Shonen et du Lore',
        'The Shadowbound Explorer': 'Explorateur des Ténèbres',
        'The Celestial Romantic': 'Romantique Céleste',
        'The Cybernetic Visionary': 'Visionnaire Cybernétique',
        'The Imaginative Wanderer': 'Vagabond de l\'Imaginaire'
      },
      Korean: {
        'The Cosmic World-Weaver': '우주를 엮는 세계 창조자',
        'The Shonen & Lore Scholar': '소년 만화 & 세계관 탐구자',
        'The Shadowbound Explorer': '그림자에 깃든 모험가',
        'The Celestial Romantic': '별빛의 로맨티스트',
        'The Cybernetic Visionary': '사이버네틱 비전가',
        'The Imaginative Wanderer': '상상하는 방랑자'
      },
      Hindi: {
        'The Cosmic World-Weaver': 'ब्रह्मांडीय विश्व-निर्माता',
        'The Shonen & Lore Scholar': 'शौनेन और गाथा अन्वेषक',
        'The Shadowbound Explorer': 'छायाबद्ध अन्वेषक',
        'The Celestial Romantic': 'दिव्य प्रेमी',
        'The Cybernetic Visionary': 'साइबरनेटिक स्वप्नदृष्टा',
        'The Imaginative Wanderer': 'कल्पनाशील पथिक'
      },
      Marathi: {
        'The Cosmic World-Weaver': 'विश्वाचा कथा-निर्माता',
        'The Shonen & Lore Scholar': 'शौनेन आणि पुराण अभ्यासक',
        'The Shadowbound Explorer': 'गूढ सावल्यांचा शोधक',
        'The Celestial Romantic': 'तारकांचा कल्पक प्रेमी',
        'The Cybernetic Visionary': 'सायबरनेटिक द्रष्टा',
        'The Imaginative Wanderer': 'कल्पक वाटसरू'
      },
      German: {
        'The Cosmic World-Weaver': 'Der kosmische Weltenweber',
        'The Shonen & Lore Scholar': 'Shonen- & Lore-Gelehrter',
        'The Shadowbound Explorer': 'Der schattengebundene Forscher',
        'The Celestial Romantic': 'Der himmlische Romantiker',
        'The Cybernetic Visionary': 'Der kybernetische Visionär',
        'The Imaginative Wanderer': 'Der phantasievolle Wanderer'
      },
      Portuguese: {
        'The Cosmic World-Weaver': 'O Tecelão Cósmico',
        'The Shonen & Lore Scholar': 'Erudito Shonen e de Lore',
        'The Shadowbound Explorer': 'Explorador das Sombras',
        'The Celestial Romantic': 'Romântico Celestial',
        'The Cybernetic Visionary': 'Visionário Cibernético',
        'The Imaginative Wanderer': 'Andarilho Imaginativo'
      }
    };

    if (archetypeTranslations[uiLang]?.[primaryArchetype]) {
      primaryArchetype = archetypeTranslations[uiLang][primaryArchetype];
    }

    return {
      topGenres,
      topStyles,
      primaryMedium: profile.readingMediumPreferences?.[0] || 'Light Novels',
      languages: profile.preferredLanguages || ['English'],
      readingPace: profile.preferredReadingFrequency || 'Daily',
      primaryArchetype
    };
  }

  // Generate Personalized Home Feed
  public generateHomeFeed(userId?: string, requestedUiLanguage?: string): PersonalizedHomeFeed {
    const allStories = dbService.getStories();
    const adminSettings = this.getAdminSettings();
    const weights = adminSettings.weights;

    let profile: UserInterestProfile;
    let readingProgress: ReadingProgress[] = [];
    let followedAuthorIds: string[] = [];

    if (userId) {
      profile = this.getOrInitProfile(userId);
      if (requestedUiLanguage && profile.preferredUiLanguage !== requestedUiLanguage) {
        profile.preferredUiLanguage = requestedUiLanguage;
        if (!profile.preferredLanguages.includes(requestedUiLanguage)) {
          profile.preferredLanguages.unshift(requestedUiLanguage);
        }
      }
      readingProgress = dbService.getUserReadingProgress(userId);

      // Followed authors
      const db = (dbService as any).db;
      for (const authorId of Object.keys(db.follows || {})) {
        if (db.follows[authorId]?.includes(userId)) {
          followedAuthorIds.push(authorId);
        }
      }
    } else {
      // Guest / Fallback profile with requested UI language
      const uiLang = requestedUiLanguage || 'English';
      profile = {
        id: 'guest',
        userId: 'guest',
        preferredGenres: { 'Fantasy': 0.95, 'Action': 0.85, 'Sci-Fi': 0.8, 'Dark Fantasy': 0.75 },
        preferredSubgenres: [],
        preferredLanguages: Array.from(new Set([uiLang, 'English'])),
        preferredUiLanguage: uiLang,
        preferredStoryStyles: { 'Deep world-building': 0.9, 'Fast-paced action': 0.85 },
        preferredThemes: ['World Building', 'Original Universe'],
        preferredStoryLengths: ['Medium'],
        preferredSerialization: ['Serialized chapters'],
        preferredReadingFrequency: 'Daily',
        preferredEndingStyles: ['Unexpected'],
        animePreferences: ['Shonen', 'Dark Fantasy'],
        readingMediumPreferences: ['Light Novels', 'Original Fiction'],
        userRoles: ['Reader'],
        userInterests: ['Adventures'],
        favoriteAuthorIds: [],
        favoriteAnimeIds: [],
        seededItemIds: [],
        readerScore: 80,
        writerScore: 30,
        communityScore: 60,
        animeScore: 70,
        hasCompletedOnboarding: false,
        negativeSignals: {
          dislikedStoryIds: [],
          dislikedGenres: [],
          mutedAuthorIds: [],
          hiddenRecommendationIds: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Score all available stories
    const scoredStories: RecommendationStoryItem[] = [];
    for (const story of allStories) {
      const { score, explanation, matchedTags } = this.scoreStory(story, profile, weights, readingProgress, followedAuthorIds);
      if (score > 0) {
        scoredStories.push({ story, score, explanation, matchedTags });
      }
    }

    // Sort descending by score
    scoredStories.sort((a, b) => b.score - a.score);

    // Continue reading (if user has active unfinished chapter)
    const unfinishedProgress = readingProgress
      .filter(rp => rp.progressPercent < 100)
      .sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime());
    const continueReading = unfinishedProgress.length > 0 ? unfinishedProgress[0] : null;

    // Featured hero story
    // Pick the top scoring story that isn't finished yet
    let featuredHeroStory: Story | null = null;
    let heroExplanation = 'Specially curated for your universe';

    if (scoredStories.length > 0) {
      // Find top item
      featuredHeroStory = scoredStories[0].story;
      heroExplanation = scoredStories[0].explanation;
    }

    // Curated sections based on Top Genres
    const topGenreKeys = Object.keys(profile.preferredGenres)
      .sort((a, b) => (profile.preferredGenres[b] || 0) - (profile.preferredGenres[a] || 0))
      .filter(g => !profile.negativeSignals.dislikedGenres.includes(g))
      .slice(0, 3);

    const curatedSections: PersonalizedHomeFeed['curatedSections'] = [];

    topGenreKeys.forEach((genre, index) => {
      const genreStories = scoredStories.filter(s => s.story.genre.toLowerCase() === genre.toLowerCase());
      if (genreStories.length > 0) {
        const headline = index === 0
          ? `Because you love ${genre}`
          : index === 1
          ? `Immersive ${genre} Worlds`
          : `Deep Dive into ${genre}`;

        const subheadline = index === 0
          ? 'Selected stories matching your tone and storytelling preferences'
          : 'High affinity recommendations based on your reading history';

        curatedSections.push({
          id: `sec_${genre.toLowerCase().replace(/\s+/g, '_')}`,
          headline,
          subheadline,
          explanation: `Ranked by your ${genre} affinity (${Math.round((profile.preferredGenres[genre] || 0.8) * 100)}% match)`,
          stories: genreStories.slice(0, 6)
        });
      }
    });

    // Trending for you (mix of high popularity + preference match)
    const trendingForYou = [...scoredStories]
      .sort((a, b) => (b.story.views * 0.4 + b.score * 0.6) - (a.story.views * 0.4 + a.score * 0.6))
      .slice(0, 6);

    // From followed authors
    const fromFollowedAuthors = scoredStories
      .filter(s => followedAuthorIds.includes(s.story.authorId))
      .slice(0, 6);

    // Recommended communities
    const allCommunities = dbService.getCommunities(userId);
    const recommendedCommunities = allCommunities
      .filter(c => {
        // Match community by name or description with top genres
        return topGenreKeys.some(g =>
          c.name.toLowerCase().includes(g.toLowerCase()) ||
          c.description.toLowerCase().includes(g.toLowerCase())
        ) || c.memberCount > 5000;
      })
      .slice(0, 4);

    // Recommended Authors
    const allUsers = (dbService as any).db.users as User[];
    const recommendedAuthors: AuthorRecommendationItem[] = [];
    const writers = allUsers.filter(u => u.role === 'WRITER' || (u.publishedStoriesCount || 0) > 0);

    for (const writer of writers) {
      if (writer.id === userId) continue;
      const isFollowing = followedAuthorIds.includes(writer.id);
      const writerStories = allStories.filter(s => s.authorId === writer.id);
      const writerGenres = Array.from(new Set(writerStories.map(s => s.genre)));

      const hasGenreOverlap = writerGenres.some(g => topGenreKeys.includes(g));
      if (hasGenreOverlap || writer.followersCount > 100) {
        recommendedAuthors.push({
          authorId: writer.id,
          authorUsername: writer.username,
          authorDisplayName: writer.displayName,
          authorAvatar: writer.avatar || '',
          topGenres: writerGenres.length ? writerGenres : writer.favoriteGenres || ['Fantasy'],
          matchReason: hasGenreOverlap
            ? `Specializes in ${writerGenres.slice(0, 2).join(' & ')}`
            : 'Celebrated KAIRO Storyteller',
          followersCount: writer.followersCount || 0,
          totalReads: writer.totalReads || 0,
          isFollowing
        });
      }
    }

    // Anime Bridges: Bridge anime tastes with original KAIRO light novels
    const allAnime = dbService.getAnimeEntries();
    const animeBridges: AnimeBridgeItem[] = [];

    const userAnimeTags = profile.animePreferences || ['Shonen', 'Dark Fantasy'];
    for (const anime of allAnime.slice(0, 3)) {
      // Find original stories that match the anime's tone
      const connected = scoredStories
        .filter(s => s.story.tags?.some(t => anime.genres.includes(t)) || s.story.genre === anime.genres[0])
        .slice(0, 2)
        .map(s => s.story);

      if (connected.length > 0) {
        animeBridges.push({
          anime,
          bridgeReason: `If you love ${anime.title}'s ${anime.genres.slice(0, 2).join(' / ')} energy...`,
          connectedStories: connected
        });
      }
    }

    // Rising stories (recently updated, strong ratings)
    const risingStories = [...scoredStories]
      .sort((a, b) => b.story.rating - a.story.rating)
      .slice(0, 6);

    // Serendipity stories (diversity rule: 5% serendipity to break filter bubbles)
    const serendipityStories = scoredStories
      .filter(s => !topGenreKeys.includes(s.story.genre))
      .slice(0, 4);

    // Greeting personalization with localized salutation
    const hour = new Date().getHours();
    const timeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const user = userId ? dbService.findUserById(userId) : null;
    const userName = user?.displayName || user?.username || (profile.preferredUiLanguage === 'Japanese' ? '旅人' : profile.preferredUiLanguage === 'Spanish' ? 'Caminante' : profile.preferredUiLanguage === 'French' ? 'Voyageur' : 'Wanderer');

    const uiLangCode = (profile.preferredUiLanguage || 'English').toLowerCase();
    let greeting = `${timeSlot === 'morning' ? 'Good morning' : timeSlot === 'afternoon' ? 'Good afternoon' : 'Good evening'}, ${userName}`;

    if (uiLangCode.includes('japan')) {
      greeting = timeSlot === 'morning' ? `おはようございます、${userName}さん` : timeSlot === 'afternoon' ? `こんにちは、${userName}さん` : `こんばんは、${userName}さん`;
    } else if (uiLangCode.includes('span')) {
      greeting = timeSlot === 'morning' ? `¡Buenos días, ${userName}!` : timeSlot === 'afternoon' ? `¡Buenas tardes, ${userName}!` : `¡Buenas noches, ${userName}!`;
    } else if (uiLangCode.includes('french')) {
      greeting = timeSlot === 'evening' ? `Bonsoir, ${userName} !` : `Bonjour, ${userName} !`;
    } else if (uiLangCode.includes('korean')) {
      greeting = timeSlot === 'morning' ? `좋은 아침입니다, ${userName}님` : timeSlot === 'afternoon' ? `안녕하세요, ${userName}님` : `좋은 저녁입니다, ${userName}님`;
    } else if (uiLangCode.includes('hindi')) {
      greeting = timeSlot === 'morning' ? `सुप्रभात, ${userName}!` : timeSlot === 'afternoon' ? `नमस्ते, ${userName}!` : `शुभ संध्या, ${userName}!`;
    } else if (uiLangCode.includes('marathi')) {
      greeting = timeSlot === 'morning' ? `शुभ सकाळ, ${userName}!` : timeSlot === 'afternoon' ? `नमस्कार, ${userName}!` : `शुभ संध्याकाळ, ${userName}!`;
    } else if (uiLangCode.includes('german')) {
      greeting = timeSlot === 'morning' ? `Guten Morgen, ${userName}!` : timeSlot === 'afternoon' ? `Guten Tag, ${userName}!` : `Guten Abend, ${userName}!`;
    } else if (uiLangCode.includes('portuguese')) {
      greeting = timeSlot === 'morning' ? `Bom dia, ${userName}!` : timeSlot === 'afternoon' ? `Boa tarde, ${userName}!` : `Boa noite, ${userName}!`;
    }

    return {
      greeting,
      storyDna: this.computeStoryDna(profile),
      featuredHeroStory,
      heroExplanation,
      continueReading,
      curatedSections,
      trendingForYou,
      fromFollowedAuthors,
      recommendedCommunities,
      recommendedAuthors: recommendedAuthors.slice(0, 5),
      animeBridges,
      risingStories,
      serendipityStories
    };
  }

  // Generate Personalized Discover Feed
  public generateDiscoverFeed(userId?: string, requestedUiLanguage?: string): PersonalizedDiscoverFeed {
    const home = this.generateHomeFeed(userId, requestedUiLanguage);
    const profile = userId ? this.getOrInitProfile(userId) : null;

    const topGenresFiltered = (home.curatedSections || []).map(sec => ({
      genre: sec.headline.replace(/^(Because you love|Immersive|Deep Dive into)\s*/i, ''),
      stories: sec.stories
    }));

    return {
      headline: 'Discover Your Next Literary Universe',
      subheadline: 'Curated continuously based on your evolving KAIRO Interest Profile',
      trendingInYourWorld: home.trendingForYou,
      popularWithReadersLikeYou: home.curatedSections[0]?.stories || home.risingStories,
      hiddenGems: home.serendipityStories,
      newReleases: home.risingStories,
      topGenresFiltered
    };
  }

  // Explanation for a specific story recommendation
  public explainRecommendation(userId: string, storyId: string): { explanation: string; factors: string[] } {
    const profile = this.getOrInitProfile(userId);
    const story = dbService.findStoryByIdOrSlug(storyId);
    if (!story) return { explanation: 'Popular story on KAIRO', factors: ['Trending'] };

    const factors: string[] = [];
    if (profile.preferredGenres[story.genre]) {
      factors.push(`${Math.round(profile.preferredGenres[story.genre] * 100)}% match with your preferred genre (${story.genre})`);
    }

    const matchedStyles = story.tags?.filter(t => profile.preferredStoryStyles[t] || profile.preferredThemes.includes(t)) || [];
    if (matchedStyles.length > 0) {
      factors.push(`Shares storytelling styles you love: ${matchedStyles.join(', ')}`);
    }

    if (profile.readingMediumPreferences.includes(story.storyType)) {
      factors.push(`Matches your preferred medium: ${story.storyType}`);
    }

    if (story.rating >= 4.8) {
      factors.push(`Exceptional reader rating (${story.rating.toFixed(1)} ★ from ${story.ratingCount || 100}+ reviews)`);
    }

    const explanation = factors.length > 0
      ? factors.join('. ') + '.'
      : `Recommended because it aligns with your reading pace and favorite themes on KAIRO.`;

    return { explanation, factors };
  }
}

export const recommendationService = new RecommendationService();
