import { 
  Story, Universe, AnimeEntry, Community, 
  UserInterestProfile, StoryDna, PublicUserProfile, User
} from '../types';

export const FALLBACK_USERS: User[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    email: 'admin@kairo.app',
    displayName: 'KAIRO Staff',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    bio: 'Platform administration, system stability, and community curation.',
    role: 'ADMIN',
    xp: 9999,
    level: 50,
    readingStreak: 100,
    lastActiveDate: new Date().toISOString(),
    followersCount: 9999,
    followingCount: 10,
    totalReads: 120000,
    favoriteGenres: ['All Genres'],
    favoriteThemes: ['All Themes'],
    createdAt: '2024-12-01T00:00:00Z',
    status: 'ACTIVE',
    isVerifiedWriter: true,
  },
  {
    id: 'usr_1',
    username: 'althea_v',
    email: 'althea@kairo.app',
    displayName: 'Althea Vance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: 'Author of the Astral Universe light novels. Worldbuilder, anime enthusiast, and narrative architect.',
    role: 'WRITER',
    xp: 4850,
    level: 14,
    readingStreak: 12,
    lastActiveDate: new Date().toISOString(),
    followersCount: 1420,
    followingCount: 38,
    totalReads: 38240,
    favoriteGenres: ['Fantasy', 'Sci-Fi', 'Light Novel'],
    favoriteThemes: ['Magic Systems', 'Character Growth', 'Space Opera'],
    createdAt: '2025-01-10T10:00:00Z',
    status: 'ACTIVE',
    isVerifiedWriter: true,
  },
  {
    id: 'usr_2',
    username: 'voidknight',
    email: 'void@kairo.app',
    displayName: 'Void Knight',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Crafting dark high-fantasy and psychological tales. Living inside character relationships.',
    role: 'WRITER',
    xp: 6200,
    level: 18,
    readingStreak: 25,
    lastActiveDate: new Date().toISOString(),
    followersCount: 2890,
    followingCount: 45,
    totalReads: 89400,
    favoriteGenres: ['Dark Fantasy', 'Mystery', 'Action'],
    favoriteThemes: ['Grimdark', 'Political Intrigue', 'Rivalries'],
    createdAt: '2025-01-05T12:00:00Z',
    status: 'ACTIVE',
    isVerifiedWriter: true,
  },
  {
    id: 'usr_3',
    username: 'sakura_dreamer',
    email: 'sakura@kairo.app',
    displayName: 'Sakura Dreamer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    bio: 'Avid anime watcher, serialized light novel binge-reader, and passionate theory crafter.',
    role: 'USER',
    xp: 1850,
    level: 7,
    readingStreak: 5,
    lastActiveDate: new Date().toISOString(),
    followersCount: 180,
    followingCount: 64,
    totalReads: 1420,
    favoriteGenres: ['Romance', 'Fantasy', 'Isekai'],
    favoriteThemes: ['Wholesome', 'Slice of Life', 'Magic Academia'],
    createdAt: '2025-02-01T08:00:00Z',
    status: 'ACTIVE',
    isVerifiedWriter: false,
  }
];

