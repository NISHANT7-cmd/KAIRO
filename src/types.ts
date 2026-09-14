export type UserRole = 'USER' | 'WRITER' | 'MODERATOR' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  avatarUrl?: string;
  bio: string;
  role: UserRole;
  status?: UserStatus;
  isVerifiedWriter?: boolean;
  xp: number;
  level: number;
  readingStreak?: number;
  streakDays?: number;
  lastActiveDate: string;
  followersCount: number;
  followingCount: number;
  chaptersReadCount?: number;
  totalReads: number;
  favoriteGenres: string[];
  favoriteThemes: string[];
  createdAt: string;
  publishedStoriesCount?: number;
}

export interface PublicUserProfile {
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
}

export interface AdminPlatformStats {
  totalUsers: number;
  totalWriters: number;
  totalStories: number;
  totalChapters: number;
  totalReads: number;
  totalUniverses: number;
  totalCommunities: number;
  totalTheories: number;
  totalPosts: number;
  recentRegistrations: User[];
}

export type StoryType = 
  | 'Original Fiction' 
  | 'Anime-Inspired' 
  | 'Light Novel' 
  | 'Manga-Style Story' 
  | 'Short Story' 
  | 'Serialized Novel';

export type StoryStatus = 'Draft' | 'Ongoing' | 'Completed' | 'Scheduled' | 'Published';

export type AgeRating = 'Everyone' | 'Teen' | 'Mature';

export interface Story {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  genre: string;
  tags: string[];
  language: string;
  ageRating: AgeRating;
  storyType: StoryType;
  status: StoryStatus;
  views: number;
  likes: number;
  rating: number;
  ratingCount: number;
  universeId?: string;
  universeName?: string;
  chaptersCount: number;
  liveReadersCount?: number;
  featured?: boolean;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  subtitle?: string;
  content: string;
  authorNote?: string;
  wordCount: number;
  readingTime: number; // in minutes
  status: 'Published' | 'Draft' | 'Scheduled' | 'draft' | 'published' | 'scheduled';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingProgress {
  id: string;
  userId: string;
  storyId: string;
  storyTitle: string;
  storyCover: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  totalChapters: number;
  progressPercent: number;
  lastPosition: number;
  lastReadAt: string;
}

export interface LibraryItem {
  id: string;
  userId: string;
  storyId: string;
  listType: 'reading' | 'saved' | 'completed' | 'following';
  addedAt: string;
  story?: Story;
  readingProgress?: ReadingProgress;
}

export interface Review {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  storyId: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterComment {
  id: string;
  chapterId: string;
  storyId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  likes: number;
  likedByUsers: string[];
  parentId?: string | null;
  replies?: ChapterComment[];
  reported?: boolean;
  createdAt: string;
}

export type CommunityType = 'public' | 'story' | 'author' | 'genre' | 'fandom' | 'private' | 'creator' | 'anime';

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  bannerImage: string;
  iconImage: string;
  type: CommunityType;
  ownerId?: string;
  ownerName?: string;
  ownerRole?: string;
  linkedStoryId?: string;
  linkedStoryTitle?: string;
  linkedAuthorId?: string;
  isPrivate?: boolean;
  accessCode?: string;
  rules?: string[];
  moderators?: string[];
  categories?: string[];
  category?: string;
  membersCount?: number;
  memberCount?: number;
  activeMembersCount?: number;
  postsCount?: number;
  isMember?: boolean;
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string;
  expiresAt: string;
}

export type PostType = 'DISCUSSION' | 'POLL' | 'THEORY' | 'ART' | 'RECOMMENDATION' | 'QUESTION' | 'ANNOUNCEMENT' | 'TEXT';

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userDisplayName?: string;
  userAvatar: string;
  userRole?: string;
  isAuthor?: boolean;
  isMod?: boolean;
  content: string;
  likes: number;
  likedByUsers: string[];
  parentId?: string;
  quotes?: string;
  reactions?: Record<string, string[]>;
  isSpoiler?: boolean;
  createdAt: string;
  replies?: CommunityComment[];
}

