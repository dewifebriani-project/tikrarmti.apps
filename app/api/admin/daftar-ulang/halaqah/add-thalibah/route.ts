import { NextRequest, NextResponse } from 'next/server';
import { addThalibahToHalaqah, getEligibleThalibahForHalaqah } from '@/app/(protected)/admin/halaqah/actions';

/**
 * POST /api/admin/daftar-ulang/halaqah/add-thalibah
 * Add or move thalibah to halaqah
 *
 * Requires thalibah to be enrolled (completed daftar ulang)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { halaqahId, thalibahIds, halaqahType, batchId } = body;

    // Call server action
    const result = await addThalibahToHalaqah({
      halaqahId,
      thalibahIds,
      halaqahType
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[API add-thalibah] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/daftar-ulang/halaqah/add-thalibah?batch_id=xxx
 * Get eligible thalibah (completed daftar ulang) that can be added to halaqah
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id') || undefined;

    // Call server action
    const result = await getEligibleThalibahForHalaqah(batchId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error: any) {
    console.error('[API add-thalibah] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
