import { 
  Program, ProgramParticipant, ProgramSubmission, ProgramVote, 
  ProgramAnnouncement, ProgramAuditLog, ProgramCertificate 
} from '../src/types.js';

export const initialPrograms: Program[] = [
  {
    id: 'prog_kairo_originals_s1',
    name: 'Kairo Originals — Season 01: Astral Horizons',
    slug: 'kairo-originals-season-01',
    tagline: 'The flagship premier serialized fantasy & sci-fi storytelling competition of the year.',
    description: `### Welcome to Kairo Originals Season 01
    
Step beyond mortal skies into **Astral Horizons**. KAIRO is searching for groundbreaking serialized light novels, speculative fiction, and epic anime-inspired sagas that redefine worldbuilding.

Authors will write and serialize compelling story chapters, construct rich world codexes, and compete for **$10,000 USD in prize pool funding**, official **Kairo Original serialized contract status**, customized animated cover art, and official verification badges.

#### Key Highlights
- **100% Creator IP Ownership**: You retain full rights to your intellectual property.
- **Combined Scoring Model**: Submissions are evaluated by both our Industry Grand Council (70%) and Community Reading Votes (30%).
- **Digital Certificates & Badges**: All finalists receive verified profile crests and downloadable cryptographic certificates.`,
    type: 'Kairo Originals',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&auto=format&fit=crop&q=80',
    organizerName: 'KAIRO Editorial Guild & Grand Council',
    theme: 'Astral Horizons & Celestial Dimensions',
    category: 'High Fantasy & Space Opera',
    eligibility: 'Open to all writers and creators worldwide. Authors of all levels welcome.',
    ageRestriction: 'All Ages (13+)',
    countryEligibility: 'Global / Worldwide',
    language: 'English',
    maxParticipants: 500,
    minParticipants: 10,
    targetAudience: 'both',
    visibility: 'public',
    status: 'VOTING_OPEN',
    timeline: {
      registrationOpens: '2026-08-01T00:00:00Z',
      registrationCloses: '2026-08-20T23:59:59Z',
      submissionOpens: '2026-08-10T00:00:00Z',
      submissionDeadline: '2026-09-05T23:59:59Z',
      votingStarts: '2026-09-06T00:00:00Z',
      votingEnds: '2026-09-25T23:59:59Z',
      judgingStarts: '2026-09-10T00:00:00Z',
      judgingEnds: '2026-09-28T23:59:59Z',
      finalistAnnouncementDate: '2026-09-22T18:00:00Z',
      resultDeclarationDate: '2026-09-30T12:00:00Z',
      winnerAnnouncementTime: '12:00 UTC',
      programEndDate: '2026-10-05T23:59:59Z'
    },
    rules: {
      fullRules: `1. All submitted manuscripts must be original works written exclusively by the entrant.
2. Stories must fit within the high fantasy, speculative fiction, or celestial anime space opera categories.
3. Chapters must meet a minimum word count of 1,500 words and max 15,000 words.
4. AI-generated text must be clearly disclosed in the author note. Fully synthetic automated submissions without original authorial substance will be disqualified.
5. Collaborative entries are permitted up to 2 co-authors.
6. Entrants must adhere to the KAIRO Community Guidelines (no hate speech, excessive gore, or illicit content).`,
      participationRequirements: 'Must have an active Kairo account, agree to official rules, and complete profile registration.',
      allowedContent: 'Serialized fiction, prologue chapters, character profiles, world codex entries, original illustrations.',
      prohibitedContent: 'Plagiarized content, unauthorized fanfiction of copyrighted franchises, hateful or explicit pornography.',
      wordLimitMin: 1500,
      wordLimitMax: 15000,
      chapterLimitMin: 1,
      chapterLimitMax: 10,
      imageRequirements: 'PNG or JPG under 10MB for custom chapter covers',
      fileRequirements: 'Direct manuscript entry through Kairo Studio or connected published story',
      submissionLimitPerUser: 2,
      teamParticipationAllowed: true,
      eligibilityCriteria: 'Any registered creator above 13 years old from any region.',
      disqualificationConditions: 'Plagiarism, bot voting manipulation, offensive conduct, failure to disclose automated tools.',
      copyrightRequirements: 'Authors retain 100% intellectual property ownership.',
      aiContentPolicy: 'Allowed with disclosure',
      plagiarismPolicy: 'Zero tolerance. Detected plagiarism leads to immediate disqualification and platform suspension.',
      judgingRules: 'Scored by Grand Council judges on Story Quality, Worldbuilding, Character Arc, and Narrative Flow.',
      requireRulesAgreement: true
    },
    prizes: [
      {
        id: 'prz_s1_1st',
        placement: '1st Place — Grand Champion',
        title: 'The Celestial Crown & Kairo Original Deal',
        description: '$5,000 USD cash prize, official Kairo Original serialized publishing deal, animated cover art, verified Grand Champion profile badge.',
        cashAmount: 5000,
        currency: 'USD',
        xpReward: 50000,
        kairoCoins: 10000,
        badgeKey: 'kairo_champion_s1',
        badgeTitle: 'Kairo Grand Champion S1',
        badgeIcon: 'Trophy',
        featuredPlacementDays: 60,
        kairoOriginalStatus: true,
        certificateAwarded: true,
        premiumBenefits: 'Lifetime Kairo VIP Author status & editorial mentorship'
      },
      {
        id: 'prz_s1_2nd',
        placement: '2nd Place — Runner-Up',
        title: 'The Astral Laureate Award',
        description: '$3,000 USD cash prize, 30-day banner feature, verified Silver Laureate badge, 25,000 XP.',
        cashAmount: 3000,
        currency: 'USD',
        xpReward: 25000,
        kairoCoins: 5000,
        badgeKey: 'kairo_runnerup_s1',
        badgeTitle: 'Kairo Silver Laureate S1',
        badgeIcon: 'Award',
        featuredPlacementDays: 30,
        certificateAwarded: true
      },
      {
        id: 'prz_s1_3rd',
        placement: '3rd Place — Bronze Luminary',
        title: 'The Starlight Luminary',
        description: '$1,500 USD cash prize, 15-day showcase, verified Bronze Luminary badge, 15,000 XP.',
        cashAmount: 1500,
        currency: 'USD',
        xpReward: 15000,
        kairoCoins: 2500,
        badgeKey: 'kairo_bronze_s1',
        badgeTitle: 'Kairo Bronze Luminary S1',
        badgeIcon: 'Medal',
        featuredPlacementDays: 15,
        certificateAwarded: true
      },
      {
        id: 'prz_s1_world',
        placement: 'Best Worldbuilding Award',
        title: 'Master Architect of the Cosmos',
        description: '$500 USD cash prize + custom interactive 3D map banner for universe codex.',
        cashAmount: 500,
        currency: 'USD',
        xpReward: 10000,
        kairoCoins: 1500,
        badgeKey: 'world_architect_s1',
        badgeTitle: 'Master Worldbuilder S1',
        badgeIcon: 'Globe',
        certificateAwarded: true
      },
      {
        id: 'prz_s1_reader',
        placement: "Reader's Choice & Community Favorite",
        title: 'The People’s Resonance Trophy',
        description: 'Voted directly by the reading community. Official community favorite badge and homepage spotlight.',
        xpReward: 8000,
        kairoCoins: 2000,
        badgeKey: 'community_favorite_s1',
        badgeTitle: 'Community Favorite S1',
        badgeIcon: 'Heart',
        featuredPlacementDays: 20,
        certificateAwarded: true
      }
    ],
    judgingConfig: {
      enabled: true,
      criteria: [
        { id: 'crit_quality', name: 'Story Quality & Prose', weightPercent: 30, description: 'Narrative craftsmanship, sentence rhythm, and emotional resonance.' },
        { id: 'crit_originality', name: 'Originality & Concept', weightPercent: 20, description: 'Fresh perspective on speculative tropes and uniqueness.' },
        { id: 'crit_characters', name: 'Character Development', weightPercent: 20, description: 'Depth of motivations, internal conflicts, and memorable dialogue.' },
        { id: 'crit_world', name: 'Worldbuilding & Lore', weightPercent: 15, description: 'Consistency of magical or scientific systems and immersion.' },
        { id: 'crit_engagement', name: 'Community Engagement', weightPercent: 15, description: 'Reader discussions, comment activity, and fan resonance.' }
      ],
      blindJudging: false,
      formula: 'JUDGE_COMMUNITY_COMBINED',
      judgeWeightPercent: 70,
      communityWeightPercent: 30,
      judges: [
        {
          userId: 'usr_1',
          username: 'althea_v',
          displayName: 'Althea Vance',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          title: 'Senior Fantasy Novelist & Lore Architect'
        },
        {
          userId: 'usr_admin',
          username: 'admin',
          displayName: 'Master Admin',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
          title: 'KAIRO Platform Chief Editorial Director'
        }
      ]
    },
    votingConfig: {
      enabled: true,
      mode: 'ONE_PER_USER',
      maxVotesPerUser: 3,
      publicVoteCount: true,
      hideUntilDeadline: false,
      eligibility: 'ALL',
      minAccountAgeDays: 0
    },
    leaderboardConfig: {
      enabled: true,
      visibility: 'PUBLIC',
      realTime: true,
      rankBy: 'COMBINED'
    },
    sponsors: [
      { id: 'sp_1', name: 'Astral Media Group', logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80', tier: 'Title Sponsor' },
      { id: 'sp_2', name: 'Anime Creators Guild', logoUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=100&auto=format&fit=crop&q=80', tier: 'Partner' }
    ],
    faq: [
      { id: 'faq_1', question: 'Do I retain ownership of my story?', answer: 'Yes, 100%! All intellectual property remains the exclusive property of the author.' },
      { id: 'faq_2', question: 'Can I submit an existing Kairo story?', answer: 'Yes, you can link any existing story you published on Kairo or draft a fresh entry.' },
      { id: 'faq_3', question: 'How do community votes affect my score?', answer: 'Community votes account for 30% of the combined final score, while our Grand Council judges account for 70%.' }
    ],
    finalists: ['sub_astral_weaver', 'sub_chronicles_void'],
    results: {
      isLocked: false,
      winners: []
    },
    analytics: {
      views: 3420,
      uniqueVisitors: 2150,
      registrationsCount: 42,
      submissionsCount: 18,
      totalVotes: 894,
      completionRate: 78,
      sharesCount: 312,
      dailyRegistrations: [
        { date: '08-10', count: 4 },
        { date: '08-12', count: 9 },
        { date: '08-15', count: 12 },
        { date: '08-18', count: 8 },
        { date: '08-20', count: 9 }
      ],
      dailyVotes: [
        { date: '09-06', count: 110 },
        { date: '09-08', count: 240 },
        { date: '09-10', count: 320 },
        { date: '09-12', count: 224 }
      ]
    },
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-09-14T00:00:00Z',
    createdByAdminId: 'usr_admin'
  },
  {
    id: 'prog_worldbuilding_codex',
    name: 'The Grand Worldbuilding Codex Challenge',
    slug: 'grand-worldbuilding-codex',
    tagline: 'Craft the most intricate fictional universe, geography, factions, and magical physics.',
    description: `### Build a Universe from Scratch
    
The Grand Worldbuilding Codex Challenge calls upon creators to expand the frontiers of imagination. Submit a comprehensive world codex detailing magic systems, chronologies, geo-political factions, and flora/fauna.`,
    type: 'Community Challenge',
    coverImage: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&auto=format&fit=crop&q=80',
    organizerName: 'KAIRO Lore Guild',
    theme: 'Original Micro-Universes & Magic Systems',
    category: 'Worldbuilding & Lore Codex',
    eligibility: 'Writers, artists, and lore architects.',
    language: 'English',
    maxParticipants: 300,
    minParticipants: 5,
    targetAudience: 'author-only',
    visibility: 'public',
    status: 'SUBMISSION_OPEN',
    timeline: {
      registrationOpens: '2026-09-01T00:00:00Z',
      registrationCloses: '2026-09-20T23:59:59Z',
      submissionOpens: '2026-09-05T00:00:00Z',
      submissionDeadline: '2026-10-01T23:59:59Z',
      votingStarts: '2026-10-02T00:00:00Z',
      votingEnds: '2026-10-15T23:59:59Z',
      judgingStarts: '2026-10-05T00:00:00Z',
      judgingEnds: '2026-10-18T23:59:59Z',
      finalistAnnouncementDate: '2026-10-16T12:00:00Z',
      resultDeclarationDate: '2026-10-20T12:00:00Z',
      programEndDate: '2026-10-25T23:59:59Z'
    },
    rules: {
      fullRules: 'Codex must include at least 2 locations, 2 factions, and 1 detailed magical or technological paradigm.',
      participationRequirements: 'Must link a Kairo World or submit a formatted lore dossier.',
      allowedContent: 'Lore articles, world maps, timeline chronologies, faction banners.',
      prohibitedContent: 'Direct copies of existing franchise wikis.',
      submissionLimitPerUser: 1,
      teamParticipationAllowed: true,
      eligibilityCriteria: 'All creators.',
      disqualificationConditions: 'Plagiarism or offensive content.',
      copyrightRequirements: 'Authors retain full rights.',
      aiContentPolicy: 'Assisted Only',
      plagiarismPolicy: 'Strictly prohibited.',
      judgingRules: 'Scored on immersion, coherence, creativity, and aesthetic map presentation.',
      requireRulesAgreement: true
    },
    prizes: [
      {
        id: 'prz_wb_1',
        placement: '1st Place — Grand Lore Master',
        title: 'The Worldweaver Scepter',
        description: '$1,500 USD + Universe Featured on Kairo Explore page for 6 months.',
        cashAmount: 1500,
        currency: 'USD',
        xpReward: 20000,
        badgeKey: 'grand_lore_master',
        badgeTitle: 'Grand Lore Master',
        badgeIcon: 'Globe',
        certificateAwarded: true
      }
    ],
    judgingConfig: {
      enabled: true,
      criteria: [
        { id: 'crit_lore_depth', name: 'Lore Depth & Coherence', weightPercent: 40 },
        { id: 'crit_lore_originality', name: 'Originality of Concept', weightPercent: 30 },
        { id: 'crit_lore_presentation', name: 'Visual & Map Presentation', weightPercent: 30 }
      ],
      blindJudging: true,
      formula: 'JUDGE_ONLY',
      judgeWeightPercent: 100,
      communityWeightPercent: 0,
      judges: [
        {
          userId: 'usr_admin',
          username: 'admin',
          displayName: 'Master Admin',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
          title: 'Head of Lore Operations'
        }
      ]
    },
    votingConfig: {
      enabled: false,
      mode: 'ONE_PER_USER',
      maxVotesPerUser: 1,
      publicVoteCount: false,
      hideUntilDeadline: true,
      eligibility: 'ALL'
    },
    leaderboardConfig: {
      enabled: true,
      visibility: 'FINAL_ONLY',
      realTime: false,
      rankBy: 'JUDGE_SCORE'
    },
    sponsors: [],
    faq: [],
    finalists: [],
    results: { isLocked: false, winners: [] },
    analytics: {
      views: 1205,
      uniqueVisitors: 840,
      registrationsCount: 24,
      submissionsCount: 9,
      totalVotes: 0,
      completionRate: 65,
      sharesCount: 88
    },
    createdAt: '2026-08-25T10:00:00Z',
    updatedAt: '2026-09-14T00:00:00Z',
    createdByAdminId: 'usr_admin'
  },
  {
    id: 'prog_sakura_48h',
    name: 'Chronicles of the Sakura: 48-Hour Light Novel Sprint',
    slug: 'sakura-48h-novel-sprint',
    tagline: 'Write and publish a complete one-shot romance or fantasy chapter in 48 hours.',
    description: `A fast-paced creative sprint for quick pens and bright ideas. Theme revealed when the timer starts!`,
    type: 'Story Challenge',
    coverImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1600&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&auto=format&fit=crop&q=80',
    organizerName: 'KAIRO Flash Fiction Collective',
    theme: 'Spring Rebirth & Timeless Bonds',
    category: 'Flash Fiction & One-Shot',
    eligibility: 'Open to all writers.',
    language: 'English',
    maxParticipants: 1000,
    minParticipants: 20,
    targetAudience: 'author-only',
    visibility: 'public',
    status: 'UPCOMING',
    timeline: {
      registrationOpens: '2026-09-15T00:00:00Z',
      registrationCloses: '2026-10-01T18:00:00Z',
      submissionOpens: '2026-10-02T00:00:00Z',
      submissionDeadline: '2026-10-04T00:00:00Z',
      votingStarts: '2026-10-04T01:00:00Z',
      votingEnds: '2026-10-10T23:59:59Z',
      judgingStarts: '2026-10-05T00:00:00Z',
      judgingEnds: '2026-10-12T23:59:59Z',
      finalistAnnouncementDate: '2026-10-11T12:00:00Z',
      resultDeclarationDate: '2026-10-14T12:00:00Z',
      programEndDate: '2026-10-16T23:59:59Z'
    },
    rules: {
      fullRules: 'Manuscript must be written during the 48-hour sprint window. Max 4,000 words.',
      participationRequirements: 'Must register before October 1st.',
      allowedContent: 'Original prose, standalone chapters.',
      prohibitedContent: 'Pre-written stories.',
      submissionLimitPerUser: 1,
      teamParticipationAllowed: false,
      eligibilityCriteria: 'All registered writers.',
      disqualificationConditions: 'Submitting prior works or plagiarism.',
      copyrightRequirements: 'Author retains all rights.',
      aiContentPolicy: 'Strictly Prohibited',
      plagiarismPolicy: 'Zero tolerance.',
      judgingRules: 'Judged on pacing, emotional impact, and dialogue.',
      requireRulesAgreement: true
    },
    prizes: [
      {
        id: 'prz_sakura_1',
        placement: '1st Place — Sakura Champion',
        title: 'The Sakura Quill',
        description: '$1,000 USD + Verified Speed Author Trophy Badge',
        cashAmount: 1000,
        currency: 'USD',
        xpReward: 15000,
        badgeKey: 'sakura_champion',
        badgeTitle: 'Sakura Sprint Champion',
        badgeIcon: 'Zap',
        certificateAwarded: true
      }
    ],
    judgingConfig: {
      enabled: true,
      criteria: [
        { id: 'crit_s_pacing', name: 'Pacing & Flow', weightPercent: 50 },
        { id: 'crit_s_emotion', name: 'Emotional Impact', weightPercent: 50 }
      ],
      blindJudging: false,
      formula: 'WEIGHTED_CRITERIA',
      judgeWeightPercent: 100,
      communityWeightPercent: 0,
      judges: []
    },
    votingConfig: {
      enabled: true,
      mode: 'ONE_PER_USER',
      maxVotesPerUser: 1,
      publicVoteCount: true,
      hideUntilDeadline: false,
      eligibility: 'ALL'
    },
    leaderboardConfig: {
      enabled: true,
      visibility: 'PUBLIC',
      realTime: true,
      rankBy: 'SCORE'
    },
    sponsors: [],
    faq: [],
    finalists: [],
    results: { isLocked: false, winners: [] },
    analytics: {
      views: 540,
      uniqueVisitors: 410,
      registrationsCount: 68,
      submissionsCount: 0,
      totalVotes: 0,
      completionRate: 0,
      sharesCount: 142
    },
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-14T00:00:00Z',
    createdByAdminId: 'usr_admin'
  },
  {
    id: 'prog_arcane_s0',
    name: 'Arcane Resonance: Season Zero',
    slug: 'arcane-resonance-season-zero',
    tagline: 'The inaugural fantasy debut contest where legends were forged.',
    description: `Season Zero of the Kairo creative tournament brought together over 300 authors and 10,000 readers in celebration of dark fantasy and magical realism.`,
    type: 'Writing Competition',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    organizerName: 'KAIRO Editorial Guild',
    theme: 'Dark Magic & Arcane Bonds',
    category: 'Dark Fantasy',
    eligibility: 'Global creators',
    language: 'English',
    maxParticipants: 400,
    minParticipants: 10,
    targetAudience: 'both',
    visibility: 'public',
    status: 'COMPLETED',
    timeline: {
      registrationOpens: '2025-10-01T00:00:00Z',
      registrationCloses: '2025-10-20T23:59:59Z',
      submissionOpens: '2025-10-10T00:00:00Z',
      submissionDeadline: '2025-11-05T23:59:59Z',
      votingStarts: '2025-11-06T00:00:00Z',
      votingEnds: '2025-11-20T23:59:59Z',
      judgingStarts: '2025-11-10T00:00:00Z',
      judgingEnds: '2025-11-25T23:59:59Z',
      finalistAnnouncementDate: '2025-11-22T12:00:00Z',
      resultDeclarationDate: '2025-11-30T12:00:00Z',
      programEndDate: '2025-12-05T23:59:59Z'
    },
    rules: {
      fullRules: 'Standard KAIRO season rules applied.',
      participationRequirements: 'Published story on Kairo.',
      allowedContent: 'Fantasy serialized fiction.',
      prohibitedContent: 'Plagiarism.',
      submissionLimitPerUser: 1,
      teamParticipationAllowed: false,
      eligibilityCriteria: 'All authors.',
      disqualificationConditions: 'Violations of terms.',
      copyrightRequirements: 'Authors retain 100% IP.',
      aiContentPolicy: 'Allowed with disclosure',
      plagiarismPolicy: 'Zero tolerance.',
      judgingRules: 'Graded by council judges.',
      requireRulesAgreement: true
    },
    prizes: [
      {
        id: 'prz_s0_1',
        placement: '1st Place — Grand Victor',
        title: 'Arcane Resonance S0 Champion',
        description: '$3,000 USD + Grand Champion Verified Crest',
        cashAmount: 3000,
        currency: 'USD',
        xpReward: 30000,
        badgeKey: 'arcane_champion_s0',
        badgeTitle: 'Arcane S0 Champion',
        badgeIcon: 'Crown',
        certificateAwarded: true
      },
      {
        id: 'prz_s0_2',
        placement: '2nd Place — Arcane Laureate',
        title: 'Silver Scepter of Shadows',
        description: '$1,500 USD + Silver Laureate Crest',
        cashAmount: 1500,
        currency: 'USD',
        xpReward: 15000,
        badgeKey: 'arcane_runnerup_s0',
        badgeTitle: 'Arcane S0 Laureate',
        badgeIcon: 'Award',
        certificateAwarded: true
      }
    ],
    judgingConfig: {
      enabled: true,
      criteria: [
        { id: 'crit_s0_q', name: 'Prose & Tone', weightPercent: 50 },
        { id: 'crit_s0_w', name: 'World & Magic', weightPercent: 50 }
      ],
      blindJudging: false,
      formula: 'WEIGHTED_CRITERIA',
      judgeWeightPercent: 100,
      communityWeightPercent: 0,
      judges: []
    },
    votingConfig: {
      enabled: true,
      mode: 'ONE_PER_USER',
      maxVotesPerUser: 1,
      publicVoteCount: true,
      hideUntilDeadline: false,
      eligibility: 'ALL'
    },
    leaderboardConfig: {
      enabled: true,
      visibility: 'PUBLIC',
      realTime: false,
      rankBy: 'SCORE'
    },
    sponsors: [],
    faq: [],
    finalists: ['sub_astral_weaver'],
    results: {
      publishedAt: '2025-11-30T12:00:00Z',
      declaredByAdminId: 'usr_admin',
      isLocked: true,
      remarks: 'A landmark inaugural competition featuring remarkable prose and mythic depth.',
      winners: [
        {
          prizeId: 'prz_s0_1',
          placementTitle: '1st Place — Grand Victor',
          submissionId: 'sub_astral_weaver',
          userId: 'usr_1',
          username: 'althea_v',
          displayName: 'Althea Vance',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          storyTitle: 'The Astral Weaver',
          specialAwardName: 'Grand Victor',
          certificateId: 'cert_s0_althea'
        }
      ]
    },
    analytics: {
      views: 9800,
      uniqueVisitors: 6400,
      registrationsCount: 140,
      submissionsCount: 65,
      totalVotes: 3200,
      completionRate: 92,
      sharesCount: 940
    },
    createdAt: '2025-09-15T10:00:00Z',
    updatedAt: '2025-12-05T00:00:00Z',
    createdByAdminId: 'usr_admin'
  }
];

export const initialParticipants: ProgramParticipant[] = [
  {
    id: 'part_althea_s1',
    programId: 'prog_kairo_originals_s1',
    userId: 'usr_1',
    username: 'althea_v',
    displayName: 'Althea Vance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    email: 'althea@kairo.app',
    userType: 'AUTHOR',
    status: 'APPROVED',
    submissionStatus: 'APPROVED',
    registeredAt: '2026-08-05T14:20:00Z',
    rulesAgreedAt: '2026-08-05T14:20:00Z',
    rulesAgreementCheckbox: true,
    voteCount: 420,
    finalScore: 94.5,
    isFinalist: true,
    adminNotes: 'Master tier fantasy author, verified portfolio.'
  },
  {
    id: 'part_ren_s1',
    programId: 'prog_kairo_originals_s1',
    userId: 'usr_2',
    username: 'ren_takahashi',
    displayName: 'Ren Takahashi',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    email: 'ren@kairo.app',
    userType: 'AUTHOR',
    status: 'APPROVED',
    submissionStatus: 'APPROVED',
    registeredAt: '2026-08-08T09:15:00Z',
    rulesAgreedAt: '2026-08-08T09:15:00Z',
    rulesAgreementCheckbox: true,
    voteCount: 312,
    finalScore: 89.2,
    isFinalist: true,
    adminNotes: 'Cyberpunk fantasy specialist.'
  },
  {
    id: 'part_sakura_s1',
    programId: 'prog_kairo_originals_s1',
    userId: 'usr_3',
    username: 'sakura_dreamer',
    displayName: 'Sakura Dreamer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    email: 'sakura@kairo.app',
    userType: 'BOTH',
    status: 'APPROVED',
    submissionStatus: 'SUBMITTED',
    registeredAt: '2026-08-12T11:45:00Z',
    rulesAgreedAt: '2026-08-12T11:45:00Z',
    rulesAgreementCheckbox: true,
    voteCount: 162,
    finalScore: 83.0,
    isFinalist: false
  }
];

export const initialSubmissions: ProgramSubmission[] = [
  {
    id: 'sub_astral_weaver',
    programId: 'prog_kairo_originals_s1',
    participantId: 'part_althea_s1',
    userId: 'usr_1',
    username: 'althea_v',
    displayName: 'Althea Vance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    title: 'The Astral Weaver: Celestial Resonance',
    tagline: 'When the twin moons synchronize, an apprentice glyph-weaver uncovers the fracture in the firmament.',
    summary: 'A complete serialized chapter arc following Lyra as she navigates the Floating Isles of Aethelgard and taps into the forbidden resonance of the Whispering Rift.',
    submissionType: 'STORY',
    storyId: 'story_1',
    storySlug: 'the-astral-weaver',
    content: `The twin moons of Aethelgard hung in razor-thin alignment, their violet light bleeding through the crystalline spires of the Upper Citadel. Lyra pressed her palms against the rune-stone, feeling the hum of celestial mana vibrate through her bones...`,
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    wordCount: 8420,
    status: 'FINALIST',
    isFeatured: true,
    isLocked: false,
    votes: 420,
    votedUserIds: ['usr_2', 'usr_3', 'usr_admin'],
    scores: {
      judgeScores: {
        'usr_admin': {
          judgeId: 'usr_admin',
          judgeName: 'Master Admin',
          criteriaScores: {
            'crit_quality': 95,
            'crit_originality': 92,
            'crit_characters': 94,
            'crit_world': 98,
            'crit_engagement': 90
          },
          weightedScore: 94.2,
          feedback: 'Exceptional prose cadence and breath-taking atmospheric description. Lyra is an instantly compelling protagonist.',
          submittedAt: '2026-09-12T16:30:00Z'
        }
      },
      averageJudgeScore: 94.2,
      communityScore: 95.0,
      adminScore: 95.0,
      finalWeightedScore: 94.5
    },
    adminNotes: 'Top contender for Grand Champion.',
    createdAt: '2026-08-15T18:00:00Z',
    updatedAt: '2026-09-12T16:30:00Z'
  },
  {
    id: 'sub_chronicles_void',
    programId: 'prog_kairo_originals_s1',
    participantId: 'part_ren_s1',
    userId: 'usr_2',
    username: 'ren_takahashi',
    displayName: 'Ren Takahashi',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    title: 'Echoes of Neo-Kyoto: The Fractured Core',
    tagline: 'Where neon cyber-enhancements clash with forgotten Shinto guardian spirits.',
    summary: 'A high-octane dark fantasy chapter detailing the awakening of the Void Guardian beneath the subterranean power plants of Sector 7.',
    submissionType: 'STORY',
    storyId: 'story_2',
    storySlug: 'chronicles-of-the-void-blade',
    content: `Rain hammered down upon the carbon-fiber rooftops of Neo-Kyoto. In the alley below, Jin unsheathed the Void Blade. The steel hissed as it met the ambient moisture, crackling with azure plasma...`,
    coverImage: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    wordCount: 7150,
    status: 'FINALIST',
    isFeatured: true,
    isLocked: false,
    votes: 312,
    votedUserIds: ['usr_1', 'usr_3'],
    scores: {
      judgeScores: {
        'usr_admin': {
          judgeId: 'usr_admin',
          judgeName: 'Master Admin',
          criteriaScores: {
            'crit_quality': 88,
            'crit_originality': 90,
            'crit_characters': 86,
            'crit_world': 92,
            'crit_engagement': 88
          },
          weightedScore: 89.0,
          feedback: 'Incredible action choreography and kinetic energy. The blend of folklore and tech is electric.',
          submittedAt: '2026-09-12T17:00:00Z'
        }
      },
      averageJudgeScore: 89.0,
      communityScore: 89.5,
      finalWeightedScore: 89.2
    },
    adminNotes: 'Strong runner-up candidate.',
    createdAt: '2026-08-18T20:10:00Z',
    updatedAt: '2026-09-12T17:00:00Z'
  },
  {
    id: 'sub_sakura_whisper',
    programId: 'prog_kairo_originals_s1',
    participantId: 'part_sakura_s1',
    userId: 'usr_3',
    username: 'sakura_dreamer',
    displayName: 'Sakura Dreamer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    title: 'The Petals of Nevermore',
    tagline: 'A quiet romance woven across reincarnation and forgotten dreams.',
    summary: 'An evocative light novel chapter exploring the reunion of two lost mages beneath the eternal cherry blossoms.',
    submissionType: 'TEXT',
    content: `They met when the cherry trees were heavy with dew. Neither spoke of the previous life, but the silver ribbon around her wrist was answer enough...`,
    coverImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&auto=format&fit=crop&q=80',
    wordCount: 4200,
    status: 'APPROVED',
    isFeatured: false,
    isLocked: false,
    votes: 162,
    votedUserIds: ['usr_1'],
    scores: {
      judgeScores: {},
      averageJudgeScore: 82.0,
      communityScore: 84.0,
      finalWeightedScore: 83.0
    },
    createdAt: '2026-08-22T14:00:00Z',
    updatedAt: '2026-09-08T10:00:00Z'
  }
];

export const initialVotes: ProgramVote[] = [
  { id: 'vote_1', programId: 'prog_kairo_originals_s1', submissionId: 'sub_astral_weaver', userId: 'usr_admin', username: 'admin', votedAt: '2026-09-07T10:00:00Z', ipAddress: '127.0.0.1' },
  { id: 'vote_2', programId: 'prog_kairo_originals_s1', submissionId: 'sub_astral_weaver', userId: 'usr_2', username: 'ren_takahashi', votedAt: '2026-09-08T11:20:00Z', ipAddress: '127.0.0.1' },
  { id: 'vote_3', programId: 'prog_kairo_originals_s1', submissionId: 'sub_chronicles_void', userId: 'usr_1', username: 'althea_v', votedAt: '2026-09-08T15:40:00Z', ipAddress: '127.0.0.1' },
  { id: 'vote_4', programId: 'prog_kairo_originals_s1', submissionId: 'sub_sakura_whisper', userId: 'usr_1', username: 'althea_v', votedAt: '2026-09-09T09:00:00Z', ipAddress: '127.0.0.1' }
];

export const initialAnnouncements: ProgramAnnouncement[] = [
  {
    id: 'ann_s1_open',
    programId: 'prog_kairo_originals_s1',
    title: 'Registration & Submissions Now Live!',
    content: 'Kairo Originals Season 01 has officially launched! Writers worldwide can submit their serialized light novels for the $10,000 grand pool.',
    type: 'REGISTRATION_OPENING',
    sendInAppNotification: true,
    publishedAt: '2026-08-01T00:00:00Z',
    socialMediaCopy: '✨ Kairo Originals Season 01 is LIVE! Submit your light novel manuscript for the $10,000 prize pool and an official serial contract. #KairoOriginals #LightNovel'
  },
  {
    id: 'ann_s1_voting',
    programId: 'prog_kairo_originals_s1',
    title: 'Community Voting Phase is Now Live!',
    content: 'The submission window is closed, and community voting is open! Readers can cast up to 3 votes for their favorite celestial stories.',
    type: 'VOTING_OPEN',
    sendInAppNotification: true,
    publishedAt: '2026-09-06T00:00:00Z',
    socialMediaCopy: '🗳️ Voting is open for Kairo Originals Season 01! Read the top manuscripts and support your favorite writers today! #KairoAnime #Storytelling'
  }
];

export const initialAuditLogs: ProgramAuditLog[] = [
  {
    id: 'log_1',
    programId: 'prog_kairo_originals_s1',
    action: 'PROGRAM_CREATED',
    actorId: 'usr_admin',
    actorUsername: 'admin',
    targetType: 'PROGRAM',
    targetId: 'prog_kairo_originals_s1',
    targetName: 'Kairo Originals — Season 01: Astral Horizons',
    newValue: { status: 'UPCOMING' },
    timestamp: '2026-07-20T10:00:00Z',
    ipAddress: '127.0.0.1'
  },
  {
    id: 'log_2',
    programId: 'prog_kairo_originals_s1',
    action: 'STATUS_OVERRIDE',
    actorId: 'usr_admin',
    actorUsername: 'admin',
    targetType: 'PROGRAM',
    targetId: 'prog_kairo_originals_s1',
    targetName: 'Kairo Originals — Season 01',
    previousValue: 'SUBMISSION_OPEN',
    newValue: 'VOTING_OPEN',
    timestamp: '2026-09-06T00:00:00Z',
    ipAddress: '127.0.0.1'
  },
  {
    id: 'log_3',
    programId: 'prog_kairo_originals_s1',
    action: 'MARK_FINALIST',
    actorId: 'usr_admin',
    actorUsername: 'admin',
    targetType: 'SUBMISSION',
    targetId: 'sub_astral_weaver',
    targetName: 'The Astral Weaver',
    newValue: { isFinalist: true, status: 'FINALIST' },
    timestamp: '2026-09-12T18:00:00Z',
    ipAddress: '127.0.0.1'
  }
];

export const initialCertificates: ProgramCertificate[] = [
  {
    id: 'cert_s0_althea',
    programId: 'prog_arcane_s0',
    programName: 'Arcane Resonance: Season Zero',
    recipientUserId: 'usr_1',
    recipientName: 'Althea Vance',
    recipientUsername: 'althea_v',
    awardTitle: '1st Place — Grand Victor',
    placement: '1st Place',
    issuedDate: '2025-11-30',
    verificationHash: 'kr-cert-s0-94b72c918e',
    certificateUrl: '/certificates/cert_s0_althea'
  }
];
