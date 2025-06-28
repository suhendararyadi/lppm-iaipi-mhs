"use client";

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconUsersGroup } from '@tabler/icons-react';
import { toast } from "sonner";

interface User extends RecordModel {
    nama_lengkap: string;
}
interface Kelompok extends RecordModel {
    anggota: { nama: string }[];
    expand?: {
        ketua: User;
        dpl?: User;
    }
}

export default function LppmKelompokManagementPage() {
  const [kelompokList, setKelompokList] = useState<Kelompok[]>([]);
  const [dplList, setDplList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const [kelompokData, dplData] = await Promise.all([
        pb.collection('kelompok_mahasiswa').getFullList<Kelompok>({
          sort: '-created',
          expand: 'ketua,dpl',
          signal,
        }),
        pb.collection('users').getFullList<User>({
          filter: 'role = "dpl"',
          sort: 'nama_lengkap',
          signal,
        })
      ]);
      setKelompokList(kelompokData);
      setDplList(dplData);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        toast.error("Gagal memuat data manajemen kelompok.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const handleAssignDpl = async (kelompokId: string, dplId: string) => {
    try {
      await pb.collection('kelompok_mahasiswa').update(kelompokId, { dpl: dplId });
      toast.success("DPL berhasil ditugaskan.");
      fetchData(); // Refresh data
    } catch (error) {
      // Diperbaiki: Menambahkan console.error untuk menggunakan variabel 'error'
      console.error("Gagal menugaskan DPL:", error);
      toast.error("Gagal menugaskan DPL.");
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IconUsersGroup />Manajemen Kelompok</CardTitle>
          <CardDescription>Tugaskan Dosen Pembimbing Lapangan (DPL) untuk setiap kelompok mahasiswa.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ketua Kelompok</TableHead>
                  <TableHead>Jumlah Anggota</TableHead>
                  <TableHead>DPL Ditugaskan</TableHead>
                  <TableHead className="w-[250px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Memuat data kelompok...</TableCell></TableRow>
                ) : kelompokList.length > 0 ? (
                  kelompokList.map((kelompok) => (
                    <TableRow key={kelompok.id}>
                      <TableCell className="font-medium">{kelompok.expand?.ketua.nama_lengkap || 'N/A'}</TableCell>
                      <TableCell>{kelompok.anggota.length} Anggota</TableCell>
                      <TableCell>{kelompok.expand?.dpl?.nama_lengkap || <span className="text-muted-foreground">Belum ada</span>}</TableCell>
                      <TableCell>
                        <Select
                          defaultValue={kelompok.expand?.dpl?.id}
                          onValueChange={(dplId) => handleAssignDpl(kelompok.id, dplId)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih DPL..." />
                          </SelectTrigger>
                          <SelectContent>
                            {dplList.map(dpl => (
                              <SelectItem key={dpl.id} value={dpl.id}>{dpl.nama_lengkap}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">Tidak ada data kelompok.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
