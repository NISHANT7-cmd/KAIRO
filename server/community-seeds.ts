import { 
  Community, CommunityPost, ChatRoom, ChatMessage, 
  CommunityEvent, CommunityContest, QuoteSnippet, 
  DirectMessageConversation, DirectMessage 
} from '../src/types.js';

export const initialCommunities: Community[] = [
  {
    id: 'comm_astral',
    name: 'The Astral Sanctuary',
    slug: 'astral-sanctuary',
    description: 'Official community for Celestial Drifters and the Astral Universe saga. Explore cosmic lore, discuss theories, and meet the author.',
    bannerImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    iconImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80',
    type: 'story',
    ownerId: 'usr_1',
    ownerName: 'Althea Vance',
    ownerRole: 'WRITER',
    linkedStoryId: 'story_1',
    linkedStoryTitle: 'Celestial Drifters: Awakening',
    categories: ['Discussion', 'Theories', 'Characters', 'World', 'Fan Art', 'Announcements'],
    rules: [
      'Be respectful of fellow lore crafters',
      'Tag all Chapter 4+ plot details with spoiler warnings',
      'Original fan art must credit references'
    ],
    membersCount: 8420,
    activeMembersCount: 142,
    postsCount: 18,
    createdAt: '2025-01-12T00:00:00Z'
  },
  {
    id: 'comm_shattered',
    name: 'The Shattered Keep',
    slug: 'the-shattered-keep',
    description: 'Dark fantasy haven for Prince Lucian\'s rebellion. Blood runes, grim political intrigue, and battle discussions.',
    bannerImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    iconImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    type: 'story',
    ownerId: 'usr_2',
    ownerName: 'Void Knight',
    ownerRole: 'WRITER',
    linkedStoryId: 'story_2',
    linkedStoryTitle: 'The Shattered Crown',
    categories: ['Discussion', 'Theories', 'Characters', 'World', 'Announcements'],
    membersCount: 6850,
    activeMembersCount: 98,
    postsCount: 12,
    createdAt: '2025-01-08T00:00:00Z'
  },
  {
    id: 'comm_dark_fantasy',
    name: 'Dark Fantasy & Grim Lore',
    slug: 'dark-fantasy-lore',
    description: 'For lovers of anti-heroes, high stakes, forbidden magic systems, and morally grey epics.',
    bannerImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&auto=format&fit=crop&q=80',
    iconImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
    type: 'genre',
    categories: ['General', 'Recommendations', 'Worldbuilding', 'Debates'],
    membersCount: 14200,
    activeMembersCount: 310,
    postsCount: 34,
    createdAt: '2025-01-05T00:00:00Z'
  },
  {
    id: 'comm_anime_hype',
    name: 'Anime Theories & Seasonal Hype',
    slug: 'anime-theories-seasonal-hype',
    description: 'Weekly episode breakdowns, manga comparisons, studio analyses, and seasonal tier lists.',
    bannerImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    iconImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    type: 'fandom',
    categories: ['Weekly Episodes', 'Manga vs Anime', 'Theories', 'Art'],
    membersCount: 22100,
    activeMembersCount: 520,
    postsCount: 42,
    createdAt: '2025-01-02T00:00:00Z'
  },
  {
    id: 'comm_writers_workshop',
    name: 'Light Novel Writers Workshop',
    slug: 'writers-workshop',
    description: 'Peer critiques, pacing discussions, magic system design, and serialized storytelling masterclasses.',
    bannerImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&auto=format&fit=crop&q=80',
    iconImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    type: 'creator',
    categories: ['Critique', 'Worldbuilding', 'Dialogue', 'Milestones'],
    membersCount: 6510,
    activeMembersCount: 85,
    postsCount: 16,
    createdAt: '2025-01-08T00:00:00Z'
  },
  {
    id: 'comm_althea',
    name: 'Althea Vance Official Archive',
    slug: 'althea-vance-archive',
    description: 'Direct author notes, exclusive world codex sketches, Q&A logs, and early draft sneak peeks.',
    bannerImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80',
    iconImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    type: 'author',
    ownerId: 'usr_1',
    ownerName: 'Althea Vance',
    ownerRole: 'WRITER',
    linkedAuthorId: 'usr_1',
    categories: ['Author Notes', 'Q&A', 'Drafts', 'Community Chat'],
    membersCount: 9400,
    activeMembersCount: 180,
    postsCount: 22,
    createdAt: '2025-01-10T00:00:00Z'
  },
  {
    id: 'comm_astral_alpha',
    name: 'Astral Alpha Lorekeepers',
    slug: 'astral-alpha-lorekeepers',
    description: 'Private circle for beta readers reviewing unreleased cosmology notes and lore drafts.',
    bannerImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    iconImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
    type: 'private',
    isPrivate: true,
    accessCode: 'ASTRAL2025',
    ownerId: 'usr_1',
    ownerName: 'Althea Vance',
    ownerRole: 'WRITER',
    membersCount: 350,
    activeMembersCount: 24,
    postsCount: 8,
    createdAt: '2025-01-25T00:00:00Z'
  }
];

