"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IconUserPlus, IconTrash, IconUsers, IconChevronLeft } from '@tabler/icons-react';
import { toast } from "sonner";

interface Anggota {
  id: string; 
  nama: string;
  nim: string;
  prodi: string;
}
type AnggotaData = Omit<Anggota, 'id'>;

export default function KelolaAnggotaPage() {
  const router = useRouter();
  const [kelompok, setKelompok] = useState<RecordModel | null>(null);
  const [anggota, setAnggota] = useState<Anggota[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');
  const [prodi, setProdi] = useState('');

  const fetchKelompokData = useCallback(async (signal?: AbortSignal) => {
    const user = pb.authStore.model;
    if (!user) {
        router.replace('/login');
        return;
    }
    try {
      const kelompokRecord = await pb.collection('kelompok_mahasiswa').getFirstListItem(`ketua.id="${user.id}"`, { signal });
      setKelompok(kelompokRecord);
      setAnggota(kelompokRecord.anggota?.map((a: AnggotaData) => ({ ...a, id: crypto.randomUUID() })) || []);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        console.error("Gagal memuat data kelompok:", error);
        toast.error("Gagal memuat data kelompok.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchKelompokData(controller.signal);

    return () => {
        controller.abort();
    }
  }, [fetchKelompokData]);
  
  const handleTambahAnggota = async (e: FormEvent) => {
    e.preventDefault();
    if (!nama || !nim || !prodi || !kelompok) return;
    const newAnggota: Anggota = { id: crypto.randomUUID(), nama, nim, prodi };
    const updatedAnggotaList = [...anggota, newAnggota];
    const dataToSave = updatedAnggotaList.map(a => ({ nama: a.nama, nim: a.nim, prodi: a.prodi }));
    try {
      await pb.collection('kelompok_mahasiswa').update(kelompok.id, { anggota: dataToSave });
      setAnggota(updatedAnggotaList);
      toast.success("Anggota berhasil ditambahkan!");
      setNama(''); setNim(''); setProdi('');
    } catch (error) {
      console.error("Gagal menambah anggota:", error);
      toast.error("Gagal menambah anggota.");
    }
  };

  const handleHapusAnggota = async (idToRemove: string) => {
    if (!kelompok) return;
    const updatedAnggotaList = anggota.filter(a => a.id !== idToRemove);
    const dataToSave = updatedAnggotaList.map(a => ({ nama: a.nama, nim: a.nim, prodi: a.prodi }));
    try {
      await pb.collection('kelompok_mahasiswa').update(kelompok.id, { anggota: dataToSave });
      setAnggota(updatedAnggotaList);
      toast.success("Anggota berhasil dihapus.");
    } catch (error) {
      console.error("Gagal menghapus anggota:", error);
      toast.error("Gagal menghapus anggota.");
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <Link href="/dashboard/mahasiswa">
          <Button variant="outline" size="sm"><IconChevronLeft className="h-4 w-4 mr-1" />Kembali ke Dasbor</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IconUsers />Kelola Anggota Kelompok</CardTitle>
          <CardDescription>Tambah, lihat, dan hapus anggota kelompok penelitian Anda.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <form onSubmit={handleTambahAnggota} className="grid md:grid-cols-4 gap-4 items-end p-4 border rounded-lg">
            <div className="grid gap-1.5"><Label htmlFor="nama">Nama Lengkap</Label><Input id="nama" value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama anggota" required /></div>
            <div className="grid gap-1.5"><Label htmlFor="nim">NIM</Label><Input id="nim" value={nim} onChange={e => setNim(e.target.value)} placeholder="NIM" required /></div>
            <div className="grid gap-1.5"><Label htmlFor="prodi">Program Studi</Label><Input id="prodi" value={prodi} onChange={e => setProdi(e.target.value)} placeholder="Prodi" required /></div>
            <Button type="submit" className="w-full"><IconUserPlus className="mr-2" />Tambah</Button>
          </form>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>No</TableHead><TableHead>Nama</TableHead><TableHead>NIM</TableHead><TableHead>Prodi</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Memuat anggota...</TableCell></TableRow>
                ) : anggota.length > 0 ? (
                  anggota.map((item, index) => (
                    <TableRow key={item.id}><TableCell>{index + 1}</TableCell><TableCell>{item.nama}</TableCell><TableCell>{item.nim}</TableCell><TableCell>{item.prodi}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleHapusAnggota(item.id)}><IconTrash className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">Belum ada anggota.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
