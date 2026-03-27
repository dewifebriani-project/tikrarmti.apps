# Next Steps - Fitur Seleksi Tikrar Tahfidz

Document ini berisi saran fitur tambahan yang dapat diimplementasikan untuk melengkapi sistem seleksi yang sudah ada.

---

## 1. Sistem Banding/Keberatan (Appeal System)

### Deskripsi
Thalibah dapat mengajukan banding jika tidak setuju dengan penyesuaian juz otomatis. Admin dapat menyetujui atau menolak pengajuan juz secara manual.

### Implementasi

#### 1.1 Database Schema
```sql
-- Table untuk menyimpan pengajuan banding
CREATE TABLE pendaftaran_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pendaftaran_id UUID NOT NULL REFERENCES pendaftaran_tikrar_tahfidz(id),
  user_id UUID NOT NULL REFERENCES users(id),
  original_juz VARCHAR(10) NOT NULL,
  requested_juz VARCHAR(10) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query efisien
CREATE INDEX idx_appeals_pendaftaran ON pendaftaran_appeals(pendaftaran_id);
CREATE INDEX idx_appeals_user ON pendaftaran_appeals(user_id);
CREATE INDEX idx_appeals_status ON pendaftaran_appeals(status);
```

#### 1.2 API Endpoint
```typescript
// app/api/seleksi/appeal/route.ts
export async function POST(request: NextRequest) {
  // Submit appeal
  const { pendaftaranId, requestedJuz, reason } = await request.json();

  // Validate:
  // - User owns this registration
  // - Appeal hasn't been submitted yet
  // - Requested juz is valid

  // Create appeal record with status='pending'
  const { data, error } = await supabaseAdmin
    .from('pendaftaran_appeals')
    .insert({
      pendaftaran_id: pendaftaranId,
      user_id: user.id,
      original_juz: currentJuz,
      requested_juz: requestedJuz,
      reason: reason,
      status: 'pending'
    });

  return NextResponse.json({ success: true, data });
}

// app/api/admin/seleksi/appeals/[id]/review/route.ts
export async function POST(request: NextRequest, { params }) {
  // Review appeal (admin only)
  const { action, notes } = await request.json(); // action: 'approve' | 'reject'

  // If approved:
  // 1. Update pendaftaran_tikrar_tahfidz.chosen_juz
  // 2. Update appeal status to 'approved'
  // 3. Send notification to user

  const { data, error } = await supabaseAdmin
    .from('pendaftaran_appeals')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      admin_notes: notes,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', params.id);

  if (action === 'approve') {
    await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update({ chosen_juz: requestedJuz })
      .eq('id', pendaftaranId);
  }

  return NextResponse.json({ success: true });
}
```

#### 1.3 Frontend Components
```tsx
// app/(protected)/seleksi/banding/page.tsx
export default function BandingPage() {
  const [pendingAppeal, setPendingAppeal] = useState(null);
  const [formData, setFormData] = useState({
    requestedJuz: '',
    reason: ''
  });

  // Show warning if juz was auto-adjusted
  const showAppealOption = examScore < 70 && juzAdjusted;

  return (
    <div>
      {showAppealOption && !pendingAppeal && (
        <Alert>
          <p>Juz Ukhti telah disesuaikan otomatis berdasarkan nilai pilihan ganda.</p>
          <p>Ukhti dapat mengajukan banding jika merasa dapat mengambil juz yang lebih tinggi.</p>
          <Button onClick={openAppealForm}>Ajukan Banding</Button>
        </Alert>
      )}

      {pendingAppeal && (
        <Alert>
          <p>Pengajuan banding Ukhti sedang ditinjau oleh admin.</p>
          <p>Status: {pendingAppeal.status}</p>
        </Alert>
      )}

      {/* Appeal form */}
      <Form onSubmit={handleSubmitAppeal}>
        <Select name="requestedJuz" label="Juz yang Diajukan">
          <option value="29A">Juz 29A</option>
          <option value="29B">Juz 29B</option>
          <option value="30A">Juz 30A</option>
          {/* ... */}
        </Select>
        <Textarea name="reason" label="Alasan Pengajuan" />
        <Button type="submit">Kirim Pengajuan</Button>
      </Form>
    </div>
  );
}

// app/(protected)/admin/seleksi/banding/page.tsx
export default function AdminBandingPage() {
  const [appeals, setAppeals] = useState([]);

  useEffect(() => {
    fetch('/api/admin/seleksi/appeals?status=pending')
      .then(res => res.json())
      .then(data => setAppeals(data));
  }, []);

  return (
    <Table>
      {appeals.map(appeal => (
        <TableRow key={appeal.id}>
          <TableCell>{appeal.user_name}</TableCell>
          <TableCell>{appeal.original_juz} → {appeal.requested_juz}</TableCell>
          <TableCell>{appeal.reason}</TableCell>
          <TableCell>
            <Button onClick={() => reviewAppeal(appeal.id, 'approve')}>
              Setujui
            </Button>
            <Button onClick={() => reviewAppeal(appeal.id, 'reject')}>
              Tolak
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
```

