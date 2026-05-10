# 03 — Git Workflow

Konvensi cabang, commit, dan pull request. Disiplin di sini = sejarah yang bisa dibaca + rilis yang bisa di-rollback.

## Branching Strategy

### Cabang Utama

- **`main`** — production-ready. Setiap commit di sini bisa di-deploy.
- Tidak ada cabang `develop` / `staging` — kita pakai trunk-based dengan cabang fitur pendek-pendek.

### Cabang Kerja

| Prefix | Untuk | Contoh |
|--------|-------|--------|
| `feat/` | Fitur baru | `feat/admin-merge-users` |
| `fix/` | Bug fix | `fix/login-redirect-loop` |
| `refactor/` | Refactor tanpa ubah perilaku | `refactor/api-responses-helper` |
| `chore/` | Maintenance, dependency, tooling | `chore/upgrade-zod` |
| `docs/` | Hanya dokumentasi | `docs/development-guide` |
| `hotfix/` | Perbaikan urgent di production | `hotfix/csrf-bypass` |

**Aturan nama:**

- Kebab-case, deskriptif tapi singkat (≤50 karakter).
- Hindari nomor task yang opaque (`feat/JIRA-1234`) — cantumkan di commit/PR body.
- Satu cabang = satu unit perubahan kohesif. Kalau ide melebar, bikin cabang baru.

### Aturan Sumber Cabang

```bash
# Selalu fork dari main yang ter-update
git checkout main
git pull --rebase origin main
git checkout -b feat/<nama-fitur>
```

Jangan membuat cabang dari cabang fitur orang lain kecuali memang butuh menumpuk perubahan. Kalau tertumpuk, jelaskan di PR.

## Commit Messages

Pakai **Conventional Commits**. Format:

```
<type>(<scope>): <subject>

<body opsional>

<footer opsional>
```

### Types yang Dipakai

| Type | Untuk |
|------|-------|
| `feat` | Fitur baru ke user |
| `fix` | Bug fix |
| `refactor` | Perubahan struktur kode tanpa ubah perilaku |
| `chore` | Tooling, dependency, build |
| `docs` | Dokumentasi |
| `style` | Formatting (jarang — pisahkan dari logika) |
| `perf` | Peningkatan performa terukur |
| `test` | Tambah/ubah test |
| `revert` | Revert commit sebelumnya |

### Aturan Subject

- Mood imperatif: "add", "fix", "remove" — bukan "added"/"adds"/"adding".
- Huruf kecil di awal (kecuali nama proper).
- Tanpa titik di akhir.
- Maksimal 72 karakter.

### Contoh Baik

```
feat(admin): add user merge endpoint with audit log

- Supports soft-merge (mark dropout) and hard-merge (delete)
- Logs operation to audit_logs table
- Requires admin role + reCAPTCHA challenge

Migration: supabase/migrations/20260419_merge_users_rpc.sql
```

```
fix(auth): resolve refresh token loop on idle session

Root cause: middleware re-fetched session before cookie write completed.
Now waits for setAll() callback. Reproducer in /docs/auth/.
```

```
refactor(api): replace auth-middleware imports with rbac
```

### Contoh Buruk

```
update                                  # ❌ tidak informatif
fix bug                                  # ❌ bug apa?
WIP                                      # ❌ jangan WIP di main history
Add admin user merge feature.            # ❌ kapital + titik + tanpa type
fix(admin): refactored a bunch of stuff  # ❌ type tidak cocok dengan isi
```

## Pull Request

### Sebelum Buka PR

Wajib hijau lokal:

```bash
npm run lint
npm run type-check
npm run build              # opsional tapi sangat dianjurkan
```

Jika ada perubahan UI: **uji di browser** (golden path + edge case).

### Format PR

**Title:** Sama formatnya seperti commit message — `<type>(<scope>): <subject>`. Maksimal 70 karakter.

**Body — wajib mengisi:**

```markdown
## Summary
- 1–3 bullet point: apa yang berubah dan KENAPA

## Test Plan
- [ ] Langkah 1 untuk verifikasi golden path
- [ ] Langkah 2 untuk edge case
- [ ] `npm run lint` hijau
- [ ] `npm run type-check` hijau
- [ ] (jika UI) Sudah dicek di browser di breakpoint mobile & desktop
- [ ] (jika DB) Migrasi sudah dijalankan di staging

## Screenshots / Recording
(Wajib untuk perubahan UI — sebelum & sesudah)

## Risk & Rollback
- Risk: <low|medium|high> — alasan
- Rollback: <revert PR aman?> / <perlu downtime?> / <perlu rollback migrasi?>
```

### Ukuran PR

- **Target: <400 baris diff** (tidak termasuk lock file & generated types).
- PR besar = review dangkal. Kalau perubahan besar, pecah jadi seri PR yang masing-masing bisa berdiri sendiri.
- Pengecualian wajar: refactor mekanis (rename), upgrade dependency, migrasi schema yang harus atomik.

### Review

- **Minimal 1 approver** sebelum merge.
- Author tidak merge sendiri kecuali emergency hotfix dengan persetujuan async.
- Komentar reviewer dijawab — bukan dihapus. "Done" atau penjelasan kenapa tidak diterapkan.

### Merge Strategy

- **Squash merge** untuk PR fitur — sejarah `main` jadi 1 commit per fitur.
- **Merge commit** hanya untuk merge cabang panjang yang sengaja menjaga sub-history.
- **Jangan rebase merge** — repo ini belum standardisasi sign-off.

## Larangan di Git

| Tindakan | Kenapa |
|----------|--------|
| `git push --force` ke `main` | Hapus sejarah orang lain |
| `git commit --no-verify` | Lewati pre-commit hook = potensi build merah masuk |
| `git rebase` cabang yang sudah di-push & di-share | Memaksa orang lain reset |
| Commit `.env.local`, `users.json`, dump database | Kebocoran kredensial / PII |
| Commit `node_modules/`, `.next/` | Repo membengkak |
| Amend commit yang sudah di-push ke remote | Force push trail |

## Sebelum Merge — Wajib

Lihat [07-pr-checklist.md](07-pr-checklist.md) untuk **Definition of Done** lengkap.

Singkat:

- [ ] Semua quality gate hijau (lint, type-check).
- [ ] Sudah dites manual di browser (untuk UI) atau via API client (untuk endpoint).
- [ ] PR title & body terisi sesuai format.
- [ ] Tidak ada secret/PII bocor di diff.
- [ ] Migrasi DB (kalau ada) sudah dieksekusi di staging.
- [ ] Reviewer sudah approve.

---

Lanjut ke → [04-api-development.md](04-api-development.md)
