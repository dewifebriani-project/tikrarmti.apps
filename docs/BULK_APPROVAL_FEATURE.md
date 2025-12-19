# Bulk Approval Feature - Tikrar Tahfidz

## Overview
Fitur approval massal (bulk approval) memungkinkan admin untuk menyetujui atau menolak beberapa aplikasi Tikrar Tahfidz sekaligus dalam satu tindakan, meningkatkan efisiensi proses review.

## Features

### 1. Checkbox Selection
- **Select All**: Checkbox di header tabel untuk memilih semua aplikasi pending di halaman saat ini
- **Individual Selection**: Checkbox di setiap baris untuk memilih aplikasi satu per satu
- **Indeterminate State**: Checkbox header menunjukkan state indeterminate ketika sebagian aplikasi dipilih
- **Only Pending**: Hanya aplikasi dengan status "pending" yang dapat dipilih

### 2. Bulk Action Buttons
Ketika ada aplikasi yang dipilih, panel action akan muncul dengan:
- **Approve Selected**: Menyetujui semua aplikasi yang dipilih
- **Reject Selected**: Menolak semua aplikasi yang dipilih
- **Clear Selection**: Membatalkan semua pilihan

### 3. Confirmation Modal
Sebelum melakukan bulk action, modal konfirmasi akan muncul dengan:
- Jumlah aplikasi yang akan diproses
- Warning bahwa action tidak dapat dibatalkan
- Untuk reject: Form optional untuk memasukkan alasan penolakan
- Tombol konfirmasi dan cancel

### 4. Processing Feedback
- Loading state pada tombol saat proses berlangsung
- Disable buttons untuk mencegah double-submit
- Alert sukses dengan jumlah aplikasi yang berhasil diproses
- Error handling dengan pesan yang jelas

## Technical Implementation

### API Endpoint
**POST** `/api/admin/tikrar/bulk-approve`

#### Request Body
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "action": "approve" | "reject",
  "rejectionReason": "optional reason for rejection"
}
```

#### Response
```json
{
  "success": true,
  "updatedCount": 3,
  "data": [...]
}
```

#### Error Response
```json
{
  "error": "Error message"
}
```

### Security
- ✅ Admin-only access (role check)
- ✅ Authentication required (session validation)
- ✅ Only updates pending applications (status check in query)
- ✅ Uses Supabase admin client to bypass RLS
- ✅ Audit trail: `approved_by` field stores admin ID

### Database Updates
For each selected application:
```sql
UPDATE pendaftaran_tikrar_tahfidz
SET
  status = 'approved' | 'rejected',
  approved_by = admin_user_id,
  approved_at = current_timestamp,
  updated_at = current_timestamp,
  rejection_reason = 'reason' (if rejecting)
WHERE
  id IN (selected_ids)
  AND status = 'pending'
```

## User Experience

### Workflow
1. Admin navigates to Admin Panel → Tikrar tab
2. Filter applications by batch if needed (optional)
3. Click checkbox di header untuk select all, atau pilih individual aplikasi
4. Panel "X application(s) selected" muncul dengan action buttons
5. Click "Approve Selected" atau "Reject Selected"
6. Modal konfirmasi muncul
7. Untuk reject: isi alasan (optional)
8. Click "Yes, approve/reject" untuk konfirmasi
9. Processing indicator muncul
10. Success alert dengan jumlah aplikasi yang diproses
11. Table refresh otomatis dengan data terbaru
12. Selection di-clear

### UI States
- **No Selection**: Checkboxes available, no action panel
- **Some Selected**: Action panel visible, clear selection option available
- **All Selected**: Header checkbox checked, action panel visible
- **Processing**: Buttons disabled, loading text shown
- **Error**: Alert shown, selection maintained untuk retry

## Files Modified

### Backend
- `app/api/admin/tikrar/bulk-approve/route.ts` (NEW)
  - Bulk approval API endpoint
  - Authentication & authorization
  - Batch database update

### Frontend
- `app/admin/page.tsx` (MODIFIED)
  - TikrarTab component updated
  - Selection state management
  - Bulk action handlers
  - Checkbox column added
  - Bulk action UI components
  - Confirmation modal

## Testing Checklist

- [ ] Select individual applications
- [ ] Select all applications dengan header checkbox
- [ ] Clear selection
- [ ] Bulk approve multiple applications
- [ ] Bulk reject multiple applications
- [ ] Bulk reject dengan rejection reason
- [ ] Modal konfirmasi berfungsi
- [ ] Cancel pada modal
- [ ] Table refresh setelah bulk action
- [ ] Error handling
- [ ] Only pending applications selectable
- [ ] Selection cleared after successful action
- [ ] Pagination tidak reset selection di page lain
- [ ] Batch filter bekerja dengan selection

## Performance Considerations

- Single database query untuk update multiple records
- Efficient state management dengan React hooks
- No unnecessary re-renders
- Optimistic UI tidak digunakan untuk safety (menunggu konfirmasi server)

## Future Enhancements (Optional)

1. **Persistent Selection Across Pages**: Maintain selection ketika berpindah halaman
2. **Select All Across All Pages**: Option untuk select semua pending applications, tidak hanya di current page
3. **Batch Notes**: Tambahkan catatan khusus untuk setiap batch approval
4. **Undo Action**: Kemampuan untuk undo bulk approval dalam waktu tertentu
5. **Email Notification**: Kirim email otomatis ke applicants setelah bulk approval/rejection
6. **Export Selected**: Export data aplikasi yang dipilih ke CSV/Excel
7. **Advanced Filters**: Filter by juz, program, submission date range, dll sebelum bulk select

## Support

Untuk pertanyaan atau bug reports, silakan hubungi tim development.
