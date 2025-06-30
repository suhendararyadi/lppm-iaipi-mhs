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
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  // Fungsi untuk mengambil data statistik (cepat)
  const fetchStatCounts = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingStats(true);
    try {
      const results = await Promise.allSettled([
        pb.collection('users').getList(1, 1, { filter: 'role != "lppm"', signal }),
        pb.collection('users').getList(1, 1, { filter: 'role = "mahasiswa"', signal }),
        pb.collection('users').getList(1, 1, { filter: 'role = "dpl"', signal }),
        pb.collection('laporans').getList(1, 1, { signal }),
        pb.collection('bidang_penelitian').getList(1, 1, { signal }),
      ]);

      const newStats: Stats = {
        totalUsers: results[0].status === 'fulfilled' ? results[0].value.totalItems : 0,
        totalMahasiswa: results[1].status === 'fulfilled' ? results[1].value.totalItems : 0,
        totalDpl: results[2].status === 'fulfilled' ? results[2].value.totalItems : 0,
        totalLaporan: results[3].status === 'fulfilled' ? results[3].value.totalItems : 0,
        totalBidang: results[4].status === 'fulfilled' ? results[4].value.totalItems : 0,
      };
      setStats(newStats);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        toast.error("Gagal memuat data statistik.");
      }
    } finally {
      if (!signal?.aborted) setIsLoadingStats(false);
    }
  }, []);

  // Fungsi terpisah untuk mengambil data chart (lebih lambat)
  const fetchChartData = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingChart(true);
    try {
        const laporans = await pb.collection('laporans').getFullList({ sort: '-created', signal });
        setLaporanData(laporans);
    } catch (error) {
        if (!(error instanceof ClientResponseError && error.isAbort)) {
            toast.error("Gagal memuat data untuk grafik.");
        }
    } finally {
        if (!signal?.aborted) setIsLoadingChart(false);
    }
  }, []);

  useEffect(() => {
    const statController = new AbortController();
    const chartController = new AbortController();
    
    fetchStatCounts(statController.signal);
    fetchChartData(chartController.signal);

    return () => {
      statController.abort();
      chartController.abort();
    };
  }, [fetchStatCounts, fetchChartData]);

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
        <StatCard title="Total Pengguna" value={stats.totalUsers} icon={IconUsers} isLoading={isLoadingStats} />
        <StatCard title="Mahasiswa" value={stats.totalMahasiswa} icon={IconUsers} isLoading={isLoadingStats} />
        <StatCard title="DPL" value={stats.totalDpl} icon={IconUserCheck} isLoading={isLoadingStats} />
        <StatCard title="Total Laporan" value={stats.totalLaporan} icon={IconFileText} isLoading={isLoadingStats} />
        <StatCard title="Bidang Penelitian" value={stats.totalBidang} icon={IconBooks} isLoading={isLoadingStats} />
      </div>

      <div className="mt-4">
        {isLoadingChart ? (
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
