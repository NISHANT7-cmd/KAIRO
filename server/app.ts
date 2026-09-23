import express, { Request, Response, NextFunction } from 'express';
import { dbService } from './db.js';
import { recommendationService } from './recommendationService.js';
import { User, UserInterestProfile } from '../src/types.js';
import { isSupabaseConfigured, getSupabaseClient, runSupabaseDataMigration, loadFullStateFromSupabase, checkSupabaseSchemaReady } from './supabase.js';
import fs from 'fs';
import path from 'path';
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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database Readiness Guard: Ensure Supabase-authoritative state is fully loaded before routing any request
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await dbService.ensureReady();
  } catch (err: any) {
    console.error('[DB Readiness Middleware Error]:', err?.message || err);
  }
  next();
});

// Early Session Hydration Middleware: populates req.user if valid bearer token is provided
app.use(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        const result = await dbService.validateSessionDetails(token);
        if (result.status === 'OK' && result.user) {
          (req as any).user = result.user;
          (req as any).authResult = { user: result.user, status: 200, code: 'OK', message: 'Session verified successfully.' };
        } else {
          (req as any).authResult = {
            user: result.user || null,
            status: result.status === 'SUSPENDED' ? 403 : 401,
            code: result.status === 'SUSPENDED' ? 'SUSPENDED' : result.status === 'EXPIRED' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
            message: result.status === 'SUSPENDED' ? 'Access denied: Account suspended.' : 'Session expired or invalid.'
          };
        }
      } catch (err) {
        // non-blocking for unauthenticated endpoints
      }
    }
  }
  next();
});

// Dedicated Upload endpoint for gallery/internal storage uploads
app.post('/api/upload', (req: Request, res: Response) => {
  const { image, name } = req.body || {};
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Image data URL or string is required' });
  }
  return res.json({ 
    url: image, 
    name: name || 'uploaded_image',
    uploadedAt: new Date().toISOString()
  });
});

interface AuthVerificationResult {
  user: User | null;
  status: number;
  code: 'OK' | 'MISSING_TOKEN' | 'MALFORMED_HEADER' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'USER_NOT_FOUND' | 'SUSPENDED';
  message: string;
}

// Strict Token Authentication Helper with Detailed Verification
async function verifyAuthToken(req: Request): Promise<AuthVerificationResult> {
  if ((req as any).authResult) {
    return (req as any).authResult as AuthVerificationResult;
  }

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

  const result = await dbService.validateSessionDetails(token);

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

  const verified: AuthVerificationResult = { user: result.user, status: 200, code: 'OK', message: 'Session verified successfully.' };
  (req as any).authResult = verified;
  (req as any).user = result.user;
  return verified;
}

