"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconHistory, IconEye } from '@tabler/icons-react';
import { toast } from "sonner";

interface LaporanRiwayat extends RecordModel {
    judul_kegiatan: string;
    status: 'Disetujui' | 'Revisi';
    updated: string; // Untuk menunjukkan tanggal aksi terakhir
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

export default function DplRiwayatVerifikasiPage() {
  const router = useRouter();
  const [laporans, setLaporans] = useState<LaporanRiwayat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRiwayatLaporan = useCallback(async (signal?: AbortSignal) => {
    const user = pb.authStore.model;
    if (!user) {
      router.replace('/login');
      return;
    }
    setIsLoading(true);
    try {
      const laporanList = await pb.collection('laporans').getFullList<LaporanRiwayat>({
          filter: `kelompok.dpl.id = "${user.id}" && (status = "Disetujui" || status = "Revisi")`,
          sort: '-updated',
          expand: 'kelompok.ketua',
          signal,
      });
      setLaporans(laporanList);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        console.error("Gagal memuat riwayat laporan:", error);
        toast.error("Gagal memuat riwayat verifikasi.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchRiwayatLaporan(controller.signal);
    return () => controller.abort();
  }, [fetchRiwayatLaporan]);

  const getStatusBadgeVariant = (status: string): "default" | "destructive" => {
    switch (status) {
        case 'Disetujui': return 'default';
        case 'Revisi': return 'destructive';
        default: return 'default';
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IconHistory />Riwayat Verifikasi Laporan</CardTitle>
          <CardDescription>Daftar laporan yang telah Anda setujui atau minta untuk direvisi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul Laporan</TableHead>
                  <TableHead>Ketua Kelompok</TableHead>
                  <TableHead>Tanggal Aksi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Memuat riwayat...</TableCell></TableRow>
                ) : laporans.length > 0 ? (
                  laporans.map((laporan) => (
                    <TableRow key={laporan.id}>
                      <TableCell className="font-medium">{laporan.judul_kegiatan}</TableCell>
                      <TableCell>{laporan.expand?.kelompok?.expand?.ketua?.nama_lengkap || '-'}</TableCell>
                      <TableCell>{new Date(laporan.updated).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                      <TableCell><Badge variant={getStatusBadgeVariant(laporan.status)}>{laporan.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/dpl/laporan/${laporan.id}`}>
                            <Button variant="outline" size="icon"><IconEye className="h-4 w-4" /></Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">Tidak ada riwayat verifikasi.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
