import { 
  User, Story, Chapter, ReadingProgress, LibraryItem, Review, 
  ChapterComment, Community, CommunityPost, Theory, Character, 
  CharacterRelationship, World, Universe, AnimeEntry, Notification, Badge, CreatorStats, SearchResult,
  AdminPlatformStats
} from '../types';

const TOKEN_KEY = 'kairo_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

const DEMO_FALLBACK_USERS: Array<User & { password: string }> = [
  {
    id: 'usr_admin',
    username: 'admin',
    email: 'admin@kairo.app',
    displayName: 'KAIRO Staff',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    bio: 'Platform administration and community oversight.',
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
    password: 'admin123',
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
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
    status: 'ACTIVE',
    isVerifiedWriter: false,
  }
];

function getLocalUsers(): Array<User & { password?: string }> {
  try {
    const raw = localStorage.getItem('kairo_client_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: Array<User & { password?: string }>) {
  try {
    localStorage.setItem('kairo_client_users', JSON.stringify(users));
  } catch {}
}

export function getActiveLocalUser(): User | null {
  try {
    const raw = localStorage.getItem('kairo_active_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveLocalUser(user: User | null) {
  try {
    if (user) {
      localStorage.setItem('kairo_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('kairo_active_user');
    }
  } catch {}
}

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public data?: any;

  constructor(message: string, status: number, code?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

function isServerFailure(err: any): boolean {
  if (!err) return false;
  if (err instanceof ApiError) {
    // 400, 401, 403 are intentional business/auth rejections - NOT transient server failures
    if (err.status === 400 || err.status === 401 || err.status === 403) {
      return false;
    }
    // 404, 500+ are server errors
    if (err.status >= 500 || err.status === 404) {
      return true;
    }
  }
  const msg = (err.message || '').toLowerCase();
  return msg.includes('network error') || 
         msg.includes('failed to fetch') || 
         msg.includes('status 404') || 
         msg.includes('status 500') || 
         msg.includes('status 502') || 
         msg.includes('status 503') || 
         msg.includes('status 504') || 
         msg.includes('html response') ||
         msg.includes('not reachable') ||
         msg.includes('endpoint not found');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err: any) {
    throw new ApiError(`Network error: ${err.message || 'Unable to connect to server'}`, 0, 'NETWORK_ERROR');
  }
  
  let data: any = null;
  const contentType = res.headers.get('content-type') || '';
  
  // Guard against HTML returned when serverless function is missing or router falls back to index.html
  if (contentType.includes('text/html')) {
    throw new ApiError(`API returned HTML response (endpoint unreachable or route not found): ${url}`, 404, 'HTML_RESPONSE');
  }

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await res.text();
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new ApiError(`API returned HTML response (endpoint unreachable or route not found): ${url}`, 404, 'HTML_RESPONSE');
      }
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: text };
        }
      }
    } catch (e: any) {
      if (e instanceof ApiError) throw e;
      if (e.message?.includes('HTML response')) throw e;
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg = data?.error || `Request failed with status ${res.status}`;
    const errorCode = data?.code;
    throw new ApiError(errorMsg, res.status, errorCode, data);
  }

  return (data ?? {}) as T;
}

