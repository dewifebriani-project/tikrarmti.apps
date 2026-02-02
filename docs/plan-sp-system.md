# Rencana Implementasi Sistem Surat Peringatan (SP)

## Tujuan
Menerbitkan Surat Peringatan bagi thalibah yang tidak melaporkan jurnal harian sampai hari Minggu pada pekan tersebut.

## Aturan SP
1. **SP1**: Peringatan pertama untuk thalibah yang tidak melapor/melapor tidak lengkap
2. **SP2**: Pekan berikutnya (tidak harus pekan 2 berturut-turut), jika masih tidak lapor/tidak lengkap
3. **SP3**: Drop Out (DO)
   - **Permanent DO**: Dikeluarkan permanen
   - **Temporary DO**: Dikeluarkan sementara karena udzur (sakit, merawat orang tua sakit, dll) yang ditoleransi pengurus
4. **Blacklist**: Pengurus berhak mem-blacklist thalibah yang main-main tidak serius laporan

## Lokasi Implementasi
- **Panel Musyrifah**:
  - Tab Jurnal Harian: Tanda/indikator siapa yang sudah dapat SP
  - Tab baru/section: Rekap SP (siapa saja yang sudah dapat SP)

---

## 1. Database Schema (Migration Baru)

### Table: `surat_peringatan` (SP Records)
```sql
CREATE TABLE surat_peringatan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thalibah_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL, -- Pekan ke-
    sp_level INTEGER NOT NULL, -- 1 = SP1, 2 = SP2, 3 = SP3
    sp_type TEXT, -- Untuk SP3: 'permanent_do', 'temporary_do', null untuk SP1/SP2
    reason TEXT NOT NULL, -- Alasan: 'tidak_lapor_jurnal', 'laporan_tidak_lengkap'
    udzur_type TEXT, -- Untuk temporary_do: 'sakit', 'merawat_orang_tua', 'lainnya'
    udzur_notes TEXT, -- Keterangan udzur
    is_blacklisted BOOLEAN DEFAULT false,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    issued_by UUID REFERENCES auth.users(id), -- Musyrifah/Admin yang mengeluarkan
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT sp_unique_thalibah_week UNIQUE(thalibah_id, batch_id, week_number, sp_level)
);

-- Indexes
CREATE INDEX idx_sp_thalibah_id ON surat_peringatan(thalibah_id);
CREATE INDEX idx_sp_batch_id ON surat_peringatan(batch_id);
CREATE INDEX idx_sp_week_number ON surat_peringatan(week_number);
CREATE INDEX idx_sp_level ON surat_peringatan(sp_level);
CREATE INDEX idx_sp_status ON surat_peringatan(status);

-- RLS Policies
ALTER TABLE surat_peringatan ENABLE ROW LEVEL SECURITY;

-- Musyrifah & Admin can view all SP
CREATE POLICY "Musyrifah and Admin can view all SP" ON surat_peringatan
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users WHERE 'musyrifah' = ANY(roles) OR 'admin' = ANY(roles)
        )
    );

-- Thalibah can view own SP
CREATE POLICY "Thalibah can view own SP" ON surat_peringatan
    FOR SELECT USING (auth.uid() = thalibah_id);

-- Musyrifah & Admin can insert SP
CREATE POLICY "Musyrifah and Admin can insert SP" ON surat_peringatan
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM users WHERE 'musyrifah' = ANY(roles) OR 'admin' = ANY(roles)
        )
    );

-- Musyrifah & Admin can update SP
CREATE POLICY "Musyrifah and Admin can update SP" ON surat_peringatan
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM users WHERE 'musyrifah' = ANY(roles) OR 'admin' = ANY(roles)
        )
    );
```

### Table: `sp_history` (History DO/Blacklist)
```sql
CREATE TABLE sp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thalibah_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    final_action TEXT NOT NULL, -- 'permanent_do', 'temporary_do', 'blacklisted'
    total_sp_count INTEGER NOT NULL DEFAULT 3, -- Total SP yang diterima
    udzur_type TEXT,
    udzur_notes TEXT,
    temporary_until TIMESTAMP WITH TIME ZONE, -- Untuk temporary DO
    action_taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_taken_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sp_history_thalibah_id ON sp_history(thalibah_id);
CREATE INDEX idx_sp_history_batch_id ON sp_history(batch_id);
CREATE INDEX idx_sp_history_final_action ON sp_history(final_action);

-- RLS Policies
ALTER TABLE sp_history ENABLE ROW LEVEL SECURITY;

-- Musyrifah & Admin can view all history
CREATE POLICY "Musyrifah and Admin can view SP history" ON sp_history
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users WHERE 'musyrifah' = ANY(roles) OR 'admin' = ANY(roles)
        )
    );
```

