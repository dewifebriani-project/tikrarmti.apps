# Perjalanan-Saya Dynamic Timeline Implementation Plan

## Overview
Mengubah halaman perjalanan-saya dari hardcoded timeline menjadi dynamic berdasarkan konfigurasi batch dari admin panel.

## Current State (Hardcoded)

### Timeline Items (10 phases)
1. **Mendaftar Program** - 1-14 Desember 2025
2. **Seleksi** - 15-28 Desember 2025
3. **Lulus Seleksi** - 29 Desember 2025
4. **Mendaftar Ulang** - 30 Desember 2025
5. **Kelas Perdana Gabungan** - 5 Januari 2026
6. **Proses pembelajaran (tashih)** - Pekan 1 (05-11 Jan 2026)
7. **Proses pembelajaran** - Pekan 2-11 (12 Jan-22 Mar 2026)
8. **Pekan muraja'ah** - Pekan 12 (23-29 Mar 2026)
9. **Ujian Akhir** - Pekan 13 (30 Mar-5 Apr 2026)
10. **Wisuda & Kelulusan** - Pekan 14 (6-12 Apr 2026)

**Total Duration**: 14 weeks (1 Dec 2025 - 12 Apr 2026)

---

## ✅ Phase 1: Database Schema (COMPLETED)

### SQL Migration File
**File**: `docs/batches_timeline_fields_migration.sql`

### New Fields Added to `batches` Table

| Field Name | Type | Description |
|---|---|---|
| `selection_start_date` | DATE | Start date of selection phase |
| `selection_end_date` | DATE | End date of selection phase |
| `selection_result_date` | DATE | Date when selection results announced |
| `re_enrollment_date` | DATE | Date for re-enrollment confirmation |
| `opening_class_date` | DATE | Date of opening class (Kelas Perdana) |
| `first_week_start_date` | DATE | Start date of first learning week (Pekan 1) |
| `first_week_end_date` | DATE | End date of first learning week |
| `review_week_start_date` | DATE | Start date of review/muraja'ah week (Pekan 12) |
| `review_week_end_date` | DATE | End date of review week |
| `final_exam_start_date` | DATE | Start date of final exam week (Pekan 13) |
| `final_exam_end_date` | DATE | End date of final exam week |
| `graduation_start_date` | DATE | Start date of graduation week |
| `graduation_end_date` | DATE | End date of graduation week |

### How to Run Migration
```bash
psql -U postgres -d your_database -f docs/batches_timeline_fields_migration.sql
```

---

## ✅ Phase 2: TypeScript Types (COMPLETED)

### Files Updated
1. **`types/database.ts`** - Added timeline fields to `Batch` interface
2. **`types/batch.ts`** - Updated `BatchCreateRequest` and `BatchUpdateRequest`

### Commit
- **Hash**: `cafa394`
- **Message**: "feat: Add timeline phase fields to batches table and TypeScript types"
- **Status**: Pushed to remote ✅

---

## 🔄 Phase 3: Custom Hook (NEXT)

### Create `hooks/useBatchTimeline.ts`