export const api = {
  // Auth
  async signup(data: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    role?: 'USER' | 'WRITER';
    bio?: string;
    avatar?: string;
    favoriteGenres?: string[];
    favoriteThemes?: string[];
  }) {
    try {
      const res = await request<{ token: string; user: User }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setStoredToken(res.token);
      setActiveLocalUser(res.user);
      return res;
    } catch (err: any) {
      if (!isServerFailure(err)) {
        throw err;
      }
      // Vercel serverless offline/404/500 fallback
      const cleanUsername = data.username.toLowerCase().trim();
      const cleanEmail = data.email.toLowerCase().trim();

      const allUsers = [...DEMO_FALLBACK_USERS, ...getLocalUsers()];
      const exists = allUsers.some(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail);
      if (exists) {
        throw new Error('A user with this username or email already exists');
      }

      const assignedRole = data.role === 'WRITER' ? 'WRITER' : 'USER';
      const newUser: User = {
        id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        username: cleanUsername,
        email: cleanEmail,
        displayName: data.displayName?.trim() || data.username.trim(),
        avatar: data.avatar || (assignedRole === 'WRITER' 
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' 
          : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80'),
        bio: data.bio || (assignedRole === 'WRITER' ? 'Author & Storyteller on KAIRO.' : 'Story explorer on KAIRO.'),
        favoriteGenres: data.favoriteGenres || ['Fantasy', 'Anime-Inspired'],
        favoriteThemes: data.favoriteThemes || ['World Building'],
        role: assignedRole,
        status: 'ACTIVE',
        isVerifiedWriter: assignedRole === 'WRITER',
        xp: 0,
        level: 1,
        readingStreak: 1,
        lastActiveDate: new Date().toISOString(),
        followersCount: 0,
        followingCount: 0,
        totalReads: 0,
        createdAt: new Date().toISOString(),
      };

      const localUsers = getLocalUsers();
      localUsers.push({ ...newUser, password: data.password });
      saveLocalUsers(localUsers);

      const fallbackToken = 'kairo_tok_' + newUser.id + '_' + Date.now();
      setStoredToken(fallbackToken);
      setActiveLocalUser(newUser);

      return { token: fallbackToken, user: newUser };
    }
  },

  async login(loginId: string, password: string) {
    try {
      const res = await request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login: loginId, password }),
      });
      setStoredToken(res.token);
      setActiveLocalUser(res.user);
      return res;
    } catch (err: any) {
      if (!isServerFailure(err)) {
        throw err;
      }
      // Vercel serverless offline/404/500 fallback
      const cleanLogin = loginId.toLowerCase().trim();
      const allUsers = [...DEMO_FALLBACK_USERS, ...getLocalUsers()];
      const match = allUsers.find(
        u => (u.username.toLowerCase() === cleanLogin || u.email.toLowerCase() === cleanLogin)
      );

      if (!match || match.password !== password) {
        throw new Error('Invalid username/email or password');
      }

      if (match.status === 'SUSPENDED') {
        throw new Error('Access denied: Your account has been suspended by platform administration.');
      }

      const { password: _, ...cleanUser } = match;
      const fallbackToken = 'kairo_tok_' + cleanUser.id + '_' + Date.now();
      setStoredToken(fallbackToken);
      setActiveLocalUser(cleanUser as User);

      return { token: fallbackToken, user: cleanUser as User };
    }
  },

  async getMe() {
    const token = getStoredToken();
    if (!token) {
      throw new Error('No active token');
    }
    try {
      const res = await request<{ user: User }>('/api/auth/me');
      setActiveLocalUser(res.user);
      return res;
    } catch (err: any) {
      if (!isServerFailure(err)) {
        throw err;
      }
      const localUser = getActiveLocalUser();
      if (localUser) {
        return { user: localUser };
      }
      throw err;
    }
  },

  async updateProfile(updates: Partial<User>) {
    try {
      const res = await request<{ user: User }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      setActiveLocalUser(res.user);
      return res;
    } catch (err: any) {
      if (!isServerFailure(err)) {
        throw err;
      }
      const localUser = getActiveLocalUser();
      if (localUser) {
        const updatedUser = { ...localUser, ...updates };
        setActiveLocalUser(updatedUser);
        const users = getLocalUsers().map(u => u.id === localUser.id ? { ...u, ...updates } : u);
        saveLocalUsers(users);
        return { user: updatedUser };
      }
      throw err;
    }
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
      setActiveLocalUser(null);
    }
  },

  // Stories
  async getStories(params: { genre?: string; tag?: string; authorId?: string; universeId?: string; featured?: boolean; sort?: string; status?: string } = {}) {
    const q = new URLSearchParams();
    if (params.genre) q.set('genre', params.genre);
    if (params.tag) q.set('tag', params.tag);
    if (params.authorId) q.set('authorId', params.authorId);
    if (params.universeId) q.set('universeId', params.universeId);
    if (params.featured !== undefined) q.set('featured', String(params.featured));
    if (params.sort) q.set('sort', params.sort);
    if (params.status) q.set('status', params.status);
    return request<{ stories: Story[] }>(`/api/stories?${q.toString()}`);
  },

  async getStory(idOrSlug: string) {
    return request<{ story: Story; chapters: Chapter[]; reviews: Review[] }>(`/api/stories/${idOrSlug}`);
  },

  async createStory(story: Partial<Story>) {
    return request<{ story: Story }>('/api/stories', {
      method: 'POST',
      body: JSON.stringify(story),
    });
  },

  async updateStory(id: string, updates: Partial<Story>) {
    return request<{ story: Story }>(`/api/stories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteStory(id: string) {
    return request<{ success: boolean }>(`/api/stories/${id}`, { method: 'DELETE' });
  },

  async getStoryChapters(storyId: string) {
    return request<{ chapters: Chapter[] }>(`/api/stories/${storyId}/chapters`);
  },

  async createChapter(storyId: string, chapter: Partial<Chapter>) {
    return request<{ chapter: Chapter }>(`/api/stories/${storyId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(chapter),
    });
  },

  async saveChapter(chapter: Partial<Chapter>) {
    if (chapter.id) {
      return request<{ chapter: Chapter }>(`/api/chapters/${chapter.id}`, {
        method: 'PATCH',
        body: JSON.stringify(chapter),
      });
    } else if (chapter.storyId) {
      return request<{ chapter: Chapter }>(`/api/stories/${chapter.storyId}/chapters`, {
        method: 'POST',
        body: JSON.stringify(chapter),
      });
    }
    throw new Error('storyId is required');
  },

  async getChapter(chapterId: string) {
    return request<{ chapter: Chapter; story: Story; allChapters: Chapter[] }>(`/api/chapters/${chapterId}`);
  },

  async updateChapter(chapterId: string, updates: Partial<Chapter>) {
    return request<{ chapter: Chapter }>(`/api/chapters/${chapterId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Reading Progress & Library
  async saveReadingProgress(data: { storyId: string; chapterId: string; chapterNumber: number; progressPercent: number; lastPosition: number }) {
    return request<{ progress: ReadingProgress }>('/api/reading-progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getReadingProgress() {
    return request<{ progress: ReadingProgress[] }>('/api/reading-progress');
  },

  async getLibrary() {
    return request<{ library: (LibraryItem & { story: Story; readingProgress?: ReadingProgress })[] }>('/api/library');
  },

  async toggleLibrary(storyId: string, listType: 'reading' | 'saved' | 'completed' | 'following' = 'saved') {
    return request<{ inLibrary: boolean; item?: LibraryItem }>('/api/library/toggle', {
      method: 'POST',
      body: JSON.stringify({ storyId, listType }),
    });
  },

  async toggleLike(storyId: string) {
    return request<{ liked: boolean; totalLikes: number }>(`/api/stories/${storyId}/like`, { method: 'POST' });
  },

  async toggleFollow(authorId: string) {
    return request<{ following: boolean; totalFollowers: number }>(`/api/users/${authorId}/follow`, { method: 'POST' });
  },

  // Comments & Reviews
  async getChapterComments(chapterId: string) {
    return request<{ comments: ChapterComment[] }>(`/api/chapters/${chapterId}/comments`);
  },

  async addChapterComment(chapterId: string, storyId: string, content: string, parentId?: string) {
    return request<{ comment: ChapterComment }>(`/api/chapters/${chapterId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ storyId, content, parentId }),
    });
  },

  async likeComment(commentId: string) {
    return request<{ comment: ChapterComment }>(`/api/comments/${commentId}/like`, { method: 'POST' });
  },

  async addReview(storyId: string, rating: number, reviewText: string) {
    return request<{ review: Review }>(`/api/stories/${storyId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, reviewText }),
    });
  },

  // Communities & Community Posts
  async getCommunities() {
    return request<{ communities: Community[] }>('/api/communities');
  },

  async createCommunity(data: Partial<Community>) {
    return request<{ community: Community }>('/api/communities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async joinCommunity(id: string, accessCode?: string) {
    return request<{ success: boolean }>(`/api/communities/${id}/join`, {
      method: 'POST',
      body: JSON.stringify({ accessCode }),
    });
  },

  async leaveCommunity(id: string) {
    return request<{ success: boolean }>(`/api/communities/${id}/leave`, {
      method: 'POST',
    });
  },

  async getCommunityPosts() {
    return request<{ posts: CommunityPost[] }>('/api/posts');
  },

  async getCommunityPost(id: string) {
    return request<{ post: CommunityPost }>(`/api/posts/${id}`);
  },

  async getCommunity(slug: string) {
    return request<{ community: Community; posts: CommunityPost[] }>(`/api/communities/${slug}`);
  },

  async createCommunityPost(data: any) {
    const commId = data.communityId || 'comm_1';
    return request<{ post: CommunityPost }>(`/api/communities/${commId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async likeCommunityPost(postId: string) {
    return request<{ likes: number }>(`/api/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  async saveCommunityPost(postId: string) {
    return request<{ isSaved: boolean }>(`/api/posts/${postId}/save`, {
      method: 'POST',
    });
  },

  async followCommunityPost(postId: string) {
    return request<{ isFollowing: boolean }>(`/api/posts/${postId}/follow`, {
      method: 'POST',
    });
  },

  async voteCommunityPost(postId: string, vote: 'agree' | 'disagree') {
    return request<{ post: CommunityPost }>(`/api/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    });
  },

  async pinCommunityPost(postId: string, isPinned: boolean) {
    return request<{ success: boolean }>(`/api/posts/${postId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ isPinned }),
    });
  },

  async lockCommunityPost(postId: string, isLocked: boolean) {
    return request<{ success: boolean }>(`/api/posts/${postId}/lock`, {
      method: 'POST',
      body: JSON.stringify({ isLocked }),
    });
  },

  async deleteCommunityPost(postId: string) {
    return request<{ success: boolean }>(`/api/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  async voteCommunityPoll(postId: string, optionId: string) {
    return request<{ post: CommunityPost }>(`/api/posts/${postId}/poll-vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    });
  },

  async addCommunityPostComment(postId: string, data: string | { content: string; parentId?: string; quotes?: string; isSpoiler?: boolean }) {
    const payload = typeof data === 'string' ? { content: data } : data;
    return request<{ comment: any }>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async likeCommunityComment(postId: string, commentId: string) {
    return request<{ likes: number }>(`/api/posts/${postId}/comments/${commentId}/like`, {
      method: 'POST',
    });
  },

  async reactCommunityComment(postId: string, commentId: string, emoji: string) {
    return request<{ reactions: Record<string, number> }>(`/api/posts/${postId}/comments/${commentId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  },

  // Live Chat Rooms
  async getChatRooms() {
    return request<{ rooms: any[] }>('/api/chat/rooms');
  },

  async getChatRoom(slug: string) {
    return request<{ room: any; messages: any[] }>(`/api/chat/rooms/${slug}`);
  },

  async getChatMessages(roomId: string) {
    return request<{ messages: any[] }>(`/api/chat/rooms/${roomId}/messages`);
  },

  async sendChatMessage(roomId: string, data: any) {
    return request<{ message: any }>(`/api/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reactChatMessage(roomId: string, messageId: string, emoji: string) {
    return request<{ reactions: Record<string, number> }>(`/api/chat/rooms/${roomId}/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  },

  async pinChatMessage(roomId: string, message?: string) {
    return request<{ success: boolean }>(`/api/chat/rooms/${roomId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async lockChatRoom(roomId: string, isLocked: boolean) {
    return request<{ success: boolean }>(`/api/chat/rooms/${roomId}/lock`, {
      method: 'POST',
      body: JSON.stringify({ isLocked }),
    });
  },

  // Events & Contests
  async getEvents() {
    return request<{ events: any[] }>('/api/events');
  },

  async createEvent(data: any) {
    return request<{ event: any }>('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async joinEvent(eventId: string) {
    return request<{ success: boolean }>(`/api/events/${eventId}/join`, {
      method: 'POST',
    });
  },

  async getContests() {
    return request<{ contests: any[] }>('/api/contests');
  },

  async submitContestEntry(contestId: string, data: any) {
    return request<{ submission: any }>(`/api/contests/${contestId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async voteContestEntry(contestId: string, entryId: string) {
    return request<{ success: boolean }>(`/api/contests/${contestId}/entries/${entryId}/vote`, {
      method: 'POST',
    });
  },

  // Direct Messages
  async getConversations() {
    return request<{ conversations: any[] }>('/api/conversations');
  },

  async startConversation(targetUserId: string, initialMessage?: string) {
    return request<{ conversation: any }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ targetUserId, initialMessage }),
    });
  },

  async getDirectMessages(conversationId: string) {
    return request<{ messages: any[] }>(`/api/conversations/${conversationId}/messages`);
  },

  async sendDirectMessage(conversationId: string, data: any) {
    return request<{ message: any }>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Reading Lists
  async getReadingLists(userId?: string) {
    const q = userId ? `?userId=${userId}` : '';
    return request<{ lists: any[] }>(`/api/reading-lists${q}`);
  },

  async createReadingList(data: any) {
    return request<{ list: any }>('/api/reading-lists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async toggleStoryInReadingList(listId: string, storyId: string) {
    return request<{ success: boolean }>(`/api/reading-lists/${listId}/toggle-story`, {
      method: 'POST',
      body: JSON.stringify({ storyId }),
    });
  },

  // Quotes
  async getQuoteSnippets() {
    return request<{ quotes: any[] }>('/api/quote-snippets');
  },

  async createQuoteSnippet(data: any) {
    return request<{ quote: any }>('/api/quote-snippets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async likeQuoteSnippet(quoteId: string) {
    return request<{ likes: number }>(`/api/quote-snippets/${quoteId}/like`, {
      method: 'POST',
    });
  },

  // Safety & Moderation
  async reportContent(data: { targetType: string; targetId: string; reason: string; notes?: string }) {
    return request<{ report: any }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async blockUser(userId: string) {
    return request<{ isBlocked: boolean }>(`/api/users/${userId}/block`, {
      method: 'POST',
    });
  },

  async muteUser(userId: string) {
    return request<{ isMuted: boolean }>(`/api/users/${userId}/mute`, {
      method: 'POST',
    });
  },

  async getSafetyPreferences() {
    return request<{ blocked: string[]; muted: string[] }>('/api/user/safety-preferences');
  },

  // Theories
  async getTheories(storyId?: string) {
    const q = storyId ? `?storyId=${storyId}` : '';
    return request<{ theories: Theory[] }>(`/api/theories${q}`);
  },

  async createTheory(data: Partial<Theory>) {
    return request<{ theory: Theory }>('/api/theories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async voteTheory(id: string, vote: 'agree' | 'disagree' = 'agree') {
    return request<{ theory: Theory; agreeCount: number }>(`/api/theories/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    });
  },

  // Characters, Worlds, Universes
  async getCharacters(authorId?: string) {
    const q = authorId ? `?authorId=${authorId}` : '';
    return request<{ characters: Character[]; relationships: CharacterRelationship[] }>(`/api/characters${q}`);
  },

  async createCharacter(character: Partial<Character>) {
    return request<{ character: Character }>('/api/characters', {
      method: 'POST',
      body: JSON.stringify(character),
    });
  },

  async getWorlds(authorId?: string) {
    const q = authorId ? `?authorId=${authorId}` : '';
    return request<{ worlds: World[] }>(`/api/worlds${q}`);
  },

  async createWorld(world: Partial<World>) {
    return request<{ world: World }>('/api/worlds', {
      method: 'POST',
      body: JSON.stringify(world),
    });
  },

  async getUniverses(authorId?: string) {
    const q = authorId ? `?authorId=${authorId}` : '';
    return request<{ universes: Universe[] }>(`/api/universes${q}`);
  },

  async getUniverse(idOrSlug: string) {
    return request<{ universe: Universe; stories: Story[] }>(`/api/universes/${idOrSlug}`);
  },

  async createUniverse(universe: Partial<Universe>) {
    return request<{ universe: Universe }>('/api/universes', {
      method: 'POST',
      body: JSON.stringify(universe),
    });
  },

  // Anime
  async getAnime() {
    return request<{ anime: AnimeEntry[] }>('/api/anime');
  },

  // Notifications & Stats & Search
  async getNotifications() {
    return request<{ notifications: Notification[] }>('/api/notifications');
  },

  async markNotificationRead(id: string) {
    return request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' });
  },

  async markAllNotificationsRead() {
    return request<{ success: boolean }>('/api/notifications/read-all', { method: 'POST' });
  },

  async getCreatorAnalytics() {
    return request<{ stats: CreatorStats }>('/api/studio/analytics');
  },

  async search(query: string) {
    return request<SearchResult>(`/api/search?q=${encodeURIComponent(query)}`);
  },

  async getUserProfile(username: string) {
    return request<{ user: User; stories: Story[]; badges: Badge[] }>(`/api/users/${username}`);
  },

  // Master Admin Portal
  async adminGetStats() {
    return request<{ stats: AdminPlatformStats }>('/api/admin/stats');
  },

  async adminGetUsers() {
    return request<{ users: User[] }>('/api/admin/users');
  },

  async adminUpdateUser(id: string, updates: Partial<User>) {
    return request<{ user: User }>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async adminDeleteUser(id: string) {
    return request<{ success: boolean }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  async adminUpdateStory(id: string, updates: Partial<Story>) {
    return request<{ story: Story }>(`/api/admin/stories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async adminDeleteStory(id: string) {
    return request<{ success: boolean }>(`/api/admin/stories/${id}`, {
      method: 'DELETE',
    });
  },

  async adminDeletePost(id: string) {
    return request<{ success: boolean }>(`/api/admin/posts/${id}`, {
      method: 'DELETE',
    });
  },

  async adminDeleteTheory(id: string) {
    return request<{ success: boolean }>(`/api/admin/theories/${id}`, {
      method: 'DELETE',
    });
  },
};
