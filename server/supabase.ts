import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseSchema } from './db.js';
import { User, Story, Chapter } from '../src/types.js';

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
  | 'profile_upsert';

/**
 * Automatically & immediately persists any user activity directly to Supabase server.
 * Operates non-blockingly with robust error containment so user requests are never delayed.
 */
export async function syncActivityImmediately(
  activityType: SupabaseActivityType,
  payload: any
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  if (cachedSchemaStatus && !cachedSchemaStatus.ready) return false;

  try {
    switch (activityType) {
      case 'story_upsert': {
        const story = payload;
        if (!story || !story.id) return false;
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
          updated_at: story.updatedAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('stories').upsert(row, { onConflict: 'id' });
        if (error) console.warn('[Supabase Realtime Sync] story_upsert warning:', error.message);
        return !error;
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
          await supabase.from('recently_deleted_stories').upsert(trashRow, { onConflict: 'id' });
        }
        if (storyId) {
          await supabase.from('stories').delete().eq('id', storyId);
        }
        return true;
      }

      case 'story_restore': {
        const { trashId, story } = payload;
        if (trashId) {
          await supabase.from('recently_deleted_stories').delete().eq('id', trashId);
        }
        if (story && story.id) {
          await syncActivityImmediately('story_upsert', story);
        }
        return true;
      }

      case 'story_permanent_delete': {
        const { trashId } = payload;
        if (trashId) {
          await supabase.from('recently_deleted_stories').delete().eq('id', trashId);
        }
        return true;
      }

      case 'chapter_upsert': {
        const { chapter, storyId, chaptersCount } = payload;
        const chap = chapter || payload;
        if (!chap || !chap.id) return false;
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
        const { error } = await supabase.from('chapters').upsert(chapRow, { onConflict: 'id' });
        if (error) console.warn('[Supabase Realtime Sync] chapter_upsert warning:', error.message);

        const targetStoryId = chap.storyId || storyId;
        if (targetStoryId && chaptersCount !== undefined) {
          await supabase.from('stories').update({
            total_chapters: chaptersCount,
            updated_at: new Date().toISOString(),
          }).eq('id', targetStoryId);
        }
        return !error;
      }

      case 'chapter_delete': {
        const { chapterId, storyId, chaptersCount } = payload;
        if (chapterId) {
          await supabase.from('chapters').delete().eq('id', chapterId);
        }
        if (storyId && chaptersCount !== undefined) {
          await supabase.from('stories').update({
            total_chapters: chaptersCount,
            updated_at: new Date().toISOString(),
          }).eq('id', storyId);
        }
        return true;
      }

      case 'story_like': {
        const { userId, storyId, totalLikes } = payload;
        if (!userId || !storyId) return false;
        const { error } = await supabase.from('story_likes').upsert({
          story_id: storyId,
          user_id: userId,
          created_at: new Date().toISOString(),
        }, { onConflict: 'story_id,user_id' });
        if (error) console.warn('[Supabase Realtime Sync] story_like warning:', error.message);

        if (totalLikes !== undefined) {
          await supabase.from('stories').update({
            like_count: totalLikes,
            updated_at: new Date().toISOString()
          }).eq('id', storyId);
        }
        return true;
      }

      case 'story_unlike': {
        const { userId, storyId, totalLikes } = payload;
        if (!userId || !storyId) return false;
        await supabase.from('story_likes').delete().match({ story_id: storyId, user_id: userId });

        if (totalLikes !== undefined) {
          await supabase.from('stories').update({
            like_count: totalLikes,
            updated_at: new Date().toISOString()
          }).eq('id', storyId);
        }
        return true;
      }

      case 'user_follow': {
        const { followerId, authorId } = payload;
        if (!followerId || !authorId) return false;
        await supabase.from('user_follows').upsert({
          follower_id: followerId,
          author_id: authorId,
          created_at: new Date().toISOString(),
        }, { onConflict: 'follower_id,author_id' });
        return true;
      }

      case 'user_unfollow': {
        const { followerId, authorId } = payload;
        if (!followerId || !authorId) return false;
        await supabase.from('user_follows').delete().match({ follower_id: followerId, author_id: authorId });
        return true;
      }

      case 'library_toggle': {
        const { userId, storyId, listType, inLibrary } = payload;
        if (!userId || !storyId) return false;
        if (inLibrary) {
          await supabase.from('library').upsert({
            user_id: userId,
            story_id: storyId,
            list_type: listType || 'saved',
            added_at: new Date().toISOString(),
          }, { onConflict: 'user_id,story_id' });
        } else {
          await supabase.from('library').delete().match({ user_id: userId, story_id: storyId });
        }
        return true;
      }

      case 'reading_progress': {
        const progress = payload;
        if (!progress || !progress.userId || !progress.storyId) return false;
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
        if (error) console.warn('[Supabase Realtime Sync] reading_progress warning:', error.message);
        return !error;
      }

      case 'review_upsert': {
        const { review, storyRating } = payload;
        const rev = review || payload;
        if (!rev || !rev.id) return false;
        const revRow = {
          id: rev.id,
          user_id: rev.userId,
          story_id: rev.storyId,
          rating: rev.rating,
          review_text: rev.reviewText || null,
          likes: rev.likes || 0,
          created_at: rev.createdAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('reviews').upsert(revRow, { onConflict: 'id' });
        if (error) console.warn('[Supabase Realtime Sync] review_upsert warning:', error.message);

        if (rev.storyId && storyRating !== undefined) {
          await supabase.from('stories').update({
            rating: storyRating,
            updated_at: new Date().toISOString(),
          }).eq('id', rev.storyId);
        }
        return !error;
      }

      case 'review_like': {
        const { reviewId, likes } = payload;
        if (reviewId && likes !== undefined) {
          await supabase.from('reviews').update({ likes }).eq('id', reviewId);
        }
        return true;
      }

      case 'comment_upsert': {
        const comment = payload;
        if (!comment || !comment.id) return false;
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
        if (error) console.warn('[Supabase Realtime Sync] comment_upsert warning:', error.message);
        return !error;
      }

      case 'comment_like': {
        const comment = payload;
        if (!comment || !comment.id) return false;
        await supabase.from('chapter_comments').update({
          likes: comment.likes || 0,
          liked_by: comment.likedByUsers || comment.likedBy || [],
        }).eq('id', comment.id);
        return true;
      }

      case 'program_participant': {
        const part = payload;
        if (!part || !part.id) return false;
        const partRow = {
          id: part.id,
          program_id: part.programId,
          user_id: part.userId,
          status: part.status || 'REGISTERED',
          rules_accepted: Boolean(part.rulesAgreementCheckbox ?? part.rulesAccepted ?? true),
          registered_at: part.registeredAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('program_participants').upsert(partRow, { onConflict: 'id' });
        if (error) console.warn('[Supabase Realtime Sync] program_participant warning:', error.message);
        return !error;
      }

      case 'program_submission': {
        const sub = payload;
        if (!sub || !sub.id) return false;
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
        if (error) console.warn('[Supabase Realtime Sync] program_submission warning:', error.message);
        return !error;
      }

      case 'program_vote': {
        const { vote, submissionId, votesCount, programId } = payload;
        if (!vote || !vote.id) return false;
        const voteRow = {
          id: vote.id,
          program_id: vote.programId || programId,
          submission_id: vote.submissionId || submissionId,
          user_id: vote.userId,
          ip_address: vote.ipAddress || null,
          voted_at: vote.votedAt || new Date().toISOString(),
        };
        const { error } = await supabase.from('program_votes').upsert(voteRow, { onConflict: 'id' });
        if (error) console.warn('[Supabase Realtime Sync] program_vote warning:', error.message);

        const targetSubId = vote.submissionId || submissionId;
        if (targetSubId && votesCount !== undefined) {
          await supabase.from('program_submissions').update({ votes_count: votesCount }).eq('id', targetSubId);
        }
        return !error;
      }

      case 'character_upsert': {
        const c = payload;
        if (!c || !c.id) return false;
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
        if (error) console.warn('[Supabase Realtime Sync] character_upsert warning:', error.message);
        return !error;
      }

      case 'character_delete': {
        const { characterId } = payload;
        if (characterId) {
          await supabase.from('characters').delete().eq('id', characterId);
        }
        return true;
      }

      case 'world_upsert': {
        const w = payload;
        if (!w || !w.id) return false;
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
        if (error) console.warn('[Supabase Realtime Sync] world_upsert warning:', error.message);
        return !error;
      }

      case 'universe_upsert': {
        const u = payload;
        if (!u || !u.id) return false;
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
        if (error) console.warn('[Supabase Realtime Sync] universe_upsert warning:', error.message);
        return !error;
      }

      case 'profile_upsert': {
        const user = payload;
        if (!user || !user.id) return false;
        const profRow = {
          id: user.id,
          username: user.username,
          display_name: user.displayName || user.username,
          avatar: user.avatar || null,
          bio: user.bio || null,
          role: user.role || 'USER',
          xp: user.xp || 0,
          level: user.level || 1,
        };
        const { error } = await supabase.from('profiles').upsert(profRow, { onConflict: 'id' });
        if (error) console.warn('[Supabase Realtime Sync] profile_upsert warning:', error.message);
        return !error;
      }

      default:
        return false;
    }
  } catch (err: any) {
    console.warn(`[Supabase Realtime Sync Error] ${activityType}:`, err?.message);
    return false;
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
      return syncActivityImmediately('story_upsert', payload);
    case 'chapter':
      return syncActivityImmediately('chapter_upsert', { chapter: payload });
    case 'profile':
      return syncActivityImmediately('profile_upsert', payload);
    case 'trash':
      return syncActivityImmediately('story_delete', { record: payload, storyId: payload.story?.id || payload.id });
    case 'reading_progress':
      return syncActivityImmediately('reading_progress', payload);
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
      { data: profiles },
      { data: credentials },
      { data: sessions },
      { data: stories },
      { data: chapters },
      { data: readingProgress },
      { data: library },
      { data: reviews },
      { data: comments },
      { data: characters },
      { data: trash },
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_credentials').select('*'),
      supabase.from('user_sessions').select('*'),
      supabase.from('stories').select('*'),
      supabase.from('chapters').select('*'),
      supabase.from('reading_progress').select('*'),
      supabase.from('library').select('*'),
      supabase.from('reviews').select('*'),
      supabase.from('chapter_comments').select('*'),
      supabase.from('characters').select('*'),
      supabase.from('recently_deleted_stories').select('*'),
    ]);

    if (!profiles && !stories) {
      return null;
    }

    const users: User[] = (profiles || []).map(p => ({
      id: p.id,
      username: p.username,
      email: p.email,
      displayName: p.display_name,
      avatar: p.avatar,
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

    const mappedStories: Story[] = (stories || []).map(s => ({
      id: s.id,
      authorId: s.author_id,
      authorUsername: s.author_username || 'unknown',
      authorDisplayName: s.author_display_name || 'Author',
      authorAvatar: s.author_avatar || '',
      title: s.title,
      slug: s.slug || s.id,
      description: s.description || '',
      coverImage: s.cover_image || '',
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
    }));

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

    return {
      users,
      stories: mappedStories,
      chapters: mappedChapters,
      passwords,
      sessions: sessionMap,
      readingProgress: (readingProgress || []).map(rp => ({
        id: `${rp.user_id}_${rp.story_id}`,
        userId: rp.user_id,
        storyId: rp.story_id,
        storyTitle: '',
        storyCover: '',
        chapterId: rp.chapter_id || '',
        chapterNumber: Number(rp.chapter_number || 1),
        chapterTitle: '',
        totalChapters: 1,
        progressPercent: Number(rp.progress_percent || 0),
        lastPosition: Number(rp.last_position || 0),
        lastReadAt: rp.last_read_at,
      })),
      library: (library || []).map(l => ({
        id: `${l.user_id}_${l.story_id}`,
        userId: l.user_id,
        storyId: l.story_id,
        listType: l.list_type || 'saved',
        addedAt: l.added_at,
      })),
      reviews: (reviews || []).map(r => ({
        id: r.id,
        userId: r.user_id,
        username: r.username || 'Reader',
        userAvatar: r.user_avatar || '',
        storyId: r.story_id,
        rating: Number(r.rating || 5),
        reviewText: r.review_text || '',
        likes: Number(r.likes || 0),
        createdAt: r.created_at,
        updatedAt: r.created_at,
      })),
      comments: (comments || []).map(c => ({
        id: c.id,
        chapterId: c.chapter_id,
        storyId: c.story_id,
        userId: c.user_id,
        username: c.username || 'User',
        userAvatar: c.user_avatar || '',
        content: c.content || '',
        parentId: c.parent_id || null,
        likes: Number(c.likes || 0),
        likedByUsers: c.liked_by || [],
        createdAt: c.created_at,
      })),
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
    };
  } catch (err: any) {
    console.warn('[Supabase] Failed to load full state:', err?.message);
    return null;
  }
}
