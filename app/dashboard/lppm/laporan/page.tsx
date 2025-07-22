"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconFileText, IconEye } from '@tabler/icons-react';
import { toast } from "sonner";

// Tipe data yang diperluas
interface Laporan extends RecordModel {
    judul_kegiatan: string;
    status: string;
    updated: string;
    expand?: {
        kelompok?: {
            expand?: {
                ketua: {
                    nama_lengkap: string;
                },
                dpl?: {
                    nama_lengkap: string;
                }
            }
        }
    }
}

export default function LppmLaporanListPage() {
  const [laporans, setLaporans] = useState<Laporan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllLaporan = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const laporanList = await pb.collection('laporans').getFullList<Laporan>({
          sort: '-updated',
          expand: 'kelompok,kelompok.ketua,kelompok.dpl',
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
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAllLaporan(controller.signal);
    return () => controller.abort();
  }, [fetchAllLaporan]);

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IconFileText />Manajemen Laporan Mahasiswa</CardTitle>
          <CardDescription>Berikut adalah daftar semua laporan yang telah diinput oleh seluruh mahasiswa.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul Laporan</TableHead>
                  <TableHead>Ketua Kelompok</TableHead>
                  <TableHead>DPL</TableHead>
                  <TableHead>Update Terakhir</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">Memuat semua laporan...</TableCell></TableRow>
                ) : laporans.length > 0 ? (
                  laporans.map((laporan) => (
                    <TableRow key={laporan.id}>
                      <TableCell className="font-medium">{laporan.judul_kegiatan}</TableCell>
                      <TableCell>{laporan.expand?.kelompok?.expand?.ketua?.nama_lengkap || '-'}</TableCell>
                      <TableCell>{laporan.expand?.kelompok?.expand?.dpl?.nama_lengkap || 'Belum Ditugaskan'}</TableCell>
                      <TableCell>{new Date(laporan.updated).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</TableCell>
                      <TableCell><Badge variant={getStatusBadgeVariant(laporan.status)}>{laporan.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/dpl/laporan/${laporan.id}`}>
                            <Button variant="outline" size="icon"><IconEye className="h-4 w-4" /></Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center h-24">Belum ada laporan yang dibuat.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
