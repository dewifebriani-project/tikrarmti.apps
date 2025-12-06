# Authentication Test Guide

## Issues Fixed:
1. **Multiple callback executions** - Added `isHandled` flag to prevent duplicate processing
2. **Database query timeouts** - Added Promise.race with timeout for mobile users
3. **Clock skew warning** - Added wait time for session to be properly set
4. **Multiple Supabase instances** - Added logging to track singleton usage

## Testing Steps:

### 1. Clear all browser data
- Open browser dev tools (F12)
- Go to Application tab
- Clear Local Storage
- Clear Session Storage
- Clear Cookies for localhost

### 2. Try authentication
1. Go to http://localhost:3003/login
2. Click "Login dengan Google"
3. Complete Google authentication
4. Check console for errors

### 3. Expected console logs:
- `[Singleton] Creating new Supabase client instance...` (should only appear once)
- `Found access token in hash fragment, setting session...`
- `User authenticated: your-email@gmail.com`
- `User registered, redirecting to dashboard`

### 4. If errors still occur:
- Check network tab for failed API calls
- Look for 500 errors in console
- Check browser clock is synchronized
- Verify `/api/auth/check-registration` responds correctly

### Common fixes:
- If clock skew: Sync your system clock
- If timeout: Check internet connection speed
- If 500 error: Check server logs for database connection issues