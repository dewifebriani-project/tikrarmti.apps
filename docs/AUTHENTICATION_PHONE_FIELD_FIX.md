# Authentication Phone Field Fix

## Problem Summary

The application was experiencing two critical authentication errors:

1. **406 Not Acceptable Error**: When fetching user data with `select=*`, the query failed because the `phone` column didn't exist in the database table
2. **PGRST116 Error**: When users exist in Supabase Auth but not in the users table, the `.single()` method couldn't coerce 0 rows to a single JSON object

## Root Cause Analysis

1. The TypeScript schema definition in `lib/supabase.ts:16` includes a `phone` field
2. The actual database table was missing this column
3. `AuthContext.tsx` was using `select('*')` which included all columns, causing the 406 error
4. The User interface was using `id` but the AuthContext was using `uid` field names

## Implemented Fixes

### 1. Fixed AuthContext.tsx

**Changes made:**
- Changed from `select('*')` to `select('id, email, full_name, avatar_url, role, created_at, updated_at')` to avoid non-existent columns
- Fixed User object structure to use `id` instead of `uid` throughout
- Added proper handling for missing database profiles
- Fixed TypeScript errors by matching the User interface

**Key fixes:**
```typescript
// Before (causing 406 error)
.select('*')

// After (safe field selection)
.select('id, email, full_name, avatar_url, role, created_at, updated_at')
```

### 2. Created Database Migration Script

**File:** `scripts/fix_phone_column.sql`

This script safely adds the missing phone column:
- Checks if column exists before adding it
- Uses proper PostgreSQL DO block for conditional execution
- Includes verification query to confirm success

### 3. Fixed Type Mismatches

- Updated AuthContext to use `user.id` instead of `user.uid`
- Fixed User object creation to match the User interface
- Added all required fields (`is_active`, proper dates, etc.)

## How to Apply the Database Fix

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `scripts/fix_phone_column.sql`
4. Run the script

### Option 2: Using Supabase CLI
```bash
# If you have local Supabase running
npx supabase db push
```

### Option 3: Direct SQL Execution
```bash
# Using psql (if you have connection string)
psql "postgresql://[connection-string]" -f scripts/fix_phone_column.sql
```

## Verification Steps

1. **Check Database Schema**: Verify the phone column exists
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'users' AND column_name = 'phone';
   ```

2. **Test Authentication**: Try logging in and verify the errors are resolved

3. **Check Console**: Ensure no more 406 or PGRST116 errors in browser console

## Files Modified

- `contexts/AuthContext.tsx` - Fixed field selection and User object structure
- `scripts/fix_phone_column.sql` - Database migration script (new)
- `AUTHENTICATION_PHONE_FIELD_FIX.md` - This documentation (new)

## Expected Results

After applying these fixes:
- ✅ No more 406 errors when fetching user data
- ✅ Proper handling of users without database profiles
- ✅ Correct TypeScript type checking
- ✅ Phone field available in database (optional field)
- ✅ Authentication flow works smoothly

## Troubleshooting

If issues persist:

1. **Verify the migration ran successfully**
2. **Check Supabase RLS policies** for the users table
3. **Ensure environment variables** are correctly set
4. **Clear browser cache** and test again

## Notes

- The phone field is now optional and nullable in the database
- The AuthContext gracefully handles both scenarios (with/without database profile)
- All authentication flows should work without modifications to other parts of the application