# Timeline Access Control Logic

## Overview
Sistem kontrol akses dinamis berdasarkan tanggal untuk timeline perjalanan-saya.

## Status Types

| Status | Warna | Kondisi | Action |
|---|---|---|---|
| `locked` 🔒 | Gray | Tanggal belum tiba | Disabled, tidak bisa diklik |
| `current` ⚡ | Yellow/Amber | Tanggal hari ini dalam range | **Enabled**, bisa diklik |
| `completed` ✅ | Teal/Green | Tanggal sudah lewat | Disabled (sudah selesai) |
| `future` ⏳ | Gray/Blue | Tanggal masih akan datang | Locked |

## Action Types

| Action Type | Use Case | Example |
|---|---|---|
| `link` | Navigasi ke halaman | Daftar, Seleksi, Tashih |
| `form` | Buka modal form | Konfirmasi daftar ulang |
| `button` | Trigger action | Download sertifikat |
| `none` | Hanya informasi | Milestone tanpa action |

## Timeline Items & Access Rules

### 1. Mendaftar Program (Registration)
```typescript
status: getStatus(registration_start_date, registration_end_date)
action.isEnabled: current date within range AND user not registered yet

Rules:
- locked: Sebelum registration_start_date
- current: Dalam range registration_start_date - registration_end_date
- completed: Setelah registration_end_date
- Disabled jika user sudah punya registrationStatus
```

### 2. Seleksi (Selection)
```typescript
status: locked if !hasRegistered, else getStatus(selection_start_date, selection_end_date)
action.isEnabled: current date within range AND user has approved registration

Rules:
- ALWAYS locked jika user belum terdaftar (registrationStatus !== 'approved')
- current: Dalam range selection dates DAN user approved
- Link ke /seleksi (halaman tes)
```

### 3. Lulus Seleksi (Selection Results)
```typescript
status: completed if selectionStatus === 'passed', else getStatus(selection_result_date)
action.isEnabled: current or completed (hasil sudah diumumkan)

Rules:
- locked: Sebelum selection_result_date
- current/completed: Pada atau setelah selection_result_date
- Link ke /seleksi/hasil
```

### 4. Mendaftar Ulang (Re-enrollment)
```typescript
status: locked if !hasPassed, else getStatus(re_enrollment_date)
action.isEnabled: current date === re_enrollment_date AND selectionStatus === 'passed'

Rules:
- ALWAYS locked jika user tidak lulus seleksi
- current: Pada tanggal re_enrollment_date
- Form konfirmasi (modal/page)
```

### 5. Kelas Perdana (Opening Class)
```typescript
status: getStatus(opening_class_date)
action.isEnabled: current date === opening_class_date

Rules:
- locked: Sebelum opening_class_date
- current: Pada opening_class_date
- completed: Setelah opening_class_date
- Link ke /kelas/perdana
```

### 6. Pekan 1 - Tashih (First Week)
```typescript
status: getStatus(first_week_start_date, first_week_end_date)
action.isEnabled: current date within week 1 range

Rules:
- locked: Sebelum first_week_start_date
- current: Dalam range week 1
- completed: Setelah first_week_end_date
- Link ke /tashih
```

### 7. Pekan 2-11 - Pembelajaran (Main Learning)
```typescript
status: getStatus(week2_start, week11_end)
action.isEnabled: current date within weeks 2-11 range

Rules:
- Calculated: week2_start = first_week_end_date + 1 day
- Calculated: week11_end = review_week_start_date - 1 day
- current: Dalam range 10 minggu pembelajaran
- Link ke /jurnal-harian
```

### 8. Pekan 12 - Muraja'ah (Review Week)
```typescript
status: getStatus(review_week_start_date, review_week_end_date)
action.isEnabled: current date within review week range

Rules:
- locked: Sebelum review_week_start_date
- current: Dalam range week 12
- completed: Setelah review_week_end_date
- Link ke /jurnal-harian (same as learning)
```

### 9. Pekan 13 - Ujian Akhir (Final Exam)
```typescript
status: getStatus(final_exam_start_date, final_exam_end_date)
action.isEnabled: current date within exam week range

Rules:
- locked: Sebelum final_exam_start_date
- current: Dalam range week 13
- completed: Setelah final_exam_end_date
- Link ke /ujian
```

