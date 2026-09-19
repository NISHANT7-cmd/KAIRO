-- KAIRO PRODUCTION DATABASE ROW LEVEL SECURITY
-- Migration 002: Row Level Security Policies
-- Protects user data while keeping public reader content readable

-- Enable RLS on core entities
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE library ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE theories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_deleted_stories ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Public read, owner update
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE USING (auth.uid()::text = id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid()::text = id OR auth.role() = 'service_role');

-- 2. Stories: Public read for published, author or service_role for all
CREATE POLICY "Stories are viewable by everyone" 
  ON stories FOR SELECT USING (true);

CREATE POLICY "Authors can insert stories" 
  ON stories FOR INSERT WITH CHECK (auth.uid()::text = author_id OR auth.role() = 'service_role');

CREATE POLICY "Authors can update their stories" 
  ON stories FOR UPDATE USING (auth.uid()::text = author_id OR auth.role() = 'service_role');

CREATE POLICY "Authors can delete their stories" 
  ON stories FOR DELETE USING (auth.uid()::text = author_id OR auth.role() = 'service_role');

-- 3. Chapters: Public read
CREATE POLICY "Chapters are viewable by everyone" 
  ON chapters FOR SELECT USING (true);

CREATE POLICY "Story authors or service role can manage chapters" 
  ON chapters FOR ALL USING (
    EXISTS (SELECT 1 FROM stories WHERE stories.id = chapters.story_id AND (stories.author_id = auth.uid()::text OR auth.role() = 'service_role'))
  );

-- 4. Reading Progress: Private to owner
CREATE POLICY "Users can view their own reading progress" 
  ON reading_progress FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can manage their own reading progress" 
  ON reading_progress FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- 5. Library: Private to owner
CREATE POLICY "Users can view their library" 
  ON library FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can manage their library" 
  ON library FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- 6. Social interactions (Likes, Follows, Comments, Reviews)
CREATE POLICY "Likes are viewable by everyone" 
  ON story_likes FOR SELECT USING (true);
CREATE POLICY "Users can toggle their own likes" 
  ON story_likes FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Follows are viewable by everyone" 
  ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can toggle their follows" 
  ON user_follows FOR ALL USING (auth.uid()::text = follower_id OR auth.role() = 'service_role');

CREATE POLICY "Comments are viewable by everyone" 
  ON chapter_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" 
  ON chapter_comments FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "Users can manage their comments" 
  ON chapter_comments FOR UPDATE USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- 7. Notifications: Strict privacy
CREATE POLICY "Users view only their notifications" 
  ON notifications FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "Users update only their notifications" 
  ON notifications FOR UPDATE USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- 8. Programs & Competitions
CREATE POLICY "Programs are viewable by everyone" 
  ON programs FOR SELECT USING (true);

CREATE POLICY "Submissions viewable by everyone" 
  ON program_submissions FOR SELECT USING (true);

CREATE POLICY "Registered users can submit to programs" 
  ON program_submissions FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can cast votes in programs" 
  ON program_votes FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- 9. 30-Day Recently Deleted Recovery Vault
CREATE POLICY "Authors can view their own recently deleted stories" 
  ON recently_deleted_stories FOR SELECT USING (auth.uid()::text = deleted_by_user_id OR auth.role() = 'service_role');

CREATE POLICY "Authors can manage their own trash vault" 
  ON recently_deleted_stories FOR ALL USING (auth.uid()::text = deleted_by_user_id OR auth.role() = 'service_role');
