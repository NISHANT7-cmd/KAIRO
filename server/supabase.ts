import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseSchema } from './db.js';
import { User, Story, Chapter, Program } from '../src/types.js';
import { initialPrograms } from './programs-seed.js';

let supabaseClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
              process.env.SUPABASE_ANON_KEY || 
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith('http'));
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClient) {
    const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) as string;
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || 
                 process.env.SUPABASE_ANON_KEY || 
                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;

    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

let cachedSchemaStatus: { ready: boolean; reason?: string; lastChecked: number } | null = null;

export async function checkSupabaseSchemaReady(force = false): Promise<{ ready: boolean; reason?: string }> {
  if (!isSupabaseConfigured()) {
    return { ready: false, reason: 'Supabase credentials are not configured in environment variables.' };
  }
  const now = Date.now();
  if (!force && cachedSchemaStatus && (now - cachedSchemaStatus.lastChecked < 20000)) {
    return { ready: cachedSchemaStatus.ready, reason: cachedSchemaStatus.reason };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { ready: false, reason: 'Supabase client could not be created.' };
  }

  try {
    const { error } = await client.from('profiles').select('id').limit(1);
    if (error) {
      const isMissingTable = error.code === 'PGRST205' || 
        error.message?.includes('Could not find the table') ||
        error.message?.includes('schema cache');
      
      const reason = isMissingTable
        ? "Tables not found in Supabase schema (PGRST205). Please run the SQL schema migration in your Supabase SQL Editor."
        : `Supabase query error: ${error.message}`;

      cachedSchemaStatus = { ready: false, reason, lastChecked: now };
      return { ready: false, reason };
    }

    cachedSchemaStatus = { ready: true, lastChecked: now };
    return { ready: true };
  } catch (err: any) {
    const reason = err?.message || 'Failed to connect to Supabase';
    cachedSchemaStatus = { ready: false, reason, lastChecked: now };
    return { ready: false, reason };
  }
}

export function invalidateSchemaCache() {
  cachedSchemaStatus = null;
}

export interface MigrationResult {
  success: boolean;
  schemaPending?: boolean;
  version: string;
  startedAt: string;
  completedAt?: string;
  recordsProcessed: number;
  recordsFailed: number;
  summary: Record<string, { total: number; upserted: number; failed: number }>;
  errors: string[];
}

/**
 * Executes an idempotent zero-loss migration from the local in-memory/JSON DB to Supabase.
 * Every table uses ON CONFLICT DO UPDATE so running this repeatedly is completely safe.
 */
