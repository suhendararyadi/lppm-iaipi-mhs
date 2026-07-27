"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconChartBar, IconFileText, IconCheck, IconClock, IconAlertTriangle,
  IconFileDescription, IconUsersGroup, IconChevronLeft,
} from '@tabler/icons-react';
import { toast } from "sonner";
import { LaporanHarianChart } from '../laporan-chart';
import { StatusLaporanChart } from '../status-chart';

interface Kelompok extends RecordModel {
  anggota: { nama: string }[];
  expand?: {
    dpl?: { nama_lengkap: string };
    periode?: { nama: string; status: 'aktif' | 'arsip' };
  }
}

interface Laporan extends RecordModel {
  status: 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Revisi';
}

interface Stats {
  total: number;
  disetujui: number;
  menunggu: number;
  revisi: number;
  draft: number;
}

const StatCard = ({ title, value, icon: Icon, iconClassName, isLoading }: { title: string, value: number, icon: React.ElementType, iconClassName?: string, isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${iconClassName || 'text-muted-foreground'}`} />
    </CardHeader>
    <CardContent>
      {isLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{value}</div>}
    </CardContent>
  </Card>
);

export default function StatistikMahasiswaPage() {
  const router = useRouter();
  const [kelompokAktif, setKelompokAktif] = useState<Kelompok | null>(null);
  const [laporans, setLaporans] = useState<Laporan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasKelompok, setHasKelompok] = useState(true);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    const user = pb.authStore.model;
    if (!user) {
      router.replace('/login');
      return;
    }
    setIsLoading(true);
    try {
      // Mahasiswa yang lanjut lintas sesi bisa punya lebih dari satu record kelompok
      // (lama + baru) — ambil semuanya supaya statistik mencakup seluruh riwayat laporan,
      // bukan hanya sesi yang sedang aktif.
      const kelompokList = await pb.collection('kelompok_mahasiswa').getFullList<Kelompok>({
        filter: `ketua.id="${user.id}"`,
        expand: 'dpl,periode',
        signal,
      });

      if (kelompokList.length === 0) {
        setHasKelompok(false);
        setLaporans([]);
        return;
      }
      setHasKelompok(true);
      setKelompokAktif(kelompokList.find(k => k.expand?.periode?.status === 'aktif') ?? kelompokList[0]);

      const kelompokIdFilter = kelompokList.map(k => `kelompok.id="${k.id}"`).join(' || ');
      const laporanList = await pb.collection('laporans').getFullList<Laporan>({
        filter: kelompokIdFilter,
        sort: '-created',
        signal,
      });
      setLaporans(laporanList);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        console.error("Gagal memuat data statistik:", error);
        toast.error("Gagal memuat data statistik.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const stats: Stats = useMemo(() => ({
    total: laporans.length,
    disetujui: laporans.filter(l => l.status === 'Disetujui').length,
    menunggu: laporans.filter(l => l.status === 'Menunggu Persetujuan').length,
    revisi: laporans.filter(l => l.status === 'Revisi').length,
    draft: laporans.filter(l => l.status === 'Draft').length,
  }), [laporans]);

  const dailyChartData = useMemo(() => {
    const dailyCounts: { [key: string]: number } = {};
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dailyCounts[dateString] = 0;
    }

    laporans.forEach(laporan => {
      const dateString = new Date(laporan.created).toISOString().split('T')[0];
      if (dateString in dailyCounts) {
        dailyCounts[dateString]++;
      }
    });

    return Object.entries(dailyCounts)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [laporans]);

  const statusChartData = useMemo(() => ([
    { status: 'disetujui', total: stats.disetujui, fill: 'var(--color-disetujui)' },
    { status: 'menunggu', total: stats.menunggu, fill: 'var(--color-menunggu)' },
    { status: 'revisi', total: stats.revisi, fill: 'var(--color-revisi)' },
    { status: 'draft', total: stats.draft, fill: 'var(--color-draft)' },
  ]), [stats]);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2">
            <Link href="/dashboard/mahasiswa">
              <Button variant="outline" size="sm"><IconChevronLeft className="h-4 w-4 mr-1" />Kembali ke Dasbor</Button>
            </Link>
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><IconChartBar />Statistik Laporan Saya</h1>
          <p className="text-muted-foreground">Ringkasan aktivitas dan status laporan pengabdian Anda.</p>
        </div>
      </div>

      {!isLoading && !hasKelompok ? (
        <Card>
          <CardContent className="py-12 text-center">
            <IconUsersGroup className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">Kelompok Belum Dibuat</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Data statistik belum tersedia karena kelompok Anda belum dibuat oleh LPPM.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Total Laporan" value={stats.total} icon={IconFileText} isLoading={isLoading} />
            <StatCard title="Disetujui" value={stats.disetujui} icon={IconCheck} iconClassName="text-green-500" isLoading={isLoading} />
            <StatCard title="Menunggu" value={stats.menunggu} icon={IconClock} isLoading={isLoading} />
            <StatCard title="Perlu Revisi" value={stats.revisi} icon={IconAlertTriangle} iconClassName="text-destructive" isLoading={isLoading} />
            <StatCard title="Draft" value={stats.draft} icon={IconFileDescription} isLoading={isLoading} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><IconUsersGroup className="h-4 w-4" />Ringkasan Kelompok</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-5 w-2/3" />
              ) : (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span>Sesi: <strong>{kelompokAktif?.expand?.periode?.nama || 'N/A'}</strong></span>
                  <Badge variant={kelompokAktif?.expand?.periode?.status === 'arsip' ? 'secondary' : 'default'}>
                    {kelompokAktif?.expand?.periode?.status === 'arsip' ? 'Arsip' : 'Aktif'}
                  </Badge>
                  <span className="text-muted-foreground">·</span>
                  <span>DPL: <strong>{kelompokAktif?.expand?.dpl?.nama_lengkap || 'Belum ditugaskan'}</strong></span>
                  <span className="text-muted-foreground">·</span>
                  <span>Anggota: <strong>{kelompokAktif?.anggota?.length ?? 0} orang</strong></span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {isLoading ? (
              <>
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
              </>
            ) : (
              <>
                <LaporanHarianChart data={dailyChartData} />
                <StatusLaporanChart data={statusChartData} />
              </>
            )}
          </div>
        </>
      )}
    </main>
  );
}
