"use client";

import { useState, useEffect, Fragment } from "react";
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
  FileText,
  Award,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

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

interface HalaqahAvailability {
  juz_number: number;
  juz_name: string;
  total_thalibah: number;
  thalibah_breakdown: Record<
    string,
    { code: string; name: string; part: string; thalibah_count: number }
  >;
  total_halaqah: number;
  total_capacity: number;
  total_filled: number;
  total_available: number;
  needed_halaqah: number;
  utilization_percentage: number;
  total_schedules?: number;
  halaqah_details: any[];
}

type AnalysisTabType = "overview";

export function MuallimahAnalysisTableTab() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AnalysisTabType>("overview");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [analysis, setAnalysis] = useState<BatchAnalysis | null>(null);
  const [halaqahData, setHalaqahData] = useState<HalaqahAvailability[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [expandedJuz, setExpandedJuz] = useState<Set<string>>(new Set());
  const [programTab, setProgramTab] = useState<
    "tikrar" | "pra_tikrar" | "kelas_berbayar"
  >("tikrar");
  const [rawAnalysisData, setRawAnalysisData] = useState<any>(null);

  const toggleJuz = (juzNumber: string) => {
    setExpandedJuz(prev => {
      const next = new Set(prev);
      if (next.has(juzNumber)) next.delete(juzNumber);
      else next.add(juzNumber);
      return next;
    });
  };

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      if (activeTab === "overview") {
        loadAnalysis(selectedBatchId);
        loadHalaqahAvailability(selectedBatchId, programTab);
      }
    }
  }, [selectedBatchId, activeTab]);

  useEffect(() => {
    if (rawAnalysisData) {
      processAnalysisData(rawAnalysisData, "pendaftar");
      loadHalaqahAvailability(selectedBatchId, programTab);
    }
  }, [rawAnalysisData, programTab]);

  const handleDragStart = (e: React.DragEvent, muallimahId: string) => {
    e.dataTransfer.setData("muallimah_id", muallimahId);
  };

  const handleAssignJuz = async (muallimahId: string, targetJuz: string) => {
    if (!muallimahId || !selectedBatchId) return;

    try {
      const toastId = toast.loading("Memindahkan muallimah...");
      const res = await fetch("/api/admin/muallimah/assign-juz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          muallimah_id: muallimahId,
          assigned_juz: targetJuz,
          batch_id: selectedBatchId,
        }),
      });

      if (res.ok) {
        toast.success("Muallimah berhasil dipindahkan", { id: toastId });
        loadAnalysis(selectedBatchId);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal memindahkan muallimah", {
          id: toastId,
        });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleDrop = async (e: React.DragEvent, targetJuz: string) => {
    e.preventDefault();
    const muallimahId = e.dataTransfer.getData("muallimah_id");
    if (!muallimahId || !selectedBatchId) return;

    try {
      const toastId = toast.loading("Memindahkan muallimah...");
      const res = await fetch("/api/admin/muallimah/assign-juz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          muallimah_id: muallimahId,
          assigned_juz: targetJuz,
          batch_id: selectedBatchId,
        }),
      });

      if (res.ok) {
        toast.success("Muallimah berhasil dipindahkan", { id: toastId });
        loadAnalysis(selectedBatchId);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal memindahkan muallimah", {
          id: toastId,
        });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const loadBatches = async () => {
    try {
      const response = await fetch("/api/admin/batches?limit=1000");
      if (response.ok) {
        const result = await response.json();
        const activeBatches = (result.data || []).filter(
          (b: Batch) =>
            b.status === "open" ||
            b.status === "closed" ||
            b.status === "ongoing",
        );
        setBatches(activeBatches);

        // Find the currently active batch
        const active =
          activeBatches.find(
            (b: any) =>
              b.registration_start_date &&
              b.registration_end_date &&
              new Date(b.registration_start_date) <= new Date() &&
              new Date(b.registration_end_date) >= new Date(),
          ) ||
          activeBatches.find((b: any) => b.status === "open") ||
          activeBatches[0];

        if (active && !selectedBatchId) {
          setSelectedBatchId(active.id);
        }
      }
    } catch (error) {
      console.error("Error loading batches:", error);
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  const processAnalysisData = (
    data: any,
    mode: "pendaftar" | "daftar_ulang",
  ) => {
    try {
      const { batch } = data;
      let {
        muallimahs,
        thalibahs,
        halaqahs,
        students,
        daftarUlangSubmissions,
      } = data;

      // Filter by program tab if not 'semua'
      if (programTab !== "semua") {
        // Filter Muallimah based on preferred_schedule
        muallimahs = (muallimahs || []).filter((m: any) => {
          let pSched = m.preferred_schedule;
          if (typeof pSched === "string") {
            try {
              pSched = JSON.parse(pSched);
            } catch (e) {
              pSched = null;
            }
          }
          if (programTab === "tikrar") return pSched?.tikrar;
          if (programTab === "pra_tikrar") return pSched?.pra_tahfidz;
          if (programTab === "kelas_berbayar")
            return (
              pSched?.berbayar ||
              (m.paid_class_scheme && m.paid_class_scheme !== "none")
            );
          return true;
        });

        // Filter Thalibah based on programs.class_type and selection_status (for Pendaftar mode)
        thalibahs = (thalibahs || []).filter((t: any) => {
          const cType = t.programs?.class_type;

          if (mode === "pendaftar") {
            if (programTab === "tikrar") {
              return (
                cType === "tikrar_tahfidz" &&
                ["selected", "waitlist", "passed"].includes(t.selection_status)
              );
            }
            if (programTab === "pra_tikrar") {
              return (
                cType === "pra_tahfidz" ||
                (cType === "tikrar_tahfidz" &&
                  t.selection_status === "not_selected")
              );
            }
            if (programTab === "kelas_berbayar") return false;

            // For 'semua' tab in pendaftar mode
            return (
              ["selected", "waitlist", "passed", "not_selected"].includes(
                t.selection_status,
              ) || cType === "pra_tahfidz"
            );
          } else {
            // Logika default / daftar_ulang
            if (programTab === "tikrar") return cType === "tikrar_tahfidz";
            if (programTab === "pra_tikrar") return cType === "pra_tahfidz";
            if (programTab === "kelas_berbayar") return false; // Biasanya tidak ada thalibah untuk kelas berbayar di tabel pendaftaran_tikrar_tahfidz
            return true;
          }
        });

        // Filter Halaqah based on programs.class_type
        halaqahs = (halaqahs || []).filter((h: any) => {
          const cType = h.programs?.class_type;
          if (programTab === "tikrar") return cType === "tikrar_tahfidz";
          if (programTab === "pra_tikrar") return cType === "pra_tahfidz";
          if (programTab === "kelas_berbayar")
            return cType === "kelas_berbayar";
          return true;
        });

        // Filter Daftar Ulang
        daftarUlangSubmissions = (daftarUlangSubmissions || []).filter(
          (d: any) => {
            // Check if halaqah in daftar ulang matches the program
            const halaqahMatch = (halaqahs || []).find(
              (h: any) =>
                h.id === d.ujian_halaqah_id || h.id === d.tashih_halaqah_id,
            );
            return halaqahMatch !== undefined;
          },
        );
      }

      // Process muallimah stats
      const muallimaList = (muallimahs || []) as MuallimaRegistration[];
      const totalMuallimah = muallimaList.length;
      const approvedMuallimah = muallimaList.filter(
        (m: any) => m.status === "approved" && !m.exclude_from_capacity,
      ).length;
      const pendingMuallimah = muallimaList.filter(
        (m: any) => m.status === "pending" || m.status === "review",
      ).length;
      const rejectedMuallimah = muallimaList.filter(
        (m: any) => m.status === "rejected",
      ).length;

      // Process thalibah stats
      const thalibahList = (thalibahs || []) as ThalibahRegistration[];
      const totalThalibah = thalibahList.length;
      const approvedThalibah = thalibahList.filter(
        (t: ThalibahRegistration) => t.status === "approved",
      ).length;
      const pendingThalibah = thalibahList.filter(
        (t: ThalibahRegistration) => t.status === "pending",
      ).length;
      const selectedThalibah = thalibahList.filter(
        (t: ThalibahRegistration) => t.selection_status === "selected",
      ).length;

      // Process daftar ulang stats
      const daftarUlangList = (daftarUlangSubmissions ||
        []) as DaftarUlangSubmission[];
      const totalDaftarUlang = daftarUlangList.length;
      const submittedDaftarUlang = daftarUlangList.filter(
        (d: DaftarUlangSubmission) => d.status === "submitted",
      ).length;
      const approvedDaftarUlang = daftarUlangList.filter(
        (d: DaftarUlangSubmission) => d.status === "approved",
      ).length;

      // Filter halaqahs by muallimah from this batch
      const approvedMuallimaIds = muallimaList
        .filter((m: any) => m.status === "approved" && !m.exclude_from_capacity)
        .map((m: any) => m.user_id);
      const halaqahList = (halaqahs || []) as Halaqah[];
      const batchHalaqahs = halaqahList.filter(
        (h: Halaqah) =>
          h.muallimah_id && approvedMuallimaIds.includes(h.muallimah_id),
      );

      let totalHalaqah = batchHalaqahs.length;
      const halaqahWithProgram = batchHalaqahs.filter(
        (h: Halaqah) => h.program_id !== null,
      ).length;
      const halaqahWithoutProgram = batchHalaqahs.filter(
        (h: Halaqah) => h.program_id === null,
      ).length;

      let totalCapacity = batchHalaqahs.reduce(
        (sum: number, h: Halaqah) => sum + (h.max_students || 0),
        0,
      );
      const batchHalaqahIds = batchHalaqahs.map((h) => h.id);
      const halaqahStudentMap = new Map<string, Set<string>>();

      daftarUlangList.forEach((submission: DaftarUlangSubmission) => {
        const uniqueHalaqahIds: string[] = [];
        if (
          submission.ujian_halaqah_id &&
          batchHalaqahIds.includes(submission.ujian_halaqah_id)
        ) {
          uniqueHalaqahIds.push(submission.ujian_halaqah_id);
        }
        if (
          submission.tashih_halaqah_id &&
          !submission.is_tashih_umum &&
          batchHalaqahIds.includes(submission.tashih_halaqah_id)
        ) {
          if (!uniqueHalaqahIds.includes(submission.tashih_halaqah_id)) {
            uniqueHalaqahIds.push(submission.tashih_halaqah_id);
          }
        }
        for (let i = 0; i < uniqueHalaqahIds.length; i++) {
          const halaqahId = uniqueHalaqahIds[i];
          if (!halaqahStudentMap.has(halaqahId)) {
            halaqahStudentMap.set(halaqahId, new Set());
          }
          halaqahStudentMap.get(halaqahId)!.add(submission.user_id);
        }
      });

      const filledSlotsFromStudents = students?.length || 0;
      let filledSlotsFromDaftarUlang = 0;
      const halaqahEntries = Array.from(halaqahStudentMap.entries());
      for (const [halaqahId, userSet] of halaqahEntries) {
        filledSlotsFromDaftarUlang += userSet.size;
      }

      let filledSlots = filledSlotsFromStudents + filledSlotsFromDaftarUlang;

      if (mode === "pendaftar") {
        totalHalaqah = approvedMuallimah;
        totalCapacity = muallimaList
          .filter(
            (m: any) => m.status === "approved" && !m.exclude_from_capacity,
          )
          .reduce(
            (sum: number, m: any) => sum + (m.preferred_max_thalibah || 10),
            0,
          );
        filledSlots = totalThalibah;
      }

      const availableSlots = Math.max(0, totalCapacity - filledSlots);
      const capacityPercentage =
        totalCapacity > 0
          ? Math.round((filledSlots / totalCapacity) * 100)
          : filledSlots > 0
            ? 100
            : 0;

      // Use mode to determine base thalibah count
      const activeThalibahCount =
        mode === "pendaftar"
          ? totalThalibah
          : approvedDaftarUlang > 0
            ? approvedDaftarUlang
            : selectedThalibah;

      const ratio =
        approvedMuallimah > 0
          ? `1:${Math.round(activeThalibahCount / approvedMuallimah)}`
          : "0:0";
      const avgThalibahPerMuallimah =
        approvedMuallimah > 0
          ? Math.round(activeThalibahCount / approvedMuallimah)
          : 0;
      const recommendedRatio = 10;
      const isAdequate = avgThalibahPerMuallimah <= recommendedRatio;

      let recommendation = "";
      if (approvedMuallimah === 0) {
        recommendation =
          "Belum ada muallimah yang diapprove. Segera review dan approve muallimah.";
      } else if (activeThalibahCount === 0) {
        recommendation =
          mode === "pendaftar"
            ? "Belum ada pendaftar thalibah."
            : "Belum ada thalibah yang mendaftar ulang.";
      } else if (avgThalibahPerMuallimah > recommendedRatio) {
        const neededMuallimah =
          Math.ceil(activeThalibahCount / recommendedRatio) - approvedMuallimah;
        recommendation = `Jumlah muallimah kurang memadai. Dibutuhkan tambahan ${neededMuallimah} muallimah untuk rasio ideal (1:10 maksimal).`;
      } else if (avgThalibahPerMuallimah < 5 && activeThalibahCount > 0) {
        recommendation =
          "Jumlah muallimah berlebih. Pertimbangkan untuk meningkatkan kuota thalibah per halaqah.";
      } else {
        recommendation =
          "Rasio muallimah dan thalibah sudah ideal. Siap untuk dijadwalkan ke halaqah.";
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
        recommendation: recommendation,
      };

      setAnalysis(analysisData);
      setAnalysisError(null);
    } catch (error) {
      console.error("Error processing analysis data:", error);
      toast.error("Failed to process analysis data");
    }
  };

  const loadAnalysis = async (batchId: string) => {
    setLoading(true);
    setAnalysisError(null);
    try {
      const analysisResponse = await fetch(
        `/api/admin/analysis?batch_id=${batchId}`,
      );
      if (!analysisResponse.ok) {
        toast.error("Failed to load analysis data");
        setLoading(false);
        return;
      }
      const analysisResult = await analysisResponse.json();
      if (!analysisResult.success || !analysisResult.data) {
        toast.error("Invalid analysis data received");
        setLoading(false);
        return;
      }
      setRawAnalysisData(analysisResult.data);
    } catch (error) {
      toast.error("Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  const loadHalaqahAvailability = async (
    batchId: string,
    tab: string = "semua",
  ) => {
    try {
      const [resPendaftar, resDaftarUlang] = await Promise.all([
        fetch(`/api/admin/analysis/halaqah-availability?batch_id=${batchId}&mode=pendaftar&program_tab=${tab}`),
        fetch(`/api/admin/analysis/halaqah-availability?batch_id=${batchId}&mode=daftar_ulang&program_tab=${tab}`)
      ]);
      
      if (!resPendaftar.ok || !resDaftarUlang.ok) {
        toast.error("Failed to load halaqah availability");
        setLoading(false);
        return;
      }

      const pendaftarData = await resPendaftar.json();
      const daftarUlangData = await resDaftarUlang.json();
      
      const estimasi = pendaftarData.data?.availability || [];
      const aktual = daftarUlangData.data?.availability || [];
      
      const juzMap = new Map<number, any>();
      
      const getJuzNum = (val: any) => parseInt(String(val).replace(/\D/g, '')) || 0;
      
      estimasi.forEach((e: any) => {
        const num = getJuzNum(e.juz_number);
        juzMap.set(num, { juz_number: num, juz_name: e.juz_name || `Juz ${num}`, estimasi: e, aktual: null });
      });
      
      aktual.forEach((a: any) => {
        const num = getJuzNum(a.juz_number);
        if (juzMap.has(num)) {
          juzMap.get(num)!.aktual = a;
          if (!juzMap.get(num)!.juz_name && a.juz_name) {
            juzMap.get(num)!.juz_name = a.juz_name;
          }
        } else {
          juzMap.set(num, { juz_number: num, juz_name: a.juz_name || `Juz ${num}`, estimasi: null, aktual: a });
        }
      });
      
      const merged = Array.from(juzMap.values()).sort((a, b) => {
         const getNum = (n: any) => parseInt(String(n).replace(/\D/g, '')) || 0;
         return getNum(a.juz_number) - getNum(b.juz_number);
      });
      
      setHalaqahData(merged);
    } catch (error) {
      toast.error("Failed to load halaqah availability");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analysis && activeTab === "overview") {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="text-sm text-gray-600">Loading analysis...</p>
        </div>
      </div>
    );
  }
  const totals = halaqahData.reduce((acc, juz: any) => {
    const est = juz.estimasi || {};
    const akt = juz.aktual || {};
    return {
      est_thalibah: acc.est_thalibah + (est.total_thalibah || 0),
      est_muallimah: acc.est_muallimah + (est.halaqah_details?.length || 0),
      est_capacity: acc.est_capacity + (est.total_capacity || 0),
      est_filled: acc.est_filled + (est.total_filled || 0),
      est_available: acc.est_available + (est.total_available || 0),
      
      akt_thalibah: acc.akt_thalibah + (akt.total_thalibah || 0),
      akt_muallimah: acc.akt_muallimah + (akt.halaqah_details?.length || 0),
      akt_capacity: acc.akt_capacity + (akt.total_capacity || 0),
      akt_filled: acc.akt_filled + (akt.total_filled || 0),
      akt_available: acc.akt_available + (akt.total_available || 0),
    };
  }, { 
    est_thalibah: 0, est_muallimah: 0, est_capacity: 0, est_filled: 0, est_available: 0,
    akt_thalibah: 0, akt_muallimah: 0, akt_capacity: 0, akt_filled: 0, akt_available: 0
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Ringkasan Tabel Analisis
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Ringkasan kecukupan muallimah dan ketersediaan halaqah dalam
              format tabel
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-gray-500" />
              <select
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  setLoading(true);
                }}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 bg-white cursor-pointer"
              >
                <option value="">-- Pilih Batch --</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.status === "open" ? "(Aktif)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => loadAnalysis(selectedBatchId)}
              disabled={loading || !selectedBatchId}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">

          <button
            onClick={() => setProgramTab("tikrar")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${programTab === "tikrar" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Tikrar Tahfidz
          </button>
          <button
            onClick={() => setProgramTab("pra_tikrar")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${programTab === "pra_tikrar" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Pra-Tikrar
          </button>
          <button
            onClick={() => setProgramTab("kelas_berbayar")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${programTab === "kelas_berbayar" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Kelas Berbayar
          </button>
        </div>
      </div>

      {halaqahData.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th rowSpan={2} className="px-6 py-4 font-bold text-gray-700 whitespace-nowrap border-r border-gray-200 align-middle">Juz</th>
                  <th colSpan={4} className="px-6 py-3 font-bold text-gray-700 text-center border-r border-gray-200 bg-blue-50/50">Estimasi (Pendaftar)</th>
                  <th colSpan={4} className="px-6 py-3 font-bold text-gray-700 text-center border-r border-gray-200 bg-emerald-50/50">Aktual (Daftar Ulang)</th>
                  <th rowSpan={2} className="px-6 py-4 font-bold text-gray-700 whitespace-nowrap text-right align-middle">Aksi</th>
                </tr>
                <tr>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs bg-blue-50/30">Muallimah</th>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs bg-blue-50/30">Kapasitas</th>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs bg-blue-50/30">Pendaftar</th>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs border-r border-gray-200 bg-blue-50/30">Tersedia</th>
                  
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs bg-emerald-50/30">Muallimah</th>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs bg-emerald-50/30">Kapasitas</th>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs bg-emerald-50/30">Thalibah (Terisi)</th>
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center text-xs border-r border-gray-200 bg-emerald-50/30">Tersedia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {halaqahData.map((juz: any) => {
                  const est = juz.estimasi || { total_thalibah: 0, halaqah_details: [], total_capacity: 0, total_filled: 0, total_available: 0 };
                  const akt = juz.aktual || { total_thalibah: 0, halaqah_details: [], total_capacity: 0, total_filled: 0, total_available: 0 };
                  
                  const estMuallimahCount = est.halaqah_details?.length || 0;
                  const aktMuallimahCount = akt.halaqah_details?.length || 0;
                  const isExpanded = expandedJuz.has(juz.juz_number.toString());
                  
                  return (
                    <Fragment key={juz.juz_number}>
                      <tr className="hover:bg-gray-50/50 transition-colors align-top cursor-pointer border-b border-gray-100" onClick={() => toggleJuz(juz.juz_number.toString())}>
                        <td className="px-6 py-4 border-r border-gray-100 align-middle">
                          <div className="font-bold text-lg text-gray-900">{juz.juz_name}</div>
                        </td>
                        
                        {/* Estimasi Cols */}
                        <td className="px-3 py-4 text-center align-middle font-bold text-gray-700">{estMuallimahCount}</td>
                        <td className="px-3 py-4 text-center align-middle font-bold text-gray-700">{est.total_capacity}</td>
                        <td className="px-3 py-4 text-center align-middle font-bold text-gray-700">{est.total_thalibah}</td>
                        <td className="px-3 py-4 text-center align-middle border-r border-gray-100">
                           <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              est.total_available <= 0 ? 'bg-red-100 text-red-700' : 
                              (est.total_available <= 2 || est.total_thalibah / (est.total_capacity || 1) >= 0.8) ? 'bg-amber-100 text-amber-700' : 
                              'bg-green-100 text-green-700'
                           }`}>
                             {est.total_available < 0 ? `Kurang ${Math.abs(est.total_available)}` : est.total_available}
                           </span>
                        </td>

                        {/* Aktual Cols */}
                        <td className="px-3 py-4 text-center align-middle font-bold text-gray-700">{aktMuallimahCount}</td>
                        <td className="px-3 py-4 text-center align-middle font-bold text-gray-700">{akt.total_capacity}</td>
                        <td className="px-3 py-4 text-center align-middle font-bold text-gray-700">{akt.total_thalibah}</td>
                        <td className="px-3 py-4 text-center align-middle border-r border-gray-100">
                           <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              akt.total_available <= 0 ? 'bg-red-100 text-red-700' : 
                              (akt.total_available <= 2 || akt.total_thalibah / (akt.total_capacity || 1) >= 0.8) ? 'bg-amber-100 text-amber-700' : 
                              'bg-green-100 text-green-700'
                           }`}>
                             {akt.total_available < 0 ? `Kurang ${Math.abs(akt.total_available)}` : akt.total_available}
                           </span>
                        </td>

                        <td className="px-6 py-4 text-right align-middle">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleJuz(juz.juz_number.toString()); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                          >
                            Detail <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </td>
                      </tr>
                      {/* Detailed View */}
                      {isExpanded && (
                        <tr>
                           <td colSpan={10} className="p-0 bg-gray-50/30 border-b border-gray-200">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                                 {/* Estimasi List */}
                                 <div className="p-6">
                                    <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><Users className="w-4 h-4"/> Detail Muallimah (Estimasi)</h4>
                                    {estMuallimahCount > 0 ? (
                                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                        {est.halaqah_details.map((h: any) => (
                                          <div key={h.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col justify-start">
                                            <div className="flex flex-col">
                                              <div className="flex justify-between items-start mb-3">
                                                <div>
                                                  <h4 className="font-bold text-gray-900 text-sm">{h.muallimah_name}</h4>
                                                  <p className="text-xs text-gray-500 font-medium capitalize mt-0.5">{h.class_type?.replace(/_/g, " ")}{h.preferred_juz ? (h.preferred_juz.toLowerCase().includes('juz') || h.preferred_juz.toLowerCase() === 'topik' ? ` - ${h.preferred_juz}` : ` - Juz ${h.preferred_juz}`) : ''}</p>
                                                </div>
                                              </div>
                                              <div className="flex justify-between items-center bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100 mb-3">
                                                <span className="font-medium text-gray-500 text-[11px]">Kapasitas/Terisi:</span>
                                                <span className="font-bold text-gray-800 text-xs">{h.current_students} / {h.max_students}</span>
                                              </div>
                                            </div>
                                            <div className="flex flex-col gap-2 text-[11px] text-gray-600">
                                              {h.schedules?.length > 0 ? (
                                                <div className="space-y-1.5 mt-1">
                                                  {h.schedules.map((s: any, sIdx: number) => (
                                                    <div key={sIdx} className={`flex justify-between items-center px-2 py-1 rounded ${s.is_allocated_here ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100' : 'text-gray-500 bg-gray-50/50'}`}>
                                                      <span>{s.type} {s.is_backup ? "(Cadangan)" : ""} :</span>
                                                      <span>{s.day_name} {s.start_time !== "-" ? `(${s.start_time}-${s.end_time})` : ""}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="text-gray-400 italic text-center py-2 bg-gray-50 rounded-md mt-1">Jadwal belum tersedia</div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                                        <p className="text-sm text-gray-500">Belum ada data</p>
                                      </div>
                                    )}
                                 </div>
                                 
                                 {/* Aktual List */}
                                 <div className="p-6">
                                    <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4"/> Detail Muallimah (Aktual)</h4>
                                    {aktMuallimahCount > 0 ? (
                                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                        {akt.halaqah_details.map((h: any) => (
                                          <div key={h.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col justify-start">
                                            <div className="flex flex-col">
                                              <div className="flex justify-between items-start mb-3">
                                                <div>
                                                  <h4 className="font-bold text-gray-900 text-sm">{h.muallimah_name}</h4>
                                                  <p className="text-xs text-gray-500 font-medium capitalize mt-0.5">{h.name || h.class_type?.replace(/_/g, " ")}</p>
                                                </div>
                                              </div>
                                              <div className="flex justify-between items-center bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100 mb-3">
                                                <span className="font-medium text-gray-500 text-[11px]">Kapasitas/Terisi:</span>
                                                <span className="font-bold text-gray-800 text-xs">{h.current_students} / {h.max_students}</span>
                                              </div>
                                            </div>
                                            <div className="flex flex-col gap-2 text-[11px] text-gray-600">
                                              {h.schedules?.length > 0 ? (
                                                <div className="space-y-1.5 mt-1">
                                                  {h.schedules.map((s: any, sIdx: number) => (
                                                    <div key={sIdx} className={`flex justify-between items-center px-2 py-1 rounded ${s.is_allocated_here ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100' : 'text-gray-500 bg-gray-50/50'}`}>
                                                      <span>{s.type} {s.is_backup ? "(Cadangan)" : ""} :</span>
                                                      <span>{s.day_name} {s.start_time !== "-" ? `(${s.start_time}-${s.end_time})` : ""}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="text-gray-400 italic text-center py-2 bg-gray-50 rounded-md mt-1">Jadwal belum tersedia</div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                                        <p className="text-sm text-gray-500">Belum ada data</p>
                                      </div>
                                    )}
                                 </div>
                              </div>
                           </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-200">
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900 text-lg border-r border-gray-200">Total</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-blue-900 text-base">{totals.est_muallimah}</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-blue-900 text-base">{totals.est_capacity}</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-blue-900 text-base">{totals.est_thalibah}</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-blue-900 text-base border-r border-gray-200">{totals.est_available}</td>
                  
                  <td className="px-3 py-4 text-center align-middle font-bold text-emerald-900 text-base">{totals.akt_muallimah}</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-emerald-900 text-base">{totals.akt_capacity}</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-emerald-900 text-base">{totals.akt_thalibah}</td>
                  <td className="px-3 py-4 text-center align-middle font-bold text-emerald-900 text-base border-r border-gray-200">{totals.akt_available}</td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Belum Ada Data</h3>
          <p className="text-gray-500 max-w-sm mt-1">
            Data ketersediaan halaqah belum tersedia untuk program dan batch
            yang dipilih.
          </p>
        </div>
      )}
    </div>
  );
}