### 10. Pekan 14 - Wisuda (Graduation)
```typescript
status: getStatus(graduation_start_date, graduation_end_date)
action.isEnabled: current date within graduation week range

Rules:
- locked: Sebelum graduation_start_date
- current: Dalam range week 14
- completed: Setelah graduation_end_date
- Link ke /wisuda
```

## Hook Usage Example

```typescript
import { useBatchTimeline } from '@/hooks/useBatchTimeline';

function PerjalananSayaPage() {
  const { user } = useAuth();
  const { registrations } = useMyRegistrations();

  const batchId = registrations?.[0]?.batch_id || null;
  const registrationStatus = registrations?.[0]?.status;
  const selectionStatus = registrations?.[0]?.selection_status;

  const { timeline, isLoading, batch } = useBatchTimeline(batchId, {
    userId: user?.id,
    registrationStatus,
    selectionStatus
  });

  return (
    <div>
      {timeline.map(item => (
        <TimelineItem
          key={item.id}
          title={item.title}
          date={item.dateRange || item.date}
          status={item.status}
          description={item.description}
        >
          {item.action && (
            item.action.isEnabled ? (
              <Link href={item.action.href}>
                <Button>{item.action.label}</Button>
              </Link>
            ) : (
              <Button disabled title={item.action.disabledReason}>
                {item.action.label}
              </Button>
            )
          )}
        </TimelineItem>
      ))}
    </div>
  );
}
```

## Visual Indicators

### Status Styling

```typescript
const getStatusStyle = (status: TimelineStatus) => {
  switch (status) {
    case 'locked':
      return 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-50';
    case 'current':
      return 'bg-yellow-100 border-yellow-500 text-yellow-900 ring-2 ring-yellow-400';
    case 'completed':
      return 'bg-teal-100 text-teal-900 border-teal-500';
    case 'future':
      return 'bg-blue-50 text-blue-700 border-blue-300';
  }
};
```

### Button Styling

```typescript
const getButtonStyle = (action: TimelineAction) => {
  if (!action.isEnabled) {
    return 'bg-gray-300 text-gray-500 cursor-not-allowed';
  }

  if (action.isAvailable) {
    return 'bg-green-600 hover:bg-green-700 text-white';
  }

  return 'bg-gray-400 text-gray-700';
};
```

## Date Comparison Logic

### getStatus() Function
```typescript
const getStatus = (startDate: string, endDate?: string): TimelineStatus => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to midnight

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = endDate ? new Date(endDate) : start;
  end.setHours(23, 59, 59, 999); // End of day

  if (today < start) return 'locked';        // Before start
  if (today > end) return 'completed';       // After end
  if (today >= start && today <= end) return 'current'; // Within range

  return 'future';
};
```

### isActionAvailable() Function
```typescript
const isActionAvailable = (startDate: string, endDate?: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = endDate ? new Date(endDate) : start;
  end.setHours(23, 59, 59, 999);

  return today >= start && today <= end;
};
```

## User Journey States

| User State | Phase 1 | Phase 2 | Phase 3 | Phase 4+ |
|---|---|---|---|---|
| **New User** | 🟢 Can register | 🔒 Locked | 🔒 Locked | 🔒 Locked |
| **Registered (pending)** | ✅ Registered | 🔒 Wait approval | 🔒 Locked | 🔒 Locked |
| **Approved** | ✅ Registered | 🟢 Can do selection | 🔒 Wait results | 🔒 Locked |
| **Passed Selection** | ✅ Registered | ✅ Passed | 🟢 Can confirm | 🔒 Locked |
| **Confirmed** | ✅ | ✅ | ✅ | 🟢 Can access learning |

## Error Handling

```typescript
if (isLoading) {
  return <TimelineSkeleton />;
}

if (error) {
  return <ErrorMessage message="Gagal memuat timeline" />;
}

if (isEmpty) {
  return <EmptyState message="Data batch tidak tersedia" />;
}
```

## Benefits

1. ✅ **Automatic Access Control** - Forms/links auto-enable based on date
2. ✅ **User State Aware** - Different access for different user stages
3. ✅ **Clear Feedback** - Disabled reasons shown in tooltips
4. ✅ **Prevents Premature Access** - Users can't access future phases
5. ✅ **Prevents Late Submission** - Past deadlines are locked
6. ✅ **Dynamic** - No hardcoded dates, all from batch config

---

Last Updated: 2024-12-25
