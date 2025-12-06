# Juz Options Migration

## Overview
This migration creates a new `juz_options` table to store available juz choices with page ranges for the Tikrar MTI program.

## Database Schema

### Table: `juz_options`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| code | text | Unique code (e.g., '1A', '1B', '28A') |
| name | text | Display name with page range |
| juz_number | integer | Juz number (1, 28, 29, or 30) |
| part | text | Part 'A' or 'B' |
| start_page | integer | Starting page number |
| end_page | integer | Ending page number |
| total_pages | integer | Auto-calculated (end_page - start_page + 1) |
| is_active | boolean | Whether this option is active |
| sort_order | integer | Display order |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### Constraints
- `code` must be unique and match pattern `^[0-9]+[AB]$`
- `part` must be either 'A' or 'B'
- `start_page` must be <= `end_page`

### Indexes
- `idx_juz_options_code` - On `code` column
- `idx_juz_options_active` - On `is_active` column
- `idx_juz_options_sort_order` - On `sort_order` column

## Initial Data

The migration inserts 8 juz options:

1. **Juz 1A** - Halaman 1-11 (11 halaman)
2. **Juz 1B** - Halaman 12-21 (10 halaman)
3. **Juz 28A** - Halaman 542-551 (10 halaman)
4. **Juz 28B** - Halaman 552-561 (10 halaman)
5. **Juz 29A** - Halaman 562-571 (10 halaman)
6. **Juz 29B** - Halaman 572-581 (10 halaman)
7. **Juz 30A** - Halaman 582-591 (10 halaman)
8. **Juz 30B** - Halaman 592-604 (13 halaman)

## How to Apply

### Option 1: Via Supabase SQL Editor (Recommended)

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/nmbvklixthlqtkkgqnjl/sql)
2. Copy the contents of `scripts/create_juz_options_table.sql`
3. Paste and run the SQL

### Option 2: Via Script (Preview Only)

```bash
node scripts/apply_juz_options_migration.js
```

Note: This script will show the SQL but cannot execute DDL statements directly. You still need to run the SQL in Supabase SQL Editor.

## Frontend Updates

### Form Update
The registration form (`app/pendaftaran/tikrar-tahfidz/page.tsx`) has been updated to use the new juz options:

**Old Format:**
- Juz 30A (An-Naba' - Al-A'la)
- Juz 30B (Al-A'la - An-Nas)
- etc.

**New Format:**
- Juz 1A (Halaman 1-11)
- Juz 1B (Halaman 12-21)
- Juz 28A (Halaman 542-551)
- etc.

### TypeScript Interface

A new type definition is available at `types/juz-options.ts`:

```typescript
import { JuzOption, JUZ_OPTIONS } from '@/types/juz-options'

// Use in components
const juzOptions = JUZ_OPTIONS.filter(j => j.is_active)
```

### Updated Settings

The `BATCH_SETTINGS` in `lib/pendaftaran.ts` has been updated with the new juz format including page ranges.

## Verification

After applying the migration, verify by running:

```bash
node scripts/apply_juz_options_migration.js
```

This will show the current data in the `juz_options` table.

## Rollback

If you need to rollback this migration:

```sql
DROP TABLE IF EXISTS public.juz_options;
```

**Warning:** This will delete all juz options data.

## Notes

- The `total_pages` column is auto-calculated using a GENERATED column
- The `chosen_juz` field in `tikrar_tahfidz` table will now store values like '1A', '1B', '28A', etc.
- Old data with values like '30a', '30b' should be migrated to '30A', '30B' if needed
