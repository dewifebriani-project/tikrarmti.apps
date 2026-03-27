# Implementation Plan - Admin2 Requests

**Project:** TikrarMTI.Apps  
**Date:** March 2026  
**Status:** Planning Phase

---

## 📊 Feature Status Summary

| No | Fitur | Status | Priority | Est. Days |
|----|-------|--------|----------|-----------|
| 1 | Search by nomor HP di tabel users | ✅ Completed | - | - |
| 2 | Database daftar ulang lengkap (Rekap Perjalanan) | ✅ Completed | - | - |
| 3 | Admin, Muallimah, Thobibah bisa edit profile | ✅ Completed | HIGH | 3 |
| 4 | Pilihan daftar ulang pasangan (Batch 3) - toleransi Juz/Zona/Waktu | ⏳ To Do | HIGH | 5 |
| 5 | Fitur Blacklist (No HP & Email sama tidak bisa daftar) | ✅ Completed | HIGH | 3 |
| 6 | Nonaktifkan/Aktifkan pilihan "ujian saja" untuk Muallimah | ⏳ To Do | MEDIUM | 2 |
| 7 | Alumni wajib isi testimoni sebelum daftar Batch 3 | ⏳ To Do | HIGH | 2 |
| 8 | Reset Password di tab users | ✅ Completed | - | - |
| 9 | Admin lihat form pendaftaran Muallimah | 🔜 In Progress | HIGH | 2 |
| 10 | Muallimah bisa edit pendaftaran | 🔜 In Progress | HIGH | 2 |
| 11 | SP otomatis terbit | ✅ Completed | - | - |
| 12 | Fitur "Ingat Saya" (Remember Me) | ✅ Completed | - | - |
| 13 | Formulir diinput oleh admin | ⏳ To Do | MEDIUM | 3 |
| 14 | Simulasi Batch 3 | ⏳ To Do | MEDIUM | 5 |
| 15 | Broadcast Message Reminder (sesuai kekurangan blok) | ⏳ To Do | MEDIUM | 4 |
| 16 | Hapus nama Thalibah yang sudah Blacklist | ⏳ To Do | MEDIUM | 2 |
| 17 | UI Mobile untuk menu utama (sidebar khusus admin) | ⏳ To Do | MEDIUM | 4 |
| 18 | Cek & perbaiki fitur lupa password | ⏳ To Do | HIGH | 2 |

---

## 🎯 Implementation Phases

### **PHASE 1: Bug Fixes & Small Features** (Week 1 - 2)
**Target:** Fix critical issues & implement quick wins

#### 1.1 Lupa Password - Bug Fix
- **Status:** ⏳ To Do
- **Priority:** HIGH
- **Est. Time:** 2 days
- **Tasks:**
  - [ ] Analisis error logs untuk fitur lupa password
  - [ ] Cek flow reset password di email service
  - [ ] Test di environment prod (sandbox)
  - [ ] Deploy & monitor
- **Files to Check:**
  - `app/forgot-password/`
  - `app/reset-password/`
  - API endpoints untuk reset password

#### 1.2 Admin, Muallimah, Thobibah Edit Profile
- **Status:** ✅ Completed (2025-03-25)
- **Priority:** HIGH
- **Est. Time:** 3 days
- **Tasks:**
  - [x] Buat/extend `ProfileEditModal` component untuk semua roles
  - [x] Setup RLS policies di database
  - [x] Implement edit endpoints untuk setiap role
  - [x] Add validation & error handling
  - [x] Test perubahan data tidak keluar dari scope user
- **Database Changes:**
  - [x] Verify RLS on `users`, `muallimah_registrations`, `musyrifah_registrations` tables
  - [x] Add admin policies for musyrifah_registrations
  - [ ] Add audit logs untuk perubahan profile (future enhancement)
- **Files Modified:**
  - `app/(protected)/profile/page.tsx` - Added role-specific sections for Muallimah and Musyrifah
  - `app/api/user/profile/route.ts` - Added role-specific data to GET response
  - `app/api/user/profile/update/route.ts` - Added role-specific update logic
  - `supabase/migrations/20260325_add_musyrifah_registrations_admin_policies.sql` - New migration

#### 1.3 Nonaktifkan/Aktifkan "Ujian Saja" untuk Muallimah
- **Status:** ⏳ To Do
- **Priority:** MEDIUM
- **Est. Time:** 2 days
- **Tasks:**
  - [ ] Add `exam_only_enabled` flag ke table muallimah
  - [ ] Create admin UI toggle untuk setting ini
  - [ ] Implement logic di exam flow
