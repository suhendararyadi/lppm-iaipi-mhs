"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconUsers, IconFileText, IconBooks, IconUserCheck } from '@tabler/icons-react';
import { toast } from "sonner";
import { Skeleton } from '@/components/ui/skeleton';
import { LaporanChart } from './laporan-chart';

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

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        pb.collection('users').getList(1, 1, { filter: 'role != "lppm"', signal }),
        pb.collection('users').getList(1, 1, { filter: 'role = "mahasiswa"', signal }),
        pb.collection('users').getList(1, 1, { filter: 'role = "dpl"', signal }),
        pb.collection('laporans').getFullList({ sort: '-created', signal }), // Ambil semua laporan untuk chart
        pb.collection('bidang_penelitian').getList(1, 1, { signal }),
      ]);

      const newStats: Stats = {
        totalUsers: results[0].status === 'fulfilled' ? results[0].value.totalItems : 0,
        totalMahasiswa: results[1].status === 'fulfilled' ? results[1].value.totalItems : 0,
        totalDpl: results[2].status === 'fulfilled' ? results[2].value.totalItems : 0,
        // Diperbaiki: getFullList mengembalikan array, jadi kita gunakan .length
        totalLaporan: results[3].status === 'fulfilled' ? results[3].value.length : 0,
        totalBidang: results[4].status === 'fulfilled' ? results[4].value.totalItems : 0,
      };
      setStats(newStats);

      if (results[3].status === 'fulfilled') {
        setLaporanData(results[3].value);
      }
      
    } catch (error) {
        if (!(error instanceof ClientResponseError && error.isAbort)) {
            console.error("Gagal memuat data statistik:", error)
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

  // Proses data laporan untuk format chart
  const chartData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthlyCounts = Array(12).fill(0);

    laporanData.forEach(laporan => {
      const month = new Date(laporan.created).getMonth();
      monthlyCounts[month]++;
    });

    return monthNames.map((month, index) => ({
      month,
      total: monthlyCounts[index] || 0,
    }));
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
        {/* Diperbarui: Menampilkan komponen chart dengan data */}
        <LaporanChart data={chartData} />
      </div>
    </main>
  );
}