export async function runSupabaseDataMigration(localDb: DatabaseSchema): Promise<MigrationResult> {
  const supabase = getSupabaseClient();
  const startedAt = new Date().toISOString();

  const result: MigrationResult = {
    success: true,
    version: '1.0.0',
    startedAt,
    recordsProcessed: 0,
    recordsFailed: 0,
    summary: {},
    errors: [],
  };

  if (!supabase) {
    result.success = false;
    result.errors.push('Supabase credentials not configured (SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY missing).');
    return result;
  }

  // Pre-flight check: ensure schema tables exist before firing batch queries
  const schemaCheck = await checkSupabaseSchemaReady();
  if (!schemaCheck.ready) {
    result.success = false;
    result.schemaPending = true;
    result.errors.push(schemaCheck.reason || 'Supabase schema tables do not exist yet.');
    result.completedAt = new Date().toISOString();
    return result;
  }

  // Helper for batch upserts
  const safeUpsert = async (tableName: string, rows: any[], onConflictColumn: string) => {
    if (!rows || rows.length === 0) return;
    
    result.summary[tableName] = { total: rows.length, upserted: 0, failed: 0 };
    result.recordsProcessed += rows.length;

    const CHUNK_SIZE = 100;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      try {
        const { error } = await supabase
          .from(tableName)
          .upsert(chunk, { onConflict: onConflictColumn, ignoreDuplicates: false });

        if (error) {
          result.summary[tableName].failed += chunk.length;
          result.recordsFailed += chunk.length;
          result.errors.push(`Table ${tableName} upsert failed: ${error.message}`);
          
          const isMissingTable = error.code === 'PGRST205' || error.message?.includes('Could not find the table');
          if (isMissingTable) {
            cachedSchemaStatus = {
              ready: false,
              reason: `Table "${tableName}" not found in Supabase schema cache (PGRST205).`,
              lastChecked: Date.now()
            };
            console.warn(`[Supabase] Note: Table "${tableName}" does not exist in Supabase yet. Please run migration 001_initial_schema.sql in Supabase SQL Editor.`);
          } else {
            console.error(`[Supabase Migration] Error upserting into ${tableName}:`, error.message);
          }
        } else {
          result.summary[tableName].upserted += chunk.length;
        }
      } catch (err: any) {
        result.summary[tableName].failed += chunk.length;
        result.recordsFailed += chunk.length;
        result.errors.push(`Table ${tableName} exception: ${err?.message || err}`);
        console.error(`[Supabase Migration] Exception in ${tableName}:`, err?.message || err);
      }
    }
  };

  try {
    // 1. User Profiles
    if (localDb.users?.length) {
      const mappedProfiles = localDb.users.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        display_name: u.displayName || u.username,
        avatar: u.avatar || null,
        bio: u.bio || null,
        role: u.role || 'USER',
        xp: u.xp || 0,
        level: u.level || 1,
        reading_streak: u.readingStreak || 0,
        last_active_date: u.lastActiveDate || new Date().toISOString(),
        followers_count: u.followersCount || 0,
        following_count: u.followingCount || 0,
        total_reads: u.totalReads || 0,
        favorite_genres: u.favoriteGenres || [],
        favorite_themes: u.favoriteThemes || [],
        is_verified: Boolean(u.isVerified || u.isVerifiedWriter),
        custom_title: (u as any).customTitle || null,
        created_at: u.createdAt || new Date().toISOString(),
      }));
      await safeUpsert('profiles', mappedProfiles, 'id');
    }

    // 2. User Credentials (password records)
    if (localDb.passwords) {
      const mappedCredentials = Object.entries(localDb.passwords).map(([userId, pwd]) => {
        if (typeof pwd === 'object' && pwd !== null && 'salt' in pwd && 'hash' in pwd) {
          return {
            user_id: userId,
            salt: (pwd as any).salt,
            hash: (pwd as any).hash,
            updated_at: new Date().toISOString(),
          };
        }
        return {
          user_id: userId,
          salt: 'legacy',
          hash: String(pwd),
          updated_at: new Date().toISOString(),
        };
      });
      await safeUpsert('user_credentials', mappedCredentials, 'user_id');
    }

    // 3. User Sessions
    if (localDb.sessions) {
      const mappedSessions = Object.entries(localDb.sessions).map(([token, sess]) => ({
        token,
        user_id: sess.userId,
        created_at: sess.createdAt,
        expires_at: sess.expiresAt,
      }));
      await safeUpsert('user_sessions', mappedSessions, 'token');
    }

    // 4. Stories
    if (localDb.stories?.length) {
      const mappedStories = localDb.stories.map((s: any) => ({
        id: s.id,
        title: s.title,
        slug: s.slug || null,
        description: s.description || null,
        cover_image: s.coverImage || null,
        banner_image: s.bannerImage || s.coverImage || null,
        author_id: s.authorId,
        author_username: s.authorUsername || null,
        author_avatar: s.authorAvatar || null,
        author_display_name: s.authorDisplayName || null,
        genre: s.genre,
        sub_genres: s.subGenres || s.tags || [],
        tags: s.tags || [],
        target_audience: s.targetAudience || 'Everyone',
        age_rating: s.ageRating || 'Everyone',
        content_warnings: s.contentWarnings || [],
        status: s.status || 'Ongoing',
        story_type: s.storyType || 'Light Novel',
        universe_id: s.universeId || null,
        world_id: s.worldId || null,
        total_chapters: s.chaptersCount || 0,
        word_count: s.wordCount || 0,
        read_count: s.views || 0,
        like_count: s.likes || 0,
        comment_count: s.commentCount || 0,
        rating: s.rating || 5.0,
        review_count: s.ratingCount || 0,
        views: s.views || 0,
        publication_date: s.createdAt || new Date().toISOString(),
        last_updated_date: s.updatedAt || new Date().toISOString(),
        is_featured: Boolean(s.isFeatured || s.featured),
        is_weekly_pick: Boolean(s.isWeeklyPick),
        is_trending: Boolean(s.isTrending),
        trending_rank: s.trendingRank || null,
        created_at: s.createdAt || new Date().toISOString(),
      }));
      await safeUpsert('stories', mappedStories, 'id');
    }

    // 5. Chapters
    if (localDb.chapters?.length) {
      const mappedChapters = localDb.chapters.map((c: any) => ({
        id: c.id,
        story_id: c.storyId,
        chapter_number: c.chapterNumber,
        title: c.title,
        content: c.content || '',
        word_count: c.wordCount || 0,
        likes_count: c.likesCount || 0,
        comments_count: c.commentsCount || 0,
        read_count: c.readCount || 0,
        publish_date: c.publishedAt || c.createdAt || new Date().toISOString(),
        updated_at: c.updatedAt || new Date().toISOString(),
        status: c.status || 'Published',
        author_notes: c.authorNote || c.authorNotes || null,
        order_index: c.orderIndex || c.chapterNumber || 0,
        created_at: c.createdAt || new Date().toISOString(),
      }));
      await safeUpsert('chapters', mappedChapters, 'id');
    }

    // 6. Reading Progress (Composite Key: user_id, story_id)
    if (localDb.readingProgress?.length) {
      const mappedProgress = localDb.readingProgress.map(rp => ({
        user_id: rp.userId,
        story_id: rp.storyId,
        chapter_id: rp.chapterId || null,
        chapter_number: rp.chapterNumber || 1,
        progress_percent: rp.progressPercent || 0,
        last_position: rp.lastPosition || 0,
        last_read_at: rp.lastReadAt || new Date().toISOString(),
      }));
      await safeUpsert('reading_progress', mappedProgress, 'user_id,story_id');
    }

    // 7. Library (Composite Key: user_id, story_id)
    if (localDb.library?.length) {
      const mappedLib = localDb.library.map(l => ({
        user_id: l.userId,
        story_id: l.storyId,
        list_type: l.listType || 'saved',
        added_at: l.addedAt || new Date().toISOString(),
      }));
      await safeUpsert('library', mappedLib, 'user_id,story_id');
    }

    // 8. Story Likes (Composite Key: story_id, user_id)
    if (localDb.likes) {
      const mappedLikes: any[] = [];
      Object.entries(localDb.likes).forEach(([storyId, userIds]) => {
        if (Array.isArray(userIds)) {
          userIds.forEach(userId => {
            mappedLikes.push({ story_id: storyId, user_id: userId, created_at: new Date().toISOString() });
          });
        }
      });
      await safeUpsert('story_likes', mappedLikes, 'story_id,user_id');
    }

    // 9. User Follows (Composite Key: follower_id, author_id)
    if (localDb.follows) {
      const mappedFollows: any[] = [];
      Object.entries(localDb.follows).forEach(([authorId, followerIds]) => {
        if (Array.isArray(followerIds)) {
          followerIds.forEach(followerId => {
            mappedFollows.push({ author_id: authorId, follower_id: followerId, created_at: new Date().toISOString() });
          });
        }
      });
      await safeUpsert('user_follows', mappedFollows, 'follower_id,author_id');
    }

    // 10. Reviews & Comments
    if (localDb.reviews?.length) {
      const mappedReviews = localDb.reviews.map((r: any) => ({
        id: r.id,
        user_id: r.userId,
        story_id: r.storyId,
        rating: r.rating,
        review_text: r.reviewText || null,
        likes: r.likes || 0,
        created_at: r.createdAt || new Date().toISOString(),
      }));
      await safeUpsert('reviews', mappedReviews, 'id');
    }

    if (localDb.comments?.length) {
      const mappedComments = localDb.comments.map((c: any) => ({
        id: c.id,
        chapter_id: c.chapterId,
        story_id: c.storyId,
        user_id: c.userId,
        content: c.content,
        parent_id: c.parentId || null,
        likes: c.likes || 0,
        liked_by: c.likedByUsers || c.likedBy || [],
        created_at: c.createdAt || new Date().toISOString(),
      }));
      await safeUpsert('chapter_comments', mappedComments, 'id');
    }

    // 11. Characters & Lore
    if (localDb.characters?.length) {
      const mappedChars = localDb.characters.map((c: any) => ({
        id: c.id,
        story_id: c.storyId || null,
        author_id: c.authorId || null,
        name: c.name,
        role: c.role || 'Protagonist',
        age: c.age || null,
        gender: c.gender || null,
        appearance: c.appearance || null,
        personality: c.personality || null,
        background: c.biography || c.background || null,
        avatar: c.portrait || c.avatar || null,
        created_at: c.createdAt || new Date().toISOString(),
      }));
      await safeUpsert('characters', mappedChars, 'id');
    }

    if (localDb.worlds?.length) {
      const mappedWorlds = localDb.worlds.map((w: any) => ({
        id: w.id,
        author_id: w.authorId || null,
        name: w.name,
        description: w.description || null,
        rules: w.rules || null,
        magic_system: w.magicSystem || (w.magicTypes ? w.magicTypes.join(', ') : null),
        technology_level: w.technologyLevel || w.techLevel || null,
        created_at: w.createdAt || new Date().toISOString(),
      }));
      await safeUpsert('worlds', mappedWorlds, 'id');
    }

    if (localDb.universes?.length) {
      const mappedUniverses = localDb.universes.map((u: any) => ({
        id: u.id,
        slug: u.slug || null,
        author_id: u.authorId || null,
        title: u.name || u.title,
        description: u.description || null,
        cover_image: u.coverImage || u.bannerImage || null,
        banner_image: u.bannerImage || null,
        created_at: u.createdAt || new Date().toISOString(),
      }));
      await safeUpsert('universes', mappedUniverses, 'id');
    }

    // 12. Programs & Competitions
    if (localDb.programs?.length) {
      const mappedPrograms = localDb.programs.map((p: any) => ({
        id: p.id,
        slug: p.slug,
        title: p.name || p.title,
        subtitle: p.tagline || p.subtitle || null,
        description: p.description || null,
        type: p.type || 'COMPETITION',
        status: p.status || 'DRAFT',
        banner_image: p.bannerImage || null,
        start_date: p.timeline?.registrationStart || p.startDate || null,
        end_date: p.timeline?.endDate || p.endDate || null,
        rules: Array.isArray(p.rules) 
          ? p.rules.map(String) 
          : (typeof p.rules === 'object' && p.rules !== null 
              ? Object.entries(p.rules).map(([k, v]) => `${k}: ${v}`) 
              : (p.rules ? [String(p.rules)] : [])),
        prize_summary: p.prizes?.map((pr: any) => `${pr.title}: ${pr.reward}`).join(', ') || p.prizeSummary || null,
        settings: p.settings || { targetAudience: p.targetAudience, visibility: p.visibility },
        created_by: p.createdByAdminId || p.createdBy || null,
        created_at: p.createdAt || new Date().toISOString(),
        updated_at: p.updatedAt || new Date().toISOString(),
      }));
      await safeUpsert('programs', mappedPrograms, 'id');
    }

    if (localDb.programParticipants?.length) {
      const mappedParticipants = localDb.programParticipants.map((pp: any) => ({
        id: pp.id,
        program_id: pp.programId,
        user_id: pp.userId,
        status: pp.status || 'REGISTERED',
        rules_accepted: Boolean(pp.rulesAgreementCheckbox ?? pp.rulesAccepted ?? true),
        registered_at: pp.registeredAt || new Date().toISOString(),
      }));
      await safeUpsert('program_participants', mappedParticipants, 'id');
    }

    if (localDb.programSubmissions?.length) {
      const mappedSubmissions = localDb.programSubmissions.map((ps: any) => ({
        id: ps.id,
        program_id: ps.programId,
        user_id: ps.userId,
        story_id: ps.storyId || null,
        title: ps.title,
        summary: ps.summary || null,
        status: ps.status || 'SUBMITTED',
        is_finalist: Boolean(ps.status === 'FINALIST' || ps.isFinalist),
        score: ps.scores?.finalWeightedScore || ps.score || 0,
        votes_count: ps.votes || ps.votesCount || 0,
        submitted_at: ps.createdAt || ps.submittedAt || new Date().toISOString(),
      }));
      await safeUpsert('program_submissions', mappedSubmissions, 'id');
    }

    if (localDb.programVotes?.length) {
      const mappedVotes = localDb.programVotes.map(pv => ({
        id: pv.id,
        program_id: pv.programId,
        submission_id: pv.submissionId,
        user_id: pv.userId,
        ip_address: pv.ipAddress || null,
        voted_at: pv.votedAt || new Date().toISOString(),
      }));
      await safeUpsert('program_votes', mappedVotes, 'id');
    }

    // 13. Recently Deleted Stories (30-Day Auto Retention)
    if (localDb.recentlyDeletedStories && localDb.recentlyDeletedStories.length > 0) {
      const mappedTrash = localDb.recentlyDeletedStories.map(r => ({
        id: r.id,
        story_id: r.story?.id || r.id,
        story: r.story,
        chapters: r.chapters || [],
        characters: r.characters || [],
        deleted_at: r.deletedAt,
        expires_at: r.expiresAt,
        deleted_by_user_id: r.deletedByUserId,
        deleted_by_username: r.deletedByUsername,
      }));
      await safeUpsert('recently_deleted_stories', mappedTrash, 'id');
    }

    result.completedAt = new Date().toISOString();
    result.success = result.recordsFailed === 0;
  } catch (err: any) {
    result.success = false;
    result.errors.push(`Fatal migration error: ${err?.message || err}`);
    console.error('[Supabase Migration] Fatal error:', err?.message || err);
  }

  return result;
}