export const initialPosts: CommunityPost[] = [
  {
    id: 'post_1',
    communityId: 'comm_astral',
    communityName: 'The Astral Sanctuary',
    communitySlug: 'astral-sanctuary',
    communityType: 'story',
    authorId: 'usr_3',
    authorUsername: 'sakura_dreamer',
    authorDisplayName: 'Sakura Dreamer',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    title: 'Who will master the Twin Eclipse resonance first?',
    content: 'In chapter 4 we saw the void rift expand over Port Lunaris. Do you think Aria will unlock her second affinity or will Kaelen have to sacrifice his ancestral blade?',
    type: 'POLL',
    tag: 'Theory',
    tags: ['Theory', 'Aria', 'Kaelen', 'Chapter 4'],
    likes: 48,
    likedByUsers: ['usr_1', 'usr_admin'],
    commentsCount: 3,
    poll: {
      id: 'poll_1',
      question: 'Who will master the Twin Eclipse resonance first?',
      options: [
        { id: 'opt_1', text: 'Aria unlocks pure Nova Flare', votes: ['usr_1', 'usr_3'] },
        { id: 'opt_2', text: 'Kaelen embraces the void rune', votes: ['usr_2'] },
        { id: 'opt_3', text: 'Lyra builds a dampening matrix', votes: [] },
        { id: 'opt_4', text: 'They combine affinities in tandem', votes: ['usr_admin'] }
      ],
      totalVotes: 4,
      expiresAt: '2025-04-01T00:00:00Z'
    },
    comments: [
      {
        id: 'pcomm_1',
        postId: 'post_1',
        userId: 'usr_1',
        username: 'althea_v',
        userDisplayName: 'Althea Vance',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        userRole: 'WRITER',
        isAuthor: true,
        content: 'Watching everyone debate this is fascinating! Look closely at the runic inscription on page 12 of Chapter 3.',
        likes: 32,
        likedByUsers: ['usr_3'],
        createdAt: '2025-02-23T10:00:00Z'
      }
    ],
    createdAt: '2025-02-22T14:00:00Z'
  },
  {
    id: 'post_2',
    communityId: 'comm_astral',
    communityName: 'The Astral Sanctuary',
    communitySlug: 'astral-sanctuary',
    communityType: 'story',
    authorId: 'usr_1',
    authorUsername: 'althea_v',
    authorDisplayName: 'Althea Vance',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    authorRole: 'WRITER',
    isAuthorOfStory: true,
    title: 'Chapter 5 Teaser: The Archon Chamber',
    content: 'Here is an official snippet from next week’s chapter: "The stained glass of the High Spire began to sing in three distinct keys. None of them belonged to the living world."',
    type: 'ANNOUNCEMENT',
    mediaUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1000&auto=format&fit=crop&q=80',
    mediaType: 'image',
    tag: 'Official Update',
    tags: ['Official', 'Sneak Peek', 'Chapter 5'],
    isPinned: true,
    likes: 142,
    likedByUsers: ['usr_2', 'usr_3'],
    commentsCount: 5,
    createdAt: '2025-02-26T18:00:00Z'
  },
  {
    id: 'post_3',
    communityId: 'comm_dark_fantasy',
    communityName: 'Dark Fantasy & Grim Lore',
    communitySlug: 'dark-fantasy-lore',
    communityType: 'genre',
    authorId: 'usr_2',
    authorUsername: 'voidknight',
    authorDisplayName: 'Void Knight',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    authorRole: 'WRITER',
    title: 'Why anti-heroes need emotional anchors to stay compelling',
    content: 'An anti-hero who only kills and broods becomes tedious by chapter 10. In The Shattered Crown, Prince Lucian’s ruthless streak is only meaningful because he remembers the oath he swore to the hearth-children of Ravenhold. What are your favorite moral anchors in fiction?',
    type: 'DISCUSSION',
    tag: 'Craft & Critique',
    tags: ['Writing', 'Anti-Hero', 'Character Design'],
    likes: 76,
    likedByUsers: ['usr_1'],
    commentsCount: 8,
    createdAt: '2025-02-25T11:30:00Z'
  },
  {
    id: 'post_4',
    communityId: 'comm_anime_hype',
    communityName: 'Anime Theories & Seasonal Hype',
    communitySlug: 'anime-theories-seasonal-hype',
    communityType: 'fandom',
    authorId: 'usr_3',
    authorUsername: 'sakura_dreamer',
    authorDisplayName: 'Sakura Dreamer',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    title: 'Fan Art: Aria & Kaelen Dual Stance Under Eclipse',
    content: 'Finished this piece after re-reading the arena duel! Tried to capture the contrast between the cyan graviton pulses and the crimson void blades.',
    type: 'ART',
    mediaUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80',
    mediaType: 'image',
    tag: 'Fan Art',
    tags: ['Fan Art', 'Celestial Drifters', 'Digital Art'],
    likes: 189,
    likedByUsers: ['usr_1', 'usr_2'],
    commentsCount: 14,
    createdAt: '2025-02-27T16:00:00Z'
  },
  {
    id: 'post_5',
    communityId: 'comm_astral',
    communityName: 'The Astral Sanctuary',
    communitySlug: 'astral-sanctuary',
    communityType: 'story',
    authorId: 'usr_3',
    authorUsername: 'sakura_dreamer',
    authorDisplayName: 'Sakura Dreamer',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    title: '⚠️ The Titan Ships Theory: The Floating Isles are ancient hulls!',
    content: 'If you look closely at the map in World Codex, the inverted graviton lattices follow the exact curvature of pre-ancient interstellar ships. The Archons are actually maintaining ancient life-support!',
    type: 'THEORY',
    tag: 'Theory',
    tags: ['Cosmology', 'Lore', 'Titans'],
    isSpoiler: true,
    spoilerChapter: 3,
    linkedStoryId: 'story_1',
    linkedStoryTitle: 'Celestial Drifters: Awakening',
    agreeCount: 94,
    disagreeCount: 12,
    likes: 112,
    likedByUsers: ['usr_1'],
    commentsCount: 22,
    createdAt: '2025-02-24T09:00:00Z'
  },
  {
    id: 'post_6',
    communityId: 'comm_dark_fantasy',
    communityName: 'Dark Fantasy & Grim Lore',
    communitySlug: 'dark-fantasy-lore',
    communityType: 'genre',
    authorId: 'usr_3',
    authorUsername: 'sakura_dreamer',
    authorDisplayName: 'Sakura Dreamer',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    title: 'Weekly Recommendation: If you love grim political intrigue',
    content: 'Check out The Shattered Crown by Void Knight. The dialogue in Chapter 1 during the throne room betrayal sets up an extraordinary civil war arc with zero plot armor.',
    type: 'RECOMMENDATION',
    tag: 'Recommendation',
    recommendation: {
      title: 'The Shattered Crown',
      category: 'Story',
      note: 'Fast-paced grimdark light novel with blood rune magic.',
      linkSlug: 'the-shattered-crown'
    },
    likes: 64,
    likedByUsers: ['usr_2'],
    commentsCount: 6,
    createdAt: '2025-02-26T14:00:00Z'
  }
];

