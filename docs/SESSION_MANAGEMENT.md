# Session Management - Tikrarmti Apps

## Ringkasan

Dokumen ini menjelaskan bagaimana session management bekerja di Tikrarmti Apps dan bagaimana memastikan user tetap login selama 7 hari.

## Arsitektur Session Management

### 1. Middleware - Token Refresher

**File:** `lib/supabase/middleware.ts`

Middleware berjalan di setiap request dan:
- Mengecek apakah access token expired
- Jika expired, menggunakan refresh token untuk mendapatkan access token baru
- Menulis token baru ke cookie via Set-Cookie header

**PENTING:** Middleware tidak membuat response object baru saat update cookie. Ini memastikan semua cookie updates ter-persist.

### 2. Server Client - Cookie Handler

**File:** `lib/supabase/server.ts`

Server client yang digunakan di Server Components dan Server Actions memiliki konfigurasi:
```typescript
auth: {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: 'pkce',
  debug: process.env.NODE_ENV === 'development',
}
```

Cookie flags:
- `httpOnly: true` - Cookie tidak bisa diakses via JavaScript (security)
- `secure: true` (production only) - Hanya dikirim via HTTPS
- `sameSite: 'lax'` - Mencegah CSRF attack
- `maxAge: 60 * 60 * 24 * 7` - 7 hari dalam detik

### 3. Supabase Auth Settings - WAJIB DISET DI DASHBOARD

Agar session bertahan 7 hari, Anda harus mengatur setting di Supabase Dashboard:

#### Setting di Supabase Dashboard:

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project Tikrarmti
3. Go to **Authentication** → **Settings**
4. Scroll ke **Session Configuration**

**Setting yang harus diatur:**

| Setting | Value | Keterangan |
|---------|-------|------------|
| **JWT Expiry Limit** | `604800` | 7 hari dalam detik (7 * 24 * 60 * 60) |
| **Refresh Token Rotation** | `ON` | Memperbarui refresh token setiap kali digunakan |
| **Refresh Token Reuse Interval** | `0` | Tidak ada interval reuse (security best practice) |

#### Cara Setting JWT Expiry:

1. Di Supabase Dashboard → Authentication → Settings
2. Cari field **"JWT expiry limit"**
3. Masukkan nilai: `604800` (ini adalah 7 hari dalam detik)
4. Klik **Save**

![JWT Expiry Setting](https://i.imgur.com/placeholder.png)

#### Validasi Setting:

Untuk memastikan setting sudah benar, jalankan query ini di SQL Editor:

```sql
-- Cek JWT expiry setting
SELECT *
FROM auth.config
WHERE key = 'jwt_expiry';
```

Hasil harusnya `604800` (7 hari).

## Troubleshooting

### Problem: User logout setelah 1 jam

**Kemungkinan penyebab:**
1. JWT Expiry di Supabase Dashboard belum diset ke 604800
2. Middleware tidak berjalan dengan benar
3. Browser blocking cookies

**Cara cek:**

1. **Cek JWT Expiry di Dashboard:**
   - Buka Supabase Dashboard
   - Authentication → Settings
   - Pastikan "JWT expiry limit" = 604800

2. **Cek apakah middleware berjalan:**
   - Buka browser console
   - Buka Network tab
   - Refresh halaman
   - Lihat apakah ada request yang mengembalikan Set-Cookie header dengan auth token
   - Di development, Anda akan melihat log: `[Middleware] Session refreshed for user: ...`

3. **Cek cookie di browser:**
   - Buka DevTools → Application → Cookies
   - Cari cookie dengan prefix `sb-`
   - Pastikan cookie ada dan expiry date-nya 7 hari ke depan

### Problem: User logout saat idle

**Normal behavior:**
- Access token expire setelah 1 jam (default Supabase)
- Refresh token bisa dipakai untuk mendapatkan token baru
- Refresh token expire setelah 7 hari (sesuai setting)

**Jika user logout sebelum 7 hari:**
- Cek apakah user membuka app di tab/window yang berbeda
- Cek apakah browser blocking third-party cookies
- Cek apakah ada error di console

## Debug Mode

Di development mode, debug logging diaktifkan:

```typescript
auth: {
  debug: process.env.NODE_ENV === 'development',
}
```

Ini akan menampilkan log detail di browser console tentang:
- Token refresh events
- Session state changes
- Auth errors

## Best Practices

1. **Jangan manupulasi cookie secara manual**
   - Gunakan @supabase/ssr untuk semua operasi cookie
   - Jangan gunakan document.cookie di client

2. **Gunakan getUser(), bukan getSession()**
   - getUser() memvalidasi token ke server Supabase
   - getSession() hanya membaca cookie lokal (tidak valid)

3. **Percayakan token refresh ke middleware**
   - Middleware akan otomatis refresh token
   - Server Components akan otomatis mendapat token segar

4. **Monitor di production**
   - Gunakan error tracking (Sentry, etc.)
   - Monitor auth-related errors
   - Track logout frequency

## Testing

### Test Session Persistence:

1. Login ke app
2. Buka DevTools → Application → Cookies
3. Catat expiry date dari auth cookie
4. Tutup browser
5. Buka kembali app setelah beberapa jam
6. Pastikan masih login
7. Cek cookie expiry masih sama (refresh token tidak berubah)

### Test Token Refresh:

1. Buka DevTools → Network
2. Filter by request yang mengembalikan Set-Cookie header
3. Buka app
4. Tunggu 1 jam (atau ubah system clock)
5. Refresh halaman
6. Lihat apakah ada request yang mengembalikan Set-Cookie dengan token baru

## Referensi

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-debug)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

## Checklist Production

Sebelum deploy ke production:

- [ ] JWT Expiry di Supabase Dashboard = 604800
- [ ] Refresh Token Rotation = ON
- [ ] Middleware terpasang dan berjalan
- [ ] Debug mode OFF di production (otomatis dari env)
- [ ] Cookie flags: httpOnly, secure (production), sameSite
- [ ] Test session persistence di production environment
