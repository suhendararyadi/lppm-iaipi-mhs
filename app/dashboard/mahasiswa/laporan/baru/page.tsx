"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IconChevronLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { toast } from "sonner";

// Definisikan tipe untuk data yang akan kita fetch
interface BidangPenelitian {
  id: string;
  nama_bidang: string;
}
interface Anggota {
  nama: string;
  nim: string;
  prodi: string;
}
interface Kelompok {
  id: string;
  anggota: Anggota[];
}

export default function BuatLaporanPage() {
  const router = useRouter();
  const [kelompok, setKelompok] = useState<Kelompok | null>(null);
  const [bidangPenelitian, setBidangPenelitian] = useState<BidangPenelitian[]>([]);
  const [mahasiswaTerlibat, setMahasiswaTerlibat] = useState<string[]>([]);
  const [dokumen, setDokumen] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    const user = pb.authStore.model;
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const [bidangList, kelompokData] = await Promise.all([
        pb.collection('bidang_penelitian').getFullList<BidangPenelitian>({ sort: 'nama_bidang', signal }),
        pb.collection('kelompok_mahasiswa').getFirstListItem<Kelompok>(`ketua.id="${user.id}"`, { signal })
      ]);
      
      setBidangPenelitian(bidangList);
      setKelompok(kelompokData);

    } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) {
        console.log("Request to fetch form data was aborted.");
        return;
      }
      console.error("Gagal memuat data awal:", error);
      toast.error("Gagal memuat data untuk form.");
    } finally {
        if (!signal?.aborted) {
            setIsFetching(false);
        }
    }
  }, [router]);
  
  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => {
        controller.abort();
    }
  }, [fetchData]);

  const handleCheckboxChange = (nama: string) => {
    setMahasiswaTerlibat(prev =>
      prev.includes(nama) ? prev.filter(n => n !== nama) : [...prev, nama]
    );
  };

  // Diperbarui: Fungsi untuk menangani "Ceklis Semua"
  const handleSelectAllChange = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const allMemberNames = kelompok?.anggota.map(a => a.nama) || [];
      setMahasiswaTerlibat(allMemberNames);
    } else {
      setMahasiswaTerlibat([]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!kelompok) {
        toast.error("Data kelompok tidak ditemukan.");
        return;
    }
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    formData.append('kelompok', kelompok.id);
    formData.append('status', 'Menunggu Persetujuan');
    formData.append('mahasiswa_terlibat', JSON.stringify(mahasiswaTerlibat));

    if (dokumen) {
        for (let i = 0; i < dokumen.length; i++) {
            formData.append('dokumen_pendukung', dokumen[i]);
        }
    }

    try {
        await pb.collection('laporans').create(formData);
        toast.success("Laporan berhasil dikirim!");
        router.push('/dashboard/mahasiswa/laporan');
    } catch (error) {
        console.error("Gagal mengirim laporan:", error);
        toast.error("Gagal mengirim laporan.");
    } finally {
        setIsLoading(false);
    }
  };

  if (isFetching) {
    return <main className="flex-1 p-6"><div className="flex h-full items-center justify-center"><p>Memuat formulir...</p></div></main>;
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <Link href="/dashboard/mahasiswa/laporan">
          <Button variant="outline" size="sm">
            <IconChevronLeft className="h-4 w-4 mr-1" />
            Kembali ke Daftar Laporan
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulir Laporan Kegiatan</CardTitle>
          <CardDescription>Isi semua detail kegiatan penelitian Anda di bawah ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Kolom Kiri */}
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="tanggal_kegiatan">Tanggal Kegiatan</Label>
                  <Input id="tanggal_kegiatan" name="tanggal_kegiatan" type="date" required />
                </div>
                <div>
                  <Label htmlFor="bidang_penelitian">Bidang Penelitian</Label>
                  <Select name="bidang_penelitian" required>
                    <SelectTrigger id="bidang_penelitian">
                      <SelectValue placeholder="Pilih bidang penelitian..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bidangPenelitian.map(bidang => (
                        <SelectItem key={bidang.id} value={bidang.id}>{bidang.nama_bidang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="judul_kegiatan">Judul Kegiatan</Label>
                  <Input id="judul_kegiatan" name="judul_kegiatan" placeholder="Contoh: Sosialisasi Bahaya Narkoba" required />
                </div>
                <div>
                  <Label htmlFor="tempat_pelaksanaan">Tempat Pelaksanaan</Label>
                  <Input id="tempat_pelaksanaan" name="tempat_pelaksanaan" placeholder="Contoh: Desa Sukamaju" />
                </div>
                 <div>
                  <Label htmlFor="narasumber">Narasumber</Label>
                  <Input id="narasumber" name="narasumber" placeholder="Contoh: Dr. Budi, S.Kom., M.Kom." />
                </div>
              </div>

              {/* Kolom Kanan */}
              <div className="grid gap-4">
                 <div>
                  <Label>Mahasiswa yang Terlibat</Label>
                  <div className="p-3 border rounded-md space-y-2">
                    {/* Diperbarui: Menambahkan checkbox "Ceklis Semua" */}
                    <div className="flex items-center space-x-2 border-b pb-2 mb-2">
                        <Checkbox
                            id="select-all-anggota"
                            checked={
                                kelompok?.anggota.length ? mahasiswaTerlibat.length === kelompok?.anggota.length : false
                            }
                            onCheckedChange={handleSelectAllChange}
                        />
                        <Label htmlFor="select-all-anggota" className="font-semibold">
                            Pilih Semua Anggota
                        </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {kelompok?.anggota.map((anggota, index) => (
                           <div key={index} className="flex items-center gap-2">
                             <Checkbox 
                                id={`anggota-${index}`}
                                checked={mahasiswaTerlibat.includes(anggota.nama)}
                                onCheckedChange={() => handleCheckboxChange(anggota.nama)} 
                             />
                             <Label htmlFor={`anggota-${index}`} className="font-normal">{anggota.nama}</Label>
                           </div>
                        ))}
                    </div>
                  </div>
                </div>
                 <div>
                  <Label htmlFor="unsur_terlibat">Unsur yang Terlibat</Label>
                  <Input id="unsur_terlibat" name="unsur_terlibat" placeholder="Contoh: Aparat Desa, Karang Taruna" />
                </div>
                <div>
                  <Label htmlFor="dokumen_pendukung">Dokumen Pendukung</Label>
                  <Input id="dokumen_pendukung" name="dokumen_pendukung" type="file" multiple onChange={(e) => setDokumen(e.target.files)} />
                  <p className="text-xs text-muted-foreground mt-1">Anda bisa mengunggah lebih dari satu file.</p>
                </div>
              </div>
            </div>

            {/* Bagian Bawah Full-width */}
            <div>
              <Label htmlFor="deskripsi_kegiatan">Deskripsi Kegiatan</Label>
              <Textarea id="deskripsi_kegiatan" name="deskripsi_kegiatan" placeholder="Jelaskan detail kegiatan di sini..." rows={5} />
            </div>
            <div>
              <Label htmlFor="rencana_tindak_lanjut">Rencana Tindak Lanjut</Label>
              <Textarea id="rencana_tindak_lanjut" name="rencana_tindak_lanjut" placeholder="Jelaskan rencana selanjutnya setelah kegiatan ini..." rows={3} />
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    <IconDeviceFloppy className="mr-2 h-4 w-4"/>
                    {isLoading ? 'Mengirim...' : 'Kirim Laporan'}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
