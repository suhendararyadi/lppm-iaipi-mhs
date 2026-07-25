"use client";

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { IconUsersGroup, IconAlertTriangle } from '@tabler/icons-react';
import { toast } from "sonner";

interface User extends RecordModel {
    nama_lengkap: string;
}
interface Kelompok extends RecordModel {
    anggota: { nama: string }[];
    // Snapshot nama, diisi saat ketua/DPL ditetapkan — tetap ada meski akun user aslinya
    // kemudian dihapus, karena relasi ketua/dpl tidak cascade-delete (lihat memori project).
    ketua_nama?: string;
    dpl_nama?: string;
    expand?: {
        ketua?: User;
        dpl?: User;
    }
}

// Menentukan nama tampilan + status untuk kolom Ketua/DPL:
// - "live": relasi masih ada, tampilkan nama biasa
// - "snapshot": relasi sudah kosong (akun dihapus) tapi nama sempat tersimpan
// - "unknown": tidak ada relasi maupun snapshot (data lama sebelum fitur ini ada)
function resolveIdentitas(live?: string, snapshot?: string): { nama: string; status: 'live' | 'snapshot' | 'unknown' } {
  if (live) return { nama: live, status: 'live' };
  if (snapshot) return { nama: snapshot, status: 'snapshot' };
  return { nama: 'Tidak diketahui', status: 'unknown' };
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
      // Snapshot nama ikut diperbarui supaya identitas tidak hilang kalau akun DPL ini dihapus nanti.
      const dplNama = dplList.find(d => d.id === dplId)?.nama_lengkap ?? '';
      await pb.collection('kelompok_mahasiswa').update(kelompokId, { dpl: dplId, dpl_nama: dplNama });
      toast.success("DPL berhasil ditugaskan.");
      fetchData(); // Refresh data
    } catch (error) {
      // Diperbaiki: Menambahkan console.error untuk menggunakan variabel 'error'
      console.error("Gagal menugaskan DPL:", error);
      toast.error("Gagal menugaskan DPL.");
    }
  };

  const jumlahBermasalah = kelompokList.filter(k => !k.expand?.ketua || !k.expand?.dpl).length;

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IconUsersGroup />Manajemen Kelompok</CardTitle>
          <CardDescription>Tugaskan Dosen Pembimbing Lapangan (DPL) untuk setiap kelompok mahasiswa.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoading && jumlahBermasalah > 0 && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
              <IconAlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {jumlahBermasalah} dari {kelompokList.length} kelompok kehilangan akun ketua dan/atau DPL karena akunnya sudah dihapus.
                Nama yang ditandai <Badge variant="outline" className="mx-1 align-middle">akun dihapus</Badge> diambil dari data yang sempat tersimpan, bukan akun yang masih aktif.
              </span>
            </div>
          )}
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
                  kelompokList.map((kelompok) => {
                    const ketuaInfo = resolveIdentitas(kelompok.expand?.ketua?.nama_lengkap, kelompok.ketua_nama);
                    const dplInfo = resolveIdentitas(kelompok.expand?.dpl?.nama_lengkap, kelompok.dpl_nama);
                    return (
                    <TableRow key={kelompok.id}>
                      <TableCell className="font-medium">
                        <span className={ketuaInfo.status === 'unknown' ? 'text-muted-foreground' : ''}>{ketuaInfo.nama}</span>
                        {ketuaInfo.status === 'snapshot' && <Badge variant="outline" className="ml-2">akun dihapus</Badge>}
                      </TableCell>
                      <TableCell>{kelompok.anggota?.length ?? 0} Anggota</TableCell>
                      <TableCell>
                        {dplInfo.status === 'unknown' ? (
                          <span className="text-muted-foreground">Belum ada</span>
                        ) : (
                          <>
                            {dplInfo.nama}
                            {dplInfo.status === 'snapshot' && <Badge variant="outline" className="ml-2">akun dihapus</Badge>}
                          </>
                        )}
                      </TableCell>
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
                  );})
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
