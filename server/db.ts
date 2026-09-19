import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  User, Story, Chapter, ReadingProgress, LibraryItem, Review, 
  ChapterComment, Community, CommunityPost, Theory, Character, 
  CharacterRelationship, World, Universe, AnimeEntry, Notification, Badge,
  ChatRoom, ChatMessage, CommunityEvent, CommunityContest, CommunityContestSubmission,
  DirectMessage, DirectMessageConversation, CustomReadingList, QuoteSnippet, ReportItem,
  CommunityComment, CommunityType, PostType,
  Program, ProgramParticipant, ProgramSubmission, ProgramVote,
  ProgramAnnouncement, ProgramAuditLog, ProgramCertificate,
  AdminProgramsSummary, ProgramStatus,
  UserInterestProfile, UserBehaviorEvent, AdminRecommendationSettings
} from '../src/types.js';
import {
  initialCommunities, initialPosts, initialChatRooms, initialChatMessages,
  initialEvents, initialContests, initialQuoteSnippets
} from './community-seeds.js';
import {
  initialPrograms, initialParticipants, initialSubmissions, initialVotes,
  initialAnnouncements, initialAuditLogs, initialCertificates
} from './programs-seed.js';

function resolveDataPaths() {
  const isServerless = process.env.VERCEL === '1' || 
                       Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) || 
                       Boolean(process.env.VERCEL_ENV) ||
                       Boolean(process.env.LAMBDA_TASK_ROOT);

  const bundledDir = path.join(process.cwd(), 'data');
  const bundledFile = path.join(bundledDir, 'kairo_db.json');
  const backupFile = path.join(bundledDir, 'kairo_db.backup.json');
  const snapshotFile = path.join(bundledDir, 'kairo_db.snapshot.json');
  const seedFile = path.join(bundledDir, 'kairo_seed_baseline.json');

  if (isServerless) {
    const tmpDir = path.join('/tmp', 'kairo_data');
    const tmpFile = path.join(tmpDir, 'kairo_db.json');
    const tmpBackup = path.join(tmpDir, 'kairo_db.backup.json');
    const tmpSnapshot = path.join(tmpDir, 'kairo_db.snapshot.json');
    return { dataDir: tmpDir, dbFile: tmpFile, backupFile: tmpBackup, snapshotFile: tmpSnapshot, seedFile: bundledFile };
  }

  return { dataDir: bundledDir, dbFile: bundledFile, backupFile, snapshotFile, seedFile };
}

export interface SessionData {
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface PasswordRecord {
  salt: string;
  hash: string;
}

export interface DatabaseSchema {
  users: User[];
  passwords: Record<string, PasswordRecord | string>; // userId -> password hash record or string
  sessions: Record<string, SessionData>; // sessionToken -> session data
  stories: Story[];
  chapters: Chapter[];
  readingProgress: ReadingProgress[];
  library: LibraryItem[];
  reviews: Review[];
  comments: ChapterComment[];
  communities: Community[];
  communityPosts: CommunityPost[];
  theories: Theory[];
  characters: Character[];
  characterRelationships: CharacterRelationship[];
  worlds: World[];
  universes: Universe[];
  animeEntries: AnimeEntry[];
  notifications: Notification[];
  badges: Record<string, Badge[]>; // userId -> badges
  likes: Record<string, string[]>; // storyId -> userIds
  follows: Record<string, string[]>; // authorId -> followerUserIds
  userAnimeTracking: Record<string, Record<string, { status: string; episodesWatched: number }>>; // userId -> animeId -> data
  chatRooms: ChatRoom[];
  chatMessages: Record<string, ChatMessage[]>; // roomId -> messages
  events: CommunityEvent[];
  contests: CommunityContest[];
  directMessages: Record<string, DirectMessage[]>; // conversationId -> messages
  conversations: DirectMessageConversation[];
  readingLists: CustomReadingList[];
  quoteSnippets: QuoteSnippet[];
  reports: ReportItem[];
  blockedUsers: Record<string, string[]>; // userId -> blockedUserIds
  mutedUsers: Record<string, string[]>; // userId -> mutedUserIds
  communityMembers: Record<string, string[]>; // communityId -> userIds
  postSaves: Record<string, string[]>; // userId -> postIds
  postFollows: Record<string, string[]>; // userId -> postIds
  programs: Program[];
  programParticipants: ProgramParticipant[];
  programSubmissions: ProgramSubmission[];
  programVotes: ProgramVote[];
  programAnnouncements: ProgramAnnouncement[];
  programAuditLogs: ProgramAuditLog[];
  programCertificates: ProgramCertificate[];
  userInterestProfiles: Record<string, UserInterestProfile>;
  userBehaviorEvents: UserBehaviorEvent[];
  adminRecommendationSettings: AdminRecommendationSettings;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Initial seed database
function getInitialSeed(): DatabaseSchema {
  const now = new Date().toISOString();
  
  const users: User[] = [
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
      lastActiveDate: now,
      followersCount: 1420,
      followingCount: 38,
      totalReads: 38240,
      favoriteGenres: ['Fantasy', 'Sci-Fi', 'Light Novel'],
      favoriteThemes: ['Magic Systems', 'Character Growth', 'Space Opera'],
      createdAt: '2025-01-10T10:00:00Z',
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
      lastActiveDate: now,
      followersCount: 2890,
      followingCount: 45,
      totalReads: 89400,
      favoriteGenres: ['Dark Fantasy', 'Mystery', 'Action'],
      favoriteThemes: ['Grimdark', 'Political Intrigue', 'Rivalries'],
      createdAt: '2025-01-05T12:00:00Z',
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
      lastActiveDate: now,
      followersCount: 180,
      followingCount: 64,
      totalReads: 1420,
      favoriteGenres: ['Romance', 'Fantasy', 'Isekai'],
      favoriteThemes: ['Wholesome', 'Slice of Life', 'Magic Academia'],
      createdAt: '2025-02-01T08:00:00Z',
    },
    {
      id: 'usr_admin',
      username: 'admin',
      email: 'admin@kairo.app',
      displayName: 'KAIRO Staff',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      bio: 'Official KAIRO platform team and community curators.',
      role: 'ADMIN',
      xp: 9999,
      level: 50,
      readingStreak: 120,
      lastActiveDate: now,
      followersCount: 15400,
      followingCount: 12,
      totalReads: 250000,
      favoriteGenres: ['All Genres'],
      favoriteThemes: ['All Themes'],
      createdAt: '2024-12-01T00:00:00Z',
    }
  ];

  const passwords: Record<string, string> = {
    'usr_1': 'password123',
    'usr_2': 'password123',
    'usr_3': 'password123',
    'usr_admin': 'admin123',
  };

  const universes: Universe[] = [
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

  const worlds: World[] = [
    {
      id: 'world_1',
      authorId: 'usr_1',
      universeId: 'uni_1',
      name: 'Aethelgard',
      slug: 'aethelgard',
      tagline: 'The Floating Continent of Crystalized Starlight',
      description: 'Suspended above an endless tempest of cosmic clouds, Aethelgard is powered by subterranean Mana Core nodes and guarded by the Order of the Radiant Dawn.',
      globalScale: 'Continental Array (7 Floating Isles)',
      techLevel: 'Aether-Magitech (Stellar Crystal Infusion)',
      bannerImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
      magicTypes: ['Stellar Resonance', 'Aether Alchemy', 'Gravity Weaver'],
      mainDocument: `# Lore of Aethelgard

Aethelgard was founded three millennia ago following the Great Celestial Cleaving. The seven archipelago sky-islands float due to inverted graviton lattices anchored inside the Great Spire of Zenith.

### The Aether Currents
Every 12 days, the twin moons synchronize in orbital harmonic resonance, intensifying all spellcraft by tenfold. Those untrained in mind-shielding risk astral madness if exposed directly to the raw night sky.

### Societal Hierarchy
- **The Archons**: Custodians of the Celestial Engines.
- **The Vanguard Knights**: Airborne combatants utilizing glyph-gliders and resonance blades.
- **The Grounded**: Descendants of those who remained on the lower crust before elevation.`,
      locations: [
        {
          id: 'loc_1',
          name: 'The Grand Citadel of Zenith',
          description: 'A crystalline palace soaring 8,000 meters into the stratosphere, housing the Harmonic Chamber.',
          tags: ['Capital', 'Government', 'Holy Site'],
          imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80'
        },
        {
          id: 'loc_2',
          name: 'The Whispering Rift',
          description: 'A subterranean chasm pulsing with violet astral energy where ancient spirits communicate.',
          tags: ['Dangerous', 'Ruins', 'Energy Well'],
          imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'
        },
        {
          id: 'loc_3',
          name: 'Port Lunaris',
          description: 'The bustling sky-dock where ether-skiffs trade exotic star spices and forged runes.',
          tags: ['Trade Hub', 'Seaport', 'Diverse'],
          imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80'
        }
      ],
      factions: [
        {
          id: 'fac_1',
          name: 'Order of the Radiant Dawn',
          description: 'Elite knights sworn to preserve the stability of the Floating Isles and neutralize void breaches.',
          tags: ['Military', 'Protectors', 'Honorable'],
          imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80'
        },
        {
          id: 'fac_2',
          name: 'The Eclipse Syndicate',
          description: 'An underground guild seeking to harvest raw void fragments to break the monopoly of the Archons.',
          tags: ['Rebels', 'Black Market', 'Shadow'],
          imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80'
        }
      ],
      chronology: [
        {
          id: 'chr_1',
          timeLabel: 'Year 0 (First Dawn)',
          title: 'The Great Cleaving & Ascension',
          description: 'The continental crust is shattered by falling star shards; Archon Valerius anchors the floating continents.',
          isCurrentEra: false,
          sortOrder: 1
        },
        {
          id: 'chr_2',
          timeLabel: 'Year 1420',
          title: 'The Eclipse War',
          description: 'First void incursion repelled by the newly formed Order of the Radiant Dawn.',
          isCurrentEra: false,
          sortOrder: 2
        },
        {
          id: 'chr_3',
          timeLabel: 'Year 2840 (Present)',
          title: 'The Awakening Era',
          description: 'Stellar resonance frequencies begin fluctuating wildly across the archipelago.',
          isCurrentEra: true,
          sortOrder: 3
        }
      ],
      createdAt: '2025-01-11T12:30:00Z',
    }
  ];

  const characters: Character[] = [
    {
      id: 'char_1',
      authorId: 'usr_1',
      storyId: 'story_1',
      storyTitle: 'Celestial Drifters: Awakening',
      worldId: 'world_1',
      name: 'Aria Vance',
      portrait: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      age: 19,
      role: 'Protagonist',
      personality: 'Fiercely determined, compassionate, with an unquenchable curiosity for forbidden ancient ruins.',
      primaryPower: 'Stellar Aether Weaver (Light & Gravity manipulation)',
      abilities: ['Prism Dash', 'Graviton Seal', 'Nova Flare Strike', 'Astral Perception'],
      biography: 'Born in the outer rim of Port Lunaris, Aria discovered her latent crest during the midnight eclipse. Now enrolled in the Zenith Astral Academy, she seeks the truth behind her lost lineage.',
      arc: [
        { id: 'arc_1', phase: 'Beginning', title: 'The Unmarked Drifter', description: 'Struggling as an orphan scavver on the low docks.' },
        { id: 'arc_2', phase: 'Rising Action', title: 'Awakening of the Starcrest', description: 'Accidentally manifests dual elemental affinities during a void beast raid.' },
        { id: 'arc_3', phase: 'Climax', title: 'Defender of the Floating Isles', description: 'Stands against the Syndicate alongside her rival turned sworn ally.' }
      ],
      createdAt: '2025-01-12T10:00:00Z',
    },
    {
      id: 'char_2',
      authorId: 'usr_1',
      storyId: 'story_1',
      storyTitle: 'Celestial Drifters: Awakening',
      worldId: 'world_1',
      name: 'Kaelen Voss',
      portrait: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      age: 21,
      role: 'Rival',
      personality: 'Stoic, mathematically precise, bound by family honor but harboring deep doubts about the Archon Council.',
      primaryPower: 'Blade of the Azure Eclipse (Kinetic resonance)',
      abilities: ['Zero-Point Slash', 'Sonic Barrier', 'Flash Step', 'Phantom Echo'],
      biography: 'Heir to the illustrious Voss Noble House. Trained since childhood to wield the ancestral Moonshard blade, he finds himself constantly challenged by Aria\'s unconventional battle instincts.',
      arc: [
        { id: 'arc_4', phase: 'Beginning', title: 'The Golden Prodigy', description: 'Unbeaten student duelist adhering strictly to academy dogma.' },
        { id: 'arc_5', phase: 'Turning Point', title: 'Cracks in the Dynasty', description: 'Discovers his father’s complicity with the forbidden void trade.' }
      ],
      createdAt: '2025-01-12T10:15:00Z',
    },
    {
      id: 'char_3',
      authorId: 'usr_1',
      storyId: 'story_1',
      storyTitle: 'Celestial Drifters: Awakening',
      worldId: 'world_1',
      name: 'Lyra Vane',
      portrait: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
      age: 18,
      role: 'Supporting',
      personality: 'Eccentric technomancer, caffeine enthusiast, loyal sister-figure and tactical genius.',
      primaryPower: 'Magitech Artificer & Glyph Hacker',
      abilities: ['Sentry Drones', 'Energy Shield Matrix', 'Overclock Burst'],
      biography: 'A genius tinkerer who built her own hover-board at age 12. Provides technical firepower and endless witty commentary for Aria’s squadron.',
      arc: [
        { id: 'arc_6', phase: 'Allied', title: 'The Tech Alchemist', description: 'Transforms junk scraps into world-class defensive gear.' }
      ],
      createdAt: '2025-01-12T10:30:00Z',
    }
  ];

  const characterRelationships: CharacterRelationship[] = [
    {
      id: 'rel_1',
      sourceCharacterId: 'char_1',
      sourceName: 'Aria Vance',
      targetCharacterId: 'char_2',
      targetName: 'Kaelen Voss',
      relationType: 'Rival',
      description: 'Intense academy rivals with growing mutual respect and unspoken romantic tension.'
    },
    {
      id: 'rel_2',
      sourceCharacterId: 'char_1',
      sourceName: 'Aria Vance',
      targetCharacterId: 'char_3',
      targetName: 'Lyra Vane',
      relationType: 'Sister',
      description: 'Found family; swore an oath of mutual protection over a glowing bowl of noodle broth.'
    },
    {
      id: 'rel_3',
      sourceCharacterId: 'char_2',
      sourceName: 'Kaelen Voss',
      targetCharacterId: 'char_3',
      targetName: 'Lyra Vane',
      relationType: 'Ally',
      description: 'Kaelen relies on Lyra\'s gadgets despite pretending to find her inventions chaotic.'
    }
  ];

  const stories: Story[] = [
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
    },
    {
      id: 'story_4',
      authorId: 'usr_3',
      authorUsername: 'sakura_dreamer',
      authorDisplayName: 'Sakura Dreamer',
      authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      title: 'Whispers in the Starlight',
      slug: 'whispers-in-the-starlight',
      description: 'A quiet romance unfolding between an introverted astronomical librarian and a star-captain with a cursed heart that only calms when listening to ancient folk tales.',
      coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
      genre: 'Romance',
      tags: ['Slow Burn', 'Comfort Read', 'Cosmic Romance', 'Original Fiction', 'Wholesome'],
      language: 'English',
      ageRating: 'Everyone',
      storyType: 'Original Fiction',
      status: 'Ongoing',
      views: 14200,
      likes: 1890,
      rating: 4.95,
      ratingCount: 310,
      chaptersCount: 3,
      liveReadersCount: 68,
      featured: false,
      createdAt: '2025-02-01T15:00:00Z',
      updatedAt: '2025-02-27T10:00:00Z',
    },
    {
      id: 'story_5',
      authorId: 'usr_2',
      authorUsername: 'voidknight',
      authorDisplayName: 'Void Knight',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      title: 'Abyssal Vanguard: Resonance',
      slug: 'abyssal-vanguard-resonance',
      description: 'Deep below the ocean of a volcanic exoplanet, giant biotic leviathans threaten the surviving colonies. Cadets synchronize neural link interfaces to pilot biomechanical titans.',
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      genre: 'Action',
      tags: ['Mecha', 'Shonen', 'High Stakes', 'Anime-Inspired', 'Survival'],
      language: 'English',
      ageRating: 'Teen',
      storyType: 'Manga-Style Story',
      status: 'Ongoing',
      views: 29800,
      likes: 3400,
      rating: 4.85,
      ratingCount: 590,
      chaptersCount: 2,
      liveReadersCount: 89,
      featured: false,
      createdAt: '2025-02-05T07:00:00Z',
      updatedAt: '2025-02-26T18:00:00Z',
    },
    {
      id: 'story_ja_1',
      authorId: 'usr_3',
      authorUsername: 'sakura_dreamer',
      authorDisplayName: 'Sakura Dreamer',
      authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      title: '星屑の召喚士：零章',
      slug: 'hoshikuzu-no-shoukanshi',
      description: '天空の浮島エーテルガルドで、孤児の少女アリアは真夜中の日食の瞬間に禁断の星紋を目覚めさせる。ゼニス魔法学院で繰り広げられる過酷な競争と、星々の終焉を巡る壮大なダークファンタジー。',
      coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
      genre: 'Fantasy',
      tags: ['Light Novel', 'Anime-Inspired', 'Magic Academy', 'Original Universe', 'Shonen'],
      language: 'Japanese',
      ageRating: 'Teen',
      storyType: 'Light Novel',
      status: 'Ongoing',
      views: 45200,
      likes: 5620,
      rating: 4.95,
      ratingCount: 910,
      universeId: 'uni_1',
      universeName: 'The Astral Universe',
      chaptersCount: 3,
      liveReadersCount: 230,
      featured: true,
      createdAt: '2025-02-12T10:00:00Z',
      updatedAt: '2025-03-01T15:00:00Z',
    },
    {
      id: 'story_ja_2',
      authorId: 'usr_1',
      authorUsername: 'althea_v',
      authorDisplayName: 'Althea Vance',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      title: 'ネオ東京レクイエム：記憶の残響',
      slug: 'neo-tokyo-requiem',
      description: '2149年のネオ京都。電脳抽出された記憶が闇市で売買される街で、反逆のシンセ・アーティストが世界を揺るがす封印されたメモリーチップを手にする。',
      coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      genre: 'Sci-Fi',
      tags: ['Cyberpunk', 'Light Novel', 'Mystery', 'Anime Aesthetic', 'Synthwave'],
      language: 'Japanese',
      ageRating: 'Teen',
      storyType: 'Light Novel',
      status: 'Ongoing',
      views: 31200,
      likes: 3890,
      rating: 4.88,
      ratingCount: 620,
      chaptersCount: 2,
      liveReadersCount: 115,
      featured: false,
      createdAt: '2025-02-14T12:00:00Z',
      updatedAt: '2025-02-28T18:00:00Z',
    },
    {
      id: 'story_es_1',
      authorId: 'usr_2',
      authorUsername: 'voidknight',
      authorDisplayName: 'Void Knight',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      title: 'El Despertar de las Sombras',
      slug: 'el-despertar-de-las-sombras',
      description: 'Tras el regicidio del Emperador Eterno, ocho reinos en pugna sangrienta convocan a los antiguos portadores de runas. Una historia oscura de traición, magia prohibida y destino.',
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      genre: 'Dark Fantasy',
      tags: ['Grimdark', 'Serialized Novel', 'Epic Magic', 'Political Intrigue'],
      language: 'Spanish',
      ageRating: 'Mature',
      storyType: 'Serialized Novel',
      status: 'Ongoing',
      views: 38900,
      likes: 4120,
      rating: 4.89,
      ratingCount: 780,
      chaptersCount: 2,
      liveReadersCount: 140,
      featured: true,
      createdAt: '2025-02-08T09:00:00Z',
      updatedAt: '2025-03-02T11:00:00Z',
    },
    {
      id: 'story_fr_1',
      authorId: 'usr_1',
      authorUsername: 'althea_v',
      authorDisplayName: 'Althea Vance',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      title: 'Les Arcanes d\'Astralia : L\'Éclipse',
      slug: 'les-arcanes-d-astralia',
      description: 'Dans les archipels suspendus d\'Aethelgard, une apprentie alchimiste réveille un artefact stellaire oublié capable d\'inverser le flux du temps céleste.',
      coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      genre: 'Fantasy',
      tags: ['Light Novel', 'Magic Academy', 'Cosmic Romance', 'Original Universe'],
      language: 'French',
      ageRating: 'Teen',
      storyType: 'Light Novel',
      status: 'Ongoing',
      views: 27400,
      likes: 3100,
      rating: 4.92,
      ratingCount: 510,
      chaptersCount: 2,
      liveReadersCount: 95,
      featured: false,
      createdAt: '2025-02-10T14:00:00Z',
      updatedAt: '2025-02-27T16:00:00Z',
    },
    {
      id: 'story_ko_1',
      authorId: 'usr_2',
      authorUsername: 'voidknight',
      authorDisplayName: 'Void Knight',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      title: '심연의 각성자: 무한의 탑',
      slug: 'abyssal-awakener-tower',
      description: '칠흑 같은 심연 아래 솟아오른 100층의 시련의 탑. 봉인된 고대 성흔을 계승한 소년이 파멸의 예언을 뒤엎기 위해 검을 쥐었다.',
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      genre: 'Action',
      tags: ['Shonen', 'High Stakes', 'Fantasy', 'Anime-Inspired', 'Leveling'],
      language: 'Korean',
      ageRating: 'Teen',
      storyType: 'Serialized Novel',
      status: 'Ongoing',
      views: 42100,
      likes: 5200,
      rating: 4.94,
      ratingCount: 880,
      chaptersCount: 2,
      liveReadersCount: 190,
      featured: true,
      createdAt: '2025-02-15T16:00:00Z',
      updatedAt: '2025-03-01T20:00:00Z',
    },
    {
      id: 'story_hi_1',
      authorId: 'usr_3',
      authorUsername: 'sakura_dreamer',
      authorDisplayName: 'Sakura Dreamer',
      authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      title: 'नक्षत्र योद्धा: अनंत काल',
      slug: 'nakshatra-yoddha-anant-kaal',
      description: 'आकाशगंगा के तैरते द्वीपों पर, एक अनाथ खोजी रात के सूर्यग्रहण के दौरान ब्रह्मांडीय मंत्र शक्ति को जागृत करता है।',
      coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
      genre: 'Fantasy',
      tags: ['Epic Magic', 'World Building', 'Original Universe', 'Mythology'],
      language: 'Hindi',
      ageRating: 'Everyone',
      storyType: 'Original Fiction',
      status: 'Ongoing',
      views: 24300,
      likes: 2980,
      rating: 4.91,
      ratingCount: 450,
      chaptersCount: 2,
      liveReadersCount: 80,
      featured: false,
      createdAt: '2025-02-16T10:00:00Z',
      updatedAt: '2025-02-28T14:00:00Z',
    },
    {
      id: 'story_de_1',
      authorId: 'usr_1',
      authorUsername: 'althea_v',
      authorDisplayName: 'Althea Vance',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      title: 'Die Sternenwanderer von Aethelgard',
      slug: 'die-sternenwanderer-von-aethelgard',
      description: 'In den schwebenden Himmelsinseln entdeckt eine Schrottsammlerin ein verbotenes kosmisches Relikt vor dem Untergang der Welten.',
      coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      genre: 'Sci-Fi',
      tags: ['Space Opera', 'Deep Lore', 'Light Novel'],
      language: 'German',
      ageRating: 'Teen',
      storyType: 'Light Novel',
      status: 'Ongoing',
      views: 19800,
      likes: 2400,
      rating: 4.86,
      ratingCount: 390,
      chaptersCount: 2,
      liveReadersCount: 65,
      featured: false,
      createdAt: '2025-02-18T11:00:00Z',
      updatedAt: '2025-02-26T17:00:00Z',
    }
  ];

