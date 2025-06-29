"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconUsers, IconFileText, IconBooks, IconUserCheck } from '@tabler/icons-react';
import { toast } from "sonner";
import { Skeleton } from '@/components/ui/skeleton';
import { LaporanHarianChart } from './laporan-chart';

interface Stats {
  totalUsers: number;
  totalMahasiswa: number;
  totalDpl: number;
  totalLaporan: number;
  totalBidang: number;
}

const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string, value: number, icon: React.ElementType, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{value}</div>}
        </CardContent>
    </Card>
);

export default function LppmDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalMahasiswa: 0, totalDpl: 0, totalLaporan: 0, totalBidang: 0 });
  const [laporanData, setLaporanData] = useState<RecordModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Diperbaiki: Logika pengambilan data dioptimalkan untuk mengurangi jumlah permintaan ke server.
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      // 1. Ambil semua data yang diperlukan dalam beberapa permintaan efisien
      const [allUsers, laporans, bidangData] = await Promise.all([
        pb.collection('users').getFullList<RecordModel>({ filter: 'role != "lppm"', signal }),
        pb.collection('laporans').getFullList({ sort: '-created', signal }),
        pb.collection('bidang_penelitian').getList(1, 1, { signal }),
      ]);

      // 2. Hitung statistik dari data yang sudah diambil di sisi klien
      const totalMahasiswa = allUsers.filter(user => user.role === 'mahasiswa').length;
      const totalDpl = allUsers.filter(user => user.role === 'dpl').length;

      // 3. Atur state dengan data yang sudah dihitung
      setStats({
        totalUsers: allUsers.length,
        totalMahasiswa: totalMahasiswa,
        totalDpl: totalDpl,
        totalLaporan: laporans.length,
        totalBidang: bidangData.totalItems,
      });

      // 4. Simpan data laporan untuk grafik
      setLaporanData(laporans);
      
    } catch (error) {
        if (!(error instanceof ClientResponseError && error.isAbort)) {
            console.error("Gagal memuat data statistik:", error);
            toast.error("Gagal memuat data statistik.");
        }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  // Diperbarui: Proses data laporan untuk format harian (30 hari terakhir)
  const chartData = useMemo(() => {
    const dailyCounts: { [key: string]: number } = {};
    const today = new Date();
    
    // Inisialisasi 30 hari terakhir dengan 0 laporan
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
        dailyCounts[dateString] = 0;
    }

    // Hitung laporan untuk setiap hari
    laporanData.forEach(laporan => {
      const dateString = new Date(laporan.created).toISOString().split('T')[0];
      if (dateString in dailyCounts) {
        dailyCounts[dateString]++;
      }
    });

    // Ubah menjadi format array yang bisa dibaca chart dan urutkan
    return Object.entries(dailyCounts)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [laporanData]);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 grid gap-6">
       <div>
        <h1 className="text-2xl font-semibold">Dasbor Super Admin</h1>
        <p className="text-muted-foreground">Ringkasan data dan statistik dari seluruh sistem.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Pengguna" value={stats.totalUsers} icon={IconUsers} isLoading={isLoading} />
        <StatCard title="Mahasiswa" value={stats.totalMahasiswa} icon={IconUsers} isLoading={isLoading} />
        <StatCard title="DPL" value={stats.totalDpl} icon={IconUserCheck} isLoading={isLoading} />
        <StatCard title="Total Laporan" value={stats.totalLaporan} icon={IconFileText} isLoading={isLoading} />
        <StatCard title="Bidang Penelitian" value={stats.totalBidang} icon={IconBooks} isLoading={isLoading} />
      </div>

      <div className="mt-4">
        <LaporanHarianChart data={chartData} />
      </div>
    </main>
  );
}
