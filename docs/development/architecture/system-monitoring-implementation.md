# System Monitoring Implementation Summary

**Date:** 2026-01-06
**Version:** 1.0.0

## Overview

Comprehensive error logging and monitoring system for tracking authentication failures and system errors, specifically focusing on `supabase.auth.getUser()` failures.

---

## Architecture

```
Error Occurs
     ↓
logError(error, context)
     ↓
├─→ Sentry (if configured & !development)
└─→ system_logs table (database)
     ↓
Admin Dashboard (System Logs Tab)
```

---

## Files Created

### 1. Database Migration
**File:** `supabase/migrations/20260106_create_system_logs_table.sql`

Table: `system_logs`
- Auto-detection flags: `is_supabase_getuser_error`, `is_auth_error`
- Columns: error_message, error_stack, context, user_id, severity, error_type, etc.
- Indexes for performance: created_at, severity, error_type, is_auth_error, is_supabase_getuser_error
- RLS: Admin-only read access
- Helper function: `log_system_error()`
- Cleanup function: `cleanup_old_system_logs()` (90-day retention)

### 2. Logger Library
**File:** `lib/logger.ts` (updated)

Main Functions:
- `logError(error, context)` - Main logging function
- `logAuthGetUserError(error, context)` - Convenience for getUser() errors
- `logDatabaseError(error, context)` - Convenience for DB errors
- `logValidationError(error, context)` - Convenience for validation errors

Features:
- Auto-detects error type (auth, database, validation, network)
- Auto-detects `supabase.auth.getUser()` failures
- Sends to Sentry + database simultaneously
- Returns `{ sentryId, dbId }` for cross-referencing

### 3. Server Actions
**File:** `app/(protected)/admin/actions.ts` (updated)

Updated Functions:
- `verifyAdmin()` - Logs auth failures
- `createUser()` - Try-catch with logError
- `updateUser()` - Try-catch with logError
- `deleteUser()` - Try-catch with logError
- `bulkUpdateUsers()` - Try-catch with logError

New Functions:
- `getSystemLogs(filter)` - Fetch logs with admin validation
- `getSystemLogsStats(filter)` - Fetch statistics with admin validation

### 4. Admin UI Component
**File:** `components/SystemLogsTab.tsx` (new)

Features:
- Quick filters: Auth Errors, getUser() Errors
- Advanced filters: Severity, Error Type, Date Range
- Search by error message, function, or path
- Statistics cards: Total, Auth Errors, getUser() Errors
- Expandable rows with stack trace and context
- Pagination (20 per page)
- Sentry event ID cross-referencing

### 5. Admin Page Integration
**File:** `app/(protected)/admin/page.tsx` (updated)

Changes:
- Added `'system-logs'` to TabType
- Added System Logs tab to tabs array
- Imported SystemLogsTab component
- Added tab rendering with isActive prop

### 6. Documentation
**File:** `tikrarmti.docs/SENTRY_FILTERING_GUIDE.md` (new)

Contents:
- Sentry search queries for getUser() errors
- Alert configuration recommendations
- Dashboard widget setup
- Cross-reference workflow
- Best practices and troubleshooting

---

## Database Schema

```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  error_message TEXT,
  error_name TEXT,
  error_stack TEXT,
  context JSONB,
  user_id UUID,
  user_email TEXT,
  user_role TEXT[],
  request_path TEXT,
  request_method TEXT,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT CHECK (severity IN ('DEBUG','INFO','WARN','ERROR','FATAL')),
  error_type TEXT CHECK (error_type IN ('runtime','auth','database','validation','network','unknown')),
  is_auth_error BOOLEAN,
  is_supabase_getuser_error BOOLEAN,
  environment TEXT,
  release_version TEXT,
  sentry_event_id TEXT,
  sentry_sent BOOLEAN
);
```

---

## Usage Examples

### Basic Error Logging

```typescript
import { logError } from '@/lib/logger'

try {
  await someOperation()
} catch (error) {
  await logError(error, {
    function: 'someOperation',
    requestPath: '/api/endpoint',
    errorType: 'database',
  })
}
```

### Logging getUser() Errors

```typescript
import { logAuthGetUserError } from '@/lib/logger'

const { data: { user }, error } = await supabase.auth.getUser()

if (error || !user) {
  await logAuthGetUserError(error || new Error('No user'), {
    function: 'myProtectedAction',
    requestPath: '/api/admin/action',
  })
  throw new Error('Unauthorized')
}
```

### Using in Server Actions

```typescript
'use server'

import { logError, LogErrorContext } from '@/lib/logger'
import { verifyAdmin } from './actions'

export async function myAction() {
  try {
    const { user } = await verifyAdmin()
    // ... action logic
  } catch (error) {
    await logError(error, {
      function: 'myAction',
      errorType: 'runtime',
    } as LogErrorContext)
    throw error
  }
}
```

