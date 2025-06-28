"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
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
interface Laporan extends RecordModel {
    mahasiswa_terlibat: string[];
}

export default function EditLaporanPage() {
  const router = useRouter();
  const params = useParams();
  const { id: laporanId } = params;

  const [laporan, setLaporan] = useState<Laporan | null>(null);
  const [kelompok, setKelompok] = useState<Kelompok | null>(null);
  const [bidangPenelitian, setBidangPenelitian] = useState<BidangPenelitian[]>([]);
  const [mahasiswaTerlibat, setMahasiswaTerlibat] = useState<string[]>([]);
  const [dokumen, setDokumen] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data awal (laporan yang ada, bidang penelitian, dan data kelompok)
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    const user = pb.authStore.model;
    if (!user || typeof laporanId !== 'string') {
      router.push('/login');
      return;
    }

    try {
      // Ambil data laporan yang akan diedit
      const laporanData = await pb.collection('laporans').getOne<Laporan>(laporanId, { signal });
      setLaporan(laporanData);
      setMahasiswaTerlibat(laporanData.mahasiswa_terlibat || []);

      // Ambil daftar bidang penelitian
      const bidangList = await pb.collection('bidang_penelitian').getFullList<BidangPenelitian>({ sort: 'nama_bidang', signal });
      setBidangPenelitian(bidangList);

      // Ambil data kelompok mahasiswa
      const kelompokData = await pb.collection('kelompok_mahasiswa').getFirstListItem<Kelompok>(`ketua.id="${user.id}"`, { signal });
      setKelompok(kelompokData);

    } catch (error) {
        if (!(error instanceof ClientResponseError && error.isAbort)) {
            console.error("Gagal memuat data untuk form edit:", error);
            toast.error("Gagal memuat data laporan.");
            router.push('/dashboard/mahasiswa/laporan');
        }
    } finally {
        if (!signal?.aborted) setIsLoading(false);
    }
  }, [laporanId, router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const handleCheckboxChange = (nama: string) => {
    setMahasiswaTerlibat(prev =>
      prev.includes(nama) ? prev.filter(n => n !== nama) : [...prev, nama]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!laporan) return;
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    formData.append('mahasiswa_terlibat', JSON.stringify(mahasiswaTerlibat));

    // Tambahkan file ke FormData jika ada file baru
    if (dokumen) {
        for (let i = 0; i < dokumen.length; i++) {
            formData.append('dokumen_pendukung', dokumen[i]);
        }
    }

    try {
        await pb.collection('laporans').update(laporan.id, formData);
        toast.success("Laporan berhasil diperbarui!");
        router.push(`/dashboard/mahasiswa/laporan/${laporan.id}`);
    } catch (error) {
        console.error("Gagal memperbarui laporan:", error);
        toast.error("Gagal memperbarui laporan.");
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) {
    return <main className="flex-1 p-6"><div className="flex h-full items-center justify-center">Memuat formulir edit...</div></main>;
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <Link href={`/dashboard/mahasiswa/laporan/${laporanId}`}>
          <Button variant="outline" size="sm"><IconChevronLeft className="h-4 w-4 mr-1" />Kembali ke Detail</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Laporan Kegiatan</CardTitle>
          <CardDescription>Perbarui detail kegiatan penelitian Anda di bawah ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Kolom Kiri */}
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="tanggal_kegiatan">Tanggal Kegiatan</Label>
                  <Input id="tanggal_kegiatan" name="tanggal_kegiatan" type="date" defaultValue={laporan?.tanggal_kegiatan.split(' ')[0]} required />
                </div>
                <div>
                  <Label htmlFor="bidang_penelitian">Bidang Penelitian</Label>
                  <Select name="bidang_penelitian" defaultValue={laporan?.bidang_penelitian} required>
                    <SelectTrigger id="bidang_penelitian"><SelectValue placeholder="Pilih bidang..." /></SelectTrigger>
                    <SelectContent>
                      {bidangPenelitian.map(bidang => (
                        <SelectItem key={bidang.id} value={bidang.id}>{bidang.nama_bidang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="judul_kegiatan">Judul Kegiatan</Label>
                  <Input id="judul_kegiatan" name="judul_kegiatan" defaultValue={laporan?.judul_kegiatan} required />
                </div>
                <div>
                  <Label htmlFor="tempat_pelaksanaan">Tempat Pelaksanaan</Label>
                  <Input id="tempat_pelaksanaan" name="tempat_pelaksanaan" defaultValue={laporan?.tempat_pelaksanaan} />
                </div>
                 <div>
                  <Label htmlFor="narasumber">Narasumber</Label>
                  <Input id="narasumber" name="narasumber" defaultValue={laporan?.narasumber} />
                </div>
              </div>

              {/* Kolom Kanan */}
              <div className="grid gap-4">
                 <div>
                  <Label>Mahasiswa yang Terlibat</Label>
                  <div className="p-3 border rounded-md grid grid-cols-2 gap-2">
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
                 <div>
                  <Label htmlFor="unsur_terlibat">Unsur yang Terlibat</Label>
                  <Input id="unsur_terlibat" name="unsur_terlibat" defaultValue={laporan?.unsur_terlibat} />
                </div>
                <div>
                  <Label htmlFor="dokumen_pendukung">Ganti/Tambah Dokumen Pendukung</Label>
                  <Input id="dokumen_pendukung" name="dokumen_pendukung" type="file" multiple onChange={(e) => setDokumen(e.target.files)} />
                  <p className="text-xs text-muted-foreground mt-1">File yang ada akan diganti jika Anda mengunggah file baru.</p>
                </div>
              </div>
            </div>

            {/* Bagian Bawah Full-width */}
            <div>
              <Label htmlFor="deskripsi_kegiatan">Deskripsi Kegiatan</Label>
              <Textarea id="deskripsi_kegiatan" name="deskripsi_kegiatan" defaultValue={laporan?.deskripsi_kegiatan} rows={5} />
            </div>
            <div>
              <Label htmlFor="rencana_tindak_lanjut">Rencana Tindak Lanjut</Label>
              <Textarea id="rencana_tindak_lanjut" name="rencana_tindak_lanjut" defaultValue={laporan?.rencana_tindak_lanjut} rows={3} />
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    <IconDeviceFloppy className="mr-2 h-4 w-4"/>
                    {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
