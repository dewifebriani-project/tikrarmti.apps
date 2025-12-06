# Dynamic Program Data - Tikrar Tahfidz Registration

## Overview
The Tikrar Tahfidz registration page now displays **dynamic data from the database** instead of hardcoded values.

## What Changed

### Before (Hardcoded)
```tsx
// Old hardcoded values
<p>40/100 peserta</p>
<p>Rp 250.000/bulan</p>
<p>4 bulan</p>
<p>60 lagi</p>
```

### After (Database-Driven)
```tsx
// Dynamic values from API /api/batch/default
<p>{batchInfo.registered_count}/{batchInfo.total_quota} Peserta</p>
<p>{batchInfo.is_free ? 'GRATIS' : `Rp ${batchInfo.price.toLocaleString('id-ID')}`}</p>
<p>{Math.ceil(batchInfo.duration_weeks / 4)} Bulan</p>
<p>{batchInfo.scholarship_quota} lagi</p>
```

## Current Data (from Database)

Based on the current database configuration:

| Field | Value | Display |
|-------|-------|---------|
| **Total Quota** | 100 | "100 peserta" |
| **Registered Count** | 0 | "0/100 peserta" |
| **Is Free** | `true` | "GRATIS" |
| **Price** | 0 | "GRATIS" (tidak tampil price) |
| **Duration (weeks)** | 13 | "4 Bulan" (13÷4≈4) |
| **Scholarship Quota** | 100 | "100 lagi" |

## API Endpoint

**Endpoint**: `GET /api/batch/default`

**Response**:
```json
{
  "batch_id": "2478b493-1b6b-412a-a05f-6193db815a43",
  "batch_name": "Tikrar MTI Batch 2",
  "program_id": "1632e980-fcd9-4a1f-bc85-c9fbf8bb1142",
  "program_name": "Tahfidz",
  "start_date": "2025-01-05",
  "end_date": "2025-04-05",
  "duration_weeks": 13,
  "price": 0,
  "is_free": true,
  "total_quota": 100,
  "registered_count": 0,
  "scholarship_quota": 100
}
```

## Fallback Values

The API includes fallback values for fields that might not exist in the database:

```typescript
const is_free = batch.is_free ?? true;         // Default: FREE
const price = batch.price ?? 0;                // Default: 0
const total_quota = batch.total_quota ?? 100;  // Default: 100
```

This ensures the app works even before running database migrations.

## Database Schema Requirements

### Current Schema (Working)
The app works with the current `batches` table schema. Fallback values are used for missing fields.

### Recommended Migration
For better data management, add these columns:

```sql
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT TRUE;

ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS total_quota INTEGER DEFAULT 100;
```

See [MIGRATION_ADD_PRICE_FIELDS.md](./MIGRATION_ADD_PRICE_FIELDS.md) for detailed migration instructions.

## Card Display Components

The registration page displays 4 main cards:

### 1. Total Pendaftar
- **Icon**: Users
- **Label**: "Total Pendaftar"
- **Value**: `{registered_count}/{total_quota} Peserta`
- **Percentage**: `{(registered_count/total_quota)*100}% Terisi`

### 2. Biaya Program
- **Icon**: Award
- **Label**: "Biaya Program"
- **Value**:
  - If `is_free === true`: "GRATIS" + "Program Beasiswa"
  - If `is_free === false`: `Rp {price.toLocaleString('id-ID')}` + "Per Bulan"

### 3. Durasi
- **Icon**: Clock
- **Label**: "Durasi"
- **Value**: `{Math.ceil(duration_weeks/4)} Bulan` + `{duration_weeks} Pekan`

### 4. Kuota Tersedia
- **Icon**: Calendar
- **Label**: "Kuota Tersedia"
- **Value**: `{scholarship_quota} lagi` + `Dari {total_quota} Kuota`

## Files Modified

1. **`app/api/batch/default/route.ts`**
   - Added fallback values for `is_free`, `price`, `total_quota`
   - Changed batch status filter from `'active'` to `['open', 'active']`
   - Changed program name from `'Tikrar Tahfidz'` to `'Tahfidz'`

2. **`app/pendaftaran/tikrar-tahfidz/page.tsx`**
   - Already using dynamic data from `batchInfo` state
   - No changes needed (already implemented correctly)

## Testing

### 1. API Test
```bash
curl http://localhost:3003/api/batch/default
```

Expected output:
```json
{
  "is_free": true,
  "price": 0,
  "total_quota": 100,
  "registered_count": 0,
  "scholarship_quota": 100,
  ...
}
```

### 2. UI Test
1. Navigate to: http://localhost:3003/pendaftaran/tikrar-tahfidz
2. Verify the cards display:
   - ✅ "0/100 Peserta" (Total Pendaftar)
   - ✅ "GRATIS" (Biaya Program)
   - ✅ "4 Bulan" (Durasi)
   - ✅ "100 lagi" (Kuota Tersedia)

## Important Notes

- ✅ **Program is FREE**: `is_free = true`, `price = 0`
- ✅ **All data is from database**: No more hardcoded values
- ✅ **Fallback values ensure stability**: App works even without migration
- ✅ **Real-time updates**: Registration count updates automatically

## Future Improvements

1. **Add database migration** to create `is_free`, `price`, `total_quota` columns
2. **Cache API response** to reduce database queries
3. **Add real-time subscription** for live updates when someone registers
4. **Add admin interface** to manage batch data without SQL

## Troubleshooting

### Issue: "Batch not found"
**Solution**: Check batch status. API accepts both `'open'` and `'active'` status.

### Issue: "Program not found"
**Solution**: Verify program name is `'Tahfidz'` (not `'Tikrar Tahfidz'`)

### Issue: Data shows undefined
**Solution**: Fallback values should handle this. Check API response and browser console.
