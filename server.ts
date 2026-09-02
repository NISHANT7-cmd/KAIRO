import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbService } from './server/db.js';
import { User } from './src/types.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Strict Auth Helpers and Middleware
function getUserFromReq(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const user = dbService.validateSession(token);
  return user || null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Access denied: Your account has been suspended by platform administration.' });
  }
  (req as any).user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Access denied: Your account has been suspended by platform administration.' });
  }
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: Master Admin role required.' });
  }
  (req as any).user = user;
  next();
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------
app.post('/api/auth/signup', (req: Request, res: Response) => {
  try {
    const { username, email, password, displayName, favoriteGenres, favoriteThemes, role, bio, avatar } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existing = dbService.findUserByEmailOrUsername(cleanUsername) || dbService.findUserByEmailOrUsername(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'A user with this username or email already exists' });
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
    return res.json({ token: session.token, user: enrichedUser });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Login identifier and password are required' });
    }

    const user = dbService.findUserByEmailOrUsername(login);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Account suspended: Please contact platform administration.' });
    }

    const valid = dbService.verifyPassword(user.id, password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const session = dbService.createSession(user.id);
    const enrichedUser = dbService.getUserEnriched(user);
    return res.json({ token: session.token, user: enrichedUser });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      dbService.destroySession(token);
    }
  }
  return res.json({ success: true });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Account suspended.' });
  }
  const enrichedUser = dbService.getUserEnriched(user);
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
app.get('/api/communities', (req: Request, res: Response) => {
  const communities = dbService.getCommunities();
  return res.json({ communities });
});

app.get('/api/posts', (req: Request, res: Response) => {
  const posts = dbService.getAllCommunityPosts();
  return res.json({ posts });
});

app.get('/api/communities/:slug', (req: Request, res: Response) => {
  const community = dbService.getCommunityBySlug(req.params.slug);
  if (!community) return res.status(404).json({ error: 'Community not found' });
  const posts = dbService.getCommunityPosts(community.id);
  return res.json({ community, posts });
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

app.post('/api/posts/:id/comments', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });
  const comment = dbService.addCommunityPostComment(req.params.id, user.id, content);
  if (!comment) return res.status(404).json({ error: 'Post not found' });
  return res.json({ comment });
});

app.post('/api/posts/:id/poll-vote', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { optionId } = req.body;
  const post = dbService.votePoll(req.params.id, optionId, user.id);
  return res.json({ post });
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

// 404 Handler for all unmatched API routes (ensures JSON response instead of HTML)
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// ----------------------------------------------------
// VITE DEV / PRODUCTION STATIC SERVER
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KAIRO Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