---

## 2. Audit Log UI untuk Admin

### Deskripsi
Dashboard admin untuk melihat history penyesuaian juz dan perubahan seleksi status.

### Implementasi

#### 2.1 API Endpoint
```typescript
// app/api/admin/seleksi/audit-log/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batch_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  // Query audit logs with filters
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .select('*')
    .eq('resource', 'selection_status')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  // Parse details JSON for display
  const logs = data.map(log => ({
    ...log,
    details: JSON.parse(log.details),
    selected_count: log.details.selected_count || 0,
    pra_tikrar_count: log.details.pra_tikrar_count || 0,
    juz_adjustments: log.details.juz_adjustments || []
  }));

  return NextResponse.json({ success: true, data: logs });
}
```

#### 2.2 Frontend Component
```tsx
// app/(protected)/admin/seleksi/audit-log/page.tsx
export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    batch_id: '',
    start_date: '',
    end_date: ''
  });

  return (
    <div>
      <Filters>
        <Select name="batch_id" onChange={handleFilterChange}>
          <option value="">Semua Batch</option>
          {batches.map(batch => (
            <option value={batch.id}>{batch.name}</option>
          ))}
        </Select>
        <Input type="date" name="start_date" />
        <Input type="date" name="end_date" />
        <Button onClick={fetchLogs}>Filter</Button>
      </Filters>

      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Waktu</TableCell>
            <TableCell>Admin</TableCell>
            <TableCell>Batch</TableCell>
            <TableCell>Selected</TableCell>
            <TableCell>Pra-Tikrar</TableCell>
            <TableCell>Juz Adjustments</TableCell>
            <TableCell>Details</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map(log => (
            <TableRow key={log.id}>
              <TableCell>{formatDate(log.created_at)}</TableCell>
              <TableCell>{log.user_name}</TableCell>
              <TableCell>{log.details.batch_id}</TableCell>
              <TableCell>{log.details.selected_count}</TableCell>
              <TableCell>{log.details.pra_tikrar_count}</TableCell>
              <TableCell>
                {log.details.juz_adjustments_count > 0 && (
                  <Badge>{log.details.juz_adjustments_count} adjustments</Badge>
                )}
              </TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger>
                    <Button variant="ghost" size="sm">View Details</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Audit Log Details</DialogTitle>
                    </DialogHeader>
                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## 3. Notification System

### Deskripsi
Sistem notifikasi untuk memberi tahu thalibah tentang:
- Hasil seleksi (lulus Tikrar MTI atau Pra-Tikrar)
- Penyesuaian juz otomatis
- Status review banding

### Implementasi

#### 3.1 Email Notifications
```typescript
// lib/notifications/seleksi.ts
export async function sendSelectionResultNotification(
  email: string,
  result: 'selected' | 'pra_tikrar',
  details: {
    original_juz?: string;
    final_juz?: string;
    exam_score?: number;
    juz_adjusted?: boolean;
  }
) {
  const subject = result === 'selected'
    ? 'Selamat! Ukhti Lulus Seleksi Tikrar Tahfidz MTI'
    : 'Hasil Seleksi Tikrar Tahfidz MTI';

  const body = `
    Assalamu'alaikum Ukhti,

    ${result === 'selected' ? `
    Alhamdulillah, kami informasikan bahwa Ukhti telah lulus seleksi
    penerimaan program Tikrar Tahfidz MTI.

    ${details.juz_adjusted ? `
    CATATAN: Penempatan juz Ukhti telah disesuaikan.
    - Juz Awal: ${details.original_juz}
    - Juz Final: ${details.final_juz}
    - Alasan: Nilai pilihan ganda ${details.exam_score} < 70

    Penyesuaian ini dilakukan untuk memastikan Ukhti belajar pada
    tingkat yang sesuai dengan pemahaman Ukhti.
    ` : `
    Penempatan juz: ${details.final_juz}
    `}
    ` : `
    Kami informasikan bahwa Ukhti diterima di kelas Pra-Tikrar.
    Kelas ini dirancang khusus untuk mempersiapkan Ukhti agar lebih
    siap mengikuti program Tikrar Tahfidz MTI.
    `}

    Silakan login ke dashboard untuk informasi lebih lengkap.

    Wa'alaikumsalam,
    Tim Tikrar MTI
  `;

  await sendEmail({ to: email, subject, body });
}

