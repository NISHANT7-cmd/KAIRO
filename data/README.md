# KAIRO LEGACY DATA ARCHIVE
// LEGACY ARCHIVE — DO NOT WRITE — READ-ONLY ARTIFACT

## Authoritative Database Architecture
As of Phase 4, **Supabase PostgreSQL** is the sole authoritative production persistence engine for the KAIRO platform.

The files in this directory:
- `kairo_db.json`
- `kairo_db.backup.json`
- `kairo_db.snapshot.json`
- `kairo_db_pre_supabase_backup.json`

are **frozen historical migration artifacts and backup snapshots**.

### Invariants:
1. No production writes, updates, or mutations are permitted to write to these files.
2. The server application does not rely on these files for runtime state when Supabase credentials are configured.
3. These files are preserved for historical audit and disaster-recovery reference only.