- **Database Changes:**
  - `ALTER TABLE muallimah ADD COLUMN exam_only_enabled BOOLEAN DEFAULT true;`
- **Files to Modify:**
  - `components/AdminExamSettings.tsx`
  - `app/api/exam/` endpoints

#### 1.4 Hapus Thalibah yang Sudah Blacklist
- **Status:** ⏳ To Do
- **Priority:** MEDIUM
- **Est. Time:** 2 days
- **Tasks:**
  - [ ] Create admin UI untuk bulk delete blacklisted users
  - [ ] Add soft-delete logic (mark as deleted, jangan hard delete)
  - [ ] Implement audit trail
- **Database Changes:**
  - `ALTER TABLE thalibah ADD COLUMN deleted_at TIMESTAMP NULL;`
  - Add RLS policy untuk filter deleted users
- **Files to Modify:**
  - `components/AdminDataTable.tsx`
  - `app/api/users/delete`

---

### **PHASE 2: Core Features** (Week 2 - 4)
**Target:** Implement fitur-fitur utama yang kompleks

#### 2.1 Fitur Blacklist (No HP & Email duplikat)
- **Status:** ✅ Completed (2025-03-25)
- **Priority:** HIGH
- **Est. Time:** 3 days
- **Tasks:**
  - [x] Database migration: add `blacklist_reason`, `blacklisted_at` columns
  - [x] Create blacklist management UI di Admin Panel
  - [x] Implement validation saat registrasi (cek no HP & email di blacklist)
  - [x] Add whitelist feature (khusus exception) - via Remove action
  - [x] Create audit log untuk blacklist actions
- **Database Changes:**
  ```sql
  ALTER TABLE users ADD COLUMN is_blacklisted BOOLEAN DEFAULT false;
  ALTER TABLE users ADD COLUMN blacklist_reason TEXT;
  ALTER TABLE users ADD COLUMN blacklisted_at TIMESTAMP;
  ALTER TABLE users ADD COLUMN blacklist_notes TEXT;
  ALTER TABLE users ADD COLUMN blacklist_by UUID;
  ```
- **Files Created:**
  - `components/AdminBlacklistTab.tsx`
  - `app/api/blacklist/route.ts` (list, add)
  - `app/api/blacklist/[id]/route.ts` (get details, remove)
  - `app/api/blacklist/check/route.ts` (validation endpoint)
  - `supabase/migrations/20260325_add_blacklist_feature.sql`
- **Files Modified:**
  - `app/api/auth/register/route.ts` (add blacklist check)
  - `app/(protected)/admin/page.tsx` (add blacklist tab)

#### 2.2 Alumni Wajib Isi Testimoni sebelum Batch 3
- **Status:** ⏳ To Do
- **Priority:** HIGH
- **Est. Time:** 2 days
- **Tasks:**
  - [ ] Add validation step di enrollment flow untuk alumni
  - [ ] Create mandatory testimonial form modal
  - [ ] Add flag di database `testimonial_completed`
  - [ ] Block enrollment jika testimonial belum diisi
- **Database Changes:**
  - `ALTER TABLE alumni ADD COLUMN testimonial_text TEXT;`
  - `ALTER TABLE alumni ADD COLUMN testimonial_submitted_at TIMESTAMP;`
- **Files to Create:**
  - `components/MandatoryTestimonialModal.tsx`
- **Files to Modify:**
  - `app/register/` enrollment flow
  - `components/TestimonialSlider.tsx` (extend untuk mandatory input)

#### 2.3 Admin Lihat & Muallimah Edit Form Pendaftaran (🔜 In Progress)
- **Status:** 🔜 In Progress (50%)
- **Priority:** HIGH
- **Est. Time:** 2 days
- **Tasks:**
  - [ ] Complete admin view untuk form pendaftaran muallimah
  - [ ] Create approval workflow (admin bisa approve/reject/request revision)
  - [ ] Enable muallimah untuk edit submitted form
  - [ ] Add versioning untuk form history
  - [ ] Create notifications saat form diubah admin
- **Database Changes:**
  - `ALTER TABLE muallimah_registration ADD COLUMN status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected');`
  - `ALTER TABLE muallimah_registration ADD COLUMN admin_notes TEXT;`
  - `ALTER TABLE muallimah_registration ADD COLUMN version INTEGER DEFAULT 1;`