export type SupabaseActivityType = 
  | 'story_upsert'
  | 'story_delete'
  | 'story_restore'
  | 'story_permanent_delete'
  | 'chapter_upsert'
  | 'chapter_delete'
  | 'story_like'
  | 'story_unlike'
  | 'user_follow'
  | 'user_unfollow'
  | 'library_toggle'
  | 'reading_progress'
  | 'review_upsert'
  | 'review_like'
  | 'comment_upsert'
  | 'comment_like'
  | 'character_upsert'
  | 'character_delete'
  | 'world_upsert'
  | 'universe_upsert'
  | 'program_participant'
  | 'program_submission'
  | 'program_vote'
  | 'profile_upsert'
  | 'community_upsert'
  | 'community_join'
  | 'community_leave'
  | 'community_post_upsert'
  | 'community_post_like'
  | 'community_post_pin'
  | 'community_post_lock'
  | 'notification_read'
  | 'notification_read_all'
  | 'notification_upsert';

/**
 * Automatically & immediately persists any user activity directly to Supabase server.
 * Returns explicit success status and error message to guarantee persistence before returning to caller.
 */
export async function syncActivityImmediately(
  activityType: SupabaseActivityType,
  payload: any
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };
  if (cachedSchemaStatus && !cachedSchemaStatus.ready) return { success: false, error: 'Supabase schema not ready' };

  try {
    switch (activityType) {
      case 'story_upsert': {
        const story = payload;
        if (!story || !story.id) return { success: false, error: 'Missing story data or id' };
        const row = {
          id: story.id,
          title: story.title,
          slug: story.slug || null,
          description: story.description || null,
          cover_image: story.coverImage || null,
          author_id: story.authorId,
          author_username: story.authorUsername || null,
          author_display_name: story.authorDisplayName || null,
          genre: story.genre,
          tags: story.tags || [],
          status: story.status || 'Ongoing',
          story_type: story.storyType || 'Light Novel',
          total_chapters: story.chaptersCount || 0,
          views: story.views || 0,
          like_count: story.likes || 0,
          rating: story.rating || 5.0,
          last_updated_date: story.updatedAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('stories').upsert(row, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase Realtime Sync] story_upsert error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'story_delete': {
        const { record, storyId } = payload;
        if (record) {
          const trashRow = {
            id: record.id,
            story_id: record.story?.id || storyId || record.id,
            story: record.story,
            chapters: record.chapters || [],
            characters: record.characters || [],
            deleted_at: record.deletedAt || new Date().toISOString(),
            expires_at: record.expiresAt,
            deleted_by_user_id: record.deletedByUserId,
            deleted_by_username: record.deletedByUsername,
          };
          const { error: trashErr } = await supabase.from('recently_deleted_stories').upsert(trashRow, { onConflict: 'id' });
          if (trashErr) {
            console.error('[Supabase Realtime Sync] story_delete trash error:', trashErr.message);
            return { success: false, error: trashErr.message };
          }
        }
        if (storyId) {
          const { error: delErr } = await supabase.from('stories').delete().eq('id', storyId);
          if (delErr) {
            console.error('[Supabase Realtime Sync] story_delete stories error:', delErr.message);
            return { success: false, error: delErr.message };
          }
        }
        return { success: true };
      }

      case 'story_restore': {
        const { trashId, story } = payload;
        if (trashId) {
          const { error: delErr } = await supabase.from('recently_deleted_stories').delete().eq('id', trashId);
          if (delErr) {
            console.error('[Supabase Realtime Sync] story_restore delete trash error:', delErr.message);
            return { success: false, error: delErr.message };
          }
        }
        if (story && story.id) {
          const upsertRes = await syncActivityImmediately('story_upsert', story);
          if (!upsertRes.success) return upsertRes;
        }
        return { success: true };
      }

      case 'story_permanent_delete': {
        const { trashId } = payload;
        if (trashId) {
          const { error } = await supabase.from('recently_deleted_stories').delete().eq('id', trashId);
          if (error) {
            console.error('[Supabase Realtime Sync] story_permanent_delete error:', error.message);
            return { success: false, error: error.message };
          }
        }
        return { success: true };
      }

      case 'chapter_upsert': {
        const { chapter, storyId, chaptersCount } = payload;
        const chap = chapter || payload;
        if (!chap || !chap.id) return { success: false, error: 'Missing chapter data or id' };
        const chapRow = {
          id: chap.id,
          story_id: chap.storyId || storyId,
          chapter_number: chap.chapterNumber,
          title: chap.title,
          content: chap.content || '',
          word_count: chap.wordCount || 0,
          status: chap.status || 'Published',
          publish_date: chap.publishedAt || chap.createdAt || new Date().toISOString(),
          updated_at: chap.updatedAt || new Date().toISOString(),
        };
        const { error: chapErr } = await supabase.from('chapters').upsert(chapRow, { onConflict: 'id' });
        if (chapErr) {
          console.error('[Supabase Realtime Sync] chapter_upsert error:', chapErr.message);
          return { success: false, error: chapErr.message };
        }

        const targetStoryId = chap.storyId || storyId;
        if (targetStoryId && chaptersCount !== undefined) {
          const { error: storyErr } = await supabase.from('stories').update({
            total_chapters: chaptersCount,
            last_updated_date: new Date().toISOString(),
          }).eq('id', targetStoryId);
          if (storyErr) console.warn('[Supabase Realtime Sync] story chaptersCount update warning:', storyErr.message);
        }
        return { success: true };
      }

      case 'chapter_delete': {
        const { chapterId, storyId, chaptersCount } = payload;
        if (chapterId) {
          const { error: delErr } = await supabase.from('chapters').delete().eq('id', chapterId);
          if (delErr) {
            console.error('[Supabase Realtime Sync] chapter_delete error:', delErr.message);
            return { success: false, error: delErr.message };
          }
        }
        if (storyId && chaptersCount !== undefined) {
          const { error: storyErr } = await supabase.from('stories').update({
            total_chapters: chaptersCount,
            last_updated_date: new Date().toISOString(),
          }).eq('id', storyId);
          if (storyErr) console.warn('[Supabase Realtime Sync] story chaptersCount update warning:', storyErr.message);
        }
        return { success: true };
      }

      case 'story_like': {
        const { userId, storyId, totalLikes } = payload;
        if (!userId || !storyId) return { success: false, error: 'Missing userId or storyId' };
        const { error: likeErr } = await supabase.from('story_likes').upsert({
          story_id: storyId,
          user_id: userId,
          created_at: new Date().toISOString(),
        }, { onConflict: 'story_id,user_id' });
        if (likeErr) {
          console.error('[Supabase Realtime Sync] story_like error:', likeErr.message);
          return { success: false, error: likeErr.message };
        }

        if (totalLikes !== undefined) {
          await supabase.from('stories').update({
            like_count: totalLikes,
            last_updated_date: new Date().toISOString()
          }).eq('id', storyId);
        }
        return { success: true };
      }

      case 'story_unlike': {
        const { userId, storyId, totalLikes } = payload;
        if (!userId || !storyId) return { success: false, error: 'Missing userId or storyId' };
        const { error: unlikeErr } = await supabase.from('story_likes').delete().match({ story_id: storyId, user_id: userId });
        if (unlikeErr) {
          console.error('[Supabase Realtime Sync] story_unlike error:', unlikeErr.message);
          return { success: false, error: unlikeErr.message };
        }

        if (totalLikes !== undefined) {
          await supabase.from('stories').update({
            like_count: totalLikes,
            last_updated_date: new Date().toISOString()
          }).eq('id', storyId);
        }
        return { success: true };
      }

      case 'user_follow': {
        const { followerId, authorId } = payload;
        if (!followerId || !authorId) return { success: false, error: 'Missing followerId or authorId' };
        const { error } = await supabase.from('user_follows').upsert({
          follower_id: followerId,
          author_id: authorId,
          created_at: new Date().toISOString(),
        }, { onConflict: 'follower_id,author_id' });
        if (error) {
          console.error('[Supabase Realtime Sync] user_follow error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'user_unfollow': {
        const { followerId, authorId } = payload;
        if (!followerId || !authorId) return { success: false, error: 'Missing followerId or authorId' };
        const { error } = await supabase.from('user_follows').delete().match({ follower_id: followerId, author_id: authorId });
        if (error) {
          console.error('[Supabase Realtime Sync] user_unfollow error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'library_toggle': {
        const { userId, storyId, listType, inLibrary } = payload;
        if (!userId || !storyId) return { success: false, error: 'Missing userId or storyId' };
        if (inLibrary) {
          const { error } = await supabase.from('library').upsert({
            user_id: userId,
            story_id: storyId,
            list_type: listType || 'saved',
            added_at: new Date().toISOString(),
          }, { onConflict: 'user_id,story_id' });
          if (error) {
            console.error('[Supabase Realtime Sync] library add error:', error.message);
            return { success: false, error: error.message };
          }
        } else {
          const { error } = await supabase.from('library').delete().match({ user_id: userId, story_id: storyId });
          if (error) {
            console.error('[Supabase Realtime Sync] library remove error:', error.message);
            return { success: false, error: error.message };
          }
        }
        return { success: true };
      }

      case 'reading_progress': {
        const progress = payload;
        if (!progress || !progress.userId || !progress.storyId) return { success: false, error: 'Missing userId or storyId' };
        const progRow = {
          user_id: progress.userId,
          story_id: progress.storyId,
          chapter_id: progress.chapterId || null,
          chapter_number: progress.chapterNumber || 1,
          progress_percent: progress.progressPercent || 0,
          last_position: progress.lastPosition || 0,
          last_read_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('reading_progress').upsert(progRow, { onConflict: 'user_id,story_id' });
        if (error) {
          console.error('[Supabase Realtime Sync] reading_progress error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'review_upsert': {
        const { review, storyRating } = payload;
        const rev = review || payload;
        if (!rev || !rev.id) return { success: false, error: 'Missing review id' };
        const revRow = {
          id: rev.id,
          user_id: rev.userId,
          story_id: rev.storyId,
          rating: rev.rating,
          review_text: rev.reviewText || null,
          likes: rev.likes || 0,
          created_at: rev.createdAt || new Date().toISOString(),
        };
        const { error: revErr } = await supabase.from('reviews').upsert(revRow, { onConflict: 'id' });
        if (revErr) {
          console.error('[Supabase Realtime Sync] review_upsert error:', revErr.message);
          return { success: false, error: revErr.message };
        }

        if (rev.storyId && storyRating !== undefined) {
          await supabase.from('stories').update({
            rating: storyRating,
            last_updated_date: new Date().toISOString(),
          }).eq('id', rev.storyId);
        }
        return { success: true };
      }

      case 'review_like': {
        const { reviewId, likes } = payload;
        if (reviewId && likes !== undefined) {
          const { error } = await supabase.from('reviews').update({ likes }).eq('id', reviewId);
          if (error) {
            console.error('[Supabase Realtime Sync] review_like error:', error.message);
            return { success: false, error: error.message };
          }
        }
        return { success: true };
      }

      case 'comment_upsert': {
        const comment = payload;
        if (!comment || !comment.id) return { success: false, error: 'Missing comment id' };
        const comRow = {
          id: comment.id,
          chapter_id: comment.chapterId,
          story_id: comment.storyId,
          user_id: comment.userId,
          content: comment.content,
          parent_id: comment.parentId || null,
          likes: comment.likes || 0,
          liked_by: comment.likedByUsers || comment.likedBy || [],
          created_at: comment.createdAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('chapter_comments').upsert(comRow, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase Realtime Sync] comment_upsert error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'comment_like': {
        const comment = payload;
        if (!comment || !comment.id) return { success: false, error: 'Missing comment id' };
        const { error } = await supabase.from('chapter_comments').update({
          likes: comment.likes || 0,
          liked_by: comment.likedByUsers || comment.likedBy || [],
        }).eq('id', comment.id);
        if (error) {
          console.error('[Supabase Realtime Sync] comment_like error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'program_participant': {
        const part = payload;
        if (!part || !part.id) return { success: false, error: 'Missing participant id' };
        const partRow = {
          id: part.id,
          program_id: part.programId,
          user_id: part.userId,
          status: part.status || 'REGISTERED',
          rules_accepted: Boolean(part.rulesAgreementCheckbox ?? part.rulesAccepted ?? true),
          registered_at: part.registeredAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('program_participants').upsert(partRow, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase Realtime Sync] program_participant error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'program_submission': {
        const sub = payload;
        if (!sub || !sub.id) return { success: false, error: 'Missing submission id' };
        const subRow = {
          id: sub.id,
          program_id: sub.programId,
          user_id: sub.userId,
          story_id: sub.storyId || null,
          title: sub.title,
          summary: sub.summary || null,
          status: sub.status || 'SUBMITTED',
          is_finalist: Boolean(sub.status === 'FINALIST' || sub.isFinalist),
          score: sub.scores?.finalWeightedScore || sub.score || 0,
          votes_count: sub.votes || sub.votesCount || 0,
          submitted_at: sub.createdAt || sub.submittedAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('program_submissions').upsert(subRow, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase Realtime Sync] program_submission error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'program_vote': {
        const { vote, submissionId, votesCount, programId } = payload;
        if (!vote || !vote.id) return { success: false, error: 'Missing vote id' };
        const voteRow = {
          id: vote.id,
          program_id: vote.programId || programId,
          submission_id: vote.submissionId || submissionId,
          user_id: vote.userId,
          ip_address: vote.ipAddress || null,
          voted_at: vote.votedAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('program_votes').upsert(voteRow, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase Realtime Sync] program_vote error:', error.message);
          return { success: false, error: error.message };
        }

        const targetSubId = vote.submissionId || submissionId;
        if (targetSubId && votesCount !== undefined) {
          await supabase.from('program_submissions').update({ votes_count: votesCount }).eq('id', targetSubId);
        }
        return { success: true };
      }

      case 'character_upsert': {
        const c = payload;
        if (!c || !c.id) return { success: false, error: 'Missing character id' };
        const charRow = {
          id: c.id,
          story_id: c.storyId || null,
          author_id: c.authorId || null,
          name: c.name,
          role: c.role || 'Protagonist',
          age: c.age || null,
          gender: c.gender || null,
          appearance: c.appearance || null,
          personality: c.personality || null,
          background: c.biography || c.background || null,
          avatar: c.portrait || c.avatar || null,
          created_at: c.createdAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('characters').upsert(charRow, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase Realtime Sync] character_upsert error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'character_delete': {
        const { characterId } = payload;
        if (characterId) {
          const { error } = await supabase.from('characters').delete().eq('id', characterId);
          if (error) {
            console.error('[Supabase Realtime Sync] character_delete error:', error.message);
            return { success: false, error: error.message };
          }
        }
        return { success: true };
      }

      case 'world_upsert': {
        const w = payload;
        if (!w || !w.id) return { success: false, error: 'Missing world id' };
        const worldRow = {
          id: w.id,
          author_id: w.authorId || null,
          name: w.name,
          description: w.description || null,
          rules: w.rules || null,
          magic_system: w.magicSystem || (w.magicTypes ? w.magicTypes.join(', ') : null),
          technology_level: w.technologyLevel || w.techLevel || null,
          created_at: w.createdAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('worlds').upsert(worldRow, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase Realtime Sync] world_upsert error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'universe_upsert': {
        const u = payload;
        if (!u || !u.id) return { success: false, error: 'Missing universe id' };
        const uniRow = {
          id: u.id,
          slug: u.slug || null,
          author_id: u.authorId || null,
          title: u.name || u.title,
          description: u.description || null,
          cover_image: u.coverImage || u.bannerImage || null,
          banner_image: u.bannerImage || null,
          created_at: u.createdAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('universes').upsert(uniRow, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase Realtime Sync] universe_upsert error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'profile_upsert': {
        const user = payload;
        if (!user || !user.id) return { success: false, error: 'Missing user id' };
        const profRow = {
          id: user.id,
          username: user.username,
          display_name: user.displayName || user.username,
          avatar: user.avatar || null,
          bio: user.bio || null,
          role: user.role || 'USER',
          xp: user.xp || 0,
          level: user.level || 1,
          reading_streak: user.readingStreak || 1,
          last_active_date: user.lastActiveDate || new Date().toISOString(),
          followers_count: user.followersCount || 0,
          following_count: user.followingCount || 0,
          total_reads: user.totalReads || 0,
          favorite_genres: user.favoriteGenres || [],
          favorite_themes: user.favoriteThemes || [],
          is_verified: Boolean(user.isVerifiedWriter),
        };
        const { error } = await supabase.from('profiles').upsert(profRow, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase Realtime Sync] profile_upsert error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'community_upsert': {
        const comm = payload;
        if (!comm || !comm.id) return { success: false, error: 'Missing community id' };
        const commRow = {
          id: comm.id,
          slug: comm.slug,
          name: comm.name,
          description: comm.description || null,
          icon: comm.iconImage || null,
          banner: comm.bannerImage || null,
          type: (comm.type || 'GENRE').toUpperCase(),
          category: (comm.categories && comm.categories[0]) || null,
          member_count: comm.memberCount || comm.membersCount || 1,
          post_count: comm.postsCount || 0,
          created_at: comm.createdAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('communities').upsert(commRow, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase Realtime Sync] community_upsert error:', error.message);
          return { success: false, error: error.message };
        }
        if (comm.ownerId) {
          await supabase.from('community_members').upsert({
            community_id: comm.id,
            user_id: comm.ownerId,
            joined_at: comm.createdAt || new Date().toISOString(),
          }, { onConflict: 'community_id,user_id' });
        }
        return { success: true };
      }

      case 'community_join': {
        const { communityId, userId, memberCount } = payload;
        if (!communityId || !userId) return { success: false, error: 'Missing communityId or userId' };
        const { error } = await supabase.from('community_members').upsert({
          community_id: communityId,
          user_id: userId,
          joined_at: new Date().toISOString(),
        }, { onConflict: 'community_id,user_id' });
        if (error) {
          console.error('[Supabase Realtime Sync] community_join error:', error.message);
          return { success: false, error: error.message };
        }
        if (memberCount !== undefined) {
          await supabase.from('communities').update({ member_count: memberCount }).eq('id', communityId);
        }
        return { success: true };
      }

      case 'community_leave': {
        const { communityId, userId, memberCount } = payload;
        if (!communityId || !userId) return { success: false, error: 'Missing communityId or userId' };
        const { error } = await supabase.from('community_members').delete().match({ community_id: communityId, user_id: userId });
        if (error) {
          console.error('[Supabase Realtime Sync] community_leave error:', error.message);
          return { success: false, error: error.message };
        }
        if (memberCount !== undefined) {
          await supabase.from('communities').update({ member_count: memberCount }).eq('id', communityId);
        }
        return { success: true };
      }

      case 'community_post_upsert': {
        const post = payload;
        if (!post || !post.id) return { success: false, error: 'Missing post id' };
        const postRow = {
          id: post.id,
          community_id: post.communityId,
          user_id: post.userId || post.authorId,
          author_name: post.username || post.authorDisplayName || post.authorUsername || 'Member',
          author_avatar: post.userAvatar || post.authorAvatar || null,
          author_role: post.authorRole || 'Member',
          title: post.title,
          content: post.content || '',
          post_type: post.type || post.postType || 'DISCUSSION',
          media_url: post.mediaUrl || null,
          tags: post.tags || [],
          likes: post.likes || 0,
          comment_count: post.commentsCount || post.commentCount || 0,
          is_pinned: Boolean(post.isPinned),
          is_locked: Boolean(post.isLocked),
          created_at: post.createdAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('community_posts').upsert(postRow, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase Realtime Sync] community_post_upsert error:', error.message);
          return { success: false, error: error.message };
        }
        if (payload.communityPostsCount !== undefined) {
          await supabase.from('communities').update({ post_count: payload.communityPostsCount }).eq('id', post.communityId);
        }
        return { success: true };
      }

      case 'community_post_like': {
        const { postId, likes } = payload;
        if (!postId) return { success: false, error: 'Missing postId' };
        const { error } = await supabase.from('community_posts').update({ likes }).eq('id', postId);
        if (error) {
          console.error('[Supabase Realtime Sync] community_post_like error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'community_post_pin': {
        const { postId, isPinned } = payload;
        if (!postId) return { success: false, error: 'Missing postId' };
        const { error } = await supabase.from('community_posts').update({ is_pinned: Boolean(isPinned) }).eq('id', postId);
        if (error) {
          console.error('[Supabase Realtime Sync] community_post_pin error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'community_post_lock': {
        const { postId, isLocked } = payload;
        if (!postId) return { success: false, error: 'Missing postId' };
        const { error } = await supabase.from('community_posts').update({ is_locked: Boolean(isLocked) }).eq('id', postId);
        if (error) {
          console.error('[Supabase Realtime Sync] community_post_lock error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'notification_read': {
        const { notificationId, userId } = payload;
        if (!notificationId || !userId) return { success: false, error: 'Missing notificationId or userId' };
        const { error } = await supabase.from('notifications').update({ read: true }).match({ id: notificationId, user_id: userId });
        if (error) {
          console.error('[Supabase Realtime Sync] notification_read error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'notification_read_all': {
        const { userId } = payload;
        if (!userId) return { success: false, error: 'Missing userId' };
        const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
        if (error) {
          console.error('[Supabase Realtime Sync] notification_read_all error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      case 'notification_upsert': {
        const notif = payload;
        if (!notif || !notif.id) return { success: false, error: 'Missing notification id' };
        const notifRow = {
          id: notif.id,
          user_id: notif.userId,
          type: notif.type || 'SYSTEM',
          title: notif.title,
          message: notif.message,
          link: notif.link || null,
          read: Boolean(notif.read || notif.isRead),
          created_at: notif.createdAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('notifications').upsert(notifRow, { onConflict: 'id' });
        if (error) {
          console.error('[Supabase Realtime Sync] notification_upsert error:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      default:
        return { success: false, error: `Unknown activity type: ${activityType}` };
    }
  } catch (err: any) {
    console.warn(`[Supabase Realtime Sync Error] ${activityType}:`, err?.message);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Synchronizes an individual entity create/update immediately to Supabase
 */
export async function syncEntityToSupabase(
  entityType: 'story' | 'chapter' | 'profile' | 'trash' | 'reading_progress',
  payload: any
): Promise<boolean> {
  switch (entityType) {
    case 'story':
      return (await syncActivityImmediately('story_upsert', payload)).success;
    case 'chapter':
      return (await syncActivityImmediately('chapter_upsert', { chapter: payload })).success;
    case 'profile':
      return (await syncActivityImmediately('profile_upsert', payload)).success;
    case 'trash':
      return (await syncActivityImmediately('story_delete', { record: payload, storyId: payload.story?.id || payload.id })).success;
    case 'reading_progress':
      return (await syncActivityImmediately('reading_progress', payload)).success;
    default:
      return false;
  }
}

/**
 * Removes an entity from Supabase when permanently deleted
 */
export async function deleteEntityFromSupabase(
  entityType: 'story' | 'chapter' | 'trash',
  id: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  if (cachedSchemaStatus && !cachedSchemaStatus.ready) return false;

  try {
    const table = entityType === 'story' 
      ? 'stories' 
      : entityType === 'chapter' 
        ? 'chapters' 
        : 'recently_deleted_stories';

    await supabase.from(table).delete().eq('id', id);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Loads entire database from Supabase on application cold-start if available
 */
export async function loadFullStateFromSupabase(): Promise<Partial<DatabaseSchema> | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const schemaCheck = await checkSupabaseSchemaReady();
  if (!schemaCheck.ready) {
    return null;
  }

  try {
    const [
      { data: profiles, error: errProfiles },
      { data: credentials, error: errCredentials },
      { data: sessions, error: errSessions },
      { data: stories, error: errStories },
      { data: chapters, error: errChapters },
      { data: readingProgress, error: errReadingProgress },
      { data: library, error: errLibrary },
      { data: storyLikes, error: errStoryLikes },
      { data: userFollows, error: errUserFollows },
      { data: reviews, error: errReviews },
      { data: comments, error: errComments },
      { data: characters, error: errCharacters },
      { data: worlds, error: errWorlds },
      { data: universes, error: errUniverses },
      { data: programs, error: errPrograms },
      { data: programParticipants, error: errParticipants },
      { data: programSubmissions, error: errSubmissions },
      { data: programVotes, error: errVotes },
      { data: trash, error: errTrash },
      { data: communitiesData },
      { data: communityPostsData },
      { data: notificationsData },
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_credentials').select('*'),
      supabase.from('user_sessions').select('*'),
      supabase.from('stories').select('*'),
      supabase.from('chapters').select('*'),
      supabase.from('reading_progress').select('*'),
      supabase.from('library').select('*'),
      supabase.from('story_likes').select('*'),
      supabase.from('user_follows').select('*'),
      supabase.from('reviews').select('*'),
      supabase.from('chapter_comments').select('*'),
      supabase.from('characters').select('*'),
      supabase.from('worlds').select('*'),
      supabase.from('universes').select('*'),
      supabase.from('programs').select('*'),
      supabase.from('program_participants').select('*'),
      supabase.from('program_submissions').select('*'),
      supabase.from('program_votes').select('*'),
      supabase.from('recently_deleted_stories').select('*'),
      supabase.from('communities').select('*'),
      supabase.from('community_posts').select('*'),
      supabase.from('notifications').select('*'),
    ]);

    if (errProfiles || errStories) {
      console.error('[Supabase Full State Error] Failed to fetch critical profiles or stories:', errProfiles || errStories);
      return null;
    }

    if (!profiles && !stories) {
      return null;
    }

    const DEFAULT_COVER = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800';
    const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

    const users: User[] = (profiles || []).map(p => ({
      id: p.id,
      username: p.username,
      email: p.email,
      displayName: p.display_name,
      avatar: p.avatar || DEFAULT_AVATAR,
      bio: p.bio,
      role: p.role,
      xp: p.xp,
      level: p.level,
      readingStreak: p.reading_streak,
      lastActiveDate: p.last_active_date,
      followersCount: p.followers_count,
      followingCount: p.following_count,
      totalReads: p.total_reads,
      favoriteGenres: p.favorite_genres || [],
      favoriteThemes: p.favorite_themes || [],
      createdAt: p.created_at,
      isVerifiedWriter: p.is_verified,
    }));

    const userMap = new Map<string, User>();
    users.forEach(u => userMap.set(u.id, u));

    const mappedStories: Story[] = (stories || []).map(s => {
      const authorUser = userMap.get(s.author_id);
      return {
        id: s.id,
        authorId: s.author_id,
        authorUsername: s.author_username || authorUser?.username || 'unknown',
        authorDisplayName: s.author_display_name || authorUser?.displayName || 'Author',
        authorAvatar: s.author_avatar || authorUser?.avatar || DEFAULT_AVATAR,
        title: s.title,
        slug: s.slug || s.id,
        description: s.description || '',
        coverImage: s.cover_image || DEFAULT_COVER,
        genre: s.genre || 'Fantasy',
        tags: s.tags || [],
        language: 'English',
        ageRating: s.age_rating || 'Everyone',
        storyType: s.story_type || 'Light Novel',
        status: s.status || 'Ongoing',
        views: s.views || 0,
        likes: s.like_count || 0,
        rating: Number(s.rating || 5),
        ratingCount: s.review_count || 0,
        universeId: s.universe_id,
        chaptersCount: s.total_chapters || 0,
        createdAt: s.created_at,
        updatedAt: s.last_updated_date || s.created_at,
      };
    });

    const mappedChapters: Chapter[] = (chapters || []).map(c => ({
      id: c.id,
      storyId: c.story_id,
      chapterNumber: Number(c.chapter_number || 1),
      title: c.title,
      content: c.content || '',
      wordCount: Number(c.word_count || 0),
      readingTime: Math.max(1, Math.ceil(Number(c.word_count || 0) / 200)),
      publishedAt: c.publish_date || c.created_at,
      updatedAt: c.updated_at || c.created_at,
      status: c.status || 'Published',
      authorNote: c.author_notes || undefined,
      createdAt: c.created_at,
    }));

    const passwords: Record<string, any> = {};
    (credentials || []).forEach(cr => {
      passwords[cr.user_id] = { salt: cr.salt, hash: cr.hash };
    });

    const sessionMap: Record<string, any> = {};
    (sessions || []).forEach(s => {
      sessionMap[s.token] = { userId: s.user_id, createdAt: s.created_at, expiresAt: s.expires_at };
    });

    const likesMap: Record<string, string[]> = {};
    (storyLikes || []).forEach(l => {
      if (!likesMap[l.story_id]) likesMap[l.story_id] = [];
      if (!likesMap[l.story_id].includes(l.user_id)) {
        likesMap[l.story_id].push(l.user_id);
      }
    });

    const followsMap: Record<string, string[]> = {};
    (userFollows || []).forEach(f => {
      if (!followsMap[f.author_id]) followsMap[f.author_id] = [];
      if (!followsMap[f.author_id].includes(f.follower_id)) {
        followsMap[f.author_id].push(f.follower_id);
      }
    });

    const storyMap = new Map<string, Story>();
    mappedStories.forEach(s => storyMap.set(s.id, s));

    const chapterMap = new Map<string, Chapter>();
    mappedChapters.forEach(c => chapterMap.set(c.id, c));

    return {
      users,
      stories: mappedStories,
      chapters: mappedChapters,
      passwords,
      sessions: sessionMap,
      likes: likesMap,
      follows: followsMap,
      readingProgress: (readingProgress || []).map(rp => {
        const foundStory = storyMap.get(rp.story_id);
        const foundChapter = chapterMap.get(rp.chapter_id);
        return {
          id: `${rp.user_id}_${rp.story_id}`,
          userId: rp.user_id,
          storyId: rp.story_id,
          storyTitle: foundStory?.title || 'Story',
          storyCover: foundStory?.coverImage || DEFAULT_COVER,
          chapterId: rp.chapter_id || '',
          chapterNumber: Number(rp.chapter_number || 1),
          chapterTitle: foundChapter?.title || `Chapter ${rp.chapter_number || 1}`,
          totalChapters: foundStory?.chaptersCount || 1,
          progressPercent: Number(rp.progress_percent || 0),
          lastPosition: Number(rp.last_position || 0),
          lastReadAt: rp.last_read_at,
        };
      }),
      library: (library || []).map(l => ({
        id: `${l.user_id}_${l.story_id}`,
        userId: l.user_id,
        storyId: l.story_id,
        listType: l.list_type || 'saved',
        addedAt: l.added_at,
      })),
      reviews: (reviews || []).map(r => {
        const revUser = userMap.get(r.user_id);
        return {
          id: r.id,
          userId: r.user_id,
          username: r.username || revUser?.username || 'Reader',
          userAvatar: r.user_avatar || revUser?.avatar || DEFAULT_AVATAR,
          storyId: r.story_id,
          rating: Number(r.rating || 5),
          reviewText: r.review_text || '',
          likes: Number(r.likes || 0),
          createdAt: r.created_at,
          updatedAt: r.created_at,
        };
      }),
      comments: (comments || []).map(c => {
        const commUser = userMap.get(c.user_id);
        return {
          id: c.id,
          chapterId: c.chapter_id,
          storyId: c.story_id,
          userId: c.user_id,
          username: c.username || commUser?.username || 'User',
          userAvatar: c.user_avatar || commUser?.avatar || DEFAULT_AVATAR,
          content: c.content || '',
          parentId: c.parent_id || null,
          likes: Number(c.likes || 0),
          likedByUsers: c.liked_by || [],
          createdAt: c.created_at,
        };
      }),
      characters: (characters || []).map(ch => ({
        id: ch.id,
        storyId: ch.story_id,
        authorId: ch.author_id,
        name: ch.name,
        role: ch.role || 'Protagonist',
        age: ch.age || 'Unknown',
        portrait: ch.avatar || '',
        primaryPower: ch.primary_power || '',
        biography: ch.background || ch.description || '',
        personality: ch.personality || '',
        createdAt: ch.created_at,
      })),
      worlds: (worlds || []).map(w => ({
        id: w.id,
        authorId: w.author_id,
        name: w.name,
        description: w.description || '',
        rules: w.rules || '',
        magicTypes: w.magic_system ? [w.magic_system] : [],
        techLevel: w.technology_level || '',
        createdAt: w.created_at,
      })),
      universes: (universes || []).map(u => ({
        id: u.id,
        slug: u.slug || u.id,
        authorId: u.author_id,
        name: u.title || 'Untitled Universe',
        tagline: '',
        description: u.description || '',
        bannerImage: u.banner_image || u.cover_image || '',
        storiesCount: 0,
        charactersCount: 0,
        readersCount: 0,
        rating: 5,
        createdAt: u.created_at,
      })),
      programs: (programs || []).map(p => {
        const seed = initialPrograms.find(ip => ip.id === p.id || ip.slug === p.slug);
        const fallbackTimeline = seed?.timeline || {
          registrationOpens: p.start_date || new Date().toISOString(),
          registrationCloses: p.end_date || new Date(Date.now() + 14 * 86400000).toISOString(),
          submissionOpens: p.start_date || new Date().toISOString(),
          submissionDeadline: p.end_date || new Date(Date.now() + 30 * 86400000).toISOString(),
          votingStarts: new Date(Date.now() + 31 * 86400000).toISOString(),
          votingEnds: new Date(Date.now() + 45 * 86400000).toISOString(),
          judgingStarts: new Date(Date.now() + 31 * 86400000).toISOString(),
          judgingEnds: new Date(Date.now() + 50 * 86400000).toISOString(),
          finalistAnnouncementDate: new Date(Date.now() + 46 * 86400000).toISOString(),
          resultDeclarationDate: new Date(Date.now() + 55 * 86400000).toISOString(),
          winnerAnnouncementTime: '12:00 UTC',
          programEndDate: new Date(Date.now() + 60 * 86400000).toISOString()
        };
        const fallbackAnalytics = seed?.analytics || {
          views: 0,
          uniqueVisitors: 0,
          registrationsCount: 0,
          submissionsCount: 0,
          totalVotes: 0,
          completionRate: 0,
          sharesCount: 0
        };

        return {
          ...seed,
          id: p.id,
          slug: p.slug,
          name: p.title || seed?.name || 'Untitled Program',
          tagline: p.subtitle || seed?.tagline || '',
          description: p.description || seed?.description || '',
          type: p.type || seed?.type || 'Writing Competition',
          status: p.status || seed?.status || 'REGISTRATION_OPEN',
          bannerImage: p.banner_image || seed?.bannerImage || '',
          coverImage: seed?.coverImage || p.banner_image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
          thumbnail: seed?.thumbnail || p.banner_image || 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&auto=format&fit=crop&q=80',
          organizerName: seed?.organizerName || 'KAIRO Editorial Guild',
          theme: seed?.theme || 'Creative Writing',
          category: seed?.category || 'Fiction',
          eligibility: seed?.eligibility || 'Open to all creators',
          language: seed?.language || 'English',
          maxParticipants: seed?.maxParticipants || 500,
          minParticipants: seed?.minParticipants || 1,
          targetAudience: (p.settings?.targetAudience || seed?.targetAudience || 'both') as any,
          visibility: (p.settings?.visibility || seed?.visibility || 'public') as any,
          timeline: fallbackTimeline,
          rules: (typeof seed?.rules === 'object' && seed.rules !== null && !Array.isArray(seed.rules)) ? seed.rules : {
            fullRules: Array.isArray(p.rules) ? p.rules.join('\n') : (typeof p.rules === 'string' ? p.rules : 'Adhere to community guidelines.'),
            participationRequirements: 'Active account required.',
            allowedContent: 'Original stories.',
            prohibitedContent: 'Plagiarism, hate speech.',
            wordLimitMin: 1000,
            wordLimitMax: 20000,
            requireRulesAgreement: true
          },
          prizes: seed?.prizes || [],
          judgingConfig: seed?.judgingConfig || {
            criteria: [
              { id: 'crit_1', name: 'Originality', description: 'Uniqueness of concept', maxScore: 25, weightPercent: 25 },
              { id: 'crit_2', name: 'Writing Style', description: 'Flow and prose quality', maxScore: 25, weightPercent: 25 },
              { id: 'crit_3', name: 'Pacing & Plot', description: 'Narrative structure', maxScore: 25, weightPercent: 25 },
              { id: 'crit_4', name: 'Worldbuilding', description: 'Setting immersion', maxScore: 25, weightPercent: 25 }
            ],
            formula: 'WEIGHTED_SUM',
            judgeWeightPercent: 70,
            communityWeightPercent: 30
          },
          votingConfig: seed?.votingConfig || {
            enabled: true,
            mode: 'POINTS_ALLOCATION',
            maxVotesPerUser: 5,
            preventVoteBuying: true
          },
          leaderboardConfig: seed?.leaderboardConfig || {
            enabled: true,
            visibility: 'PUBLIC',
            realTime: true,
            rankBy: 'COMBINED'
          },
          sponsors: seed?.sponsors || [],
          faq: seed?.faq || [],
          finalists: seed?.finalists || [],
          results: seed?.results || { isLocked: false, winners: [] },
          analytics: fallbackAnalytics,
          createdAt: p.created_at || seed?.createdAt || new Date().toISOString(),
          updatedAt: p.updated_at || seed?.updatedAt || new Date().toISOString(),
          createdByAdminId: p.created_by || seed?.createdByAdminId || 'usr_admin',
        } as Program;
      }),
      programParticipants: (programParticipants || []).map(pp => ({
        id: pp.id,
        programId: pp.program_id,
        userId: pp.user_id,
        status: pp.status || 'REGISTERED',
        rulesAgreementCheckbox: Boolean(pp.rules_accepted),
        registeredAt: pp.registered_at || new Date().toISOString(),
      })) as any,
      programSubmissions: (programSubmissions || []).map(ps => ({
        id: ps.id,
        programId: ps.program_id,
        userId: ps.user_id,
        storyId: ps.story_id || undefined,
        title: ps.title,
        summary: ps.summary || '',
        status: ps.status || 'SUBMITTED',
        score: Number(ps.score || 0),
        votes: Number(ps.votes_count || 0),
        submittedAt: ps.submitted_at || new Date().toISOString(),
      })) as any,
      programVotes: (programVotes || []).map(pv => ({
        id: pv.id,
        programId: pv.program_id,
        submissionId: pv.submission_id,
        userId: pv.user_id,
        ipAddress: pv.ip_address || '',
        votedAt: pv.voted_at || new Date().toISOString(),
      })) as any,
      recentlyDeletedStories: (trash || []).map(t => ({
        id: t.id,
        story: t.story,
        chapters: t.chapters || [],
        characters: t.characters || [],
        deletedAt: t.deleted_at,
        expiresAt: t.expires_at,
        deletedByUserId: t.deleted_by_user_id,
        deletedByUsername: t.deleted_by_username,
      })),
      communities: (communitiesData || []).map((c: any) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description || '',
        iconImage: c.icon || '',
        bannerImage: c.banner || '',
        type: c.type || 'GENRE',
        categories: c.category ? [c.category] : ['All'],
        memberCount: c.member_count || 1,
        postsCount: c.post_count || 0,
        createdAt: c.created_at || new Date().toISOString(),
      })),
      communityPosts: (communityPostsData || []).map((cp: any) => ({
        id: cp.id,
        communityId: cp.community_id,
        userId: cp.user_id,
        authorId: cp.user_id || '',
        authorUsername: cp.author_name || 'Member',
        authorDisplayName: cp.author_name || 'Member',
        authorAvatar: cp.author_avatar || '',
        authorRole: cp.author_role || 'Member',
        title: cp.title,
        content: cp.content || '',
        type: cp.post_type || 'DISCUSSION',
        mediaUrl: cp.media_url || undefined,
        tags: cp.tags || [],
        likes: cp.likes || 0,
        likedByUsers: [],
        commentCount: cp.comment_count || 0,
        commentsCount: cp.comment_count || 0,
        isPinned: Boolean(cp.is_pinned),
        isLocked: Boolean(cp.is_locked),
        createdAt: cp.created_at || new Date().toISOString(),
      })),
      notifications: (notificationsData || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type || 'community_activity',
        title: n.title,
        message: n.message,
        link: n.link || undefined,
        linkUrl: n.link || '',
        read: Boolean(n.read),
        isRead: Boolean(n.read),
        createdAt: n.created_at || new Date().toISOString(),
      })),
    };
  } catch (err: any) {
    console.warn('[Supabase] Failed to load full state:', err?.message);
    return null;
  }
}

// =========================================================================
// PHASE 2: AUTHORITATIVE SUPABASE AUTHENTICATION & IDENTITY PERSISTENCE
// =========================================================================

export async function supabaseFindUserByUsernameOrEmail(identifier: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const clean = identifier.trim().toLowerCase();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.${clean},email.ilike.${clean}`)
    .maybeSingle();

  if (error) {
    console.error('[Supabase Auth] findUserByUsernameOrEmail error:', error.message);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    email: data.email,
    displayName: data.display_name || data.username,
    avatar: data.avatar || '',
    bio: data.bio || '',
    role: data.role || 'USER',
    xp: data.xp || 0,
    level: data.level || 1,
    readingStreak: data.reading_streak || 0,
    lastActiveDate: data.last_active_date || data.created_at,
    followersCount: data.followers_count || 0,
    followingCount: data.following_count || 0,
    totalReads: data.total_reads || 0,
    favoriteGenres: data.favorite_genres || [],
    favoriteThemes: data.favorite_themes || [],
    isVerifiedWriter: Boolean(data.is_verified || data.role === 'WRITER' || data.role === 'ADMIN'),
    createdAt: data.created_at,
  };
}

export async function supabaseFindUserById(userId: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Supabase Auth] findUserById error:', error.message);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    email: data.email,
    displayName: data.display_name || data.username,
    avatar: data.avatar || '',
    bio: data.bio || '',
    role: data.role || 'USER',
    xp: data.xp || 0,
    level: data.level || 1,
    readingStreak: data.reading_streak || 0,
    lastActiveDate: data.last_active_date || data.created_at,
    followersCount: data.followers_count || 0,
    followingCount: data.following_count || 0,
    totalReads: data.total_reads || 0,
    favoriteGenres: data.favorite_genres || [],
    favoriteThemes: data.favorite_themes || [],
    isVerifiedWriter: Boolean(data.is_verified || data.role === 'WRITER' || data.role === 'ADMIN'),
    createdAt: data.created_at,
  };
}

export async function supabaseCreateUserWithCredentials(
  user: User,
  salt: string,
  hash: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Database service unavailable: Supabase client not initialized.' };
  }

  // 1. Check for duplicates in Supabase directly
  const { data: existing, error: checkError } = await supabase
    .from('profiles')
    .select('id, username, email')
    .or(`username.ilike.${user.username},email.ilike.${user.email}`);

  if (checkError) {
    console.error('[Supabase Auth Error] Duplicate check failed:', checkError.message);
    return { success: false, error: `Database verification error: ${checkError.message}` };
  }

  if (existing && existing.length > 0) {
    return { success: false, error: 'A user with this username or email already exists in production.' };
  }

  // 2. Insert profile record
  const profileRow = {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.displayName || user.username,
    avatar: user.avatar || null,
    bio: user.bio || null,
    role: user.role || 'USER',
    xp: user.xp || 0,
    level: user.level || 1,
    reading_streak: user.readingStreak || 0,
    last_active_date: user.lastActiveDate || new Date().toISOString(),
    followers_count: user.followersCount || 0,
    following_count: user.followingCount || 0,
    total_reads: user.totalReads || 0,
    favorite_genres: user.favoriteGenres || [],
    favorite_themes: user.favoriteThemes || [],
    is_verified: Boolean(user.isVerifiedWriter || user.role === 'WRITER' || user.role === 'ADMIN'),
    created_at: user.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase.from('profiles').insert(profileRow);
  if (profileError) {
    console.error('[Supabase Auth Error] Failed to insert profile:', profileError.message);
    return { success: false, error: `Failed to persist user profile: ${profileError.message}` };
  }

  // 3. Insert user credentials record
  const credsRow = {
    user_id: user.id,
    salt,
    hash,
    updated_at: new Date().toISOString(),
  };

  const { error: credsError } = await supabase.from('user_credentials').insert(credsRow);
  if (credsError) {
    console.error('[Supabase Auth Error] Failed to insert credentials:', credsError.message);
    // Rollback profile insert to prevent orphaned profile
    await supabase.from('profiles').delete().eq('id', user.id);
    return { success: false, error: `Failed to persist user credentials: ${credsError.message}` };
  }

  return { success: true };
}

export async function supabaseGetCredentials(userId: string): Promise<{ salt: string; hash: string } | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_credentials')
    .select('salt, hash')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Supabase Auth Error] getCredentials error:', error.message);
    return null;
  }
  return data;
}

export async function supabaseSetCredentials(userId: string, salt: string, hash: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_credentials')
    .upsert({
      user_id: userId,
      salt,
      hash,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('[Supabase Auth Error] setCredentials error:', error.message);
    return false;
  }
  return true;
}

export async function supabaseCreateSessionRecord(
  token: string,
  userId: string,
  expiresAt: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Database service unavailable: Supabase client not initialized.' };
  }

  const { error } = await supabase
    .from('user_sessions')
    .insert({
      token,
      user_id: userId,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    });

  if (error) {
    console.error('[Supabase Auth Error] createSessionRecord error:', error.message);
    return { success: false, error: `Failed to persist session: ${error.message}` };
  }
  return { success: true };
}

export async function supabaseValidateSessionRecord(token: string): Promise<{
  status: 'OK' | 'EXPIRED' | 'INVALID' | 'NOT_FOUND';
  user: User | null;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { status: 'INVALID', user: null };
  }

  const { data: session, error } = await supabase
    .from('user_sessions')
    .select('token, user_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (error) {
    console.error('[Supabase Auth Error] validateSessionRecord error:', error.message);
    return { status: 'INVALID', user: null };
  }

  if (!session) {
    return { status: 'INVALID', user: null };
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    // Delete expired session
    await supabase.from('user_sessions').delete().eq('token', token);
    return { status: 'EXPIRED', user: null };
  }

  const user = await supabaseFindUserById(session.user_id);
  if (!user) {
    return { status: 'NOT_FOUND', user: null };
  }

  return { status: 'OK', user };
}

export async function supabaseDeleteSessionRecord(token: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .eq('token', token);

  if (error) {
    console.error('[Supabase Auth Error] deleteSessionRecord error:', error.message);
    return false;
  }
  return true;
}

