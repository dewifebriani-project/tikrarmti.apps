'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Users,
  UserCheck,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Batch {
  id: string;
  name: string;
  status: string;
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

  // Thalibah stats
  total_thalibah: number;
  approved_thalibah: number;
  pending_thalibah: number;
  graduated_thalibah: number;

  // Halaqah stats
  total_halaqah: number;
  halaqah_with_program: number;
  halaqah_without_program: number;

  // Capacity analysis
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

export function AnalysisTab() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [analysis, setAnalysis] = useState<BatchAnalysis | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadAnalysis(selectedBatchId);
    }
  }, [selectedBatchId]);

  const loadBatches = async () => {
    try {
      const response = await fetch('/api/admin/batches');
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
    try {
      // Get batch info
      const { data: batchData } = await supabase
        .from('batches')
        .select('id, name, status')
        .eq('id', batchId)
        .single();

      if (!batchData) {
        toast.error('Batch not found');
        return;
      }

      // Get muallimah stats
      const { data: muallimahs } = await supabase
        .from('muallimah_registrations')
        .select('id, status, preferred_max_thalibah')
        .eq('batch_id', batchId);

      const totalMuallimah = muallimahs?.length || 0;
      const approvedMuallimah = muallimahs?.filter(m => m.status === 'approved').length || 0;
      const pendingMuallimah = muallimahs?.filter(m => m.status === 'pending' || m.status === 'review').length || 0;
      const rejectedMuallimah = muallimahs?.filter(m => m.status === 'rejected').length || 0;

      // Get thalibah stats
      const { data: thalibahs } = await supabase
        .from('pendaftaran_tikrar_tahfidz')
        .select('id, status, final_status')
        .eq('batch_id', batchId);

      const totalThalibah = thalibahs?.length || 0;
      const approvedThalibah = thalibahs?.filter(t => t.status === 'approved').length || 0;
      const pendingThalibah = thalibahs?.filter(t => t.status === 'pending' || t.status === 'review').length || 0;
      const graduatedThalibah = thalibahs?.filter(t => t.final_status === 'lulus').length || 0;

      // Get halaqah stats
      const { data: halaqahs } = await supabase
        .from('halaqah')
        .select('id, program_id, max_students, muallimah_id')
        .eq('status', 'active');

      // Filter halaqahs by muallimah from this batch
      const approvedMuallimaIds = muallimahs?.filter(m => m.status === 'approved').map(m => m.user_id) || [];
      const batchHalaqahs = halaqahs?.filter(h => approvedMuallimaIds.includes(h.muallimah_id)) || [];

      const totalHalaqah = batchHalaqahs.length;
      const halaqahWithProgram = batchHalaqahs.filter(h => h.program_id !== null).length;
      const halaqahWithoutProgram = batchHalaqahs.filter(h => h.program_id === null).length;

      // Calculate capacity
      const totalCapacity = batchHalaqahs.reduce((sum, h) => sum + (h.max_students || 0), 0);

      // Get filled slots
      const halaqahIds = batchHalaqahs.map(h => h.id);
      const { data: students } = await supabase
        .from('halaqah_students')
        .select('id')
        .in('halaqah_id', halaqahIds)
        .eq('status', 'active');

      const filledSlots = students?.length || 0;
      const availableSlots = totalCapacity - filledSlots;
      const capacityPercentage = totalCapacity > 0 ? Math.round((filledSlots / totalCapacity) * 100) : 0;

      // Calculate ratios
      const ratio = approvedMuallimah > 0 ? `1:${Math.round(approvedThalibah / approvedMuallimah)}` : '0:0';
      const avgThalibahPerMuallimah = approvedMuallimah > 0 ? Math.round(approvedThalibah / approvedMuallimah) : 0;

      // Determine adequacy
      const recommendedRatio = 20; // 1 muallimah : 20 thalibah
      const isAdequate = avgThalibahPerMuallimah <= recommendedRatio;

      // Generate recommendation
      let recommendation = '';
      if (approvedMuallimah === 0) {
        recommendation = 'Belum ada muallimah yang diapprove. Segera review dan approve muallimah.';
      } else if (avgThalibahPerMuallimah > recommendedRatio) {
        const neededMuallimah = Math.ceil(approvedThalibah / recommendedRatio) - approvedMuallimah;
        recommendation = `Jumlah muallimah kurang memadai. Dibutuhkan tambahan ${neededMuallimah} muallimah untuk rasio ideal.`;
      } else if (avgThalibahPerMuallimah < 10 && approvedThalibah > 0) {
        recommendation = 'Jumlah muallimah berlebih. Pertimbangkan untuk meningkatkan kuota thalibah per halaqah.';
      } else {
        recommendation = 'Rasio muallimah dan thalibah sudah ideal. Pastikan semua halaqah sudah di-assign program.';
      }

      const analysisData: BatchAnalysis = {
        batch_id: batchData.id,
        batch_name: batchData.name,
        batch_status: batchData.status,

        total_muallimah: totalMuallimah,
        approved_muallimah: approvedMuallimah,
        pending_muallimah: pendingMuallimah,
        rejected_muallimah: rejectedMuallimah,

        total_thalibah: totalThalibah,
        approved_thalibah: approvedThalibah,
        pending_thalibah: pendingThalibah,
        graduated_thalibah: graduatedThalibah,

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
    } catch (error) {
      console.error('Error loading analysis:', error);
      toast.error('Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analysis) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-900"></div>
          <p className="text-sm text-gray-600">Loading analysis...</p>
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
            Analisis kecukupan muallimah dengan jumlah thalibah per batch
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
          onChange={(e) => setSelectedBatchId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900"
        >
          <option value="">-- Pilih Batch --</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name} ({batch.status})
            </option>
          ))}
        </select>
      </div>

      {analysis && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <span className="text-gray-600">Graduated:</span>
                  <span className="font-semibold text-purple-600">{analysis.graduated_thalibah}</span>
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
                  <span className="font-semibold text-gray-600">≤ 20</span>
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
        </>
      )}

      {!analysis && selectedBatchId && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Pilih batch untuk melihat analisis</p>
        </div>
      )}
    </div>
  );
}