export const FALLBACK_STORIES: Story[] = [
  {
    id: 'story_1',
    authorId: 'usr_1',
    authorUsername: 'althea_v',
    authorDisplayName: 'Althea Vance',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    title: 'Celestial Drifters: Awakening',
    slug: 'celestial-drifters-awakening',
    description: 'In the sky-isles of Aethelgard, orphan scavenger Aria awakens a forbidden cosmic crest during a midnight eclipse. Thrust into the elite Zenith Academy, she must survive cutthroat rivals, uncover her bloodline\'s dark heritage, and stop a cataclysmic void fracture.',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    genre: 'Fantasy',
    tags: ['Anime-Inspired', 'Light Novel', 'Magic Academy', 'Rivals to Lovers', 'Original Universe', 'Stellar Magic'],
    language: 'English',
    ageRating: 'Teen',
    storyType: 'Light Novel',
    status: 'Ongoing',
    views: 38240,
    likes: 4210,
    rating: 4.9,
    ratingCount: 842,
    universeId: 'uni_1',
    universeName: 'The Astral Universe',
    chaptersCount: 4,
    liveReadersCount: 142,
    featured: true,
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-02-28T16:00:00Z',
  },
  {
    id: 'story_2',
    authorId: 'usr_2',
    authorUsername: 'voidknight',
    authorDisplayName: 'Void Knight',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    title: 'The Shattered Crown',
    slug: 'the-shattered-crown',
    description: 'When the immortal Emperor is assassinated by his own shadow-sworn guard, eight fractured kingdoms plunge into brutal civil war. An exile prince wielding forbidden blood runes embarks on a bloody path to reclaim the throne.',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    genre: 'Dark Fantasy',
    tags: ['Grimdark', 'Serialized Novel', 'Political Intrigue', 'Anti-Hero', 'Epic Magic'],
    language: 'English',
    ageRating: 'Mature',
    storyType: 'Serialized Novel',
    status: 'Ongoing',
    views: 64100,
    likes: 7120,
    rating: 4.8,
    ratingCount: 1250,
    chaptersCount: 3,
    liveReadersCount: 210,
    featured: true,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-02-25T14:30:00Z',
  },
  {
    id: 'story_3',
    authorId: 'usr_1',
    authorUsername: 'althea_v',
    authorDisplayName: 'Althea Vance',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    title: 'Neon Serenade: City of Echoes',
    slug: 'neon-serenade-city-of-echoes',
    description: 'In Neo-Kyoto 2149, memories can be extracted, synthesized, and sold as digital drugs. A renegade synth-artist uncovers an illegal memory chip containing the final thoughts of the megacorp\'s founder.',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    genre: 'Sci-Fi',
    tags: ['Cyberpunk', 'Short Story', 'Anime Aesthetic', 'Mystery', 'Synthwave'],
    language: 'English',
    ageRating: 'Teen',
    storyType: 'Short Story',
    status: 'Completed',
    views: 18450,
    likes: 2190,
    rating: 4.7,
    ratingCount: 420,
    chaptersCount: 2,
    liveReadersCount: 45,
    featured: false,
    createdAt: '2025-01-20T11:00:00Z',
    updatedAt: '2025-02-10T12:00:00Z',
  }
];

export const FALLBACK_UNIVERSES: Universe[] = [
  {
    id: 'uni_1',
    authorId: 'usr_1',
    name: 'The Astral Universe',
    slug: 'the-astral-universe',
    tagline: 'Where ancient stellar resonance meets forgotten cosmic dynasties.',
    description: 'A sprawling multi-world continuity linked by ancient astral conduits and the resonant pulse of dead stars. Across five galaxies, wielders of Celestial Aether battle for the fate of reality.',
    bannerImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    storiesCount: 3,
    charactersCount: 12,
    readersCount: 42800,
    rating: 4.9,
    overviewDoc: 'The Astral Realm exists parallel to mortal perception. Those born under convergence moons manifest Aetherial Crests, allowing manipulation of dimensional currents and cosmic energy.',
    featuredCharacterIds: ['char_1', 'char_2', 'char_3'],
    createdAt: '2025-01-11T12:00:00Z',
  }
];

export const FALLBACK_ANIME: AnimeEntry[] = [
  {
    id: 'ani_1',
    title: 'Frieren: Beyond Journey\'s End',
    altTitles: '葬送のフリーレン',
    poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    synopsis: 'The mage Frieren defeated the Demon King alongside the hero Himmel\'s party after a 10-year quest. As an elf, Frieren lives far longer than her mortal companions, leading her on a reflective quest to understand human emotion.',
    genres: ['Fantasy', 'Adventure', 'Drama'],
    status: 'Completed',
    episodes: 28,
    score: 9.1,
    season: 'Fall 2023',
    studio: 'Madhouse',
  },
  {
    id: 'ani_2',
    title: 'Solo Leveling',
    altTitles: '俺だけレベルアップな件',
    poster: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    synopsis: 'In a world where hunters must battle deadly monsters to protect the human race, Sung Jinwoo, notoriously known as the weakest hunter of all mankind, finds himself in a mysterious quest giving him the unique ability to level up alone.',
    genres: ['Action', 'Fantasy', 'Supernatural'],
    status: 'Airing',
    episodes: 12,
    score: 8.5,
    season: 'Winter 2024',
    studio: 'A-1 Pictures',
  }
];

