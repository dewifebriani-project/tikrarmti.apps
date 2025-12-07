# Manual Fix for has_permission Column Type Issue

## Problem
The `has_permission` column in the `tikrar_tahfidz` table is defined as `boolean` type, but the application is trying to insert string values ('yes', 'janda', '').

## Solution
Run the following SQL in your Supabase SQL Editor:

### Step 1: Check current column type
```sql
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tikrar_tahfidz'
    AND table_schema = 'public'
    AND column_name = 'has_permission';
```

### Step 2: Fix the column type
```sql
-- Drop any existing constraint first
ALTER TABLE tikrar_tahfidz DROP CONSTRAINT IF EXISTS tikrar_tahfidz_has_permission_check;

-- Add a temporary text column
ALTER TABLE tikrar_tahfidz ADD COLUMN IF NOT EXISTS has_permission_new TEXT;

-- Convert existing boolean values to text
UPDATE tikrar_tahfidz
SET has_permission_new =
    CASE
        WHEN has_permission = true THEN 'yes'
        WHEN has_permission = false THEN ''
        ELSE ''
    END;

-- Drop the old boolean column
ALTER TABLE tikrar_tahfidz DROP COLUMN has_permission;

-- Rename the new column
ALTER TABLE tikrar_tahfidz RENAME COLUMN has_permission_new TO has_permission;

-- Add the correct check constraint
ALTER TABLE tikrar_tahfidz
ADD CONSTRAINT tikrar_tahfidz_has_permission_check CHECK (
    has_permission IN ('yes', 'janda', '')
);
```

### Step 3: Verify the fix
```sql
-- Verify the column type
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'tikrar_tahfidz'
    AND table_schema = 'public'
    AND column_name = 'has_permission';

-- Verify the constraint
SELECT
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'tikrar_tahfidz_has_permission_check';
```

## Important Notes
- This will convert all existing `true` values to 'yes'
- All existing `false` values will be converted to empty string ''
- If there's existing data with different values, they will be set to empty string
- The new constraint allows only: 'yes', 'janda', or '' (empty string)