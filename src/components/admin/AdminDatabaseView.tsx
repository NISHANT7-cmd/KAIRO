import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, 
  ArrowUpRight, Download, Server, HardDrive, Clock, Trash2, Undo2, Lock,
  AlertTriangle, Copy, Code2, Check
} from 'lucide-react';
import { fetchSupabaseStatus, triggerSupabaseMigration, fetchSupabaseSqlMigration, SupabaseServerStatus } from '../../services/supabase';
import { api } from '../../services/api';
import { DeletedStoryRecord } from '../../types';

export const AdminDatabaseView: React.FC = () => {
  const [status, setStatus] = useState<SupabaseServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // SQL script state
  const [sqlContent, setSqlContent] = useState<string>('');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [fetchingSql, setFetchingSql] = useState(false);

  // Trash bin state
  const [trashStories, setTrashStories] = useState<(DeletedStoryRecord & { daysLeft: number })[]>([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupabaseStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch database status');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySql = async () => {
    setFetchingSql(true);
    try {
      let sql = sqlContent;
      if (!sql) {
        const res = await fetchSupabaseSqlMigration();
        if (res.success && res.sql) {
          sql = res.sql;
          setSqlContent(sql);
        }
      }
      if (sql) {
        await navigator.clipboard.writeText(sql);
        setCopiedSql(true);
        setSuccessMsg('SQL migration script copied to clipboard! Paste it into your Supabase SQL Editor and click Run.');
        setTimeout(() => setCopiedSql(false), 4000);
      } else {
        setError('Could not retrieve SQL script. Please check server logs.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to copy SQL script');
    } finally {
      setFetchingSql(false);
    }
  };

  const loadTrash = async () => {
    setLoadingTrash(true);
    try {
      const res = await api.getRecentlyDeletedStories();
      setTrashStories(res.trash || []);
    } catch (err) {
      console.warn('Failed to load trash stories:', err);
    } finally {
      setLoadingTrash(false);
    }
  };

  useEffect(() => {
    loadStatus();
    loadTrash();
  }, []);

  const handleMigrate = async () => {
    if (!window.confirm('Execute safe idempotent Supabase migration? Existing data will be safely upserted without loss or overwriting.')) {
      return;
    }
    setMigrating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await triggerSupabaseMigration();
      if (res.success) {
        setSuccessMsg(res.message || 'Migration successfully completed!');
        setMigrationResult(res.migrationResult);
        await loadStatus();
      } else {
        setError(res.message || 'Migration returned warnings or errors');
        setMigrationResult(res.migrationResult);
      }
    } catch (err: any) {
      setError(err.message || 'Migration request failed');
    } finally {
      setMigrating(false);
    }
  };

  const handleExportBackup = () => {
    window.open('/api/admin/db/export', '_blank');
  };

  const handleRestoreStory = async (storyId: string) => {
    setActionLoading(`restore_${storyId}`);
    try {
      const res = await api.restoreRecentlyDeletedStory(storyId);
      if (res.success) {
        setSuccessMsg(`Story "${res.story?.title}" has been restored to active status.`);
        await loadTrash();
        await loadStatus();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to restore story');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (storyId: string) => {
    if (!window.confirm('Permanently delete this story? This cannot be undone.')) return;
    setActionLoading(`delete_${storyId}`);
    try {
      const res = await api.permanentlyDeleteTrashStory(storyId);
      if (res.success) {
        setSuccessMsg('Story permanently deleted.');
        await loadTrash();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete story');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-bold text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs font-bold">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-bold text-rose-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Supabase Connection Status Card */}
      <div className="bg-gradient-to-br from-white via-pink-50/40 to-white rounded-3xl p-6 sm:p-8 border border-pink-200/90 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-pink-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#9e3b5f]/10 border border-[#9e3b5f]/20 flex items-center justify-center text-[#9e3b5f] shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-black font-display text-[#26152b]">
                  Supabase Permanent Data Source
                </h2>
                {status?.configured ? (
                  status?.schemaReady ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Supabase Synced & Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Connected • Schema Pending
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                    <span className="w-2 h-2 rounded-full bg-neutral-400" />
                    Safe Local Fallback Active
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#544246] max-w-2xl font-medium">
                {status?.message || 'Inspecting database health and cloud PostgreSQL synchronization.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={loadStatus}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-xs font-bold text-[#544246] flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="px-4 py-2 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-xs font-bold text-[#544246] flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              title="Download JSON copy of current production state"
            >
              <Download className="w-3.5 h-3.5 text-[#9e3b5f]" />
              <span>Download Backup JSON</span>
            </button>

            {status?.configured && (
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9e3b5f] to-[#d94b76] hover:from-[#882e50] hover:to-[#be3c63] text-xs font-bold text-white shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Server className={`w-3.5 h-3.5 ${migrating ? 'animate-spin' : ''}`} />
                <span>{migrating ? 'Migrating Data...' : 'Run Supabase Sync'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Schema Setup Callout Banner if tables need initialization */}
        {status?.configured && !status?.schemaReady && (
          <div className="mt-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-950">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    Step 1: Execute SQL Schema Migration in Supabase
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 max-w-2xl leading-relaxed">
                    Your Supabase credentials are valid and connected! Before data can sync, create the PostgreSQL tables by copying our schema script into your Supabase Dashboard &gt; SQL Editor and clicking <strong>Run</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopySql}
                  disabled={fetchingSql}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                </button>
                <button
                  onClick={() => setShowSqlModal(!showSqlModal)}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-amber-100/50 border border-amber-300 text-amber-900 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{showSqlModal ? 'Hide SQL' : 'View SQL'}</span>
                </button>
              </div>
            </div>

            {showSqlModal && (
              <div className="mt-4 pt-4 border-t border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">supabase/migrations/001_initial_schema.sql</span>
                  <button
                    onClick={handleCopySql}
                    className="text-xs text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                  >
                    {copiedSql ? '✓ Copied' : 'Copy entire script'}
                  </button>
                </div>
                <pre className="max-h-60 overflow-y-auto p-3 rounded-xl bg-neutral-900 text-neutral-100 text-[11px] font-mono whitespace-pre selection:bg-amber-500 selection:text-black">
                  {sqlContent || 'Click "Copy SQL Script" or loading...'}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Database Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <div className="bg-white p-3.5 rounded-xl border border-pink-100 shadow-2xs">
            <div className="text-[10px] font-bold text-[#877276] uppercase tracking-wider">Stories Stored</div>
            <div className="text-xl font-black text-[#26152b] mt-1">{status?.localData?.storiesCount ?? '—'}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Permanent Records</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-pink-100 shadow-2xs">
            <div className="text-[10px] font-bold text-[#877276] uppercase tracking-wider">Chapters Stored</div>
            <div className="text-xl font-black text-[#26152b] mt-1">{status?.localData?.chaptersCount ?? '—'}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Manuscript Drafts</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-pink-100 shadow-2xs">
            <div className="text-[10px] font-bold text-[#877276] uppercase tracking-wider">Characters Stored</div>
            <div className="text-xl font-black text-[#26152b] mt-1">{status?.localData?.charactersCount ?? '—'}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Lore Profiles</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-pink-100 shadow-2xs">
            <div className="text-[10px] font-bold text-[#877276] uppercase tracking-wider">User Profiles</div>
            <div className="text-xl font-black text-[#26152b] mt-1">{status?.localData?.usersCount ?? '—'}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Accounts & Roles</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-pink-100 shadow-2xs">
            <div className="text-[10px] font-bold text-[#877276] uppercase tracking-wider">Reading History</div>
            <div className="text-xl font-black text-[#26152b] mt-1">{status?.localData?.readingProgressCount ?? '—'}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Progress Saved</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-pink-100 shadow-2xs">
            <div className="text-[10px] font-bold text-[#877276] uppercase tracking-wider">Trash Bin</div>
            <div className="text-xl font-black text-[#26152b] mt-1">{trashStories.length}</div>
            <div className="text-[10px] text-amber-600 font-semibold mt-0.5">30-Day Recovery</div>
          </div>
        </div>
      </div>

      {/* Migration Details if performed */}
      {migrationResult && (
        <div className="bg-white rounded-3xl p-6 border border-pink-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-[#26152b]">Latest Migration Report</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-pink-50/50 p-3 rounded-xl border border-pink-100">
              <span className="text-[#877276] block">Records Processed</span>
              <strong className="text-base text-[#26152b]">{migrationResult.recordsProcessed || 0}</strong>
            </div>
            <div className="bg-pink-50/50 p-3 rounded-xl border border-pink-100">
              <span className="text-[#877276] block">Records Failed</span>
              <strong className="text-base text-[#26152b]">{migrationResult.recordsFailed || 0}</strong>
            </div>
            <div className="bg-pink-50/50 p-3 rounded-xl border border-pink-100">
              <span className="text-[#877276] block">Migration Version</span>
              <strong className="text-base text-[#26152b]">{migrationResult.version || '1.0.0'}</strong>
            </div>
            <div className="bg-pink-50/50 p-3 rounded-xl border border-pink-100">
              <span className="text-[#877276] block">Status</span>
              <strong className="text-base text-emerald-600">{migrationResult.success ? 'SUCCESS' : 'COMPLETED WITH WARNINGS'}</strong>
            </div>
          </div>
          {migrationResult.summary && (
            <div className="p-3 bg-[#26152b] text-pink-100 rounded-xl font-mono text-[11px] overflow-x-auto">
              <pre>{JSON.stringify(migrationResult.summary, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* 30-Day Recently Deleted Stories (Trash Bin) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black font-display text-lg text-[#26152b]">
                Recently Deleted Stories (30-Day Auto-Retention)
              </h3>
              <p className="text-xs text-[#544246]">
                Stories deleted by writers from the Creator Studio are safely preserved here for 30 days and can be recovered with a single click.
              </p>
            </div>
          </div>

          <button
            onClick={loadTrash}
            disabled={loadingTrash}
            className="px-3 py-1.5 rounded-xl border border-pink-200 text-xs font-bold text-[#544246] hover:bg-pink-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingTrash ? 'animate-spin' : ''}`} />
            <span>Refresh Trash</span>
          </button>
        </div>

        {trashStories.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#877276] bg-pink-50/30 rounded-2xl border border-dashed border-pink-200">
            No stories currently in the recently deleted folder.
          </div>
        ) : (
          <div className="space-y-3">
            {trashStories.map(item => (
              <div 
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-pink-200 shadow-2xs hover:border-pink-300 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={item.story?.coverImage || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80'}
                    alt={item.story?.title}
                    className="w-12 h-16 object-cover rounded-xl border border-pink-100 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-[#26152b]">{item.story?.title || 'Untitled Story'}</h4>
                    <div className="text-xs text-[#877276] mt-0.5">
                      By {item.story?.authorDisplayName || 'Author'} (@{item.story?.authorUsername || 'author'})
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                        {item.daysLeft} days left before permanent deletion
                      </span>
                      <span className="text-[10px] text-[#877276]">
                        Deleted on {new Date(item.deletedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRestoreStory(item.id)}
                    disabled={actionLoading === `restore_${item.id}`}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Restore Story</span>
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(item.id)}
                    disabled={actionLoading === `delete_${item.id}`}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanent Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supabase Architecture & Deployment Guide */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#9e3b5f] flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black font-display text-lg text-[#26152b]">
              Permanent Data Architecture: "Code is Replaceable. Data is Permanent."
            </h3>
            <p className="text-xs text-[#544246]">
              How KAIRO guarantees user activity, manuscript progress, and reading history never get erased across deployments.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100 space-y-2">
            <div className="font-bold text-[#26152b] flex items-center gap-1.5 text-sm">
              <Server className="w-4 h-4 text-[#9e3b5f]" />
              <span>1. Supabase PostgreSQL</span>
            </div>
            <p className="text-[#544246] leading-relaxed">
              All tables, relations, foreign keys, and indexes are defined in <code className="text-[11px] bg-white px-1 py-0.5 rounded border border-pink-200">/supabase/migrations/</code>. Data persists independently of any web server or Vercel container.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100 space-y-2">
            <div className="font-bold text-[#26152b] flex items-center gap-1.5 text-sm">
              <HardDrive className="w-4 h-4 text-[#9e3b5f]" />
              <span>2. Zero-Loss Migration</span>
            </div>
            <p className="text-[#544246] leading-relaxed">
              The migration logic uses PostgreSQL upserts (<code className="text-[11px] bg-white px-1 py-0.5 rounded border border-pink-200">ON CONFLICT (id) DO UPDATE</code>). Existing users and stories retain their IDs, timestamps, and relations.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100 space-y-2">
            <div className="font-bold text-[#26152b] flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-[#9e3b5f]" />
              <span>3. Automatic Dual Sync</span>
            </div>
            <p className="text-[#544246] leading-relaxed">
              Every save commits immediately to memory/disk and triggers a debounced sync to Supabase. When deployed to Vercel with credentials, it automatically connects as the single source of truth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
