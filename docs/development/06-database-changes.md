# 06 — Database Changes

Workflow untuk perubahan skema, migrasi, dan RLS. Database ini **single source of truth bisnis** — kesalahan di sini paling mahal di-rollback.

## Prinsip

1. **Migrasi pakai file SQL bernomor** di [`supabase/migrations/`](../../supabase/migrations/).
2. **RLS aktif untuk semua tabel berisi data user.** Tanpa RLS = data publik.
3. **Pakai admin client (service role) hanya bila perlu bypass RLS.** Operasi user biasa = `createServerClient()`.
4. **Jangan ubah migrasi yang sudah ter-merge.** Buat migrasi baru yang menyusulkan perubahan.

## Sumber Kebenaran Skema

| Item | Lokasi |
|------|--------|
| File migrasi | [`supabase/migrations/<YYYYMMDD>_<deskripsi>.sql`](../../supabase/migrations/) |
| Tipe TS hasil generate | [`types/supabase.ts`](../../types/supabase.ts) — **read-only**, regenerate via `npm run gen-types` |
| Dokumentasi tabel | [`database/DATABASE_SCHEMA.md`](database/DATABASE_SCHEMA.md) |
| Dokumentasi RLS | [`database/rls-policies.md`](database/rls-policies.md) |

## Workflow Migrasi

### 1. Buat File Migrasi

Format nama: `YYYYMMDD_<deskripsi_singkat>.sql`.

```bash
# Gunakan tanggal hari ini
touch supabase/migrations/20260507_add_user_merge_audit.sql
```

### 2. Tulis SQL

Aturan wajib:

```sql
-- ✅ Idempoten — bisa dijalankan ulang tanpa error
CREATE TABLE IF NOT EXISTS user_merge_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  loser_id UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  mode TEXT NOT NULL CHECK (mode IN ('soft', 'hard')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ✅ Index — selalu tambah untuk kolom yang akan di-filter
CREATE INDEX IF NOT EXISTS idx_user_merge_audit_winner
  ON user_merge_audit (winner_id);

-- ✅ RLS — aktif default
ALTER TABLE user_merge_audit ENABLE ROW LEVEL SECURITY;

-- ✅ Policy eksplisit
CREATE POLICY "Admin can read audit" ON user_merge_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND 'admin' = ANY(users.roles)
    )
  );
```

### 3. Test di Staging Dulu

**Tidak boleh** menjalankan migrasi langsung ke production tanpa lewat staging:

1. Apply migrasi di Supabase staging project.
2. Verifikasi: query, RLS behavior, dan rollback path.
3. Tarik perubahan ke `types/supabase.ts` lokal:

```bash
npm run gen-types
```

4. Commit hasil generate ke PR yang sama dengan file migrasi.

### 4. Apply ke Production

Production migration **selalu** lewat:

- PR review (≥1 approver).
- Setelah merge, eksekusi di Supabase production via SQL editor atau CI.
- Catat di PR description: kapan di-apply & oleh siapa.

> Untuk migrasi destruktif (drop column, drop table): wajib minta persetujuan eksplisit dari owner. Buat backup sebelum apply.

## Aturan SQL

### DO

- ✅ `IF NOT EXISTS` / `IF EXISTS` — semua DDL idempoten.
- ✅ `ON DELETE` strategy eksplisit (`CASCADE`, `SET NULL`, `RESTRICT`).
- ✅ Kolom timestamp pakai `TIMESTAMPTZ` (with timezone), bukan `TIMESTAMP`.
- ✅ Default UUID generator: `gen_random_uuid()`.
- ✅ `CHECK` constraint untuk enum-like kolom — tetap whitelist.
- ✅ Komentar `COMMENT ON COLUMN` untuk kolom yang non-obvious.

### DON'T

- ❌ `DROP TABLE` / `DROP COLUMN` di migrasi tanpa langkah deprecate dulu.
- ❌ Rename kolom langsung — bikin kolom baru, copy data, drop kolom lama di rilis berikutnya.
- ❌ Foreign key tanpa index di sisi referencing — query JOIN akan lambat.
- ❌ `RAISE EXCEPTION` dengan pesan yang membocorkan struktur tabel.

## Row Level Security

**Setiap tabel berisi data user wajib RLS aktif.** Tanpa policy, RLS aktif = tabel jadi tidak dapat dibaca (yang juga aman, tapi tidak berguna).

### Pola Policy Standar

```sql
ALTER TABLE jurnal_harian ENABLE ROW LEVEL SECURITY;

-- User baca data sendiri
CREATE POLICY "Users read own jurnal" ON jurnal_harian
  FOR SELECT
  USING (auth.uid() = user_id);

-- User tulis data sendiri
CREATE POLICY "Users insert own jurnal" ON jurnal_harian
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own jurnal" ON jurnal_harian
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Muallimah baca jurnal santri di halaqahnya
CREATE POLICY "Muallimah read assigned jurnal" ON jurnal_harian
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN halaqah_assignments ha ON ha.muallimah_id = u.id
      WHERE u.id = auth.uid()
        AND 'muallimah' = ANY(u.roles)
        AND ha.thalibah_id = jurnal_harian.user_id
    )
  );
```