---

## Security Model

### Admin Role Validation
All Server Actions that access system logs MUST:
1. Call `verifyAdmin()` first
2. Verify `supabase.auth.getUser()` succeeds
3. Verify user has `'admin'` role in database
4. Log any auth failures

### RLS Policies
```sql
-- Admins can view all logs
CREATE POLICY "Admins can view all system_logs"
ON system_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND 'admin' = ANY(users.role)
  )
);

-- Service role can insert/update/delete
CREATE POLICY "Service role can manage system_logs"
ON system_logs FOR ALL
TO service_role
WITH CHECK (true);
```

---

## Admin Dashboard Features

### System Logs Tab

**Quick Filters:**
- Auth Errors - Shows all authentication-related failures
- getUser() Errors - Shows `supabase.auth.getUser()` specific failures

**Advanced Filters:**
- Severity: DEBUG, INFO, WARN, ERROR, FATAL
- Error Type: runtime, auth, database, validation, network
- Date Range: Start/End datetime
- User ID: Filter by specific user
- Search: Error message, function name, or request path

**Statistics Cards:**
- Total Logs
- Auth Errors count
- getUser() Errors count
- Error Types count

**Per-Log Details:**
- Timestamp (relative time)
- Severity badge
- Error type with icon
- Error message (truncated)
- User email
- Flags (Auth, getUser)
- Expandable for: stack trace, context JSON, request info, Sentry link

---

## Sentry Integration

### Automatic Tags
- `errorType`: runtime, auth, database, validation, network
- `function`: Function name where error occurred
- `requestPath`: API route or page path

### Recommended Sentry Queries

All getUser() failures:
```
error.message:"supabase.auth.getUser" OR error.message:"getUser()" OR error.stack:"getUser"
```

Auth errors only:
```
error.type:auth OR error.message:"Unauthorized" OR error.message:"Forbidden"
```

---

## Environment Variables

Required:
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for error tracking
- `NEXT_PUBLIC_APP_VERSION` - Release version for tracking

Optional:
- `SENTRY_AUTH_TOKEN` - For server-side Sentry

---

## Monitoring Checklist

### Daily
- [ ] Check System Logs tab in Admin dashboard
- [ ] Review Sentry for getUser() error spikes
- [ ] Verify no unusual auth error patterns

### Weekly
- [ ] Analyze top 10 error types
- [ ] Check error trends over time
- [ ] Review and update filters if needed

### Monthly
- [ ] Export and analyze error data
- [ ] Calculate getUser() failure rate
- [ ] Review log retention policy
- [ ] Update documentation if needed

---

## Troubleshooting

### Issue: Logs not appearing in dashboard

**Check:**
1. Migration has been run: `supabase migration up`
2. `logError()` is being called
3. Server Actions are using `verifyAdmin()`
4. RLS policies are enabled

**Verify:**
```sql
SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 10;
```

### Issue: Sentry events not created

**Check:**
1. `NEXT_PUBLIC_SENTRY_DSN` is set
2. Not in development mode
3. No Sentry inbound filters blocking events
4. Check console for Sentry errors

### Issue: Too many logs

**Solutions:**
1. Adjust log levels (use WARN/INFO instead of ERROR)
2. Run cleanup function: `SELECT cleanup_old_system_logs();`
3. Review Sentry inbound filters
4. Add sampling for high-volume errors

---

## Maintenance

### Clean Up Old Logs
```sql
-- Manual cleanup
DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Using helper function
SELECT cleanup_old_system_logs();
```

### Archive Logs (Optional)
```sql
-- Export to CSV
COPY (
  SELECT * FROM system_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
) TO '/tmp/system_logs_archive.csv' CSV HEADER;
```

---

## Future Enhancements

Potential improvements:
1. Real-time error notifications (WebSocket/Server-Sent Events)
2. Error aggregation and deduplication
3. Custom alert rules per user
4. Export functionality for logs
5. Integration with incident management tools
6. Performance metrics tracking
7. A/B testing for error rates
8. ML-based anomaly detection

---

## Related Files

- `lib/logger.ts` - Logging functions
- `lib/sentry.ts` - Sentry configuration
- `app/(protected)/admin/actions.ts` - Server Actions
- `components/SystemLogsTab.tsx` - Admin UI component
- `app/(protected)/admin/page.tsx` - Admin page
- `supabase/migrations/20260106_create_system_logs_table.sql` - Database schema
- `docs/SENTRY_FILTERING_GUIDE.md` - Sentry guide

---

**Last Updated:** 2026-01-06