- **Files to Create:**
  - `components/AdminMuallimahRegistrationTab.tsx`
  - `components/MuallimahEditRegistrationModal.tsx`
- **Files to Modify:**
  - `app/api/muallimah-registration/`
  - Admin panel components

#### 2.4 Formulir Pendaftaran Diinput Oleh Admin
- **Status:** ⏳ To Do
- **Priority:** MEDIUM
- **Est. Time:** 3 days
- **Tasks:**
  - [ ] Create admin form entry UI untuk registrasi (users/thalibah/muallimah)
  - [ ] Add role-based form templates
  - [ ] Implement validation & duplicate check
  - [ ] Auto-generate password/username
  - [ ] Send credentials ke user via email
- **Files to Create:**
  - `components/AdminFormEntryModal.tsx`
  - `app/api/admin/form-entry/` endpoints
- **Files to Modify:**
  - `components/UserCreateModal.tsx`
  - `app/api/users/create`

---

### **PHASE 3: Advanced Features** (Week 4 - 5)
**Target:** Fitur-fitur complex dan batch processing

#### 3.1 Daftar Ulang Pasangan Batch 3 (Toleransi Juz/Zona/Waktu)
- **Status:** ⏳ To Do
- **Priority:** HIGH
- **Est. Time:** 5 days
- **Tasks:**
  - [ ] Database design untuk candidate pairing dengan score algorithm
  - [ ] Create matching algorithm (Juz, Zona, Time preferences)
  - [ ] Build admin UI untuk manage pairing options & tolerances
  - [ ] Implement enrollment flow dengan pasangan suggestion
  - [ ] Create report untuk unmatched candidates
  - [ ] Test dengan sample data batch 3
- **Database Changes:**
  ```sql
  ALTER TABLE enrollment_batch_3 ADD COLUMN partner_id UUID REFERENCES users(id);
  ALTER TABLE enrollment_batch_3 ADD COLUMN pairing_score DECIMAL;
  ALTER TABLE enrollment_batch_3 ADD COLUMN pairing_preferences JSONB;
  ALTER TABLE enrollment_settings ADD COLUMN tolerance_juz_diff BOOLEAN;
  ALTER TABLE enrollment_settings ADD COLUMN tolerance_zone_diff BOOLEAN;
  ALTER TABLE enrollment_settings ADD COLUMN tolerance_time_diff BOOLEAN;
  ```
- **Algorithm Logic:**
  - Score candidates based on: Juz match, Zone match, Time match
  - Apply tolerance rules
  - Auto-suggest top matches
  - Allow manual override by admin
- **Files to Create:**
  - `components/AdminBatch3PairingTab.tsx`
  - `lib/pairing-algorithm.ts` (core matching logic)
  - `app/api/pairing/` endpoints
- **Files to Modify:**
  - `app/register/` enrollment flow
  - `components/ReEnrollmentModal.tsx`

#### 3.2 Broadcast Message Reminder (Kekurangan Blok)
- **Status:** ⏳ To Do
- **Priority:** MEDIUM
- **Est. Time:** 4 days
- **Tasks:**
  - [ ] Create broadcast message template builder
  - [ ] Implement trigger based on block deficiency
  - [ ] Setup scheduled job untuk send reminders
  - [ ] Create audit log untuk sent messages
  - [ ] Analytics: track open rate, click rate
  - [ ] Add SMS/WhatsApp integration (optional)
- **Database Changes:**
  - `CREATE TABLE broadcast_messages (...)`
  - `CREATE TABLE message_templates (...)`
  - `CREATE TABLE message_analytics (...)`
- **Files to Create:**
  - `components/AdminBroadcastTab.tsx`
  - `lib/broadcast-service.ts`
  - `scripts/tasks/send-reminders.ts`
- **Files to Modify:**
  - `scripts/` background jobs

#### 3.3 Simulasi Batch 3
- **Status:** ⏳ To Do
- **Priority:** MEDIUM
- **Est. Time:** 5 days
- **Tasks:**
  - [ ] Create simulation environment (separate from production data)
  - [ ] Copy anonymized data untuk testing
  - [ ] Implement all batch 3 rules dalam simulation
  - [ ] Create comparison report (simulation vs actual)
  - [ ] Admin UI untuk run & manage simulations
  - [ ] Generate detailed logs & debug info
