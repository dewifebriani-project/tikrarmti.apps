# MTI - Markaz Tikrar Indonesia
## Aplikasi Tahfidz Quran Digital

### Ringkasan Aplikasi
MTI (Markaz Tikrar Indonesia) adalah aplikasi web berbasis Next.js untuk membantu penghafal Al-Quran dalam melacak dan mengelola aktivitas hafalan harian mereka. Aplikasi ini dirancang khusus untuk santri dan penghafal Quran yang ingin memonitor progress hafalan mereka secara sistematis.

---

## 🎯 Visi & Misi

### Visi
Menjadi platform digital terdepan yang mendukung para penghafal Al-Quran dalam mencapai target hafalan mereka dengan metode yang terstruktur dan terukur.

### Misi
- Memberikan sistem pelacakan hafalan yang komprehensif
- Memfasilitasi proses tashih (validasi) bacaan yang terstandardisasi
- Meningkatkan motivasi dan konsistensi dalam menghafal Al-Quran
- Menyediakan dashboard analitik untuk monitoring progress

---

## 🏗️ Arsitektur Teknis

### Teknologi Stack
- **Frontend Framework**: Next.js 15.5.4 dengan React
- **Bahasa Pemrograman**: TypeScript
- **UI Components**: shadcn UI dengan Radix UI primitives
- **Styling**: Tailwind CSS dengan CSS variables untuk theming
- **State Management**: React Hooks (useState, useEffect) dan Context API
- **Database**: Supabase (PostgreSQL dengan real-time capabilities)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Deployment**: Vercel
- **Environment**: Development server pada port 3003

### Struktur Proyek
```
tikrarmtiapps/
├── app/                    # Halaman aplikasi (Next.js App Router)
│   ├── dashboard/         # Dashboard utama
│   ├── jurnal-harian/     # Jurnal harian hafalan
│   ├── perjalanan-saya/   # Timeline progress
│   ├── tashih/            # Validasi bacaan
│   ├── globals.css        # Global CSS dengan theming system
│   └── layout.tsx         # Layout utama
├── components/            # Komponen reusable
│   ├── DashboardSidebar.tsx     # Global sidebar navigasi
│   ├── AuthenticatedLayout.tsx  # Layout dengan autentikasi
│   ├── ui/               # shadcn UI components
│   └── ...               # Komponen lainnya
├── lib/                  # Utilitas dan konfigurasi
│   ├── utils.ts          # Utility functions (shadcn)
│   ├── supabase.ts       # Supabase client configuration
│   └── contexts/         # React Context providers
├── docs/                  # Dokumentasi
├── public/               # Aset statis
├── .env.local           # Environment variables (Supabase)
├── tailwind.config.ts   # Tailwind configuration
├── components.json      # shadcn UI configuration
└── ...                   # File konfigurasi
```

---

## 📱 Fitur Utama

### 1. Dashboard Utama
- **Lokasi**: `/dashboard`
- **Fungsi**: Halaman beranda dengan ringkasan progress
- **Komponen**:
  - Statistik harian (hari target, progress)
  - Quick access ke fitur utama
  - Informasi personal pengguna

### 2. Jurnal Harian
- **Lokasi**: `/jurnal-harian`
- **Fungsi**: Melacak aktivitas hafalan harian
- **Kurikulum Wajib (7 Tahap)**:
  1. **Rabth** - Mengulang-ulang 10 blok terakhir (1x)
  2. **Murajaah** - Dari hafalan tanpa mushaf (minimal 5x)
  3. **Simak Murattal** - Mendengarkan qari (minimal 3x) dengan fitur play
  4. **Tikrar Bi An-Nadzar** - Dengan melihat mushaf
  5. **Tasmi' Record** - Recording dan evaluasi (minimal 3x)
  6. **Simak Record** - Mendengarkan kembali recording
  7. **Tikrar Bi Al-Ghaib** - Tutup mata (minimal 40x)

- **Kurikulum Tambahan (Pilihan)**:
  8. **Tafsir** - Mempelajari makna ayat
  9. **Menulis** - Latih menulis ayat (tahap tetap ada, area menulis dihapus)

- **Fitur Interaktif**:
  - Counter untuk setiap tahap dengan validasi minimal
  - Recording functionality dengan timer
  - Visual feedback ketika target tercapai (warna hijau)
  - Tombol equal size untuk "Selesai Jurnal" dan "Kembali ke Dashboard"

### 3. Tashih Bacaan
- **Lokasi**: `/tashih`
- **Fungsi**: Prasyarat wajib sebelum jurnal harian
- **Fitur**:
  - Pemilihan blok yang ditashih (H2a, H2b, H2c, H2d)
  - Lokasi tashih (MTI atau luar MTI)
  - Form dinamis berdasarkan lokasi
  - Pencatatan masalah tajwid
  - Validasi form real-time

