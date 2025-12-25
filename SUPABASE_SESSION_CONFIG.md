# Supabase Session Configuration

## Overview
Konfigurasi session management untuk aplikasi Tikrar MTI dengan durasi session 1 minggu.

## Session Duration Settings

### Current Configuration (Code Level)
- **Cookie MaxAge**: 604,800 seconds (7 days / 1 week)
- **Auto Refresh Token**: Enabled
- **Persist Session**: Enabled
- **Flow Type**: PKCE (for browser client)

### Supabase Dashboard Settings

Untuk memastikan session bekerja optimal, atur di Supabase Dashboard:

1. **Login ke Supabase Dashboard**: https://supabase.com/dashboard
2. **Pilih Project**: tikrarmti.apps
3. **Navigate**: Authentication → Settings → Auth Settings
4. **Session Settings**:
   - **JWT Expiry**: Set to `604800` (7 days in seconds)
   - **Refresh Token Lifetime**: Set to `604800` atau lebih besar
   - **Enable Refresh Token Rotation**: ✅ (Enabled for security)
   - **Enable Auto Refresh**: ✅ (Enabled)

### JWT Settings (Advanced)
```
JWT_EXPIRY=604800
REFRESH_TOKEN_ROTATION_ENABLED=true
REFRESH_TOKEN_REUSE_INTERVAL=10
SECURITY_REFRESH_TOKEN_REUSE_INTERVAL=10
```

## How Session Management Works

### 1. Login Flow
```
User Login → Set Session with 1 week expiry → Store in cookies → Redirect to intended page
```

### 2. Session Persistence
- Session disimpan di cookies dengan `maxAge: 604800` (1 minggu)
- Auto refresh token aktif, akan refresh token sebelum expired
- Jika user menutup browser dan buka lagi dalam 1 minggu, session masih aktif

### 3. Session Expiry Flow
```
Session Expired → Middleware detect no valid session → Redirect to /login?redirect=[intended-url]
→ User login → Redirect back to [intended-url]
```

### 4. URL Redirect After Login
Middleware akan menyimpan URL yang ingin diakses saat redirect ke login:
- User akses `/dashboard` tanpa login → Redirect ke `/login?redirect=/dashboard`
- User login berhasil → Redirect ke `/dashboard` (bukan ke homepage)

## Files Modified

1. **middleware.ts**
   - Save intended URL when redirecting to login
   - Set cookie maxAge to 1 week

2. **lib/supabase/server.ts**
   - Configure server client with 1 week session
   - Enable auto refresh and persist session

3. **lib/supabase/client.ts**
   - Browser client already configured with persist session

4. **app/login/page.tsx**
   - Read redirect URL from query params
   - Redirect to intended page after successful login

5. **app/login/actions.ts**
   - Set cookie maxAge to 1 week for login action

## Testing Session Persistence

### Test 1: Login dan tunggu beberapa jam
```bash
1. Login ke aplikasi
2. Buka halaman /dashboard
3. Tutup browser
4. Buka browser lagi setelah beberapa jam
5. Akses /dashboard
6. Expected: Langsung masuk tanpa diminta login lagi
```

### Test 2: Session expiry setelah 1 minggu
```bash
1. Login ke aplikasi
2. Set system time ke 8 hari ke depan (lebih dari 1 minggu)
3. Akses /dashboard
4. Expected: Redirect ke /login?redirect=/dashboard
5. Login lagi
6. Expected: Redirect kembali ke /dashboard
```

### Test 3: Redirect ke intended page
```bash
1. Logout dari aplikasi
2. Akses URL protected: /pendaftaran/tikrar-tahfidz
3. Expected: Redirect ke /login?redirect=/pendaftaran/tikrar-tahfidz
4. Login
5. Expected: Redirect ke /pendaftaran/tikrar-tahfidz (bukan /dashboard)
```

## Troubleshooting

### Issue: Session masih expire cepat
**Solution**:
- Cek Supabase Dashboard → Authentication → Settings
- Pastikan JWT Expiry di set ke 604800 seconds
- Restart aplikasi setelah setting

### Issue: Redirect loop setelah login
**Solution**:
- Cek apakah middleware skip API routes
- Pastikan `/login` ada di publicRoutes list
- Clear browser cookies dan coba lagi

### Issue: Cookie tidak persistent
**Solution**:
- Pastikan browser mengizinkan cookies
- Cek Network tab → Cookies untuk melihat maxAge
- Pastikan `sameSite` dan `secure` settings sesuai environment (localhost vs production)

## Security Considerations

1. **PKCE Flow**: Menggunakan PKCE untuk browser client security
2. **Refresh Token Rotation**: Mencegah token reuse attacks
3. **HttpOnly Cookies**: Session cookies di set sebagai HttpOnly
4. **Secure Cookies**: Di production, cookies harus menggunakan Secure flag
5. **Auto Refresh**: Token otomatis di-refresh sebelum expire

## Environment Variables

Pastikan environment variables berikut sudah di-set:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Production Checklist

- [ ] Set JWT Expiry di Supabase Dashboard ke 604800 seconds
- [ ] Enable Refresh Token Rotation
- [ ] Test session persistence di production environment
- [ ] Monitor session expiry di production logs
- [ ] Set up alerts untuk auth failures
- [ ] Document user-facing session timeout behavior

## Support

Jika ada issue dengan session management:
1. Check browser console untuk auth errors
2. Check Network tab untuk cookie settings
3. Check Supabase Dashboard logs
4. Hubungi tim development untuk troubleshooting