function getUserFromReq(req: Request): User | null {
  if ((req as any).user) return (req as any).user;
  if ((req as any).authResult?.user) return (req as any).authResult.user;
  return null;
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = await verifyAuthToken(req);
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

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = await verifyAuthToken(req);
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
app.post('/api/auth/signup', async (req: Request, res: Response) => {
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

    // Check database for existing account (both in-memory cache and Supabase)
    const existing = (await dbService.findUserByEmailOrUsernameAsync(cleanUsername)) || (await dbService.findUserByEmailOrUsernameAsync(cleanEmail));
    if (existing) {
      logAuth('SIGNUP_FAILED_DUPLICATE', { username: cleanUsername, email: cleanEmail });
      return res.status(400).json({ error: 'A user with this username or email already exists', code: 'USER_EXISTS' });
    }

    // Standard registration can be USER or WRITER. Only ADMIN portal can grant ADMIN role.
    const assignedRole = role === 'WRITER' ? 'WRITER' : 'USER';

    // Await authoritative persistence to Supabase profiles and user_credentials tables
    const user = await dbService.createUser({
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

    // Await authoritative session creation in Supabase user_sessions table
    const session = await dbService.createSession(user.id);
    const enrichedUser = dbService.getUserEnriched(user);

    logAuth('SIGNUP_SUCCESS', { userId: user.id, username: user.username, role: user.role });
    return res.status(201).json({ token: session.token, user: enrichedUser });
  } catch (err: any) {
    logAuthError('SIGNUP_INTERNAL_ERROR', err);
    return res.status(500).json({ error: err.message || 'Internal server error during registration', code: 'INTERNAL_ERROR' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const login = req.body?.login || req.body?.emailOrUsername || req.body?.username || req.body?.email;
    const password = req.body?.password;
    logAuth('LOGIN_ATTEMPT', { login });

    if (!login || !password) {
      logAuth('LOGIN_FAILED_MISSING_CREDENTIALS', { login });
      return res.status(400).json({ error: 'Login identifier and password are required', code: 'MISSING_CREDENTIALS' });
    }

    const user = await dbService.findUserByEmailOrUsernameAsync(login);
    if (!user) {
      logAuth('LOGIN_FAILED_USER_NOT_FOUND', { login });
      return res.status(401).json({ error: 'Invalid username or password', code: 'INVALID_CREDENTIALS' });
    }

    if (user.status === 'SUSPENDED') {
      logAuth('LOGIN_FAILED_ACCOUNT_SUSPENDED', { userId: user.id, username: user.username });
      return res.status(403).json({ error: 'Account suspended: Please contact platform administration.', code: 'ACCOUNT_SUSPENDED' });
    }

    const valid = await dbService.verifyPassword(user.id, password);
    if (!valid) {
      logAuth('LOGIN_FAILED_INVALID_PASSWORD', { userId: user.id, username: user.username });
      return res.status(401).json({ error: 'Invalid username or password', code: 'INVALID_CREDENTIALS' });
    }

    const session = await dbService.createSession(user.id);
    const enrichedUser = dbService.getUserEnriched(user);

    logAuth('LOGIN_SUCCESS', { userId: user.id, username: user.username, role: user.role });
    return res.json({ token: session.token, user: enrichedUser });
  } catch (err: any) {
    logAuthError('LOGIN_INTERNAL_ERROR', err);
    return res.status(500).json({ error: err.message || 'Internal server error during authentication', code: 'INTERNAL_ERROR' });
  }
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      await dbService.destroySession(token);
      logAuth('LOGOUT_SUCCESS', { tokenLength: token.length });
    }
  }
  return res.json({ success: true, message: 'Signed out successfully' });
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  const auth = await verifyAuthToken(req);
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

app.patch('/api/auth/profile', requireAuth, async (req: Request, res: Response) => {
  try {
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
    if (req.body.role === 'WRITER' || (req.body.role === 'USER' && user.role !== 'ADMIN')) {
      safeUpdates.role = req.body.role;
      if (req.body.role === 'WRITER') {
        safeUpdates.isVerifiedWriter = true;
      }
    }
    if (typeof req.body.isVerifiedWriter === 'boolean' && (user.role === 'ADMIN' || user.role === 'WRITER' || req.body.role === 'WRITER')) {
      safeUpdates.isVerifiedWriter = req.body.isVerifiedWriter;
    }

    const updated = await dbService.updateUser(user.id, safeUpdates);
    const enrichedUser = updated ? dbService.getUserEnriched(updated) : undefined;
    return res.json({ user: enrichedUser });
  } catch (err: any) {
    console.error('[Profile Update Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

app.get('/api/users/profile/:idOrUsername', (req: Request, res: Response) => {
  const viewer = getUserFromReq(req);
  let rawTarget = req.params.idOrUsername;
  let target = rawTarget;
  try {
    target = decodeURIComponent(rawTarget);
  } catch {}
  let targetIdOrUsername = target === 'me' ? (viewer?.id || '') : target;
  
  if (!targetIdOrUsername || targetIdOrUsername === '[object Object]' || targetIdOrUsername === 'undefined' || targetIdOrUsername === 'null') {
    if (viewer) {
      targetIdOrUsername = viewer.id;
    } else {
      return res.status(401).json({ error: 'Please sign in to view your profile' });
    }
  }

  let profile = dbService.getPublicUserProfile(targetIdOrUsername, viewer?.id);
  if (!profile && viewer && (targetIdOrUsername.toLowerCase() === 'me' || targetIdOrUsername.toLowerCase() === viewer.username.toLowerCase() || targetIdOrUsername === viewer.id)) {
    profile = dbService.getPublicUserProfile(viewer.id, viewer.id);
  }

  if (!profile) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  return res.json(profile);
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
    const aid = String(authorId).trim().toLowerCase();
    list = list.filter(s => 
      (s.authorId && s.authorId.toLowerCase() === aid) ||
      (s.authorUsername && s.authorUsername.toLowerCase() === aid)
    );
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

app.post('/api/stories', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    if (user.role === 'USER') {
      user.role = 'WRITER';
      user.isVerifiedWriter = true;
      await dbService.updateUser(user.id, { role: 'WRITER', isVerifiedWriter: true });
    }
    const story = await dbService.createStory(req.body, user);
    return res.json({ story, user: dbService.getUserEnriched(user) });
  } catch (err: any) {
    console.error('[Story Create Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to create story' });
  }
});

const handleStoryUpdate = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    let rawId = req.params.id;
    try { rawId = decodeURIComponent(rawId); } catch {}
    const story = dbService.findStoryByIdOrSlug(rawId);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (story.authorId !== user.id && story.authorUsername !== user.username && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You do not own this story' });
    }

    const updated = await dbService.updateStory(story.id, req.body);
    return res.json({ story: updated });
  } catch (err: any) {
    console.error('[Story Update Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to update story' });
  }
};

app.patch('/api/stories/:id', requireAuth, handleStoryUpdate);
app.put('/api/stories/:id', requireAuth, handleStoryUpdate);

app.delete('/api/stories/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    let rawId = req.params.id;
    try { rawId = decodeURIComponent(rawId); } catch {}
    const story = dbService.findStoryByIdOrSlug(rawId);
    if (!story) {
      const inTrash = (dbService.getRaw().recentlyDeletedStories || []).find(r => r.id === rawId || r.story.id === rawId || r.story.slug === rawId);
      if (inTrash) {
        return res.json({ success: true, movedToTrash: true, alreadyInTrash: true });
      }
      return res.status(404).json({ error: 'Story not found' });
    }

    const isOwner = user.role === 'ADMIN' || 
      story.authorId === user.id || 
      (story.authorUsername && user.username && story.authorUsername.toLowerCase() === user.username.toLowerCase()) ||
      (story.authorDisplayName && user.displayName && story.authorDisplayName.toLowerCase() === user.displayName.toLowerCase());

    if (!isOwner) {
      return res.status(403).json({ error: 'Forbidden: You do not own this story' });
    }

    const result = await dbService.moveToRecentlyDeleted(story.id, user);
    return res.json({ success: true, movedToTrash: true, record: result.record });
  } catch (err: any) {
    console.error('[Story Delete Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete story' });
  }
});

// Recently Deleted (Trash Bin) Endpoints
app.get('/api/stories-trash', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const list = dbService.getRecentlyDeleted(user.role === 'ADMIN' ? undefined : user.id);
  return res.json({ trash: list });
});