export const initialChatRooms: ChatRoom[] = [
  {
    id: 'room_anime_lounge',
    name: '🌌 Anime Lounge',
    slug: 'anime-lounge',
    description: 'General seasonal anime chat, studio analyses, and OST music drops.',
    icon: 'sparkles',
    category: 'fandom',
    onlineCount: 1284,
    totalMembers: 18400,
    pinnedMessage: 'Welcome to Anime Lounge! Please respect everyone\'s tastes and tag spoilers.'
  },
  {
    id: 'room_shonen',
    name: '⚔️ Shonen Room',
    slug: 'shonen-room',
    description: 'High-octane battles, power scaling discussions, and training arc hype.',
    icon: 'swords',
    category: 'genre',
    onlineCount: 2341,
    totalMembers: 31200,
    pinnedMessage: 'Current debate: Best training tournament arc in fantasy fiction?'
  },
  {
    id: 'room_slice_of_life',
    name: '🌸 Slice of Life',
    slug: 'slice-of-life',
    description: 'Cozy vibes, wholesome series, slow burn romances, and comforting reads.',
    icon: 'heart',
    category: 'genre',
    onlineCount: 892,
    totalMembers: 9400
  },
  {
    id: 'room_reading_now',
    name: '📚 What Are You Reading?',
    slug: 'what-are-you-reading',
    description: 'Live reading progress drops, favorite quotes, and genuine reactions.',
    icon: 'book-open',
    category: 'general',
    onlineCount: 1420,
    totalMembers: 22000
  },
  {
    id: 'room_writers',
    name: '✍️ Writers Lounge',
    slug: 'writers-lounge',
    description: 'Writing sprints, wordcount targets, dialogue sparring, and peer feedback.',
    icon: 'pen-tool',
    category: 'creator',
    onlineCount: 342,
    totalMembers: 5200,
    pinnedMessage: 'Daily prompt: Describe an unexpected weapon forged from a memory.'
  },
  {
    id: 'room_artists',
    name: '🎨 Artists Corner',
    slug: 'artists-corner',
    description: 'Fan art work-in-progress, color palettes, sketch critiques, and commissions.',
    icon: 'palette',
    category: 'creator',
    onlineCount: 512,
    totalMembers: 8100
  },
  {
    id: 'room_theory_lab',
    name: '💭 Theory Lab',
    slug: 'theory-lab',
    description: 'Deep cosmology analysis, timeline logic, and canon predictions.',
    icon: 'brain',
    category: 'theory',
    onlineCount: 891,
    totalMembers: 12500
  },
  {
    id: 'room_astral_spoiler',
    name: '⚠️ Spoiler Room: Astral Universe Ch. 4+',
    slug: 'astral-spoilers',
    description: 'Unfiltered spoiler zone for Astral Universe chapters 4 and beyond.',
    icon: 'alert-triangle',
    category: 'spoiler',
    isSpoiler: true,
    spoilerWarning: 'Warning: This room contains unredacted spoilers for Celestial Drifters through current chapters!',
    onlineCount: 412,
    totalMembers: 6200
  },
  {
    id: 'room_event_launch',
    name: '⏳ Live Launch: Celestial Drifters Ch. 5',
    slug: 'astral-launch-event',
    description: 'Author live countdown, trivia drops, and real-time release party.',
    icon: 'flame',
    category: 'event',
    isEvent: true,
    eventTitle: 'Chapter 5 Live Launch & Author AMA',
    eventHost: 'Althea Vance',
    eventEndsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    onlineCount: 1650,
    totalMembers: 8900
  }
];

