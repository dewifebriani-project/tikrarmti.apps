# Sentry Filtering Guide - Supabase Auth getUser() Errors

## Overview

This guide provides instructions for filtering and monitoring authentication errors in Sentry, specifically focusing on `supabase.auth.getUser()` failures.

## Prerequisites

- Sentry DSN configured in environment variables (`NEXT_PUBLIC_SENTRY_DSN`)
- Sentry project set up for your application
- Admin access to Sentry dashboard

---

## 1. Creating Sentry Filters for supabase.auth.getUser() Errors

### Method 1: Using Sentry Search Queries

Navigate to your Sentry project's **Issues** page and use these search queries:

#### Filter All getUser() Failures
```
error.message:"supabase.auth.getUser" OR error.message:"getUser()" OR error.stack:"getUser"
```

#### Filter Auth-Related Errors
```
error.message:"Auth" OR error.message:"Unauthorized" OR error.message:"Forbidden"
```

#### Filter Specific Auth Error Types
```
error.message:"AuthApiError" OR error.message:"AuthInvalidTokenError" OR error.message:"AuthSessionMissing"
```

### Method 2: Creating Saved Searches

1. Go to **Issues** in your Sentry dashboard
2. Enter your search query (see examples above)
3. Click **Save Search**
4. Name it: "supabase.auth.getUser() Failures"
5. Set as **Dashboard Widget** for quick access

---

## 2. Setting Up Sentry Alerts

### Alert for getUser() Error Spike

1. Navigate to **Settings > Alerts > New Alert Rule**
2. Configure:
   - **Filter**: `error.message:"supabase.auth.getUser" OR error.stack:"getUser"`
   - **Trigger**: When event count exceeds threshold
   - **Threshold**: 10 events in 5 minutes
   - **Destination**: Slack, Email, or PagerDuty

### Alert for Critical Auth Failures

1. Navigate to **Settings > Alerts > New Alert Rule**
2. Configure:
   - **Filter**: `error.message:"Unauthorized" OR error.message:"Forbidden"`
   - **Trigger**: When event count exceeds threshold
   - **Threshold**: 5 events in 1 minute
   - **Priority**: High

---

## 3. Using Sentry Dashboard for Monitoring

### Recommended Dashboard Widgets

1. **Error Count by Type** (Bar Chart)
   - Query: `error.message:"supabase.auth.getUser" OR error.message:"getUser()"`
   - Time: Last 24 hours

2. **Auth Error Trends** (Line Chart)
   - Query: `error.message:"Auth" OR error.message:"Unauthorized"`
   - Time: Last 7 days

3. **Top Functions with Errors** (Table)
   - Query: `error.message:"supabase.auth.getUser"`
   - Group by: `function` tag

4. **getUser() Failure Rate** (Big Number)
   - Query: `error.message:"supabase.auth.getUser"`
   - Compare to: Total errors

---

## 4. Integration with Database Logs

The system automatically logs all errors to both Sentry and the `system_logs` table. Use them together:

### Cross-Reference Workflow

1. **Find issue in Sentry** - Note the `sentry_event_id`
2. **Search in System Logs tab** - Use the Sentry Event ID filter
3. **Get full context** - View database logs for additional context not sent to Sentry

### Example Query for Database Logs

```sql
-- Find all getUser() errors from last 24 hours
SELECT
  error_message,
  error_name,
  user_email,
  context->>'function' as function_name,
  request_path,
  sentry_event_id,
  created_at
FROM system_logs
WHERE is_supabase_getuser_error = TRUE
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 5. Custom Tag-Based Filtering

The system automatically tags Sentry events with:

- `errorType`: runtime, auth, database, validation, network, unknown
- `function`: The function name where error occurred
- `requestPath`: The API route or page path

### Filter by Error Type
```
error.type:auth
```

### Filter by Function Name
```
function:verifyAdmin OR function:getUser
```

### Filter by Request Path
```
request.path:"/api/admin" OR request.path:"/admin"
```

---

## 6. Sentry Inbound Filters (To Reduce Noise)

### Recommended Inbound Filters

Go to **Settings > Inbound Filters** to exclude:

1. **Development Environment Errors**
   ```
   environment:development
   ```

2. **Known Third-Party Errors**
   ```
   error.message:"ResizeObserver loop limit exceeded"
   error.message:"Non-Error promise rejection captured"
   ```

3. **Client-Side Browser Extensions**
   ```
   error.message:"chrome-extension://" OR error.message:"moz-extension://"
   ```

---

## 7. Monitoring Best Practices

### Daily Checklist

- [ ] Check System Logs tab in Admin dashboard
- [ ] Review Sentry "supabase.auth.getUser() Failures" saved search
- [ ] Verify no spike in auth errors (> 10/hour)

### Weekly Review

- [ ] Analyze top 10 error types from Sentry
- [ ] Check error trends over time
- [ ] Identify and prioritize recurring getUser() issues

### Monthly Deep Dive

- [ ] Export error data for analysis
- [ ] Calculate getUser() failure rate
- [ ] Identify patterns by time, user, or endpoint
- [ ] Update filters and alerts based on findings

---

## 8. Troubleshooting Common Issues

### Issue: Too Many Errors in Sentry

**Solution**: Review Inbound Filters and adjust:
- Filter out development environment errors
- Exclude non-critical browser errors
- Use sampling for high-volume errors

### Issue: Missing Context in Sentry

**Solution**: Verify `logError()` is being called with proper context:
```typescript
await logError(error, {
  userId: user.id,
  userEmail: user.email,
  function: 'yourFunctionName',
  errorType: 'auth',
  requestPath: '/api/endpoint',
})
```

### Issue: getUser() Errors Not Showing in Dashboard

**Solution**: Check the following:
1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check `lib/logger.ts` logError function is being called
3. Ensure errors are not being filtered out
4. Verify database logs are being created

---

## 9. Quick Reference: Sentry Search Queries

| Purpose | Query |
|---------|-------|
| All getUser() errors | `error.message:"supabase.auth.getUser" OR error.message:"getUser()"` |
| Auth errors only | `error.type:auth OR error.message:"Unauthorized"` |
| Database errors | `error.type:database` |
| Server-side errors | `environment:production error.type:auth` |
| Recent errors (24h) | `error.message:"getUser" >= 24h` |
| High-severity errors | `level:error OR level:fatal` |
| By request path | `request.path:"/api/admin"` |
| By function | `function:"verifyAdmin" OR function:"getUser"` |

---

## 10. System Logs Dashboard vs Sentry

| Feature | System Logs Tab | Sentry |
|---------|----------------|--------|
| Real-time viewing | Yes | Yes |
| Full stack traces | Yes | Yes |
| Filter by auth errors | Yes (via UI) | Yes (via search) |
| getUser() specific filter | Yes | Manual |
| User context | Yes | Yes |
| Request info | Yes | Yes |
| Cross-reference | With Sentry ID | With DB ID |
| Historical data | Retained per DB policy | Based on Sentry plan |
| Performance monitoring | No | Yes (traces) |
| Release tracking | No | Yes |
| Breadcrumbs | No | Yes |

**Recommendation**: Use both together for comprehensive monitoring.

---

## Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Next.js + Sentry Integration Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Supabase Auth Error Reference](https://supabase.com/docs/reference/javascript/auth-error-codes)

---

**Last Updated**: 2026-01-06
**Version**: 1.0.0
