'use client';

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, Layers } from 'lucide-react';
import { toast } from 'sonner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardData {
  counts: {
    totalBatches: number;
    totalHalaqah: number;
    totalUsers: number;
    totalThalibah: number;
    totalMuallimah: number;
  };
  rolesDistribution: {
    thalibah: number;
    muallimah: number;
    musyrifah: number;
    admin: number;
  };
  registrationTrend: {
    date: string;
    count: number;
  }[];
  halaqahStatus: {
    full: number;
    available: number;
  };
  pendingApprovals: {
    registrations: number;
    daftarUlang: number;
    transfer: number;
    muallimah: number;
    oralAssessment: number;
  };
}

export function AdminStatistik() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistik = async () => {
      try {
        const response = await fetch('/api/admin/statistik-dashboard');
        if (!response.ok) {
          throw new Error('Gagal mengambil data statistik');
        }
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Terjadi kesalahan');
        }
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistik();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!data) return null;

  // Chart Data Configurations
  const trendData = {
    labels: data.registrationTrend.map((t) => {
      // Format date nicely (e.g. "12 Jul")
      const d = new Date(t.date);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' });
    }),
    datasets: [
      {
        label: 'Pendaftaran Tikrar',
        data: data.registrationTrend.map((t) => t.count),
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4, // Smooth curve
        pointBackgroundColor: '#10b981',
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const rolesData = {
    labels: ['Thalibah', 'Muallimah', 'Musyrifah', 'Admin'],
    datasets: [
      {
        data: [
          data.rolesDistribution.thalibah,
          data.rolesDistribution.muallimah,
          data.rolesDistribution.musyrifah,
          data.rolesDistribution.admin,
        ],
        backgroundColor: [
          '#10b981', // emerald-500
          '#3b82f6', // blue-500
          '#f59e0b', // amber-500
          '#8b5cf6', // violet-500
        ],
        borderWidth: 0,
      },
    ],
  };

  const rolesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
    cutout: '70%',
  };

  const halaqahData = {
    labels: ['Status Halaqah'],
    datasets: [
      {
        label: 'Tersedia',
        data: [data.halaqahStatus.available],
        backgroundColor: '#10b981', // emerald-500
      },
      {
        label: 'Penuh',
        data: [data.halaqahStatus.full],
        backgroundColor: '#ef4444', // red-500
      },
    ],
  };

  const halaqahOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Pengguna</p>
                <h3 className="text-2xl font-bold text-gray-900">{data.counts.totalUsers}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Thalibah</p>
                <h3 className="text-2xl font-bold text-gray-900">{data.counts.totalThalibah}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Halaqah</p>
                <h3 className="text-2xl font-bold text-gray-900">{data.counts.totalHalaqah}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Layers className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Batch</p>
                <h3 className="text-2xl font-bold text-gray-900">{data.counts.totalBatches}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="bg-white border-orange-200 border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-orange-600 uppercase mb-2 tracking-widest">Santri Baru</span>
            <span className="text-3xl font-black text-gray-900">{data.pendingApprovals?.registrations || 0}</span>
            <span className="text-[10px] text-gray-500 mt-1">Menunggu Review</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-orange-200 border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-orange-600 uppercase mb-2 tracking-widest">Daftar Ulang</span>
            <span className="text-3xl font-black text-gray-900">{data.pendingApprovals?.daftarUlang || 0}</span>
            <span className="text-[10px] text-gray-500 mt-1">Menunggu Review</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-orange-200 border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-orange-600 uppercase mb-2 tracking-widest">Tugas Lisan</span>
            <span className="text-3xl font-black text-gray-900">{data.pendingApprovals?.oralAssessment || 0}</span>
            <span className="text-[10px] text-gray-500 mt-1">Menunggu Review</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-orange-200 border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-orange-600 uppercase mb-2 tracking-widest">Pindah Jadwal</span>
            <span className="text-3xl font-black text-gray-900">{data.pendingApprovals?.transfer || 0}</span>
            <span className="text-[10px] text-gray-500 mt-1">Menunggu Review</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-orange-200 border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-orange-600 uppercase mb-2 tracking-widest">Akad Mu'allimah</span>
            <span className="text-3xl font-black text-gray-900">{data.pendingApprovals?.muallimah || 0}</span>
            <span className="text-[10px] text-gray-500 mt-1">Menunggu Review</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Pendaftaran */}
        <Card className="lg:col-span-2 shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle>Tren Pendaftaran (30 Hari Terakhir)</CardTitle>
            <CardDescription>Menunjukkan volume pendaftaran harian Tikrar Tahfidz.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <Line data={trendData} options={trendOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Roles Distribution */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle>Komposisi Pengguna</CardTitle>
            <CardDescription>Berdasarkan role utama</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex justify-center">
              <Doughnut data={rolesData} options={rolesOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Halaqah Status */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle>Kapasitas Halaqah</CardTitle>
            <CardDescription>Perbandingan halaqah yang tersedia vs sudah penuh.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <Bar data={halaqahData} options={halaqahOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
