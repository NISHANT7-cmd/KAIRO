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

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  
  let data: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: text };
        }
      }
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg = data?.error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
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
    const res = await request<{ token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(login: string, password: string) {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  async updateProfile(updates: Partial<User>) {
    return request<{ user: User }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
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

  async getCommunityPosts() {
    return request<{ posts: CommunityPost[] }>('/api/posts');
  },

  async getCommunity(slug: string) {
    return request<{ community: Community; posts: CommunityPost[] }>(`/api/communities/${slug}`);
  },

  async createCommunityPost(data: { communityId: string; title: string; content: string; type: string; pollOptions?: { id: string; text: string; votes: number }[] }) {
    return request<{ post: CommunityPost }>(`/api/communities/${data.communityId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async likeCommunityPost(postId: string) {
    return request<{ likes: number }>(`/api/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  async voteCommunityPoll(postId: string, optionId: string) {
    return request<{ post: CommunityPost }>(`/api/posts/${postId}/poll-vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    });
  },

  async addCommunityPostComment(postId: string, content: string) {
    return request<{ comment: any }>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
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