export interface CommunityPost {
  id: string;
  communityId: string;
  communityName?: string;
  communitySlug?: string;
  communityType?: CommunityType;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  authorRole?: string;
  isAuthorOfStory?: boolean;
  isModerator?: boolean;
  title?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'poll' | 'quote' | 'recommendation' | string;
  poll?: Poll;
  type: PostType;
  pollOptions?: PollOption[];
  userVotedOptionId?: string;
  likes: number;
  likedByUsers: string[];
  disagreeCount?: number;
  agreeCount?: number;
  userVote?: 'agree' | 'disagree' | null;
  commentsCount: number;
  tag?: string;
  tags?: string[];
  isSpoiler?: boolean;
  spoilerChapter?: number;
  isPinned?: boolean;
  isLocked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
  linkedStoryId?: string;
  linkedStoryTitle?: string;
  linkedChapterNumber?: number;
  linkedCharacterName?: string;
  recommendation?: {
    title: string;
    category: 'Story' | 'Anime' | 'Manga' | 'Author';
    note?: string;
    linkSlug?: string;
  };
  quoteCard?: {
    text: string;
    author: string;
    storyTitle: string;
    chapterNumber?: number;
    theme?: string;
  };
  comments?: CommunityComment[];
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: 'general' | 'fandom' | 'genre' | 'creator' | 'theory' | 'spoiler' | 'event';
  onlineCount: number;
  totalMembers: number;
  isSpoiler?: boolean;
  spoilerWarning?: string;
  isEvent?: boolean;
  eventEndsAt?: string;
  eventTitle?: string;
  eventHost?: string;
  isLocked?: boolean;
  slowModeSeconds?: number;
  pinnedMessage?: string;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  displayName?: string;
  userAvatar: string;
  userRole?: string;
  isAuthor?: boolean;
  isMod?: boolean;
  content: string;
  mediaUrl?: string;
  isSpoiler?: boolean;
  storyCard?: {
    id: string;
    title: string;
    slug: string;
    cover: string;
    author: string;
    genre: string;
  };
  postCard?: {
    id: string;
    title: string;
    author: string;
    communityName: string;
  };
  quoteCard?: {
    text: string;
    author: string;
    story: string;
  };
  reactions?: Record<string, string[]>;
  replyTo?: {
    id: string;
    username: string;
    content: string;
  };
  createdAt: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  hostName: string;
  hostAvatar: string;
  hostRole: string;
  type: 'CHAPTER_LAUNCH' | 'QA' | 'CONTEST' | 'WORKSHOP' | 'WATCH_ALONG' | 'WORLD_REVEAL';
  startTime: string;
  endTime?: string;
  participantsCount: number;
  isParticipating?: boolean;
  communityId?: string;
  communityName?: string;
  roomSlug?: string;
  bannerUrl?: string;
  isLive?: boolean;
}

export interface CommunityContestSubmission {
  id: string;
  contestId: string;
  userId: string;
  username: string;
  userAvatar: string;
  title: string;
  description: string;
  mediaUrl?: string;
  votes: number;
  votedUserIds: string[];
  createdAt: string;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  type?: string;
  category?: string;
  prizeDescription?: string;
  prizeXP?: number;
  deadline?: string;
  bannerUrl?: string;
  status?: string;
  submissions?: Array<{
    id: string;
    title: string;
    content?: string;
    description?: string;
    mediaUrl?: string;
    authorName?: string;
    username?: string;
    votes?: number;
    userVoted?: boolean;
    createdAt?: string;
  }>;
}

export interface CommunityContest {
  id: string;
  title: string;
  description: string;
  category: 'Character Design' | 'Short Story' | 'Fan Art' | 'Theory' | 'World Building';
  deadline: string;
  entriesCount: number;
  prizeXP: number;
  bannerUrl: string;
  status: 'OPEN' | 'VOTING' | 'COMPLETED';
  submissions?: CommunityContestSubmission[];
  winner?: {
    username: string;
    title: string;
    userAvatar: string;
  };
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName?: string;
  senderAvatar: string;
  content: string;
  mediaUrl?: string;
  storyCard?: {
    id: string;
    title: string;
    slug: string;
    cover: string;
    author: string;
  };
  reactions?: Record<string, string[]>;
  createdAt: string;
}

