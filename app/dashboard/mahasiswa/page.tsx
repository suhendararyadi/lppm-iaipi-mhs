"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IconUserPlus, IconTrash, IconUser } from '@tabler/icons-react';
import { toast } from "sonner";

// Definisikan tipe untuk anggota
interface Anggota {
  id: string; // Menggunakan ID unik untuk key di React
  nama: string;
  nim: string;
  prodi: string;
}

export default function MahasiswaDashboardPage() {
  const router = useRouter();
  const [kelompok, setKelompok] = useState<RecordModel | null>(null);
  const [anggota, setAnggota] = useState<Anggota[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk form tambah anggota
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');
  const [prodi, setProdi] = useState('');

  useEffect(() => {
    const user = pb.authStore.model;
    if (!user || user.role !== 'mahasiswa') {
      router.replace('/login');
      return;
    }

    const fetchKelompokData = async () => {
      try {
        // Cari record kelompok yang ketuanya adalah user yang sedang login
        const kelompokRecord = await pb.collection('kelompok_mahasiswa').getFirstListItem(`ketua.id="${user.id}"`);
        setKelompok(kelompokRecord);
        // Inisialisasi anggota dari data yang ada, tambahkan ID unik
        setAnggota(kelompokRecord.anggota?.map((a: any) => ({ ...a, id: crypto.randomUUID() })) || []);
      } catch (error) {
        // Jika tidak ada, buat record kelompok baru untuk user ini
        if (error.status === 404) {
          try {
            const newKelompok = await pb.collection('kelompok_mahasiswa').create({
              ketua: user.id,
              anggota: [],
            });
            setKelompok(newKelompok);
            setAnggota([]);
          } catch (creationError) {
            console.error("Gagal membuat data kelompok:", creationError);
            toast.error("Gagal membuat data kelompok.");
          }
        } else {
          console.error("Gagal memuat data kelompok:", error);
          toast.error("Gagal memuat data kelompok.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchKelompokData();
  }, [router]);

  const handleTambahAnggota = async (e: FormEvent) => {
    e.preventDefault();
    if (!nama || !nim || !prodi || !kelompok) return;

    const newAnggota: Anggota = { id: crypto.randomUUID(), nama, nim, prodi };
    const updatedAnggotaList = [...anggota, newAnggota];
    
    try {
      await pb.collection('kelompok_mahasiswa').update(kelompok.id, {
        anggota: updatedAnggotaList.map(({ id, ...rest }) => rest), // Simpan tanpa ID sementara
      });
      setAnggota(updatedAnggotaList);
      toast.success("Anggota berhasil ditambahkan!");
      // Reset form
      setNama('');
      setNim('');
      setProdi('');
    } catch (error) {
      console.error("Gagal menambah anggota:", error);
      toast.error("Gagal menambah anggota.");
    }
  };

  const handleHapusAnggota = async (idToRemove: string) => {
    if (!kelompok) return;

    const updatedAnggotaList = anggota.filter(a => a.id !== idToRemove);

    try {
      await pb.collection('kelompok_mahasiswa').update(kelompok.id, {
        anggota: updatedAnggotaList.map(({ id, ...rest }) => rest), // Simpan tanpa ID sementara
      });
      setAnggota(updatedAnggotaList);
      toast.success("Anggota berhasil dihapus.");
    } catch (error) {
      console.error("Gagal menghapus anggota:", error);
      toast.error("Gagal menghapus anggota.");
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Memuat data mahasiswa...</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <h1 className="text-2xl font-semibold mb-6">Dasbor Mahasiswa</h1>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUsers />
                Kelola Anggota Kelompok
              </CardTitle>
              <CardDescription>
                Tambah, lihat, dan hapus anggota kelompok penelitian Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {/* Form Tambah Anggota */}
              <form onSubmit={handleTambahAnggota} className="grid md:grid-cols-4 gap-4 items-end p-4 border rounded-lg">
                <div className="grid gap-1.5">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input id="nama" value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama anggota" required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="nim">NIM</Label>
                  <Input id="nim" value={nim} onChange={e => setNim(e.target.value)} placeholder="Nomor Induk Mahasiswa" required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="prodi">Program Studi</Label>
                  <Input id="prodi" value={prodi} onChange={e => setProdi(e.target.value)} placeholder="Prodi" required />
                </div>
                <Button type="submit" className="w-full">
                  <IconUserPlus className="mr-2" />
                  Tambah
                </Button>
              </form>

              {/* Tabel Anggota */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>NIM</TableHead>
                      <TableHead>Program Studi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anggota.length > 0 ? (
                      anggota.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.nama}</TableCell>
                          <TableCell>{item.nim}</TableCell>
                          <TableCell>{item.prodi}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleHapusAnggota(item.id)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          Belum ada anggota. Silakan tambahkan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Kartu untuk fitur selanjutnya */}
          <Card className="mt-6">
             <CardHeader>
                <CardTitle>Laporan Penelitian</CardTitle>
                <CardDescription>Buat dan kelola laporan penelitian Anda di sini.</CardDescription>
             </CardHeader>
             <CardContent>
                <Button>Buat Laporan Baru</Button>
             </CardContent>
          </Card>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
