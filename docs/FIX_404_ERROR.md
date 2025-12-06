# Fix 404 Error - Batch API Endpoint

## Problem Summary

The `/api/batch/default` endpoint was returning a 404 error when accessed from the registration form.

## Root Causes

1. **API Status Mismatch**: The API was looking for batch with status `'active'`, but the database constraint only allows: `'draft'`, `'open'`, `'closed'`, `'archived'`
2. **Program Name Mismatch**: The API was looking for program named `'Tikrar Tahfidz'`, but the database had `'Tahfidz'`
3. **Missing Database Columns**: The batch table was missing `is_free`, `price`, and `total_quota` columns

## Solutions Applied

### 1. Database Migration

Added missing columns to the `batches` table:

```sql
-- Add is_free column (default: true for free programs)
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT TRUE;

-- Add price column (default: 0 for free programs)
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;

-- Add total_quota column (default: 100 participants)
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS total_quota INTEGER DEFAULT 100;

-- Update existing batch
UPDATE batches
SET is_free = TRUE, price = 0, total_quota = 100
WHERE name = 'Tikrar MTI Batch 2';
```

### 2. API Code Fix

Updated `app/api/batch/default/route.ts`:

**Changes Made:**
- Changed status check from `.eq('status', 'active')` to `.in('status', ['open', 'active'])`
- Changed program name from `'Tikrar Tahfidz'` to `'Tahfidz'`
- Added fallback values for missing columns:
  ```typescript
  const is_free = batch.is_free ?? true
  const price = batch.price ?? 0
  const total_quota = batch.total_quota ?? 100
  ```

### 3. Database Setup

Ensured the following data exists:

**Batch: "Tikrar MTI Batch 2"**
- ID: `2478b493-1b6b-412a-a05f-6193db815a43`
- Status: `open`
- Duration: 13 weeks
- Start Date: 2025-01-05
- End Date: 2025-04-05
- Is Free: `true`
- Price: `0`
- Total Quota: `100`

**Program: "Tahfidz"**
- ID: `1632e980-fcd9-4a1f-bc85-c9fbf8bb1142`
- Status: `open`

## Testing

Verified the fix with test script `scripts/final_test.js`:

```bash
node scripts/final_test.js
```

**Expected Response:**
```json
{
  "batch_id": "2478b493-1b6b-412a-a05f-6193db815a43",
  "batch_name": "Tikrar MTI Batch 2",
  "program_id": "1632e980-fcd9-4a1f-bc85-c9fbf8bb1142",
  "program_name": "Tahfidz",
  "start_date": "2025-01-05",
  "end_date": "2025-04-05",
  "duration_weeks": 13,
  "price": 0,
  "is_free": true,
  "total_quota": 100,
  "registered_count": 0,
  "scholarship_quota": 100
}
```

## Deployment

```bash
git add app/api/batch/default/route.ts
git commit -m "Fix 404 error: Update batch API to support 'open' status and use correct program name"
git push
vercel --prod
```

## Files Changed

1. `app/api/batch/default/route.ts` - Fixed API logic
2. Database - Added missing columns and data

## Scripts Created

1. `scripts/run_migration.js` - Check batch structure
2. `scripts/check_and_fix_program.js` - Verify program exists
3. `scripts/final_test.js` - Test API functionality
4. `scripts/add_price_fields_to_batches.sql` - SQL migration file

## Production URLs

- Latest: https://tikrarmtiapps-alobzz5ce-dewifebriani-projects.vercel.app
- Previous: https://tikrarmtiapps-3cjie4meb-dewifebriani-projects.vercel.app

## Status

✅ **RESOLVED** - The 404 error has been fixed and the API endpoint is now working correctly.

## Next Steps (Optional)

1. Update database constraints to allow 'active' status if needed
2. Consider renaming program back to 'Tikrar Tahfidz' for clarity
3. Add migration versioning system for future schema changes