app.post('/api/stories-trash/:id/restore', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    let rawId = req.params.id;
    try { rawId = decodeURIComponent(rawId); } catch {}
    const result = await dbService.restoreRecentlyDeleted(rawId, user);
    if (!result.success) {
      return res.status(400).json({ error: result.message || 'Failed to restore story' });
    }
    return res.json({ success: true, story: result.story });
  } catch (err: any) {
    console.error('[Story Restore Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to restore story' });
  }
});

app.delete('/api/stories-trash/:id/permanent', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    let rawId = req.params.id;
    try { rawId = decodeURIComponent(rawId); } catch {}
    const success = await dbService.permanentlyDeleteTrashStory(rawId, user);
    if (!success) {
      return res.status(400).json({ error: 'Story not found in recently deleted or not authorized' });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error('[Story Permanent Delete Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to permanently delete story' });
  }
});

app.get('/api/stories/:id/chapters', (req: Request, res: Response) => {
  const story = dbService.findStoryByIdOrSlug(req.params.id);
  if (!story) return res.status(404).json({ error: 'Story not found' });
  const chapters = dbService.getStoryChapters(story.id);
  return res.json({ chapters });
});

app.post('/api/stories/:id/chapters', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    let story = dbService.findStoryByIdOrSlug(req.params.id);
    if (!story && req.body && req.body.storyId) {
      story = dbService.findStoryByIdOrSlug(req.body.storyId);
    }
    if (!story && req.body && req.body.storySlug) {
      story = dbService.findStoryByIdOrSlug(req.body.storySlug);
    }
    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (story.authorId !== user.id && story.authorUsername !== user.username && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You do not own this story' });
    }

    const chapter = await dbService.createChapter(req.body, story.id);
    return res.json({ chapter });
  } catch (err: any) {
    console.error('[Chapter Create Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to create chapter' });
  }
});

app.post('/api/chapters', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const targetStoryId = req.body?.storyId || req.body?.storySlug || (req.query?.storyId as string);
    if (!targetStoryId) return res.status(400).json({ error: 'storyId is required' });
    const story = dbService.findStoryByIdOrSlug(targetStoryId);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (story.authorId !== user.id && story.authorUsername !== user.username && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You do not own this story' });
    }

    const chapter = await dbService.createChapter(req.body, story.id);
    return res.json({ chapter });
  } catch (err: any) {
    console.error('[Chapter Create Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to create chapter' });
  }
});

app.get('/api/chapters/:chapterId', (req: Request, res: Response) => {
  const chapter = dbService.findChapter(req.params.chapterId);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
  const story = dbService.findStoryByIdOrSlug(chapter.storyId);
  const allChapters = story ? dbService.getStoryChapters(story.id) : [];
  return res.json({ chapter, story, allChapters });
});

app.patch('/api/chapters/:chapterId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const chapter = dbService.findChapter(req.params.chapterId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    const story = dbService.findStoryByIdOrSlug(chapter.storyId);
    if (story && story.authorId !== user.id && story.authorUsername !== user.username && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You do not own this chapter' });
    }

    const updated = await dbService.updateChapter(chapter.id, req.body);
    return res.json({ chapter: updated });
  } catch (err: any) {
    console.error('[Chapter Update Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to update chapter' });
  }
});

app.delete('/api/chapters/:chapterId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const chapter = dbService.findChapter(req.params.chapterId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    const story = dbService.findStoryByIdOrSlug(chapter.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (story.authorId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You do not own this chapter' });
    }

    await dbService.deleteChapter(chapter.id);
    return res.json({ success: true });
  } catch (err: any) {
    console.error('[Chapter Delete Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete chapter' });
  }
});

// ----------------------------------------------------
// READING PROGRESS & LIBRARY
// ----------------------------------------------------
app.post('/api/reading-progress', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const progress = await dbService.saveReadingProgress(user.id, req.body);
    
    // Track behavior event
    const isComplete = progress.progressPercent >= 90;
    recommendationService.recordBehaviorEvent(user.id, {
      eventType: isComplete ? 'chapter_completed' : 'reading_duration',
      contentType: 'CHAPTER',
      contentId: progress.chapterId,
      metadata: {
        storyId: progress.storyId,
        progressPercent: progress.progressPercent,
        readingTimeMinutes: (progress as any).readingTimeMinutes || 0
      }
    });

    return res.json({ progress });
  } catch (err: any) {
    console.error('[Reading Progress Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to save reading progress' });
  }
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

app.post('/api/library/toggle', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { storyId, listType = 'saved' } = req.body;
    const result = await dbService.toggleLibrary(user.id, storyId, listType);

    recommendationService.recordBehaviorEvent(user.id, {
      eventType: result.inLibrary ? 'bookmark' : 'unbookmark',
      contentType: 'STORY',
      contentId: storyId,
      metadata: { listType }
    });

    return res.json(result);
  } catch (err: any) {
    console.error('[Library Toggle Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to update library' });
  }
});

app.post('/api/stories/:id/like', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const result = await dbService.toggleLikeStory(user.id, req.params.id);

    if (result.liked) {
      recommendationService.recordBehaviorEvent(user.id, {
        eventType: 'like',
        contentType: 'STORY',
        contentId: req.params.id
      });
    }

    return res.json(result);
  } catch (err: any) {
    console.error('[Story Like Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to like story' });
  }
});

