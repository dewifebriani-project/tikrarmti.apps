# Perjalanan-Saya Refactoring Guide

## Overview
Panduan lengkap untuk me-refactor halaman perjalanan-saya dari hardcoded timeline menjadi dynamic menggunakan `useBatchTimeline` hook.

---

## Current File Structure

**File**: `app/(protected)/perjalanan-saya/page.tsx`
**Lines**: 862 lines
**Status**: Fully hardcoded with dates from Dec 2025 - Apr 2026

### Current Implementation

```typescript
// Lines 103-236: Hardcoded timeline data
const baseTimelineData: TimelineItem[] = [
  {
    id: 1,
    date: '1 - 14 Desember 2025',  // HARDCODED
    day: 'Senin - Ahad',           // HARDCODED
    hijriDate: '6 - 19 Jumadil Akhir 1446',  // HARDCODED
    title: 'Mendaftar Program',
    description: 'Pendaftaran awal program tahfidz',
    icon: <svg>...</svg>
  },
  // ... 9 more hardcoded items
];

// Lines 62-101: Hardcoded date parsing
const parseIndonesianDate = (dateStr: string): Date => {
  if (dateStr.includes('Pekan')) {
    if (dateStr.includes('1')) return new Date('2026-01-12');  // HARDCODED
    // ... more hardcoded dates
  }
  // ...
};

// Lines 239-283: Status calculation
const timelineData = useMemo(() => {
  return baseTimelineData.map((item, index) => {
    const itemDate = parseIndonesianDate(item.date);  // Uses hardcoded data
    // ... status logic
  });
}, [isClient, registrationStatus]);
```

---

## Step-by-Step Refactoring Plan

### Step 1: Add useBatchTimeline Import

**File**: `app/(protected)/perjalanan-saya/page.tsx`
**Line**: Add after line 7

```typescript
// BEFORE (Line 7)
import { useDashboardStats, useLearningJourney, useUserProgress } from '@/hooks/useDashboard';

// AFTER
import { useDashboardStats, useLearningJourney, useUserProgress } from '@/hooks/useDashboard';
import { useBatchTimeline } from '@/hooks/useBatchTimeline';  // ADD THIS
```

### Step 2: Remove Hardcoded Timeline Interface

**File**: `app/(protected)/perjalanan-saya/page.tsx`
**Lines**: 13-26

```typescript
// REMOVE THIS (Lines 13-26)
interface TimelineItem {
  id: number;
  date: string;
  day: string;
  hijriDate: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  hasSelectionTasks?: boolean;
}

interface TimelineItemWithStatus extends TimelineItem {
  status: 'completed' | 'current' | 'future';
}

// REPLACE WITH (import from hook types)
import { TimelineItem, TimelineStatus } from '@/hooks/useBatchTimeline';
```

### Step 3: Remove Hardcoded Date Parser

**File**: `app/(protected)/perjalanan-saya/page.tsx`
**Lines**: 62-101

```typescript
// DELETE ENTIRE FUNCTION (Lines 62-101)
const parseIndonesianDate = (dateStr: string): Date => {
  // ... 40 lines of hardcoded date parsing
};
```

**Reason**: Hook automatically formats dates

### Step 4: Remove Hardcoded baseTimelineData

**File**: `app/(protected)/perjalanan-saya/page.tsx`
**Lines**: 103-236

```typescript
// DELETE ENTIRE ARRAY (Lines 103-236)
const baseTimelineData: TimelineItem[] = [
  // ... 10 hardcoded timeline items (~130 lines)
];
```

**Reason**: Hook generates timeline from batch data

### Step 5: Add useBatchTimeline Hook Call

**File**: `app/(protected)/perjalanan-saya/page.tsx`
**Line**: After line 55 (after isLoading definition)

```typescript
// BEFORE (Line 55)
const isLoading = authLoading || registrationsLoading;

// AFTER
const isLoading = authLoading || registrationsLoading;

// ADD THESE LINES
// Get batch_id from user's registration
const batchId = registrations?.[0]?.batch_id || null;
const selectionStatus = registrations?.[0]?.selection_status as 'pending' | 'passed' | 'failed' | undefined;

// Use batch timeline hook
const { timeline, isLoading: timelineLoading, error: timelineError, batch } = useBatchTimeline(
  batchId,
  {
    userId: user?.id,
    registrationStatus: registrationStatus.registration?.status,
    selectionStatus
  }
);

// Update isLoading to include timeline loading
const isLoading = authLoading || registrationsLoading || timelineLoading;
```

