"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IconFileText, IconUsers, IconCheck, IconClock, IconAlertTriangle, IconPlus } from '@tabler/icons-react';

// Definisikan tipe untuk Laporan
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

  useEffect(() => {
    const user = pb.authStore.model;
    if (!user || user.role !== 'mahasiswa') {
      router.replace('/login');
      return;
    }
    setUserName(user.nama_lengkap || 'Mahasiswa');

    const fetchLaporan = async () => {
      setIsLoading(true);
      try {
        const kelompokRecord = await pb.collection('kelompok_mahasiswa').getFirstListItem(`ketua.id="${user.id}"`);
        const laporanList = await pb.collection('laporans').getFullList<Laporan>({
            filter: `kelompok.id="${kelompokRecord.id}"`,
            sort: '-tanggal_kegiatan',
        });
        setLaporans(laporanList);
      } catch (error) {
        console.error("Gagal memuat data laporan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLaporan();
  }, [router]);

  // Hitung statistik menggunakan useMemo agar tidak dihitung ulang setiap render
  const stats = useMemo(() => {
    return {
      total: laporans.length,
      disetujui: laporans.filter(l => l.status === 'Disetujui').length,
      menunggu: laporans.filter(l => l.status === 'Menunggu Persetujuan').length,
      revisi: laporans.filter(l => l.status === 'Revisi').length,
    };
  }, [laporans]);

  const getStatusBadgeVariant = (status: Laporan['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'Disetujui': return 'default';
        case 'Menunggu Persetujuan': return 'secondary';
        case 'Revisi': return 'destructive';
        default: return 'outline';
    }
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Memuat data dasbor...</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 grid gap-6">
          <div>
            <h1 className="text-2xl font-semibold">Selamat Datang, {userName}!</h1>
            <p className="text-muted-foreground">Berikut adalah ringkasan aktivitas penelitian Anda.</p>
          </div>
          
          {/* Kartu Statistik */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Laporan</CardTitle><IconFileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Disetujui</CardTitle><IconCheck className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.disetujui}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Menunggu</CardTitle><IconClock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.menunggu}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Perlu Revisi</CardTitle><IconAlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.revisi}</div></CardContent></Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            {/* Laporan Terbaru */}
            <Card className="lg:col-span-4">
              <CardHeader><CardTitle>Laporan Terbaru</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Judul</TableHead><TableHead>Tanggal</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {laporans.slice(0, 3).map(laporan => (
                      <TableRow key={laporan.id}>
                        <TableCell className="font-medium">{laporan.judul_kegiatan}</TableCell>
                        <TableCell>{new Date(laporan.tanggal_kegiatan).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell><Badge variant={getStatusBadgeVariant(laporan.status)}>{laporan.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Aksi Cepat */}
            <Card className="lg:col-span-3">
                <CardHeader><CardTitle>Aksi Cepat</CardTitle><CardDescription>Akses cepat ke fitur-fitur utama.</CardDescription></CardHeader>
                <CardContent className="grid gap-4">
                    <Link href="/dashboard/mahasiswa/laporan/baru">
                        <Button className="w-full justify-start gap-2"><IconPlus />Buat Laporan Baru</Button>
                    </Link>
                    <Link href="/dashboard/mahasiswa/laporan">
                        <Button variant="secondary" className="w-full justify-start gap-2"><IconFileText />Lihat Semua Laporan</Button>
                    </Link>
                    <Link href="/dashboard/mahasiswa/anggota">
                        <Button variant="outline" className="w-full justify-start gap-2"><IconUsers />Kelola Anggota Kelompok</Button>
                    </Link>
                </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
