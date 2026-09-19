-- KAIRO PRODUCTION DATABASE SCHEMA MIGRATION
-- Migration 001: Initial Schema Definition
-- Non-destructive, repeatable schema with proper primary and foreign keys

-- 1. Migration tracking table
CREATE TABLE IF NOT EXISTS migration_status (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'RUNNING',
  details JSONB
);

-- 2. User Profiles (Mirrors User identity across Kairo)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'USER',
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  reading_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TIMESTAMPTZ,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  total_reads INTEGER NOT NULL DEFAULT 0,
  favorite_genres TEXT[] DEFAULT '{}',
  favorite_themes TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  custom_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. User Credentials & Sessions (for native auth persistence)
CREATE TABLE IF NOT EXISTS user_credentials (
  user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  salt TEXT NOT NULL,
  hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 4. Stories
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  cover_image TEXT,
  banner_image TEXT,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  author_username TEXT,
  author_avatar TEXT,
  author_display_name TEXT,
  genre TEXT NOT NULL,
  sub_genres TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  target_audience TEXT,
  age_rating TEXT NOT NULL DEFAULT 'Everyone (G)',
  content_warnings TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Ongoing',
  story_type TEXT NOT NULL DEFAULT 'Original',
  universe_id TEXT,
  world_id TEXT,
  total_chapters INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER NOT NULL DEFAULT 0,
  read_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT 5.0,
  review_count INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  publication_date TIMESTAMPTZ,
  last_updated_date TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT FALSE,
  is_weekly_pick BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,
  trending_rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Chapters
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  read_count INTEGER NOT NULL DEFAULT 0,
  publish_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Published',
  author_notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Reading Progress
CREATE TABLE IF NOT EXISTS reading_progress (
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id TEXT,
  chapter_number INTEGER NOT NULL DEFAULT 1,
  progress_percent NUMERIC NOT NULL DEFAULT 0,
  last_position NUMERIC NOT NULL DEFAULT 0,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, story_id)
);

-- 7. User Library (Bookmarks & Shelves)
CREATE TABLE IF NOT EXISTS library (
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  list_type TEXT NOT NULL DEFAULT 'saved',
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, story_id)
);

-- 8. Story Likes
CREATE TABLE IF NOT EXISTS story_likes (
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (story_id, user_id)
);

-- 9. User Follows
CREATE TABLE IF NOT EXISTS user_follows (
  follower_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, author_id)
);

-- 10. Reviews & Comments
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapter_comments (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  liked_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Characters & Lore Building
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Protagonist',
  age TEXT,
  gender TEXT,
  appearance TEXT,
  personality TEXT,
  background TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS character_relationships (
  id TEXT PRIMARY KEY,
  character_id1 TEXT NOT NULL,
  character_id2 TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS worlds (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  magic_system TEXT,
  technology_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS universes (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  banner_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Anime Tracker & Entries
CREATE TABLE IF NOT EXISTS anime_entries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  japanese_title TEXT,
  synopsis TEXT,
  cover_image TEXT,
  banner_image TEXT,
  format TEXT,
  episodes INTEGER,
  status TEXT,
  genres TEXT[] DEFAULT '{}',
  rating NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_anime_tracking (
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id TEXT NOT NULL REFERENCES anime_entries(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Watching',
  episodes_watched INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, anime_id)
);

-- 13. Notifications & Badges
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- 14. Communities, Posts & Chat
CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  banner TEXT,
  type TEXT NOT NULL DEFAULT 'GENRE',
  category TEXT,
  member_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_members (
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT,
  author_avatar TEXT,
  author_role TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'DISCUSSION',
  media_url TEXT,
  tags TEXT[] DEFAULT '{}',
  likes INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS theories (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  agree_votes INTEGER NOT NULL DEFAULT 0,
  disagree_votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  slow_mode INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  user_avatar TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Competitions & Programs
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'COMPETITION',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  banner_image TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  rules TEXT[] DEFAULT '{}',
  prize_summary TEXT,
  settings JSONB DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_participants (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'REGISTERED',
  rules_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_submissions (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id TEXT REFERENCES stories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  is_finalist BOOLEAN DEFAULT FALSE,
  score NUMERIC DEFAULT 0,
  votes_count INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_votes (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL REFERENCES program_submissions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address TEXT,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_announcements (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_audit_logs (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_certificates (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Soft-delete 30-Day Recovery Vault
CREATE TABLE IF NOT EXISTS recently_deleted_stories (
  id TEXT PRIMARY KEY,
  story JSONB NOT NULL,
  chapters JSONB NOT NULL DEFAULT '[]',
  characters JSONB NOT NULL DEFAULT '[]',
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  deleted_by_user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deleted_by_username TEXT NOT NULL
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_genre ON stories(genre);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_library_user ON library(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_comm ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_program_submissions_prog ON program_submissions(program_id);