- **Database:**
  - `simulation_batch_3` table & related tables
- **Files to Create:**
  - `components/AdminBatch3SimulationTab.tsx`
  - `lib/simulation-engine.ts`
  - `app/api/simulation/`

---

### **PHASE 4: UI/UX & Polish** (Week 5 - 6)
**Target:** Mobile responsiveness, UI improvements, testing

#### 4.1 Mobile UI untuk Menu Utama (Admin Sidebar)
- **Status:** ⏳ To Do
- **Priority:** MEDIUM
- **Est. Time:** 4 days
- **Tasks:**
  - [ ] Audit current mobile breakpoints
  - [ ] Create hamburger/drawer navigation untuk mobile
  - [ ] Move admin sidebar ke drawer on mobile
  - [ ] Test main menu flows on mobile (iOS & Android)
  - [ ] Optimize touch targets & spacing
  - [ ] Performance: lazy load components
- **Files to Modify:**
  - `components/AppLayout.tsx`
  - `components/DashboardSidebar.tsx`
  - `components/GlobalAuthenticatedHeader.tsx`
  - `components/ui/` (responsive components)
  - Tailwind config untuk mobile optimizations

---

## 📋 Dependency Map

```
Phase 1 (Parallel):
├── Lupa Password Bug ✓
├── Edit Profile (all roles) → needed for Batch 3
├── Nonaktifkan Ujian Saja
└── Hapus Blacklist Users

Phase 2 (Parallel):
├── Blacklist Fitur → needed for registration validation
├── Alumni Testimoni → needed for Batch 3 enrollment
├── Admin View + Edit Muallimah Registration
└── Formulir Admin Entry

Phase 3 (Sequential):
├── Batch 3 Pairing (depends on edit profile, blacklist)
├── Broadcast Reminders (optional, can be parallel)
└── Simulasi Batch 3 (depends on pairing complete)

Phase 4:
└── Mobile UI (can start anytime, minimal dependencies)
```

---

## 🔧 Technical Considerations

### Database
- [ ] Create migration files untuk setiap schema change
- [ ] Test RLS policies setelah setiap perubahan
- [ ] Backup production sebelum major changes
- [ ] Create indexes untuk fields yang sering di-filter (no_hp, email)

### API
- [ ] Rate limiting untuk endpoints tertentu (registration, password reset)
- [ ] Input validation & sanitization
- [ ] Proper error messages & logging
- [ ] API versioning untuk backward compatibility

### Frontend
- [ ] Form state management (consider Context atau state library)
- [ ] Error boundary untuk critical features
- [ ] Loading states & skeleton loaders
- [ ] Toast notifications untuk user feedback

### Testing
- [ ] Unit tests untuk business logic
- [ ] Integration tests untuk APIs
- [ ] E2E tests untuk critical flows (registration, enrollment, admin actions)
- [ ] Load testing untuk broadcast & batch operations

---

## 📅 Timeline Estimate

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1 | 10 days | Week 1 | Week 2 early |
| Phase 2 | 12 days | Week 2 mid | Week 3 end |
| Phase 3 | 14 days | Week 4 | Week 5 early |
| Phase 4 | 8 days | Week 5 mid | Week 6 early |
| **Testing & QA** | 5 days | Parallel | Week 6 |
| **TOTAL** | ~6 weeks | - | - |

---

## ✅ Checklist sebelum Deploy

### Untuk Setiap Feature:
- [ ] Code review selesai
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual QA passed
- [ ] Database migrations tested
- [ ] RLS policies verified
- [ ] Error handling implemented
- [ ] Logging added untuk debugging
- [ ] Documentation updated

### Sebelum Go-Live Phase:
- [ ] Load testing passed
- [ ] Security audit completed
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] User documentation prepared
- [ ] Admin training completed
- [ ] Monitoring & alerting setup

---

## 📞 Next Steps

1. **Prioritize:** Mana yang paling urgent untuk dimulai?
2. **Clarifications:** Ada yang perlu dijelaskan lebih detail?
3. **Resources:** Berapa developer yang bisa assign?
4. **Testing:** Ada test data yang bisa digunakan?
5. **Stakeholders:** Siapa yang perlu diinformasikan progress?

---

**Last Updated:** March 25, 2026  
**Prepared by:** Implementation Team  
**Status:** Ready for Kickoff