app.post('/api/users/:id/follow', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const result = await dbService.toggleFollowUser(user.id, req.params.id);

    if (result.following) {
      recommendationService.recordBehaviorEvent(user.id, {
        eventType: 'follow_author',
        contentType: 'AUTHOR',
        contentId: req.params.id
      });
    }

    return res.json(result);
  } catch (err: any) {
    console.error('[User Follow Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to follow user' });
  }
});

// ----------------------------------------------------
// CHAPTER COMMENTS & REVIEWS
// ----------------------------------------------------
app.get('/api/chapters/:chapterId/comments', (req: Request, res: Response) => {
  const comments = dbService.getChapterComments(req.params.chapterId);
  return res.json({ comments });
});

app.post('/api/chapters/:chapterId/comments', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { storyId, content, parentId } = req.body;
    const comment = await dbService.addChapterComment(user.id, req.params.chapterId, storyId, content, parentId);

    recommendationService.recordBehaviorEvent(user.id, {
      eventType: 'comment',
      contentType: 'CHAPTER',
      contentId: req.params.chapterId,
      metadata: { storyId }
    });

    return res.json({ comment });
  } catch (err: any) {
    console.error('[Chapter Comment Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to post chapter comment' });
  }
});

app.post('/api/comments/:commentId/like', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const comment = await dbService.likeComment(req.params.commentId, user.id);
    return res.json({ comment });
  } catch (err: any) {
    console.error('[Comment Like Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to like comment' });
  }
});

app.post('/api/stories/:id/reviews', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { rating, reviewText } = req.body;
    const review = await dbService.addReview(user.id, req.params.id, Number(rating), reviewText);

    recommendationService.recordBehaviorEvent(user.id, {
      eventType: 'review',
      contentType: 'STORY',
      contentId: req.params.id,
      metadata: { rating: Number(rating) }
    });

    return res.json({ review });
  } catch (err: any) {
    console.error('[Story Review Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to add review' });
  }
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

app.post('/api/communities', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const community = await dbService.createCommunity(user.id, req.body);
    return res.json({ community });
  } catch (err: any) {
    console.error('[Community Create Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to create community' });
  }
});

app.get('/api/communities/:slug', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const community = dbService.getCommunityBySlug(req.params.slug, user?.id);
  if (!community) return res.status(404).json({ error: 'Community not found' });
  const posts = dbService.getCommunityPosts(community.id, user?.id);
  return res.json({ community, posts });
});

app.post('/api/communities/:id/join', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { accessCode } = req.body;
    const result = await dbService.joinCommunity(req.params.id, user.id, accessCode);
    if (!result.success) return res.status(400).json({ error: result.message });
    return res.json({ success: true });
  } catch (err: any) {
    console.error('[Community Join Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to join community' });
  }
});

app.post('/api/communities/:id/leave', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const success = await dbService.leaveCommunity(req.params.id, user.id);
    return res.json({ success });
  } catch (err: any) {
    console.error('[Community Leave Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to leave community' });
  }
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

app.post('/api/communities/:id/posts', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const post = await dbService.createCommunityPost(user.id, req.params.id, req.body);
    return res.json({ post });
  } catch (err: any) {
    console.error('[Community Post Create Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to create community post' });
  }
});

app.post('/api/posts/:id/like', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const likes = await dbService.likeCommunityPost(req.params.id, user.id);
    return res.json({ likes });
  } catch (err: any) {
    console.error('[Post Like Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to like post' });
  }
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

app.post('/api/posts/:id/pin', requireAuth, async (req: Request, res: Response) => {
  try {
    const { isPinned } = req.body;
    const ok = await dbService.pinPost(req.params.id, Boolean(isPinned));
    return res.json({ success: ok });
  } catch (err: any) {
    console.error('[Post Pin Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to pin post' });
  }
});

app.post('/api/posts/:id/lock', requireAuth, async (req: Request, res: Response) => {
  try {
    const { isLocked } = req.body;
    const ok = await dbService.lockPost(req.params.id, Boolean(isLocked));
    return res.json({ success: ok });
  } catch (err: any) {
    console.error('[Post Lock Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to lock post' });
  }
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
  const { authorId, storyId } = req.query;
  const characters = dbService.getCharacters(
    authorId ? String(authorId) : undefined,
    storyId ? String(storyId) : undefined
  );
  const relationships = dbService.getCharacterRelationships();
  return res.json({ characters, relationships });
});

app.get('/api/stories/:id/characters', (req: Request, res: Response) => {
  let rawId = req.params.id;
  try { rawId = decodeURIComponent(rawId); } catch {}
  const characters = dbService.getStoryCharacters(rawId);
  return res.json({ characters });
});

app.post('/api/characters', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const character = await dbService.createCharacter(req.body, user);
    return res.json({ character });
  } catch (err: any) {
    console.error('[Character Create Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to create character' });
  }
});

app.patch('/api/characters/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    let charId = req.params.id;
    try { charId = decodeURIComponent(charId); } catch {}
    const updated = await dbService.updateCharacter(charId, req.body, user);
    if (!updated) {
      return res.status(404).json({ error: 'Character not found or you lack permission to edit it' });
    }
    return res.json({ character: updated });
  } catch (err: any) {
    console.error('[Character Update Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to update character' });
  }
});

