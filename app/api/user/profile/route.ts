import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Optimized query with only necessary fields
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, whatsapp, telegram, alamat, zona_waktu, tanggal_lahir, kota, tempat_lahir, negara, provinsi')
      .eq('id', userId)
      .single()

    if (error) {
      // Remove excessive logging for performance
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    // Optimized age calculation
    let age = 0
    if (data?.tanggal_lahir) {
      const birthDate = new Date(data.tanggal_lahir)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }

    // Minimal object creation for better performance
    const userProfile = {
      id: data.id,
      full_name: data.full_name || '',
      email: data.email || '',
      whatsapp: data.whatsapp || '',
      telegram: data.telegram || '',
      alamat: data.alamat || '',
      zona_waktu: data.zona_waktu || '',
      tanggal_lahir: data.tanggal_lahir || null,
      kota: data.kota || '',
      tempat_lahir: data.tempat_lahir || '',
      negara: data.negara || '',
      provinsi: data.provinsi || '',
      age: age.toString()
    }

    // Add cache headers for better performance
    return NextResponse.json(userProfile, {
      headers: {
        'Cache-Control': 'public, max-age=60', // 1 minute cache for user data
      }
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}