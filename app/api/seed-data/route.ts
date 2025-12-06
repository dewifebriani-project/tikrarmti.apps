import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;

    // First, let's create a sample batch
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .upsert({
        name: 'Batch Tikrar Tahfidz 2024',
        description: 'Program Tahfidz Al-Quran dengan metode Tikrar Itqan',
        start_date: new Date('2024-01-01').toISOString(),
        end_date: new Date('2024-12-31').toISOString(),
        registration_start_date: new Date().toISOString(),
        registration_end_date: new Date('2024-12-31').toISOString(),
        status: 'open',
        is_free: false,
        price: 250000,
        total_quota: 100,
        duration_weeks: 52,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (batchError) {
      console.error('Error creating batch:', batchError);
      return NextResponse.json({ error: batchError.message }, { status: 500 });
    }

    // Now create sample programs
    const programs = [
      {
        batch_id: batch.id,
        name: 'Tikrar Tahfidz Program - Kelas Umum',
        description: 'Program tahfidz untuk semua level dengan metode tikrar itqan',
        target_level: 'beginner',
        duration_weeks: 52,
        max_thalibah: 50,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        batch_id: batch.id,
        name: 'Tikrar Tahfidz Program - Kelas Khusus',
        description: 'Program tahfidz khusus dengan pembimbingan one-on-one',
        target_level: 'intermediate',
        duration_weeks: 52,
        max_thalibah: 20,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        batch_id: batch.id,
        name: 'Musyrifah Training Program',
        description: 'Program pelatihan untuk calon musyrifah',
        target_level: 'advanced',
        duration_weeks: 12,
        max_thalibah: 30,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    const { data: createdPrograms, error: programsError } = await supabase
      .from('programs')
      .insert(programs)
      .select();

    if (programsError) {
      console.error('Error creating programs:', programsError);
      return NextResponse.json({ error: programsError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Sample data seeded successfully',
      batch: batch,
      programs: createdPrograms
    });
  } catch (error: any) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}