---

## 2. API Routes

### `/api/musyrifah/sp` (GET)
- Mendapatkan daftar semua SP
- Filter: batch_id, thalibah_id, sp_level, status
- Include thalibah info dan jurnal status

### `/api/musyrifah/sp` (POST)
- Membuat SP baru
- Validasi: thalibah tidak boleh dapat SP di pekan yang sama
- Auto-increment SP level berdasarkan SP aktif terakhir thalibah tersebut

### `/api/musyrifah/sp/[id]` (PUT)
- Update SP (ubah status, tambahkan catatan)
- Untuk SP3: tentukan type (permanent_do / temporary_do)

### `/api/musyrifah/sp/[id]` (DELETE)
- Cancel SP (set status = 'cancelled')

### `/api/musyrifah/sp/check-weekly` (GET)
- **Endpoint penting**: Mengecek thalibah yang belum lapor jurnal di pekan berjalan
- Run setiap hari Senin (cek kelengkapan pekan sebelumnya/Minggu)
- Return: List thalibah yang berpotensi dapat SP

### `/api/musyrifah/sp/history` (GET)
- Mendapatkan history SP (yang sudah sampai SP3/DO/blacklist)

---

## 3. Komponen UI

### Tab Jurnal Harian (Update Existing)
- Tambah kolom/indikator "SP Status" di table
- Badge: "SP1", "SP2", "SP3" jika thalibah sedang aktif dapat SP
- Color coding: SP1 (kuning), SP2 (orange), SP3 (merah)
- Hover: Show detail SP (pekan keberapa, alasan, tanggal diterbitkan)

### Tab Baru: "SP / Peringatan"
**Sub-tabs:**
1. **Pending SP** - Thalibah yang belum lapor jurnal minggu ini (perlu ditindaklanjuti)
2. **Aktif** - SP yang sedang berlaku (belum DO)
3. **Riwayat** - Yang sudah DO/Blacklist

**Pending SP Table:**
| Nama Thalibah | Pekan | Status Jurnal | Aksi |
|---------------|-------|---------------|------|
| Fulanah | 3 | Belum lapor | [Buat SP] |

**Aktif Table:**
| Nama Thalibah | SP | Pekan | Alasan | Tanggal | Aksi |
|---------------|-----|-------|--------|---------|------|
| Fulanah | SP1 | 3 | Tidak lapor jurnal | 2 Feb 2025 | [Detail] [Batalkan] |
| Fulanah | SP2 | 5 | Tidak lapor jurnal | 16 Feb 2025 | [Detail] [Upgrade ke SP3] |

**Riwayat Table:**
| Nama Thalibah | Total SP | Status Akhir | Tanggal | Keterangan |
|---------------|----------|--------------|---------|------------|
| Fulanah | 3 | DO Temporary | 2 Mar 2025 | Sakit |
| ... | 3 | Blacklist | 5 Mar 2025 | Main-main tidak serius |

### Modal: Buat/Edit SP
**Form fields:**
- Thalibah (auto-select dari pending)
- Pekan (auto-select)
- Level SP (auto-calculate berdasarkan SP aktif terakhir)
- Alasan (dropdown: tidak_lapor_jurnal, laporan_tidak_lengkap, dll)
- Catatan tambahan
- Jika SP3: Pilih tipe DO (Permanent/Temporary) + field udzur jika temporary

### Modal: Detail SP
- Show all info SP
- History SP thalibah tersebut
- Button: Upgrade ke SP berikutnya / Batalkan

---

## 4. Auto-Check Logic (Cron Job / Scheduled Function)

### Function: `checkWeeklyJurnalCompliance()`
**Run schedule:** Setiap hari Senin jam 00:00

**Logic:**
1. Get active batch
2. Get all thalibah dari daftar_ulang_submissions (approved/submitted)
3. Untuk setiap thalibah:
   - Check apakah sudah ada jurnal untuk pekan lalu
   - Jika belum, flag sebagai "pending SP"
4. Save ke temporary table atau return via API

**Implementation Options:**
- Vercel Cron Jobs
- Supabase Edge Functions with cron
- Manual trigger di panel musyrifah

---

## 5. Types Update

