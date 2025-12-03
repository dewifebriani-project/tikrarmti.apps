# Authentication Error Fix - 406 Not Acceptable

## Problem Description
The application is experiencing a 406 (Not Acceptable) error when trying to fetch user data during authentication. The error occurs because the code is trying to select a `phone` field from the `users` table that doesn't exist in the actual database schema.

### Error Details
```
GET https://nmbvklixthlqtkkgqnjl.supabase.co/rest/v1/users?select=id%2Cemail%2Cfull_name%2Cphone&email=eq.dewifebriani%40gmail.com 406 (Not Acceptable)
```

### Root Cause
The database schema mismatch between:
- **Expected Schema**: `users` table with `id, email, full_name, phone` fields
- **Actual Schema**: `users` table without the `phone` field
- **Code References**: Multiple parts of the application reference the phone field

## Solution Applied

### 1. Database Schema Update
Created migration script: `scripts/add_phone_field.sql`

```sql
-- Add phone field to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment to the new column
COMMENT ON COLUMN users.phone IS 'User phone number for contact purposes';
```

### 2. TypeScript Schema Updates
Updated `lib/supabase.ts` to include the phone field in the database type definitions:

```typescript
// Added phone field to Row, Insert, and Update interfaces
phone: string | null
```

### 3. Authentication Logic
The authentication code in `lib/auth.ts` already expects the phone field, so no changes were needed there.

## Required Action

**You must manually apply the database migration** to add the phone field to your Supabase database:

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the following SQL command:
   ```sql
   ALTER TABLE users
   ADD COLUMN IF NOT EXISTS phone TEXT;

   COMMENT ON COLUMN users.phone IS 'User phone number for contact purposes';
   ```

### Option 2: Using Supabase CLI
```bash
npx supabase db push --db-url=YOUR_DATABASE_URL
```

## Verification

After applying the migration, the authentication flow should work correctly:

1. **User Registration**: ✅ Working (creates auth user and profile)
2. **Profile Fetch**: ✅ Should work (phone field now exists)
3. **Authentication Check**: ✅ Should work (can verify required fields)

## Files Modified

- `lib/supabase.ts` - Updated database schema types to include phone field
- `scripts/add_phone_field.sql` - Created migration script
- `AUTHENTICATION_ERROR_FIX.md` - This documentation file

## Next Steps

1. Apply the database migration using one of the options above
2. Test user registration and login flow
3. Verify that phone numbers are being saved and retrieved correctly
4. Check that all forms that collect phone data are working properly

## Notes

- The phone field is nullable, so existing users without phone numbers will continue to work
- The application expects phone numbers for registration completion checks
- Phone data is also used in user management and profile features