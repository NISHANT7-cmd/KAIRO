import { 
  User, Story, Chapter, ReadingProgress, LibraryItem, Review, 
  ChapterComment, Community, CommunityPost, Theory, Character, 
  CharacterRelationship, World, Universe, AnimeEntry, Notification, Badge, CreatorStats, SearchResult,
  AdminPlatformStats, PublicUserProfile,
  Program, ProgramParticipant, ProgramSubmission, ProgramVote,
  ProgramAnnouncement, ProgramAuditLog, ProgramCertificate,
  AdminProgramsSummary, ProgramStatus,
  UserInterestProfile, PersonalizedHomeFeed, PersonalizedDiscoverFeed, StoryDna,
  AdminRecommendationSettings
} from '../types';
import { getStaticFallback, FALLBACK_STORIES, FALLBACK_UNIVERSES, FALLBACK_USERS } from './fallbackData';
import { ensureSafePayloadImage } from '../utils/imageOptimizer';

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

export function getLocalCustomStories(): Story[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('kairo_custom_stories');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCustomStory(story: Story) {
  if (typeof window === 'undefined' || !story || !story.id) return;
  try {
    const existing = getLocalCustomStories();
    const idx = existing.findIndex(s => s.id === story.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...story };
    } else {
      existing.unshift(story);
    }
    localStorage.setItem('kairo_custom_stories', JSON.stringify(existing));
  } catch {}
}

export function removeLocalCustomStory(storyId: string) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalCustomStories();
    const filtered = existing.filter(s => s.id !== storyId);
    localStorage.setItem('kairo_custom_stories', JSON.stringify(filtered));
  } catch {}
}

