export interface HalaqahForReminder {
  id?: string;
  name: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  preferred_juz?: string;
  class_type?: string;
  zoom_link?: string;
  zoom_name?: string;
  zoom_meeting_id?: string;
  zoom_passcode?: string;
  zoom_claim_host?: string;
  muallimah?: {
    full_name?: string;
  };
  program?: {
    class_type?: string;
    batch?: {
      name?: string;
    };
  };
  students?: Array<{
    full_name: string;
    preferred_juz?: string;
  }>;
}

export function getHijriDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-nu-latn', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
  return `${formatter.format(date)} H`;
}

export function getMasehiDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
  return formatter.format(date);
}

export function getDayName(dayNum?: number): string {
  const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
  if (dayNum === undefined) return '';
  if (dayNum >= 1 && dayNum <= 7) return days[dayNum];
  return '';
}

export function formatTimeShort(time?: string): string {
  if (!time) return '';
  return time.substring(0, 5).replace(':', '.');
}

export function toTitleCase(str: string): string {
  if (!str) return '';
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export function getClassTypeLabel(classType?: string): string {
  if (classType === 'tikrar_tahfidz') return 'TIKRAR';
  if (classType === 'pra_tahfidz') return 'PRA TIKRAR UMUM';
  if (classType === 'tikrar_berbayar') return 'TIKRAR BERBAYAR';
  return (classType || '').toUpperCase().replace(/_/g, ' ');
}

export function getZoomEmoji(zoomName?: string): string {
  if (!zoomName) return '';
  const match = zoomName.match(/Room\s*(\d+)/i);
  if (match && match[1]) {
    const emojis = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    return match[1].split('').map(digit => emojis[parseInt(digit, 10)]).join('');
  }
  return '';
}

export function generateHalaqahReminder(halaqah: HalaqahForReminder, date: Date = new Date()): string {
  const juz = halaqah.preferred_juz || '';
  const isPraTahfidz = halaqah.class_type === 'pra_tahfidz';
  const title = isPraTahfidz ? `🌟  𝐏𝐑𝐀 𝐓𝐈𝐊𝐑𝐀𝐑  🌟` : `🌟  𝐓𝐈𝐊𝐑𝐀𝐑  *JUZ ${juz}* 🌟`;
  
  const muallimah_name = halaqah.muallimah?.full_name || '';
  const day_name = getDayName(halaqah.day_of_week) || new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(date);
  
  const tanggal_masehi = getMasehiDate(date);
  const tanggal_hijri = getHijriDate(date);
  const time = formatTimeShort(halaqah.start_time);
  
  const zoom_emoji = getZoomEmoji(halaqah.zoom_name);
  const zoom_url = halaqah.zoom_link || '';
  const meeting_id = halaqah.zoom_meeting_id || '';
  const passcode = halaqah.zoom_passcode || '';
  const class_type_label = getClassTypeLabel(halaqah.class_type);

  return `╔❀◎🎓◎❀════════════════╗
 🔸𝗠𝗔𝗥𝗞𝗔𝗭 𝗧𝗜𝗞𝗥𝗔𝗥 𝗜𝗡𝗗𝗢𝗡𝗘𝗦𝗜𝗔🔸
╚════════════════❀◎🎓◎❀╝

${title}

بِسْــــــــــــــــــمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ

In syaa Allaahu Ta'alaa bersama:

👑  *Ustadzah :  ${muallimah_name} حفظها الله تعالى*
📆  *Hari/Tanggal : ${day_name}, ${tanggal_masehi}*
        *${tanggal_hijri}*
⏰  *Pukul : ${time} WIB - selesai*
🪩  *LINK ZOOM${zoom_emoji ? ' ' + zoom_emoji : ''}* 
${zoom_url}
*ID Rapat: ${meeting_id}*
*Kode sandi : ${passcode}*

📜 *TATA TERTIB KELAS ${class_type_label}*
* Niatkan ikhlas Lillaahi Ta'alaa
* *Memperhatikan ADAB* terhadap Mu'allimah, jika dikoreksi agar diperhatikan dan bertanya dengan bahasa yang santun
* Hadir 30 menit sebelum kelas dimulai
* Mempersiapkan materi yang akan dibaca
* Menulis nama di chatt Zoom sesuai nama pada saat mendaftar
* Menjaga audio dan video
* Menjaga suara Mu'allimaat dan Thalibaat dari Ajnabi
* Membuka mic pada saat dipanggil

⛔ *FREE SHARE LINK KELUAR MTI*
━━━━━━━━━━━━━━━━❁❁
𝗠𝗔𝗥𝗞𝗔𝗭 𝗧𝗜𝗞𝗥𝗔𝗥 𝗜𝗡𝗗𝗢𝗡𝗘𝗦𝗜𝗔

📱 *MTI OFFICIAL : 081330000784*
🔗 *Tap Lynk : https://lynk.id/markaztikrar.id*`;
}

export function generateDailyReminder(batchName: string, halaqahs: HalaqahForReminder[], date: Date = new Date()): string {
  const day_name = new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(date).toUpperCase();
  const date_masehi = getMasehiDate(date).toUpperCase();
  
  const sortedHalaqahs = [...halaqahs].sort((a, b) => {
    const timeComparison = (a.start_time || '99:99').localeCompare(b.start_time || '99:99');
    if (timeComparison !== 0) return timeComparison;
    return (a.muallimah?.full_name || a.name || '').localeCompare(
      b.muallimah?.full_name || b.name || '',
      'id'
    );
  });

  const scheduleStr = sortedHalaqahs.map(h => {
    const isPraTikrar = h.class_type === 'pra_tahfidz';
    const classLabel = isPraTikrar
      ? '𝗞𝗘𝗟𝗔𝗦 𝗣𝗥𝗔 𝗧𝗜𝗞𝗥𝗔𝗥 𝗨𝗠𝗨𝗠'
      : `𝗞𝗘𝗟𝗔𝗦 𝗧𝗜𝗞𝗥𝗔𝗥${h.preferred_juz ? ` 𝗝𝗨𝗭 ${h.preferred_juz}` : ''}`;
    const coordinatorLabel = isPraTikrar ? 'Musyrifah' : 'Roisah';

    return `🛡️  ${classLabel}
⏰  *${formatTimeShort(h.start_time)} WIB*
👑  Ustadzah ${h.muallimah?.full_name || ''}
🎗️  ${coordinatorLabel} : ........................
🌐  Link Zoom${getZoomEmoji(h.zoom_name) ? ' ' + getZoomEmoji(h.zoom_name) : ''}
${h.zoom_link || ''}

*ID Rapat: ${h.zoom_meeting_id || ''}*
*Kode Sandi: ${h.zoom_passcode || ''}*

🔸🔸🔸🔸🔸🔸🔸`;
  }).join('\n\n');

  return `╔❀◎🎓◎❀════════════╗
𝗠𝗔𝗥𝗞𝗔𝗭 𝗧𝗜𝗞𝗥𝗔𝗥 𝗜𝗡𝗗𝗢𝗡𝗘𝗦𝗜𝗔
╚════════════❀◎🎓◎❀╝

بِسْــــــــــــــــــمِ اللهِ الرَّحْمَنِ الرَّحِيْمِ

السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ

📍  𝗥𝗘𝗠𝗜𝗡𝗗𝗘𝗥 𝗝𝗔𝗗𝗪𝗔𝗟 𝗛𝗔𝗟𝗔𝗤𝗔𝗛 𝗠𝗧𝗜 
*${batchName.toUpperCase()}*

🗓️  *${day_name}, ${date_masehi}*

${scheduleStr}

جزاكن الله خيرا وبارك الله فيكن  🌹🌹🌹

━━━━━━━━━━━━━━━━❁❁

𝗠𝗔𝗥𝗞𝗔𝗭 𝗧𝗜𝗞𝗥𝗔𝗥 𝗜𝗡𝗗𝗢𝗡𝗘𝗦𝗜𝗔

📱 *MTI OFFICIAL : 081330000784*
🪩  *Website MTI : markaztikrar.id*
🔗 *Tap Lynk : https://lynk.id/markaztikrar.id*`;
}

export function generateTagThalibah(halaqah: HalaqahForReminder, date: Date = new Date()): string {
  const juz = halaqah.preferred_juz || '';
  const muallimah_name = toTitleCase(halaqah.muallimah?.full_name || '');
  const time = formatTimeShort(halaqah.start_time);
  const day = getDayName(halaqah.day_of_week) || new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(date);
  const dateStr = getMasehiDate(date);
  
  const students = halaqah.students || [];
  const count = students.length;
  
  const studentList = students.map((s, index) => {
    const studentJuz = s.preferred_juz || juz;
    const juzLabel = studentJuz ? `(Juz ${studentJuz})` : '';
    return `${index + 1}. ${toTitleCase(s.full_name)} ${juzLabel}`.trim();
  }).join('\n');

  const classLabel = halaqah.class_type === 'pra_tahfidz' 
    ? '𝗞𝗘𝗟𝗔𝗦 𝗣𝗥𝗔 𝗧𝗜𝗞𝗥𝗔𝗥 𝗨𝗠𝗨𝗠' 
    : `𝗞𝗘𝗟𝗔𝗦 𝗧𝗜𝗞𝗥𝗔𝗥 𝗝𝗨𝗭 ${juz}`;
  
  const tanggal_hijri = getHijriDate(date);

  return `بِسْــــــــــــــــــمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ

*REMINDER ${classLabel}*

👑 *Ustadzah ${muallimah_name}*
🗓️  ${day}, ${dateStr} | ${tanggal_hijri}
⏰  Pukul ${time} WIB
🎗️  ........................ 
Izin tag Thalibah 
👥  ${count} Tholibah :

${studentList}

✨ _Zadanallah 'ilman wa hirsha._
_Semoga ALLAH ﷻ  menambahkan ilmu & semangat untuk kita._ ✨

_Yassarallaahu lanaa_

_Jazaakunnallaahu khayran wa baarakallaahu fiikunna.._ 

🌷🌷🌷🌷🌷`;
}

export function generateLaporanKelas(halaqah: HalaqahForReminder, date: Date = new Date()): string {
  const juz = halaqah.preferred_juz || '';
  const muallimah_name = toTitleCase(halaqah.muallimah?.full_name || '');
  const time = formatTimeShort(halaqah.start_time);
  const day = getDayName(halaqah.day_of_week) || new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(date);
  const dateStr = getMasehiDate(date);
  const tanggal_hijri = getHijriDate(date);
  
  const students = halaqah.students || [];
  const studentList = students.map((s, index) => {
    const studentJuz = s.preferred_juz || juz;
    const juzLabel = studentJuz ? `(Juz ${studentJuz})` : '';
    return `${index + 1}. ✅ ${toTitleCase(s.full_name)} ${juzLabel}`.trim();
  }).join('\n');

  const isPraTikrar = halaqah.class_type === 'pra_tahfidz';
  const classLabel = isPraTikrar ? 'PRA TIKRAR UMUM MTI' : `TIKRAR MTI Juz ${juz}`;

  return `*BERITA ACARA KELAS ${classLabel}.*
${day}, Pukul ${time} WIB

👑Ustadzah ${muallimah_name} حفظها الله تعالى
🏅Raisah : ........................ 
🗓 ${day}, ${dateStr} | ${tanggal_hijri}

Keterangan:
✅Hadir tepat waktu
☑️Hadir Terlambat
ℹ️Izin udzur syar'i
🅰️Tidak hadir/tanpa kabar

Tholibah :
${studentList}

Semoga Allah Subhaanahu wa Ta'aala mengangkat derajat dan membalas dengan sebaik-baik pahala kepada Ustadzah ${muallimah_name} حفظها الله تعالى atas ilmu dan waktunya yang telah diberikan. 

Dan juga kepada seluruh thallibah, _jazaakunallah khayran_ atas kehadirannya, semoga Allah berikan keberkahan ilmu dan waktunya. امين اللّهم امين

جزاكن الله خيرا و بارك الله فيكن جميعاً 🌻
❁ ━━━━━━ 📚 ━━━━━━ ❁`;
}