export async function sendAppealDecisionNotification(
  email: string,
  decision: 'approved' | 'rejected',
  details: {
    requested_juz: string;
    admin_notes?: string;
  }
) {
  const subject = decision === 'approved'
    ? 'Pengajuan Banding Disetujui'
    : 'Pengajuan Banding Ditolak';

  const body = `
    Assalamu'alaikum Ukhti,

    ${decision === 'approved' ? `
    Alhamdulillah, pengajuan banding Ukhti telah disetujui.
    Juz penempatan: ${details.requested_juz}
    ` : `
    Mohon maaf, pengajuan banding Ukhti tidak dapat disetujui.

    ${details.admin_notes ? `
    Catatan admin:
    ${details.admin_notes}
    ` : ''}
    `}

    Silakan login ke dashboard untuk informasi lebih lengkap.

    Wa'alaikumsalam,
    Tim Tikrar MTI
  `;

  await sendEmail({ to: email, subject, body });
}
```

#### 3.2 Integration dengan Selection Update
```typescript
// app/api/admin/tikrar/update-selection-status/route.ts
import { sendSelectionResultNotification } from '@/lib/notifications/seleksi';

// Setelah update selection_status, kirim notifikasi
for (const reg of registrationsToUpdate) {
  const userEmail = await getUserEmail(reg.user_id);
  await sendSelectionResultNotification(userEmail, reg.selection_status, {
    original_juz: reg.original_juz,
    final_juz: reg.final_juz,
    exam_score: reg.exam_score,
    juz_adjusted: reg.juz_adjusted
  });
}
```

#### 3.3 In-App Notifications
```sql
-- Table untuk menyimpan notifikasi in-app
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'selection_result', 'juz_adjusted', 'appeal_decision'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
```

---

## 4. Export/Import Selection Data

### Deskripsi
Fitur untuk export data seleksi ke Excel/CSV dan import untuk bulk processing.

### Implementasi

#### 4.1 Export Endpoint
```typescript
// app/api/admin/seleksi/export/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batch_id');

  const { data: registrations } = await supabaseAdmin
    .from('pendaftaran_tikrar_tahfidz')
    .select(`
      id,
      user_id,
      users (full_name, email),
      chosen_juz,
      oral_assessment_status,
      exam_score,
      selection_status,
      created_at
    `)
    .eq('batch_id', batchId);

  // Transform to CSV format
  const csv = transformToCSV(registrations, [
    { key: 'full_name', label: 'Nama' },
    { key: 'email', label: 'Email' },
    { key: 'chosen_juz', label: 'Juz Pilihan' },
    { key: 'oral_assessment_status', label: 'Status Oral' },
    { key: 'exam_score', label: 'Nilai Pilihan Ganda' },
    { key: 'selection_status', label: 'Status Seleksi' }
  ]);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="seleksi-${batchId}.csv"`
    }
  });
}
```

#### 4.2 Import Endpoint
```typescript
// app/api/admin/seleksi/import/route.ts
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // Parse CSV/Excel
  const records = await parseSelectionFile(file);

  // Validate and update
  const results = {
    success: [],
    errors: []
  };

  for (const record of records) {
    try {
      await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .update({
          selection_status: record.selection_status,
          chosen_juz: record.chosen_juz
        })
        .eq('id', record.id);
      results.success.push(record);
    } catch (error) {
      results.errors.push({ record, error });
    }
  }

  return NextResponse.json({
    success: true,
    total: records.length,
    success_count: results.success.length,
    error_count: results.errors.length,
    errors: results.errors
  });
}
```

---

## 5. Seleksi Analytics Dashboard

### Deskripsi
Dashboard analytics untuk memantau statistik seleksi per batch.

