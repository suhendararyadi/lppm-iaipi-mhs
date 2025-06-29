"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IconFileText, IconUsers, IconCheck, IconClock, IconAlertTriangle, IconPlus } from '@tabler/icons-react';
import { toast } from "sonner";

interface Laporan extends RecordModel {
    judul_kegiatan: string;
    tanggal_kegiatan: string;
    status: 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Revisi';
}

export default function MahasiswaDashboardPage() {
  const router = useRouter();
  const [laporans, setLaporans] = useState<Laporan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    const user = pb.authStore.model;
    if (!user) {
      router.replace('/login');
      return;
    }
    setUserName(user.nama_lengkap || 'Mahasiswa');
    setIsLoading(true);

    try {
      // Disesuaikan: Logika pembuatan kelompok otomatis dihapus.
      // Sekarang hanya mencoba mengambil data kelompok yang sudah ada.
      const kelompokRecord = await pb.collection('kelompok_mahasiswa').getFirstListItem(`ketua.id="${user.id}"`, { signal });

      const laporanList = await pb.collection('laporans').getFullList<Laporan>({
          filter: `kelompok.id="${kelompokRecord.id}"`,
          sort: '-tanggal_kegiatan',
          signal,
      });
      setLaporans(laporanList);

    } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) {
        console.log("Request to fetch dashboard data was aborted.");
        return;
      }
      // Error ini sekarang wajar jika kelompok belum dibuat oleh admin.
      console.error("Gagal memuat data dasbor, kelompok mungkin belum dibuat:", error);
      toast.error("Gagal memuat data dasbor. Hubungi LPPM jika masalah berlanjut.");
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchData]);

  const stats = useMemo(() => ({
    total: laporans.length,
    disetujui: laporans.filter(l => l.status === 'Disetujui').length,
    menunggu: laporans.filter(l => l.status === 'Menunggu Persetujuan').length,
    revisi: laporans.filter(l => l.status === 'Revisi').length,
  }), [laporans]);

  const getStatusBadgeVariant = (status: Laporan['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'Disetujui': return 'default';
        case 'Menunggu Persetujuan': return 'secondary';
        case 'Revisi': return 'destructive';
        default: return 'outline';
    }
  }

  if (isLoading) {
    return <main className="flex-1 p-6"><div className="flex h-full items-center justify-center"><p>Memuat dasbor...</p></div></main>;
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Selamat Datang, {userName}!</h1>
        <p className="text-muted-foreground">Berikut adalah ringkasan aktivitas penelitian Anda.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Laporan</CardTitle><IconFileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Disetujui</CardTitle><IconCheck className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.disetujui}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Menunggu</CardTitle><IconClock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.menunggu}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Perlu Revisi</CardTitle><IconAlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.revisi}</div></CardContent></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader><CardTitle>Laporan Terbaru</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Judul</TableHead><TableHead>Tanggal</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {laporans.length > 0 ? laporans.slice(0, 3).map(laporan => (
                  <TableRow key={laporan.id}>
                    <TableCell className="font-medium">{laporan.judul_kegiatan}</TableCell>
                    <TableCell>{new Date(laporan.tanggal_kegiatan).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(laporan.status)}>{laporan.status}</Badge></TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={3} className="text-center h-24">Belum ada laporan.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Aksi Cepat</CardTitle><CardDescription>Akses cepat ke fitur-fitur utama.</CardDescription></CardHeader>
            <CardContent className="grid gap-4">
                <Link href="/dashboard/mahasiswa/laporan/baru"><Button className="w-full justify-start gap-2"><IconPlus />Buat Laporan Baru</Button></Link>
                <Link href="/dashboard/mahasiswa/laporan"><Button variant="secondary" className="w-full justify-start gap-2"><IconFileText />Lihat Semua Laporan</Button></Link>
                <Link href="/dashboard/mahasiswa/anggota"><Button variant="outline" className="w-full justify-start gap-2"><IconUsers />Kelola Anggota Kelompok</Button></Link>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
