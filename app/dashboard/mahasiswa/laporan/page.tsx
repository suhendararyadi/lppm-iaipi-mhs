"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IconFileText, IconEye, IconPencil, IconTrash } from '@tabler/icons-react';
import { toast } from "sonner";

interface Laporan extends RecordModel {
    judul_kegiatan: string;
    tanggal_kegiatan: string;
    status: 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Revisi';
    expand?: {
        bidang_penelitian: {
            nama_bidang: string;
        }
    }
}

export default function LaporanListPage() {
  const router = useRouter();
  const [laporans, setLaporans] = useState<Laporan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLaporan = useCallback(async (signal?: AbortSignal) => {
    const user = pb.authStore.model;
    if (!user) {
      router.replace('/login');
      return;
    }
    setIsLoading(true);
    try {
      const kelompokRecord = await pb.collection('kelompok_mahasiswa').getFirstListItem(`ketua.id="${user.id}"`, { signal });
      const laporanList = await pb.collection('laporans').getFullList<Laporan>({
          filter: `kelompok.id="${kelompokRecord.id}"`,
          sort: '-tanggal_kegiatan',
          expand: 'bidang_penelitian',
          signal,
      });
      setLaporans(laporanList);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        console.error("Gagal memuat data laporan:", error);
        toast.error("Gagal memuat daftar laporan.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchLaporan(controller.signal);
    return () => controller.abort();
  }, [fetchLaporan]);

  const handleDelete = (laporanId: string, laporanJudul: string) => {
    toast.error(`Apakah Anda yakin ingin menghapus laporan "${laporanJudul}"?`, {
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await pb.collection('laporans').delete(laporanId);
            toast.success("Laporan berhasil dihapus.");
            fetchLaporan(); // Muat ulang data setelah menghapus
          } catch (error) {
            // Diperbaiki: Menambahkan console.error untuk menggunakan variabel 'error'
            console.error("Gagal menghapus laporan:", error);
            toast.error("Gagal menghapus laporan.");
          }
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      },
    });
  };

  const getStatusBadgeVariant = (status: Laporan['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'Disetujui': return 'default';
        case 'Menunggu Persetujuan': return 'secondary';
        case 'Revisi': return 'destructive';
        default: return 'outline';
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><IconFileText />Daftar Laporan Penelitian</CardTitle>
            <CardDescription>Lihat, edit, atau hapus laporan yang telah Anda buat.</CardDescription>
          </div>
          <Link href="/dashboard/mahasiswa/laporan/baru">
            <Button>Buat Laporan Baru</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul Kegiatan</TableHead>
                  <TableHead>Bidang</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Memuat laporan...</TableCell></TableRow>
                ) : laporans.length > 0 ? (
                  laporans.map((laporan) => (
                    <TableRow key={laporan.id}>
                      <TableCell className="font-medium">{laporan.judul_kegiatan}</TableCell>
                      <TableCell>{laporan.expand?.bidang_penelitian?.nama_bidang || '-'}</TableCell>
                      <TableCell>{new Date(laporan.tanggal_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                      <TableCell><Badge variant={getStatusBadgeVariant(laporan.status)}>{laporan.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/dashboard/mahasiswa/laporan/${laporan.id}`}><Button variant="outline" size="icon"><IconEye className="h-4 w-4" /></Button></Link>
                        <Button variant="outline" size="icon" disabled><IconPencil className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(laporan.id, laporan.judul_kegiatan)}><IconTrash className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">Belum ada laporan yang dibuat.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
