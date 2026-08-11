import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  const supabase = createSupabaseAdmin()
  
  const recordData = {
    user_id: 'e8fda077-7ff3-42fd-bc3f-e2d60d0d0c75', // valid UUID
    blok: 'H1A',
    lokasi: 'mti',
    ustadzah_id: id,
    jumlah_kesalahan_tajwid: 0,
    masalah_tajwid: [],
    waktu_tashih: new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('tashih_records')
    .insert(recordData)
    
  return new Response(JSON.stringify({ error }))
}