app.put('/api/characters/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    let charId = req.params.id;
    try { charId = decodeURIComponent(charId); } catch {}
    const updated = await dbService.updateCharacter(charId, req.body, user);
    if (!updated) {
      return res.status(404).json({ error: 'Character not found or you lack permission to edit it' });
    }
    return res.json({ character: updated });
  } catch (err: any) {
    console.error('[Character Update Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to update character' });
  }
});

app.delete('/api/characters/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    let charId = req.params.id;
    try { charId = decodeURIComponent(charId); } catch {}
    const success = await dbService.deleteCharacter(charId, user);
    if (!success) {
      return res.status(404).json({ error: 'Character not found or you lack permission to delete it' });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error('[Character Delete Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete character' });
  }
});

app.post('/api/stories/:id/characters/extract', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  let storyId = req.params.id;
  try { storyId = decodeURIComponent(storyId); } catch {}
  const story = dbService.findStoryByIdOrSlug(storyId);
  if (!story) return res.status(404).json({ error: 'Story not found' });
  if (story.authorId !== user.id && story.authorUsername !== user.username && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: You do not own this story' });
  }
  const characters = dbService.extractCharactersFromStory(story.id, user);
  return res.json({ characters });
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

app.post('/api/worlds', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const world = await dbService.createWorld(req.body, user);
    return res.json({ world });
  } catch (err: any) {
    console.error('[World Create Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to create world' });
  }
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

app.post('/api/universes', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const universe = await dbService.createUniverse(req.body, user);
    return res.json({ universe });
  } catch (err: any) {
    console.error('[Universe Create Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to create universe' });
  }
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

// ==========================================
// MASTER ADMIN PROGRAMS & COMPETITIONS API
// ==========================================

// 1. Admin Summary Stats
app.get('/api/admin/programs/summary', requireAdmin, (req: Request, res: Response) => {
  const summary = dbService.getAdminProgramsSummary();
  return res.json({ summary });
});

// 2. Admin List Programs (with filters)
app.get('/api/admin/programs', requireAdmin, (req: Request, res: Response) => {
  const filter = {
    status: req.query.status as string,
    type: req.query.type as string,
    visibility: req.query.visibility as string,
    search: req.query.search as string
  };
  const programs = dbService.getPrograms(filter);
  return res.json({ programs });
});

// 3. Admin Create Program
app.post('/api/admin/programs', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const newProgram = dbService.createProgram(req.body, adminUser);
  return res.status(201).json({ program: newProgram });
});

// 4. Admin Get Single Program Detail
app.get('/api/admin/programs/:id', requireAdmin, (req: Request, res: Response) => {
  const program = dbService.getProgramById(req.params.id);
  if (!program) return res.status(404).json({ error: 'Program not found' });
  return res.json({ program });
});

// 5. Admin Update Program
app.patch('/api/admin/programs/:id', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const updated = dbService.updateProgram(req.params.id, req.body, adminUser);
  if (!updated) return res.status(404).json({ error: 'Program not found' });
  return res.json({ program: updated });
});

// 6. Admin Manual Status Override
app.post('/api/admin/programs/:id/status', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const { status, reason } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  const updated = dbService.overrideProgramStatus(req.params.id, status, adminUser, reason);
  if (!updated) return res.status(404).json({ error: 'Program not found' });
  return res.json({ program: updated });
});

// 7. Admin Duplicate Program
app.post('/api/admin/programs/:id/duplicate', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const cloned = dbService.duplicateProgram(req.params.id, adminUser, req.body.newName);
  if (!cloned) return res.status(404).json({ error: 'Source program not found' });
  return res.status(201).json({ program: cloned });
});

// 8. Admin Delete Program
app.delete('/api/admin/programs/:id', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const success = dbService.deleteProgram(req.params.id, adminUser);
  return res.json({ success });
});

// 9. Admin Participants Management
app.get('/api/admin/programs/:id/participants', requireAdmin, (req: Request, res: Response) => {
  const participants = dbService.getProgramParticipants(req.params.id);
  return res.json({ participants });
});

app.patch('/api/admin/programs/:id/participants/:participantId', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const updated = dbService.updateProgramParticipant(req.params.participantId, req.body, adminUser);
  if (!updated) return res.status(404).json({ error: 'Participant not found' });
  return res.json({ participant: updated });
});

app.delete('/api/admin/programs/:id/participants/:participantId', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const success = dbService.removeProgramParticipant(req.params.participantId, adminUser);
  return res.json({ success });
});

// 10. Admin Submissions Management
app.get('/api/admin/programs/:id/submissions', requireAdmin, (req: Request, res: Response) => {
  const submissions = dbService.getProgramSubmissions(req.params.id);
  return res.json({ submissions });
});

app.patch('/api/admin/programs/:id/submissions/:submissionId', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const updated = dbService.updateProgramSubmission(req.params.submissionId, req.body, adminUser, true);
  if (!updated) return res.status(404).json({ error: 'Submission not found' });
  return res.json({ submission: updated });
});

app.delete('/api/admin/programs/:id/submissions/:submissionId', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const success = dbService.deleteProgramSubmission(req.params.submissionId, adminUser);
  return res.json({ success });
});

app.post('/api/admin/programs/:id/submissions/:submissionId/finalist', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const updated = dbService.toggleProgramFinalist(req.params.submissionId, !!req.body.isFinalist, adminUser);
  if (!updated) return res.status(404).json({ error: 'Submission not found' });
  return res.json({ submission: updated });
});