export const FALLBACK_COMMUNITIES: Community[] = [
  {
    id: 'comm_1',
    name: 'The Astral Universe Fandom',
    slug: 'astral-universe-fandom',
    description: 'The official lore discussions, character theories, and artwork hub for the Astral Universe series.',
    iconImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=200&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    membersCount: 3840,
    postsCount: 142,
    isMember: true,
    type: 'public',
    rules: ['Be respectful', 'Tag spoilers', 'Credit artists'],
    createdAt: '2025-01-15T00:00:00Z',
  }
];

export const FALLBACK_STORY_DNA: StoryDna = {
  topGenres: [
    { name: 'Fantasy', weight: 95, emoji: '✨' },
    { name: 'Action', weight: 85, emoji: '⚔️' },
    { name: 'Sci-Fi', weight: 80, emoji: '🚀' },
    { name: 'Light Novel', weight: 75, emoji: '📖' },
  ],
  topStyles: [
    { name: 'Serialized Light Novel', weight: 90, icon: '📖' },
    { name: 'Multi-Perspective', weight: 80, icon: '👥' },
  ],
  primaryMedium: 'Light Novel',
  languages: ['English'],
  readingPace: 'Fast-Paced & Serialized',
  primaryArchetype: 'Unlikely Protagonist',
};

export const FALLBACK_TASTE_PROFILE: UserInterestProfile = {
  id: 'uip_fallback',
  userId: 'usr_guest',
  preferredGenres: { Fantasy: 0.95, 'Sci-Fi': 0.85, Action: 0.8, 'Light Novel': 0.75 },
  preferredSubgenres: ['Magic Academy', 'Space Opera'],
  preferredLanguages: ['English'],
  preferredUiLanguage: 'English',
  preferredStoryStyles: { 'Fast-paced action': 0.9, 'Character-driven': 0.85 },
  preferredThemes: ['Magic Systems', 'Worldbuilding', 'Academy Life'],
  preferredStoryLengths: ['Medium', 'Long'],
  preferredSerialization: ['Serialized chapters'],
  preferredReadingFrequency: 'Daily',
  preferredEndingStyles: ['Bittersweet', 'Happy'],
  animePreferences: ['Dark Fantasy', 'Shonen'],
  readingMediumPreferences: ['Light Novels', 'Original Fiction'],
  userRoles: ['Reader'],
  userInterests: ['Worldbuilding', 'Light Novels'],
  favoriteAuthorIds: ['usr_1'],
  favoriteAnimeIds: ['ani_1'],
  seededItemIds: [],
  readerScore: 90,
  writerScore: 50,
  communityScore: 70,
  animeScore: 85,
  hasCompletedOnboarding: true,
  negativeSignals: {
    dislikedStoryIds: [],
    dislikedGenres: [],
    mutedAuthorIds: [],
    hiddenRecommendationIds: [],
  },
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-02-01T00:00:00Z',
};