### 4. Perjalanan Saya
- **Lokasi**: `/perjalanan-saya`
- **Fungsi**: Timeline progress hafalan
- **Fitur**:
  - 8 milestone progress dengan status (completed, current, future)
  - Responsive design (desktop alternating, mobile right-aligned)
  - Format tanggal tanpa label "Masehi/Hijriyah"
  - Status-based styling (teal, yellow, gray)

---

## 🎨 Desain & UI/UX

### Tema Warna & Global CSS
- **Primary**: Green Army (#4a5f3a) - Warna hijau army khas MTI
- **Secondary**: Gold (#fbbf24) - Aksen emas untuk UI elements
- **Background**: White/Light gray dengan gradient modern
- **Implementation**: CSS Variables di [globals.css](app/globals.css) untuk consistent theming

### shadcn UI Integration
- **Component Library**: shadcn/ui dengan Radix UI primitives
- **Design System**: Consistent design tokens dan components
- **Customization**: Tailwind CSS dengan custom theme colors
- **Form Components**: Built-in validation dan accessibility

### Responsive Design
- **Mobile**: Layout stacked, hidden breadcrumb, optimized buttons
- **Desktop**: Grid layout, full sidebar, enhanced spacing
- **Tablet**: Adaptive layout dengan intermediate features

### Komponen Design
- **Cards**: Glass morphism effects dengan green army theme
- **Buttons**: Consistent sizing, hover effects, disabled states
- **Forms**: shadcn form components dengan built-in validation
- **Navigation**: Global sidebar ([DashboardSidebar.tsx](components/DashboardSidebar.tsx)) dengan user avatar, mobile hamburger

### Animations & Effects
- **Modern Animations**: fadeInUp, slideInLeft, slideInRight, float
- **Gradient Effects**: Background gradient shifts dengan green army & gold theme
- **Glass Morphism**: Backdrop blur effects untuk modern UI
- **Hover States**: Lift effects dan glow interactions

---

## 🔐 Autentikasi & Keamanan

### Supabase Authentication
- **Provider**: Supabase Auth dengan email/password dan social providers
- **Session Management**: Automatic token refresh dengan JWT
- **Protected Routes**: Middleware dan layout-based route protection
- **User Roles**: Role-based access control (admin, pengurus, santri)

### Layout System
- **AuthenticatedLayout.tsx**: Layout untuk halaman yang memerlukan login
- **DashboardSidebar.tsx**: Global sidebar navigation dengan state management
- **Breadcrumb Management**: Dinamis berdasarkan route
- **Mobile Navigation**: Hamburger menu dengan proper positioning

### User Management
- **Profile Integration**: Avatar di sidebar untuk user settings
- **Session Persistence**: Supabase auth cookies dengan secure configuration
- **Logout Functionality**: Hanya di avatar user, bukan di sidebar
- **Multi-tenant Support**: Organisasi-based access control

---

## 📊 Data Management & Database

### Supabase Database Schema
```sql
-- Users table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'santri',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Jurnal harian table
CREATE TABLE jurnal_harian (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  completed_steps JSONB,
  counters JSONB,
  recording_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tashih records
CREATE TABLE tashih_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  blok TEXT NOT NULL,
  lokasi TEXT NOT NULL,
  masalah_tajwid TEXT,
  waktu_tashih TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Progress tracking
CREATE TABLE progress_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  milestone_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Data Structure
```typescript
interface JurnalData {
  id: string;
  user_id: string;
  date: string;
  completedSteps: {
    rabth: boolean;
    murajaah: boolean;
    simakMurattal: boolean;
    tikrarBiAnNadzar: boolean;
    tasmiRecord: boolean;
    simakRecord: boolean;
    tikrarBiAlGhaib: boolean;
    tafsir?: boolean;
    menulis?: boolean;
  };
  counters: {
    murajaahCount: number;
    simakCount: number;
    recordingCount: number;
    tikrarGhaibCount: number;
  };
  recordingTime: number;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'pengurus' | 'santri';
  created_at: string;
}
```

### Real-time Features
- **Live Updates**: Jurnal progress sync real-time
- **Notifications**: Supabase Realtime untuk update status
- **Collaborative Monitoring**: Ustadz dapat monitor santri progress real-time

---

## 🔄 User Workflow

### Alur Harian Pengguna
1. **Login** → Dashboard
2. **Tashih** → Validasi bacaan (wajib)
3. **Jurnal Harian** → Isi kurikulum 7 tahap
4. **Track Progress** → Monitor di Perjalanan Saya
5. **Repeat** → Konsistensi harian

### Alur Form Tashih
1. Pilih blok yang sudah ditashih
2. Pilih lokasi (MTI/Luar)
3. Isi form dinamis berdasarkan lokasi
4. Set waktu tashih
5. Catat masalah tajwid
6. Konfirmasi & lanjut ke jurnal

---

## 🎯 Target Pengguna

### Primary Users
- Santri tahfidz di MTI dan lembaga sejenis
- Penghafal Quran yang ingin tracking progress
- Ustadz/ah yang memantau santri

### Secondary Users
- Orang tua yang ingin monitoring anak
- Admin lembaga tahfidz
- Mentor pembimbing hafalan

---

## 📈 Performance & Optimization

### Vercel Deployment Features
- **Automatic HTTPS**: SSL certificate management
- **Edge Network**: Global CDN untuk fast loading
- **Serverless Functions**: API routes untuk backend logic
- **Incremental Static Regeneration**: ISR untuk dynamic content
- **Analytics**: Built-in performance monitoring

### Optimization Strategies
- **Component Lazy Loading**: Untuk halaman-halaman besar
- **Image Optimization**: Next.js Image component dengan Vercel Edge
- **Code Splitting**: Otomatis dengan Next.js App Router
- **Database Caching**: Supabase connection pooling
- **Static Generation**: Build-time optimization untuk static pages

### Performance Metrics
- **First Contentful Paint**: < 2 seconds
- **Interactive Time**: < 3 seconds
- **Bundle Size**: Optimized dengan tree shaking
- **Database Response**: < 500ms dengan Supabase Edge Functions
- **Global Latency**: < 200ms via Vercel Edge Network

---

## 🚀 Future Enhancements

### Phase 2 Features (Supabase + Vercel Enhanced)
- [x] **Multi-user Support**: Admin, pengurus, dan santri roles dengan Supabase RLS
- [x] **Cloud Sync**: Real-time sync dengan Supabase PostgreSQL
- [ ] **Analytics Dashboard**: Advanced progress charts dengan Supabase Functions
- [ ] **Mobile App**: React Native version dengan Supabase backend
- [ ] **Audio Recording**: Supabase Storage untuk recording files
- [ ] **Offline Support**: PWA dengan Supabase offline sync

### Phase 3 Features (AI & Advanced Features)
- [ ] **AI Integration**: Tajwid checking automation dengan OpenAI API
- [ ] **Social Features**: Community challenges dengan real-time updates
- [ ] **Advanced Reporting**: PDF export dengan Vercel Functions
- [ ] **API Integration**: Connect dengan mushaf digital (Quran.com API)
- [ ] **Gamification**: Points, badges, leaderboard dengan Supabase
- [ ] **Video Conference**: Built-in tashih sessions dengan WebRTC
- [ ] **Progress AI**: Machine learning untuk hafalan patterns
- [ ] **Multi-language**: Support untuk English dan Arabic

---

## 🔧 Development Guidelines

### Coding Standards
- **TypeScript**: Strict typing untuk semua komponen
- **Component Structure**: Single responsibility principle
- **Error Handling**: Proper error boundaries
- **Testing**: Unit tests untuk critical functions

### Git Workflow
- **Feature Branches**: Setiap fitur di branch terpisah
- **Code Reviews**: Mandatory sebelum merge
- **Deployment**: Staging → Production flow

### Documentation
- **Code Comments**: Complex logic documentation
- **API Docs**: Jika ada external API
- **User Guide**: Panduan penggunaan aplikasi

---

## 📞 Support & Maintenance

### Monitoring
- **Error Tracking**: Sentry atau similar
- **Performance Monitoring**: Vercel Analytics
- **User Feedback**: Built-in feedback system

### Maintenance Schedule
- **Weekly**: Security updates dan dependency updates
- **Monthly**: Performance optimization
- **Quarterly**: Feature releases dan improvements

---

## 📝 Changelog

### Version 1.0.0 (Current)
- ✅ Dashboard dengan progress tracking
- ✅ Jurnal Harian dengan 7+2 kurikulum tahap
- ✅ Tashih Bacaan dengan form validation
- ✅ Perjalanan Saya timeline
- ✅ Responsive design
- ✅ LocalStorage integration

### Known Issues
- [ ] Server compilation warnings (non-blocking)
- [ ] Mobile hamburger positioning pada beberapa devices
- [ ] Recording functionality perlu testing lebih lanjut

---

## 🎉 Closing

Aplikasi MTI dirancang dengan fokus pada user experience dan efektivitas dalam membantu proses hafalan Al-Quran. Dengan pendekatan yang terstruktur dan teknologi modern, aplikasi ini diharapkan dapat menjadi companion yang valuable bagi para penghafal Quran di seluruh Indonesia.

**Dikembangkan dengan ❤️ untuk para penghafal Al-Quran**

---

*Document Version: 1.0.0*
*Last Updated: 5 Oktober 2025*
*Author: MTI Development Team*