app.post('/api/admin/programs/:id/submissions/:submissionId/score', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const { criteriaScores, feedback } = req.body;
  if (!criteriaScores) return res.status(400).json({ error: 'Criteria scores required' });
  const updated = dbService.scoreProgramSubmission(req.params.submissionId, adminUser, criteriaScores, feedback);
  if (!updated) return res.status(404).json({ error: 'Submission not found' });
  return res.json({ submission: updated });
});

// 11. Admin Votes View & Audit
app.get('/api/admin/programs/:id/votes', requireAdmin, (req: Request, res: Response) => {
  const votes = dbService.getProgramVotes(req.params.id);
  return res.json({ votes });
});

// 12. Admin Result Declaration
app.post('/api/admin/programs/:id/declare-results', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const { winners, remarks } = req.body;
  if (!winners || !Array.isArray(winners)) return res.status(400).json({ error: 'Winners array required' });
  const updated = dbService.declareProgramResults(req.params.id, { winners, remarks }, adminUser);
  if (!updated) return res.status(404).json({ error: 'Program not found' });
  return res.json({ program: updated });
});

// 13. Admin Announcements
app.get('/api/admin/programs/:id/announcements', requireAdmin, (req: Request, res: Response) => {
  const announcements = dbService.getProgramAnnouncements(req.params.id);
  return res.json({ announcements });
});

app.post('/api/admin/programs/:id/announcements', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const ann = dbService.createProgramAnnouncement(req.params.id, req.body, adminUser);
  return res.status(201).json({ announcement: ann });
});

// 14. Admin Audit Logs
app.get('/api/admin/programs/:id/audit-logs', requireAdmin, (req: Request, res: Response) => {
  const logs = dbService.getProgramAuditLogs(req.params.id);
  return res.json({ logs });
});

// ------------------------------------------
// PUBLIC & PARTICIPANT PROGRAMS APIS
// ------------------------------------------

// Public list of active/published programs
app.get('/api/programs', (req: Request, res: Response) => {
  const programs = dbService.getPrograms({
    status: req.query.status as string,
    type: req.query.type as string,
    visibility: 'public',
    search: req.query.search as string
  });
  return res.json({ programs });
});

// Public single program
app.get('/api/programs/:slugOrId', (req: Request, res: Response) => {
  const program = dbService.getProgramBySlug(req.params.slugOrId) || dbService.getProgramById(req.params.slugOrId);
  if (!program) return res.status(404).json({ error: 'Program not found' });
  return res.json({ program });
});

// Public submissions for a program
app.get('/api/programs/:id/submissions', (req: Request, res: Response) => {
  const submissions = dbService.getProgramSubmissions(req.params.id);
  // Filter out internal drafts unless requested
  const publicSubs = submissions.filter(s => s.status !== 'DRAFT');
  return res.json({ submissions: publicSubs });
});

// Public announcements for a program
app.get('/api/programs/:id/announcements', (req: Request, res: Response) => {
  const announcements = dbService.getProgramAnnouncements(req.params.id);
  return res.json({ announcements });
});

// User register for program
app.post('/api/programs/:id/register', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { rulesAgreementCheckbox, userType } = req.body;
    if (!rulesAgreementCheckbox) {
      return res.status(400).json({ error: 'You must agree to the program rules to participate' });
    }
    const participant = await dbService.registerProgramParticipant(req.params.id, user, { rulesAgreementCheckbox, userType });
    return res.json({ participant });
  } catch (err: any) {
    console.error('[Program Register Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to register for program' });
  }
});

// User get status in program
app.get('/api/programs/:id/my-status', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const participants = dbService.getProgramParticipants(req.params.id);
  const myParticipant = participants.find(p => p.userId === user.id);
  const submissions = dbService.getProgramSubmissions(req.params.id);
  const mySubmission = submissions.find(s => s.userId === user.id);
  const votes = dbService.getProgramVotes(req.params.id);
  const myVotes = votes.filter(v => v.userId === user.id);

  return res.json({
    isRegistered: !!myParticipant,
    participant: myParticipant || null,
    submission: mySubmission || null,
    votesCastCount: myVotes.length,
    votedSubmissionIds: myVotes.map(v => v.submissionId)
  });
});

// User submit entry
app.post('/api/programs/:id/submit', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const prog = dbService.getProgramById(req.params.id);
    if (!prog) return res.status(404).json({ error: 'Program not found' });

    if (!['SUBMISSION_OPEN', 'REGISTRATION_OPEN'].includes(prog.status)) {
      return res.status(400).json({ error: 'Submissions are not currently open for this program' });
    }

    const submission = await dbService.createProgramSubmission(req.params.id, user, req.body);
    return res.status(201).json({ submission });
  } catch (err: any) {
    console.error('[Program Submit Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit program entry' });
  }
});

// User cast vote
app.post('/api/programs/:id/submissions/:submissionId/vote', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await dbService.voteProgramSubmission(req.params.id, req.params.submissionId, user, req.ip);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    return res.json(result);
  } catch (err: any) {
    console.error('[Program Vote Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to cast program vote' });
  }
});

// Public verify certificate
app.get('/api/certificates/:certId', (req: Request, res: Response) => {
  const cert = dbService.getCertificateById(req.params.certId);
  if (!cert) return res.status(404).json({ error: 'Certificate not found' });
  return res.json({ certificate: cert });
});

// ----------------------------------------------------
// ONBOARDING & PERSONALIZED RECOMMENDATIONS API
// ----------------------------------------------------

