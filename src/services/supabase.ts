import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isClientSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isClientSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface SupabaseServerStatus {
  configured: boolean;
  connectionStatus: string;
  schemaReady?: boolean;
  schemaReason?: string;
  target: string;
  supabaseUrlConfigured: boolean;
  anonKeyConfigured: boolean;
  serviceRoleConfigured: boolean;
  tablesDiscovered: Record<string, number>;
  remoteRecordsCount: number;
  lastMigration: any;
  localData: {
    status: string;
    storiesCount: number;
    chaptersCount: number;
    charactersCount: number;
    usersCount: number;
    reviewsCount: number;
    readingProgressCount: number;
  };
  message: string;
}

export async function fetchSupabaseStatus(): Promise<SupabaseServerStatus | null> {
  try {
    const res = await fetch('/api/admin/supabase/status');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[Supabase Status] Failed to fetch server status:', err);
    return null;
  }
}

export async function fetchSupabaseSqlMigration(): Promise<{ success: boolean; sql: string; filename?: string }> {
  try {
    const res = await fetch('/api/admin/supabase/sql');
    if (!res.ok) return { success: false, sql: '' };
    return await res.json();
  } catch (err) {
    return { success: false, sql: '' };
  }
}

export async function triggerSupabaseMigration(): Promise<{ success: boolean; message: string; migrationResult?: any }> {
  const token = localStorage.getItem('kairo_auth_token');
  const res = await fetch('/api/admin/supabase/migrate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return await res.json();
}
