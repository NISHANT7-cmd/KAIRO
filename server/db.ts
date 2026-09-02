import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  User, Story, Chapter, ReadingProgress, LibraryItem, Review, 
  ChapterComment, Community, CommunityPost, Theory, Character, 
  CharacterRelationship, World, Universe, AnimeEntry, Notification, Badge,
  ChatRoom, ChatMessage, CommunityEvent, CommunityContest, CommunityContestSubmission,
  DirectMessage, DirectMessageConversation, CustomReadingList, QuoteSnippet, ReportItem,
  CommunityComment, CommunityType, PostType
} from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'kairo_db.json');

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
  };
}

class DatabaseService {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.db = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        if (!parsed.sessions) {
          parsed.sessions = {};
        }
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
        return parsed;
      }
    } catch (err) {
      console.error('Error reading kairo_db.json, re-initializing with seed data:', err);
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
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  public getRaw(): DatabaseSchema {
    return this.db;
  }

  public commit() {
    this.saveDatabase();
  }

  // ----------------------------------------------------
  // SESSIONS & AUTHENTICATION
  // ----------------------------------------------------
  public createSession(userId: string): { token: string; expiresAt: string } {
    const token = 'kairo_sec_' + crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
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

  public validateSession(token: string): User | null {
    if (!token || !this.db.sessions) return null;
    const session = this.db.sessions[token];
    if (!session) return null;
    
    // Check expiration
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      delete this.db.sessions[token];
      this.commit();
      return null;
    }

    const user = this.findUserById(session.userId);
    if (!user) return null;

    return user;
  }

  public destroySession(token: string): boolean {
    if (this.db.sessions && this.db.sessions[token]) {
      delete this.db.sessions[token];
      this.commit();
      return true;
    }
    return false;
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
    const authoredStories = this.db.stories ? this.db.stories.filter(s => s.authorId === user.id) : [];
    
    let streak = user.readingStreak ?? 0;
    if (readingProgressList.length === 0) {
      streak = 0;
    } else if (streak === 0) {
      streak = 1;
    }

    return {
      ...user,
      chaptersReadCount,
      publishedStoriesCount: authoredStories.length,
      readingStreak: streak,
      streakDays: streak,
      totalReads: Math.max(user.totalReads ?? 0, chaptersReadCount),
    };
  }

  public updateUser(userId: string, updates: Partial<User>): User | undefined {
    const idx = this.db.users.findIndex(u => u.id === userId);
    if (idx === -1) return undefined;
    this.db.users[idx] = { ...this.db.users[idx], ...updates };
    this.commit();
    return this.db.users[idx];
  }

  // Stories
  public getStories(): Story[] {
    return this.db.stories;
  }

  public findStoryByIdOrSlug(idOrSlug: string): Story | undefined {
    return this.db.stories.find(s => s.id === idOrSlug || s.slug === idOrSlug);
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
    this.db.chapters = this.db.chapters.filter(c => c.storyId !== storyId);
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
  public getCommunities(): Community[] {
    return this.db.communities;
  }

  public getCommunityBySlug(slug: string): Community | undefined {
    return this.db.communities.find(c => c.slug === slug || c.id === slug);
  }

  public getCommunityPosts(communityId: string): CommunityPost[] {
    return this.db.communityPosts
      .filter(p => p.communityId === communityId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllCommunityPosts(): CommunityPost[] {
    return this.db.communityPosts
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createCommunityPost(userId: string, communityId: string, postData: Partial<CommunityPost>): CommunityPost {
    const user = this.findUserById(userId);
    const comm = this.db.communities.find(c => c.id === communityId);
    const now = new Date().toISOString();

    const newPost: CommunityPost = {
      id: 'post_' + Date.now(),
      communityId,
      communityName: comm?.name || 'Community',
      authorId: userId,
      authorUsername: user?.username || 'Wanderer',
      authorDisplayName: user?.displayName || 'Wanderer',
      authorAvatar: user?.avatar || '',
      title: postData.title,
      content: postData.content || '',
      mediaUrl: postData.mediaUrl,
      mediaType: postData.mediaType,
      poll: postData.poll,
      likes: 0,
      likedByUsers: [],
      commentsCount: 0,
      tag: postData.tag || 'General',
      createdAt: now,
    };

    this.db.communityPosts.unshift(newPost);
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
    return post;
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

  public addCommunityPostComment(postId: string, userId: string, content: string): any {
    const post = this.db.communityPosts.find(p => p.id === postId);
    if (!post) return undefined;
    const user = this.findUserById(userId);
    const comment = {
      id: 'pcomm_' + Date.now(),
      postId,
      userId,
      username: user?.username || 'User',
      displayName: user?.displayName || 'User',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      content,
      createdAt: new Date().toISOString(),
    };
    if (!(post as any).comments) {
      (post as any).comments = [];
    }
    (post as any).comments.push(comment);
    post.commentsCount = ((post as any).comments || []).length;
    this.commit();
    return comment;
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
  public getCharacters(authorId?: string): Character[] {
    if (authorId) return this.db.characters.filter(c => c.authorId === authorId);
    return this.db.characters;
  }

  public createCharacter(character: Partial<Character>, author: User): Character {
    const id = 'char_' + Date.now();
    const newChar: Character = {
      id,
      authorId: author.id,
      storyId: character.storyId,
      storyTitle: character.storyTitle,
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
      createdAt: new Date().toISOString()
    };

    this.db.characters.push(newChar);
    this.commit();
    return newChar;
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
}

export const dbService = new DatabaseService();
