import express, { Request, Response, NextFunction } from 'express';
import { dbService } from './db.js';
import { User } from '../src/types.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Universal CORS & Preflight headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Structured Logging for Security & Diagnostics
function logAuth(event: string, meta: Record<string, any> = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH] ${timestamp} [${event}]`, JSON.stringify(meta));
}

function logAuthError(event: string, err: any, meta: Record<string, any> = {}) {
  const timestamp = new Date().toISOString();
  console.error(`[AUTH_ERROR] ${timestamp} [${event}]`, err?.message || err, JSON.stringify(meta));
}

// Safely handle bodies in Vercel Serverless / Express environments
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
      (req as any)._body = true;
    } catch {
      // not a json string
    }
  } else if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    (req as any)._body = true;
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

interface AuthVerificationResult {
  user: User | null;
  status: number;
  code: 'OK' | 'MISSING_TOKEN' | 'MALFORMED_HEADER' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'USER_NOT_FOUND' | 'SUSPENDED';
  message: string;
}

// Strict Token Authentication Helper with Detailed Verification
function verifyAuthToken(req: Request): AuthVerificationResult {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return { user: null, status: 401, code: 'MISSING_TOKEN', message: 'No authorization header provided.' };
  }

  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return { user: null, status: 401, code: 'MALFORMED_HEADER', message: 'Authorization header format must be: Bearer <token>' };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return { user: null, status: 401, code: 'MISSING_TOKEN', message: 'Bearer token string is empty.' };
  }

  const result = dbService.validateSessionDetails(token);

  if (result.status === 'EXPIRED') {
    return { user: null, status: 401, code: 'EXPIRED_TOKEN', message: 'Session has expired. Please sign in again.' };
  }
  if (result.status === 'INVALID') {
    return { user: null, status: 401, code: 'INVALID_TOKEN', message: 'Invalid or revoked session token.' };
  }
  if (result.status === 'NOT_FOUND') {
    return { user: null, status: 401, code: 'USER_NOT_FOUND', message: 'User account associated with this session no longer exists.' };
  }
  if (result.status === 'SUSPENDED') {
    return { user: result.user, status: 403, code: 'SUSPENDED', message: 'Access denied: Your account has been suspended by administration.' };
  }

  return { user: result.user, status: 200, code: 'OK', message: 'Session verified successfully.' };
}

function getUserFromReq(req: Request): User | null {
  const res = verifyAuthToken(req);
  return res.status === 200 ? res.user : null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = verifyAuthToken(req);
  if (auth.status !== 200 || !auth.user) {
    logAuth('REQUIRE_AUTH_REJECTED', {
      path: req.originalUrl || req.url,
      method: req.method,
      code: auth.code,
      status: auth.status,
      ip: req.ip
    });
    return res.status(auth.status).json({ error: auth.message, code: auth.code });
  }

  (req as any).user = auth.user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = verifyAuthToken(req);
  if (auth.status !== 200 || !auth.user) {
    logAuth('REQUIRE_ADMIN_UNAUTHORIZED', {
      path: req.originalUrl || req.url,
      code: auth.code,
      status: auth.status
    });
    return res.status(auth.status).json({ error: auth.message, code: auth.code });
  }

  if (auth.user.role !== 'ADMIN') {
    logAuth('REQUIRE_ADMIN_FORBIDDEN', {
      userId: auth.user.id,
      role: auth.user.role,
      path: req.originalUrl || req.url
    });
    return res.status(403).json({ error: 'Access denied: Master Admin role required.', code: 'FORBIDDEN' });
  }

  (req as any).user = auth.user;
  next();
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------
app.post('/api/auth/signup', (req: Request, res: Response) => {
  try {
    const { username, email, password, displayName, favoriteGenres, favoriteThemes, role, bio, avatar } = req.body || {};
    logAuth('SIGNUP_ATTEMPT', { username, email, role });

    if (!username || !email || !password) {
      logAuth('SIGNUP_FAILED_MISSING_FIELDS', { username, email });
      return res.status(400).json({ error: 'Username, email, and password are required', code: 'MISSING_FIELDS' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long', code: 'PASSWORD_TOO_SHORT' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existing = dbService.findUserByEmailOrUsername(cleanUsername) || dbService.findUserByEmailOrUsername(cleanEmail);
    if (existing) {
      logAuth('SIGNUP_FAILED_DUPLICATE', { username: cleanUsername, email: cleanEmail });
      return res.status(400).json({ error: 'A user with this username or email already exists', code: 'USER_EXISTS' });
    }

    // Standard registration can be USER or WRITER. Only ADMIN portal can grant ADMIN role.
    const assignedRole = role === 'WRITER' ? 'WRITER' : 'USER';

    const user = dbService.createUser({
      username: cleanUsername,
      email: cleanEmail,
      displayName: displayName?.trim() || username.trim(),
      avatar: avatar || (assignedRole === 'WRITER' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' 
        : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80'),
      bio: bio || (assignedRole === 'WRITER' ? 'Author & Storyteller on KAIRO.' : 'Story explorer & avid reader on KAIRO.'),
      favoriteGenres: favoriteGenres || ['Fantasy', 'Anime-Inspired'],
      favoriteThemes: favoriteThemes || ['World Building'],
      role: assignedRole,
      status: 'ACTIVE',
      isVerifiedWriter: assignedRole === 'WRITER',
    }, password);

    const session = dbService.createSession(user.id);
    const enrichedUser = dbService.getUserEnriched(user);

    logAuth('SIGNUP_SUCCESS', { userId: user.id, username: user.username, role: user.role });
    return res.status(201).json({ token: session.token, user: enrichedUser });
  } catch (err: any) {
    logAuthError('SIGNUP_INTERNAL_ERROR', err);
    return res.status(500).json({ error: err.message || 'Internal server error during registration', code: 'INTERNAL_ERROR' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { login, password } = req.body || {};
    logAuth('LOGIN_ATTEMPT', { login });

    if (!login || !password) {
      logAuth('LOGIN_FAILED_MISSING_CREDENTIALS', { login });
      return res.status(400).json({ error: 'Login identifier and password are required', code: 'MISSING_CREDENTIALS' });
    }

    const user = dbService.findUserByEmailOrUsername(login);
    if (!user) {
      logAuth('LOGIN_FAILED_USER_NOT_FOUND', { login });
      return res.status(401).json({ error: 'Invalid username or password', code: 'INVALID_CREDENTIALS' });
    }

    if (user.status === 'SUSPENDED') {
      logAuth('LOGIN_FAILED_ACCOUNT_SUSPENDED', { userId: user.id, username: user.username });
      return res.status(403).json({ error: 'Account suspended: Please contact platform administration.', code: 'ACCOUNT_SUSPENDED' });
    }

    const valid = dbService.verifyPassword(user.id, password);
    if (!valid) {
      logAuth('LOGIN_FAILED_INVALID_PASSWORD', { userId: user.id, username: user.username });
      return res.status(401).json({ error: 'Invalid username or password', code: 'INVALID_CREDENTIALS' });
    }

    const session = dbService.createSession(user.id);
    const enrichedUser = dbService.getUserEnriched(user);

    logAuth('LOGIN_SUCCESS', { userId: user.id, username: user.username, role: user.role });
    return res.json({ token: session.token, user: enrichedUser });
  } catch (err: any) {
    logAuthError('LOGIN_INTERNAL_ERROR', err);
    return res.status(500).json({ error: err.message || 'Internal server error during authentication', code: 'INTERNAL_ERROR' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      dbService.destroySession(token);
      logAuth('LOGOUT_SUCCESS', { tokenLength: token.length });
    }
  }
  return res.json({ success: true, message: 'Signed out successfully' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const auth = verifyAuthToken(req);
  if (auth.status !== 200 || !auth.user) {
    logAuth('GET_ME_UNAUTHORIZED', {
      code: auth.code,
      status: auth.status,
      message: auth.message
    });
    return res.status(auth.status).json({ error: auth.message, code: auth.code });
  }

  const enrichedUser = dbService.getUserEnriched(auth.user);
  logAuth('GET_ME_VERIFIED', { userId: auth.user.id, username: auth.user.username });
  return res.json({ user: enrichedUser });
});

app.patch('/api/auth/profile', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  
  // Whitelist safe profile fields only - prevent privilege escalation
  const safeUpdates: Partial<User> = {};
  if (typeof req.body.displayName === 'string' && req.body.displayName.trim()) {
    safeUpdates.displayName = req.body.displayName.trim();
  }
  if (typeof req.body.bio === 'string') {
    safeUpdates.bio = req.body.bio.trim();
  }
  if (typeof req.body.avatar === 'string' && req.body.avatar.trim()) {
    safeUpdates.avatar = req.body.avatar.trim();
  }
  if (Array.isArray(req.body.favoriteGenres)) {
    safeUpdates.favoriteGenres = req.body.favoriteGenres;
  }
  if (Array.isArray(req.body.favoriteThemes)) {
    safeUpdates.favoriteThemes = req.body.favoriteThemes;
  }

  const updated = dbService.updateUser(user.id, safeUpdates);
  const enrichedUser = updated ? dbService.getUserEnriched(updated) : undefined;
  return res.json({ user: enrichedUser });
});

// ----------------------------------------------------
// STORIES & CHAPTERS
// ----------------------------------------------------
app.get('/api/stories', (req: Request, res: Response) => {
  const { genre, tag, authorId, universeId, featured, sort, status } = req.query;
  let list = [...dbService.getStories()];

  if (genre && genre !== 'All') {
    list = list.filter(s => s.genre.toLowerCase() === String(genre).toLowerCase());
  }

  if (tag) {
    list = list.filter(s => s.tags.some(t => t.toLowerCase() === String(tag).toLowerCase()));
  }

  if (authorId) {
    list = list.filter(s => s.authorId === String(authorId));
  }

  if (universeId) {
    list = list.filter(s => s.universeId === String(universeId));
  }

  if (featured === 'true') {
    list = list.filter(s => s.featured);
  }

  if (status) {
    list = list.filter(s => s.status.toLowerCase() === String(status).toLowerCase());
  }

  if (sort === 'popular' || sort === 'views') {
    list.sort((a, b) => b.views - a.views);
  } else if (sort === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'recent') {
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  return res.json({ stories: list });
});

app.get('/api/stories/:idOrSlug', (req: Request, res: Response) => {
  const story = dbService.findStoryByIdOrSlug(req.params.idOrSlug);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  const chapters = dbService.getStoryChapters(story.id);
  const reviews = dbService.getStoryReviews(story.id);
  return res.json({ story, chapters, reviews });
});

app.post('/api/stories', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role === 'USER') {
    dbService.updateUser(user.id, { role: 'WRITER', isVerifiedWriter: true });
    user.role = 'WRITER';
  }
  const story = dbService.createStory(req.body, user);
  return res.json({ story });
});

app.patch('/api/stories/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const story = dbService.findStoryByIdOrSlug(req.params.id);
  if (!story) return res.status(404).json({ error: 'Story not found' });
  if (story.authorId !== user.id && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: You do not own this story' });
  }

  const updated = dbService.updateStory(story.id, req.body);
  return res.json({ story: updated });
});

app.delete('/api/stories/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const story = dbService.findStoryByIdOrSlug(req.params.id);
  if (!story) return res.status(404).json({ error: 'Story not found' });
  if (story.authorId !== user.id && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: You do not own this story' });
  }

  dbService.deleteStory(story.id);
  return res.json({ success: true });
});

app.get('/api/stories/:id/chapters', (req: Request, res: Response) => {
  const story = dbService.findStoryByIdOrSlug(req.params.id);
  if (!story) return res.status(404).json({ error: 'Story not found' });
  const chapters = dbService.getStoryChapters(story.id);
  return res.json({ chapters });
});

app.post('/api/stories/:id/chapters', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const story = dbService.findStoryByIdOrSlug(req.params.id);
  if (!story) return res.status(404).json({ error: 'Story not found' });
  if (story.authorId !== user.id && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: You do not own this story' });
  }

  const chapter = dbService.createChapter(req.body, story.id);
  return res.json({ chapter });
});

app.get('/api/chapters/:chapterId', (req: Request, res: Response) => {
  const chapter = dbService.findChapter(req.params.chapterId);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
  const story = dbService.findStoryByIdOrSlug(chapter.storyId);
  const allChapters = story ? dbService.getStoryChapters(story.id) : [];
  return res.json({ chapter, story, allChapters });
});

app.patch('/api/chapters/:chapterId', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const chapter = dbService.findChapter(req.params.chapterId);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

  const story = dbService.findStoryByIdOrSlug(chapter.storyId);
  if (!story) return res.status(404).json({ error: 'Story not found' });
  if (story.authorId !== user.id && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: You do not own this chapter' });
  }

  const updated = dbService.updateChapter(chapter.id, req.body);
  return res.json({ chapter: updated });
});

// ----------------------------------------------------
// READING PROGRESS & LIBRARY
// ----------------------------------------------------
app.post('/api/reading-progress', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const progress = dbService.saveReadingProgress(user.id, req.body);
  return res.json({ progress });
});

app.get('/api/reading-progress', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.json({ progress: [] });
  const progress = dbService.getUserReadingProgress(user.id);
  return res.json({ progress });
});

app.get('/api/library', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.json({ library: [] });
  const library = dbService.getUserLibrary(user.id);
  return res.json({ library });
});

app.post('/api/library/toggle', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { storyId, listType = 'saved' } = req.body;
  const result = dbService.toggleLibrary(user.id, storyId, listType);
  return res.json(result);
});

app.post('/api/stories/:id/like', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const result = dbService.toggleLikeStory(user.id, req.params.id);
  return res.json(result);
});

app.post('/api/users/:id/follow', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const result = dbService.toggleFollowUser(user.id, req.params.id);
  return res.json(result);
});

// ----------------------------------------------------
// CHAPTER COMMENTS & REVIEWS
// ----------------------------------------------------
app.get('/api/chapters/:chapterId/comments', (req: Request, res: Response) => {
  const comments = dbService.getChapterComments(req.params.chapterId);
  return res.json({ comments });
});

app.post('/api/chapters/:chapterId/comments', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { storyId, content, parentId } = req.body;
  const comment = dbService.addChapterComment(user.id, req.params.chapterId, storyId, content, parentId);
  return res.json({ comment });
});

app.post('/api/comments/:commentId/like', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const comment = dbService.likeComment(req.params.commentId, user.id);
  return res.json({ comment });
});

app.post('/api/stories/:id/reviews', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { rating, reviewText } = req.body;
  const review = dbService.addReview(user.id, req.params.id, Number(rating), reviewText);
  return res.json({ review });
});

// ----------------------------------------------------
// COMMUNITIES, POSTS, POLLS, THEORIES
// ----------------------------------------------------
// ----------------------------------------------------
// COMMUNITIES, POSTS, CHAT, EVENTS, DM & MODERATION
// ----------------------------------------------------
app.get('/api/communities', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const communities = dbService.getCommunities(user?.id);
  return res.json({ communities });
});

app.post('/api/communities', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const community = dbService.createCommunity(user.id, req.body);
  return res.json({ community });
});

app.get('/api/communities/:slug', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const community = dbService.getCommunityBySlug(req.params.slug, user?.id);
  if (!community) return res.status(404).json({ error: 'Community not found' });
  const posts = dbService.getCommunityPosts(community.id, user?.id);
  return res.json({ community, posts });
});

app.post('/api/communities/:id/join', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { accessCode } = req.body;
  const result = dbService.joinCommunity(req.params.id, user.id, accessCode);
  if (!result.success) return res.status(400).json({ error: result.message });
  return res.json({ success: true });
});

app.post('/api/communities/:id/leave', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const success = dbService.leaveCommunity(req.params.id, user.id);
  return res.json({ success });
});

app.get('/api/posts', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const posts = dbService.getAllCommunityPosts(user?.id);
  return res.json({ posts });
});

app.get('/api/posts/:id', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const post = dbService.getCommunityPostById(req.params.id, user?.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  return res.json({ post });
});

app.post('/api/communities/:id/posts', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const post = dbService.createCommunityPost(user.id, req.params.id, req.body);
  return res.json({ post });
});

app.post('/api/posts/:id/like', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const likes = dbService.likeCommunityPost(req.params.id, user.id);
  return res.json({ likes });
});

app.post('/api/posts/:id/save', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const isSaved = dbService.toggleSavePost(req.params.id, user.id);
  return res.json({ isSaved });
});

app.post('/api/posts/:id/follow', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const isFollowing = dbService.toggleFollowPost(req.params.id, user.id);
  return res.json({ isFollowing });
});

app.post('/api/posts/:id/vote', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { vote } = req.body;
  const post = dbService.voteTheoryOrPost(req.params.id, vote, user.id);
  return res.json({ post });
});

app.post('/api/posts/:id/pin', requireAuth, (req: Request, res: Response) => {
  const { isPinned } = req.body;
  const ok = dbService.pinPost(req.params.id, Boolean(isPinned));
  return res.json({ success: ok });
});

app.post('/api/posts/:id/lock', requireAuth, (req: Request, res: Response) => {
  const { isLocked } = req.body;
  const ok = dbService.lockPost(req.params.id, Boolean(isLocked));
  return res.json({ success: ok });
});

app.delete('/api/posts/:id', requireAuth, (req: Request, res: Response) => {
  const ok = dbService.deleteCommunityPost(req.params.id);
  return res.json({ success: ok });
});

app.post('/api/posts/:id/comments', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { content, parentId, quotes, isSpoiler } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });
  const comment = dbService.addCommunityPostComment(req.params.id, user.id, { content, parentId, quotes, isSpoiler });
  if (!comment) return res.status(404).json({ error: 'Post not found or locked' });
  return res.json({ comment });
});

app.post('/api/posts/:id/comments/:commentId/like', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const likes = dbService.likeCommunityComment(req.params.id, req.params.commentId, user.id);
  return res.json({ likes });
});

app.post('/api/posts/:id/comments/:commentId/react', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { emoji } = req.body;
  const reactions = dbService.reactCommunityComment(req.params.id, req.params.commentId, user.id, emoji);
  return res.json({ reactions });
});

app.post('/api/posts/:id/poll-vote', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { optionId } = req.body;
  const post = dbService.votePoll(req.params.id, optionId, user.id);
  return res.json({ post });
});

// ----------------------------------------------------
// CHAT ROOMS & REAL-TIME COMMUNITY SPACES
// ----------------------------------------------------
app.get('/api/chat/rooms', (req: Request, res: Response) => {
  const rooms = dbService.getChatRooms();
  return res.json({ rooms });
});

app.get('/api/chat/rooms/:slug', (req: Request, res: Response) => {
  const room = dbService.getChatRoomBySlug(req.params.slug);
  if (!room) return res.status(404).json({ error: 'Chat room not found' });
  const messages = dbService.getChatMessages(room.id);
  return res.json({ room, messages });
});

app.get('/api/chat/rooms/:roomId/messages', (req: Request, res: Response) => {
  const messages = dbService.getChatMessages(req.params.roomId);
  return res.json({ messages });
});

app.post('/api/chat/rooms/:roomId/messages', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const message = dbService.sendChatMessage(req.params.roomId, user.id, req.body);
  return res.json({ message });
});

app.post('/api/chat/rooms/:roomId/messages/:messageId/react', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { emoji } = req.body;
  const reactions = dbService.reactChatMessage(req.params.roomId, req.params.messageId, user.id, emoji);
  return res.json({ reactions });
});

app.post('/api/chat/rooms/:roomId/pin', requireAuth, (req: Request, res: Response) => {
  const { message } = req.body;
  const ok = dbService.pinChatMessage(req.params.roomId, message);
  return res.json({ success: ok });
});

app.post('/api/chat/rooms/:roomId/lock', requireAuth, (req: Request, res: Response) => {
  const { isLocked } = req.body;
  const ok = dbService.lockChatRoom(req.params.roomId, Boolean(isLocked));
  return res.json({ success: ok });
});

// ----------------------------------------------------
// EVENTS & CONTESTS
// ----------------------------------------------------
app.get('/api/events', (req: Request, res: Response) => {
  const events = dbService.getCommunityEvents();
  return res.json({ events });
});

app.post('/api/events', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const event = dbService.createCommunityEvent(user.id, req.body);
  return res.json({ event });
});

app.post('/api/events/:id/join', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const success = dbService.joinCommunityEvent(req.params.id, user.id);
  return res.json({ success });
});

app.get('/api/contests', (req: Request, res: Response) => {
  const contests = dbService.getCommunityContests();
  return res.json({ contests });
});

app.post('/api/contests/:id/submit', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const submission = dbService.submitContestEntry(req.params.id, user.id, req.body);
  if (!submission) return res.status(404).json({ error: 'Contest not found' });
  return res.json({ submission });
});

app.post('/api/contests/:id/entries/:subId/vote', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const success = dbService.voteContestEntry(req.params.id, req.params.subId, user.id);
  return res.json({ success });
});

// ----------------------------------------------------
// DIRECT MESSAGES & SOCIAL CONVERSATIONS
// ----------------------------------------------------
app.get('/api/conversations', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const conversations = dbService.getDirectMessageConversations(user.id);
  return res.json({ conversations });
});

app.post('/api/conversations', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { targetUserId, initialMessage } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' });
  const conversation = dbService.startDirectConversation(user.id, targetUserId, initialMessage);
  return res.json({ conversation });
});

app.get('/api/conversations/:id/messages', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const messages = dbService.getDirectMessages(req.params.id, user.id);
  return res.json({ messages });
});

app.post('/api/conversations/:id/messages', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const message = dbService.sendDirectMessage(user.id, req.params.id, req.body);
  if (!message) return res.status(403).json({ error: 'Not authorized or conversation not found' });
  return res.json({ message });
});

// ----------------------------------------------------
// READING LISTS & QUOTE SNIPPETS
// ----------------------------------------------------
app.get('/api/reading-lists', (req: Request, res: Response) => {
  const { userId } = req.query;
  const lists = dbService.getReadingLists(userId ? String(userId) : undefined);
  return res.json({ lists });
});

app.post('/api/reading-lists', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const list = dbService.createReadingList(user.id, req.body);
  return res.json({ list });
});

app.post('/api/reading-lists/:id/toggle-story', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { storyId } = req.body;
  const ok = dbService.toggleStoryInReadingList(req.params.id, storyId, user.id);
  return res.json({ success: ok });
});

app.get('/api/quote-snippets', (req: Request, res: Response) => {
  const quotes = dbService.getQuoteSnippets();
  return res.json({ quotes });
});

app.post('/api/quote-snippets', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const quote = dbService.createQuoteSnippet(user.id, req.body);
  return res.json({ quote });
});

app.post('/api/quote-snippets/:id/like', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const likes = dbService.likeQuoteSnippet(req.params.id, user.id);
  return res.json({ likes });
});

// ----------------------------------------------------
// SAFETY, MODERATION & REPORTS
// ----------------------------------------------------
app.post('/api/reports', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const report = dbService.reportContent(user.id, req.body);
  return res.json({ report });
});

app.get('/api/admin/reports', requireAdmin, (req: Request, res: Response) => {
  const reports = dbService.getReports();
  return res.json({ reports });
});

app.post('/api/admin/reports/:id/resolve', requireAdmin, (req: Request, res: Response) => {
  const { status } = req.body;
  const ok = dbService.resolveReport(req.params.id, status || 'RESOLVED');
  return res.json({ success: ok });
});

app.post('/api/users/:id/block', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const isBlocked = dbService.toggleBlockUser(user.id, req.params.id);
  return res.json({ isBlocked });
});

app.post('/api/users/:id/mute', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const isMuted = dbService.toggleMuteUser(user.id, req.params.id);
  return res.json({ isMuted });
});

app.get('/api/user/safety-preferences', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const blocked = dbService.getBlockedUsers(user.id);
  const muted = dbService.getMutedUsers(user.id);
  return res.json({ blocked, muted });
});

app.get('/api/theories', (req: Request, res: Response) => {
  const { storyId } = req.query;
  const theories = dbService.getTheories(storyId ? String(storyId) : undefined);
  return res.json({ theories });
});

app.post('/api/theories', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const theory = dbService.createTheory(user.id, req.body);
  return res.json({ theory });
});

app.post('/api/theories/:id/vote', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { vote } = req.body;
  const theory = dbService.voteTheory(req.params.id, vote, user.id);
  return res.json({ theory });
});

// ----------------------------------------------------
// CHARACTERS, WORLDS, UNIVERSES
// ----------------------------------------------------
app.get('/api/characters', (req: Request, res: Response) => {
  const { authorId } = req.query;
  const characters = dbService.getCharacters(authorId ? String(authorId) : undefined);
  const relationships = dbService.getCharacterRelationships();
  return res.json({ characters, relationships });
});

app.post('/api/characters', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const character = dbService.createCharacter(req.body, user);
  return res.json({ character });
});

app.post('/api/character-relationships', requireAuth, (req: Request, res: Response) => {
  const rel = dbService.createCharacterRelationship(req.body);
  return res.json({ relationship: rel });
});

app.get('/api/worlds', (req: Request, res: Response) => {
  const { authorId } = req.query;
  const worlds = dbService.getWorlds(authorId ? String(authorId) : undefined);
  return res.json({ worlds });
});

app.post('/api/worlds', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const world = dbService.createWorld(req.body, user);
  return res.json({ world });
});

app.get('/api/universes', (req: Request, res: Response) => {
  const { authorId } = req.query;
  const universes = dbService.getUniverses(authorId ? String(authorId) : undefined);
  return res.json({ universes });
});

app.get('/api/universes/:idOrSlug', (req: Request, res: Response) => {
  const result = dbService.findUniverseByIdOrSlug(req.params.idOrSlug);
  if (!result) {
    return res.status(404).json({ error: 'Universe not found' });
  }
  return res.json(result);
});

app.post('/api/universes', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const universe = dbService.createUniverse(req.body, user);
  return res.json({ universe });
});

// ----------------------------------------------------
// ANIME DISCOVERY & TRACKING
// ----------------------------------------------------
app.get('/api/anime', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const anime = dbService.getAnimeEntries(user ? user.id : undefined);
  return res.json({ anime });
});

app.post('/api/anime/:id/track', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { status, episodesWatched } = req.body;
  const tracking = dbService.trackAnime(user.id, req.params.id, status, Number(episodesWatched));
  return res.json({ tracking });
});

// ----------------------------------------------------
// NOTIFICATIONS & CREATOR ANALYTICS & SEARCH
// ----------------------------------------------------
app.get('/api/notifications', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const notifications = dbService.getNotifications(user.id);
  return res.json({ notifications });
});

app.post('/api/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  dbService.markNotificationRead(req.params.id);
  return res.json({ success: true });
});

app.post('/api/notifications/read-all', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  dbService.markAllNotificationsRead(user.id);
  return res.json({ success: true });
});

app.get('/api/studio/analytics', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const stats = dbService.getCreatorAnalytics(user.id);
  return res.json({ stats });
});

app.get('/api/search', (req: Request, res: Response) => {
  const q = String(req.query.q || '');
  const results = dbService.search(q);
  return res.json(results);
});

app.get('/api/users/:username', (req: Request, res: Response) => {
  const user = dbService.findUserByEmailOrUsername(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const stories = dbService.getStories().filter(s => s.authorId === user.id);
  const badges = dbService.getUserBadges(user.id);
  return res.json({ user, stories, badges });
});

// ----------------------------------------------------
// MASTER ADMIN PORTAL ENDPOINTS
// ----------------------------------------------------
app.get('/api/admin/stats', requireAdmin, (req: Request, res: Response) => {
  const stats = dbService.getAdminPlatformStats();
  return res.json({ stats });
});

app.get('/api/admin/users', requireAdmin, (req: Request, res: Response) => {
  const users = dbService.getAllUsersForAdmin();
  return res.json({ users });
});

app.patch('/api/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const targetId = req.params.id;
  
  // Prevent admin from demoting themselves or suspending their own account to prevent lockouts
  if (targetId === user.id) {
    if (req.body.role && req.body.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Cannot demote your own active master admin account' });
    }
    if (req.body.status && req.body.status === 'SUSPENDED') {
      return res.status(400).json({ error: 'Cannot suspend your own active master admin account' });
    }
  }

  const updated = dbService.updateUserByAdmin(targetId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user: updated });
});

app.delete('/api/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const targetId = req.params.id;
  if (targetId === user.id) {
    return res.status(400).json({ error: 'Cannot delete the active master admin account' });
  }
  const success = dbService.deleteUserByAdmin(targetId);
  return res.json({ success });
});

app.patch('/api/admin/stories/:id', requireAdmin, (req: Request, res: Response) => {
  const story = dbService.updateStory(req.params.id, req.body);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  return res.json({ story });
});

app.delete('/api/admin/stories/:id', requireAdmin, (req: Request, res: Response) => {
  const success = dbService.deleteStory(req.params.id);
  return res.json({ success });
});

app.delete('/api/admin/posts/:id', requireAdmin, (req: Request, res: Response) => {
  const success = dbService.deleteCommunityPost(req.params.id);
  return res.json({ success });
});

app.delete('/api/admin/theories/:id', requireAdmin, (req: Request, res: Response) => {
  const success = dbService.deleteTheory(req.params.id);
  return res.json({ success });
});

// Health Check & Root API Status
app.get(['/api', '/api/health'], (req: Request, res: Response) => {
  return res.json({ status: 'ok', app: 'KAIRO API', timestamp: new Date().toISOString() });
});

// 404 Handler for all unmatched API routes (ensures JSON response instead of HTML)
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

export default app;
export { app };

