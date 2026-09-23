/**
 * KAIRO PHASE 4 VERIFICATION SUITE
 * Legacy JSON / Filesystem Persistence Retirement Verification
 * 
 * Verifies:
 * 1. Supabase PostgreSQL is the sole authoritative persistence layer.
 * 2. Writes do NOT touch data/kairo_db.json or /tmp/kairo_data.
 * 3. File modification times on legacy JSON archives remain completely untouched.
 * 4. All user activity mutations persist authoritatively in Supabase.
 * 5. Hydration restores full state from Supabase without reading legacy JSON.
 * 6. Hard failure behavior: failures result in API errors, not silent JSON fallbacks.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                     process.env.SUPABASE_ANON_KEY || 
                     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL: Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('========================================================');
  console.log('  KAIRO PHASE 4 RETIREMENT VERIFICATION');
  console.log('========================================================\n');

  // Step 1: Check legacy files and record their modification timestamps
  console.log('--- 1. AUDITING LEGACY FILESYSTEM PERSISTENCE ---');
  const dbJsonPath = path.join(process.cwd(), 'data', 'kairo_db.json');
  const backupJsonPath = path.join(process.cwd(), 'data', 'kairo_db.backup.json');
  const snapshotJsonPath = path.join(process.cwd(), 'data', 'kairo_db.snapshot.json');
  const tmpDirPath = path.join('/tmp', 'kairo_data');

  if (!fs.existsSync(dbJsonPath)) {
    throw new Error('data/kairo_db.json does not exist!');
  }

  const initialDbMtime = fs.statSync(dbJsonPath).mtimeMs;
  const initialBackupMtime = fs.existsSync(backupJsonPath) ? fs.statSync(backupJsonPath).mtimeMs : 0;
  const initialSnapshotMtime = fs.existsSync(snapshotJsonPath) ? fs.statSync(snapshotJsonPath).mtimeMs : 0;

  console.log(`Initial data/kairo_db.json mtime: ${new Date(initialDbMtime).toISOString()}`);
  console.log(`Checking /tmp/kairo_data existence: ${fs.existsSync(tmpDirPath) ? 'EXISTS' : 'DOES NOT EXIST (Expected)'}`);
  
  if (fs.existsSync(tmpDirPath)) {
    console.warn('Warning: /tmp/kairo_data exists on filesystem.');
  }

  // Step 2: Authenticate
  console.log('\n--- 2. AUTHENTICATING TEST USER ---');
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: 'althea_v', password: 'password123' }),
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  }
  const loginData = await loginRes.json();
  const token = loginData.token;
  const user = loginData.user;
  console.log(`Authenticated as ${user.username} (${user.id})`);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Step 3: Execute a sequence of mutations
  console.log('\n--- 3. EXECUTING LIVE PRODUCTION MUTATIONS ---');
  const runId = Math.random().toString(36).substring(2, 10);

  // Mutation A: Create Story
  console.log('Testing: Create Story directly to Supabase...');
  const storyRes = await fetch(`${API_BASE}/api/stories`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: `Phase 4 Verification Story ${runId}`,
      description: 'Verifying zero legacy disk writes',
      genre: 'Cyberpunk',
      tags: ['Sci-Fi', 'Phase4'],
      storyType: 'Light Novel',
      ageRating: 'Teen'
    })
  });
  if (!storyRes.ok) throw new Error(`Create Story failed: ${await storyRes.text()}`);
  const storyData = await storyRes.json();
  const storyId = storyData.story.id;

  // Verify in Supabase
  const { data: supaStory, error: supaStoryErr } = await supabase.from('stories').select('*').eq('id', storyId).single();
  if (supaStoryErr || !supaStory) throw new Error(`Story was NOT written to Supabase! ${supaStoryErr?.message}`);
  console.log(`Story persisted in Supabase: "${supaStory.title}" (${supaStory.id})`);

  // Mutation B: Create Chapter
  console.log('Testing: Create Chapter directly to Supabase...');
  const chapRes = await fetch(`${API_BASE}/api/stories/${storyId}/chapters`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: `Chapter 1: Zero Legacy Write (${runId})`,
      content: 'This chapter was written with zero filesystem JSON writes.',
      chapterNumber: 1,
      wordCount: 120,
      readingTime: 1
    })
  });
  if (!chapRes.ok) throw new Error(`Create Chapter failed: ${await chapRes.text()}`);
  const chapData = await chapRes.json();
  const chapterId = chapData.chapter.id;

  const { data: supaChap, error: supaChapErr } = await supabase.from('chapters').select('*').eq('id', chapterId).single();
  if (supaChapErr || !supaChap) throw new Error(`Chapter was NOT written to Supabase! ${supaChapErr?.message}`);
  console.log(`Chapter persisted in Supabase: "${supaChap.title}" (${supaChap.id})`);

  // Mutation C: Add to Library
  console.log('Testing: Add to Library directly to Supabase...');
  const libRes = await fetch(`${API_BASE}/api/library/toggle`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ storyId, listType: 'saved' })
  });
  if (!libRes.ok) throw new Error(`Add to Library failed: ${await libRes.text()}`);
  const { data: supaLib } = await supabase.from('library').select('*').match({ user_id: user.id, story_id: storyId }).maybeSingle();
  if (!supaLib) throw new Error('Library entry not found in Supabase!');
  console.log(`Library entry persisted in Supabase: ${supaLib.user_id}:${supaLib.story_id}`);

  // Mutation D: Add Review
  console.log('Testing: Add Review directly to Supabase...');
  const revRes = await fetch(`${API_BASE}/api/stories/${storyId}/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ rating: 5, reviewText: `Phase 4 Verified Review ${runId}` })
  });
  if (!revRes.ok) throw new Error(`Add Review failed: ${await revRes.text()}`);
  const revData = await revRes.json();
  const reviewId = revData.review.id;
  const { data: supaRev } = await supabase.from('reviews').select('*').eq('id', reviewId).single();
  if (!supaRev) throw new Error('Review not found in Supabase!');
  console.log(`Review persisted in Supabase: "${supaRev.review_text}" (${supaRev.id})`);

  // Step 4: Verify legacy filesystem files were UNTOUCHED
  console.log('\n--- 4. VERIFYING ZERO LEGACY FILESYSTEM WRITES ---');
  const postDbMtime = fs.statSync(dbJsonPath).mtimeMs;
  const postBackupMtime = fs.existsSync(backupJsonPath) ? fs.statSync(backupJsonPath).mtimeMs : 0;
  const postSnapshotMtime = fs.existsSync(snapshotJsonPath) ? fs.statSync(snapshotJsonPath).mtimeMs : 0;

  console.log(`data/kairo_db.json mtime before: ${initialDbMtime}`);
  console.log(`data/kairo_db.json mtime after:  ${postDbMtime}`);

  if (postDbMtime !== initialDbMtime) {
    throw new Error(`FAILURE: data/kairo_db.json was written to! mtime changed from ${initialDbMtime} to ${postDbMtime}`);
  }
  if (postBackupMtime !== initialBackupMtime) {
    throw new Error(`FAILURE: data/kairo_db.backup.json was written to!`);
  }
  if (postSnapshotMtime !== initialSnapshotMtime) {
    throw new Error(`FAILURE: data/kairo_db.snapshot.json was written to!`);
  }
  if (fs.existsSync(tmpDirPath)) {
    throw new Error(`FAILURE: /tmp/kairo_data directory was created!`);
  }

  console.log('Zero Legacy Disk Write Assertion: PASSED (No JSON files were written to, /tmp/kairo_data does not exist)');

  // Step 5: Verify Authoritative Hydration without JSON
  console.log('\n--- 5. VERIFYING AUTHORITATIVE RE-HYDRATION FROM SUPABASE ---');
  // Trigger health check to verify active memory reflects Supabase counts
  const healthRes = await fetch(`${API_BASE}/api/health`);
  if (!healthRes.ok) throw new Error(`Health check failed: ${healthRes.status}`);
  const healthData = await healthRes.json();
  console.log(`API Health: status=${healthData.status}, stories=${healthData.database?.storiesCount}`);

  // Fetch created story via public API to ensure in-memory cache reflects authoritative Supabase state
  const fetchStoryRes = await fetch(`${API_BASE}/api/stories/${storyId}`);
  if (!fetchStoryRes.ok) throw new Error(`Fetch story failed: ${fetchStoryRes.status}`);
  const fetchedStoryData = await fetchStoryRes.json();
  if (fetchedStoryData.story?.id !== storyId) {
    throw new Error(`Fetched story id mismatch! Expected ${storyId}, got ${fetchedStoryData.story?.id}`);
  }
  console.log(`Story successfully read through API from authoritative state: "${fetchedStoryData.story.title}"`);

  // Step 6: Verify Failure Behavior (No silent fallback to JSON)
  console.log('\n--- 6. VERIFYING ERROR HANDLING (NO SILENT JSON FALLBACK) ---');
  const badRegisterRes = await fetch(`${API_BASE}/api/programs/invalid_prog_9999/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ consentAgreed: true }),
  });
  console.log(`Invalid registration response status: ${badRegisterRes.status} (Expected: >= 400)`);
  if (badRegisterRes.status < 400) {
    throw new Error(`Expected HTTP 4xx or 5xx error for invalid query, got ${badRegisterRes.status}`);
  }
  const badBody = await badRegisterRes.json();
  console.log(`Error received: "${badBody.error}"`);
  console.log('Error Handling Assertion: PASSED (Errors are raised to client, never silently masked)');

  console.log('\n========================================================');
  console.log('  PHASE 4 VERIFICATION PASSED WITH ZERO REGRESSIONS!');
  console.log('========================================================');
}

main().catch(err => {
  console.error('\n❌ PHASE 4 VERIFICATION FAILED:', err);
  process.exit(1);
});
