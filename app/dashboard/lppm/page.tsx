"use client";

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // <-- Diperbaiki: Menambahkan CardDescription
import { IconUsers, IconFileText, IconBooks, IconUserCheck } from '@tabler/icons-react';
import { toast } from "sonner";

interface Stats {
  totalUsers: number;
  totalMahasiswa: number;
  totalDpl: number;
  totalLaporan: number;
  totalBidang: number;
}

export default function LppmDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      // Mengambil semua data secara bersamaan untuk efisiensi
      const [usersData, laporansData, bidangData] = await Promise.all([
        pb.collection('users').getList(1, 1, { filter: 'role != "lppm"', signal }),
        pb.collection('laporans').getList(1, 1, { signal }),
        pb.collection('bidang_penelitian').getList(1, 1, { signal }),
      ]);

      const mahasiswaData = await pb.collection('users').getList(1, 1, { filter: 'role = "mahasiswa"', signal });
      const dplData = await pb.collection('users').getList(1, 1, { filter: 'role = "dpl"', signal });

      setStats({
        totalUsers: usersData.totalItems,
        totalMahasiswa: mahasiswaData.totalItems,
        totalDpl: dplData.totalItems,
        totalLaporan: laporansData.totalItems,
        totalBidang: bidangData.totalItems,
      });

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
    fetchStats(controller.signal);
    return () => controller.abort();
  }, [fetchStats]);

  if (isLoading) {
    return <main className="flex-1 p-6"><div className="flex h-full items-center justify-center">Memuat statistik...</div></main>;
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 grid gap-6">
       <div>
        <h1 className="text-2xl font-semibold">Dasbor Super Admin</h1>
        <p className="text-muted-foreground">Ringkasan data dan statistik dari seluruh sistem.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Pengguna</CardTitle><IconUsers className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.totalUsers}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Mahasiswa</CardTitle><IconUsers className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.totalMahasiswa}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">DPL</CardTitle><IconUserCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.totalDpl}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Laporan</CardTitle><IconFileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.totalLaporan}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Bidang Penelitian</CardTitle><IconBooks className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.totalBidang}</div></CardContent></Card>
      </div>

      {/* Anda bisa menambahkan komponen chart atau tabel lain di sini nanti */}
      <div className="mt-4">
        <Card>
            <CardHeader>
                <CardTitle>Aktivitas Mendatang</CardTitle>
                <CardDescription>Grafik dan data lainnya akan ditampilkan di sini.</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                (Area untuk Chart)
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