### Step 6: Remove Manual Timeline Status Calculation

**File**: `app/(protected)/perjalanan-saya/page.tsx`
**Lines**: 238-283

```typescript
// DELETE ENTIRE useMemo (Lines 238-283)
const timelineData = useMemo((): TimelineItemWithStatus[] => {
  // ... manual status calculation (~45 lines)
}, [isClient, registrationStatus]);

// REPLACE WITH
// Timeline data now comes directly from the hook
// Just use: timeline (already has status calculated)
```

### Step 7: Update Timeline Rendering to Use New Data Structure

**File**: `app/(protected)/perjalanan-saya/page.tsx`
**Lines**: 462-596 (Mobile view) and 601-748 (Desktop view)

#### Current Structure:
```typescript
{timelineData.map((item) => {
  const styles = getStatusStyles(item.status);
  return (
    <Card key={item.id} className={...}>
      <CardContent>
        <div className="flex items-start space-x-3">
          <div className={`icon ${styles.iconBg}`}>
            {item.icon}  // Old: React element icon
          </div>
          <div>
            <div>{item.day} • {item.date}</div>  // Old: hardcoded format
            <h3>{item.title}</h3>
            <p>{item.description}</p>

            {/* Special handling for registration */}
            {item.id === 1 && registrationStatus?.hasRegistered ? (
              // ... registration info
            ) : item.hasSelectionTasks ? (
              // ... selection tasks
            ) : (
              <p>{item.description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
})}
```

#### New Structure:
```typescript
{timeline.map((item) => {
  const styles = getStatusStyles(item.status);

  // Map timeline type to icon
  const getIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return (<svg>...</svg>);  // Registration icon
      case 'selection':
        return (<svg>...</svg>);  // Selection icon
      case 'milestone':
        return (<svg>...</svg>);  // Milestone icon
      case 'learning':
        return (<svg>...</svg>);  // Learning icon
      case 'assessment':
        return (<svg>...</svg>);  // Assessment icon
      case 'completion':
        return (<svg>...</svg>);  // Completion icon
      default:
        return (<svg>...</svg>);
    }
  };

  return (
    <Card key={item.id} className={...}>
      <CardContent>
        <div className="flex items-start space-x-3">
          <div className={`icon ${styles.iconBg}`}>
            {getIcon(item.type)}  // New: dynamic icon based on type
          </div>
          <div>
            <div>{item.dateRange || item.date}</div>  // New: from hook
            {item.hijriDate && <span>{item.hijriDate}</span>}
            <h3>{item.title}</h3>
            <p>{item.description}</p>

            {/* Action button/link if available */}
            {item.action && (
              item.action.isEnabled ? (
                <Link href={item.action.href || '#'}>
                  <Button>{item.action.label}</Button>
                </Link>
              ) : (
                <Button disabled title={item.action.disabledReason}>
                  {item.action.label}
                </Button>
              )
            )}

            {/* Special handling for selection phase */}
            {item.type === 'selection' && registrationStatus?.registration?.status === 'approved' ? (
              // ... selection tasks UI
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
})}
```

### Step 8: Update Progress Calculation

**File**: `app/(protected)/perjalanan-saya/page.tsx`
**Lines**: 314-316

```typescript
// BEFORE
const completedCount = timelineData.filter(item => item.status === 'completed').length;
const totalCount = timelineData.length;

// AFTER
const completedCount = timeline.filter(item => item.status === 'completed').length;
const totalCount = timeline.length;
```

### Step 9: Add Error Handling for Missing Batch Data

**File**: `app/(protected)/perjalanan-saya/page.tsx`
**Line**: After isClient check (around line 325)

```typescript
// ADD THIS
if (timelineError) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <AlertCircle className="w-16 h-16 text-red-500" />
      <h2 className="text-xl font-bold text-gray-800">Gagal Memuat Timeline</h2>
      <p className="text-gray-600">Terjadi kesalahan saat memuat data timeline</p>
      <Button onClick={() => window.location.reload()}>Muat Ulang</Button>
    </div>
  );
}

if (!batch || timeline.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Calendar className="w-16 h-16 text-gray-400" />
      <h2 className="text-xl font-bold text-gray-800">Timeline Belum Tersedia</h2>
      <p className="text-gray-600">
        Data timeline untuk batch Anda belum dikonfigurasi oleh admin.
      </p>
      <p className="text-sm text-gray-500">
        Batch ID: {batchId || 'Tidak ada'}
      </p>
    </div>
  );
}
```

