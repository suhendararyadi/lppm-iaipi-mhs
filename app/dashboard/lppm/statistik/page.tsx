"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconUsers, IconFileText, IconBooks, IconUserCheck } from '@tabler/icons-react';
import { toast } from "sonner";
import { Skeleton } from '@/components/ui/skeleton';
import { LaporanHarianChart } from '../laporan-chart';

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

export default function LppmStatistikPage() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalMahasiswa: 0, totalDpl: 0, totalLaporan: 0, totalBidang: 0 });
  const [laporanData, setLaporanData] = useState<RecordModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      // Menggunakan getFullList untuk akurasi data pengguna
      const [allUsers, laporans, bidangData] = await Promise.all([
        pb.collection('users').getFullList<RecordModel>({ filter: 'role != "lppm"', signal }),
        pb.collection('laporans').getFullList({ sort: '-created', signal }),
        pb.collection('bidang_penelitian').getFullList({ signal }),
      ]);

      const totalMahasiswa = allUsers.filter(user => user.role === 'mahasiswa').length;
      const totalDpl = allUsers.filter(user => user.role === 'dpl').length;

      setStats({
        totalUsers: allUsers.length,
        totalMahasiswa: totalMahasiswa,
        totalDpl: totalDpl,
        totalLaporan: laporans.length,
        totalBidang: bidangData.length,
      });
      setLaporanData(laporans);
      
    } catch (error) {
        if (!(error instanceof ClientResponseError && error.isAbort)) {
            console.error("Gagal memuat data statistik:", error);
            toast.error("Gagal memuat data statistik. Pastikan ada data di database.");
        }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    return () => controller.abort();
  }, [fetchStats]);

  const chartData = useMemo(() => {
    const dailyCounts: { [key: string]: number } = {};
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        dailyCounts[dateString] = 0;
    }

    laporanData.forEach(laporan => {
      const dateString = new Date(laporan.created).toISOString().split('T')[0];
      if (dateString in dailyCounts) {
        dailyCounts[dateString]++;
      }
    });

    return Object.entries(dailyCounts)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [laporanData]);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 grid gap-6">
       <div>
        <h1 className="text-2xl font-semibold">Statistik & Analitik</h1>
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
        {isLoading ? (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
        ) : (
            <LaporanHarianChart data={chartData} />
        )}
      </div>
    </main>
  );
}