```typescript
import useSWR from 'swr';
import { Batch } from '@/types/database';

export interface TimelineItem {
  id: string;
  title: string;
  date: string;
  dateRange?: string;
  hijriDate?: string;
  status: 'completed' | 'current' | 'future';
  type: 'registration' | 'selection' | 'milestone' | 'learning' | 'assessment' | 'completion';
  description?: string;
}

export function useBatchTimeline(batchId: string | null) {
  const { data, error, isLoading } = useSWR<Batch>(
    batchId ? `/api/batches/${batchId}` : null
  );

  const generateTimeline = (batch: Batch | undefined): TimelineItem[] => {
    if (!batch) return [];

    const timeline: TimelineItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Helper function to determine status
    const getStatus = (date: string): 'completed' | 'current' | 'future' => {
      const itemDate = new Date(date);
      itemDate.setHours(0, 0, 0, 0);

      if (itemDate < today) return 'completed';
      if (itemDate.getTime() === today.getTime()) return 'current';
      return 'future';
    };

    // 1. Registration Phase
    if (batch.registration_start_date && batch.registration_end_date) {
      timeline.push({
        id: '1',
        title: 'Mendaftar Program',
        date: batch.registration_start_date,
        dateRange: `${formatDate(batch.registration_start_date)} - ${formatDate(batch.registration_end_date)}`,
        status: getStatus(batch.registration_start_date),
        type: 'registration',
        description: 'Periode pendaftaran program tahfidz'
      });
    }

    // 2. Selection Phase
    if (batch.selection_start_date && batch.selection_end_date) {
      timeline.push({
        id: '2',
        title: 'Seleksi',
        date: batch.selection_start_date,
        dateRange: `${formatDate(batch.selection_start_date)} - ${formatDate(batch.selection_end_date)}`,
        status: getStatus(batch.selection_start_date),
        type: 'selection',
        description: 'Tes lisan dan tertulis'
      });
    }

    // 3. Selection Results
    if (batch.selection_result_date) {
      timeline.push({
        id: '3',
        title: 'Lulus Seleksi',
        date: batch.selection_result_date,
        status: getStatus(batch.selection_result_date),
        type: 'milestone',
        description: 'Pengumuman hasil seleksi'
      });
    }

    // 4. Re-enrollment
    if (batch.re_enrollment_date) {
      timeline.push({
        id: '4',
        title: 'Mendaftar Ulang',
        date: batch.re_enrollment_date,
        status: getStatus(batch.re_enrollment_date),
        type: 'milestone',
        description: 'Konfirmasi daftar ulang'
      });
    }

    // 5. Opening Class
    if (batch.opening_class_date) {
      timeline.push({
        id: '5',
        title: 'Kelas Perdana Gabungan',
        date: batch.opening_class_date,
        status: getStatus(batch.opening_class_date),
        type: 'milestone',
        description: 'Kelas pembukaan bersama'
      });
    }

    // 6. First Week (Tashih)
    if (batch.first_week_start_date && batch.first_week_end_date) {
      timeline.push({
        id: '6',
        title: 'Proses pembelajaran (tashih)',
        date: batch.first_week_start_date,
        dateRange: `Pekan 1 (${formatDate(batch.first_week_start_date)} - ${formatDate(batch.first_week_end_date)})`,
        status: getStatus(batch.first_week_start_date),
        type: 'learning',
        description: 'Minggu pertama pembelajaran'
      });
    }

    // 7. Main Learning Period (Pekan 2-11)
    // Calculated from first_week_end_date to review_week_start_date
    if (batch.first_week_end_date && batch.review_week_start_date) {
      const week2Start = new Date(batch.first_week_end_date);
      week2Start.setDate(week2Start.getDate() + 1);

      const week11End = new Date(batch.review_week_start_date);
      week11End.setDate(week11End.getDate() - 1);

      timeline.push({
        id: '7',
        title: 'Proses pembelajaran',
        date: week2Start.toISOString().split('T')[0],
        dateRange: `Pekan 2-11 (${formatDate(week2Start.toISOString().split('T')[0])} - ${formatDate(week11End.toISOString().split('T')[0])})`,
        status: getStatus(week2Start.toISOString().split('T')[0]),
        type: 'learning',
        description: '10 minggu pembelajaran inti'
      });
    }

    // 8. Review Week (Muraja'ah)
    if (batch.review_week_start_date && batch.review_week_end_date) {
      timeline.push({
        id: '8',
        title: 'Pekan muraja\'ah',
        date: batch.review_week_start_date,
        dateRange: `Pekan 12 (${formatDate(batch.review_week_start_date)} - ${formatDate(batch.review_week_end_date)})`,
        status: getStatus(batch.review_week_start_date),
        type: 'learning',
        description: 'Minggu pengulangan dan persiapan ujian'
      });
    }

    // 9. Final Exam
    if (batch.final_exam_start_date && batch.final_exam_end_date) {
      timeline.push({
        id: '9',
        title: 'Ujian Akhir',
        date: batch.final_exam_start_date,
        dateRange: `Pekan 13 (${formatDate(batch.final_exam_start_date)} - ${formatDate(batch.final_exam_end_date)})`,
        status: getStatus(batch.final_exam_start_date),
        type: 'assessment',
        description: 'Ujian akhir tahfidz'
      });
    }

    // 10. Graduation
    if (batch.graduation_start_date && batch.graduation_end_date) {
      timeline.push({
        id: '10',
        title: 'Wisuda & Kelulusan',
        date: batch.graduation_start_date,
        dateRange: `Pekan 14 (${formatDate(batch.graduation_start_date)} - ${formatDate(batch.graduation_end_date)})`,
        status: getStatus(batch.graduation_start_date),
        type: 'completion',
        description: 'Wisuda dan pemberian sertifikat'
      });
    }

    return timeline;
  };

  return {
    batch: data,
    timeline: generateTimeline(data),
    isLoading,
    error
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
```

---

## 🔄 Phase 4: Refactor Perjalanan-Saya Page (NEXT)

### Changes to `app/(protected)/perjalanan-saya/page.tsx`

1. **Remove hardcoded `baseTimelineData`** (lines 103-236)
2. **Remove hardcoded date parsing** (lines 62-101)
3. **Add `useBatchTimeline` hook**
4. **Get batch_id from user registration**
5. **Use dynamic timeline from hook**

### Example Code Change