// Check user onboarding status
app.get('/api/onboarding/status', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) {
    return res.json({
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      profile: null
    });
  }

  const profile = recommendationService.getOrInitProfile(user.id);
  return res.json({
    isAuthenticated: true,
    hasCompletedOnboarding: profile.hasCompletedOnboarding,
    onboardingSkipped: Boolean(profile.onboardingSkipped),
    profile,
    storyDna: recommendationService.computeStoryDna(profile)
  });
});

// Complete full 7-step onboarding
app.post('/api/onboarding/complete', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  try {
    const updatedProfile = recommendationService.completeOnboarding(user.id, req.body);
    const enrichedUser = dbService.getUserEnriched(user);
    const storyDna = recommendationService.computeStoryDna(updatedProfile);

    return res.json({
      success: true,
      profile: updatedProfile,
      user: enrichedUser,
      storyDna
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to complete onboarding' });
  }
});

// Skip onboarding with default balanced profile
app.post('/api/onboarding/skip', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const profile = recommendationService.skipOnboarding(user.id);
  const enrichedUser = dbService.getUserEnriched(user);
  return res.json({
    success: true,
    profile,
    user: enrichedUser
  });
});

// Get personalized home feed
app.get('/api/recommendations/home', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const lang = req.query.lang as string | undefined;
  const feed = recommendationService.generateHomeFeed(user?.id, lang);
  return res.json(feed);
});

// Get personalized discover feed
app.get('/api/recommendations/discover', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const lang = req.query.lang as string | undefined;
  const feed = recommendationService.generateDiscoverFeed(user?.id, lang);
  return res.json(feed);
});

// Get user taste profile and Story DNA
app.get('/api/recommendations/profile', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const profile = recommendationService.getOrInitProfile(user.id);
  const storyDna = recommendationService.computeStoryDna(profile);
  return res.json({ profile, storyDna });
});

// Update taste profile preferences ("My Taste" settings)
app.put('/api/recommendations/profile', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const updatedProfile = recommendationService.updateProfilePreferences(user.id, req.body);
  const storyDna = recommendationService.computeStoryDna(updatedProfile);
  const enrichedUser = dbService.getUserEnriched(user);
  return res.json({ profile: updatedProfile, storyDna, user: enrichedUser });
});

// Reset personalization back to baseline
app.post('/api/recommendations/reset', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const db = (dbService as any).db;
  if (db.userInterestProfiles && db.userInterestProfiles[user.id]) {
    delete db.userInterestProfiles[user.id];
  }
  const freshProfile = recommendationService.getOrInitProfile(user.id);
  const storyDna = recommendationService.computeStoryDna(freshProfile);
  return res.json({ success: true, profile: freshProfile, storyDna });
});

// Negative signal feedback ("Not interested", "Don't recommend genre", "Mute author")
app.post('/api/recommendations/feedback', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { action, targetId, reason, metadata } = req.body;
  if (!action || !targetId) {
    return res.status(400).json({ error: 'Action and targetId are required' });
  }

  const profile = recommendationService.handleFeedback(user.id, action, targetId, { reason, ...metadata });
  return res.json({ success: true, profile });
});

// Restore a muted author or hidden story/genre
app.post('/api/recommendations/restore-feedback', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { type, targetId } = req.body;
  if (!type || !targetId) {
    return res.status(400).json({ error: 'Type (story|genre|author) and targetId are required' });
  }

  const profile = recommendationService.restoreNegativeSignal(user.id, type, targetId);
  return res.json({ success: true, profile });
});

// Track behavior interaction event
app.post('/api/recommendations/events', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) {
    return res.json({ recorded: false, reason: 'Guest user' });
  }

  const { eventType, contentType, contentId, metadata } = req.body;
  if (!eventType || !contentType || !contentId) {
    return res.status(400).json({ error: 'Missing event fields' });
  }

  recommendationService.recordBehaviorEvent(user.id, {
    eventType,
    contentType,
    contentId,
    metadata
  });

  return res.json({ recorded: true });
});

// Explain why a story was recommended
app.get('/api/recommendations/why/:storyId', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  const storyId = req.params.storyId;
  const explanation = recommendationService.explainRecommendation(user?.id || 'guest', storyId);
  return res.json(explanation);
});

// Admin get recommendation algorithm settings & telemetry
app.get('/api/recommendations/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const settings = recommendationService.getAdminSettings();
  const db = (dbService as any).db;
  const totalProfiles = Object.keys(db.userInterestProfiles || {}).length;
  const totalEvents = (db.userBehaviorEvents || []).length;

  // Aggregate popular genres across interest profiles
  const genreCounts: Record<string, number> = {};
  for (const pid of Object.keys(db.userInterestProfiles || {})) {
    const p: UserInterestProfile = db.userInterestProfiles[pid];
    for (const g of Object.keys(p.preferredGenres || {})) {
      if (p.preferredGenres[g] >= 0.7) {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      }
    }
  }

  return res.json({
    settings,
    analytics: {
      totalProfiles,
      totalEvents,
      popularGenres: Object.entries(genreCounts)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
    }
  });
});

// Admin update recommendation weights
app.put('/api/recommendations/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const updated = recommendationService.updateAdminSettings(req.body, user);
  return res.json({ success: true, settings: updated });
});

// Health Check & Root API Status
app.get(['/api', '/api/health'], (req: Request, res: Response) => {
  return res.json({ status: 'ok', app: 'KAIRO API', timestamp: new Date().toISOString() });
});

// Database Health & Integrity Status
app.get('/api/health/db', (req: Request, res: Response) => {
  return res.json(dbService.getDatabaseHealth());
});