export const initialChatMessages: Record<string, ChatMessage[]> = {
  'room_anime_lounge': [
    {
      id: 'msg_1',
      roomId: 'room_anime_lounge',
      userId: 'usr_3',
      username: 'sakura_dreamer',
      displayName: 'Sakura Dreamer',
      userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      content: 'Has anyone finished the latest Frieren episode? The spell animation sequences are breathtaking!',
      reactions: { '✨': ['usr_1', 'usr_2'], '🔥': ['usr_admin'] },
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'msg_2',
      roomId: 'room_anime_lounge',
      userId: 'usr_1',
      username: 'althea_v',
      displayName: 'Althea Vance',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      userRole: 'WRITER',
      isAuthor: true,
      content: 'The pacing in the journey montage gave me so much inspiration for the Sky-Isle travels in Chapter 5!',
      reactions: { '❤️': ['usr_3'] },
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  'room_reading_now': [
    {
      id: 'msg_3',
      roomId: 'room_reading_now',
      userId: 'usr_2',
      username: 'voidknight',
      displayName: 'Void Knight',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      userRole: 'WRITER',
      content: 'Just re-read Chapter 2 of Celestial Drifters. The arena duel choreography is so sharp.',
      storyCard: {
        id: 'story_1',
        title: 'Celestial Drifters: Awakening',
        slug: 'celestial-drifters-awakening',
        cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        author: 'Althea Vance',
        genre: 'Fantasy'
      },
      createdAt: new Date(Date.now() - 1800000).toISOString()
    }
  ]
};

export const initialEvents: CommunityEvent[] = [
  {
    id: 'evt_1',
    title: 'Celestial Drifters Chapter 5 Launch Party',
    description: 'Join author Althea Vance for a live countdown, reading excerpts, and community Q&A.',
    hostName: 'Althea Vance',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    hostRole: 'WRITER',
    type: 'CHAPTER_LAUNCH',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    participantsCount: 642,
    communityId: 'comm_astral',
    communityName: 'The Astral Sanctuary',
    bannerUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 'evt_2',
    title: 'Grimdark Worldbuilding & Anti-Hero AMA',
    description: 'Void Knight answers your questions about structuring high-stakes magic and moral conflict.',
    hostName: 'Void Knight',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    hostRole: 'WRITER',
    type: 'QA',
    startTime: new Date(Date.now() + 86400000 * 3).toISOString(),
    participantsCount: 418,
    communityId: 'comm_shattered',
    communityName: 'The Shattered Keep',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80'
  }
];

export const initialContests: CommunityContest[] = [
  {
    id: 'cnt_1',
    title: 'Celestial Knights: Original Character Design',
    description: 'Design a cadet or void-hunter for the Zenith Academy. Submissions can be artwork or 300-word character profiles.',
    category: 'Character Design',
    deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
    entriesCount: 24,
    prizeXP: 5000,
    bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
    status: 'OPEN',
    submissions: [
      {
        id: 'sub_1',
        contestId: 'cnt_1',
        userId: 'usr_3',
        username: 'sakura_dreamer',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
        title: 'Seraphina: The Starlight Cartographer',
        description: 'A quiet scholar wielding an inverted astrolabe blade that can map gravitational fractures in mid-air.',
        votes: 42,
        votedUserIds: ['usr_1'],
        createdAt: '2025-02-20T12:00:00Z'
      }
    ]
  }
];

export const initialQuoteSnippets: QuoteSnippet[] = [
  {
    id: 'q_1',
    text: 'The stars do not forgive the weak; they only illuminate their fall.',
    storyId: 'story_1',
    storySlug: 'celestial-drifters-awakening',
    storyTitle: 'Celestial Drifters: Awakening',
    chapterNumber: 3,
    chapterTitle: 'The Celestial Trial',
    authorName: 'Althea Vance',
    authorUsername: 'althea_v',
    createdByUserId: 'usr_3',
    createdByUsername: 'sakura_dreamer',
    createdByAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    theme: 'cosmic',
    likes: 88,
    likedByUsers: ['usr_1', 'usr_2'],
    createdAt: '2025-02-18T10:00:00Z'
  },
  {
    id: 'q_2',
    text: 'When an empire crumbles, even the shadows learn to sharpen their teeth.',
    storyId: 'story_2',
    storySlug: 'the-shattered-crown',
    storyTitle: 'The Shattered Crown',
    chapterNumber: 1,
    chapterTitle: 'The Blood on the Marble',
    authorName: 'Void Knight',
    authorUsername: 'voidknight',
    createdByUserId: 'usr_1',
    createdByUsername: 'althea_v',
    createdByAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    theme: 'crimson',
    likes: 62,
    likedByUsers: ['usr_3'],
    createdAt: '2025-02-19T14:00:00Z'
  }
];
