# RLS Policies Summary

This document summarizes the Row Level Security (RLS) policies in place for Tikrarmti Apps.

## Principle

**RLS is the single source of truth for authorization.** All data access control is enforced at the database level via RLS policies. Server-side code should not duplicate authorization logic.

## Tables with RLS Enabled

### users
- **Users can view own profile:** `auth.uid() = id`
- **Users can update own profile:** `auth.uid() = id`
- **Admins/staff can view all users:** role IN ('admin', 'super_admin', 'musyrifah', 'muallimah')
- **Admins can manage all users:** role IN ('admin', 'super_admin')

### pendaftaran_tikrar_tahfidz
- **Users can view own registrations:** `auth.uid() = thalibah_id`
- **Users can create own registrations:** `auth.uid() = thalibah_id`
- **Users can update own registrations:** `auth.uid() = thalibah_id`
- **Admins/staff can view all:** role IN ('admin', 'musyrifah', 'muallimah')
- **Admins can manage all:** role IN ('admin')

### selection_audios (Storage)
- **Users can upload own audio:** `auth.uid() = thalibah_id`
- **Users can view own audio:** `auth.uid() = thalibah_id`
- **Users can delete own audio:** `auth.uid() = thalibah_id`
- **Admins/staff full access:** role IN ('admin', 'musyrifah')

## Security Checklist

When adding new tables with user data:

1. [ ] Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. [ ] Add user policy: Users can access their own data (`auth.uid() = user_id`)
3. [ ] Add admin policy: Admins can access all data
4. [ ] Test policies: Verify from different user contexts
5. [ ] No bypass: Ensure no service role usage in client-facing code

## Testing RLS

To test RLS policies:

```sql
-- Test as specific user
SET LOCAL request.jwt.claim.sub = 'user-id-here';
SELECT * FROM users; -- Should only return user's own row

-- Test as admin
SET LOCAL request.jwt.claim.sub = 'admin-id-here';
SELECT * FROM users; -- Should return all rows
```

## Important Notes

- **Never disable RLS** for convenience
- **Never use service role key** in client-facing code
- **Always test RLS** after adding new policies
- **Pre-check in server code** is for UX only, not security
