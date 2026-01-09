# Manual Migration Instructions

## Issue: Failed to load halaqah availability

The `analyze_halaqah_availability_by_juz` SQL function needs to be updated to fix the capacity analysis feature.

## Solution Options

### Option 1: Apply via Supabase SQL Editor (Recommended)

1. Go to https://app.supabase.com
2. Select your project: `nmbvklixthlqtkkgqnjl`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the SQL from `supabase/migrations/20260109_update_halaqah_capacity_analysis.sql`
6. Click **Run** to execute the migration

### Option 2: Apply via psql CLI

If you have the `DATABASE_URL` connection string:

```bash
# Set your DATABASE_URL (get from Supabase dashboard > Settings > Database)
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.nmbvklixthlqtkkgqnjl.supabase.co:5432/postgres"

# Apply the migration
psql $DATABASE_URL -f supabase/migrations/20260109_update_halaqah_capacity_analysis.sql
```

### Option 3: Apply via Supabase CLI

```bash
# Link your project (if not already linked)
supabase link --project-ref nmbvklixthlqtkkgqnjl

# Push the migration
supabase db push
```

## Verification

After applying the migration, verify it worked by checking the Analysis tab in the admin panel or testing the API:

```bash
curl "https://markaztikrar.id/api/admin/analysis/halaqah-availability?batch_id=[YOUR-BATCH-ID]"
```

## What This Migration Does

This migration updates the `analyze_halaqah_availability_by_juz` function to:

1. **Count students correctly** from both `halaqah_students` and `daftar_ulang_submissions` tables
2. **Calculate capacity metrics** per juz:
   - Total thalibah requesting each juz
   - Total halaqah available
   - Total capacity and filled slots
   - Available slots remaining
3. **Determine if more halaqah are needed** based on minimum 5 thalibah per halaqah
4. **Provide detailed halaqah information** including:
   - Schedule (day of week, start/end time)
   - Current student count
   - Available slots
   - Utilization percentage

## Key Changes from Previous Version

- Uses Common Table Expressions (CTEs) for better query organization
- Properly handles double-counting in tashih_ujian classes
- Calculates needed_halaqah using: `CEIL((total_thalibah - total_available) / 5)`
- Returns detailed halaqah information as JSONB for frontend display

## Troubleshooting

If you still see "Failed to load halaqah availability" after applying the migration:

1. Check the browser console for specific error messages
2. Verify the function exists: `SELECT * FROM pg_proc WHERE proname = 'analyze_halaqah_availability_by_juz'`
3. Check the API logs in Vercel dashboard
4. Ensure you're using a valid batch_id parameter

## Files Modified

- `supabase/migrations/20260109_update_halaqah_capacity_analysis.sql` - SQL function definition
- `components/AnalysisTab.tsx` - Frontend display (updated in previous commit)
- `app/api/admin/analysis/halaqah-availability/route.ts` - API endpoint (already correct)
