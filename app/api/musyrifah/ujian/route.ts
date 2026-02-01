import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has musyrifah role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = userData?.roles || [];
    if (!roles.includes('musyrifah')) {
      return NextResponse.json({ error: 'Forbidden: Musyrifah access required' }, { status: 403 });
    }

    // Get all ujian results
    const { data: allResults, error } = await supabase
      .from('exam_attempts')
      .select(`
        id,
        thalibah_id,
        juz_number,
        score,
        status,
        submitted_at,
        created_at,
        updated_at,
        thalibah:users(id, full_name, nama_kunyah, whatsapp, email, confirmed_chosen_juz)
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    // Group results by thalibah_id and juz_number
    // For each thalibah-juz combination, keep only the best attempt (highest score or latest)
    const resultKey = new Map<string, any>(); // key: "thalibahId_juzNumber"

    allResults?.forEach((attempt: any) => {
      const key = `${attempt.thalibah_id}_${attempt.juz_number}`;
      const existing = resultKey.get(key);

      if (!existing) {
        // First attempt for this thalibah-juz combination
        resultKey.set(key, attempt);
      } else {
        // Compare with existing attempt
        // Priority: passed > failed, then by score (higher is better), then by latest date
        const existingScore = existing.score || 0;
        const currentScore = attempt.score || 0;
        const existingStatus = existing.status;
        const currentStatus = attempt.status;

        let shouldReplace = false;

        // If current is passed and existing is not passed, replace
        if (currentStatus === 'passed' && existingStatus !== 'passed') {
          shouldReplace = true;
        } else if (currentStatus === existingStatus) {
          // If same status, use higher score
          if (currentScore > existingScore) {
            shouldReplace = true;
          } else if (currentScore === existingScore) {
            // If same score, use latest (submitted_at)
            const existingDate = new Date(existing.submitted_at || existing.created_at);
            const currentDate = new Date(attempt.submitted_at || attempt.created_at);
            if (currentDate > existingDate) {
              shouldReplace = true;
            }
          }
        }

        if (shouldReplace) {
          resultKey.set(key, attempt);
        }
      }
    });

    // Get unique results
    const uniqueResults = Array.from(resultKey.values());

    // Group by thalibah_id for better UI display
    const resultsByThalibah = new Map<string, any[]>();
    uniqueResults.forEach((result: any) => {
      if (!resultsByThalibah.has(result.thalibah_id)) {
        resultsByThalibah.set(result.thalibah_id, []);
      }
      const thalibahResults = resultsByThalibah.get(result.thalibah_id);
      if (thalibahResults) {
        thalibahResults.push(result);
      }
    });

    // Calculate summary for each thalibah
    const thalibahSummaries = new Map();
    resultsByThalibah.forEach((attempts: any[], thalibahId: string) => {
      const passedAttempts = attempts.filter((a: any) => a.status === 'passed');
      const uniqueJuz = new Set(attempts.map((a: any) => a.juz_number));
      const firstAttempt = attempts[attempts.length - 1]; // latest first

      thalibahSummaries.set(thalibahId, {
        total_attempts: attempts.length,
        passed_attempts: passedAttempts.length,
        unique_juz_count: uniqueJuz.size,
        latest_attempt_date: firstAttempt?.submitted_at || firstAttempt?.created_at,
      });
    });

    // Build final response with grouped data
    const groupedData = Array.from(resultsByThalibah.entries()).map(([thalibahId, attempts]) => {
      const summary = thalibahSummaries.get(thalibahId);
      const thalibahInfo = attempts[0]?.thalibah || {};

      return {
        thalibah_id: thalibahId,
        thalibah: thalibahInfo,
        summary,
        attempts: attempts.map((a: any) => ({
          id: a.id,
          juz_number: a.juz_number,
          score: a.score,
          status: a.status,
          submitted_at: a.submitted_at,
          created_at: a.created_at,
          updated_at: a.updated_at,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: groupedData,
    });
  } catch (error: any) {
    console.error('Error in musyrifah ujian API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
