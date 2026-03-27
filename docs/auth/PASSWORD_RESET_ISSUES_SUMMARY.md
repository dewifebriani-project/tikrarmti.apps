# Password Reset & Forgot Password - Issue Summary

**Analysis Complete**: 10 issues found  
**Critical Issues**: 2 - Blocks core functionality  
**Estimated Fix Time**: 4 hours

---

## 🔴 CRITICAL ISSUES (Must Fix First)

### 1. Missing `/api/auth/set-session` Endpoint - **BLOCKING**

**Status**: File does not exist  
**Impact**: Server-side cookies never set → auth token refresh fails

Called 3x from `app/auth/callback/page.tsx`:
- Line 94: After PKCE code exchange
- Line 228: After hash fragment processing  
- Line 315: From fallback session check

**What's broken**:
- Auth cookies stored in browser but never synced to server
- Middleware token refresh will fail
- Users get logged out when token expires

**Fix**: Create `app/api/auth/set-session/route.ts` (see detailed analysis file)

---

### 2. Conflicting Recovery Flow Paths

**Issue**: 3 different recovery handling paths cause confusion

1. **Unreachable Path** - `app/auth/callback/page.tsx` line 48-57:
   ```typescript
   if (type === 'recovery' && !code) { ... } // Never executes!
   ```
   - Checks query params `?type=recovery`
   - But Supabase sends recovery links with hash: `#type=recovery`
   - This code is dead

2. **Correct Path** - `app/auth/callback/page.tsx` line 160-183:
   ```typescript
   if (type === 'recovery' && accessToken) { ... } // THIS WORKS
   ```
   - Reads from hash fragment
   - Sets session correctly

3. **Broken Alternate Path** - `app/auth/confirm/page.tsx` line 38-63:
   ```typescript
   if (type === 'recovery') {
     fetch('/api/auth/confirm?token=...&type=recovery');
     // Only verifyOtp, doesn't setSession!
     router.push('/reset-password'); // User has no session!
   }
   ```

**What's broken**:
- Users might land on reset-password without valid session
- Duplicate code paths cause maintenance confusion
- Recovery token never actually processed correctly

**Fix**: 
- ✅ Keep only hash fragment path (path #2)
- ❌ Remove query param check (path #1) - unreachable
- ❌ Remove alternate confirm path (path #3) - broken

---

## 🟠 HIGH PRIORITY ISSUES

### 3. Missing Dependency in Session Check
**File**: `app/reset-password/page.tsx` line 46

```typescript
useEffect(() => {
  checkSession();
}, []); // ❌ Missing: supabase
```

**Impact**: Hot reload during development may use stale session check

---

### 4. Token Expiry Not Handled
**File**: `app/auth/callback/page.tsx` line 165-170

When token expires, generic error shown. Should distinguish:
- "Token expired (1 hour limit)" → Suggest new link
- "Invalid token" → General error

---

### 5. Race Condition in Session Setup
**Flow**: 
```
/auth/callback redirects → /reset-password loads
but /api/auth/set-session is still missing (issue #1)
so cookies not written yet
reset-password checks session → MIGHT NOT EXIST
```

**Fix**: Depends on fixing issue #1 first

---

## 🟡 MEDIUM PRIORITY ISSUES

### 6. Silent Failures in Forgot Password API
**File**: `app/api/auth/forgot-password/route.ts`

Always returns success (good for security, prevents email enumeration), but real errors are hidden. No admin alert if email service fails.

---

### 7. Generic Error Messages
**Files**: 
- `app/reset-password/page.tsx` - just says "failed, try again"
- `app/auth/callback/page.tsx` - same issue

Should differentiate:
- Session expired → "Request new link"
- Password same as old → "Choose different password"
- Weak password → "Meet requirements"

---

### 8. Missing URL Validation
**File**: `app/api/auth/forgot-password/route.ts` line 31

```typescript
const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;
// No validation before using it!
```

If env var missing/typo'd, recovery link points to wrong URL.

---

## 🔵 LOW PRIORITY ISSUES

### 9. Unused/Broken Alternate Recovery Path
Remove `/app/auth/confirm/page.tsx` recovery handling (lines 38-63)

### 10. Inconsistent Error Logging
Each file logs differently (console.error, logger.error, debugOAuth)

---

## Quick Assessment

| Component | Status | Issue |
|-----------|--------|-------|
| Forgot Password Page | ⚠️ Works | Real errors hidden |
| Forgot Password API | ⚠️ Works | Silent failures + no validation |
| Email Send | ✅ Works | Supabase handles it |
| Recovery Link | ⚠️ Works | Token may be forgotten by user |
| Auth Callback | 🔴 BROKEN | Missing set-session endpoint |
| Reset Password | 🔴 BROKEN | Session not validated properly |
| Session Validation | 🔴 BROKEN | Race condition timing |

---

## Immediate Next Steps

1. **CREATE** `app/api/auth/set-session/route.ts`
2. **DELETE** unreachable code in callback (line 48-57)
3. **DELETE** broken recovery path in confirm (line 38-63)
4. **ADD** supabase dependency to reset-password useEffect
5. **ADD** token expiry detection with user-friendly message
6. **ADD** URL validation in forgot-password API
7. **TEST** full recovery flow end-to-end

See `DEEP_ANALYSIS_PASSWORD_RESET.md` for detailed code samples and fixes.

---

## File Locations
- **Detailed Analysis**: `DEEP_ANALYSIS_PASSWORD_RESET.md` ← Read this for code samples
- **Session Memory**: `/memories/session/password-reset-analysis.md` (summary)