export function getStaticFallback<T>(url: string): T | null {
  const cleanUrl = url.split('?')[0].toLowerCase();

  if (cleanUrl === '/api/health') {
    return { status: 'ok', app: 'KAIRO API (Offline Mode)', timestamp: new Date().toISOString() } as T;
  }

  if (cleanUrl === '/api/stories') {
    return { stories: FALLBACK_STORIES } as T;
  }

  if (cleanUrl === '/api/universes') {
    return { universes: FALLBACK_UNIVERSES } as T;
  }

  if (cleanUrl === '/api/anime') {
    return { anime: FALLBACK_ANIME } as T;
  }

  if (cleanUrl === '/api/communities') {
    return { communities: FALLBACK_COMMUNITIES } as T;
  }

  if (cleanUrl === '/api/theories') {
    return { theories: [] } as T;
  }

  if (cleanUrl === '/api/notifications') {
    return { notifications: [] } as T;
  }

  if (cleanUrl === '/api/reading-progress') {
    return { progress: [] } as T;
  }

  if (cleanUrl === '/api/library') {
    return { library: [] } as T;
  }

  if (cleanUrl === '/api/quote-snippets') {
    return { quotes: [] } as T;
  }

  if (cleanUrl === '/api/events') {
    return { events: [] } as T;
  }

  if (cleanUrl === '/api/contests') {
    return { contests: [] } as T;
  }

  if (cleanUrl === '/api/recommendations/home') {
    const scoredStories = FALLBACK_STORIES.map(s => ({
      story: s,
      score: 90,
      matchReason: 'Trending in Fantasy & Light Novels',
      matchFactors: ['Fantasy Affinity', 'High Rating'],
    }));

    return {
      greeting: 'Welcome to KAIRO',
      storyDna: FALLBACK_STORY_DNA,
      trendingForYou: scoredStories,
      recommendedSerials: scoredStories,
      newTalentSpotlight: scoredStories.slice(0, 1),
      genreBreakdowns: [{ genre: 'Fantasy', count: 2 }, { genre: 'Sci-Fi', count: 1 }],
      communityBuzz: [],
    } as T;
  }

  if (cleanUrl === '/api/recommendations/discover') {
    const scoredStories = FALLBACK_STORIES.map(s => ({
      story: s,
      score: 90,
      matchReason: 'Curated for Explorer',
      matchFactors: ['Popular Fiction'],
    }));

    return {
      headline: 'Explore Curated Universes & Stories',
      subheadline: 'Read serialized fiction and original light novels',
      trendingInYourWorld: scoredStories,
      hiddenGems: scoredStories,
      crossUniverseSuggestions: [],
    } as T;
  }

  if (cleanUrl === '/api/recommendations/profile') {
    return {
      profile: FALLBACK_TASTE_PROFILE,
      storyDna: FALLBACK_STORY_DNA,
    } as T;
  }

  if (cleanUrl.startsWith('/api/users/profile/')) {
    const identifier = decodeURIComponent(cleanUrl.replace('/api/users/profile/', '')).toLowerCase();
    const user = FALLBACK_USERS.find(
      u => u.username.toLowerCase() === identifier || u.id.toLowerCase() === identifier
    ) || FALLBACK_USERS[1];

    const authorStories = FALLBACK_STORIES.filter(s => s.authorId === user.id || s.authorUsername.toLowerCase() === user.username.toLowerCase());

    const profile: PublicUserProfile = {
      user,
      isFollowing: false,
      isSelf: false,
      stories: authorStories,
      posts: [],
      universes: FALLBACK_UNIVERSES.filter(u => u.authorId === user.id),
      theories: [],
      readingList: [],
      certificates: [],
      badges: user.role === 'ADMIN' ? ['Platform Admin'] : user.role === 'WRITER' ? ['Verified Author'] : ['Explorer'],
      stats: {
        totalStories: authorStories.length,
        totalReads: user.totalReads || 0,
        totalLikes: authorStories.reduce((acc, s) => acc + (s.likes || 0), 0),
        totalPosts: 0,
        totalTheories: 0,
        totalUniverses: user.role === 'WRITER' ? 1 : 0,
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        chaptersCount: authorStories.reduce((acc, s) => acc + (s.chaptersCount || 0), 0),
      }
    };
    return profile as T;
  }

  if (cleanUrl.startsWith('/api/stories/')) {
    const slugOrId = cleanUrl.replace('/api/stories/', '');
    const story = FALLBACK_STORIES.find(s => s.slug === slugOrId || s.id === slugOrId) || FALLBACK_STORIES[0];
    return {
      story,
      chapters: [
        {
          id: 'chap_1_1',
          storyId: story.id,
          chapterNumber: 1,
          title: 'Prologue: Starlight Scavenger',
          content: 'The skies over Aethelgard had always smelled of ozone before the harvest storms...',
          authorNote: 'Welcome to Chapter 1! Thank you for reading.',
          views: 12400,
          likes: 980,
          publishedAt: '2025-01-15T09:00:00Z',
          status: 'Published',
          isPremium: false,
        }
      ],
      reviews: [],
    } as T;
  }

  return null;
}
