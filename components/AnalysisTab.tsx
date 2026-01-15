'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  HeartHandshake,
  BookOpen,
  ChevronRight,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Batch {
  id: string;
  name: string;
  status: string;
}

interface MuallimaRegistration {
  id: string;
  status: string;
  preferred_max_thalibah: number | null;
  user_id: string;
}

interface ThalibahRegistration {
  id: string;
  status: string;
  selection_status: string | null;
}

interface Halaqah {
  id: string;
  program_id: string | null;
  max_students: number | null;
  muallimah_id: string | null;
}

interface HalaqahStudent {
  id: string;
}

interface DaftarUlangSubmission {
  id: string;
  status: string;
  ujian_halaqah_id: string | null;
  tashih_halaqah_id: string | null;
  is_tashih_umum: boolean;
  user_id: string;
}

interface BatchAnalysis {
  batch_id: string;
  batch_name: string;
  batch_status: string;

  // Muallimah stats
  total_muallimah: number;
  approved_muallimah: number;
  pending_muallimah: number;
  rejected_muallimah: number;

  // Thalibah stats (from pendaftaran_tikrar_tahfidz)
  total_thalibah: number;
  approved_thalibah: number;
  pending_thalibah: number;
  selected_thalibah: number;

  // Daftar Ulang stats
  total_daftar_ulang: number;
  submitted_daftar_ulang: number;
  approved_daftar_ulang: number;

  // Halaqah stats
  total_halaqah: number;
  halaqah_with_program: number;
  halaqah_without_program: number;

  // Capacity analysis (including daftar ulang submissions)
  total_halaqah_capacity: number;
  total_filled_slots: number;
  total_available_slots: number;
  capacity_percentage: number;

  // Ratio analysis
  muallimah_thalibah_ratio: string;
  avg_thalibah_per_muallimah: number;

  // Status
  is_adequate: boolean;
  recommendation: string;
}

interface MatchingAnalysis {
  user_id: string;
  user_name: string;
  user_juz: string;
  user_juz_number: number;
  user_zona_waktu: string;
  user_main_time: string;
  user_backup_time: string;
  total_matches: number;
  zona_waktu_matches: number;
  same_juz_matches: number;
  cross_juz_matches: number;
}

interface HalaqahAvailability {
  juz_number: number;
  juz_name: string;
  total_thalibah: number;
  thalibah_breakdown: Record<string, { code: string; name: string; part: string; thalibah_count: number }>;
  total_halaqah: number;
  total_capacity: number;
  total_filled: number;
  total_available: number;
  needed_halaqah: number;
  utilization_percentage: number;
  halaqah_details: any[];
}

type AnalysisTabType = 'overview' | 'matching';