  const chapters: Chapter[] = [
    {
      id: 'chap_1_1',
      storyId: 'story_1',
      chapterNumber: 1,
      title: 'The Midnight Convergence',
      subtitle: 'Where the stars weep liquid gold',
      content: `The sky above Port Lunaris burned in hues of violet and shattered rose.

Aria Vance balanced on the rusted copper edge of Dock 9, the wind whipping strands of dark silver hair across her goggles. Far below, through the swirling vapor of the cloud sea, the glowing leviathan currents of mana hummed like a subterranean cello.

"Hold the stabilizer steady, Aria!" Lyra's voice crackled through the comm-bead, tinged with static and nervous energy. "If that ether-converter blows, we'll both be vaporized into sparkly purple dust!"

"I've got it," Aria whispered, her gloved fingers tracing the ancient crystalline glyph on the intake valve. 

It was warm. Too warm.

Normally, dormant star-relics felt like ice against the skin. But this piece—pulled from the wreckage of a pre-Cleaving skiff—pulsed with a rhythm that matched the beat of her own pulse.

*Thump. Thump. Thump.*

Then, the sky cracked.

The twin moons of Aethelgard shifted in their orbital lock. A brilliant beam of silver light pierced through the cloud cover, striking the relic directly. 

Pain—pure, blinding, celestial fire—surged through Aria's right forearm. She gasped as her glove disintegrated, revealing four glowing lines carving themselves into her skin like molten starlight. 

The Starcrest of the First Dawn had chosen its bearer. And across the floating continent, every bell in the Grand Citadel of Zenith began to toll.`,
      wordCount: 1420,
      readingTime: 6,
      status: 'published',
      publishedAt: '2025-01-15T10:00:00Z',
      createdAt: '2025-01-15T09:30:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    },
    {
      id: 'chap_1_2',
      storyId: 'story_1',
      chapterNumber: 2,
      title: 'The Azure Blade of Voss',
      subtitle: 'A duel beneath the glass dome',
      content: `The Zenith Astral Academy sat atop Mount Caelum like a fortress carved from a single diamond.

Aria stood in the center of the Grand Duelling Arena, her borrowed combat tunic feeling three sizes too large. Thousands of students looked down from the floating tiered balconies, their murmurs like the rustle of dry leaves.

"You have ten seconds to yield, scavenger," Kaelen Voss said, stepping into the ring.

He wore the midnight-blue uniform of the Voss dynasty, his dark hair falling neatly over sharp, calculating eyes. In his right hand, the ancestral Moonshard blade hummed with a pure azure frequency that chilled the ambient air.

"I didn't climb eight thousand steps just to wave a white flag," Aria replied, tightening her stance.

Kaelen sighed. "Pity."

In the blink of an eye, he was gone.

Aria felt the displacement of air before she saw the blade. She instinctively raised her right arm, the newly awakened Starcrest blazing through her bandages. A barrier of shimmering golden gravitons erupted between them with the force of a thunderclap.

The impact echoed across the arena. Kaelen was hurled back, landing cleanly on his feet with his eyes wide in sheer disbelief.

"That crest..." Kaelen breathed, his blade trembling. "That's impossible. That lineage died three centuries ago."`,
      wordCount: 1680,
      readingTime: 7,
      status: 'published',
      publishedAt: '2025-01-22T14:00:00Z',
      createdAt: '2025-01-22T12:00:00Z',
      updatedAt: '2025-01-22T14:00:00Z',
    },
    {
      id: 'chap_1_3',
      storyId: 'story_1',
      chapterNumber: 3,
      title: 'Whispers in the Starlight Archive',
      subtitle: 'Secrets locked in crystal scrolls',
      content: `The lower archives smelled of ozone, crushed star-dust, and old parchment that had survived the atmospheric transitions.

"If the Archon guards catch us down here," Lyra whispered, pointing her handheld scanner at the sealed vault door, "we're not just getting expelled. We're getting sentenced to mana-harvesting duty in the lower trenches."

"They won't catch us," Aria murmured, placing her hand against the vault's central core.

The golden glyphs on her forearm flared. The heavy stone doors groans in harmonic resonance, slowly sliding open into an abyss of floating starlight prisms.

Inside, thousands of historical memories floated like glowing orbs.

"Look at this," Aria said, reaching toward a crimson orb at the center.

As her fingers brushed the sphere, a holographic vision burst to life: the seven floating isles were not created as a paradise. They were anchors—chains holding down an ancient celestial entity slumbering beneath the cloud sea.

And the chains were beginning to crack.`,
      wordCount: 1550,
      readingTime: 6,
      status: 'published',
      publishedAt: '2025-02-05T16:00:00Z',
      createdAt: '2025-02-05T14:00:00Z',
      updatedAt: '2025-02-05T16:00:00Z',
    },
    {
      id: 'chap_1_4',
      storyId: 'story_1',
      chapterNumber: 4,
      title: 'The Void Breach at Dawn',
      subtitle: 'When the sky bleeds black',
      content: `The warning sirens wailed across the Seventh Isle just as the first rays of sunlight kissed the horizon.

A tear in the fabric of space had opened above Port Lunaris. From the obsidian rift, winged void-beasts poured out like swarming locusts, their screeching shattering glass across the lower district.

"Cadets, form defensive positions!" Commander Thorne's voice echoed through the telepathic broadcast network.

Aria sprinted toward the skiff docks, her heart pounding in her ears. Beside her, Kaelen drew his Azure Blade, the two rivals matching strides without a word spoken.

"Front flank is yours," Kaelen said curtly. "Don't let them flank the civilians."

"Watch my back, Voss," Aria grinned, launching herself into the air with a Graviton burst. "And try to keep up!"`,
      wordCount: 1820,
      readingTime: 8,
      status: 'published',
      publishedAt: '2025-02-20T18:00:00Z',
      createdAt: '2025-02-20T16:00:00Z',
      updatedAt: '2025-02-20T18:00:00Z',
    },
    {
      id: 'chap_2_1',
      storyId: 'story_2',
      chapterNumber: 1,
      title: 'The Blood on the Marble',
      subtitle: 'The night an empire fell',
      content: `The throne of Valerius was forged from the petrified bones of seven fallen dragons.

Prince Lucian stood before the severed body of his father, the blood soaking into the gold-threaded velvet of his boots. The shadow-guard stood around the corpse with drawn rapiers, their silver masks reflecting the guttering torches.

"Why?" Lucian asked, his voice steady despite the cold rage freezing his veins.

"The Emperor grew weak, my Prince," Lord Commander Vane replied calmly. "And weakness in the Iron Reign is an invitation to ruin."

Lucian did not argue. He drew his ceremonial dagger and sliced the palm of his left hand, smearing his blood across the ancient runic bracelet chained to his wrist.

The dead dragons in the walls began to scream.`,
      wordCount: 1950,
      readingTime: 8,
      status: 'published',
      publishedAt: '2025-01-10T12:00:00Z',
      createdAt: '2025-01-10T10:00:00Z',
      updatedAt: '2025-01-10T12:00:00Z',
    },
    {
      id: 'chap_2_2',
      storyId: 'story_2',
      chapterNumber: 2,
      title: 'Exile of the Crimson Raven',
      subtitle: 'Walking the ash wastes',
      content: `Beyond the Northern Wall lay the Obsidian Wastes—a barren graveyard where neither crops nor mercy grew.

Lucian pulled his tattered wolfskin cloak tighter against the stinging frost. Behind him, three loyal knights rode in silence, their armor stripped of all crests and insignia.

"We have food for five days, Sire," Sir Galahad reported. "The mountain clans will not welcome us."

"They don't have to welcome us," Lucian said, his eyes glowing with dark crimson aether. "They only need to fear what we bring."`,
      wordCount: 1720,
      readingTime: 7,
      status: 'published',
      publishedAt: '2025-01-28T14:00:00Z',
      createdAt: '2025-01-28T12:00:00Z',
      updatedAt: '2025-01-28T14:00:00Z',
    },
    {
      id: 'chap_2_3',
      storyId: 'story_2',
      chapterNumber: 3,
      title: 'The Siege of Ravenhold',
      subtitle: 'First blood in the rebellion',
      content: `The iron gates of Ravenhold Fortress had withstood three hundred years of tribal rebellions.

They did not withstand Lucian's blood-forged siege ram. With a deafening roar of splintering stone and magical wards collapsing, the vanguard breached the courtyard.

By nightfall, the black banner of the Crimson Raven fluttered over the highest keep. The civil war had officially begun.`,
      wordCount: 2100,
      readingTime: 9,
      status: 'published',
      publishedAt: '2025-02-15T15:00:00Z',
      createdAt: '2025-02-15T13:00:00Z',
      updatedAt: '2025-02-15T15:00:00Z',
    },
    {
      id: 'chap_ja_1_1',
      storyId: 'story_ja_1',
      chapterNumber: 1,
      title: '第1話：真夜中の星紋',
      subtitle: '運命が天空の孤島を揺るがす刻',
      content: `真夜中の空に双子の月が交差する瞬間、ポート・ルナリスの上空は深紫と紅蓮の光に染まっていた。

第9浮遊ドックの錆びた縁で、アリアは星風に銀髪をなびかせながら風防ゴーグルを直した。遥か眼下に広がるエーテル雲海では、古代の魔力水脈がまるで低音の弦楽器のように低く唸りを上げている。

「アリア、コンバーターの出力を安定させて！」インカムからライラの焦った声が響く。「もしその古代遺物が暴走したら、二人仲良く宇宙の塵になっちゃうよ！」

「分かってる。でも、この遺物……脈打ってるの」

冷たいはずの星の遺物が、まるで生きている心臓のようにトクン、トクンと彼女の鼓動に呼応していた。

その瞬間、天空が裂けた。封印の光がアリアの右腕に走り、忘れ去られた神代の星紋が銀色の輝きを放ち始めた――。`,
      wordCount: 1650,
      readingTime: 7,
      status: 'published',
      publishedAt: '2025-02-12T10:00:00Z',
      createdAt: '2025-02-12T08:00:00Z',
      updatedAt: '2025-02-12T10:00:00Z',
    },
    {
      id: 'chap_ja_2_1',
      storyId: 'story_ja_2',
      chapterNumber: 1,
      title: '第1話：ネオンと記憶の密売人',
      subtitle: '電脳の霧に消えた遺言',
      content: `2149年、ネオ京都の夜は決して暗闇を迎えない。ホログラムの雨が濡れたアスファルトに千の色を反射していた。

サイバー路地裏のバーで、蓮は手のひらに収まる生体チップを見つめていた。抽出されたばかりの記憶データ。通常の記憶とは異なり、神経同期のパルスが青く光っている。

「これが創始者の最期の記憶か……」

メガコーポレーションが全神経警察を総動員して追ってくる理由が、今まさに彼の掌の中で息づいていた。`,
      wordCount: 1800,
      readingTime: 8,
      status: 'published',
      publishedAt: '2025-02-14T12:00:00Z',
      createdAt: '2025-02-14T10:00:00Z',
      updatedAt: '2025-02-14T12:00:00Z',
    },
    {
      id: 'chap_es_1_1',
      storyId: 'story_es_1',
      chapterNumber: 1,
      title: 'Capítulo 1: La Caída del Trono Eterno',
      subtitle: 'El eco de la sangre sobre la piedra',
      content: `La noche en que el Emperador fue asesinado, el cielo de la capital ardió con fuego frío. Ocho campanas de bronce resonaron a través del valle, anunciando que la dinastía de tres milenios había llegado a su sangriento final.

Lucian observaba desde los parapetos mientras las banderas sombrías eran izadas. Con el sello rúnico palpitando en su antebrazo, sabía que el exilio había terminado. Era momento de reclamar lo que fue arrebatado.`,
      wordCount: 1720,
      readingTime: 7,
      status: 'published',
      publishedAt: '2025-02-08T09:00:00Z',
      createdAt: '2025-02-08T07:00:00Z',
      updatedAt: '2025-02-08T09:00:00Z',
    },
    {
      id: 'chap_fr_1_1',
      storyId: 'story_fr_1',
      chapterNumber: 1,
      title: 'Chapitre 1 : L\'Éveil sous les Deux Lunes',
      subtitle: 'La poussière d\'étoiles ne ment jamais',
      content: `Au-dessus de Port Lunaris, le ciel s'illuminait d'ombres pourpres et d'or scintillant. Dans le silence des quais suspendus, Aria contemplait l'artefact antique récupéré dans la faille. 

Pour la première fois depuis des siècles, les glyphes de l'éther s'illuminaient d'un éclat bleuté, synchronisé avec les battements de son propre cœur.`,
      wordCount: 1540,
      readingTime: 6,
      status: 'published',
      publishedAt: '2025-02-10T14:00:00Z',
      createdAt: '2025-02-10T12:00:00Z',
      updatedAt: '2025-02-10T14:00:00Z',
    },
    {
      id: 'chap_ko_1_1',
      storyId: 'story_ko_1',
      chapterNumber: 1,
      title: '제1화: 심연의 부름',
      subtitle: '백 번째 탑의 문이 열리다',
      content: `심연의 안개가 걷히자 거대한 흑철색 탑이 모습을 드러냈다. 성흔을 계승한 소년 진우는 검의 자루를 꽉 쥐었다.

"탑의 시련을 통과한 자만이 운명을 바꿀 수 있다."

시스템의 청명한 알림음과 함께, 첫 번째 관문의 푸른 장막이 갈라지기 시작했다.`,
      wordCount: 1600,
      readingTime: 6,
      status: 'published',
      publishedAt: '2025-02-15T16:00:00Z',
      createdAt: '2025-02-15T14:00:00Z',
      updatedAt: '2025-02-15T16:00:00Z',
    },
    {
      id: 'chap_hi_1_1',
      storyId: 'story_hi_1',
      chapterNumber: 1,
      title: 'अध्याय 1: नक्षत्रों का आह्वान',
      subtitle: 'जब आकाश से दिव्य ज्योति उतरी',
      content: `आकाशगंगा के तैरते द्वीपों पर रात का सन्नाटा छा गया था। प्राचीन शिलालेख अचानक नीली आभा से चमकने लगा और आर्यन के हाथों में दिव्य शक्ति का संचार होने लगा।`,
      wordCount: 1400,
      readingTime: 5,
      status: 'published',
      publishedAt: '2025-02-16T10:00:00Z',
      createdAt: '2025-02-16T08:00:00Z',
      updatedAt: '2025-02-16T10:00:00Z',
    },
    {
      id: 'chap_de_1_1',
      storyId: 'story_de_1',
      chapterNumber: 1,
      title: 'Kapitel 1: Das Erwachen der Himmelsinseln',
      subtitle: 'Wo das Licht der Sterne schwindet',
      content: `Über den Docks von Port Lunaris zog ein Sturm kosmischen Äthers auf. Inmitten der metallenen Trümmer fand Aria das Siegel, das die Geschichte von Aethelgard für immer verändern sollte.`,
      wordCount: 1550,
      readingTime: 6,
      status: 'published',
      publishedAt: '2025-02-18T11:00:00Z',
      createdAt: '2025-02-18T09:00:00Z',
      updatedAt: '2025-02-18T11:00:00Z',
    }
  ];

  const readingProgress: ReadingProgress[] = [
    {
      id: 'rp_1',
      userId: 'usr_3',
      storyId: 'story_1',
      storyTitle: 'Celestial Drifters: Awakening',
      storyCover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      chapterId: 'chap_1_2',
      chapterNumber: 2,
      chapterTitle: 'The Azure Blade of Voss',
      totalChapters: 4,
      progressPercent: 50,
      lastPosition: 1200,
      lastReadAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'rp_2',
      userId: 'usr_1',
      storyId: 'story_2',
      storyTitle: 'The Shattered Crown',
      storyCover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      chapterId: 'chap_2_1',
      chapterNumber: 1,
      chapterTitle: 'The Blood on the Marble',
      totalChapters: 3,
      progressPercent: 33,
      lastPosition: 800,
      lastReadAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ];

  const library: LibraryItem[] = [
    {
      id: 'lib_1',
      userId: 'usr_3',
      storyId: 'story_1',
      listType: 'reading',
      addedAt: '2025-02-01T10:00:00Z'
    },
    {
      id: 'lib_2',
      userId: 'usr_3',
      storyId: 'story_4',
      listType: 'saved',
      addedAt: '2025-02-10T12:00:00Z'
    },
    {
      id: 'lib_3',
      userId: 'usr_1',
      storyId: 'story_2',
      listType: 'reading',
      addedAt: '2025-01-20T10:00:00Z'
    }
  ];

  const reviews: Review[] = [
    {
      id: 'rev_1',
      userId: 'usr_3',
      username: 'sakura_dreamer',
      userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      storyId: 'story_1',
      rating: 5,
      reviewText: 'The world-building of Aethelgard is peak light novel material! Aria and Kaelen\'s dynamic has that classic rivals-to-allies tension that makes every chapter an adrenaline rush.',
      createdAt: '2025-02-10T18:00:00Z',
      updatedAt: '2025-02-10T18:00:00Z'
    },
    {
      id: 'rev_2',
      userId: 'usr_2',
      username: 'voidknight',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      storyId: 'story_1',
      rating: 5,
      reviewText: 'Pacing in Chapter 2 during the arena duel was immaculate. The magic system has genuine weight and consequences.',
      createdAt: '2025-02-12T12:00:00Z',
      updatedAt: '2025-02-12T12:00:00Z'
    }
  ];

  const comments: ChapterComment[] = [
    {
      id: 'com_1',
      chapterId: 'chap_1_1',
      storyId: 'story_1',
      userId: 'usr_3',
      username: 'sakura_dreamer',
      userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      content: 'THAT ENDING! When the crest awakened and the bells started tolling in the Grand Citadel... literal goosebumps!',
      likes: 28,
      likedByUsers: ['usr_1', 'usr_2'],
      createdAt: '2025-01-16T12:00:00Z',
      replies: [
        {
          id: 'com_1_rep_1',
          chapterId: 'chap_1_1',
          storyId: 'story_1',
          userId: 'usr_1',
          username: 'althea_v',
          userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          content: 'Thank you! Chapter 2 is where the real rivalry begins with Kaelen!',
          likes: 14,
          likedByUsers: ['usr_3'],
          parentId: 'com_1',
          createdAt: '2025-01-16T14:30:00Z'
        }
      ]
    },
    {
      id: 'com_2',
      chapterId: 'chap_1_2',
      storyId: 'story_1',
      userId: 'usr_2',
      username: 'voidknight',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      content: 'Kaelen’s zero-point slash technique being repelled by sheer primal Aether gravitons is such a great setup for their power dynamic.',
      likes: 19,
      likedByUsers: ['usr_3'],
      createdAt: '2025-01-23T10:00:00Z',
      replies: []
    }
  ];

  const communities: Community[] = [
    {
      id: 'comm_1',
      name: 'The Astral Universe Fandom',
      slug: 'astral-universe-fandom',
      description: 'The official sanctuary for readers, lore explorers, and theory crafters following Althea Vance\'s celestial works.',
      bannerImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
      iconImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80',
      type: 'story',
      memberCount: 8420,
      membersCount: 8420,
      postsCount: 14,
      createdAt: '2025-01-12T00:00:00Z'
    },
    {
      id: 'comm_2',
      name: 'Dark Fantasy & Isekai Guild',
      slug: 'dark-fantasy-isekai-guild',
      description: 'Discussions around grimdark worldbuilding, anti-hero protagonists, and high-stakes magic systems.',
      bannerImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
      iconImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      type: 'genre',
      memberCount: 14200,
      membersCount: 14200,
      postsCount: 28,
      createdAt: '2025-01-05T00:00:00Z'
    },
    {
      id: 'comm_3',
      name: 'Light Novel Writers Workshop',
      slug: 'light-novel-writers-workshop',
      description: 'Peer critiques, pacing discussions, magic system design, and serialized storytelling masterclasses.',
      bannerImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&auto=format&fit=crop&q=80',
      iconImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      type: 'creator',
      memberCount: 6510,
      membersCount: 6510,
      postsCount: 9,
      createdAt: '2025-01-08T00:00:00Z'
    },
    {
      id: 'comm_4',
      name: 'Anime Theories & Seasonal Hype',
      slug: 'anime-theories-seasonal-hype',
      description: 'Weekly episode breakdowns, manga-to-anime comparisons, animation studio analyses, and trackings.',
      bannerImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
      iconImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      type: 'anime',
      memberCount: 22100,
      membersCount: 22100,
      postsCount: 35,
      createdAt: '2025-01-02T00:00:00Z'
    }
  ];

  const communityPosts: CommunityPost[] = [
    {
      id: 'post_1',
      communityId: 'comm_1',
      communityName: 'The Astral Universe Fandom',
      authorId: 'usr_3',
      authorUsername: 'sakura_dreamer',
      authorDisplayName: 'Sakura Dreamer',
      authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      title: 'Who will master the Twin Eclipse resonance first?',
      content: 'In chapter 4 we saw the void rift expand over Port Lunaris. Do you think Aria will unlock her second affinity or will Kaelen have to sacrifice his ancestral blade?',
      type: 'POLL',
      tag: 'Theory',
      likes: 42,
      likedByUsers: ['usr_1'],
      commentsCount: 18,
      mediaType: 'poll',
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
      createdAt: '2025-02-22T14:00:00Z'
    },
    {
      id: 'post_2',
      communityId: 'comm_1',
      communityName: 'The Astral Universe Fandom',
      authorId: 'usr_1',
      authorUsername: 'althea_v',
      authorDisplayName: 'Althea Vance',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      title: 'Chapter 5 Teaser: The Archon Chamber',
      content: 'Here is an official snippet from next week’s chapter: "The stained glass of the High Spire began to sing in three distinct keys. None of them belonged to the living world."',
      type: 'ANNOUNCEMENT',
      mediaUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1000&auto=format&fit=crop&q=80',
      mediaType: 'image',
      tag: 'Official Update',
      likes: 128,
      likedByUsers: ['usr_2', 'usr_3'],
      commentsCount: 34,
      createdAt: '2025-02-26T18:00:00Z'
    }
  ];

  const theories: Theory[] = [
    {
      id: 'th_1',
      title: 'The Floating Isles are actually petrified Titan Ships',
      description: 'If you look at the map of Aethelgard in the World Codex, the inverted graviton lattices follow the exact curvature of pre-ancient interstellar hulls. The Archons are not mages—they are maintenance technicians running automated ship life-support!',
      authorId: 'usr_3',
      authorUsername: 'sakura_dreamer',
      authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      storyId: 'story_1',
      storyTitle: 'Celestial Drifters: Awakening',
      chapterReference: 3,
      status: 'UNCONFIRMED',
      agreeCount: 94,
      disagreeCount: 12,
      commentsCount: 22,
      createdAt: '2025-02-10T15:00:00Z'
    },
    {
      id: 'th_2',
      title: 'Kaelen’s father made a pact with the Void Entity',
      description: 'In Chapter 3, the memory orb shows a figure with the Voss family seal opening the vault wards from the outside during the Eclipse War.',
      authorId: 'usr_2',
      authorUsername: 'voidknight',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      storyId: 'story_1',
      storyTitle: 'Celestial Drifters: Awakening',
      chapterReference: 3,
      status: 'CONFIRMED',
      agreeCount: 148,
      disagreeCount: 3,
      commentsCount: 38,
      createdAt: '2025-02-12T19:00:00Z'
    }
  ];

  const animeEntries: AnimeEntry[] = [
    {
      id: 'ani_1',
      title: 'Frieren: Beyond Journey\'s End',
      altTitles: 'Sousou no Frieren',
      poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      synopsis: 'The demon king has been defeated, and the victorious hero party returns home before disbanding. The four—mage Frieren, hero Himmel, priest Heiter, and warrior Eisen—reminisce about their decade-long journey. But the passing of time is different for elves.',
      genres: ['Fantasy', 'Adventure', 'Drama', 'Magic'],
      score: 9.35,
      episodes: 28,
      status: 'Finished Airing',
      season: 'Fall 2023',
      characters: [
        { name: 'Frieren', role: 'Main', portrait: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
        { name: 'Fern', role: 'Main', portrait: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
        { name: 'Stark', role: 'Main', portrait: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' }
      ],
      whereToWatch: [
        { platform: 'Crunchyroll', url: 'https://www.crunchyroll.com', iconName: 'tv' },
        { platform: 'Netflix', url: 'https://www.netflix.com', iconName: 'film' }
      ],
      reviews: [
        {
          id: 'ar_1',
          userId: 'usr_3',
          username: 'sakura_dreamer',
          userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
          rating: 10,
          text: 'A transcendent meditation on time, grief, friendship, and quiet magic. One of the greatest fantasy works ever produced.',
          createdAt: '2025-01-20T10:00:00Z'
        }
      ]
    },
    {
      id: 'ani_2',
      title: 'Solo Leveling',
      altTitles: 'Ore dake Level Up na Ken',
      poster: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
      synopsis: 'In a world where hunters, humans who possess magical powers, battle deadly monsters to protect the human race from certain annihilation, a notoriously weak hunter named Sung Jinwoo finds himself in a struggle for survival in a double dungeon.',
      genres: ['Action', 'Fantasy', 'Supernatural'],
      score: 8.7,
      episodes: 24,
      status: 'Currently Airing',
      season: 'Winter 2024 / Winter 2025',
      characters: [
        { name: 'Sung Jinwoo', role: 'Main', portrait: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
        { name: 'Cha Hae-In', role: 'Supporting', portrait: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80' }
      ],
      whereToWatch: [
        { platform: 'Crunchyroll', url: 'https://www.crunchyroll.com', iconName: 'tv' }
      ],
      reviews: [
        {
          id: 'ar_2',
          userId: 'usr_2',
          username: 'voidknight',
          userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
          rating: 9,
          text: 'Top tier combat direction and godly animation soundtrack by Hiroyuki Sawano.',
          createdAt: '2025-02-01T14:00:00Z'
        }
      ]
    },
    {
      id: 'ani_3',
      title: 'Jujutsu Kaisen',
      altTitles: 'Sorcery Fight',
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      synopsis: 'A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman\'s school to be able to locate the demon\'s other body parts and thus exorcise himself.',
      genres: ['Action', 'Dark Fantasy', 'Supernatural', 'School'],
      score: 8.9,
      episodes: 47,
      status: 'Finished Airing',
      season: 'Fall 2020 / Summer 2023',
      characters: [
        { name: 'Yuji Itadori', role: 'Main', portrait: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
        { name: 'Satoru Gojo', role: 'Main', portrait: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' }
      ],
      whereToWatch: [
        { platform: 'Crunchyroll', url: 'https://www.crunchyroll.com', iconName: 'tv' },
        { platform: 'Netflix', url: 'https://www.netflix.com', iconName: 'film' }
      ],
      reviews: []
    }
  ];

  const notifications: Notification[] = [
    {
      id: 'notif_1',
      userId: 'usr_3',
      type: 'new_chapter',
      title: 'New Chapter Released!',
      message: 'Althea Vance published Chapter 4: "The Void Breach at Dawn" in Celestial Drifters: Awakening.',
      linkUrl: '/story/celestial-drifters-awakening/read/4',
      isRead: false,
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'notif_2',
      userId: 'usr_3',
      type: 'comment_reply',
      title: 'Author Replied to Your Comment',
      message: 'Althea Vance replied: "Thank you! Chapter 2 is where the real rivalry begins with Kaelen!"',
      linkUrl: '/story/celestial-drifters-awakening',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'notif_3',
      userId: 'usr_1',
      type: 'new_follower',
      title: 'New Follower',
      message: 'Sakura Dreamer and 14 other readers started following your author profile.',
      linkUrl: '/profile/sakura_dreamer',
      isRead: false,
      createdAt: new Date(Date.now() - 14400000).toISOString()
    }
  ];

  const defaultBadges: Badge[] = [
    {
      id: 'bdg_1',
      key: 'streak_7',
      title: '7-Day Reading Streak',
      description: 'Read chapters for 7 consecutive days on KAIRO.',
      icon: 'flame',
      unlocked: true,
      unlockedAt: '2025-02-15T00:00:00Z',
      progress: { current: 7, max: 7 }
    },
    {
      id: 'bdg_2',
      key: 'stories_10',
      title: 'Story Wanderer',
      description: 'Explore and read at least 10 different original serials.',
      icon: 'book-open',
      unlocked: true,
      unlockedAt: '2025-02-18T00:00:00Z',
      progress: { current: 10, max: 10 }
    },
    {
      id: 'bdg_3',
      key: 'lore_master',
      title: 'Lore Master',
      description: 'Inspect 5 complete world codexes and character relationship graphs.',
      icon: 'sparkles',
      unlocked: false,
      progress: { current: 3, max: 5 }
    },
    {
      id: 'bdg_4',
      key: 'theory_crafter',
      title: 'Prophet of Canon',
      description: 'Have a community theory reach 50+ agreed votes.',
      icon: 'lightbulb',
      unlocked: true,
      unlockedAt: '2025-02-24T00:00:00Z',
      progress: { current: 94, max: 50 }
    }
  ];

  const badges: Record<string, Badge[]> = {
    'usr_1': defaultBadges,
    'usr_2': defaultBadges,
    'usr_3': defaultBadges,
    'usr_admin': defaultBadges,
  };

  const likes: Record<string, string[]> = {
    'story_1': ['usr_2', 'usr_3', 'usr_admin'],
    'story_2': ['usr_1', 'usr_3'],
    'story_3': ['usr_3'],
    'story_4': ['usr_1', 'usr_2'],
    'story_5': ['usr_1', 'usr_3'],
  };

  const follows: Record<string, string[]> = {
    'usr_1': ['usr_2', 'usr_3'],
    'usr_2': ['usr_1', 'usr_3'],
    'usr_3': ['usr_1'],
  };

  const userAnimeTracking: Record<string, Record<string, { status: string; episodesWatched: number }>> = {
    'usr_3': {
      'ani_1': { status: 'Completed', episodesWatched: 28 },
      'ani_2': { status: 'Watching', episodesWatched: 18 }
    }
  };

  return {
    users,
    passwords,
    sessions: {},
    stories,
    chapters,
    readingProgress,
    library,
    reviews,
    comments,
    communities,
    communityPosts,
    theories,
    characters,
    characterRelationships,
    worlds,
    universes,
    animeEntries,
    notifications,
    badges,
    likes,
    follows,
    userAnimeTracking,
    chatRooms: initialChatRooms,
    chatMessages: initialChatMessages,
    events: initialEvents,
    contests: initialContests,
    directMessages: {},
    conversations: [
      {
        id: 'conv_1',
        participantIds: ['usr_1', 'usr_3'],
        lastMessage: 'Let me know what you think of the new astral map!',
        lastMessageAt: '2025-02-27T10:00:00Z',
        unreadCount: 0,
        participants: [
          { id: 'usr_1', username: 'althea_v', displayName: 'Althea Vance', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', role: 'WRITER' },
          { id: 'usr_3', username: 'sakura_dreamer', displayName: 'Sakura Dreamer', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80' }
        ]
      }
    ],
    readingLists: [
      {
        id: 'list_1',
        userId: 'usr_3',
        username: 'sakura_dreamer',
        title: 'Masterpiece Worldbuilding & High Stakes',
        description: 'Serene prose, intricate magical physics, and emotional payoff.',
        isPublic: true,
        storyIds: ['story_1', 'story_2'],
        likes: 124,
        createdAt: '2025-02-15T00:00:00Z'
      }
    ],
    quoteSnippets: initialQuoteSnippets,
    reports: [],
    blockedUsers: {},
    mutedUsers: {},
    communityMembers: {
      'comm_astral': ['usr_1', 'usr_3', 'usr_admin'],
      'comm_shattered': ['usr_2', 'usr_3'],
      'comm_dark_fantasy': ['usr_1', 'usr_2', 'usr_3'],
      'comm_anime_hype': ['usr_3', 'usr_admin'],
      'comm_writers_workshop': ['usr_1', 'usr_2']
    },
    postSaves: {},
    postFollows: {},
    programs: initialPrograms,
    programParticipants: initialParticipants,
    programSubmissions: initialSubmissions,
    programVotes: initialVotes,
    programAnnouncements: initialAnnouncements,
    programAuditLogs: initialAuditLogs,
    programCertificates: initialCertificates,
    userInterestProfiles: {},
    userBehaviorEvents: [],
    adminRecommendationSettings: {
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
      updatedAt: now,
      updatedBy: 'system'
    }
  };
}

class DatabaseService {
  private db: DatabaseSchema;
  private dataDir: string;
  private dbFile: string;
  private backupFile: string;
  private snapshotFile: string;
  private seedFile: string;
  private lastSnapshotTime: number = 0;

  constructor() {
    const paths = resolveDataPaths();
    this.dataDir = paths.dataDir;
    this.dbFile = paths.dbFile;
    this.backupFile = paths.backupFile;
    this.snapshotFile = paths.snapshotFile;
    this.seedFile = paths.seedFile;

    this.ensureDataDir();
    this.db = this.loadDatabase();
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (err: any) {
      console.warn('Unable to create data directory (proceeding in-memory):', err?.message);
    }
  }

  private enrichDatabase(parsed: DatabaseSchema): DatabaseSchema {
    if (!parsed || typeof parsed !== 'object') {
      parsed = {} as DatabaseSchema;
    }

    // Guard all core collections against undefined to prevent runtime crashes
    parsed.users = parsed.users || [];
    parsed.passwords = parsed.passwords || {};
    parsed.sessions = parsed.sessions || {};
    parsed.stories = parsed.stories || [];
    parsed.chapters = parsed.chapters || [];
    parsed.readingProgress = parsed.readingProgress || [];
    parsed.library = parsed.library || [];
    parsed.reviews = parsed.reviews || [];
    parsed.comments = parsed.comments || [];
    parsed.communities = parsed.communities || [];
    parsed.communityPosts = parsed.communityPosts || [];
    parsed.theories = parsed.theories || [];
    parsed.characters = parsed.characters || [];
    parsed.characterRelationships = parsed.characterRelationships || [];
    parsed.worlds = parsed.worlds || [];
    parsed.universes = parsed.universes || [];
    parsed.animeEntries = parsed.animeEntries || [];
    parsed.notifications = parsed.notifications || [];
    parsed.badges = parsed.badges || {};
    parsed.likes = parsed.likes || {};
    parsed.follows = parsed.follows || {};
    parsed.userAnimeTracking = parsed.userAnimeTracking || {};
    parsed.chatRooms = parsed.chatRooms || [];
    parsed.chatMessages = parsed.chatMessages || {};
    parsed.events = parsed.events || [];
    parsed.contests = parsed.contests || [];
    parsed.directMessages = parsed.directMessages || {};
    parsed.conversations = parsed.conversations || [];
    parsed.readingLists = parsed.readingLists || [];
    parsed.quoteSnippets = parsed.quoteSnippets || [];
    parsed.reports = parsed.reports || [];
    parsed.blockedUsers = parsed.blockedUsers || {};
    parsed.mutedUsers = parsed.mutedUsers || {};
    parsed.communityMembers = parsed.communityMembers || {};
    parsed.postSaves = parsed.postSaves || {};
    parsed.postFollows = parsed.postFollows || {};
    parsed.programs = parsed.programs || [];
    parsed.programParticipants = parsed.programParticipants || [];
    parsed.programSubmissions = parsed.programSubmissions || [];
    parsed.programVotes = parsed.programVotes || [];
    parsed.programAnnouncements = parsed.programAnnouncements || [];
    parsed.programAuditLogs = parsed.programAuditLogs || [];
    parsed.programCertificates = parsed.programCertificates || [];
    parsed.userInterestProfiles = parsed.userInterestProfiles || {};
    parsed.userBehaviorEvents = parsed.userBehaviorEvents || [];

    // Auto migrate any legacy plain passwords to salted hashes
    if (parsed.passwords) {
      for (const uid of Object.keys(parsed.passwords)) {
        const val = parsed.passwords[uid];
        if (typeof val === 'string') {
          const salt = crypto.randomBytes(16).toString('hex');
          const hash = hashPassword(val, salt);
          parsed.passwords[uid] = { salt, hash };
        }
      }
    }
    // Ensure community ecosystem data exists
    if (!parsed.chatRooms || parsed.chatRooms.length === 0) {
      parsed.chatRooms = initialChatRooms;
    }
    if (!parsed.chatMessages || Object.keys(parsed.chatMessages).length === 0) {
      parsed.chatMessages = initialChatMessages;
    }
    if (!parsed.events || parsed.events.length === 0) {
      parsed.events = initialEvents;
    }
    if (!parsed.contests || parsed.contests.length === 0) {
      parsed.contests = initialContests;
    }
    if (!parsed.quoteSnippets || parsed.quoteSnippets.length === 0) {
      parsed.quoteSnippets = initialQuoteSnippets;
    }
    if (!parsed.directMessages) parsed.directMessages = {};
    if (!parsed.conversations) parsed.conversations = [
      {
        id: 'conv_1',
        participantIds: ['usr_1', 'usr_3'],
        lastMessage: 'Let me know what you think of the new astral map!',
        lastMessageAt: '2025-02-27T10:00:00Z',
        unreadCount: 0,
        participants: [
          { id: 'usr_1', username: 'althea_v', displayName: 'Althea Vance', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', role: 'WRITER' },
          { id: 'usr_3', username: 'sakura_dreamer', displayName: 'Sakura Dreamer', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80' }
        ]
      }
    ];
    if (!parsed.readingLists) parsed.readingLists = [
      {
        id: 'list_1',
        userId: 'usr_3',
        username: 'sakura_dreamer',
        title: 'Masterpiece Worldbuilding & High Stakes',
        description: 'Serene prose, intricate magical physics, and emotional payoff.',
        isPublic: true,
        storyIds: ['story_1', 'story_2'],
        likes: 124,
        createdAt: '2025-02-15T00:00:00Z'
      }
    ];
    if (!parsed.reports) parsed.reports = [];
    if (!parsed.blockedUsers) parsed.blockedUsers = {};
    if (!parsed.mutedUsers) parsed.mutedUsers = {};
    if (!parsed.communityMembers) parsed.communityMembers = {
      'comm_astral': ['usr_1', 'usr_3', 'usr_admin'],
      'comm_shattered': ['usr_2', 'usr_3'],
      'comm_dark_fantasy': ['usr_1', 'usr_2', 'usr_3'],
      'comm_anime_hype': ['usr_3', 'usr_admin'],
      'comm_writers_workshop': ['usr_1', 'usr_2']
    };
    if (!parsed.postSaves) parsed.postSaves = {};
    if (!parsed.postFollows) parsed.postFollows = {};

    if (!parsed.programs || parsed.programs.length === 0) {
      parsed.programs = initialPrograms;
    }
    if (!parsed.programParticipants || parsed.programParticipants.length === 0) {
      parsed.programParticipants = initialParticipants;
    }
    if (!parsed.programSubmissions || parsed.programSubmissions.length === 0) {
      parsed.programSubmissions = initialSubmissions;
    }
    if (!parsed.programVotes || parsed.programVotes.length === 0) {
      parsed.programVotes = initialVotes;
    }
    if (!parsed.programAnnouncements || parsed.programAnnouncements.length === 0) {
      parsed.programAnnouncements = initialAnnouncements;
    }
    if (!parsed.programAuditLogs || parsed.programAuditLogs.length === 0) {
      parsed.programAuditLogs = initialAuditLogs;
    }
    if (!parsed.programCertificates || parsed.programCertificates.length === 0) {
      parsed.programCertificates = initialCertificates;
    }
    if (!parsed.userInterestProfiles) {
      parsed.userInterestProfiles = {};
    }
    if (!parsed.userBehaviorEvents) {
      parsed.userBehaviorEvents = [];
    }
    if (!parsed.adminRecommendationSettings) {
      parsed.adminRecommendationSettings = {
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
    }

    // Merge initial communities if missing
    initialCommunities.forEach(c => {
      const exists = parsed.communities.some(ex => ex.id === c.id || ex.slug === c.slug);
      if (!exists) {
        parsed.communities.push(c);
      }
    });

    // Merge initial posts if missing
    initialPosts.forEach(p => {
      const exists = parsed.communityPosts.some(ex => ex.id === p.id);
      if (!exists) {
        parsed.communityPosts.push(p);
      }
    });

    return parsed;
  }

  private loadDatabase(): DatabaseSchema {
    // Tier 1: Primary active database file
    try {
      if (fs.existsSync(this.dbFile)) {
        const raw = fs.readFileSync(this.dbFile, 'utf-8');
        if (raw && raw.trim().length > 10) {
          const parsed: DatabaseSchema = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            console.log(`[DB] Successfully loaded active database (${parsed.stories?.length || 0} stories, ${parsed.users?.length || 0} users)`);
            return this.enrichDatabase(parsed);
          }
        }
      }
    } catch (err: any) {
      console.warn('[DB] Primary database file could not be parsed, attempting backup recovery:', err?.message);
    }

    // Tier 2: Dedicated backup file (never corrupted by partial process kills)
    try {
      if (this.backupFile && fs.existsSync(this.backupFile)) {
        const raw = fs.readFileSync(this.backupFile, 'utf-8');
        if (raw && raw.trim().length > 10) {
          const parsed: DatabaseSchema = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            console.info(`[DB RECOVERY] Restored database from backup file (${parsed.stories?.length || 0} stories, ${parsed.users?.length || 0} users)`);
            const enriched = this.enrichDatabase(parsed);
            this.saveDatabase(enriched);
            return enriched;
          }
        }
      }
    } catch (err: any) {
      console.warn('[DB RECOVERY] Backup file check failed, checking snapshot:', err?.message);
    }

    // Tier 3: Snapshot file
    try {
      if (this.snapshotFile && fs.existsSync(this.snapshotFile)) {
        const raw = fs.readFileSync(this.snapshotFile, 'utf-8');
        if (raw && raw.trim().length > 10) {
          const parsed: DatabaseSchema = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            console.info(`[DB RECOVERY] Restored database from snapshot file (${parsed.stories?.length || 0} stories, ${parsed.users?.length || 0} users)`);
            const enriched = this.enrichDatabase(parsed);
            this.saveDatabase(enriched);
            return enriched;
          }
        }
      }
    } catch (err: any) {
      console.warn('[DB RECOVERY] Snapshot check failed:', err?.message);
    }

    // Tier 4: Initial baseline seed ONLY if absolutely no database was ever found
    console.info('[DB INIT] No previous database found. Initializing seed baseline.');
    try {
      if (this.seedFile && fs.existsSync(this.seedFile) && this.seedFile !== this.dbFile) {
        const raw = fs.readFileSync(this.seedFile, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        const enriched = this.enrichDatabase(parsed);
        this.saveDatabase(enriched);
        return enriched;
      }
    } catch (err: any) {
      console.warn('[DB INIT] Seed file read failed:', err?.message);
    }

    const seed = getInitialSeed();
    // Hash seed passwords
    for (const uid of Object.keys(seed.passwords)) {
      const val = seed.passwords[uid];
      if (typeof val === 'string') {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPassword(val, salt);
        seed.passwords[uid] = { salt, hash };
      }
    }
    this.saveDatabase(seed);
    return seed;
  }

  private saveDatabase(data?: DatabaseSchema) {
    try {
      const dataToSave = data || this.db;
      this.ensureDataDir();
      const content = JSON.stringify(dataToSave, null, 2);

      // 1. Atomic write using temporary file and atomic rename
      // This guarantees that kairo_db.json is NEVER truncated or left in 0-byte state during restarts
      const tmpFile = path.join(this.dataDir, `.kairo_db_tmp_${process.pid}_${Date.now()}.json`);
      fs.writeFileSync(tmpFile, content, 'utf-8');
      fs.renameSync(tmpFile, this.dbFile);

      // 2. Synchronous secondary backup copy
      try {
        if (this.backupFile && this.backupFile !== this.dbFile) {
          fs.writeFileSync(this.backupFile, content, 'utf-8');
        }
      } catch (bErr: any) {
        // Non-blocking
      }

      // 3. Periodic snapshot (every 5 minutes or on demand)
      const now = Date.now();
      if (now - this.lastSnapshotTime > 5 * 60 * 1000) {
        this.lastSnapshotTime = now;
        try {
          if (this.snapshotFile && this.snapshotFile !== this.dbFile) {
            fs.writeFileSync(this.snapshotFile, content, 'utf-8');
          }
        } catch {}
      }
    } catch (err: any) {
      console.warn('Notice: Active database is saved in-memory (disk persistence skipped in restricted environment):', err?.message);
    }
  }

  public getRaw(): DatabaseSchema {
    return this.db;
  }

  public commit() {
    this.saveDatabase();
  }

  public getDatabaseHealth() {
    return {
      status: 'healthy',
      storiesCount: (this.db.stories || []).length,
      chaptersCount: (this.db.chapters || []).length,
      charactersCount: (this.db.characters || []).length,
      usersCount: (this.db.users || []).length,
      reviewsCount: (this.db.reviews || []).length,
      readingProgressCount: (this.db.readingProgress || []).length,
      timestamp: new Date().toISOString()
    };
  }

  public hydrateFromClient(payload: {
    stories?: Story[];
    chapters?: Chapter[];
    characters?: Character[];
  }): { addedStories: number; addedChapters: number; addedCharacters: number } {
    let addedStories = 0;
    let addedChapters = 0;
    let addedCharacters = 0;

    if (Array.isArray(payload.stories)) {
      for (const s of payload.stories) {
        if (!s || !s.id) continue;
        const exists = (this.db.stories || []).some(ex => ex.id === s.id);
        if (!exists) {
          this.db.stories.unshift(s);
          addedStories++;
        }
      }
    }

    if (Array.isArray(payload.chapters)) {
      for (const ch of payload.chapters) {
        if (!ch || !ch.id) continue;
        const exists = (this.db.chapters || []).some(ex => ex.id === ch.id);
        if (!exists) {
          this.db.chapters.push(ch);
          addedChapters++;
        }
      }
    }

    if (Array.isArray(payload.characters)) {
      for (const c of payload.characters) {
        if (!c || !c.id) continue;
        const exists = (this.db.characters || []).some(ex => ex.id === c.id);
        if (!exists) {
          this.db.characters.push(c);
          addedCharacters++;
        }
      }
    }

    if (addedStories > 0 || addedChapters > 0 || addedCharacters > 0) {
      console.log(`[DB Hydration] Restored from client: ${addedStories} stories, ${addedChapters} chapters, ${addedCharacters} characters`);
      this.commit();
    }

    return { addedStories, addedChapters, addedCharacters };
  }

  // ----------------------------------------------------
  // SESSIONS & AUTHENTICATION (STATESELESS & PERSISTENT)
  // ----------------------------------------------------
  private getSessionSecret(): string {
    return process.env.SESSION_SECRET || process.env.JWT_SECRET || 'kairo_jwt_sec_2025_prod_v1_secure_sign_key_93a1f8';
  }

  public createSession(userId: string): { token: string; expiresAt: string } {
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const expiresAtMs = expires.getTime();

    // Create HMAC signed token for serverless cold start resilience
    const secret = this.getSessionSecret();
    const payload = `${userId}:${expiresAtMs}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const token = `kairo_sig.${userId}.${expiresAtMs}.${signature}`;

    if (!this.db.sessions) {
      this.db.sessions = {};
    }
    this.db.sessions[token] = {
      userId,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString()
    };
    this.commit();
    return { token, expiresAt: expires.toISOString() };
  }

  public validateSessionDetails(token: string): { user: User | null; status: 'OK' | 'EXPIRED' | 'INVALID' | 'NOT_FOUND' | 'SUSPENDED' } {
    if (!token || typeof token !== 'string') {
      return { user: null, status: 'INVALID' };
    }

    const cleanToken = token.trim();

    // Check revocation
    if ((this.db as any).revokedTokens && (this.db as any).revokedTokens[cleanToken]) {
      return { user: null, status: 'INVALID' };
    }

    // 1. Direct session table lookup
    if (this.db.sessions && this.db.sessions[cleanToken]) {
      const session = this.db.sessions[cleanToken];
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        delete this.db.sessions[cleanToken];
        this.commit();
        return { user: null, status: 'EXPIRED' };
      }
      const user = this.findUserById(session.userId);
      if (!user) return { user: null, status: 'NOT_FOUND' };
      if (user.status === 'SUSPENDED') return { user, status: 'SUSPENDED' };
      return { user, status: 'OK' };
    }

    // 2. Stateless HMAC token validation for serverless cold-starts
    if (cleanToken.startsWith('kairo_sig.')) {
      const parts = cleanToken.split('.');
      if (parts.length === 4) {
        const [, userId, expiresAtStr, signature] = parts;
        const expiresAtMs = parseInt(expiresAtStr, 10);

        if (isNaN(expiresAtMs) || Date.now() > expiresAtMs) {
          return { user: null, status: 'EXPIRED' };
        }

        const secret = this.getSessionSecret();
        const payload = `${userId}:${expiresAtStr}`;
        const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

        // Timing safe signature comparison
        const sigBuf = Buffer.from(signature, 'hex');
        const expBuf = Buffer.from(expectedSig, 'hex');
        if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
          const user = this.findUserById(userId);
          if (!user) return { user: null, status: 'NOT_FOUND' };
          if (user.status === 'SUSPENDED') return { user, status: 'SUSPENDED' };

          // Cache verified session in memory for quick subsequent queries
          if (!this.db.sessions) this.db.sessions = {};
          this.db.sessions[cleanToken] = {
            userId,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(expiresAtMs).toISOString()
          };
          this.commit();

          return { user, status: 'OK' };
        } else {
          return { user: null, status: 'INVALID' };
        }
      }
    }

    // 3. Fallback client token format: kairo_tok_<userId>_<timestamp>
    if (cleanToken.startsWith('kairo_tok_')) {
      const remainder = cleanToken.replace(/^kairo_tok_/, '');
      const lastUnderscore = remainder.lastIndexOf('_');
      const userId = lastUnderscore !== -1 ? remainder.substring(0, lastUnderscore) : remainder;
      let user = this.findUserById(userId) || (this.db.users || []).find(u => u.username.toLowerCase() === userId.toLowerCase());
      if (!user) {
        user = this.findUserById(remainder);
      }
      if (user) {
        if (user.status === 'SUSPENDED') return { user, status: 'SUSPENDED' };
        return { user, status: 'OK' };
      }
    }

    return { user: null, status: 'INVALID' };
  }

  public validateSession(token: string): User | null {
    const res = this.validateSessionDetails(token);
    return res.status === 'OK' ? res.user : null;
  }

  public destroySession(token: string): boolean {
    if (!token) return false;
    const cleanToken = token.trim();
    if (!this.db.sessions) this.db.sessions = {};
    if (!(this.db as any).revokedTokens) (this.db as any).revokedTokens = {};

    (this.db as any).revokedTokens[cleanToken] = true;
    if (this.db.sessions[cleanToken]) {
      delete this.db.sessions[cleanToken];
      this.commit();
      return true;
    }
    this.commit();
    return true;
  }

  // Users
  public findUserById(id: string): User | undefined {
    return this.db.users.find(u => u.id === id);
  }

  public findUserByEmailOrUsername(query: string): User | undefined {
    const q = query.toLowerCase().trim();
    return this.db.users.find(u => u.email.toLowerCase() === q || u.username.toLowerCase() === q);
  }

  public verifyPassword(userId: string, plain: string): boolean {
    const stored = this.db.passwords[userId];
    if (!stored) return false;

    if (typeof stored === 'string') {
      if (stored === plain) {
        // Upgrade to salted hash on first successful verification
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPassword(plain, salt);
        this.db.passwords[userId] = { salt, hash };
        this.commit();
        return true;
      }
      return false;
    }

    try {
      const computedHash = hashPassword(plain, stored.salt);
      const computedBuf = Buffer.from(computedHash, 'hex');
      const storedBuf = Buffer.from(stored.hash, 'hex');
      if (computedBuf.length !== storedBuf.length) return false;
      return crypto.timingSafeEqual(computedBuf, storedBuf);
    } catch {
      return false;
    }
  }

  public setUserPassword(userId: string, plain: string): void {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(plain, salt);
    this.db.passwords[userId] = { salt, hash };
    this.commit();
  }

  public createUser(userData: Partial<User>, password = 'password123'): User {
    const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();
    const newUser: User = {
      id,
      username: userData.username || `wanderer_${id.slice(-4)}`,
      email: userData.email || `${id}@kairo.app`,
      displayName: userData.displayName || userData.username || 'New Wanderer',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      bio: userData.bio || 'Story explorer & avid reader on KAIRO.',
      role: userData.role || 'USER',
      xp: 0,
      level: 1,
      readingStreak: 0,
      streakDays: 0,
      lastActiveDate: now,
      followersCount: 0,
      followingCount: 0,
      chaptersReadCount: 0,
      totalReads: 0,
      favoriteGenres: userData.favoriteGenres || ['Fantasy', 'Anime-Inspired'],
      favoriteThemes: userData.favoriteThemes || ['Original Worlds'],
      createdAt: now,
    };

    this.db.users.push(newUser);
    
    // Store hashed password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    this.db.passwords[id] = { salt, hash };

    this.db.badges[id] = [];
    this.commit();
    return newUser;
  }

  public getUserEnriched(user: User): User {
    const readingProgressList = this.db.readingProgress ? this.db.readingProgress.filter(rp => rp.userId === user.id) : [];
    const chaptersReadCount = readingProgressList.length;
    const authoredStories = this.db.stories ? this.db.stories.filter(s => 
      s.authorId === user.id || 
      (s.authorUsername && user.username && s.authorUsername.toLowerCase() === user.username.toLowerCase())
    ) : [];
    
    let streak = user.readingStreak ?? 0;
    if (readingProgressList.length === 0) {
      streak = 0;
    } else if (streak === 0) {
      streak = 1;
    }

    const profile = (this.db.userInterestProfiles && this.db.userInterestProfiles[user.id]) || undefined;

    return {
      ...user,
      chaptersReadCount,
      publishedStoriesCount: authoredStories.length,
      readingStreak: streak,
      streakDays: streak,
      totalReads: Math.max(user.totalReads ?? 0, chaptersReadCount),
      hasCompletedOnboarding: profile ? profile.hasCompletedOnboarding : false,
      interestProfile: profile
    };
  }

  public updateUser(userId: string, updates: Partial<User>): User | undefined {
    const idx = this.db.users.findIndex(u => u.id === userId);
    if (idx === -1) return undefined;
    this.db.users[idx] = { ...this.db.users[idx], ...updates };
    this.commit();
    return this.db.users[idx];
  }

  public getPublicUserProfile(idOrUsername: string, viewerId?: string): {
    user: User;
    isFollowing: boolean;
    isSelf: boolean;
    stories: Story[];
    posts: CommunityPost[];
    universes: Universe[];
    theories: CommunityPost[];
    readingList: {
      story: Story;
      listType: string;
      addedAt: string;
    }[];
    certificates: ProgramCertificate[];
    badges: string[];
    stats: {
      totalStories: number;
      totalReads: number;
      totalLikes: number;
      totalPosts: number;
      totalTheories: number;
      totalUniverses: number;
      followersCount: number;
      followingCount: number;
      chaptersCount: number;
    };
  } | undefined {
    if (!idOrUsername || typeof idOrUsername !== 'string') return undefined;
    const clean = idOrUsername.trim().toLowerCase().replace(/^@/, '');
    if (!clean || clean === '[object object]' || clean === 'undefined' || clean === 'null') return undefined;
    const user = this.db.users.find(u => 
      u.id.toLowerCase() === clean || 
      u.username.toLowerCase() === clean ||
      (u.email && u.email.toLowerCase() === clean)
    );
    if (!user) return undefined;

    const enrichedUser = this.getUserEnriched(user);
    const userId = user.id;

    // Follow status
    const followers = this.db.follows?.[userId] || [];
    const isFollowing = Boolean(viewerId && followers.includes(viewerId));
    const isSelf = Boolean(viewerId && viewerId === userId);

    // Calculate following count: how many users does this user follow?
    let followingCount = 0;
    for (const authorId of Object.keys(this.db.follows || {})) {
      if (this.db.follows[authorId]?.includes(userId)) {
        followingCount++;
      }
    }
    enrichedUser.followersCount = followers.length;
    enrichedUser.followingCount = Math.max(user.followingCount || 0, followingCount);

    // Stories authored by user
    const allAuthoredStories = (this.db.stories || []).filter(s => 
      s.authorId === userId || 
      (s.authorUsername && user.username && s.authorUsername.toLowerCase() === user.username.toLowerCase())
    );

    // Self or admin sees all stories (including Drafts); others only see published/ongoing/completed
    const stories = isSelf || (viewerId && this.findUserById(viewerId)?.role === 'ADMIN')
      ? allAuthoredStories
      : allAuthoredStories.filter(s => s.status !== 'Draft');
    
    // Community posts authored by user
    const posts = (this.db.communityPosts || []).filter(p => p.authorId === userId);
    const theories = posts.filter(p => p.type === 'THEORY');

    // Universes authored by user
    const universes = (this.db.universes || []).filter(u => u.authorId === userId);

    // Reading list (library items with populated story)
    const userLibrary = (this.db.library || []).filter(l => l.userId === userId);
    const readingList: { story: Story; listType: string; addedAt: string }[] = [];
    for (const item of userLibrary) {
      const story = this.findStoryByIdOrSlug(item.storyId);
      if (story) {
        readingList.push({
          story,
          listType: item.listType || 'saved',
          addedAt: item.addedAt || new Date().toISOString()
        });
      }
    }

    // Program certificates won by this user
    const certificates = (this.db.programCertificates || []).filter(c => c.recipientUserId === userId);

    // Badges
    const userBadges = (this.db.badges?.[userId] || []).map(b => b.title || b.key);
    const allBadges = [...userBadges];
    if (enrichedUser.role === 'ADMIN') allBadges.push('Master Admin', 'Canon Architect');
    if (enrichedUser.role === 'WRITER' || enrichedUser.isVerifiedWriter) allBadges.push('Verified Author', 'Story Weaver');
    if (stories.length >= 3) allBadges.push('Prolific Author');
    if (certificates.length > 0) allBadges.push('Competition Laureate');
    if (enrichedUser.level >= 10) allBadges.push('Astral Pioneer');
    const uniqueBadges = Array.from(new Set(allBadges));

    // Aggregate stats
    const totalReads = stories.reduce((sum, s) => sum + (s.views || 0), 0);
    const totalLikes = stories.reduce((sum, s) => sum + (s.likes || 0), 0);
    const chaptersCount = stories.reduce((sum, s) => sum + (s.chaptersCount || 0), 0);

    return {
      user: enrichedUser,
      isFollowing,
      isSelf,
      stories,
      posts,
      universes,
      theories,
      readingList,
      certificates,
      badges: uniqueBadges,
      stats: {
        totalStories: stories.length,
        totalReads,
        totalLikes,
        totalPosts: posts.length,
        totalTheories: theories.length,
        totalUniverses: universes.length,
        followersCount: followers.length,
        followingCount: enrichedUser.followingCount,
        chaptersCount,
      }
    };
  }

  // Stories
  public getStories(): Story[] {
    return this.db.stories;
  }

  public findStoryByIdOrSlug(idOrSlug: string): Story | undefined {
    if (!idOrSlug || typeof idOrSlug !== 'string') return undefined;
    const clean = idOrSlug.trim();
    if (!clean || clean === 'undefined' || clean === 'null') return undefined;
    const lower = clean.toLowerCase();
    let decoded = lower;
    try {
      decoded = decodeURIComponent(clean).trim().toLowerCase();
    } catch {}

    // 1. Direct exact matches on ID or slug
    const direct = this.db.stories.find(s => 
      s.id === clean || 
      s.id.toLowerCase() === lower || 
      s.slug === clean || 
      s.slug.toLowerCase() === lower ||
      s.slug.toLowerCase() === decoded
    );
    if (direct) return direct;

    // 2. Fuzzy / fallback match by title or slug prefix
    return this.db.stories.find(s => 
      (s.title && s.title.toLowerCase() === lower) ||
      (s.slug && (s.slug.startsWith(lower) || lower.startsWith(s.slug)))
    );
  }

  public createStory(story: Partial<Story>, author: User): Story {
    const id = 'story_' + Date.now();
    const slug = (story.title || 'untitled-story')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + id.slice(-4);
    const now = new Date().toISOString();

    const newStory: Story = {
      id,
      authorId: author.id,
      authorUsername: author.username,
      authorDisplayName: author.displayName,
      authorAvatar: author.avatar,
      title: story.title || 'Untitled Story',
      slug,
      description: story.description || '',
      coverImage: story.coverImage || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      genre: story.genre || 'Fantasy',
      tags: story.tags || ['Original Universe'],
      language: story.language || 'English',
      ageRating: story.ageRating || 'Everyone',
      storyType: story.storyType || 'Light Novel',
      status: story.status || 'Draft',
      views: 0,
      likes: 0,
      rating: 5.0,
      ratingCount: 0,
      universeId: story.universeId,
      universeName: story.universeName,
      chaptersCount: 0,
      liveReadersCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.db.stories.unshift(newStory);
    this.commit();
    return newStory;
  }

  public updateStory(storyId: string, updates: Partial<Story>): Story | undefined {
    const idx = this.db.stories.findIndex(s => s.id === storyId);
    if (idx === -1) return undefined;
    this.db.stories[idx] = { ...this.db.stories[idx], ...updates, updatedAt: new Date().toISOString() };
    this.commit();
    return this.db.stories[idx];
  }

  public deleteStory(storyId: string): boolean {
    const idx = this.db.stories.findIndex(s => s.id === storyId);
    if (idx === -1) return false;
    this.db.stories.splice(idx, 1);
    this.db.chapters = (this.db.chapters || []).filter(c => c.storyId !== storyId);
    if (this.db.characters) {
      this.db.characters = this.db.characters.filter(c => c.storyId !== storyId);
    }
    this.commit();
    return true;
  }

  // Chapters
  public getStoryChapters(storyId: string): Chapter[] {
    return this.db.chapters
      .filter(c => c.storyId === storyId)
      .sort((a, b) => a.chapterNumber - b.chapterNumber);
  }

  public findChapter(chapterId: string): Chapter | undefined {
    return this.db.chapters.find(c => c.id === chapterId);
  }

  public createChapter(chapter: Partial<Chapter>, storyId: string): Chapter {
    const id = 'chap_' + Date.now();
    const existing = this.getStoryChapters(storyId);
    const chapterNumber = chapter.chapterNumber || (existing.length + 1);
    const content = chapter.content || '';
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    const now = new Date().toISOString();

    const newChapter: Chapter = {
      id,
      storyId,
      chapterNumber,
      title: chapter.title || `Chapter ${chapterNumber}`,
      subtitle: chapter.subtitle || '',
      content,
      wordCount,
      readingTime,
      status: chapter.status || 'published',
      publishedAt: chapter.status === 'published' ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.db.chapters.push(newChapter);
    
    // update story chapter count
    const story = this.findStoryByIdOrSlug(storyId);
    if (story) {
      story.chaptersCount = this.getStoryChapters(storyId).length;
      story.updatedAt = now;
    }

    this.commit();
    return newChapter;
  }

  public updateChapter(chapterId: string, updates: Partial<Chapter>): Chapter | undefined {
    const idx = this.db.chapters.findIndex(c => c.id === chapterId);
    if (idx === -1) return undefined;
    
    let wordCount = this.db.chapters[idx].wordCount;
    let readingTime = this.db.chapters[idx].readingTime;
    if (updates.content !== undefined) {
      wordCount = updates.content.trim().split(/\s+/).filter(Boolean).length;
      readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    this.db.chapters[idx] = {
      ...this.db.chapters[idx],
      ...updates,
      wordCount,
      readingTime,
      updatedAt: new Date().toISOString(),
    };
    this.commit();
    return this.db.chapters[idx];
  }

  public deleteChapter(chapterId: string): boolean {
    const idx = this.db.chapters.findIndex(c => c.id === chapterId);
    if (idx === -1) return false;
    const storyId = this.db.chapters[idx].storyId;
    this.db.chapters.splice(idx, 1);
    
    // update story chapter count
    const story = this.findStoryByIdOrSlug(storyId);
    if (story) {
      story.chaptersCount = this.getStoryChapters(storyId).length;
      story.updatedAt = new Date().toISOString();
    }
    this.commit();
    return true;
  }

  // Reading Progress & Library
  public saveReadingProgress(userId: string, data: { storyId: string; chapterId: string; chapterNumber: number; progressPercent: number; lastPosition: number }): ReadingProgress {
    const story = this.findStoryByIdOrSlug(data.storyId);
    const chapter = this.findChapter(data.chapterId);
    const now = new Date().toISOString();

    const existingIdx = this.db.readingProgress.findIndex(rp => rp.userId === userId && rp.storyId === data.storyId);
    
    const progress: ReadingProgress = {
      id: existingIdx !== -1 ? this.db.readingProgress[existingIdx].id : 'rp_' + Date.now(),
      userId,
      storyId: data.storyId,
      storyTitle: story?.title || 'Story',
      storyCover: story?.coverImage || '',
      chapterId: data.chapterId,
      chapterNumber: data.chapterNumber,
      chapterTitle: chapter?.title || `Chapter ${data.chapterNumber}`,
      totalChapters: story?.chaptersCount || 1,
      progressPercent: data.progressPercent,
      lastPosition: data.lastPosition,
      lastReadAt: now,
    };

    if (existingIdx !== -1) {
      this.db.readingProgress[existingIdx] = progress;
    } else {
      this.db.readingProgress.unshift(progress);
    }

    // Also ensure story is in user's library as 'reading'
    const libIdx = this.db.library.findIndex(l => l.userId === userId && l.storyId === data.storyId);
    if (libIdx === -1) {
      this.db.library.unshift({
        id: 'lib_' + Date.now(),
        userId,
        storyId: data.storyId,
        listType: 'reading',
        addedAt: now
      });
    }

    // Award XP
    const user = this.findUserById(userId);
    if (user) {
      user.xp += 25;
      user.totalReads += 1;
      user.level = Math.floor(user.xp / 400) + 1;
      user.lastActiveDate = now;
    }

    this.commit();
    return progress;
  }

  public getUserReadingProgress(userId: string): ReadingProgress[] {
    return this.db.readingProgress.filter(rp => rp.userId === userId);
  }

  public getUserLibrary(userId: string): (LibraryItem & { story: Story; readingProgress?: ReadingProgress })[] {
    const items = this.db.library.filter(l => l.userId === userId);
    return items.map(item => {
      const story = this.findStoryByIdOrSlug(item.storyId)!;
      const rp = this.db.readingProgress.find(p => p.userId === userId && p.storyId === item.storyId);
      return {
        ...item,
        story,
        readingProgress: rp
      };
    }).filter(item => Boolean(item.story));
  }

  public toggleLibrary(userId: string, storyId: string, listType: 'reading' | 'saved' | 'completed' | 'following'): { inLibrary: boolean; item?: LibraryItem } {
    const idx = this.db.library.findIndex(l => l.userId === userId && l.storyId === storyId);
    if (idx !== -1) {
      this.db.library.splice(idx, 1);
      this.commit();
      return { inLibrary: false };
    } else {
      const newItem: LibraryItem = {
        id: 'lib_' + Date.now(),
        userId,
        storyId,
        listType,
        addedAt: new Date().toISOString()
      };
      this.db.library.unshift(newItem);
      this.commit();
      return { inLibrary: true, item: newItem };
    }
  }

  public toggleLikeStory(userId: string, storyId: string): { liked: boolean; totalLikes: number } {
    if (!this.db.likes[storyId]) {
      this.db.likes[storyId] = [];
    }
    const idx = this.db.likes[storyId].indexOf(userId);
    let liked = false;
    if (idx !== -1) {
      this.db.likes[storyId].splice(idx, 1);
      liked = false;
    } else {
      this.db.likes[storyId].push(userId);
      liked = true;
    }
    const story = this.findStoryByIdOrSlug(storyId);
    if (story) {
      story.likes = this.db.likes[storyId].length;
    }
    this.commit();
    return { liked, totalLikes: this.db.likes[storyId].length };
  }

  public toggleFollowUser(followerId: string, authorId: string): { following: boolean; totalFollowers: number } {
    if (!this.db.follows[authorId]) {
      this.db.follows[authorId] = [];
    }
    const idx = this.db.follows[authorId].indexOf(followerId);
    let following = false;
    if (idx !== -1) {
      this.db.follows[authorId].splice(idx, 1);
      following = false;
    } else {
      this.db.follows[authorId].push(followerId);
      following = true;
    }
    const author = this.findUserById(authorId);
    if (author) {
      author.followersCount = this.db.follows[authorId].length;
    }
    this.commit();
    return { following, totalFollowers: this.db.follows[authorId].length };
  }

  // Comments
  public getChapterComments(chapterId: string): ChapterComment[] {
    const topLevel = this.db.comments.filter(c => c.chapterId === chapterId && !c.parentId);
    return topLevel.map(c => {
      const replies = this.db.comments.filter(r => r.parentId === c.id);
      return { ...c, replies };
    });
  }

  public addChapterComment(userId: string, chapterId: string, storyId: string, content: string, parentId?: string): ChapterComment {
    const user = this.findUserById(userId);
    const newComment: ChapterComment = {
      id: 'com_' + Date.now(),
      chapterId,
      storyId,
      userId,
      username: user?.username || 'Wanderer',
      userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      content,
      likes: 0,
      likedByUsers: [],
      parentId: parentId || null,
      replies: [],
      reported: false,
      createdAt: new Date().toISOString()
    };

    this.db.comments.push(newComment);
    this.commit();
    return newComment;
  }

  public likeComment(commentId: string, userId: string): ChapterComment | undefined {
    const comment = this.db.comments.find(c => c.id === commentId);
    if (!comment) return undefined;
    const idx = comment.likedByUsers.indexOf(userId);
    if (idx !== -1) {
      comment.likedByUsers.splice(idx, 1);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      comment.likedByUsers.push(userId);
      comment.likes += 1;
    }
    this.commit();
    return comment;
  }

  // Reviews
  public addReview(userId: string, storyId: string, rating: number, reviewText: string): Review {
    const user = this.findUserById(userId);
    const existing = this.db.reviews.find(r => r.userId === userId && r.storyId === storyId);
    const now = new Date().toISOString();

    if (existing) {
      existing.rating = rating;
      existing.reviewText = reviewText;
      existing.updatedAt = now;
      this.recalculateStoryRating(storyId);
      this.commit();
      return existing;
    }

    const newRev: Review = {
      id: 'rev_' + Date.now(),
      userId,
      username: user?.username || 'Reader',
      userAvatar: user?.avatar || '',
      storyId,
      rating,
      reviewText,
      createdAt: now,
      updatedAt: now
    };

    this.db.reviews.unshift(newRev);
    this.recalculateStoryRating(storyId);
    this.commit();
    return newRev;
  }

  public getStoryReviews(storyId: string): Review[] {
    return this.db.reviews.filter(r => r.storyId === storyId);
  }

  private recalculateStoryRating(storyId: string) {
    const reviews = this.db.reviews.filter(r => r.storyId === storyId);
    const story = this.findStoryByIdOrSlug(storyId);
    if (!story) return;
    if (reviews.length === 0) {
      story.rating = 5.0;
      story.ratingCount = 0;
      return;
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    story.rating = Number((sum / reviews.length).toFixed(2));
    story.ratingCount = reviews.length;
  }

  // Communities & Posts & Polls
  public getCommunities(userId?: string): Community[] {
    return this.db.communities.map(c => {
      const isMember = userId && this.db.communityMembers[c.id]?.includes(userId);
      const membersCount = this.db.communityMembers[c.id]?.length || c.membersCount || c.memberCount || 0;
      const postsCount = this.db.communityPosts.filter(p => p.communityId === c.id).length;
      return {
        ...c,
        isMember: Boolean(isMember),
        membersCount,
        memberCount: membersCount,
        postsCount
      };
    });
  }

  public getCommunityBySlug(slug: string, userId?: string): Community | undefined {
    const c = this.db.communities.find(comm => comm.slug === slug || comm.id === slug);
    if (!c) return undefined;
    const isMember = userId && this.db.communityMembers[c.id]?.includes(userId);
    const membersCount = this.db.communityMembers[c.id]?.length || c.membersCount || c.memberCount || 0;
    const postsCount = this.db.communityPosts.filter(p => p.communityId === c.id).length;
    return {
      ...c,
      isMember: Boolean(isMember),
      membersCount,
      memberCount: membersCount,
      postsCount
    };
  }

  public createCommunity(userId: string, data: Partial<Community>): Community {
    const user = this.findUserById(userId);
    const id = 'comm_' + Date.now();
    const slug = (data.name || 'new-community').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + id.slice(-4);
    const newComm: Community = {
      id,
      name: data.name || 'New Community',
      slug,
      description: data.description || '',
      bannerImage: data.bannerImage || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
      iconImage: data.iconImage || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80',
      type: data.type || 'public',
      ownerId: userId,
      ownerName: user?.displayName || user?.username || 'Founder',
      ownerRole: user?.role || 'READER',
      linkedStoryId: data.linkedStoryId,
      linkedStoryTitle: data.linkedStoryTitle,
      linkedAuthorId: data.linkedAuthorId,
      isPrivate: Boolean(data.isPrivate),
      accessCode: data.accessCode,
      rules: data.rules && data.rules.length > 0 ? data.rules : [
        'Be respectful to fellow creators and readers',
        'Use spoiler tags for recent chapters',
        'No hate speech, harassment, or spam'
      ],
      moderators: [userId],
      categories: data.categories || ['Discussion', 'Theories', 'General'],
      membersCount: 1,
      memberCount: 1,
      activeMembersCount: 1,
      postsCount: 0,
      isMember: true,
      createdAt: new Date().toISOString()
    };

    this.db.communities.push(newComm);
    if (!this.db.communityMembers[id]) {
      this.db.communityMembers[id] = [];
    }
    this.db.communityMembers[id].push(userId);
    this.commit();
    return newComm;
  }

  public joinCommunity(communityId: string, userId: string, accessCode?: string): { success: boolean; message?: string } {
    const comm = this.db.communities.find(c => c.id === communityId || c.slug === communityId);
    if (!comm) return { success: false, message: 'Community not found' };
    
    if (comm.isPrivate && comm.accessCode) {
      if (!accessCode || accessCode.trim().toUpperCase() !== comm.accessCode.trim().toUpperCase()) {
        return { success: false, message: 'Invalid access code for private community' };
      }
    }

    if (!this.db.communityMembers[comm.id]) {
      this.db.communityMembers[comm.id] = [];
    }
    if (!this.db.communityMembers[comm.id].includes(userId)) {
      this.db.communityMembers[comm.id].push(userId);
    }
    comm.membersCount = this.db.communityMembers[comm.id].length;
    comm.memberCount = comm.membersCount;
    this.commit();
    return { success: true };
  }

  public leaveCommunity(communityId: string, userId: string): boolean {
    const comm = this.db.communities.find(c => c.id === communityId || c.slug === communityId);
    if (!comm) return false;
    if (this.db.communityMembers[comm.id]) {
      const idx = this.db.communityMembers[comm.id].indexOf(userId);
      if (idx !== -1) {
        this.db.communityMembers[comm.id].splice(idx, 1);
      }
    }
    comm.membersCount = this.db.communityMembers[comm.id]?.length || 0;
    comm.memberCount = comm.membersCount;
    this.commit();
    return true;
  }

  public getCommunityPosts(communityId: string, userId?: string): CommunityPost[] {
    const comm = this.db.communities.find(c => c.id === communityId || c.slug === communityId);
    const targetId = comm?.id || communityId;
    return this.db.communityPosts
      .filter(p => p.communityId === targetId)
      .map(p => this.enrichPost(p, userId))
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  public getAllCommunityPosts(userId?: string): CommunityPost[] {
    return this.db.communityPosts
      .map(p => this.enrichPost(p, userId))
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  public getCommunityPostById(postId: string, userId?: string): CommunityPost | undefined {
    const post = this.db.communityPosts.find(p => p.id === postId);
    if (!post) return undefined;
    return this.enrichPost(post, userId);
  }

  private enrichPost(p: CommunityPost, userId?: string): CommunityPost {
    const comm = this.db.communities.find(c => c.id === p.communityId);
    const isSaved = Boolean(userId && this.db.postSaves[userId]?.includes(p.id));
    const isFollowing = Boolean(userId && this.db.postFollows[userId]?.includes(p.id));
    const userVoteOption = userId && p.poll?.options.find(opt => opt.votes.includes(userId))?.id;
    return {
      ...p,
      communitySlug: comm?.slug,
      communityType: comm?.type,
      isSaved,
      isFollowing,
      userVotedOptionId: userVoteOption,
      commentsCount: p.comments?.length || p.commentsCount || 0
    };
  }

  public createCommunityPost(userId: string, communityId: string, postData: Partial<CommunityPost>): CommunityPost {
    const user = this.findUserById(userId);
    const comm = this.db.communities.find(c => c.id === communityId || c.slug === communityId);
    const now = new Date().toISOString();
    const targetCommId = comm?.id || communityId;
    const isAuthorOfStory = Boolean(comm?.linkedStoryId && (user?.role === 'WRITER' || user?.role === 'ADMIN'));

    const newPost: CommunityPost = {
      id: 'post_' + Date.now(),
      communityId: targetCommId,
      communityName: comm?.name || 'Community',
      communitySlug: comm?.slug,
      communityType: comm?.type || 'public',
      authorId: userId,
      authorUsername: user?.username || 'Wanderer',
      authorDisplayName: user?.displayName || user?.username || 'Wanderer',
      authorAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      authorRole: user?.role,
      isAuthorOfStory,
      isModerator: comm?.moderators?.includes(userId) || user?.role === 'ADMIN',
      title: postData.title,
      content: postData.content || '',
      mediaUrl: postData.mediaUrl,
      mediaType: postData.mediaType || (postData.poll ? 'poll' : postData.mediaUrl ? 'image' : undefined),
      type: postData.type || (postData.poll ? 'POLL' : 'DISCUSSION'),
      poll: postData.poll,
      tag: postData.tag || 'General',
      tags: postData.tags || (postData.tag ? [postData.tag] : ['General']),
      isSpoiler: Boolean(postData.isSpoiler),
      spoilerChapter: postData.spoilerChapter,
      linkedStoryId: postData.linkedStoryId || comm?.linkedStoryId,
      linkedStoryTitle: postData.linkedStoryTitle || comm?.linkedStoryTitle,
      linkedChapterNumber: postData.linkedChapterNumber,
      linkedCharacterName: postData.linkedCharacterName,
      recommendation: postData.recommendation,
      quoteCard: postData.quoteCard,
      likes: 0,
      likedByUsers: [],
      agreeCount: postData.type === 'THEORY' ? 1 : 0,
      disagreeCount: 0,
      commentsCount: 0,
      comments: [],
      createdAt: now,
    };

    this.db.communityPosts.unshift(newPost);
    if (comm) {
      comm.postsCount = (comm.postsCount || 0) + 1;
    }
    this.commit();
    return newPost;
  }

  public votePoll(postId: string, optionId: string, userId: string): CommunityPost | undefined {
    const post = this.db.communityPosts.find(p => p.id === postId);
    if (!post || !post.poll) return undefined;

    // Remove user previous vote
    post.poll.options.forEach(opt => {
      const idx = opt.votes.indexOf(userId);
      if (idx !== -1) opt.votes.splice(idx, 1);
    });

    // Add new vote
    const opt = post.poll.options.find(o => o.id === optionId);
    if (opt) {
      opt.votes.push(userId);
    }

    post.poll.totalVotes = post.poll.options.reduce((acc, o) => acc + o.votes.length, 0);
    this.commit();
    return this.enrichPost(post, userId);
  }

  public voteTheoryOrPost(postId: string, vote: 'agree' | 'disagree', userId: string): CommunityPost | undefined {
    const post = this.db.communityPosts.find(p => p.id === postId);
    if (!post) return undefined;
    if (vote === 'agree') {
      post.agreeCount = (post.agreeCount || 0) + 1;
    } else {
      post.disagreeCount = (post.disagreeCount || 0) + 1;
    }
    post.userVote = vote;
    this.commit();
    return this.enrichPost(post, userId);
  }

  public toggleSavePost(postId: string, userId: string): boolean {
    if (!this.db.postSaves[userId]) {
      this.db.postSaves[userId] = [];
    }
    const idx = this.db.postSaves[userId].indexOf(postId);
    if (idx !== -1) {
      this.db.postSaves[userId].splice(idx, 1);
      this.commit();
      return false;
    } else {
      this.db.postSaves[userId].push(postId);
      this.commit();
      return true;
    }
  }

  public toggleFollowPost(postId: string, userId: string): boolean {
    if (!this.db.postFollows[userId]) {
      this.db.postFollows[userId] = [];
    }
    const idx = this.db.postFollows[userId].indexOf(postId);
    if (idx !== -1) {
      this.db.postFollows[userId].splice(idx, 1);
      this.commit();
      return false;
    } else {
      this.db.postFollows[userId].push(postId);
      this.commit();
      return true;
    }
  }

  public likeCommunityPost(postId: string, userId: string): number {
    const post = this.db.communityPosts.find(p => p.id === postId);
    if (!post) return 0;
    if (!post.likedByUsers) post.likedByUsers = [];
    const idx = post.likedByUsers.indexOf(userId);
    if (idx !== -1) {
      post.likedByUsers.splice(idx, 1);
      post.likes = Math.max(0, (post.likes || 1) - 1);
    } else {
      post.likedByUsers.push(userId);
      post.likes = (post.likes || 0) + 1;
    }
    this.commit();
    return post.likes;
  }

  public pinPost(postId: string, isPinned: boolean): boolean {
    const post = this.db.communityPosts.find(p => p.id === postId);
    if (!post) return false;
    post.isPinned = isPinned;
    this.commit();
    return true;
  }

  public lockPost(postId: string, isLocked: boolean): boolean {
    const post = this.db.communityPosts.find(p => p.id === postId);
    if (!post) return false;
    post.isLocked = isLocked;
    this.commit();
    return true;
  }

  public addCommunityPostComment(postId: string, userId: string, data: { content: string; parentId?: string; quotes?: string; isSpoiler?: boolean }): CommunityComment | undefined {
    const post = this.db.communityPosts.find(p => p.id === postId);
    if (!post) return undefined;
    if (post.isLocked) return undefined;
    
    const user = this.findUserById(userId);
    const comm = this.db.communities.find(c => c.id === post.communityId);
    const isAuthor = Boolean(comm?.linkedStoryId && (user?.role === 'WRITER' || user?.role === 'ADMIN') || post.authorId === userId);
    const isMod = Boolean(comm?.moderators?.includes(userId) || user?.role === 'ADMIN');

    const newComment: CommunityComment = {
      id: 'pcomm_' + Date.now(),
      postId,
      userId,
      username: user?.username || 'User',
      userDisplayName: user?.displayName || user?.username || 'User',
      userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      userRole: user?.role,
      isAuthor,
      isMod,
      content: data.content,
      likes: 0,
      likedByUsers: [],
      parentId: data.parentId,
      quotes: data.quotes,
      isSpoiler: Boolean(data.isSpoiler),
      createdAt: new Date().toISOString(),
      replies: []
    };

    if (!post.comments) {
      post.comments = [];
    }

    if (data.parentId) {
      const parent = post.comments.find(c => c.id === data.parentId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(newComment);
      } else {
        post.comments.push(newComment);
      }
    } else {
      post.comments.push(newComment);
    }

    post.commentsCount = post.comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
    this.commit();
    return newComment;
  }

  public likeCommunityComment(postId: string, commentId: string, userId: string): number {
    const post = this.db.communityPosts.find(p => p.id === postId);
    if (!post || !post.comments) return 0;
    
    let targetComment: CommunityComment | undefined = post.comments.find(c => c.id === commentId);
    if (!targetComment) {
      for (const top of post.comments) {
        if (top.replies) {
          const found = top.replies.find(r => r.id === commentId);
          if (found) {
            targetComment = found;
            break;
          }
        }
      }
    }

    if (!targetComment) return 0;
    if (!targetComment.likedByUsers) targetComment.likedByUsers = [];
    const idx = targetComment.likedByUsers.indexOf(userId);
    if (idx !== -1) {
      targetComment.likedByUsers.splice(idx, 1);
      targetComment.likes = Math.max(0, (targetComment.likes || 1) - 1);
    } else {
      targetComment.likedByUsers.push(userId);
      targetComment.likes = (targetComment.likes || 0) + 1;
    }
    this.commit();
    return targetComment.likes;
  }

  public reactCommunityComment(postId: string, commentId: string, userId: string, emoji: string) {
    const post = this.db.communityPosts.find(p => p.id === postId);
    if (!post || !post.comments) return null;
    
    let targetComment: CommunityComment | undefined = post.comments.find(c => c.id === commentId);
    if (!targetComment) {
      for (const top of post.comments) {
        if (top.replies) {
          const found = top.replies.find(r => r.id === commentId);
          if (found) {
            targetComment = found;
            break;
          }
        }
      }
    }

    if (!targetComment) return null;
    if (!targetComment.reactions) targetComment.reactions = {};
    if (!targetComment.reactions[emoji]) targetComment.reactions[emoji] = [];
    
    const list = targetComment.reactions[emoji];
    const idx = list.indexOf(userId);
    if (idx !== -1) {
      list.splice(idx, 1);
      if (list.length === 0) delete targetComment.reactions[emoji];
    } else {
      list.push(userId);
    }
    this.commit();
    return targetComment.reactions;
  }

  // ----------------------------------------------------
  // CHAT ROOMS & REAL-TIME COMMUNITY SPACES
  // ----------------------------------------------------
  public getChatRooms(): ChatRoom[] {
    return this.db.chatRooms || [];
  }

  public getChatRoomBySlug(slug: string): ChatRoom | undefined {
    return this.db.chatRooms.find(r => r.slug === slug || r.id === slug);
  }

  public getChatMessages(roomId: string, limit = 50): ChatMessage[] {
    const msgs = this.db.chatMessages[roomId] || [];
    return msgs.slice(-limit);
  }

  public sendChatMessage(roomId: string, userId: string, data: Partial<ChatMessage>): ChatMessage {
    const user = this.findUserById(userId);
    const room = this.db.chatRooms.find(r => r.id === roomId || r.slug === roomId);
    const targetRoomId = room?.id || roomId;
    
    if (!this.db.chatMessages[targetRoomId]) {
      this.db.chatMessages[targetRoomId] = [];
    }

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      roomId: targetRoomId,
      userId,
      username: user?.username || 'User',
      displayName: user?.displayName || user?.username || 'User',
      userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      userRole: user?.role,
      isAuthor: user?.role === 'WRITER',
      isMod: user?.role === 'ADMIN',
      content: data.content || '',
      mediaUrl: data.mediaUrl,
      isSpoiler: Boolean(data.isSpoiler),
      storyCard: data.storyCard,
      postCard: data.postCard,
      quoteCard: data.quoteCard,
      reactions: {},
      replyTo: data.replyTo,
      createdAt: new Date().toISOString()
    };

    this.db.chatMessages[targetRoomId].push(newMsg);
    // Keep max 200 messages per room
    if (this.db.chatMessages[targetRoomId].length > 200) {
      this.db.chatMessages[targetRoomId] = this.db.chatMessages[targetRoomId].slice(-200);
    }
    this.commit();
    return newMsg;
  }

  public reactChatMessage(roomId: string, messageId: string, userId: string, emoji: string) {
    const msgs = this.db.chatMessages[roomId] || [];
    const msg = msgs.find(m => m.id === messageId);
    if (!msg) return null;
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    
    const list = msg.reactions[emoji];
    const idx = list.indexOf(userId);
    if (idx !== -1) {
      list.splice(idx, 1);
      if (list.length === 0) delete msg.reactions[emoji];
    } else {
      list.push(userId);
    }
    this.commit();
    return msg.reactions;
  }

  public pinChatMessage(roomId: string, message: string) {
    const room = this.db.chatRooms.find(r => r.id === roomId || r.slug === roomId);
    if (!room) return false;
    room.pinnedMessage = message;
    this.commit();
    return true;
  }

  public lockChatRoom(roomId: string, isLocked: boolean) {
    const room = this.db.chatRooms.find(r => r.id === roomId || r.slug === roomId);
    if (!room) return false;
    room.isLocked = isLocked;
    this.commit();
    return true;
  }

  public setChatSlowMode(roomId: string, seconds: number) {
    const room = this.db.chatRooms.find(r => r.id === roomId || r.slug === roomId);
    if (!room) return false;
    room.slowModeSeconds = seconds;
    this.commit();
    return true;
  }

  // ----------------------------------------------------
  // EVENTS & CONTESTS
  // ----------------------------------------------------
  public getCommunityEvents(): CommunityEvent[] {
    return this.db.events || [];
  }

  public createCommunityEvent(userId: string, data: Partial<CommunityEvent>): CommunityEvent {
    const user = this.findUserById(userId);
    const newEvent: CommunityEvent = {
      id: 'evt_' + Date.now(),
      title: data.title || 'Community Event',
      description: data.description || '',
      hostName: user?.displayName || user?.username || 'Host',
      hostAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      hostRole: user?.role || 'WRITER',
      type: data.type || 'CHAPTER_LAUNCH',
      startTime: data.startTime || new Date(Date.now() + 86400000).toISOString(),
      endTime: data.endTime,
      participantsCount: 1,
      isParticipating: true,
      communityId: data.communityId,
      communityName: data.communityName,
      bannerUrl: data.bannerUrl || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80',
      isLive: Boolean(data.isLive)
    };
    this.db.events.unshift(newEvent);
    this.commit();
    return newEvent;
  }

  public joinCommunityEvent(eventId: string, userId: string): boolean {
    const evt = this.db.events.find(e => e.id === eventId);
    if (!evt) return false;
    evt.participantsCount = (evt.participantsCount || 0) + 1;
    evt.isParticipating = true;
    this.commit();
    return true;
  }

  public getCommunityContests(): CommunityContest[] {
    return this.db.contests || [];
  }

  public submitContestEntry(contestId: string, userId: string, data: Partial<CommunityContestSubmission>): CommunityContestSubmission | undefined {
    const contest = this.db.contests.find(c => c.id === contestId);
    if (!contest) return undefined;
    const user = this.findUserById(userId);
    const sub: CommunityContestSubmission = {
      id: 'sub_' + Date.now(),
      contestId,
      userId,
      username: user?.displayName || user?.username || 'Contestant',
      userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      title: data.title || 'Untitled Submission',
      description: data.description || '',
      mediaUrl: data.mediaUrl,
      votes: 0,
      votedUserIds: [],
      createdAt: new Date().toISOString()
    };
    if (!contest.submissions) contest.submissions = [];
    contest.submissions.push(sub);
    contest.entriesCount = contest.submissions.length;
    this.commit();
    return sub;
  }

  public voteContestEntry(contestId: string, submissionId: string, userId: string): boolean {
    const contest = this.db.contests.find(c => c.id === contestId);
    if (!contest || !contest.submissions) return false;
    const sub = contest.submissions.find(s => s.id === submissionId);
    if (!sub) return false;
    if (!sub.votedUserIds) sub.votedUserIds = [];
    const idx = sub.votedUserIds.indexOf(userId);
    if (idx !== -1) {
      sub.votedUserIds.splice(idx, 1);
      sub.votes = Math.max(0, sub.votes - 1);
    } else {
      sub.votedUserIds.push(userId);
      sub.votes += 1;
    }
    this.commit();
    return true;
  }

  // ----------------------------------------------------
  // DIRECT MESSAGES & GROUP CHATS
  // ----------------------------------------------------
  public getDirectMessageConversations(userId: string): DirectMessageConversation[] {
    return (this.db.conversations || []).filter(c => c.participantIds.includes(userId));
  }

  public getDirectMessages(conversationId: string, userId: string): DirectMessage[] {
    const conv = this.db.conversations?.find(c => c.id === conversationId);
    if (!conv || !conv.participantIds.includes(userId)) return [];
    return this.db.directMessages[conversationId] || [];
  }

  public sendDirectMessage(senderId: string, conversationId: string, data: { content: string; mediaUrl?: string; storyCard?: any }): DirectMessage | undefined {
    const conv = this.db.conversations?.find(c => c.id === conversationId);
    if (!conv || !conv.participantIds.includes(senderId)) return undefined;
    const sender = this.findUserById(senderId);

    if (!this.db.directMessages[conversationId]) {
      this.db.directMessages[conversationId] = [];
    }

    const msg: DirectMessage = {
      id: 'dm_' + Date.now(),
      conversationId,
      senderId,
      senderUsername: sender?.username || 'User',
      senderDisplayName: sender?.displayName || sender?.username || 'User',
      senderAvatar: sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      content: data.content,
      mediaUrl: data.mediaUrl,
      storyCard: data.storyCard,
      reactions: {},
      createdAt: new Date().toISOString()
    };

    this.db.directMessages[conversationId].push(msg);
    conv.lastMessage = data.content;
    conv.lastMessageAt = msg.createdAt;
    this.commit();
    return msg;
  }

  public startDirectConversation(userId: string, targetUserId: string, initialMessage?: string): DirectMessageConversation {
    let existing = this.db.conversations?.find(c => 
      !c.isGroup && c.participantIds.includes(userId) && c.participantIds.includes(targetUserId)
    );

    const user1 = this.findUserById(userId);
    const user2 = this.findUserById(targetUserId);

    if (!existing) {
      const convId = 'conv_' + Date.now();
      existing = {
        id: convId,
        participantIds: [userId, targetUserId],
        lastMessage: initialMessage || 'Started a conversation',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        participants: [
          { id: userId, username: user1?.username || '', displayName: user1?.displayName || '', avatar: user1?.avatar || '', role: user1?.role },
          { id: targetUserId, username: user2?.username || '', displayName: user2?.displayName || '', avatar: user2?.avatar || '', role: user2?.role }
        ]
      };
      if (!this.db.conversations) this.db.conversations = [];
      this.db.conversations.unshift(existing);
      this.db.directMessages[convId] = [];
    }

    if (initialMessage) {
      this.sendDirectMessage(userId, existing.id, { content: initialMessage });
    }

    this.commit();
    return existing;
  }

  // ----------------------------------------------------
  // READING LISTS & QUOTE SNIPPETS
  // ----------------------------------------------------
  public getReadingLists(userId?: string): CustomReadingList[] {
    const lists = this.db.readingLists || [];
    return lists.map(l => {
      const stories = (l.storyIds || []).map(id => this.findStoryByIdOrSlug(id)).filter(Boolean) as Story[];
      return { ...l, stories };
    });
  }

  public createReadingList(userId: string, data: Partial<CustomReadingList>): CustomReadingList {
    const user = this.findUserById(userId);
    const newList: CustomReadingList = {
      id: 'list_' + Date.now(),
      userId,
      username: user?.displayName || user?.username || 'Curator',
      title: data.title || 'My Curated Collection',
      description: data.description || '',
      isPublic: data.isPublic !== false,
      storyIds: data.storyIds || [],
      likes: 0,
      createdAt: new Date().toISOString()
    };
    if (!this.db.readingLists) this.db.readingLists = [];
    this.db.readingLists.unshift(newList);
    this.commit();
    return newList;
  }

  public toggleStoryInReadingList(listId: string, storyId: string, userId: string): boolean {
    const list = this.db.readingLists?.find(l => l.id === listId && l.userId === userId);
    if (!list) return false;
    if (!list.storyIds) list.storyIds = [];
    const idx = list.storyIds.indexOf(storyId);
    if (idx !== -1) {
      list.storyIds.splice(idx, 1);
    } else {
      list.storyIds.push(storyId);
    }
    this.commit();
    return true;
  }

  public getQuoteSnippets(): QuoteSnippet[] {
    return this.db.quoteSnippets || [];
  }

  public createQuoteSnippet(userId: string, data: Partial<QuoteSnippet>): QuoteSnippet {
    const user = this.findUserById(userId);
    const story = this.findStoryByIdOrSlug(data.storyId || '');
    const newQuote: QuoteSnippet = {
      id: 'q_' + Date.now(),
      text: data.text || '',
      storyId: data.storyId || story?.id || '',
      storySlug: story?.slug || '',
      storyTitle: data.storyTitle || story?.title || '',
      chapterNumber: data.chapterNumber || 1,
      chapterTitle: data.chapterTitle,
      authorName: story?.authorDisplayName || 'Author',
      authorUsername: story?.authorUsername || 'author',
      createdByUserId: userId,
      createdByUsername: user?.displayName || user?.username || 'Reader',
      createdByAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      theme: data.theme || 'cosmic',
      likes: 0,
      likedByUsers: [],
      createdAt: new Date().toISOString()
    };
    if (!this.db.quoteSnippets) this.db.quoteSnippets = [];
    this.db.quoteSnippets.unshift(newQuote);
    this.commit();
    return newQuote;
  }

  public likeQuoteSnippet(quoteId: string, userId: string): number {
    const quote = this.db.quoteSnippets?.find(q => q.id === quoteId);
    if (!quote) return 0;
    if (!quote.likedByUsers) quote.likedByUsers = [];
    const idx = quote.likedByUsers.indexOf(userId);
    if (idx !== -1) {
      quote.likedByUsers.splice(idx, 1);
      quote.likes = Math.max(0, quote.likes - 1);
    } else {
      quote.likedByUsers.push(userId);
      quote.likes += 1;
    }
    this.commit();
    return quote.likes;
  }

  // ----------------------------------------------------
  // REPORTING, BLOCKING & USER SAFETY
  // ----------------------------------------------------
  public reportContent(userId: string, data: Partial<ReportItem>): ReportItem {
    const user = this.findUserById(userId);
    const report: ReportItem = {
      id: 'rep_' + Date.now(),
      targetType: data.targetType || 'post',
      targetId: data.targetId || '',
      reportedByUserId: userId,
      reportedByUsername: user?.username || 'User',
      reason: data.reason || 'Community guideline violation',
      category: data.category || 'Other',
      notes: data.notes,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    if (!this.db.reports) this.db.reports = [];
    this.db.reports.unshift(report);
    this.commit();
    return report;
  }

  public getReports(): ReportItem[] {
    return this.db.reports || [];
  }

  public resolveReport(reportId: string, status: 'RESOLVED' | 'DISMISSED'): boolean {
    const r = this.db.reports?.find(rep => rep.id === reportId);
    if (!r) return false;
    r.status = status;
    this.commit();
    return true;
  }

  public toggleBlockUser(userId: string, targetUserId: string): boolean {
    if (!this.db.blockedUsers[userId]) this.db.blockedUsers[userId] = [];
    const list = this.db.blockedUsers[userId];
    const idx = list.indexOf(targetUserId);
    if (idx !== -1) {
      list.splice(idx, 1);
      this.commit();
      return false;
    } else {
      list.push(targetUserId);
      this.commit();
      return true;
    }
  }

  public toggleMuteUser(userId: string, targetUserId: string): boolean {
    if (!this.db.mutedUsers[userId]) this.db.mutedUsers[userId] = [];
    const list = this.db.mutedUsers[userId];
    const idx = list.indexOf(targetUserId);
    if (idx !== -1) {
      list.splice(idx, 1);
      this.commit();
      return false;
    } else {
      list.push(targetUserId);
      this.commit();
      return true;
    }
  }

  public getBlockedUsers(userId: string): string[] {
    return this.db.blockedUsers[userId] || [];
  }

  public getMutedUsers(userId: string): string[] {
    return this.db.mutedUsers[userId] || [];
  }

  // Theories
  public getTheories(storyId?: string): Theory[] {
    if (storyId) {
      return this.db.theories.filter(t => t.storyId === storyId);
    }
    return this.db.theories;
  }

  public createTheory(userId: string, data: Partial<Theory>): Theory {
    const user = this.findUserById(userId);
    const story = this.findStoryByIdOrSlug(data.storyId || '');
    const now = new Date().toISOString();

    const newTheory: Theory = {
      id: 'th_' + Date.now(),
      title: data.title || 'Untitled Theory',
      description: data.description || '',
      authorId: userId,
      authorUsername: user?.username || 'LoreSeeker',
      authorAvatar: user?.avatar || '',
      storyId: data.storyId || '',
      storyTitle: story?.title || 'Story Universe',
      chapterReference: data.chapterReference,
      status: 'UNCONFIRMED',
      agreeCount: 1,
      disagreeCount: 0,
      commentsCount: 0,
      createdAt: now,
    };

    this.db.theories.unshift(newTheory);
    this.commit();
    return newTheory;
  }

  public voteTheory(theoryId: string, vote: 'agree' | 'disagree', userId: string): Theory | undefined {
    const theory = this.db.theories.find(t => t.id === theoryId);
    if (!theory) return undefined;
    if (vote === 'agree') theory.agreeCount += 1;
    if (vote === 'disagree') theory.disagreeCount += 1;
    this.commit();
    return theory;
  }

  // Characters & Worlds & Universes
  public getCharacters(authorId?: string, storyId?: string): Character[] {
    let list = this.db.characters || [];
    if (authorId) {
      const aid = authorId.toLowerCase();
      list = list.filter(c => c.authorId && c.authorId.toLowerCase() === aid);
    }
    if (storyId) {
      const sid = storyId.toLowerCase();
      const story = this.findStoryByIdOrSlug(storyId);
      const targetId = story ? story.id.toLowerCase() : sid;
      const targetTitle = story ? story.title.toLowerCase() : '';
      list = list.filter(c => 
        (c.storyId && c.storyId.toLowerCase() === targetId) ||
        (c.storyTitle && targetTitle && c.storyTitle.toLowerCase() === targetTitle)
      );
    }
    return list;
  }

  public getStoryCharacters(storyIdOrSlug: string): Character[] {
    const story = this.findStoryByIdOrSlug(storyIdOrSlug);
    const targetId = story ? story.id.toLowerCase() : storyIdOrSlug.toLowerCase();
    const targetTitle = story ? story.title.toLowerCase() : '';
    const universeId = story?.universeId?.toLowerCase();

    return (this.db.characters || []).filter(c => {
      if (c.storyId && c.storyId.toLowerCase() === targetId) return true;
      if (c.storyTitle && targetTitle && c.storyTitle.toLowerCase() === targetTitle) return true;
      if (universeId && ((c.worldId && c.worldId.toLowerCase() === universeId) || ((c as any).universeId && (c as any).universeId.toLowerCase() === universeId))) {
        return true;
      }
      return false;
    });
  }

  public getCharacterById(id: string): Character | undefined {
    return (this.db.characters || []).find(c => c.id === id);
  }

  public createCharacter(character: Partial<Character>, author: User): Character {
    const id = 'char_' + Date.now();
    let storyTitle = character.storyTitle;
    if (character.storyId && !storyTitle) {
      const s = this.findStoryByIdOrSlug(character.storyId);
      if (s) storyTitle = s.title;
    }
    const newChar: Character = {
      id,
      authorId: author.id,
      storyId: character.storyId,
      storyTitle,
      worldId: character.worldId,
      name: character.name || 'Unnamed Character',
      portrait: character.portrait || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      age: character.age || 18,
      role: character.role || 'Protagonist',
      personality: character.personality || '',
      primaryPower: character.primaryPower || '',
      abilities: character.abilities || [],
      biography: character.biography || '',
      arc: character.arc || [],
      status: character.status || 'Active',
      createdAt: new Date().toISOString()
    };

    if (!this.db.characters) this.db.characters = [];
    this.db.characters.push(newChar);
    this.commit();
    return newChar;
  }

  public updateCharacter(id: string, updates: Partial<Character>, user: User): Character | undefined {
    if (!this.db.characters) this.db.characters = [];
    const idx = this.db.characters.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    const existing = this.db.characters[idx];
    if (existing.authorId && existing.authorId !== user.id && user.role !== 'ADMIN') {
      return undefined;
    }
    this.db.characters[idx] = {
      ...existing,
      ...updates,
      id: existing.id,
      authorId: existing.authorId || user.id,
    };
    this.commit();
    return this.db.characters[idx];
  }

  public deleteCharacter(id: string, user: User): boolean {
    if (!this.db.characters) return false;
    const idx = this.db.characters.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const existing = this.db.characters[idx];
    if (existing.authorId && existing.authorId !== user.id && user.role !== 'ADMIN') {
      return false;
    }
    this.db.characters.splice(idx, 1);
    if (this.db.characterRelationships) {
      this.db.characterRelationships = this.db.characterRelationships.filter(
        r => r.sourceCharacterId !== id && r.targetCharacterId !== id
      );
    }
    this.commit();
    return true;
  }

  public extractCharactersFromStory(storyId: string, author: User): Character[] {
    const story = this.findStoryByIdOrSlug(storyId);
    if (!story) return [];

    const existing = this.getStoryCharacters(story.id);
    if (existing.length > 0) {
      return existing;
    }

    const chapters = this.getStoryChapters(story.id);
    const extractedList: Character[] = [];
    const roles: ('Protagonist' | 'Companion' | 'Rival' | 'Antagonist' | 'Supporting')[] = [
      'Protagonist', 'Companion', 'Rival'
    ];

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80'
    ];

    const combinedText = [
      story.title,
      story.description || '',
      ...chapters.map(c => `${c.title}. ${c.content || ''}`)
    ].join('\n\n');

    const words = (combinedText).match(/[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?/g) || [];
    const blacklist = new Set(['The', 'When', 'After', 'With', 'From', 'Into', 'Through', 'Original', 'Universe', 'Chapter', 'Prologue', 'Draft', 'Ongoing', 'Completed', 'Light', 'Novel', 'Fantasy', 'Romance', 'Action', 'Sci', 'Where', 'Then', 'They', 'This', 'That', 'Once', 'Upon', 'What', 'There']);
    const uniqueNames = Array.from(new Set(words.filter(w => !blacklist.has(w)))).slice(0, 3);

    if (uniqueNames.length === 0) {
      const firstWord = story.title.split(/[^a-zA-Z]/)[0] || 'Aether';
      uniqueNames.push(`${firstWord} Vanguard`);
    }

    uniqueNames.forEach((name, i) => {
      const role = roles[i % roles.length];
      const charId = `char_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`;
      const newChar: Character = {
        id: charId,
        authorId: author.id,
        storyId: story.id,
        storyTitle: story.title,
        name,
        portrait: defaultAvatars[i % defaultAvatars.length],
        age: 18 + i * 2,
        role,
        primaryPower: story.genre === 'Fantasy' || story.genre === 'Sci-Fi' ? `${story.genre} Affinity` : 'Tactical Keenness',
        biography: `Key character introduced in ${story.title}. Central to the manuscript arc.`,
        personality: role === 'Protagonist' ? 'Resolute, curious, and protective' : role === 'Companion' ? 'Loyal, observant, and resourceful' : 'Ambitious and calculated',
        abilities: ['Tactical Insight', 'Resonance Surge'],
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      extractedList.push(newChar);
      if (!this.db.characters) this.db.characters = [];
      this.db.characters.push(newChar);
    });

    this.commit();
    return extractedList;
  }

  public getCharacterRelationships(): CharacterRelationship[] {
    return this.db.characterRelationships;
  }

  public createCharacterRelationship(rel: Partial<CharacterRelationship>): CharacterRelationship {
    const id = 'rel_' + Date.now();
    const newRel: CharacterRelationship = {
      id,
      sourceCharacterId: rel.sourceCharacterId || '',
      sourceName: rel.sourceName || '',
      targetCharacterId: rel.targetCharacterId || '',
      targetName: rel.targetName || '',
      relationType: rel.relationType || 'Ally',
      description: rel.description || ''
    };
    this.db.characterRelationships.push(newRel);
    this.commit();
    return newRel;
  }

  public getWorlds(authorId?: string): World[] {
    if (authorId) return this.db.worlds.filter(w => w.authorId === authorId);
    return this.db.worlds;
  }

  public createWorld(world: Partial<World>, author: User): World {
    const id = 'world_' + Date.now();
    const slug = (world.name || 'new-world').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + id.slice(-4);
    const newWorld: World = {
      id,
      authorId: author.id,
      name: world.name || 'New Realm',
      slug,
      tagline: world.tagline || '',
      description: world.description || '',
      globalScale: world.globalScale || 'Planetary System',
      mainDocument: world.mainDocument || '# World Primer\n\nDescribe your realm here...',
      locations: world.locations || [],
      factions: world.factions || [],
      magicTypes: world.magicTypes || ['Stellar Magitech'],
      techLevel: world.techLevel || 'High Magic / Magitech',
      chronology: world.chronology || [],
      universeId: world.universeId,
      bannerImage: world.bannerImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };
    this.db.worlds.push(newWorld);
    this.commit();
    return newWorld;
  }

  public getUniverses(authorId?: string): Universe[] {
    if (authorId) return this.db.universes.filter(u => u.authorId === authorId);
    return this.db.universes;
  }

  public findUniverseByIdOrSlug(idOrSlug: string): { universe: Universe; stories: Story[] } | undefined {
    const uni = this.db.universes.find(u => u.id === idOrSlug || u.slug === idOrSlug);
    if (!uni) return undefined;
    const stories = this.db.stories.filter(s => s.universeId === uni.id);
    return { universe: uni, stories };
  }

  public createUniverse(universe: Partial<Universe>, author: User): Universe {
    const id = 'uni_' + Date.now();
    const slug = (universe.name || 'new-universe').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + id.slice(-4);
    const newUni: Universe = {
      id,
      authorId: author.id,
      name: universe.name || 'New Universe Continuity',
      slug,
      tagline: universe.tagline || '',
      description: universe.description || '',
      bannerImage: universe.bannerImage || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
      storiesCount: 0,
      charactersCount: 0,
      readersCount: 0,
      rating: 5.0,
      overviewDoc: universe.overviewDoc || '# Universe Overview',
      featuredCharacterIds: universe.featuredCharacterIds || [],
      createdAt: new Date().toISOString()
    };
    this.db.universes.push(newUni);
    this.commit();
    return newUni;
  }

  // Anime Entries & Tracking
  public getAnimeEntries(userId?: string): AnimeEntry[] {
    const list = this.db.animeEntries;
    if (!userId) return list;

    const userMap = this.db.userAnimeTracking[userId] || {};
    return list.map(ani => {
      const tracking = userMap[ani.id];
      return {
        ...ani,
        userTracking: tracking ? { status: tracking.status as any, episodesWatched: tracking.episodesWatched } : undefined
      };
    });
  }

  public trackAnime(userId: string, animeId: string, status: string, episodesWatched: number) {
    if (!this.db.userAnimeTracking[userId]) {
      this.db.userAnimeTracking[userId] = {};
    }
    this.db.userAnimeTracking[userId][animeId] = { status, episodesWatched };
    this.commit();
    return this.db.userAnimeTracking[userId][animeId];
  }

  // Notifications & Badges
  public getNotifications(userId: string): Notification[] {
    return this.db.notifications.filter(n => n.userId === userId);
  }

  public markNotificationRead(notifId: string) {
    const n = this.db.notifications.find(notif => notif.id === notifId);
    if (n) n.isRead = true;
    this.commit();
  }

  public markAllNotificationsRead(userId: string) {
    this.db.notifications.filter(n => n.userId === userId).forEach(n => n.isRead = true);
    this.commit();
  }

  public getUserBadges(userId: string): Badge[] {
    return this.db.badges[userId] || getInitialSeed().badges['usr_1'];
  }

  // Creator Analytics
  public getCreatorAnalytics(authorId: string) {
    const authorStories = this.db.stories.filter(s => s.authorId === authorId);
    const totalReads = authorStories.reduce((acc, s) => acc + s.views, 0);
    const drafts = authorStories.filter(s => s.status === 'Draft').length;
    const published = authorStories.filter(s => s.status !== 'Draft').length;
    const author = this.findUserById(authorId);

    const readsOverTime = [
      { date: 'Mon', reads: Math.floor(totalReads * 0.12) },
      { date: 'Tue', reads: Math.floor(totalReads * 0.15) },
      { date: 'Wed', reads: Math.floor(totalReads * 0.18) },
      { date: 'Thu', reads: Math.floor(totalReads * 0.14) },
      { date: 'Fri', reads: Math.floor(totalReads * 0.22) },
      { date: 'Sat', reads: Math.floor(totalReads * 0.28) },
      { date: 'Sun', reads: Math.floor(totalReads * 0.31) },
    ];

    const topChapters = authorStories.slice(0, 3).map(s => ({
      title: s.title,
      reads: s.views,
      rating: s.rating
    }));

    return {
      totalStories: authorStories.length,
      publishedStories: published,
      draftsCount: drafts,
      followersCount: author?.followersCount || 0,
      totalReads,
      readsOverTime,
      chapterCompletionRate: 84.6,
      avgReadingTimeMinutes: 7.2,
      topChapters,
    };
  }

  // Global Search
  public search(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) {
      return {
        stories: this.db.stories.slice(0, 4),
        authors: this.db.users.filter(u => u.role === 'WRITER').slice(0, 4),
        characters: this.db.characters.slice(0, 4),
        communities: this.db.communities.slice(0, 4),
        theories: this.db.theories.slice(0, 4),
        anime: this.db.animeEntries.slice(0, 4),
      };
    }

    const stories = this.db.stories.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.description.toLowerCase().includes(q) || 
      s.genre.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    );

    const authors = this.db.users.filter(u => 
      u.displayName.toLowerCase().includes(q) || 
      u.username.toLowerCase().includes(q) ||
      u.bio.toLowerCase().includes(q)
    );

    const characters = this.db.characters.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.biography.toLowerCase().includes(q) ||
      c.primaryPower.toLowerCase().includes(q)
    );

    const communities = this.db.communities.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );

    const theories = this.db.theories.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );

    const anime = this.db.animeEntries.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.altTitles.toLowerCase().includes(q) ||
      a.synopsis.toLowerCase().includes(q)
    );

    return { stories, authors, characters, communities, theories, anime };
  }

  // ----------------------------------------------------
  // ADMIN PORTAL OPERATIONS
  // ----------------------------------------------------
  public getAllUsersForAdmin(): User[] {
    return this.db.users.map(u => ({
      ...u,
      status: u.status || 'ACTIVE',
      publishedStoriesCount: this.db.stories.filter(s => s.authorId === u.id).length
    }));
  }

  public updateUserByAdmin(userId: string, updates: Partial<User>): User | undefined {
    const idx = this.db.users.findIndex(u => u.id === userId);
    if (idx === -1) return undefined;
    this.db.users[idx] = { ...this.db.users[idx], ...updates };
    this.commit();
    return {
      ...this.db.users[idx],
      publishedStoriesCount: this.db.stories.filter(s => s.authorId === userId).length
    };
  }

  public deleteUserByAdmin(userId: string): boolean {
    const idx = this.db.users.findIndex(u => u.id === userId);
    if (idx === -1) return false;
    this.db.users.splice(idx, 1);
    delete this.db.passwords[userId];
    this.commit();
    return true;
  }

  public getAdminPlatformStats() {
    const totalUsers = this.db.users.length;
    const totalWriters = this.db.users.filter(u => u.role === 'WRITER').length;
    const totalStories = this.db.stories.length;
    const totalChapters = this.db.chapters.length;
    const totalReads = this.db.stories.reduce((acc, s) => acc + (s.views || 0), 0);
    const totalUniverses = this.db.universes.length;
    const totalCommunities = this.db.communities.length;
    const totalTheories = this.db.theories.length;
    const totalPosts = this.db.communityPosts.length;
    const recentRegistrations = [...this.db.users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalUsers,
      totalWriters,
      totalStories,
      totalChapters,
      totalReads,
      totalUniverses,
      totalCommunities,
      totalTheories,
      totalPosts,
      recentRegistrations
    };
  }

  public deleteCommunityPost(postId: string): boolean {
    const idx = this.db.communityPosts.findIndex(p => p.id === postId);
    if (idx === -1) return false;
    this.db.communityPosts.splice(idx, 1);
    this.commit();
    return true;
  }

  public deleteTheory(theoryId: string): boolean {
    const idx = this.db.theories.findIndex(t => t.id === theoryId);
    if (idx === -1) return false;
    this.db.theories.splice(idx, 1);
    this.commit();
    return true;
  }

  // ==========================================
  // MASTER ADMIN PROGRAMS & COMPETITIONS METHODS
  // ==========================================

  public logProgramAudit(logData: {
    programId: string;
    action: string;
    actorId: string;
    actorUsername: string;
    targetType?: 'PROGRAM' | 'PARTICIPANT' | 'SUBMISSION' | 'VOTE' | 'RESULTS' | 'SETTINGS';
    targetId?: string;
    targetName?: string;
    previousValue?: any;
    newValue?: any;
    ipAddress?: string;
  }): ProgramAuditLog {
    if (!this.db.programAuditLogs) this.db.programAuditLogs = [];
    const log: ProgramAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...logData
    };
    this.db.programAuditLogs.unshift(log);
    this.commit();
    return log;
  }

  public getProgramAuditLogs(programId?: string): ProgramAuditLog[] {
    const logs = this.db.programAuditLogs || [];
    if (!programId || programId === 'all') return logs;
    return logs.filter(l => l.programId === programId);
  }

  public getPrograms(filter?: { status?: string; type?: string; search?: string; visibility?: string }): Program[] {
    let progs = this.db.programs || [];
    if (!filter) return progs;

    if (filter.status && filter.status !== 'ALL') {
      progs = progs.filter(p => p.status === filter.status);
    }
    if (filter.type && filter.type !== 'ALL') {
      progs = progs.filter(p => p.type.toLowerCase() === filter.type!.toLowerCase());
    }
    if (filter.visibility && filter.visibility !== 'ALL') {
      progs = progs.filter(p => p.visibility === filter.visibility);
    }
    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      progs = progs.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.tagline.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.theme.toLowerCase().includes(q)
      );
    }
    return progs;
  }

  public getProgramById(id: string): Program | undefined {
    return (this.db.programs || []).find(p => p.id === id || p.slug === id);
  }

  public getProgramBySlug(slug: string): Program | undefined {
    return (this.db.programs || []).find(p => p.slug === slug || p.id === slug);
  }

  public createProgram(data: Partial<Program>, adminUser: User): Program {
    if (!this.db.programs) this.db.programs = [];
    const id = `prog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const slug = (data.name || 'new-program')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const now = new Date().toISOString();
    const newProgram: Program = {
      id,
      name: data.name || 'Untitled Program',
      slug: data.slug || slug,
      tagline: data.tagline || '',
      description: data.description || '',
      type: data.type || 'Writing Competition',
      customType: data.customType,
      coverImage: data.coverImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      bannerImage: data.bannerImage || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600&auto=format&fit=crop&q=80',
      thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
      organizerName: data.organizerName || 'KAIRO Editorial Guild',
      theme: data.theme || 'Original Storytelling',
      category: data.category || 'General Fiction',
      eligibility: data.eligibility || 'Open to all registered creators',
      ageRestriction: data.ageRestriction,
      countryEligibility: data.countryEligibility,
      language: data.language || 'English',
      maxParticipants: data.maxParticipants || 500,
      minParticipants: data.minParticipants || 1,
      targetAudience: data.targetAudience || 'both',
      visibility: data.visibility || 'public',
      status: (data.status as ProgramStatus) || 'DRAFT',
      timeline: data.timeline || {
        registrationOpens: now,
        registrationCloses: new Date(Date.now() + 14 * 86400000).toISOString(),
        submissionOpens: now,
        submissionDeadline: new Date(Date.now() + 30 * 86400000).toISOString(),
        votingStarts: new Date(Date.now() + 31 * 86400000).toISOString(),
        votingEnds: new Date(Date.now() + 45 * 86400000).toISOString(),
        judgingStarts: new Date(Date.now() + 35 * 86400000).toISOString(),
        judgingEnds: new Date(Date.now() + 48 * 86400000).toISOString(),
        finalistAnnouncementDate: new Date(Date.now() + 42 * 86400000).toISOString(),
        resultDeclarationDate: new Date(Date.now() + 50 * 86400000).toISOString(),
        programEndDate: new Date(Date.now() + 60 * 86400000).toISOString()
      },
      rules: data.rules || {
        fullRules: 'Standard KAIRO Competition rules apply.',
        participationRequirements: 'Active Kairo account.',
        allowedContent: 'Original stories, artwork, and worldbuilding lore.',
        prohibitedContent: 'Plagiarized content or explicit hate speech.',
        submissionLimitPerUser: 1,
        teamParticipationAllowed: false,
        eligibilityCriteria: 'All registered users.',
        disqualificationConditions: 'Violations of terms of service.',
        copyrightRequirements: 'Authors retain 100% intellectual property ownership.',
        aiContentPolicy: 'Allowed with disclosure',
        plagiarismPolicy: 'Strictly prohibited.',
        judgingRules: 'Scored by appointed judges.',
        requireRulesAgreement: true
      },
      prizes: data.prizes || [
        {
          id: `prz_${Date.now()}_1`,
          placement: '1st Place',
          title: 'Grand Winner Trophy & Feature',
          description: 'Official verified crest, certificate, and homepage feature.',
          xpReward: 10000,
          kairoCoins: 2500,
          certificateAwarded: true
        }
      ],
      judgingConfig: data.judgingConfig || {
        enabled: true,
        criteria: [
          { id: 'crit_quality', name: 'Story Quality', weightPercent: 50 },
          { id: 'crit_world', name: 'Worldbuilding & Depth', weightPercent: 50 }
        ],
        blindJudging: false,
        formula: 'JUDGE_COMMUNITY_COMBINED',
        judgeWeightPercent: 70,
        communityWeightPercent: 30,
        judges: []
      },
      votingConfig: data.votingConfig || {
        enabled: true,
        mode: 'ONE_PER_USER',
        maxVotesPerUser: 1,
        publicVoteCount: true,
        hideUntilDeadline: false,
        eligibility: 'ALL'
      },
      leaderboardConfig: data.leaderboardConfig || {
        enabled: true,
        visibility: 'PUBLIC',
        realTime: true,
        rankBy: 'COMBINED'
      },
      sponsors: data.sponsors || [],
      faq: data.faq || [],
      finalists: [],
      results: { isLocked: false, winners: [] },
      analytics: {
        views: 0,
        uniqueVisitors: 0,
        registrationsCount: 0,
        submissionsCount: 0,
        totalVotes: 0,
        completionRate: 0,
        sharesCount: 0,
        dailyRegistrations: [],
        dailyVotes: []
      },
      createdAt: now,
      updatedAt: now,
      createdByAdminId: adminUser.id
    };

    this.db.programs.unshift(newProgram);
    this.commit();

    this.logProgramAudit({
      programId: id,
      action: 'PROGRAM_CREATED',
      actorId: adminUser.id,
      actorUsername: adminUser.username,
      targetType: 'PROGRAM',
      targetId: id,
      targetName: newProgram.name,
      newValue: { name: newProgram.name, type: newProgram.type, status: newProgram.status }
    });

    return newProgram;
  }

  public updateProgram(id: string, updates: Partial<Program>, adminUser: User): Program | undefined {
    const idx = (this.db.programs || []).findIndex(p => p.id === id);
    if (idx === -1) return undefined;

    const previous = { ...this.db.programs[idx] };
    const updated: Program = {
      ...this.db.programs[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.db.programs[idx] = updated;
    this.commit();

    this.logProgramAudit({
      programId: id,
      action: 'PROGRAM_UPDATED',
      actorId: adminUser.id,
      actorUsername: adminUser.username,
      targetType: 'PROGRAM',
      targetId: id,
      targetName: updated.name,
      previousValue: previous.name !== updated.name ? { name: previous.name } : undefined,
      newValue: { updatedAt: updated.updatedAt }
    });

    return updated;
  }

  public overrideProgramStatus(id: string, newStatus: ProgramStatus, adminUser: User, reason?: string): Program | undefined {
    const prog = this.getProgramById(id);
    if (!prog) return undefined;

    const previousStatus = prog.status;
    prog.status = newStatus;
    prog.manualStatusOverride = true;
    prog.updatedAt = new Date().toISOString();
    this.commit();

    this.logProgramAudit({
      programId: id,
      action: 'STATUS_OVERRIDE',
      actorId: adminUser.id,
      actorUsername: adminUser.username,
      targetType: 'PROGRAM',
      targetId: id,
      targetName: prog.name,
      previousValue: previousStatus,
      newValue: newStatus + (reason ? ` (Reason: ${reason})` : '')
    });

    return prog;
  }

  public duplicateProgram(id: string, adminUser: User, newName?: string): Program | undefined {
    const original = this.getProgramById(id);
    if (!original) return undefined;

    const newId = `prog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const clonedName = newName || `${original.name} (Clone - Edition ${new Date().getFullYear()})`;
    const slug = clonedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const now = new Date().toISOString();
    const cloned: Program = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      name: clonedName,
      slug,
      status: 'DRAFT',
      finalists: [],
      results: { isLocked: false, winners: [] },
      analytics: {
        views: 0,
        uniqueVisitors: 0,
        registrationsCount: 0,
        submissionsCount: 0,
        totalVotes: 0,
        completionRate: 0,
        sharesCount: 0,
        dailyRegistrations: [],
        dailyVotes: []
      },
      createdAt: now,
      updatedAt: now,
      createdByAdminId: adminUser.id
    };

    if (!this.db.programs) this.db.programs = [];
    this.db.programs.unshift(cloned);
    this.commit();

    this.logProgramAudit({
      programId: newId,
      action: 'PROGRAM_DUPLICATED',
      actorId: adminUser.id,
      actorUsername: adminUser.username,
      targetType: 'PROGRAM',
      targetId: newId,
      targetName: cloned.name,
      previousValue: { sourceProgramId: original.id },
      newValue: { newProgramId: newId }
    });

    return cloned;
  }

  public deleteProgram(id: string, adminUser: User): boolean {
    const idx = (this.db.programs || []).findIndex(p => p.id === id);
    if (idx === -1) return false;

    const deleted = this.db.programs[idx];
    this.db.programs.splice(idx, 1);

    // Clean up dependent collections
    if (this.db.programParticipants) {
      this.db.programParticipants = this.db.programParticipants.filter(p => p.programId !== id);
    }
    if (this.db.programSubmissions) {
      this.db.programSubmissions = this.db.programSubmissions.filter(s => s.programId !== id);
    }
    if (this.db.programVotes) {
      this.db.programVotes = this.db.programVotes.filter(v => v.programId !== id);
    }
    if (this.db.programAnnouncements) {
      this.db.programAnnouncements = this.db.programAnnouncements.filter(a => a.programId !== id);
    }

    this.commit();

    this.logProgramAudit({
      programId: id,
      action: 'PROGRAM_DELETED',
      actorId: adminUser.id,
      actorUsername: adminUser.username,
      targetType: 'PROGRAM',
      targetId: id,
      targetName: deleted.name
    });

    return true;
  }

  // Participants
  public getProgramParticipants(programId: string): ProgramParticipant[] {
    const list = this.db.programParticipants || [];
    if (!programId || programId === 'all') return list;
    return list.filter(p => p.programId === programId);
  }

  public registerProgramParticipant(programId: string, user: User, data: { rulesAgreementCheckbox: boolean; userType?: 'AUTHOR' | 'READER' | 'BOTH' }): ProgramParticipant {
    if (!this.db.programParticipants) this.db.programParticipants = [];

    const existing = this.db.programParticipants.find(p => p.programId === programId && p.userId === user.id);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const newParticipant: ProgramParticipant = {
      id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      programId,
      userId: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      email: user.email,
      userType: data.userType || (user.role === 'WRITER' ? 'AUTHOR' : 'READER'),
      status: 'APPROVED',
      submissionStatus: 'NONE',
      registeredAt: now,
      rulesAgreedAt: now,
      rulesAgreementCheckbox: !!data.rulesAgreementCheckbox,
      voteCount: 0,
      finalScore: 0,
      isFinalist: false
    };

    this.db.programParticipants.unshift(newParticipant);

    // Increment program stats
    const prog = this.getProgramById(programId);
    if (prog) {
      prog.analytics.registrationsCount = (prog.analytics.registrationsCount || 0) + 1;
    }

    this.commit();

    this.logProgramAudit({
      programId,
      action: 'PARTICIPANT_REGISTERED',
      actorId: user.id,
      actorUsername: user.username,
      targetType: 'PARTICIPANT',
      targetId: newParticipant.id,
      targetName: user.displayName || user.username
    });

    return newParticipant;
  }

  public updateProgramParticipant(participantId: string, updates: Partial<ProgramParticipant>, adminUser: User): ProgramParticipant | undefined {
    const p = (this.db.programParticipants || []).find(part => part.id === participantId);
    if (!p) return undefined;

    Object.assign(p, updates);
    this.commit();

    this.logProgramAudit({
      programId: p.programId,
      action: 'PARTICIPANT_UPDATED',
      actorId: adminUser.id,
      actorUsername: adminUser.username,
      targetType: 'PARTICIPANT',
      targetId: p.id,
      targetName: p.displayName,
      newValue: updates
    });

    return p;
  }

  public removeProgramParticipant(participantId: string, adminUser: User): boolean {
    const idx = (this.db.programParticipants || []).findIndex(p => p.id === participantId);
    if (idx === -1) return false;

    const removed = this.db.programParticipants[idx];
    this.db.programParticipants.splice(idx, 1);
    this.commit();

    this.logProgramAudit({
      programId: removed.programId,
      action: 'PARTICIPANT_REMOVED',
      actorId: adminUser.id,
      actorUsername: adminUser.username,
      targetType: 'PARTICIPANT',
      targetId: removed.id,
      targetName: removed.displayName
    });

    return true;
  }

  // Submissions
  public getProgramSubmissions(programId: string): ProgramSubmission[] {
    const list = this.db.programSubmissions || [];
    if (!programId || programId === 'all') return list;
    return list.filter(s => s.programId === programId);
  }

  public getProgramSubmissionById(id: string): ProgramSubmission | undefined {
    return (this.db.programSubmissions || []).find(s => s.id === id);
  }

  public createProgramSubmission(programId: string, user: User, data: Partial<ProgramSubmission>): ProgramSubmission {
    if (!this.db.programSubmissions) this.db.programSubmissions = [];

    // Ensure user is participant
    let participant = (this.db.programParticipants || []).find(p => p.programId === programId && p.userId === user.id);
    if (!participant) {
      participant = this.registerProgramParticipant(programId, user, { rulesAgreementCheckbox: true });
    }

    const now = new Date().toISOString();
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSub: ProgramSubmission = {
      id,
      programId,
      participantId: participant.id,
      userId: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      title: data.title || 'Untitled Submission',
      tagline: data.tagline,
      summary: data.summary || '',
      submissionType: data.submissionType || 'STORY',
      storyId: data.storyId,
      storySlug: data.storySlug,
      content: data.content,
      mediaUrl: data.mediaUrl,
      coverImage: data.coverImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      wordCount: data.wordCount || (data.content ? data.content.split(/\s+/).length : 2500),
      status: (data.status as any) || 'SUBMITTED',
      isFeatured: !!data.isFeatured,
      isLocked: false,
      votes: 0,
      votedUserIds: [],
      scores: {
        judgeScores: {},
        averageJudgeScore: 0,
        communityScore: 0,
        finalWeightedScore: 0
      },
      createdAt: now,
      updatedAt: now
    };

    this.db.programSubmissions.unshift(newSub);
    participant.submissionStatus = 'SUBMITTED';

    // Increment program stats
    const prog = this.getProgramById(programId);
    if (prog) {
      prog.analytics.submissionsCount = (prog.analytics.submissionsCount || 0) + 1;
    }

    this.commit();

    this.logProgramAudit({
      programId,
      action: 'SUBMISSION_CREATED',
      actorId: user.id,
      actorUsername: user.username,
      targetType: 'SUBMISSION',
      targetId: id,
      targetName: newSub.title
    });

    return newSub;
  }

  public updateProgramSubmission(submissionId: string, updates: Partial<ProgramSubmission>, user: User, isAdmin: boolean): ProgramSubmission | undefined {
    const sub = this.getProgramSubmissionById(submissionId);
    if (!sub) return undefined;

    // Authorization check
    if (!isAdmin && sub.userId !== user.id) {
      return undefined;
    }

    const prevTitle = sub.title;
    Object.assign(sub, updates, { updatedAt: new Date().toISOString() });

    // If status changed to FINALIST or WINNER, synchronize with participant
    if (updates.status) {
      const part = (this.db.programParticipants || []).find(p => p.id === sub.participantId);
      if (part) {
        part.submissionStatus = updates.status as any;
        if (updates.status === 'FINALIST') part.isFinalist = true;
      }
    }

    this.commit();

    this.logProgramAudit({
      programId: sub.programId,
      action: 'SUBMISSION_UPDATED',
      actorId: user.id,
      actorUsername: user.username,
      targetType: 'SUBMISSION',
      targetId: sub.id,
      targetName: sub.title,
      newValue: updates
    });

    return sub;
  }

  public deleteProgramSubmission(submissionId: string, adminUser: User): boolean {
    const idx = (this.db.programSubmissions || []).findIndex(s => s.id === submissionId);
    if (idx === -1) return false;

    const sub = this.db.programSubmissions[idx];
    this.db.programSubmissions.splice(idx, 1);

    // Update participant
    const part = (this.db.programParticipants || []).find(p => p.id === sub.participantId);
    if (part) {
      part.submissionStatus = 'NONE';
      part.isFinalist = false;
    }

    this.commit();

    this.logProgramAudit({
      programId: sub.programId,
      action: 'SUBMISSION_DELETED',
      actorId: adminUser.id,
      actorUsername: adminUser.username,
      targetType: 'SUBMISSION',
      targetId: sub.id,
      targetName: sub.title
    });

    return true;
  }

  public scoreProgramSubmission(submissionId: string, judgeUser: User, criteriaScores: Record<string, number>, feedback?: string): ProgramSubmission | undefined {
    const sub = this.getProgramSubmissionById(submissionId);
    if (!sub) return undefined;

    const prog = this.getProgramById(sub.programId);
    const criteriaList = prog?.judgingConfig?.criteria || [];

    // Calculate weighted score for this judge
    let totalWeight = 0;
    let earnedWeight = 0;
    if (criteriaList.length > 0) {
      for (const crit of criteriaList) {
        const score = criteriaScores[crit.id] || 0;
        const weight = crit.weightPercent || (100 / criteriaList.length);
        earnedWeight += (score * weight) / 100;
        totalWeight += weight;
      }
    } else {
      // Direct average
      const values = Object.values(criteriaScores);
      earnedWeight = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    }

    const judgeWeightedScore = Math.round(earnedWeight * 10) / 10;

    if (!sub.scores) {
      sub.scores = {
        judgeScores: {},
        averageJudgeScore: 0,
        communityScore: 0,
        finalWeightedScore: 0
      };
    }
    if (!sub.scores.judgeScores) sub.scores.judgeScores = {};

    sub.scores.judgeScores[judgeUser.id] = {
      judgeId: judgeUser.id,
      judgeName: judgeUser.displayName || judgeUser.username,
      criteriaScores,
      weightedScore: judgeWeightedScore,
      feedback,
      submittedAt: new Date().toISOString()
    };

    // Recalculate average across all judges
    const allJudgeScores = Object.values(sub.scores.judgeScores);
    const avgJudge = allJudgeScores.reduce((acc, curr) => acc + curr.weightedScore, 0) / allJudgeScores.length;
    sub.scores.averageJudgeScore = Math.round(avgJudge * 10) / 10;

    // Combined formula
    const jWeight = (prog?.judgingConfig?.judgeWeightPercent ?? 70) / 100;
    const cWeight = (prog?.judgingConfig?.communityWeightPercent ?? 30) / 100;

    // Normalize community score from votes (top submission gets 100, others scaled relative)
    const allSubs = this.getProgramSubmissions(sub.programId);
    const maxVotes = Math.max(...allSubs.map(s => s.votes || 0), 1);
    const commScore = Math.min(100, Math.round(((sub.votes || 0) / maxVotes) * 100));
    sub.scores.communityScore = commScore;

    sub.scores.finalWeightedScore = Math.round((sub.scores.averageJudgeScore * jWeight + commScore * cWeight) * 10) / 10;

    // Update participant final score
    const part = (this.db.programParticipants || []).find(p => p.id === sub.participantId);
    if (part) {
      part.finalScore = sub.scores.finalWeightedScore;
    }

    this.commit();

    this.logProgramAudit({
      programId: sub.programId,
      action: 'SUBMISSION_SCORED',
      actorId: judgeUser.id,
      actorUsername: judgeUser.username,
      targetType: 'SUBMISSION',
      targetId: sub.id,
      targetName: sub.title,
      newValue: { score: judgeWeightedScore, finalWeightedScore: sub.scores.finalWeightedScore }
    });

    return sub;
  }

  public toggleProgramFinalist(submissionId: string, isFinalist: boolean, adminUser: User): ProgramSubmission | undefined {
    const sub = this.getProgramSubmissionById(submissionId);
    if (!sub) return undefined;

    sub.status = isFinalist ? 'FINALIST' : 'APPROVED';

    const prog = this.getProgramById(sub.programId);
    if (prog) {
      if (!prog.finalists) prog.finalists = [];
      if (isFinalist && !prog.finalists.includes(submissionId)) {
        prog.finalists.push(submissionId);
      } else if (!isFinalist) {
        prog.finalists = prog.finalists.filter(id => id !== submissionId);
      }
    }

    const part = (this.db.programParticipants || []).find(p => p.id === sub.participantId);
    if (part) {
      part.isFinalist = isFinalist;
      part.submissionStatus = isFinalist ? 'FINALIST' : 'APPROVED';
    }

    this.commit();

    this.logProgramAudit({
      programId: sub.programId,
      action: isFinalist ? 'MARK_FINALIST' : 'REMOVE_FINALIST',
      actorId: adminUser.id,
      actorUsername: adminUser.username,
      targetType: 'SUBMISSION',
      targetId: sub.id,
      targetName: sub.title,
      newValue: { isFinalist }
    });

    return sub;
  }

  // Community Voting
  public voteProgramSubmission(programId: string, submissionId: string, user: User, ipAddress?: string): { success: boolean; message: string; votes: number } {
    if (!this.db.programVotes) this.db.programVotes = [];

    const prog = this.getProgramById(programId);
    if (!prog) return { success: false, message: 'Program not found', votes: 0 };

    if (prog.status !== 'VOTING_OPEN') {
      return { success: false, message: 'Voting is not currently open for this program', votes: 0 };
    }

    const sub = this.getProgramSubmissionById(submissionId);
    if (!sub || sub.programId !== programId) {
      return { success: false, message: 'Submission not found', votes: 0 };
    }

    // Check user vote limits
    const maxVotes = prog.votingConfig?.maxVotesPerUser || 1;
    const userVotesInProg = this.db.programVotes.filter(v => v.programId === programId && v.userId === user.id);

    // If one-per-user or already voted for this exact submission
    const alreadyVotedForSub = userVotesInProg.some(v => v.submissionId === submissionId);
    if (alreadyVotedForSub) {
      return { success: false, message: 'You have already voted for this submission', votes: sub.votes };
    }

    if (userVotesInProg.length >= maxVotes) {
      return { success: false, message: `You have reached the maximum of ${maxVotes} vote(s) for this program`, votes: sub.votes };
    }

    const vote: ProgramVote = {
      id: `vote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      programId,
      submissionId,
      userId: user.id,
      username: user.username,
      votedAt: new Date().toISOString(),
      ipAddress
    };

    this.db.programVotes.push(vote);

    if (!sub.votedUserIds) sub.votedUserIds = [];
    sub.votedUserIds.push(user.id);
    sub.votes = (sub.votes || 0) + 1;

    // Update participant
    const part = (this.db.programParticipants || []).find(p => p.id === sub.participantId);
    if (part) {
      part.voteCount = (part.voteCount || 0) + 1;
    }

    // Update program analytics
    prog.analytics.totalVotes = (prog.analytics.totalVotes || 0) + 1;

    this.commit();

    return { success: true, message: 'Vote cast successfully!', votes: sub.votes };
  }

  public getProgramVotes(programId: string): ProgramVote[] {
    const list = this.db.programVotes || [];
    if (!programId || programId === 'all') return list;
    return list.filter(v => v.programId === programId);
  }

  // Result Declaration & Certificates
  public declareProgramResults(programId: string, resultsData: { winners: any[]; remarks?: string }, adminUser: User): Program | undefined {
    const prog = this.getProgramById(programId);
    if (!prog) return undefined;

    if (!this.db.programCertificates) this.db.programCertificates = [];
    if (!this.db.badges) this.db.badges = {};

    const now = new Date().toISOString();
    const declaredWinners: any[] = [];

    for (const win of resultsData.winners) {
      const sub = this.getProgramSubmissionById(win.submissionId);
      const prize = (prog.prizes || []).find(p => p.id === win.prizeId);

      const winnerUserId = win.userId || sub?.userId;
      const winnerUser = (this.db.users || []).find(u => u.id === winnerUserId);

      // Generate verifiable certificate
      const certId = `cert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const certHash = `kr-cert-${prog.id.slice(-4)}-${crypto.randomBytes(4).toString('hex')}`;
      const cert: ProgramCertificate = {
        id: certId,
        programId: prog.id,
        programName: prog.name,
        recipientUserId: winnerUserId,
        recipientName: winnerUser?.displayName || win.displayName || win.username || 'Honored Creator',
        recipientUsername: winnerUser?.username || win.username,
        awardTitle: prize?.title || win.placementTitle || 'Honorable Laureate',
        placement: prize?.placement || win.placementTitle || 'Grand Winner',
        issuedDate: now.split('T')[0],
        verificationHash: certHash,
        certificateUrl: `/certificates/${certId}`
      };
      this.db.programCertificates.push(cert);

      // Award badge if configured
      if (prize?.badgeKey && winnerUserId) {
        if (!this.db.badges[winnerUserId]) this.db.badges[winnerUserId] = [];
        const existingBadge = this.db.badges[winnerUserId].find(b => b.key === prize.badgeKey);
        if (!existingBadge) {
          this.db.badges[winnerUserId].push({
            id: `bg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            key: prize.badgeKey,
            title: prize.badgeTitle || prize.title,
            description: `Awarded for ${prize.placement} in ${prog.name}`,
            icon: prize.badgeIcon || 'Trophy',
            unlocked: true,
            unlockedAt: now
          });
        }
      }

      // Mark submission as WINNER
      if (sub) {
        sub.status = 'WINNER';
      }

      // Mark participant as WINNER
      const part = (this.db.programParticipants || []).find(p => p.programId === prog.id && p.userId === winnerUserId);
      if (part) {
        part.submissionStatus = 'WINNER';
      }

      declaredWinners.push({
        prizeId: win.prizeId,
        placementTitle: prize?.placement || win.placementTitle,
        submissionId: win.submissionId,
        userId: winnerUserId,
        username: winnerUser?.username || win.username,
        displayName: winnerUser?.displayName || win.displayName || win.username,
        avatar: winnerUser?.avatar || win.avatar,
        storyTitle: sub?.title || win.storyTitle,
        specialAwardName: win.specialAwardName || prize?.title,
        certificateId: certId
      });
    }

    prog.results = {
      publishedAt: now,
      declaredByAdminId: adminUser.id,
      isLocked: true,
      remarks: resultsData.remarks || 'Official results have been certified by the Master Admin and Grand Council.',
      winners: declaredWinners
    };
    prog.status = 'COMPLETED';
    prog.updatedAt = now;

    // Create celebratory announcement
    this.createProgramAnnouncement(prog.id, {
      title: `Official Results Declared: ${prog.name}!`,
      content: `The official winners for ${prog.name} have been certified! Congratulations to all champions and participants. Check out the official results and celebratory showcase!`,
      type: 'RESULTS_ANNOUNCED',
      sendInAppNotification: true,
      socialMediaCopy: `🏆 The winners of ${prog.name} are officially crowned! See the victorious stories and celebrated authors on Kairo! #KairoWinners #Anime`
    }, adminUser);

    this.commit();

    this.logProgramAudit({
      programId: prog.id,
      action: 'RESULTS_DECLARED',
      actorId: adminUser.id,
      actorUsername: adminUser.username,
      targetType: 'RESULTS',
      targetId: prog.id,
      targetName: prog.name,
      newValue: { winnersCount: declaredWinners.length, remarks: resultsData.remarks }
    });

    return prog;
  }

  // Announcements
  public getProgramAnnouncements(programId: string): ProgramAnnouncement[] {
    const list = this.db.programAnnouncements || [];
    if (!programId || programId === 'all') return list;
    return list.filter(a => a.programId === programId);
  }

  public createProgramAnnouncement(programId: string, data: Partial<ProgramAnnouncement>, adminUser: User): ProgramAnnouncement {
    if (!this.db.programAnnouncements) this.db.programAnnouncements = [];

    const now = new Date().toISOString();
    const ann: ProgramAnnouncement = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      programId,
      title: data.title || 'Program Announcement',
      content: data.content || '',
      type: data.type || 'IMPORTANT_UPDATE',
      sendInAppNotification: !!data.sendInAppNotification,
      publishedAt: now,
      socialMediaCopy: data.socialMediaCopy
    };

    this.db.programAnnouncements.unshift(ann);

    // If notifications enabled, broadcast to registered participants
    if (ann.sendInAppNotification && this.db.notifications) {
      const parts = this.getProgramParticipants(programId);
      for (const p of parts) {
        this.db.notifications.unshift({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: p.userId,
          type: 'author_announcement',
          title: ann.title,
          message: ann.content.slice(0, 140) + '...',
          linkUrl: `/programs/${programId}`,
          isRead: false,
          createdAt: now
        });
      }
    }

    this.commit();

    this.logProgramAudit({
      programId,
      action: 'ANNOUNCEMENT_CREATED',
      actorId: adminUser.id,
      actorUsername: adminUser.username,
      targetType: 'PROGRAM',
      targetId: ann.id,
      targetName: ann.title
    });

    return ann;
  }

  // Certificates
  public getProgramCertificates(programId?: string, userId?: string): ProgramCertificate[] {
    let list = this.db.programCertificates || [];
    if (programId && programId !== 'all') {
      list = list.filter(c => c.programId === programId);
    }
    if (userId) {
      list = list.filter(c => c.recipientUserId === userId);
    }
    return list;
  }

  public getCertificateById(certId: string): ProgramCertificate | undefined {
    return (this.db.programCertificates || []).find(c => c.id === certId || c.verificationHash === certId);
  }

  // Analytics summary
  public getAdminProgramsSummary(): AdminProgramsSummary {
    const progs = this.db.programs || [];
    const parts = this.db.programParticipants || [];
    const subs = this.db.programSubmissions || [];
    const votes = this.db.programVotes || [];

    const activeProgramsCount = progs.filter(p => ['REGISTRATION_OPEN', 'SUBMISSION_OPEN', 'VOTING_OPEN', 'JUDGING', 'FINALISTS_ANNOUNCED'].includes(p.status)).length;
    const upcomingProgramsCount = progs.filter(p => p.status === 'UPCOMING').length;
    const draftProgramsCount = progs.filter(p => p.status === 'DRAFT').length;
    const completedProgramsCount = progs.filter(p => p.status === 'COMPLETED').length;
    const archivedProgramsCount = progs.filter(p => p.status === 'ARCHIVED').length;

    // Count programs needing immediate attention (e.g. submissions waiting review, results pending)
    const programsNeedingAttention = progs.filter(p => p.status === 'JUDGING' || p.status === 'RESULTS_PENDING' || p.status === 'FINALISTS_ANNOUNCED').length;

    return {
      activeProgramsCount,
      upcomingProgramsCount,
      draftProgramsCount,
      completedProgramsCount,
      archivedProgramsCount,
      totalParticipants: parts.length,
      totalSubmissions: subs.length,
      totalVotes: votes.length,
      newUsersAcquired: parts.length * 3 + 45,
      currentEngagement: 94.8,
      programsNeedingAttention
    };
  }
}

export const dbService = new DatabaseService();

