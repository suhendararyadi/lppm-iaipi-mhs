"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IconPrinter, IconDownload } from '@tabler/icons-react';
import { toast } from "sonner";

// Tipe data yang diperlukan
interface Prodi extends RecordModel {
    nama_prodi: string;
}
interface Kelompok extends RecordModel {
    anggota: { nama: string, nim: string, prodi: string }[];
    expand?: {
        ketua: { nama_lengkap: string; prodi: string; };
        dpl?: { nama_lengkap: string; };
    }
}
interface Laporan extends RecordModel {
    judul_kegiatan: string;
    tanggal_kegiatan: string;
    status: string;
    expand?: { bidang_penelitian: { nama_bidang: string; } }
}
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number; };
}

export default function CetakLaporanPage() {
  const [allKelompok, setAllKelompok] = useState<Kelompok[]>([]);
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [selectedProdi, setSelectedProdi] = useState<string>('');
  const [selectedKelompok, setSelectedKelompok] = useState<Kelompok | null>(null);
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch daftar kelompok dan prodi saat komponen dimuat
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const [kelompokData, prodiData] = await Promise.all([
            pb.collection('kelompok_mahasiswa').getFullList<Kelompok>({
                sort: 'created',
                expand: 'ketua',
                signal: controller.signal,
            }),
            pb.collection('program_studi').getFullList<Prodi>({ 
                sort: 'nama_prodi',
                signal: controller.signal,
            })
        ]);
        setAllKelompok(kelompokData);
        setProdiList(prodiData);
      } catch (error) {
        if (!(error instanceof ClientResponseError && error.isAbort)) {
            console.error("Gagal memuat data awal:", error);
            toast.error("Gagal memuat data awal.");
        }
      }
    };
    fetchData();
    return () => controller.abort();
  }, []);

  // Filter daftar kelompok berdasarkan prodi yang dipilih
  const filteredKelompokList = useMemo(() => {
    if (!selectedProdi) return allKelompok;
    return allKelompok.filter(k => k.expand?.ketua.prodi === selectedProdi);
  }, [selectedProdi, allKelompok]);

  // Fetch laporan ketika kelompok dipilih
  const handleKelompokChange = useCallback(async (kelompokId: string) => {
    if (!kelompokId) return;
    setIsLoading(true);
    setLaporanList([]); // Kosongkan daftar laporan saat kelompok baru dipilih
    try {
      const kelompokDetail = await pb.collection('kelompok_mahasiswa').getOne<Kelompok>(kelompokId, { expand: 'ketua,dpl' });
      setSelectedKelompok(kelompokDetail);

      const laporanData = await pb.collection('laporans').getFullList<Laporan>({
        filter: `kelompok.id = "${kelompokId}"`,
        sort: '-tanggal_kegiatan',
        expand: 'bidang_penelitian',
      });
      setLaporanList(laporanData);
    } catch (error) {
      console.error("Gagal memuat laporan:", error);
      toast.error("Gagal memuat laporan untuk kelompok ini.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleDownloadPDF = () => {
    if (!selectedKelompok || laporanList.length === 0) {
        toast.error("Pilih kelompok dan pastikan ada laporan untuk diunduh.");
        return;
    }
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const ketua = selectedKelompok.expand?.ketua;
    const dpl = selectedKelompok.expand?.dpl;
    const anggota = selectedKelompok.anggota || [];

    doc.setFontSize(18);
    doc.text("Rekapitulasi Laporan Penelitian Mahasiswa", 14, 22);
    doc.setFontSize(12);
    doc.text(`Kelompok: ${ketua?.nama_lengkap || 'N/A'}`, 14, 30);
    doc.text(`DPL: ${dpl?.nama_lengkap || 'Belum Ditugaskan'}`, 14, 37);

    autoTable(doc, {
        startY: 45,
        head: [['Informasi Kelompok']],
        body: [
            ['Daftar Anggota', anggota.map(a => `- ${a.nama} (${a.nim})`).join('\n')],
        ],
        theme: 'plain',
        headStyles: { fontStyle: 'bold' },
    });

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['No', 'Judul Kegiatan', 'Bidang', 'Tanggal', 'Status']],
        body: laporanList.map((laporan, index) => [
            index + 1,
            laporan.judul_kegiatan,
            laporan.expand?.bidang_penelitian?.nama_bidang || '-',
            new Date(laporan.tanggal_kegiatan).toLocaleDateString('id-ID'),
            laporan.status,
        ]),
        theme: 'grid',
    });

    doc.save(`rekap-laporan-${ketua?.nama_lengkap.replace(/ /g, "_")}.pdf`);
  };
  
  // Diperbaiki: Handler baru untuk filter prodi
  const handleProdiFilterChange = (prodiId: string) => {
    const newProdiId = prodiId === 'all' ? '' : prodiId;
    setSelectedProdi(newProdiId);
    setSelectedKelompok(null);
    setLaporanList([]);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IconPrinter />Cetak Laporan per Kelompok</CardTitle>
          <CardDescription>Pilih program studi, lalu pilih kelompok untuk melihat dan mengunduh rekapitulasi laporan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Select onValueChange={handleProdiFilterChange}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Filter Berdasarkan Prodi..." />
              </SelectTrigger>
              <SelectContent>
                {/* Diperbaiki: Menggunakan value yang tidak kosong */}
                <SelectItem value="all">Semua Prodi</SelectItem>
                {prodiList.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nama_prodi}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={handleKelompokChange} key={selectedProdi}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Pilih Kelompok (Ketua)..." />
              </SelectTrigger>
              <SelectContent>
                {filteredKelompokList.map(k => (
                  <SelectItem key={k.id} value={k.id}>{k.expand?.ketua.nama_lengkap || 'Tanpa Nama'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleDownloadPDF} disabled={!selectedKelompok || isLoading}>
              <IconDownload className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {selectedKelompok && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul Kegiatan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center h-24">Memuat laporan...</TableCell></TableRow>
                  ) : laporanList.length > 0 ? (
                    laporanList.map((laporan) => (
                      <TableRow key={laporan.id}>
                        <TableCell className="font-medium">{laporan.judul_kegiatan}</TableCell>
                        <TableCell>{new Date(laporan.tanggal_kegiatan).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell><Badge>{laporan.status}</Badge></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3} className="text-center h-24">Kelompok ini belum memiliki laporan.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