### Step 10: Update getStatusStyles Function

**File**: `app/(protected)/perjalanan-saya/page.tsx`
**Lines**: 285-312

```typescript
// BEFORE
const getStatusStyles = (status: 'completed' | 'current' | 'future') => {
  // ... only 3 statuses
};

// AFTER
const getStatusStyles = (status: 'completed' | 'current' | 'future' | 'locked') => {
  switch (status) {
    case 'completed':
      return {
        iconBg: 'bg-teal-100',
        iconColor: 'text-teal-600',
        cardBorder: 'border-l-4 border-l-teal-500',
        cardBg: 'bg-white',
        textColor: 'text-gray-800'
      };
    case 'current':
      return {
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        cardBorder: 'border-l-4 border-l-yellow-500',
        cardBg: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300 shadow-lg',
        textColor: 'text-gray-900'
      };
    case 'locked':  // ADD THIS
      return {
        iconBg: 'bg-gray-200',
        iconColor: 'text-gray-400',
        cardBorder: 'border-l-4 border-l-gray-300',
        cardBg: 'bg-gray-100 opacity-60',
        textColor: 'text-gray-400'
      };
    case 'future':
      return {
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-400',
        cardBorder: 'border-l-4 border-l-gray-300',
        cardBg: 'bg-gray-50',
        textColor: 'text-gray-500'
      };
  }
};
```

---

## Icon Mapping Helper Function

Add this helper function to map timeline types to icons:

```typescript
const getTimelineIcon = (type: string) => {
  const iconClass = "w-5 h-5";

  switch (type) {
    case 'registration':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'selection':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case 'milestone':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'learning':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'assessment':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'completion':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};
```

---

## Summary of Changes

| Section | Lines | Action | Impact |
|---|---|---|---|
| Imports | 7 | Add useBatchTimeline | +1 line |
| Interfaces | 13-26 | Remove/Replace | -14 lines, +2 lines |
| parseIndonesianDate | 62-101 | Delete | -40 lines |
| baseTimelineData | 103-236 | Delete | -134 lines |
| Hook calls | 55 | Add useBatchTimeline | +10 lines |
| timelineData useMemo | 238-283 | Delete | -46 lines |
| getStatusStyles | 285-312 | Update (add 'locked') | +8 lines |
| Timeline rendering | 462-596, 601-748 | Update to use new structure | Modified |
| Error handling | 325 | Add | +30 lines |
| Icon helper | New | Add function | +80 lines |

**Total**: ~234 lines removed, ~131 lines added
**Net**: ~103 lines reduction + cleaner code

---

## Testing Checklist

After refactoring, test these scenarios:

- [ ] Timeline loads correctly with batch data
- [ ] Timeline shows "locked" status for future dates
- [ ] Timeline shows "current" status for today's date
- [ ] Timeline shows "completed" status for past dates
- [ ] Registration button enabled/disabled based on dates
- [ ] Selection phase locked until registration approved
- [ ] Action buttons show correct hrefs and labels
- [ ] Disabled buttons show tooltip with reason
- [ ] Error state shows when batch data unavailable
- [ ] Empty state shows when no batch assigned
- [ ] Progress bar calculates correctly
- [ ] Mobile and desktop views both work
- [ ] Loading state shows while fetching data

---

## Rollback Plan

If issues occur:

```bash
# Restore backup
cp app/(protected)/perjalanan-saya/page.tsx.backup app/(protected)/perjalanan-saya/page.tsx

# Or use git
git checkout app/(protected)/perjalanan-saya/page.tsx
```

---

## Next Steps After Refactoring

1. Run SQL migration to add timeline fields to batches table
2. Update active batch in database with timeline dates
3. Test on staging environment first
4. Create admin UI to configure timeline (Phase 5)
5. Add Hijri date conversion API integration (optional)
6. Monitor error logs for any issues

---

Last Updated: 2024-12-25
Status: Ready for implementation
Estimated Time: 2-3 hours
Risk Level: Medium (large file, many UI dependencies)