export function AnalysisTab() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AnalysisTabType>('overview');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [analysis, setAnalysis] = useState<BatchAnalysis | null>(null);
  const [matchingData, setMatchingData] = useState<MatchingAnalysis[]>([]);
  const [halaqahData, setHalaqahData] = useState<HalaqahAvailability[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisErrorDetails, setAnalysisErrorDetails] = useState<any>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      if (activeTab === 'overview') {
        loadAnalysis(selectedBatchId);
        loadHalaqahAvailability(selectedBatchId);
      } else if (activeTab === 'matching') {
        loadMatchingAnalysis(selectedBatchId);
      }
    }
  }, [selectedBatchId, activeTab]);

  const loadBatches = async () => {
    try {
      // Fetch all batches without pagination limit
      const response = await fetch('/api/admin/batches?limit=1000');
      if (response.ok) {
        const result = await response.json();
        const activeBatches = (result.data || []).filter(
          (b: Batch) => b.status === 'open' || b.status === 'closed'
        );
        setBatches(activeBatches);

        // Auto-select first batch
        if (activeBatches.length > 0 && !selectedBatchId) {
          setSelectedBatchId(activeBatches[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async (batchId: string) => {
    setLoading(true);
    setAnalysisError(null);
    try {
      console.log('[AnalysisTab] Loading analysis for batch:', batchId);

      // Use API endpoint to get analysis data (bypasses RLS)
      const analysisResponse = await fetch(`/api/admin/analysis?batch_id=${batchId}`);

      console.log('[AnalysisTab] Analysis response status:', analysisResponse.status);
      console.log('[AnalysisTab] Analysis response ok:', analysisResponse.ok);

      if (!analysisResponse.ok) {
        let errorData;
        try {
          errorData = await analysisResponse.json();
          console.error('[AnalysisTab] Error response data:', errorData);
        } catch (e) {
          console.error('[AnalysisTab] Failed to parse error response:', e);
          const responseText = await analysisResponse.text();
          console.error('[AnalysisTab] Response text:', responseText.substring(0, 500));
          errorData = { error: `HTTP ${analysisResponse.status}`, details: responseText.substring(0, 200) };
        }
        console.error('[AnalysisTab] Failed to load analysis:', analysisResponse.status, errorData);
        const errorMsg = errorData.error || `Failed to load analysis data (${analysisResponse.status})`;
        toast.error(errorMsg);
        setAnalysisError(errorMsg);
        setAnalysisErrorDetails(errorData);
        setLoading(false);
        return;
      }

      let analysisResult;
      try {
        analysisResult = await analysisResponse.json();
        console.log('[AnalysisTab] Analysis API result:', analysisResult);
      } catch (e) {
        console.error('[AnalysisTab] Failed to parse JSON response:', e);
        const responseText = await analysisResponse.text();
        console.error('[AnalysisTab] Response text:', responseText.substring(0, 500));
        const errorMsg = 'Invalid JSON response from server';
        toast.error(errorMsg);
        setAnalysisError(errorMsg);
        setAnalysisErrorDetails({ error: errorMsg, details: responseText.substring(0, 200) });
        setLoading(false);
        return;
      }

      if (!analysisResult.success || !analysisResult.data) {
        console.error('[AnalysisTab] Invalid analysis response');
        const errorMsg = 'Invalid analysis data received';
        toast.error(errorMsg);
        setAnalysisError(errorMsg);
        setAnalysisErrorDetails({ error: errorMsg, result: analysisResult });
        setLoading(false);
        return;
      }

      // Clear error details on success
      setAnalysisErrorDetails(null);

      const { batch, muallimahs, thalibahs, halaqahs, students, daftarUlangSubmissions } = analysisResult.data;

      console.log('[AnalysisTab] Batch data:', batch);
      console.log('[AnalysisTab] Muallimah count:', muallimahs.length);
      console.log('[AnalysisTab] Thalibah count:', thalibahs.length);
      console.log('[AnalysisTab] Halaqah count:', halaqahs.length);
      console.log('[AnalysisTab] Students count:', students.length);
      console.log('[AnalysisTab] Daftar Ulang submissions count:', daftarUlangSubmissions?.length || 0);

      // Process muallimah stats
      const muallimaList = (muallimahs || []) as MuallimaRegistration[];
      const totalMuallimah = muallimaList.length;
      const approvedMuallimah = muallimaList.filter((m: MuallimaRegistration) => m.status === 'approved').length;
      const pendingMuallimah = muallimaList.filter((m: MuallimaRegistration) => m.status === 'pending' || m.status === 'review').length;
      const rejectedMuallimah = muallimaList.filter((m: MuallimaRegistration) => m.status === 'rejected').length;

      console.log('[AnalysisTab] Muallimah stats:', {
        total: totalMuallimah,
        approved: approvedMuallimah,
        pending: pendingMuallimah,
        rejected: rejectedMuallimah
      });

      // Process thalibah stats
      const thalibahList = (thalibahs || []) as ThalibahRegistration[];
      const totalThalibah = thalibahList.length;
      const approvedThalibah = thalibahList.filter((t: ThalibahRegistration) => t.status === 'approved').length;
      const pendingThalibah = thalibahList.filter((t: ThalibahRegistration) => t.status === 'pending').length;
      const selectedThalibah = thalibahList.filter((t: ThalibahRegistration) => t.selection_status === 'selected').length;

      console.log('[AnalysisTab] Thalibah stats:', {
        total: totalThalibah,
        approved: approvedThalibah,
        pending: pendingThalibah,
        selected: selectedThalibah
      });

      // Process daftar ulang stats
      const daftarUlangList = (daftarUlangSubmissions || []) as DaftarUlangSubmission[];
      const totalDaftarUlang = daftarUlangList.length;
      const submittedDaftarUlang = daftarUlangList.filter((d: DaftarUlangSubmission) => d.status === 'submitted').length;
      const approvedDaftarUlang = daftarUlangList.filter((d: DaftarUlangSubmission) => d.status === 'approved').length;

      console.log('[AnalysisTab] Daftar Ulang stats:', {
        total: totalDaftarUlang,
        submitted: submittedDaftarUlang,
        approved: approvedDaftarUlang
      });

      // Filter halaqahs by muallimah from this batch
      const approvedMuallimaIds = muallimaList.filter((m: MuallimaRegistration) => m.status === 'approved').map((m: MuallimaRegistration) => m.user_id);
      const halaqahList = (halaqahs || []) as Halaqah[];
      const batchHalaqahs = halaqahList.filter((h: Halaqah) => h.muallimah_id && approvedMuallimaIds.includes(h.muallimah_id));

      console.log('[AnalysisTab] Halaqah filtering:', {
        totalHalaqahs: halaqahList.length,
        approvedMuallimaCount: approvedMuallimaIds.length,
        batchHalaqahsCount: batchHalaqahs.length
      });

      const totalHalaqah = batchHalaqahs.length;
      const halaqahWithProgram = batchHalaqahs.filter((h: Halaqah) => h.program_id !== null).length;
      const halaqahWithoutProgram = batchHalaqahs.filter((h: Halaqah) => h.program_id === null).length;

      // Calculate capacity - include BOTH halaqah_students AND daftar ulang submissions
      // Use the SAME logic as /api/shared/halaqah-quota for consistency
      const totalCapacity = batchHalaqahs.reduce((sum: number, h: Halaqah) => sum + (h.max_students || 0), 0);

      // Count students per halaqah using Set to track unique users per halaqah
      // This matches the logic in /api/shared/halaqah-quota
      const halaqahStudentMap = new Map<string, Set<string>>();

      // Count from daftar_ulang_submissions (submitted + approved)
      daftarUlangList.forEach((submission: DaftarUlangSubmission) => {
        // For tashih_ujian classes, ujian_halaqah_id and tashih_halaqah_id may be the same
        // We need to count each user only once per halaqah, even if they selected both ujian and tashih
        const uniqueHalaqahIds: string[] = [];

        if (submission.ujian_halaqah_id && batchHalaqahIds.includes(submission.ujian_halaqah_id)) {
          uniqueHalaqahIds.push(submission.ujian_halaqah_id);
        }
        if (submission.tashih_halaqah_id && !submission.is_tashih_umum && batchHalaqahIds.includes(submission.tashih_halaqah_id)) {
          // Only add if not already in the list (for tashih_ujian case)
          if (!uniqueHalaqahIds.includes(submission.tashih_halaqah_id)) {
            uniqueHalaqahIds.push(submission.tashih_halaqah_id);
          }
        }

        // Add user to each unique halaqah
        for (let i = 0; i < uniqueHalaqahIds.length; i++) {
          const halaqahId = uniqueHalaqahIds[i];
          if (!halaqahStudentMap.has(halaqahId)) {
            halaqahStudentMap.set(halaqahId, new Set());
          }
          halaqahStudentMap.get(halaqahId)!.add(submission.user_id);
        }
      });

      // Count from halaqah_students table (active students only)
      // We need to query by batch halaqah IDs
      const batchHalaqahIds = batchHalaqahs.map(h => h.id);

      // Since we only have student IDs without halaqah_id info in the current data,
      // we'll count from the students array (these are already filtered by batch halaqahs)
      const filledSlotsFromStudents = students?.length || 0;

      // Count total unique students from daftar ulang submissions
      let filledSlotsFromDaftarUlang = 0;
      const halaqahEntries = Array.from(halaqahStudentMap.entries());
      for (const [halaqahId, userSet] of halaqahEntries) {
        filledSlotsFromDaftarUlang += userSet.size;
      }

      const filledSlots = filledSlotsFromStudents + filledSlotsFromDaftarUlang;

      console.log('[AnalysisTab] Capacity calculation:', {
        totalCapacity,
        filledSlotsFromStudents,
        filledSlotsFromDaftarUlang: filledSlotsFromDaftarUlang,
        totalFilledSlots: filledSlots
      });

      const availableSlots = Math.max(0, totalCapacity - filledSlots);
      const capacityPercentage = totalCapacity > 0 ? Math.round((filledSlots / totalCapacity) * 100) : 0;

      // Calculate ratios - using SELECTED thalibah (sudah lulus ujian seleksi)
      const ratio = approvedMuallimah > 0 ? `1:${Math.round(selectedThalibah / approvedMuallimah)}` : '0:0';
      const avgThalibahPerMuallimah = approvedMuallimah > 0 ? Math.round(selectedThalibah / approvedMuallimah) : 0;

      // Determine adequacy - UPDATED: 1:10 maksimal
      const recommendedRatio = 10; // 1 muallimah : 10 thalibah (MAKSIMAL)
      const isAdequate = avgThalibahPerMuallimah <= recommendedRatio;

      // Generate recommendation
      let recommendation = '';
      if (approvedMuallimah === 0) {
        recommendation = 'Belum ada muallimah yang diapprove. Segera review dan approve muallimah.';
      } else if (selectedThalibah === 0) {
        recommendation = 'Belum ada thalibah yang selected (lulus ujian seleksi). Tunggu proses ujian VN dan pilihan ganda selesai.';
      } else if (avgThalibahPerMuallimah > recommendedRatio) {
        const neededMuallimah = Math.ceil(selectedThalibah / recommendedRatio) - approvedMuallimah;
        recommendation = `Jumlah muallimah kurang memadai. Dibutuhkan tambahan ${neededMuallimah} muallimah untuk rasio ideal (1:10 maksimal).`;
      } else if (avgThalibahPerMuallimah < 5 && selectedThalibah > 0) {
        recommendation = 'Jumlah muallimah berlebih. Pertimbangkan untuk meningkatkan kuota thalibah per halaqah.';
      } else {
        recommendation = 'Rasio muallimah dan thalibah sudah ideal. Siap untuk dijadwalkan ke halaqah.';
      }

      const analysisData: BatchAnalysis = {
        batch_id: batch.id,
        batch_name: batch.name,
        batch_status: batch.status,

        total_muallimah: totalMuallimah,
        approved_muallimah: approvedMuallimah,
        pending_muallimah: pendingMuallimah,
        rejected_muallimah: rejectedMuallimah,

        total_thalibah: totalThalibah,
        approved_thalibah: approvedThalibah,
        pending_thalibah: pendingThalibah,
        selected_thalibah: selectedThalibah,

        total_daftar_ulang: totalDaftarUlang,
        submitted_daftar_ulang: submittedDaftarUlang,
        approved_daftar_ulang: approvedDaftarUlang,

        total_halaqah: totalHalaqah,
        halaqah_with_program: halaqahWithProgram,
        halaqah_without_program: halaqahWithoutProgram,

        total_halaqah_capacity: totalCapacity,
        total_filled_slots: filledSlots,
        total_available_slots: availableSlots,
        capacity_percentage: capacityPercentage,

        muallimah_thalibah_ratio: ratio,
        avg_thalibah_per_muallimah: avgThalibahPerMuallimah,

        is_adequate: isAdequate,
        recommendation: recommendation
      };

      setAnalysis(analysisData);
      setAnalysisError(null);
    } catch (error) {
      console.error('Error loading analysis:', error);
      const errorMsg = 'Failed to load analysis';
      toast.error(errorMsg);
      setAnalysisError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchingAnalysis = async (batchId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analysis/matching?batch_id=${batchId}`);
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to load matching analysis');
        setLoading(false);
        return;
      }

      const result = await response.json();
      setMatchingData(result.data?.matches || []);
    } catch (error) {
      console.error('Error loading matching analysis:', error);
      toast.error('Failed to load matching analysis');
    } finally {
      setLoading(false);
    }
  };

  const loadHalaqahAvailability = async (batchId: string) => {
    console.log('[AnalysisTab] Loading halaqah availability for batch:', batchId);
    try {
      const response = await fetch(`/api/admin/analysis/halaqah-availability?batch_id=${batchId}`);
      console.log('[AnalysisTab] Halaqah availability response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('[AnalysisTab] Halaqah availability error:', errorData);
        } catch (e) {
          const responseText = await response.text();
          console.error('[AnalysisTab] Halaqah availability response text:', responseText.substring(0, 500));
          errorData = { error: `HTTP ${response.status}` };
        }
        toast.error(errorData.error || 'Failed to load halaqah availability');
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log('[AnalysisTab] Halaqah availability data:', result);
      setHalaqahData(result.data?.availability || []);
    } catch (error) {
      console.error('Error loading halaqah availability:', error);
      toast.error('Failed to load halaqah availability');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analysis && activeTab === 'overview') {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900"></div>
          <p className="text-sm text-gray-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (loading && matchingData.length === 0 && activeTab === 'matching') {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900"></div>
          <p className="text-sm text-gray-600">Loading matching analysis...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Batch Analysis</h2>
          <p className="text-sm text-gray-600 mt-1">
            Analisis kecukupan muallimah, matching pasangan belajar, dan ketersediaan halaqah
          </p>
        </div>
      </div>

      {/* Batch Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pilih Batch untuk Analisis
        </label>
        <select
          value={selectedBatchId}
          onChange={(e) => {
            setSelectedBatchId(e.target.value);
            setLoading(true);
          }}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900"
        >
          <option value="">-- Pilih Batch --</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name} ({batch.status})
            </option>
          ))}
        </select>

        {/* DEBUG INFO - Temporary */}
        {selectedBatchId && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
            <p><strong>DEBUG INFO:</strong></p>
            <p>Selected Batch ID: {selectedBatchId}</p>
            <p>Active Tab: {activeTab}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Analysis Loaded: {analysis ? 'Yes' : 'No'}</p>
            <p>Analysis Error: {analysisError || 'None'}</p>
            {analysisErrorDetails && (
              <>
                <p className="mt-2 text-red-600"><strong>Error Details:</strong></p>
                <pre className="text-xs bg-red-50 p-2 rounded overflow-auto">
                  {JSON.stringify(analysisErrorDetails, null, 2)}
                </pre>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => { setActiveTab('overview'); setLoading(true); }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-green-900 text-green-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => { setActiveTab('matching'); setLoading(true); }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'matching'
                  ? 'border-green-900 text-green-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              Matching Pasangan
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && analysis && (
        <>
          {/* Recommendation Card */}
          <div className={`rounded-lg shadow p-6 ${
            analysis.is_adequate
              ? 'bg-green-50 border border-green-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              {analysis.is_adequate ? (
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  analysis.is_adequate ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  {analysis.is_adequate ? 'Rasio Ideal' : 'Perlu Perhatian'}
                </h3>
                <p className={`text-sm ${
                  analysis.is_adequate ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {analysis.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Muallimah Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Total Muallimah</h3>
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{analysis.total_muallimah}</p>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Approved:</span>
                  <span className="font-semibold text-green-600">{analysis.approved_muallimah}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-semibold text-yellow-600">{analysis.pending_muallimah}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rejected:</span>
                  <span className="font-semibold text-red-600">{analysis.rejected_muallimah}</span>
                </div>
              </div>
            </div>

            {/* Thalibah Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Total Thalibah</h3>
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{analysis.total_thalibah}</p>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Approved:</span>
                  <span className="font-semibold text-green-600">{analysis.approved_thalibah}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-semibold text-yellow-600">{analysis.pending_thalibah}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Selected:</span>
                  <span className="font-semibold text-purple-600">{analysis.selected_thalibah}</span>
                </div>
              </div>
            </div>

            {/* Daftar Ulang Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Daftar Ulang</h3>
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{analysis.total_daftar_ulang}</p>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-semibold text-blue-600">{analysis.submitted_daftar_ulang}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Approved:</span>
                  <span className="font-semibold text-green-600">{analysis.approved_daftar_ulang}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-semibold text-gray-600">
                    {analysis.selected_thalibah > 0
                      ? `${Math.round((analysis.total_daftar_ulang / analysis.selected_thalibah) * 100)}%`
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Halaqah Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Total Halaqah</h3>
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{analysis.total_halaqah}</p>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">With Program:</span>
                  <span className="font-semibold text-green-600">{analysis.halaqah_with_program}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Without Program:</span>
                  <span className="font-semibold text-yellow-600">{analysis.halaqah_without_program}</span>
                </div>
              </div>
            </div>

            {/* Ratio Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Muallimah : Thalibah</h3>
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{analysis.muallimah_thalibah_ratio}</p>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg per Muallimah:</span>
                  <span className="font-semibold text-orange-600">{analysis.avg_thalibah_per_muallimah}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Recommended:</span>
                  <span className="font-semibold text-gray-600">≤ 10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Analysis */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-green-900" />
              <h3 className="text-lg font-semibold text-gray-900">Analisis Kapasitas Halaqah</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Kapasitas</p>
                <p className="text-2xl font-bold text-gray-900">{analysis.total_halaqah_capacity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Terisi</p>
                <p className="text-2xl font-bold text-green-600">{analysis.total_filled_slots}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tersedia</p>
                <p className="text-2xl font-bold text-blue-600">{analysis.total_available_slots}</p>
              </div>
            </div>

            {/* Capacity Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Pengisian Kapasitas</span>
                <span className="font-semibold">{analysis.capacity_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    analysis.capacity_percentage >= 90
                      ? 'bg-red-600'
                      : analysis.capacity_percentage >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(analysis.capacity_percentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {analysis.capacity_percentage >= 90
                  ? 'Kapasitas hampir penuh. Pertimbangkan membuka halaqah baru.'
                  : analysis.capacity_percentage >= 70
                  ? 'Kapasitas terisi cukup baik.'
                  : 'Masih banyak slot tersedia untuk thalibah baru.'}
              </p>
            </div>
          </div>

          {/* Halaqah Availability per Juz */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-green-900" />
              <h3 className="text-lg font-semibold text-gray-900">Analisis Kapasitas Halaqah per Juz</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Analisis ketersediaan halaqah untuk setiap juz. Minimum kapasitas per halaqah adalah 5 thalibah.
            </p>

            {halaqahData.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada data halaqah. Pilih batch untuk melihat analisis.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {halaqahData.map((juz) => {
                  const needsMoreHalaqah = juz.needed_halaqah > 0;
                  const utilizationColor = juz.utilization_percentage >= 90 ? 'red' :
                                         juz.utilization_percentage >= 70 ? 'yellow' : 'green';
                  const breakdownEntries = Object.entries(juz.thalibah_breakdown || {});

                  return (
                    <div key={juz.juz_number} className={`border rounded-lg p-6 ${
                      needsMoreHalaqah ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}>
                      {/* Juz Header */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">{juz.juz_name}</h4>
                            <p className="text-sm text-gray-600">Juz {juz.juz_number}</p>
                          </div>
                          {needsMoreHalaqah ? (
                            <div className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg">
                              <AlertTriangle className="w-5 h-5" />
                              <span className="font-semibold">Butuh {juz.needed_halaqah} Halaqah</span>
                            </div>
                          ) : juz.total_available >= 5 ? (
                            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-semibold">Kapasitas Cukup</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
                              <Clock className="w-5 h-5" />
                              <span className="font-semibold">Kapasitas Terbatas</span>
                            </div>
                          )}
                        </div>

                        {/* Thalibah Breakdown */}
                        {breakdownEntries.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs font-medium text-blue-900 mb-2">Breakdown per Tipe:</p>
                            <div className="flex gap-3 flex-wrap">
                              {breakdownEntries.map(([code, data]: [string, any]) => (
                                <div key={code} className="text-xs">
                                  <span className="font-semibold text-blue-800">{data.code}:</span>
                                  <span className="text-blue-700 ml-1">{data.thalibah_count} thalibah</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg p-3 border">
                            <p className="text-xs text-gray-600 mb-1">Total Thalibah</p>
                            <p className="text-2xl font-bold text-blue-600">{juz.total_thalibah}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <p className="text-xs text-gray-600 mb-1">Total Halaqah</p>
                            <p className="text-2xl font-bold text-purple-600">{juz.total_halaqah}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <p className="text-xs text-gray-600 mb-1">Total Kapasitas</p>
                            <p className="text-2xl font-bold text-gray-900">{juz.total_capacity}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <p className="text-xs text-gray-600 mb-1">Tersedia</p>
                            <p className="text-2xl font-bold text-green-600">{juz.total_available}</p>
                          </div>
                        </div>

                      {/* Capacity Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-700 mb-2">
                          <span className="font-medium">Utilisasi Kapasitas</span>
                          <span className={`font-bold ${
                            utilizationColor === 'red' ? 'text-red-600' :
                            utilizationColor === 'yellow' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {juz.utilization_percentage}% ({juz.total_filled}/{juz.total_capacity})
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all bg-${utilizationColor}-600`}
                            style={{ width: `${Math.min(juz.utilization_percentage, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          {juz.needed_halaqah > 0
                            ? `Kapasitas tidak cukup. Dibutuhkan ${juz.needed_halaqah} halaqah tambahan untuk menampung ${juz.total_thalibah} thalibah (min. 5 per halaqah).`
                            : juz.utilization_percentage >= 90
                            ? 'Kapasitas hampir penuh. Pertimbangkan membuka halaqah cadangan.'
                            : 'Kapasitas memadai untuk menampung semua thalibah.'}
                        </p>
                      </div>

                      {/* Halaqah Details */}
                      {juz.halaqah_details && juz.halaqah_details.length > 0 ? (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-gray-600" />
                            <p className="text-sm font-semibold text-gray-900">Daftar Halaqah ({juz.halaqah_details.length})</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {juz.halaqah_details.map((halaqah: any, idx: number) => {
                              const halaqahUtilColor = halaqah.utilization_percent >= 90 ? 'red' :
                                                     halaqah.utilization_percent >= 70 ? 'yellow' : 'green';
                              return (
                                <div key={idx} className="bg-white rounded-lg border p-4">
                                  <p className="font-semibold text-gray-900 text-sm mb-2">{halaqah.name}</p>

                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Hari:</span>
                                      <span className="font-medium">{halaqah.day_name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Waktu:</span>
                                      <span className="font-medium">
                                        {halaqah.start_time && halaqah.end_time
                                          ? `${halaqah.start_time} - ${halaqah.end_time}`
                                          : '-'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Kapasitas:</span>
                                      <span className="font-medium">{halaqah.max_students}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Terisi:</span>
                                      <span className="font-medium text-blue-600">{halaqah.current_students}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Tersedia:</span>
                                      <span className="font-medium text-green-600">{halaqah.available_slots}</span>
                                    </div>
                                  </div>

                                  {/* Mini utilization bar */}
                                  <div className="mt-3">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-gray-600">Utilisasi:</span>
                                      <span className={`font-bold text-${halaqahUtilColor}-600`}>
                                        {halaqah.utilization_percent}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full bg-${halaqahUtilColor}-500`}
                                        style={{ width: `${Math.min(halaqah.utilization_percent, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Tidak ada halaqah tersedia untuk juz ini.</p>
                          {juz.total_thalibah > 0 && (
                            <p className="text-xs text-red-600 mt-1">
                              Dibutuhkan setidaknya {Math.ceil(juz.total_thalibah / 5)} halaqah untuk {juz.total_thalibah} thalibah.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'matching' && (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <HeartHandshake className="w-5 h-5 text-green-900" />
              <h3 className="text-lg font-semibold text-gray-900">Analisis Matching Pasangan Belajar</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Analisis potensi matching pasangan belajar untuk setiap thalibah. Prioritas: zona waktu sama &gt; juz option sama &gt; juz number sama &gt; lintas juz.
            </p>

            {matchingData.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada data matching. Pilih batch untuk melihat analisis.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Juz</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zona Waktu</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Utama</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Matches</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Zona Waktu</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Juz Sama</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Lintas Juz</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {matchingData.map((match) => (
                      <tr key={match.user_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{match.user_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{match.user_juz}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{match.user_zona_waktu || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{match.user_main_time}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            match.total_matches > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {match.total_matches}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-purple-600">{match.zona_waktu_matches}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-blue-600">{match.same_juz_matches}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-orange-600">{match.cross_juz_matches}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!analysis && selectedBatchId && activeTab === 'overview' && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          {analysisError ? (
            <>
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium mb-2">Gagal memuat analisis</p>
              <p className="text-gray-600 text-sm mb-2">{analysisError}</p>
              <p className="text-gray-400 text-xs">Batch ID: {selectedBatchId}</p>
            </>
          ) : (
            <>
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Pilih batch untuk melihat analisis</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
