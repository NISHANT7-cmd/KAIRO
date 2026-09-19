-- KAIRO PRODUCTION STORAGE BUCKETS
-- Migration 003: Supabase Storage Buckets and Access Policies

-- 1. Create public storage buckets for media assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('story-covers', 'story-covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('character-art', 'character-art', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('program-assets', 'program-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies
-- Avatars: Public read, authenticated user upload
CREATE POLICY "Public avatar access" 
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'avatars' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

-- Story covers: Public read, authenticated author upload
CREATE POLICY "Public story cover access" 
  ON storage.objects FOR SELECT USING (bucket_id = 'story-covers');

CREATE POLICY "Authenticated users can upload story covers" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'story-covers' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

-- Character art: Public read
CREATE POLICY "Public character art access" 
  ON storage.objects FOR SELECT USING (bucket_id = 'character-art');

CREATE POLICY "Authenticated users can upload character art" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'character-art' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));