export function invalidateApiCache(pattern?: string) {
  if (typeof window === 'undefined') return;
  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith('kairo_cache_')) {
        if (!pattern || k.includes(pattern)) {
          localStorage.removeItem(k);
        }
      }
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
    // 0 is network failure, 404 is endpoint/resource missing, 500+ are server errors
    if (err.status === 0 || err.status >= 500 || err.status === 404) {
      return true;
    }
  }
  const msg = (err.message || '').toLowerCase();
  return msg.includes('network error') || 
         msg.includes('failed to fetch') || 
         msg.includes('networkerror') ||
         msg.includes('status 404') || 
         msg.includes('status 500') || 
         msg.includes('status 502') || 
         msg.includes('status 503') || 
         msg.includes('status 504') || 
         msg.includes('html response') ||
         msg.includes('not reachable') ||
         msg.includes('endpoint not found') ||
         msg.includes('unable to connect');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Retry up to 2 times for transient network/server glitches (e.g. cold container starts or brief disconnects)
  const maxRetries = isGet ? 2 : 1;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 250ms, then 700ms
      const delay = attempt === 1 ? 250 : 700;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      const res = await fetch(url, { ...options, headers });
      const contentType = res.headers.get('content-type') || '';

      // Guard against HTML returned when serverless route falls back to index.html
      if (contentType.includes('text/html')) {
        throw new ApiError(`API returned HTML response (endpoint unreachable or route not found): ${url}`, 404, 'HTML_RESPONSE');
      }

      let data: any = null;
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
        // If 502, 503, 504 gateway error from container or proxy, retry
        if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxRetries) {
          lastError = new ApiError(`Server temporarily unavailable (${res.status})`, res.status, 'SERVER_UNAVAILABLE');
          continue;
        }

        let errorMsg = data?.error || `Request failed with status ${res.status}`;
        if (res.status === 413 || errorMsg.includes('FUNCTION_PAYLOAD_TOO_LARGE') || errorMsg.includes('Entity Too Large')) {
          errorMsg = 'Cover image payload exceeds network limit. The image has been automatically compressed for you—please click Publish again.';
        }
        const errorCode = data?.code || (res.status === 413 ? 'PAYLOAD_TOO_LARGE' : undefined);
        throw new ApiError(errorMsg, res.status, errorCode, data);
      }

      const result = (data ?? {}) as T;

      // Cache successful GET responses in localStorage for seamless offline resilience
      if (isGet && typeof window !== 'undefined' && result) {
        try {
          localStorage.setItem(`kairo_cache_${url}`, JSON.stringify({
            timestamp: Date.now(),
            data: result
          }));
        } catch {}
      }

      return result;
    } catch (err: any) {
      lastError = err;

      // Do NOT retry intentional 4xx client errors (e.g. 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found)
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }

      // Retry on network errors or 5xx server failures
      if (attempt < maxRetries) {
        continue;
      }
    }
  }

  // If network failed and this is a GET request, check offline cache
  if (isGet && typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`kairo_cache_${url}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.data) {
          console.warn(`[KAIRO API] Network unavailable for ${url}. Serving cached response.`);
          return parsed.data as T;
        }
      }
    } catch {}
  }

  // If no cache exists, check static fallback for critical read routes
  if (isGet) {
    const fallback = getStaticFallback<T>(url);
    if (fallback !== null) {
      console.warn(`[KAIRO API] Network unavailable for ${url}. Serving pre-seeded fallback.`);
      return fallback;
    }
  }

  if (lastError instanceof ApiError) {
    throw lastError;
  }

  const rawMsg = lastError?.message || 'Unable to connect to server';
  throw new ApiError(`Network error: ${rawMsg}`, 0, 'NETWORK_ERROR');
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

  async uploadImage(image: string, name?: string) {
    try {
      return await request<{ url: string; name: string }>('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ image, name }),
      });
    } catch {
      // Direct data URL fallback if network/route issues
      return { url: image, name: name || 'uploaded_image' };
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

  async getUserProfile(idOrUsername?: string | any): Promise<PublicUserProfile> {
    let resolvedId = '';
    if (typeof idOrUsername === 'string') {
      resolvedId = idOrUsername.trim().replace(/^@/, '');
    } else if (typeof idOrUsername === 'object' && idOrUsername !== null) {
      resolvedId = (idOrUsername.username || idOrUsername.userId || idOrUsername.id || '').trim().replace(/^@/, '');
    }

    if (resolvedId === '[object Object]' || resolvedId === 'undefined' || resolvedId === 'null') {
      resolvedId = '';
    }

    const localActive = getActiveLocalUser();
    if (!resolvedId || resolvedId.toLowerCase() === 'me') {
      if (localActive) {
        resolvedId = localActive.username || localActive.id;
      }
    }

    if (!resolvedId) {
      if (localActive) {
        resolvedId = localActive.username || localActive.id;
      } else {
        throw new Error('User profile not found');
      }
    }

    const clean = encodeURIComponent(resolvedId);
    try {
      const res = await request<PublicUserProfile>(`/api/users/profile/${clean}`);
      return res;
    } catch (err: any) {
      if (!isServerFailure(err)) {
        // If 404 from server, check if it's the active local user
        if (localActive && (localActive.username?.toLowerCase() === resolvedId.toLowerCase() || localActive.id?.toLowerCase() === resolvedId.toLowerCase())) {
          const customStories = getLocalCustomStories().filter(s => 
            s.authorId === localActive.id || 
            (s.authorUsername && localActive.username && s.authorUsername.toLowerCase() === localActive.username.toLowerCase())
          );
          const fallbackStories = FALLBACK_STORIES.filter(s => 
            s.authorId === localActive.id || 
            (s.authorUsername && localActive.username && s.authorUsername.toLowerCase() === localActive.username.toLowerCase())
          );
          const authorStories = [...customStories, ...fallbackStories];
          return {
            user: localActive,
            isFollowing: false,
            isSelf: true,
            stories: authorStories,
            posts: [],
            universes: [],
            theories: [],
            readingList: [],
            certificates: [],
            badges: localActive.role === 'ADMIN' ? ['Master Admin'] : localActive.role === 'WRITER' ? ['Verified Author'] : ['Explorer'],
            stats: {
              totalStories: authorStories.length,
              totalReads: authorStories.reduce((acc, s) => acc + (s.views || 0), 0) || (localActive.totalReads || 0),
              totalLikes: authorStories.reduce((acc, s) => acc + (s.likes || 0), 0),
              totalPosts: 0,
              totalTheories: 0,
              totalUniverses: authorStories.some(s => s.universeId) ? 1 : 0,
              followersCount: localActive.followersCount || 0,
              followingCount: localActive.followingCount || 0,
              chaptersCount: authorStories.reduce((acc, s) => acc + (s.chaptersCount || 0), 0),
            }
          };
        }
        throw err;
      }
      // Fallback in demo mode
      const allUsers = [...DEMO_FALLBACK_USERS, ...getLocalUsers()];
      const searchTarget = decodeURIComponent(clean).toLowerCase();
      const found = allUsers.find(u => 
        u.id.toLowerCase() === searchTarget || 
        u.username.toLowerCase() === searchTarget ||
        (u.email && u.email.toLowerCase() === searchTarget)
      );
      if (!found) {
        if (localActive && (searchTarget === 'me' || localActive.username?.toLowerCase() === searchTarget || localActive.id?.toLowerCase() === searchTarget)) {
          const customStories = getLocalCustomStories().filter(s => 
            s.authorId === localActive.id || 
            (s.authorUsername && localActive.username && s.authorUsername.toLowerCase() === localActive.username.toLowerCase())
          );
          const fallbackStories = FALLBACK_STORIES.filter(s => 
            s.authorId === localActive.id || 
            (s.authorUsername && localActive.username && s.authorUsername.toLowerCase() === localActive.username.toLowerCase())
          );
          const authorStories = [...customStories, ...fallbackStories];
          return {
            user: localActive,
            isFollowing: false,
            isSelf: true,
            stories: authorStories,
            posts: [],
            universes: [],
            theories: [],
            readingList: [],
            certificates: [],
            badges: localActive.role === 'ADMIN' ? ['Master Admin'] : localActive.role === 'WRITER' ? ['Verified Author'] : ['Explorer'],
            stats: {
              totalStories: authorStories.length,
              totalReads: authorStories.reduce((acc, s) => acc + (s.views || 0), 0) || (localActive.totalReads || 0),
              totalLikes: authorStories.reduce((acc, s) => acc + (s.likes || 0), 0),
              totalPosts: 0,
              totalTheories: 0,
              totalUniverses: authorStories.some(s => s.universeId) ? 1 : 0,
              followersCount: localActive.followersCount || 0,
              followingCount: localActive.followingCount || 0,
              chaptersCount: authorStories.reduce((acc, s) => acc + (s.chaptersCount || 0), 0),
            }
          };
        }
        throw new Error('User profile not found');
      }
      const isSelf = Boolean(localActive && localActive.id === found.id);
      const userStories = FALLBACK_STORIES.filter(s => s.authorId === found.id || s.authorUsername.toLowerCase() === found.username.toLowerCase());
      const userUniverses = FALLBACK_UNIVERSES.filter(u => u.authorId === found.id);
      return {
        user: found,
        isFollowing: false,
        isSelf,
        stories: userStories,
        posts: [],
        universes: userUniverses,
        theories: [],
        readingList: [],
        certificates: [],
        badges: found.role === 'ADMIN' ? ['Platform Admin'] : found.role === 'WRITER' ? ['Verified Author'] : ['Explorer'],
        stats: {
          totalStories: userStories.length,
          totalReads: found.totalReads || 0,
          totalLikes: userStories.reduce((sum, s) => sum + (s.likes || 0), 0),
          totalPosts: 0,
          totalTheories: 0,
          totalUniverses: userUniverses.length,
          followersCount: found.followersCount || 0,
          followingCount: found.followingCount || 0,
          chaptersCount: userStories.reduce((sum, s) => sum + (s.chaptersCount || 0), 0),
        }
      };
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
    let safePayload = { ...story };
    if (safePayload.coverImage && safePayload.coverImage.startsWith('data:image/') && safePayload.coverImage.length > 400000) {
      safePayload.coverImage = await ensureSafePayloadImage(safePayload.coverImage, { maxDimension: 1000, targetMaxBytes: 300 * 1024 });
    }
    const res = await request<{ story: Story; user?: any }>('/api/stories', {
      method: 'POST',
      body: JSON.stringify(safePayload),
    });
    if (res.story) {
      saveLocalCustomStory(res.story);
    }
    if (res.user) {
      setActiveLocalUser(res.user);
    }
    invalidateApiCache('/api/stories');
    invalidateApiCache('/api/users/profile');
    return res;
  },

  async updateStory(id: string, updates: Partial<Story>) {
    let safePayload = { ...updates };
    if (safePayload.coverImage && safePayload.coverImage.startsWith('data:image/') && safePayload.coverImage.length > 400000) {
      safePayload.coverImage = await ensureSafePayloadImage(safePayload.coverImage, { maxDimension: 1000, targetMaxBytes: 300 * 1024 });
    }
    const res = await request<{ story: Story }>(`/api/stories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(safePayload),
    });
    if (res.story) {
      saveLocalCustomStory(res.story);
    }
    invalidateApiCache('/api/stories');
    invalidateApiCache('/api/users/profile');
    return res;
  },

  async deleteStory(id: string) {
    removeLocalCustomStory(id);
    invalidateApiCache('/api/stories');
    invalidateApiCache('/api/users/profile');
    return request<{ success: boolean }>(`/api/stories/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
      try {
        return await request<{ chapter: Chapter }>(`/api/stories/${encodeURIComponent(chapter.storyId)}/chapters`, {
          method: 'POST',
          body: JSON.stringify(chapter),
        });
      } catch (err: any) {
        if (err?.status === 404 || err?.message?.includes('not found')) {
          return await request<{ chapter: Chapter }>(`/api/chapters`, {
            method: 'POST',
            body: JSON.stringify(chapter),
          });
        }
        throw err;
      }
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

  async deleteChapter(chapterId: string) {
    return request<{ success: boolean }>(`/api/chapters/${chapterId}`, {
      method: 'DELETE',
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
  async getCharacters(params?: { authorId?: string; storyId?: string }) {
    const parts: string[] = [];
    if (params?.authorId) parts.push(`authorId=${encodeURIComponent(params.authorId)}`);
    if (params?.storyId) parts.push(`storyId=${encodeURIComponent(params.storyId)}`);
    const q = parts.length > 0 ? `?${parts.join('&')}` : '';
    return request<{ characters: Character[]; relationships: CharacterRelationship[] }>(`/api/characters${q}`);
  },

  async getStoryCharacters(storyId: string) {
    return request<{ characters: Character[] }>(`/api/stories/${encodeURIComponent(storyId)}/characters`);
  },

  async createCharacter(character: Partial<Character>) {
    invalidateApiCache('/api/characters');
    invalidateApiCache('/api/stories');
    return request<{ character: Character }>('/api/characters', {
      method: 'POST',
      body: JSON.stringify(character),
    });
  },

  async updateCharacter(id: string, updates: Partial<Character>) {
    invalidateApiCache('/api/characters');
    invalidateApiCache('/api/stories');
    return request<{ character: Character }>(`/api/characters/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteCharacter(id: string) {
    invalidateApiCache('/api/characters');
    invalidateApiCache('/api/stories');
    return request<{ success: boolean }>(`/api/characters/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async extractStoryCharacters(storyId: string) {
    invalidateApiCache('/api/characters');
    invalidateApiCache('/api/stories');
    return request<{ characters: Character[] }>(`/api/stories/${encodeURIComponent(storyId)}/characters/extract`, {
      method: 'POST',
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

  // ==========================================
  // MASTER ADMIN PROGRAMS & COMPETITIONS API
  // ==========================================

  async adminGetProgramsSummary() {
    return request<{ summary: AdminProgramsSummary }>('/api/admin/programs/summary');
  },

  async adminGetPrograms(filter?: { status?: string; type?: string; search?: string; visibility?: string }) {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.type) params.set('type', filter.type);
    if (filter?.visibility) params.set('visibility', filter.visibility);
    if (filter?.search) params.set('search', filter.search);
    const qs = params.toString();
    return request<{ programs: Program[] }>(`/api/admin/programs${qs ? `?${qs}` : ''}`);
  },

  async adminCreateProgram(data: Partial<Program>) {
    return request<{ program: Program }>('/api/admin/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async adminGetProgram(id: string) {
    return request<{ program: Program }>(`/api/admin/programs/${id}`);
  },

  async adminUpdateProgram(id: string, data: Partial<Program>) {
    return request<{ program: Program }>(`/api/admin/programs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async adminOverrideProgramStatus(id: string, status: ProgramStatus, reason?: string) {
    return request<{ program: Program }>(`/api/admin/programs/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  },

  async adminDuplicateProgram(id: string, newName?: string) {
    return request<{ program: Program }>(`/api/admin/programs/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ newName }),
    });
  },

  async adminDeleteProgram(id: string) {
    return request<{ success: boolean }>(`/api/admin/programs/${id}`, {
      method: 'DELETE',
    });
  },

  async adminGetProgramParticipants(programId: string) {
    return request<{ participants: ProgramParticipant[] }>(`/api/admin/programs/${programId}/participants`);
  },

  async adminUpdateProgramParticipant(programId: string, participantId: string, data: Partial<ProgramParticipant>) {
    return request<{ participant: ProgramParticipant }>(`/api/admin/programs/${programId}/participants/${participantId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async adminRemoveProgramParticipant(programId: string, participantId: string) {
    return request<{ success: boolean }>(`/api/admin/programs/${programId}/participants/${participantId}`, {
      method: 'DELETE',
    });
  },

  async adminGetProgramSubmissions(programId: string) {
    return request<{ submissions: ProgramSubmission[] }>(`/api/admin/programs/${programId}/submissions`);
  },

  async adminUpdateProgramSubmission(programId: string, submissionId: string, data: Partial<ProgramSubmission>) {
    return request<{ submission: ProgramSubmission }>(`/api/admin/programs/${programId}/submissions/${submissionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async adminDeleteProgramSubmission(programId: string, submissionId: string) {
    return request<{ success: boolean }>(`/api/admin/programs/${programId}/submissions/${submissionId}`, {
      method: 'DELETE',
    });
  },

  async adminToggleProgramFinalist(programId: string, submissionId: string, isFinalist: boolean) {
    return request<{ submission: ProgramSubmission }>(`/api/admin/programs/${programId}/submissions/${submissionId}/finalist`, {
      method: 'POST',
      body: JSON.stringify({ isFinalist }),
    });
  },

  async adminScoreProgramSubmission(programId: string, submissionId: string, criteriaScores: Record<string, number>, feedback?: string) {
    return request<{ submission: ProgramSubmission }>(`/api/admin/programs/${programId}/submissions/${submissionId}/score`, {
      method: 'POST',
      body: JSON.stringify({ criteriaScores, feedback }),
    });
  },

  async adminGetProgramVotes(programId: string) {
    return request<{ votes: ProgramVote[] }>(`/api/admin/programs/${programId}/votes`);
  },

  async adminDeclareProgramResults(programId: string, winners: any[], remarks?: string) {
    return request<{ program: Program }>(`/api/admin/programs/${programId}/declare-results`, {
      method: 'POST',
      body: JSON.stringify({ winners, remarks }),
    });
  },

  async adminGetProgramAnnouncements(programId: string) {
    return request<{ announcements: ProgramAnnouncement[] }>(`/api/admin/programs/${programId}/announcements`);
  },

  async adminCreateProgramAnnouncement(programId: string, data: Partial<ProgramAnnouncement>) {
    return request<{ announcement: ProgramAnnouncement }>(`/api/admin/programs/${programId}/announcements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async adminGetProgramAuditLogs(programId?: string) {
    const id = programId || 'all';
    return request<{ logs: ProgramAuditLog[] }>(`/api/admin/programs/${id}/audit-logs`);
  },

  // ------------------------------------------
  // PUBLIC & PARTICIPANT PROGRAMS API METHODS
  // ------------------------------------------

  async getPublicPrograms(filter?: { status?: string; type?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.type) params.set('type', filter.type);
    if (filter?.search) params.set('search', filter.search);
    const qs = params.toString();
    return request<{ programs: Program[] }>(`/api/programs${qs ? `?${qs}` : ''}`);
  },

  async getPublicProgram(slugOrId: string) {
    return request<{ program: Program }>(`/api/programs/${slugOrId}`);
  },

  async getPublicProgramSubmissions(programId: string) {
    return request<{ submissions: ProgramSubmission[] }>(`/api/programs/${programId}/submissions`);
  },

  async getPublicProgramAnnouncements(programId: string) {
    return request<{ announcements: ProgramAnnouncement[] }>(`/api/programs/${programId}/announcements`);
  },

  async registerProgram(programId: string, data: { rulesAgreementCheckbox: boolean; userType?: string }) {
    return request<{ participant: ProgramParticipant }>(`/api/programs/${programId}/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMyProgramStatus(programId: string) {
    return request<{
      isRegistered: boolean;
      participant: ProgramParticipant | null;
      submission: ProgramSubmission | null;
      votesCastCount: number;
      votedSubmissionIds: string[];
    }>(`/api/programs/${programId}/my-status`);
  },

  async submitProgramEntry(programId: string, data: Partial<ProgramSubmission>) {
    return request<{ submission: ProgramSubmission }>(`/api/programs/${programId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async voteProgramSubmission(programId: string, submissionId: string) {
    return request<{ success: boolean; message: string; votes: number }>(`/api/programs/${programId}/submissions/${submissionId}/vote`, {
      method: 'POST',
    });
  },

  async verifyCertificate(certId: string) {
    return request<{ certificate: ProgramCertificate }>(`/api/certificates/${certId}`);
  },

  // Onboarding & Personalization
  async getOnboardingStatus() {
    return request<{
      isAuthenticated: boolean;
      hasCompletedOnboarding: boolean;
      onboardingSkipped?: boolean;
      profile: UserInterestProfile | null;
      storyDna?: StoryDna;
    }>('/api/onboarding/status');
  },

  async completeOnboarding(data: Partial<UserInterestProfile>) {
    return request<{
      success: boolean;
      profile: UserInterestProfile;
      user: User;
      storyDna: StoryDna;
    }>('/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async skipOnboarding() {
    return request<{
      success: boolean;
      profile: UserInterestProfile;
      user: User;
    }>('/api/onboarding/skip', {
      method: 'POST',
    });
  },

  async getPersonalizedHomeFeed(lang?: string) {
    const url = lang ? `/api/recommendations/home?lang=${encodeURIComponent(lang)}` : '/api/recommendations/home';
    return request<PersonalizedHomeFeed>(url);
  },

  async getPersonalizedDiscoverFeed(lang?: string) {
    const url = lang ? `/api/recommendations/discover?lang=${encodeURIComponent(lang)}` : '/api/recommendations/discover';
    return request<PersonalizedDiscoverFeed>(url);
  },

  async getTasteProfile() {
    return request<{
      profile: UserInterestProfile;
      storyDna: StoryDna;
    }>('/api/recommendations/profile');
  },

  async updateTasteProfile(updates: Partial<UserInterestProfile>) {
    return request<{
      profile: UserInterestProfile;
      storyDna: StoryDna;
      user?: User;
    }>('/api/recommendations/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async resetPersonalization() {
    return request<{
      success: boolean;
      profile: UserInterestProfile;
      storyDna: StoryDna;
    }>('/api/recommendations/reset', {
      method: 'POST',
    });
  },

  async sendRecommendationFeedback(data: {
    action: 'NOT_INTERESTED' | 'DISLIKE_GENRE' | 'MUTE_AUTHOR' | 'DONT_RECOMMEND_STORY';
    targetId: string;
    reason?: string;
    metadata?: any;
  }) {
    return request<{ success: boolean; profile: UserInterestProfile }>('/api/recommendations/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitRecommendationFeedback(data: {
    type: 'not_interested' | 'dont_recommend_genre' | 'mute_author';
    targetId: string;
    metadata?: any;
  }) {
    const actionMap: Record<string, 'NOT_INTERESTED' | 'DISLIKE_GENRE' | 'MUTE_AUTHOR'> = {
      not_interested: 'NOT_INTERESTED',
      dont_recommend_genre: 'DISLIKE_GENRE',
      mute_author: 'MUTE_AUTHOR',
    };
    return this.sendRecommendationFeedback({
      action: actionMap[data.type] || 'NOT_INTERESTED',
      targetId: data.targetId,
      metadata: data.metadata,
    });
  },

  async restoreRecommendationFeedback(data: {
    type: 'story' | 'genre' | 'author';
    targetId: string;
  }) {
    return request<{ success: boolean; profile: UserInterestProfile }>('/api/recommendations/restore-feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async recordBehaviorEvent(data: {
    eventType: string;
    contentType: string;
    contentId: string;
    metadata?: any;
  }) {
    return request<{ recorded: boolean }>('/api/recommendations/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getRecommendationExplanation(storyId: string) {
    return request<{ explanation: string; factors: string[] }>(`/api/recommendations/why/${storyId}`);
  },

  async getAdminRecommendationSettings() {
    return request<{
      settings: AdminRecommendationSettings;
      analytics: {
        totalProfiles: number;
        totalEvents: number;
        popularGenres: { genre: string; count: number }[];
      };
    }>('/api/recommendations/admin/settings');
  },

  async updateAdminRecommendationSettings(settings: Partial<AdminRecommendationSettings>) {
    return request<{ success: boolean; settings: AdminRecommendationSettings }>('/api/recommendations/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};
