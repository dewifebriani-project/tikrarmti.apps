import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper function to verify musyrifah or admin access
async function verifyMusyrifahOrAdminAccess(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, roles')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return { error: 'User not found', status: 404 };
  }

  const roles = userData?.roles || [];
  if (!roles.includes('musyrifah') && !roles.includes('admin')) {
    return { error: 'Forbidden: Musyrifah or Admin access required', status: 403 };
  }

  return { user: userData };
}

// Template for SP letter
function getSPLetterTemplate(sp: any, thalibah: any, batch: any) {
  const spLabels = {
    1: 'SATU (1)',
    2: 'DUA (2)',
    3: 'TIGA (3)',
  };

  const spLevelText = spLabels[sp.sp_level as keyof typeof spLabels] || 'SATU (1)';
  const isSP3 = sp.sp_level === 3;

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Generate SP number: SP/BATCH/NO
  const spNumber = `SP/${batch.name.toUpperCase()}/${new Date().getFullYear()}/${sp.id.substring(0, 6).toUpperCase()}`;

  // Different body text based on SP level
  let bodyParagraph2 = '';
  let bodyParagraph3 = '';
  let warningText = '';

  if (sp.sp_level === 1) {
    bodyParagraph2 = `Catatan yang kami miliki menunjukkan bahwa Ukhty ${thalibah.full_name || thalibah.nama_kunyah || '-'} belum memenuhi kewajiban kehadiran dan/atau laporan harian yang merupakan bagian dari akad program.`;
    bodyParagraph3 = `Mengingat pentingnya komitmen dalam menuntut ilmu, surat peringatan ini bertujuan untuk mengingatkan kembali Ukhty atas akad yang telah dibuat dan mendorong Ukhty untuk kembali aktif serta memenuhi semua kewajiban sebagai thalibah MTI.`;
    warningText = `Kami berharap Ukhty merespons peringatan ini dengan serius dan segera melakukan perbaikan. Semoga Allah Subhanahu wa Ta'ala senantiasa memudahkan langkah kita semua dalam kebaikan.`;
  } else if (sp.sp_level === 2) {
    bodyParagraph2 = `Catatan yang kami miliki menunjukkan bahwa Ukhty ${thalibah.full_name || thalibah.nama_kunyah || '-'} belum memenuhi kewajiban kehadiran dan/atau laporan harian untuk Pekan ${sp.week_number} yang merupakan bagian dari akad program. Ini adalah peringatan kedua yang diterbitkan untuk Ukhty.`;
    bodyParagraph3 = `Mengingat pentingnya komitmen dalam menuntut ilmu dan bahwa peringatan pertama telah diterbitkan sebelumnya, surat peringatan ini bertujuan untuk mengingatkan kembali Ukhty atas akad yang telah dibuat dan mendorong Ukhty untuk segera kembali aktif serta memenuhi semua kewajiban sebagai thalibah MTI.`;
    warningText = `Kami sangat berharap Ukhty merespons peringatan kedua ini dengan serius dan segera melakukan perbaikan. Jika ketidaksesuaian ini berlanjut, kami terpaksa akan mengambil tindakan lebih lanjut sesuai dengan ketentuan yang berlaku, termasuk penerbitan Surat Peringatan Ketiga (SP3) yang dapat berakibat pada pemberhentian dari program. Semoga Allah Subhanahu wa Ta'ala senantiasa memudahkan langkah kita semua dalam kebaikan.`;
  } else {
    // SP3
    bodyParagraph2 = `Catatan yang kami miliki menunjukkan bahwa Ukhty ${thalibah.full_name || thalibah.nama_kunyah || '-'} belum memenuhi kewajiban kehadiran dan/atau laporan harian untuk Pekan ${sp.week_number} yang merupakan bagian dari akad program. Ini adalah peringatan ketiga yang diterbitkan untuk Ukhty setelah sebelumnya telah diterbitkan SP1 dan SP2.`;
    bodyParagraph3 = `Mengingat ketidaksesuaian ini telah terjadi secara berulang dan peringatan pertama serta kedua telah diterbitkan, bersama surat ini kami sampaikan bahwa Ukhty dinyatakan ${sp.is_blacklisted ? 'DIBLACKLIST dan DROPOUT (DO)' : 'DROPOUT (DO)'} dari Program ${batch.name} Markaz Tikrar Indonesia terhitung sejak tanggal surat ini diterbitkan.`;
    warningText = `Keputusan ini diambil setelah melalui proses evaluasi dan pertimbangan yang matang. Kami berharap Ukhty dapat menerima keputusan ini dengan ikhlas dan tetap semangat dalam menuntut ilmu di tempat lain. Semoga Allah Subhanahu wa Ta'ala senantiasa memudahkan langkah kita semua dalam kebaikan dan memberikan yang terbaik bagi kita semua.`;
  }

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Surat Peringatan ${spLevelText}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #000;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 16pt;
      font-weight: bold;
      margin: 0 0 5px 0;
      text-transform: uppercase;
      text-decoration: underline;
    }

    .header .subtitle {
      font-size: 12pt;
      margin: 0;
    }

    .meta-info {
      margin-bottom: 20px;
    }

    .meta-info p {
      margin: 5px 0;
    }

    .recipient {
      margin-bottom: 20px;
    }

    .recipient p {
      margin: 5px 0;
    }

    .subject {
      margin-bottom: 20px;
      font-weight: bold;
    }

    .greeting {
      margin-bottom: 15px;
    }

    .body {
      margin-bottom: 20px;
      text-align: justify;
    }

    .body p {
      margin: 10px 0;
      text-indent: 50px;
    }

    .body p:first-child {
      text-indent: 0;
    }

    .warning {
      background-color: ${isSP3 ? '#fee2e2' : '#fef3c7'};
      border-left: 4px solid ${isSP3 ? '#dc2626' : '#f59e0b'};
      padding: 15px;
      margin: 20px 0;
      font-style: italic;
    }

    .signature {
      margin-top: 40px;
      text-align: right;
    }

    .signature p {
      margin: 5px 0;
    }

    .signature .name {
      font-weight: bold;
      margin-top: 20px;
    }

    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      font-size: 10pt;
      color: #666;
    }

    @media print {
      body {
        padding: 0;
      }
      .footer {
        display: none;
      }
      .warning {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Surat Peringatan (SP) ${spLevelText}</h1>
    <p class="subtitle">Nomor: ${spNumber}</p>
  </div>

  <div class="meta-info">
    <p>Tanggal: ${today}</p>
  </div>

  <div class="recipient">
    <p>Kepada Ykh.,</p>
    <p>Ukhty ${thalibah.full_name || thalibah.nama_kunyah || '-'}</p>
  </div>

  <div class="subject">
    <p>Hal: Peringatan Pelanggaran Akad Program Tahfidz Tikrar MTI</p>
  </div>

  <div class="greeting">
    <p>Assalamu'alaikum warahmatullahi wabarakatuh,</p>
    <p>Dengan hormat,</p>
  </div>

  <div class="body">
    <p>Sehubungan dengan keikutsertaan Ukhty ${thalibah.full_name || thalibah.nama_kunyah || '-'} dalam Program Tahfidz Tikrar MTI Markaz Tikrar Indonesia (MTI) dan hasil evaluasi yang kami lakukan, bersama surat ini kami sampaikan peringatan atas ketidaksesuaian pelaksanaan kewajiban thalibah dengan akad yang telah disepakati di awal program.</p>

    <p>${bodyParagraph2}</p>

    <p>${bodyParagraph3}</p>

    <div class="warning">
      <p style="margin: 0; text-indent: 0;">${warningText}</p>
    </div>
  </div>

  <div class="closing">
    <p>Wassalamu'alaikum warahmatullahi wabarakatuh.</p>
  </div>

  <div class="signature">
    <p>Mara Martalena</p>
    <p class="name">Penanggung Jawab Markaz Tikrar Indonesia</p>
  </div>

  <div class="footer">
    <p><em>Dokumen ini diterbitkan secara elektronik oleh Markaz Tikrar Indonesia.</em></p>
    <p><em>ID: ${sp.id} | Diterbitkan: ${new Date(sp.issued_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</em></p>
  </div>

  <script>
    // Auto print when page loads
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();

    // Verify musyrifah or admin access
    const authResult = await verifyMusyrifahOrAdminAccess(supabase);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const spId = searchParams.get('id');

    if (!spId) {
      return NextResponse.json({ error: 'SP ID is required' }, { status: 400 });
    }

    // Get SP record with related data
    const { data: sp, error } = await supabase
      .from('surat_peringatan')
      .select(`
        id,
        sp_level,
        week_number,
        reason,
        notes,
        issued_at,
        thalibah:users!surat_peringatan_thalibah_id_fkey(id, full_name, nama_kunyah, whatsapp, email),
        batch:batches(id, name)
      `)
      .eq('id', spId)
      .single();

    if (error || !sp) {
      return NextResponse.json({ error: 'SP record not found' }, { status: 404 });
    }

    // Handle array or object from Supabase joins
    const thalibah = Array.isArray(sp.thalibah) ? sp.thalibah[0] : sp.thalibah;
    const batch = Array.isArray(sp.batch) ? sp.batch[0] : sp.batch;

    if (!thalibah) {
      return NextResponse.json({ error: 'Thalibah data not found' }, { status: 404 });
    }

    if (!batch) {
      return NextResponse.json({ error: 'Batch data not found' }, { status: 404 });
    }

    // Generate HTML letter
    const html = getSPLetterTemplate(sp, thalibah, batch);

    // Return HTML with print-triggering script
    const displayName = thalibah.full_name?.replace(/\s+/g, '_') || thalibah.nama_kunyah?.replace(/\s+/g, '_') || 'thalibah';
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="SP${sp.sp_level}_${displayName}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating SP letter:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
