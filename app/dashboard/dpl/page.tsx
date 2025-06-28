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
import { IconClock, IconAlertTriangle, IconUsers } from '@tabler/icons-react';

interface Laporan extends RecordModel {
    judul_kegiatan: string;
    status: string;
    updated: string;
    expand?: {
        kelompok?: {
            expand?: {
                ketua?: {
                    nama_lengkap: string;
                }
            }
        }
    }
}

export default function DplDashboardPage() {
  const router = useRouter();
  const [laporans, setLaporans] = useState<Laporan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dplName, setDplName] = useState('');

  const fetchLaporanBimbingan = useCallback(async (signal?: AbortSignal) => {
    const user = pb.authStore.model;
    if (!user) {
      router.replace('/login');
      return;
    }
    setDplName(user.nama_lengkap || 'DPL');
    setIsLoading(true);
    try {
      const laporanList = await pb.collection('laporans').getFullList<Laporan>({
          filter: `kelompok.dpl.id = "${user.id}"`,
          sort: '-updated',
          expand: 'kelompok.ketua',
          signal,
      });
      setLaporans(laporanList);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        console.error("Gagal memuat data laporan:", error);
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchLaporanBimbingan(controller.signal);
    return () => controller.abort();
  }, [fetchLaporanBimbingan]);

  const stats = useMemo(() => {
    return {
      menunggu: laporans.filter(l => l.status === 'Menunggu Persetujuan').length,
      revisi: laporans.filter(l => l.status === 'Revisi').length,
      totalBimbingan: laporans.length,
    };
  }, [laporans]);

  if (isLoading) {
    return <main className="flex-1 p-6"><div className="flex h-full items-center justify-center">Memuat dasbor DPL...</div></main>;
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Selamat Datang, {dplName}!</h1>
        <p className="text-muted-foreground">Berikut adalah ringkasan aktivitas verifikasi Anda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Menunggu Persetujuan</CardTitle><IconClock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.menunggu}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Perlu Revisi</CardTitle><IconAlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.revisi}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Laporan Bimbingan</CardTitle><IconUsers className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalBimbingan}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Laporan Perlu Tindakan</CardTitle>
            <CardDescription>Daftar laporan terbaru yang menunggu persetujuan atau perlu revisi.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Judul</TableHead><TableHead>Ketua Kelompok</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                    {laporans.filter(l => l.status === 'Menunggu Persetujuan' || l.status === 'Revisi').slice(0, 5).map(laporan => (
                        <TableRow key={laporan.id}>
                            <TableCell className="font-medium">{laporan.judul_kegiatan}</TableCell>
                            <TableCell>{laporan.expand?.kelompok?.expand?.ketua?.nama_lengkap || '-'}</TableCell>
                            <TableCell><Badge variant={laporan.status === 'Revisi' ? 'destructive' : 'secondary'}>{laporan.status}</Badge></TableCell>
                            <TableCell className="text-right">
                                <Link href={`/dashboard/dpl/laporan/${laporan.id}`}><Button variant="outline" size="sm">Verifikasi</Button></Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
                <Link href="/dashboard/dpl/laporan">
                    <Button variant="secondary">Lihat Semua Laporan</Button>
                </Link>
            </div>
        </CardContent>
      </Card>
    </main>
  );
}