// Client-Server Two-Way Persistence & Hydration
// Guarantees newly created stories, chapters, and characters survive container redeployments and restarts
app.post('/api/sync/hydrate', (req: Request, res: Response) => {
  try {
    const { stories, chapters, characters, deletedStoryIds } = req.body || {};
    const result = dbService.hydrateFromClient({ stories, chapters, characters, deletedStoryIds });
    return res.json({ success: true, ...result, currentHealth: dbService.getDatabaseHealth() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Hydration failed' });
  }
});

// Database Safe Export & Backup (for offline preservation)
app.get('/api/admin/db/export', (req: Request, res: Response) => {
  const raw = dbService.getRaw();
  // Strip sensitive hashed passwords from export
  const safeExport = {
    ...raw,
    passwords: {},
    sessions: {}
  };
  return res.json({
    exportedAt: new Date().toISOString(),
    health: dbService.getDatabaseHealth(),
    data: safeExport
  });
});

// Supabase Status & Production Health
app.get('/api/admin/supabase/status', async (req: Request, res: Response) => {
  const configured = isSupabaseConfigured();
  const client = getSupabaseClient();
  let connectionStatus = 'UNCONFIGURED';
  let tablesDiscovered: Record<string, number> = {};
  let remoteRecordsCount = 0;
  let lastMigration: any = null;
  let schemaReady = false;
  let schemaReason: string | undefined;

  if (configured && client) {
    try {
      const schemaCheck = await checkSupabaseSchemaReady(true);
      schemaReady = schemaCheck.ready;
      schemaReason = schemaCheck.reason;

      if (schemaReady) {
        connectionStatus = 'CONNECTED';
        // Test connectivity by querying migration_status
        const { data: migData } = await client
          .from('migration_status')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(1);
        lastMigration = migData?.[0] || null;

        // Check key table counts
        const checkTables = ['profiles', 'stories', 'chapters', 'programs'];
        for (const t of checkTables) {
          try {
            const { count } = await client.from(t).select('*', { count: 'exact', head: true });
            tablesDiscovered[t] = count || 0;
            remoteRecordsCount += (count || 0);
          } catch {
            tablesDiscovered[t] = 0;
          }
        }
      } else {
        connectionStatus = 'CONNECTED_SCHEMA_PENDING';
      }
    } catch (err: any) {
      connectionStatus = 'CONNECTION_ERROR';
      schemaReason = err?.message || 'Connection error';
    }
  }

  const localHealth = dbService.getDatabaseHealth();

  return res.json({
    configured,
    connectionStatus,
    schemaReady,
    schemaReason,
    target: 'Supabase PostgreSQL',
    supabaseUrlConfigured: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKeyConfigured: Boolean(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    tablesDiscovered,
    remoteRecordsCount,
    lastMigration,
    localData: {
      status: localHealth.status,
      storiesCount: localHealth.storiesCount,
      chaptersCount: localHealth.chaptersCount,
      charactersCount: localHealth.charactersCount,
      usersCount: localHealth.usersCount,
      reviewsCount: localHealth.reviewsCount,
      readingProgressCount: localHealth.readingProgressCount,
    },
    message: configured 
      ? (connectionStatus === 'CONNECTED' 
          ? 'Supabase is fully connected and schema tables are verified.' 
          : 'Supabase credentials are valid, but database tables need to be created in your Supabase SQL Editor.') 
      : 'Supabase credentials not yet supplied in environment. System is safely persisting to local storage.'
  });
});

// Provide full SQL Schema Migration for 1-Click Copy in Admin UI
app.get('/api/admin/supabase/sql', async (req: Request, res: Response) => {
  try {
    const migrationPath = path.resolve(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql');
    if (fs.existsSync(migrationPath)) {
      const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
      return res.json({ success: true, sql: sqlContent, filename: '001_initial_schema.sql' });
    }
    return res.status(404).json({ success: false, error: 'Migration file not found.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to read SQL migration file' });
  }
});

// Supabase Idempotent Migration Trigger
app.post('/api/admin/supabase/migrate', requireAdmin, async (req: Request, res: Response) => {
  if (!isSupabaseConfigured()) {
    return res.status(400).json({
      success: false,
      error: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in environment variables.',
    });
  }

  try {
    const { ready, reason } = await checkSupabaseSchemaReady(true);
    if (!ready) {
      return res.status(400).json({
        success: false,
        schemaPending: true,
        error: reason || 'Supabase tables have not been created yet. Please execute the SQL migration script in your Supabase SQL Editor.',
      });
    }

    const raw = dbService.getRaw();
    const result = await runSupabaseDataMigration(raw);
    return res.json({
      success: result.success,
      migrationResult: result,
      message: result.success 
        ? `Successfully migrated ${result.recordsProcessed} records to Supabase with 0 data loss!`
        : `Migration completed with warnings: ${result.recordsProcessed} processed, ${result.recordsFailed} failed.`
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Migration failed',
    });
  }
});

// 404 Handler for all unmatched API routes (ensures JSON response instead of HTML)
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global API Error Handling Middleware (prevents crashing or sending HTML on errors)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API_ERROR_HANDLER]', req.method, req.originalUrl, err);
  if (res.headersSent) {
    return next(err);
  }
  const status = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
  return res.status(status).json({
    error: err?.message || 'An internal server error occurred',
    code: err?.code || 'INTERNAL_SERVER_ERROR'
  });
});

export default app;
export { app };