export interface DirectMessageConversation {
  id: string;
  participantIds: string[];
  isGroup?: boolean;
  title?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  participants: Array<{
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    role?: string;
    isOnline?: boolean;
  }>;
}

export interface CustomReadingList {
  id: string;
  userId: string;
  username: string;
  title: string;
  description?: string;
  isPublic: boolean;
  storyIds: string[];
  stories?: Story[];
  likes: number;
  createdAt: string;
}

export interface QuoteSnippet {
  id: string;
  text: string;
  storyId: string;
  storySlug: string;
  storyTitle: string;
  chapterNumber: number;
  chapterTitle?: string;
  authorName: string;
  authorUsername: string;
  createdByUserId: string;
  createdByUsername: string;
  createdByAvatar: string;
  theme: 'cosmic' | 'crimson' | 'amber' | 'emerald' | 'minimal';
  likes: number;
  likedByUsers: string[];
  createdAt: string;
}

export interface ReportItem {
  id: string;
  targetType: 'post' | 'comment' | 'user' | 'chat_message' | 'community' | 'story' | 'theory';
  targetId: string;
  reportedByUserId: string;
  reportedByUsername: string;
  reason: string;
  category: 'Spam' | 'Harassment' | 'Hate' | 'Sexual content' | 'Violence' | 'Copyright' | 'Spoiler' | 'Impersonation' | 'Scam' | 'Other';
  notes?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export type TheoryStatus = 'UNCONFIRMED' | 'CONFIRMED' | 'DISPROVEN' | 'FAN_THEORY';

export interface Theory {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorUsername: string;
  authorAvatar: string;
  universeId?: string;
  storyId?: string;
  storyTitle?: string;
  chapterReference?: number;
  status: TheoryStatus;
  agreeCount: number;
  disagreeCount: number;
  userVote?: 'agree' | 'disagree';
  commentsCount: number;
  createdAt: string;
}

export interface CharacterArcMilestone {
  id: string;
  phase: string;
  title: string;
  description: string;
}

export interface Character {
  id: string;
  authorId?: string;
  storyId?: string;
  storyTitle?: string;
  worldId?: string;
  name: string;
  portrait: string;
  age: number | string;
  role: 'Protagonist' | 'Antagonist' | 'Companion' | 'Deity' | 'Rival' | 'Supporting' | 'Mentor';
  personality?: string;
  primaryPower: string;
  abilities?: string[];
  biography: string;
  arc?: CharacterArcMilestone[];
  status?: string;
  createdAt: string;
}

export interface CharacterRelationship {
  id: string;
  sourceCharacterId: string;
  sourceName: string;
  targetCharacterId: string;
  targetName: string;
  relationType: 'Rival' | 'Sister' | 'Enemy' | 'Ally' | 'Mentor' | 'Liege' | 'Companion';
  description: string;
}

export interface WorldLocation {
  id: string;
  name: string;
  description: string;
  tags: string[];
  imageUrl: string;
}

export interface WorldFaction {
  id: string;
  name: string;
  description: string;
  tags: string[];
  imageUrl: string;
}

export interface WorldChronologyEntry {
  id: string;
  timeLabel: string;
  title: string;
  description: string;
  isCurrentEra?: boolean;
  sortOrder: number;
}

export interface World {
  id: string;
  authorId?: string;
  name: string;
  slug?: string;
  tagline?: string;
  climate?: string;
  capital?: string;
  description: string;
  globalScale?: string;
  mainDocument?: string;
  locations?: WorldLocation[];
  factions?: WorldFaction[];
  magicTypes?: string[];
  techLevel?: string;
  chronology?: WorldChronologyEntry[];
  universeId?: string;
  bannerImage?: string;
  mapImageUrl?: string;
  createdAt: string;
}

export interface Universe {
  id: string;
  authorId?: string;
  creatorName?: string;
  creatorAvatar?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  overviewDoc?: string;
  magicSystemRules?: string;
  bannerImage: string;
  storiesCount: number;
  charactersCount: number;
  readersCount: number;
  rating: number;
  featuredCharacterIds?: string[];
  createdAt: string;
}

export interface AnimeWatchOption {
  platform: string;
  url: string;
  iconName: string;
}

export interface AnimeReview {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  rating: number;
  text: string;
  createdAt: string;
}

export type AnimeTrackingStatus = 'Watching' | 'Completed' | 'Plan to Watch' | 'On Hold' | 'Dropped';

export interface AnimeEntry {
  id: string;
  title: string;
  altTitles?: string;
  poster: string;
  synopsis: string;
  genres: string[];
  score: number;
  episodes: number;
  status: string;
  season: string;
  studio?: string;
  trailerUrl?: string;
  streamingService?: string;
  characters?: Array<{ name: string; role: string; portrait: string }>;
  whereToWatch?: AnimeWatchOption[];
  reviews?: AnimeReview[];
  userTracking?: {
    status: AnimeTrackingStatus;
    episodesWatched: number;
  };
  companionStorySlug?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'new_chapter' | 'comment_reply' | 'new_follower' | 'theory_reaction' | 'community_activity' | 'recommendation' | 'achievement' | 'author_announcement';
  title: string;
  message: string;
  linkUrl: string;
  isRead: boolean;
  createdAt: string;
}

export interface Badge {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: { current: number; max: number };
}

export interface CreatorStats {
  totalStories: number;
  publishedStories: number;
  draftsCount: number;
  followersCount: number;
  totalReads: number;
  readsOverTime?: Array<{ date: string; reads: number }>;
  chapterCompletionRate: number;
  avgReadingTimeMinutes: number;
  topChapters?: Array<{ title: string; reads: number; rating: number }>;
}

export interface SearchResult {
  stories: Story[];
  characters: Character[];
  communities: Community[];
  theories: Theory[];
  anime: AnimeEntry[];
  authors?: User[];
}

// ==========================================
// MASTER ADMIN PROGRAMS & COMPETITIONS TYPES
// ==========================================

export type ProgramType = 
  | 'Writing Competition'
  | 'Story Challenge'
  | 'Reader Challenge'
  | 'Author Contest'
  | 'Fan Art Competition'
  | 'Theory Competition'
  | 'Community Challenge'
  | 'Kairo Originals'
  | 'Seasonal Festival'
  | 'Author League'
  | 'Reader Tournament'
  | 'Voting Contest'
  | 'Special Event'
  | 'Custom Program'
  | string;

export type ProgramStatus = 
  | 'DRAFT'
  | 'UPCOMING'
  | 'REGISTRATION_OPEN'
  | 'SUBMISSION_OPEN'
  | 'VOTING_OPEN'
  | 'JUDGING'
  | 'FINALISTS_ANNOUNCED'
  | 'RESULTS_PENDING'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'CANCELLED';

export interface ProgramTimeline {
  registrationOpens: string;
  registrationCloses: string;
  submissionOpens: string;
  submissionDeadline: string;
  votingStarts: string;
  votingEnds: string;
  judgingStarts: string;
  judgingEnds: string;
  finalistAnnouncementDate: string;
  resultDeclarationDate: string;
  winnerAnnouncementTime?: string;
  programEndDate: string;
}

export interface ProgramRules {
  fullRules: string;
  participationRequirements: string;
  allowedContent: string;
  prohibitedContent: string;
  wordLimitMin?: number;
  wordLimitMax?: number;
  chapterLimitMin?: number;
  chapterLimitMax?: number;
  imageRequirements?: string;
  fileRequirements?: string;
  submissionLimitPerUser: number;
  teamParticipationAllowed: boolean;
  eligibilityCriteria: string;
  disqualificationConditions: string;
  copyrightRequirements: string;
  aiContentPolicy: 'Allowed with disclosure' | 'Strictly Prohibited' | 'Assisted Only' | 'Unrestricted';
  plagiarismPolicy: string;
  judgingRules: string;
  requireRulesAgreement: boolean;
}

export interface ProgramPrize {
  id: string;
  placement: string; // e.g. '1st Place', '2nd Place', '3rd Place', 'Best Character', 'Best Worldbuilding', 'Reader Choice', 'Breakthrough Creator'
  title: string;
  description: string;
  cashAmount?: number;
  currency?: string;
  xpReward?: number;
  kairoCoins?: number;
  badgeKey?: string;
  badgeTitle?: string;
  badgeIcon?: string;
  featuredPlacementDays?: number;
  kairoOriginalStatus?: boolean;
  certificateAwarded?: boolean;
  premiumBenefits?: string;
}

export interface JudgingCriterion {
  id: string;
  name: string;
  weightPercent: number; // e.g. 30 (representing 30%)
  description?: string;
}

export interface ProgramJudge {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  title?: string;
  assignedSubmissionIds?: string[];
}

export interface JudgingConfig {
  enabled: boolean;
  criteria: JudgingCriterion[];
  blindJudging: boolean;
  formula: 'WEIGHTED_CRITERIA' | 'JUDGE_COMMUNITY_COMBINED' | 'JUDGE_ONLY' | 'COMMUNITY_ONLY';
  judgeWeightPercent: number;
  communityWeightPercent: number;
  judges: ProgramJudge[];
}

export interface VotingConfig {
  enabled: boolean;
  mode: 'ONE_PER_USER' | 'MULTIPLE_VOTES' | 'DAILY_VOTE';
  maxVotesPerUser: number;
  publicVoteCount: boolean;
  hideUntilDeadline: boolean;
  eligibility: 'ALL' | 'AUTHORS_ONLY' | 'READERS_ONLY' | 'MIN_LEVEL';
  minAccountAgeDays?: number;
}

export interface LeaderboardConfig {
  enabled: boolean;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FINAL_ONLY';
  realTime: boolean;
  rankBy: 'VOTES' | 'SCORE' | 'JUDGE_SCORE' | 'COMBINED';
  hideRankingsUntil?: string;
}

export interface ProgramSponsor {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  tier?: string;
}

export interface ProgramFaq {
  id: string;
  question: string;
  answer: string;
}

export interface ProgramWinner {
  prizeId: string;
  placementTitle: string;
  submissionId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  storyTitle?: string;
  specialAwardName?: string;
  certificateId?: string;
}

export interface ProgramResults {
  publishedAt?: string;
  declaredByAdminId?: string;
  isLocked: boolean;
  remarks?: string;
  winners: ProgramWinner[];
}

export interface ProgramAnalytics {
  views: number;
  uniqueVisitors: number;
  registrationsCount: number;
  submissionsCount: number;
  totalVotes: number;
  completionRate: number;
  sharesCount: number;
  dailyRegistrations?: Array<{ date: string; count: number }>;
  dailyVotes?: Array<{ date: string; count: number }>;
}

export interface Program {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  type: ProgramType;
  customType?: string;
  coverImage: string;
  bannerImage: string;
  thumbnail: string;
  organizerName: string;
  theme: string;
  category: string;
  eligibility: string;
  ageRestriction?: string;
  countryEligibility?: string;
  language: string;
  maxParticipants: number;
  minParticipants: number;
  targetAudience: 'author-only' | 'reader-only' | 'both';
  visibility: 'public' | 'private' | 'invite-only';
  status: ProgramStatus;
  manualStatusOverride?: boolean;
  timeline: ProgramTimeline;
  rules: ProgramRules;
  prizes: ProgramPrize[];
  judgingConfig: JudgingConfig;
  votingConfig: VotingConfig;
  leaderboardConfig: LeaderboardConfig;
  sponsors: ProgramSponsor[];
  faq: ProgramFaq[];
  finalists: string[]; // submission IDs
  results: ProgramResults;
  analytics: ProgramAnalytics;
  createdAt: string;
  updatedAt: string;
  createdByAdminId: string;
}

export interface ProgramParticipant {
  id: string;
  programId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  email: string;
  userType: 'AUTHOR' | 'READER' | 'BOTH';
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'CANCELLED';
  submissionStatus: 'NONE' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'FINALIST' | 'WINNER' | 'DISQUALIFIED';
  registeredAt: string;
  rulesAgreedAt: string;
  rulesAgreementCheckbox: boolean;
  voteCount: number;
  finalScore: number;
  isFinalist: boolean;
  adminNotes?: string;
}

export interface ProgramSubmissionScore {
  judgeScores: Record<string, {
    judgeId: string;
    judgeName: string;
    criteriaScores: Record<string, number>;
    weightedScore: number;
    feedback?: string;
    submittedAt: string;
  }>;
  averageJudgeScore: number;
  communityScore: number;
  adminScore?: number;
  finalWeightedScore: number;
}

export interface ProgramSubmission {
  id: string;
  programId: string;
  participantId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  title: string;
  tagline?: string;
  summary: string;
  submissionType: 'STORY' | 'CHAPTER' | 'TEXT' | 'ARTWORK' | 'THEORY' | 'CONCEPT' | 'CUSTOM';
  storyId?: string;
  storySlug?: string;
  content?: string;
  mediaUrl?: string;
  coverImage?: string;
  customFields?: Record<string, string>;
  wordCount?: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'FINALIST' | 'DISQUALIFIED' | 'WINNER';
  isFeatured: boolean;
  isLocked: boolean;
  votes: number;
  votedUserIds: string[];
  scores: ProgramSubmissionScore;
  adminNotes?: string;
  correctionRequested?: string;
  disqualificationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramVote {
  id: string;
  programId: string;
  submissionId: string;
  userId: string;
  username: string;
  votedAt: string;
  ipAddress?: string;
  userAgent?: string;
  dayDate?: string;
}

export interface ProgramAnnouncement {
  id: string;
  programId: string;
  title: string;
  content: string;
  type: 
    | 'REGISTRATION_OPENING'
    | 'REGISTRATION_REMINDER'
    | 'SUBMISSION_REMINDER'
    | 'VOTING_OPEN'
    | 'VOTING_ENDING'
    | 'FINALISTS_ANNOUNCED'
    | 'RESULTS_ANNOUNCED'
    | 'WINNER_ANNOUNCEMENT'
    | 'PROGRAM_EXTENSION'
    | 'IMPORTANT_UPDATE';
  sendInAppNotification: boolean;
  scheduledFor?: string;
  publishedAt: string;
  socialMediaCopy?: string;
}

export interface ProgramAuditLog {
  id: string;
  programId: string;
  action: string;
  actorId: string;
  actorUsername: string;
  targetType?: 'PROGRAM' | 'PARTICIPANT' | 'SUBMISSION' | 'VOTE' | 'RESULTS' | 'SETTINGS';
  targetId?: string;
  targetName?: string;
  previousValue?: any;
  newValue?: any;
  timestamp: string;
  ipAddress?: string;
}

export interface ProgramCertificate {
  id: string;
  programId: string;
  programName: string;
  recipientUserId: string;
  recipientName: string;
  recipientUsername: string;
  awardTitle: string;
  placement: string;
  issuedDate: string;
  verificationHash: string;
  certificateUrl?: string;
}

export interface AdminProgramsSummary {
  activeProgramsCount: number;
  upcomingProgramsCount: number;
  draftProgramsCount: number;
  completedProgramsCount: number;
  archivedProgramsCount: number;
  totalParticipants: number;
  totalSubmissions: number;
  totalVotes: number;
  newUsersAcquired: number;
  currentEngagement: number;
  programsNeedingAttention: number;
}
