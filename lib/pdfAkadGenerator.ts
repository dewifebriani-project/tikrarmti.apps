import { jsPDF } from 'jspdf'

export async function generateAkadPDF(data: {
  fullName: string
  waPhone: string
  domicile: string
  chosenJuz: string
  pengabdian: string
  akadText: string
  dateStr: string
}) {
  const doc = new jsPDF()
  
  // Set fonts and sizes
  doc.setFont('helvetica')
  
  // Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('AKAD KESEPAKATAN PROGRAM TIKRAR TAHFIDZ', 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  let y = 35
  const lineHeight = 7
  const leftMargin = 20
  
  // Data Diri
  doc.setFont('helvetica', 'bold')
  doc.text('A. DATA DIRI', leftMargin, y)
  doc.setFont('helvetica', 'normal')
  y += lineHeight
  doc.text(`Nama Lengkap: ${data.fullName}`, leftMargin + 5, y)
  y += lineHeight
  doc.text(`No. WA: ${data.waPhone}`, leftMargin + 5, y)
  y += lineHeight
  doc.text(`Domisili: ${data.domicile}`, leftMargin + 5, y)
  y += lineHeight
  doc.text(`Juz Pilihan: ${data.chosenJuz}`, leftMargin + 5, y)
  y += lineHeight * 1.5
  
  // Komitmen Tambahan (Pengabdian/Donasi)
  doc.setFont('helvetica', 'bold')
  doc.text('B. KOMITMEN TAMBAHAN', leftMargin, y)
  doc.setFont('helvetica', 'normal')
  y += lineHeight
  
  // Split pengabdian text if it's too long
  const pengabdianLines = doc.splitTextToSize(`Pilihan: ${data.pengabdian}`, 160)
  doc.text(pengabdianLines, leftMargin + 5, y)
  y += (pengabdianLines.length * lineHeight) + (lineHeight * 0.5)
  
  // Isi Akad
  doc.setFont('helvetica', 'bold')
  doc.text('C. PERNYATAAN AKAD', leftMargin, y)
  doc.setFont('helvetica', 'normal')
  y += lineHeight
  
  const akadLines = doc.splitTextToSize(data.akadText, 170)
  
  // Paginate Akad text
  for (let i = 0; i < akadLines.length; i++) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    doc.text(akadLines[i], leftMargin, y)
    y += 6
  }
  
  y += lineHeight
  if (y > 250) {
    doc.addPage()
    y = 20
  }
  
  // Signature Area
  doc.text(data.dateStr, 130, y)
  y += lineHeight
  doc.text('Yang Menyatakan,', 130, y)
  
  y += 25
  doc.text('(_________________________)', 130, y)
  y += 5
  doc.text(data.fullName, 133, y)
  
  doc.save(`Akad_Tikrar_Tahfidz_${data.fullName.replace(/\s+/g, '_')}.pdf`)
}