### Implementasi

#### 5.1 Analytics API
```typescript
// app/api/admin/seleksi/analytics/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batch_id');

  // Get selection statistics
  const { data: stats } = await supabaseAdmin
    .from('pendaftaran_tikrar_tahfidz')
    .select('selection_status')
    .eq('batch_id', batchId);

  const analytics = {
    total: stats.length,
    selected: stats.filter(s => s.selection_status === 'selected').length,
    pra_tikrar: stats.filter(s => s.selection_status === 'waitlist').length,
    pending: stats.filter(s => s.selection_status === 'pending').length,
    pass_rate: (stats.filter(s => s.selection_status === 'selected').length / stats.length) * 100
  };

  // Get juz distribution
  const { data: juzDistribution } = await supabaseAdmin
    .from('pendaftaran_tikrar_tahfidz')
    .select('chosen_juz')
    .eq('batch_id', batchId)
    .eq('selection_status', 'selected');

  const juzStats = groupBy(juzDistribution, 'chosen_juz');

  // Get oral vs written score correlation
  const { data: scores } = await supabaseAdmin
    .from('pendaftaran_tikrar_tahfidz')
    .select('oral_assessment_status, exam_score')
    .eq('batch_id', batchId)
    .not('exam_score', 'is', null);

  return NextResponse.json({
    success: true,
    data: {
      overview: analytics,
      juz_distribution: juzStats,
      score_distribution: {
        oral_pass: scores.filter(s => s.oral_assessment_status === 'pass').length,
        oral_fail: scores.filter(s => s.oral_assessment_status === 'fail').length,
        written_pass: scores.filter(s => s.exam_score >= 70).length,
        written_fail: scores.filter(s => s.exam_score < 70).length,
        average_score: scores.reduce((sum, s) => sum + s.exam_score, 0) / scores.length
      }
    }
  });
}
```

#### 5.2 Dashboard UI
```tsx
// app/(protected)/admin/seleksi/analytics/page.tsx
export default function SeleksiAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);

  return (
    <div>
      <h1>Analitik Seleksi</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>Total Pendaftar</CardHeader>
          <CardContent>{analytics?.overview.total}</CardContent>
        </Card>
        <Card>
          <CardHeader>Lulus Tikrar MTI</CardHeader>
          <CardContent>{analytics?.overview.selected}</CardContent>
        </Card>
        <Card>
          <CardHeader>Pra-Tikrar</CardHeader>
          <CardContent>{analytics?.overview.pra_tikrar}</CardContent>
        </Card>
        <Card>
          <CardHeader>Pass Rate</CardHeader>
          <CardContent>{analytics?.overview.pass_rate}%</CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>Distribusi Juz</CardHeader>
          <CardContent>
            <BarChart data={analytics?.juz_distribution} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Score Distribution</CardHeader>
          <CardContent>
            <PieChart data={analytics?.score_distribution} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## Prioritas Implementasi

| Prioritas | Fitur | Estimasi | Keterangan |
|-----------|-------|----------|------------|
| 1 | Notification System | 2-3 hari | Penting untuk user experience |
| 2 | Audit Log UI | 1-2 hari | Penting untuk transparency |
| 3 | Appeal System | 3-4 hari | Nice-to-have untuk fleksibilitas |
| 4 | Export/Import | 1-2 hari | Berguna untuk batch processing |
| 5 | Analytics Dashboard | 2-3 hari | Berguna untuk reporting |

---

## Catatan Penting

### Architecture Compliance
Semua fitur baru harus mengikuti prinsip [arsitektur.md](../docs/arsitektur.md):
- ✅ Server-side validation only
- ✅ getUser() untuk authentication
- ✅ RLS policies sebagai authority
- ✅ Tidak ada exposure service role key

### Security Considerations
1. Appeal system harus validasi bahwa user hanya bisa appeal untuk registration mereka sendiri
2. Admin review harus menggunakan admin check yang proper
3. Export data harus memfilter sensitive information
4. Audit log harus tidak bisa dihapus oleh user biasa

### Testing
Sebelum deploy ke production:
1. Test selection logic dengan berbagai skenario skor
2. Test appeal flow dari submit sampai approve/reject
3. Test notification delivery (email dan in-app)
4. Test export/import dengan data dummy

---

**Dokumentasi ini dibuat pada:** 2026-01-09
**Versi:** 1.0
**Status:** Draft untuk review