### Aturan RLS

- Cek role pakai `'<role>' = ANY(users.roles)` — **bukan** `users.role = '<role>'`.
- Test setiap policy dengan akun bukan-admin sebelum merge.
- Update [`database/rls-policies.md`](database/rls-policies.md) saat menambah/mengubah policy.

### Bypass RLS (admin)

Hanya lewat `createSupabaseAdmin()` di server — **tidak pernah** lewat anon key di client.

```typescript
// ✅ Server-side, route admin
const adminClient = createSupabaseAdmin()
const { data } = await adminClient.from('users').select('*')

// ❌ Tidak ada cara untuk bypass dari browser — itu fitur, bukan bug
```

## Type Generation

Setelah migrasi yang mengubah struktur tabel:

```bash
npm run gen-types
```

Ini meng-overwrite [`types/supabase.ts`](../../types/supabase.ts). Commit hasilnya di PR yang sama. **Jangan edit manual.**

Jika `npm run gen-types` gagal:

1. Pastikan login Supabase CLI (`npx supabase login`).
2. Pastikan project ID di `package.json` benar.
3. Cek migrasi terakhir benar-benar sudah ter-apply di staging.

## Pola Query

### Dari Server Component

```typescript
const supabase = createServerClient()
const { data, error } = await supabase
  .from('jurnal_harian')
  .select('*, users(full_name)')
  .eq('user_id', userId)
  .order('date', { ascending: false })
  .limit(30)

if (error) {
  logger.error('jurnal_query_failed', { code: error.code })
  return <ErrorState />
}
```

### Dari API Route (admin)

```typescript
const adminClient = createSupabaseAdmin()
const { data, error } = await adminClient
  .from('users')
  .select('id, email, roles, created_at')
  .order('created_at', { ascending: false })
  .range((page - 1) * limit, page * limit - 1)

if (error) return ApiResponses.databaseError(error)
return ApiResponses.success(data)
```

### Larangan

- ❌ `select('*')` di endpoint publik — pilih kolom eksplisit, hindari kebocoran kolom baru tak terduga.
- ❌ Loop query (N+1). Pakai `select('a, b, c, related(d, e)')` untuk join.
- ❌ Filter di JS setelah query semua row. Filter di SQL.

## RPC (Stored Function)

Untuk operasi kompleks atau atomik (multi-table mutation), bikin RPC:

```sql
-- supabase/migrations/20260419_merge_users_rpc.sql
CREATE OR REPLACE FUNCTION merge_users(
  winner_id UUID,
  loser_id UUID,
  mode TEXT,
  reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- run as owner, bypass RLS — DOUBLE CHECK auth in body
AS $$
DECLARE
  caller_id UUID := auth.uid();
  is_admin BOOLEAN;
BEGIN
  -- WAJIB: re-verify caller di body (SECURITY DEFINER bypass RLS)
  SELECT 'admin' = ANY(roles) INTO is_admin
  FROM users WHERE id = caller_id;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- ... operasi merge
  RETURN jsonb_build_object('status', 'ok');
END;
$$;
```

### Aturan RPC

- `SECURITY DEFINER` butuh **eksplisit re-check auth** di body. Jangan andalkan RLS — sudah di-bypass.
- Return JSONB dengan struktur konsisten — `{ status, ... }`.
- Pesan error generik. Detail teknis ke log internal, bukan exception message.

## Migrasi Data (Bukan Skema)

Untuk migrasi data (backfill, transformasi):

1. Tulis sebagai migration SQL atau script di [`scripts/`](../../scripts/) dengan `npx tsx`.
2. **Idempoten** — bisa di-run ulang tanpa duplikasi.
3. Jalan di staging dulu, ukur durasi, lalu jadwalkan untuk production di low-traffic window.
4. Untuk dataset besar (>10k row): batch via `LIMIT/OFFSET` atau RPC dengan cursor.

## Checklist Perubahan DB

- [ ] File migrasi di `supabase/migrations/` dengan format `YYYYMMDD_*.sql`.
- [ ] SQL idempoten (`IF NOT EXISTS` / `IF EXISTS`).
- [ ] RLS aktif untuk tabel baru + policy eksplisit per role.
- [ ] Index untuk kolom yang akan di-filter / di-join.
- [ ] `npm run gen-types` dijalankan, hasil di-commit.
- [ ] Sudah di-apply & verified di staging.
- [ ] Dokumen [`database/DATABASE_SCHEMA.md`](database/DATABASE_SCHEMA.md) ter-update.
- [ ] Dokumen [`database/rls-policies.md`](database/rls-policies.md) ter-update bila ada policy baru.
- [ ] Plan rollback ditulis di PR description.

---

Lanjut ke → [07-pr-checklist.md](07-pr-checklist.md)
