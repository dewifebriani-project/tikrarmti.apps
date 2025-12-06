# Migration: Add Price Fields to Batches Table

## Overview
This migration adds pricing and quota-related fields to the `batches` table to support free/paid program management.

## Fields to Add
1. **is_free** (BOOLEAN) - Indicates if the program is free
2. **price** (DECIMAL(10,2)) - Program price in IDR
3. **total_quota** (INTEGER) - Maximum number of participants

## SQL Migration Script

### Step 1: Run in Supabase SQL Editor

Go to your Supabase project → SQL Editor → New Query, then run this SQL:

```sql
-- Add price-related fields to batches table
-- Run this in Supabase SQL Editor

-- Step 1: Add is_free column (default TRUE for free programs)
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT TRUE;

-- Step 2: Add price column (default 0 for free programs)
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;

-- Step 3: Add total_quota column for maximum participants
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS total_quota INTEGER DEFAULT 100;

-- Step 4: Update existing batch to be free with 100 quota
UPDATE public.batches
SET
  is_free = TRUE,
  price = 0,
  total_quota = 100
WHERE name = 'Tikrar MTI Batch 2';

-- Step 5: Verify the update
SELECT
  id,
  name,
  is_free,
  price,
  total_quota,
  duration_weeks,
  start_date,
  end_date,
  status
FROM public.batches
WHERE name = 'Tikrar MTI Batch 2';
```

### Step 2: Verify Migration

After running the SQL above, you should see output like:

```
| name                  | is_free | price | total_quota | duration_weeks |
|-----------------------|---------|-------|-------------|----------------|
| Tikrar MTI Batch 2    | true    | 0.00  | 100         | 13             |
```

### Step 3: Update TypeScript Types

Update `types/database.ts` to include new fields:

```typescript
export interface Batch {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  status: BatchStatus;
  duration_weeks: number;

  // New fields
  is_free: boolean;
  price: number;
  total_quota: number;

  created_at: string;
  updated_at: string;
}
```

## Alternative: Manual Update via Supabase Dashboard

If you prefer using the Supabase Dashboard:

1. Go to **Table Editor** → **batches** table
2. Click **Add Column** for each field:
   - **is_free**: Type = `boolean`, Default = `true`
   - **price**: Type = `numeric`, Default = `0`
   - **total_quota**: Type = `int4`, Default = `100`
3. Edit the "Tikrar MTI Batch 2" row and set:
   - is_free = `true`
   - price = `0`
   - total_quota = `100`

## Testing

After migration, test the API endpoint:

```bash
curl http://localhost:3003/api/batch/default
```

Expected response:
```json
{
  "batch_id": "...",
  "batch_name": "Tikrar MTI Batch 2",
  "is_free": true,
  "price": 0,
  "total_quota": 100,
  "registered_count": 0,
  "scholarship_quota": 100,
  ...
}
```

## Rollback (if needed)

```sql
ALTER TABLE public.batches DROP COLUMN IF EXISTS is_free;
ALTER TABLE public.batches DROP COLUMN IF EXISTS price;
ALTER TABLE public.batches DROP COLUMN IF EXISTS total_quota;
```

## Notes

- The migration is designed to be **idempotent** (safe to run multiple times)
- Default values ensure existing batches remain free
- **Program Tikrar MTI Batch 2 is FREE** (is_free=true, price=0)
