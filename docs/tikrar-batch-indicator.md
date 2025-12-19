# Tikrar Batch Indicator di Admin Panel

## Ringkasan

Fitur ini menambahkan indikator batch Tikrar Tahfidz di tabel users pada halaman admin panel. Fitur ini dirancang untuk fleksibel dan dapat menangani batch masa depan.

## Lokasi File

- **API Endpoint**: `/app/api/admin/users/route.ts`
- **Admin Page**: `/app/admin/page.tsx`

## Cara Kerja

### 1. API Endpoint

API `/api/admin/users` telah dimodifikasi untuk menyertakan data pendaftaran Tikrar:

```sql
SELECT
  users.*,
  tikrar_registrations:pendaftaran_tikrar_tahfidz(
    id,
    batch_id,
    batch_name,
    status,
    selection_status,
    batch:batches(name, status)
  )
FROM users
ORDER BY created_at DESC
```

### 2. Interface User

Interface `User` telah diperbarui untuk menyertakan data batch:

```typescript
interface User {
  // ... field lainnya
  tikrar_registrations?: Array<{
    id: string;
    batch_id: string;
    batch_name: string;
    status: string;
    selection_status: string;
    batch?: {
      name: string;
      status: string;
    };
  }>;
}
```

### 3. Kolom Tikrar Batch

Kolom baru ditambahkan ke tabel users dengan fitur:

- **Batch Badge**: Menampilkan nama batch dengan warna berbeda
  - Batch 1: Abu-abu
  - Batch 2: Biru (dengan badge angka "2" khusus)
  - Batch lainnya: Ungu

- **Status Badge**: Menampilkan status seleksi dengan icon
  - ✓ **Diterima** (selected) - Hijau
  - ⚠ **Menunggu** (pending) - Kuning
  - ✕ **Tidak Diterima** (not_selected) - Merah

## Fleksibilitas untuk Batch Masa Depan

Sistem dirancang untuk otomatis menangani batch baru:

1. **Warna Otomatis**: Setiap batch number akan mendapat warna berbeda
2. **Batch Number Detection**: Sistem otomatis mendeteksi nomor batch dari nama
3. **Dynamic Styling**: Batch 2 mendapat styling khusus, batch lain menggunakan warna default

## Cara Penggunaan

1. Login sebagai admin ke `/admin`
2. Tab "Users" akan menampilkan kolom "Tikrar Batch"
3. Kolom akan menampilkan:
   - Badge batch (dengan nomor batch)
   - Status seleksi dengan icon
   - Jika user tidak mendaftar Tikrar, akan tampil "-"

## Filter dan Sorting

Kolom "Tikrar Batch" mendukung:
- **Filtering**: Filter berdasarkan nama batch atau status
- **Sorting**: Urutkan berdasarkan nama batch

## Future Enhancements

Beberapa ide untuk pengembangan selanjutnya:

1. **Multi-Batch Display**: Jika user mendaftar multiple batch
2. **Batch Actions**: Hover untuk melihat detail batch
3. **Batch Management**: Direct link ke batch management
4. **Export**: Include batch info di Excel export