```typescript
// BEFORE (Hardcoded)
const baseTimelineData = [
  {
    id: '1',
    title: 'Mendaftar Program',
    date: '1-14 Desember 2025',
    // ... hardcoded data
  },
  // ... 9 more items
];

// AFTER (Dynamic)
import { useBatchTimeline } from '@/hooks/useBatchTimeline';

// In component:
const { registrations } = useMyRegistrations();
const batchId = registrations?.[0]?.batch_id || null;
const { timeline, isLoading, error } = useBatchTimeline(batchId);

// Use `timeline` instead of `baseTimelineData`
```

---

## 🔄 Phase 5: Admin UI for Timeline Configuration (NEXT)

### Create Admin Form Component

**File**: `app/(protected)/admin/batches/[id]/timeline/page.tsx`

Features:
1. Date picker for each timeline phase
2. Auto-calculation of learning weeks (Pekan 2-11)
3. Validation to ensure dates are in sequence
4. Preview timeline before saving
5. Bulk date adjustment (offset all dates by X days)

### Form Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Registration Start | Date | Yes | From existing batch |
| Registration End | Date | Yes | From existing batch |
| Selection Start | Date | Yes | Auto-set to reg_end + 1 day |
| Selection End | Date | Yes | |
| Selection Result | Date | Yes | |
| Re-enrollment | Date | Yes | |
| Opening Class | Date | Yes | Same as batch start_date |
| First Week Start | Date | Yes | |
| First Week End | Date | Yes | Auto-calculated (start + 6 days) |
| Review Week Start | Date | Yes | Auto-calculated (week 12) |
| Review Week End | Date | Yes | Auto-calculated |
| Final Exam Start | Date | Yes | Auto-calculated (week 13) |
| Final Exam End | Date | Yes | Auto-calculated |
| Graduation Start | Date | Yes | Auto-calculated (week 14) |
| Graduation End | Date | Yes | Same as batch end_date |

---

## Implementation Timeline

| Phase | Status | Files | Estimated Time |
|---|---|---|---|
| ✅ 1. Database Schema | Completed | SQL migration | - |
| ✅ 2. TypeScript Types | Completed | types/*.ts | - |
| 🔄 3. Custom Hook | **Next** | hooks/useBatchTimeline.ts | 1-2 hours |
| 🔄 4. Refactor Page | Pending | app/(protected)/perjalanan-saya/page.tsx | 2-3 hours |
| 🔄 5. Admin UI | Pending | app/(protected)/admin/batches/[id]/timeline/page.tsx | 3-4 hours |
| 🔄 6. Testing | Pending | - | 1-2 hours |
| 🔄 7. Documentation | Pending | README updates | 1 hour |

**Total Estimated Time**: 8-12 hours

---

## Database Migration Execution

### Step 1: Run Migration
```bash
psql -U postgres -d tikrarmti_production -f docs/batches_timeline_fields_migration.sql
```

### Step 2: Verify Schema
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'batches'
AND column_name LIKE '%date%'
ORDER BY ordinal_position;
```

### Step 3: Update Existing Batches (Optional)
```sql
-- Sample data for testing
UPDATE public.batches
SET
  selection_start_date = registration_end_date + INTERVAL '1 day',
  selection_end_date = registration_end_date + INTERVAL '14 days',
  selection_result_date = registration_end_date + INTERVAL '15 days',
  re_enrollment_date = registration_end_date + INTERVAL '16 days',
  opening_class_date = start_date,
  first_week_start_date = start_date,
  first_week_end_date = start_date + INTERVAL '6 days',
  review_week_start_date = start_date + INTERVAL '77 days',
  review_week_end_date = start_date + INTERVAL '83 days',
  final_exam_start_date = start_date + INTERVAL '84 days',
  final_exam_end_date = start_date + INTERVAL '90 days',
  graduation_start_date = start_date + INTERVAL '91 days',
  graduation_end_date = end_date
WHERE status IN ('draft', 'open');
```

---

## Benefits

1. ✅ **No more hardcoded dates** - Admin can configure per batch
2. ✅ **Flexible timeline** - Different batches can have different schedules
3. ✅ **Auto-calculated phases** - Learning weeks auto-calculated from duration
4. ✅ **Centralized configuration** - One place to manage all timeline data
5. ✅ **Better UX** - Students see accurate dates for their specific batch
6. ✅ **Scalable** - Easy to add new timeline phases in the future

---

## Next Steps

1. Create `hooks/useBatchTimeline.ts` ⏳
2. Refactor `perjalanan-saya/page.tsx` to use dynamic timeline ⏳
3. Create admin UI for timeline configuration ⏳
4. Test with real batch data ⏳
5. Update documentation ⏳

---

## Notes

- Hijri date conversion can be added later using external API (e.g., Aladhan API)
- Consider caching timeline calculation results for performance
- Add validation to ensure dates are in logical sequence
- Consider adding timeline templates for quick setup

---

Last Updated: 2024-12-25
Status: In Progress (Phase 2 completed, Phase 3 next)
