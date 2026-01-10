# Test Halaqah API

## Check if halaqah data exists in database

Run this SQL query in Supabase SQL Editor:

```sql
-- Check total halaqah
SELECT COUNT(*) as total_halaqah FROM halaqah;

-- Check active halaqah
SELECT COUNT(*) as active_halaqah FROM halaqah WHERE status = 'active';

-- Show sample halaqah data
SELECT
  id,
  name,
  muallimah_id,
  day_of_week,
  start_time,
  end_time,
  status,
  max_students,
  preferred_juz
FROM halaqah
WHERE status = 'active'
ORDER BY day_of_week
LIMIT 10;

-- Check muallimah info for halaqah
SELECT
  h.id as halaqah_id,
  h.name as halaqah_name,
  h.muallimah_id,
  u.full_name as muallimah_name,
  u.email as muallimah_email
FROM halaqah h
LEFT JOIN users u ON u.id = h.muallimah_id
WHERE h.status = 'active'
LIMIT 10;
```

## Test API Endpoint

### Method 1: Using Browser Console

1. Login as thalibah
2. Open browser console (F12)
3. Run this code:

```javascript
fetch('/api/daftar-ulang/halaqah')
  .then(r => r.json())
  .then(data => {
    console.log('API Response:', data);
    console.log('Halaqah count:', data.data?.halaqah?.length || 0);
    if (data.data?.halaqah?.length > 0) {
      console.log('First halaqah:', data.data.halaqah[0]);
    }
  })
  .catch(err => console.error('API Error:', err));
```

### Method 2: Check Server Logs

After calling the API, check server logs for any errors related to:
- Auth validation
- Registration query
- Halaqah query
- Muallimah registrations query
- Data processing

## Common Issues

### Issue 1: No registration found
**Error**: `No valid registration found`
**Solution**: User must have a registration with `selection_status = 'selected'` in `pendaftaran_tikrar_tahfidz` table

### Issue 2: Empty halaqah array
**Causes**:
1. No halaqah with `status = 'active'` in database
2. Juz filtering: User's final_juz doesn't match any muallimah's preferred_juz
3. Foreign key issue: muallimah_id doesn't exist in users table

**Debug SQL**:
```sql
-- Find user's registration and final juz
SELECT
  user_id,
  chosen_juz,
  exam_score,
  CASE
    WHEN exam_score < 70 AND chosen_juz IN ('28A', '28B', '28') THEN '29A'
    WHEN exam_score < 70 AND chosen_juz IN ('1A', '1B', '29A', '29B', '29', '1') THEN '30A'
    ELSE chosen_juz
  END as final_juz
FROM pendaftaran_tikrar_tahfidz
WHERE user_id = 'USER_ID_HERE'
  AND selection_status = 'selected'
ORDER BY created_at DESC
LIMIT 1;

-- Find matching halaqah for this juz
SELECT
  h.id,
  h.name,
  h.status,
  h.preferred_juz,
  mr.preferred_juz as muallimah_preferred_juz
FROM halaqah h
LEFT JOIN muallimah_registrations mr ON mr.user_id = h.muallimah_id
WHERE h.status = 'active';
```

### Issue 3: RLS blocking access
**Check**: Run as authenticated user in SQL Editor

```sql
SELECT * FROM halaqah WHERE status = 'active';
```

If this returns empty but admin can see data, RLS is blocking.

**Solution**: Verify RLS policy exists:
```sql
SELECT * FROM pg_policies WHERE tablename = 'halaqah';
```

Should show policy: "Authenticated can view halaqah"