```typescript
// types/database.ts

export type SPLevel = 1 | 2 | 3;
export type SPStatus = 'active' | 'cancelled' | 'expired';
export type SPType = 'permanent_do' | 'temporary_do';
export type SPReason = 'tidak_lapor_jurnal' | 'laporan_tidak_lengkap' | 'lainnya';
export type UdzurType = 'sakit' | 'merawat_orang_tua' | 'lainnya';

export interface SuratPeringatan {
  id: string;
  thalibah_id: string;
  batch_id: string;
  week_number: number;
  sp_level: SPLevel;
  sp_type?: SPType;
  reason: SPReason;
  udzur_type?: UdzurType;
  udzur_notes?: string;
  is_blacklisted: boolean;
  issued_at: string;
  issued_by?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  status: SPStatus;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Relations
  thalibah?: User;
  batch?: Batch;
  issued_by_user?: User;
}

export interface SPHistory {
  id: string;
  thalibah_id: string;
  batch_id: string;
  final_action: 'permanent_do' | 'temporary_do' | 'blacklisted';
  total_sp_count: number;
  udzur_type?: UdzurType;
  udzur_notes?: string;
  temporary_until?: string;
  action_taken_at: string;
  action_taken_by?: string;
  notes?: string;
  created_at: string;

  // Relations
  thalibah?: User;
  batch?: Batch;
  action_taken_by_user?: User;
}

export interface PendingSP {
  thalibah_id: string;
  thalibah: User;
  week_number: number;
  has_jurnal: boolean;
  latest_jurnal_date?: string;
  current_active_sp?: SuratPeringatan;
}
```

---

## 6. Server Actions (Revalidate)

```typescript
// app/(protected)/panel-musyrifah/actions.ts

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createSP(data: CreateSPInput) {
  // Validation, create SP record
  // Auto-calculate SP level based on existing active SP
  revalidatePath('/panel-musyrifah');
  revalidatePath('/panel-musyrifah?tab=sp');
}

export async function updateSP(id: string, data: UpdateSPInput) {
  // Update SP
  revalidatePath('/panel-musyrifah');
}

export async function cancelSP(id: string) {
  // Set status = 'cancelled'
  revalidatePath('/panel-musyrifah');
}

export async function upgradeToSP3(spId: string, doType: SPType) {
  // Upgrade to SP3 with DO type
  // Create sp_history entry
  // Update halaqah_student status if applicable
  revalidatePath('/panel-musyrifah');
}

export async function blacklistThalibah(thalibahId: string, notes: string) {
  // Set is_blacklisted = true
  // Create sp_history entry
  // Update user status
  revalidatePath('/panel-musyrifah');
}
```

---

## 7. Langkah Implementasi

### Tahap 1: Database & Backend
1. Create migration untuk tabel `surat_peringatan` dan `sp_history`
2. Update types/database.ts
3. Create API routes untuk SP

### Tahap 2: Core Logic
1. Implement auto-check logic (pending SP detection)
2. Implement SP level auto-calculation
3. Implement SP3 → DO transition logic

### Tahap 3: UI - Tab Jurnal
1. Update jurnal table untuk show SP badge
2. Add hover detail untuk SP info

### Tahap 4: UI - Tab SP
1. Create SP tab component
2. Create Pending SP sub-tab
3. Create Aktif SP sub-tab
4. Create Riwayat SP sub-tab
5. Create modals (Buat SP, Edit SP, Detail SP)

### Tahap 5: Integration & Testing
1. Test end-to-end flow SP1 → SP2 → SP3
2. Test temporary DO flow
3. Test blacklist flow
4. Test cancellation flow

---

## File Summary

### New Files:
- `supabase/migrations/20260202_add_surat_peringatan_system.sql`
- `app/api/musyrifah/sp/route.ts`
- `app/api/musyrifah/sp/check-weekly/route.ts`
- `app/api/musyrifah/sp/history/route.ts`
- `app/(protected)/panel-musyrifah/components/SPTab.tsx`
- `app/(protected)/panel-musyrifah/components/SPPendingTable.tsx`
- `app/(protected)/panel-musyrifah/components/SPAktifTable.tsx`
- `app/(protected)/panel-musyrifah/components/SPRiwayatTable.tsx`
- `app/(protected)/panel-musyrifah/components/CreateSPModal.tsx`
- `app/(protected)/panel-musyrifah/components/SPDetailModal.tsx`
- `lib/hooks/useSPData.ts`

### Modified Files:
- `types/database.ts` - Add SP types
- `app/(protected)/panel-musyrifah/page.tsx` - Add SP tab, update jurnal tab
- `app/(protected)/panel-musyrifah/actions.ts` - Add SP server actions
- `app/(protected)/panel-musyrifah/components/JurnalTab.tsx` - Add SP badge indicator

---

## Catatan Tambahan

1. **Timezone consideration**: Pekan dianggap selesai pada hari Minggu pukul 23:59 WIB
2. **Grace period**: Bisa tambahkan grace period 1 hari setelah Minggu (Senin pagi) sebelum auto-flag
3. **Notification**: Bisa tambahkan notifikasi WhatsApp/Email saat SP diterbitkan (future feature)
4. **Appeal process**: Bisa tambahkan fitur banding untuk thalibah yang merasa tidak adil (future feature)
