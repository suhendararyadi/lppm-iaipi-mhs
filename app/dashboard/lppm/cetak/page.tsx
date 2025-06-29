"use client";

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, PageOrientation } from 'docx';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconPrinter, IconDownload } from '@tabler/icons-react';
import { toast } from "sonner";

// Tipe data yang diperlukan
interface Anggota {
    nama: string;
    nim: string;
    prodiNama: string;
}
interface Kelompok extends RecordModel {
    anggota: Anggota[];
    expand?: {
        ketua: { nama_lengkap: string; prodi: string; };
        dpl?: { nama_lengkap: string; };
    }
}
interface Laporan extends RecordModel {
    judul_kegiatan: string;
    tanggal_kegiatan: string;
    status: string;
    tempat_pelaksanaan: string;
    narasumber: string;
    deskripsi_kegiatan: string;
    rencana_tindak_lanjut: string;
    expand?: { 
        bidang_penelitian: { nama_bidang: string; },
        kelompok: Kelompok;
    }
}

export default function CetakLaporanPage() {
  const [allKelompok, setAllKelompok] = useState<Kelompok[]>([]);
  const [allLaporan, setAllLaporan] = useState<Laporan[]>([]);

  // State untuk Cetak per Kelompok (Fitur 1)
  const [selectedKelompok, setSelectedKelompok] = useState<Kelompok | null>(null);
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);

  // State untuk Cetak Kelompok dengan Filter Prodi (Fitur 2)
  const [kelompokForProdiRekap, setKelompokForProdiRekap] = useState<Kelompok | null>(null);
  const [prodiInKelompok, setProdiInKelompok] = useState<string[]>([]);
  const [selectedProdiForDownload, setSelectedProdiForDownload] = useState<string>('');


  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const [kelompokData, laporanData] = await Promise.all([
            pb.collection('kelompok_mahasiswa').getFullList<Kelompok>({ sort: 'created', expand: 'ketua,dpl', signal: controller.signal }),
            pb.collection('laporans').getFullList<Laporan>({ sort: '-created', expand: 'kelompok,kelompok.ketua,bidang_penelitian', signal: controller.signal }),
        ]);
        setAllKelompok(kelompokData);
        setAllLaporan(laporanData);
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

  // Handler untuk Fitur 1: Cetak per Kelompok
  const handleKelompokChange = useCallback((kelompokId: string) => {
    if (!kelompokId) return;
    const kelompokDetail = allKelompok.find(k => k.id === kelompokId);
    if (kelompokDetail) {
        setSelectedKelompok(kelompokDetail);
        const laporanData = allLaporan.filter(l => l.expand?.kelompok?.id === kelompokId);
        setLaporanList(laporanData);
    }
  }, [allKelompok, allLaporan]);
  
  const handleDownloadKelompokDocx = async () => {
    if (!selectedKelompok) {
        toast.error("Pilih kelompok terlebih dahulu.");
        return;
    }
    const ketua = selectedKelompok.expand?.ketua;
    const dpl = selectedKelompok.expand?.dpl;
    const anggota = selectedKelompok.anggota || [];
    const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '');

    const tableHeader = new DocxTableRow({
        children: [
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Judul Kegiatan", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tempat", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Narasumber", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Deskripsi", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "RTL", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tanggal", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
        ],
    });

    const dataRows = laporanList.map((laporan, index) => new DocxTableRow({
        children: [
            new DocxTableCell({ children: [new Paragraph(`${index + 1}`)] }),
            new DocxTableCell({ children: [new Paragraph(laporan.judul_kegiatan)] }),
            new DocxTableCell({ children: [new Paragraph(laporan.tempat_pelaksanaan || '-') ]}),
            new DocxTableCell({ children: [new Paragraph(laporan.narasumber || '-') ]}),
            new DocxTableCell({ children: [new Paragraph(stripHtml(laporan.deskripsi_kegiatan))] }),
            new DocxTableCell({ children: [new Paragraph(laporan.rencana_tindak_lanjut || '-') ]}),
            new DocxTableCell({ children: [new Paragraph(new Date(laporan.tanggal_kegiatan).toLocaleDateString('id-ID'))] }),
            new DocxTableCell({ children: [new Paragraph(laporan.status)] }),
        ],
    }));

    const doc = new Document({
        sections: [{
            properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
            children: [
                new Paragraph({ text: "Rekapitulasi Laporan Lengkap per Kelompok", heading: "Heading1", alignment: "center" }),
                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "Ketua Kelompok: ", bold: true }), new TextRun({ text: ketua?.nama_lengkap || 'N/A' })] }),
                new Paragraph({ children: [new TextRun({ text: "DPL: ", bold: true }), new TextRun({ text: dpl?.nama_lengkap || 'Belum Ditugaskan' })] }),
                new Paragraph({ children: [new TextRun({ text: "Anggota:", bold: true })] }),
                ...anggota.map(a => new Paragraph({ text: `- ${a.nama} (${a.nim}) - ${a.prodiNama}`, bullet: { level: 0 }})),
                new Paragraph({ text: "" }),
                new DocxTable({ rows: [tableHeader, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `rekap-kelompok-${ketua?.nama_lengkap.replace(/ /g, "_")}.docx`);
    toast.success("Dokumen berhasil diunduh!");
  };

  // Handler untuk Fitur 2: Cetak Kelompok dengan Filter Prodi
  const handleKelompokForProdiChange = (kelompokId: string) => {
    const kelompokDetail = allKelompok.find(k => k.id === kelompokId);
    if (kelompokDetail) {
        setKelompokForProdiRekap(kelompokDetail);
        const prodis = [...new Set(kelompokDetail.anggota.map(a => a.prodiNama))];
        setProdiInKelompok(prodis);
        setSelectedProdiForDownload('');
    }
  };

  const handleDownloadKelompokPerProdiDocx = async () => {
    if (!kelompokForProdiRekap || !selectedProdiForDownload) {
        toast.error("Silakan pilih kelompok dan prodi terlebih dahulu.");
        return;
    }

    const ketua = kelompokForProdiRekap.expand?.ketua;
    const dpl = kelompokForProdiRekap.expand?.dpl;
    const laporanFiltered = allLaporan.filter(l => l.expand?.kelompok?.id === kelompokForProdiRekap.id);
    const anggotaFiltered = kelompokForProdiRekap.anggota.filter(a => a.prodiNama === selectedProdiForDownload);
    const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '');

    const tableHeader = new DocxTableRow({
        children: [
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Judul Kegiatan", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tempat", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Narasumber", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Deskripsi", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "RTL", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tanggal", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
        ],
    });

    const dataRows = laporanFiltered.map((laporan, index) => new DocxTableRow({
        children: [
            new DocxTableCell({ children: [new Paragraph(`${index + 1}`)] }),
            new DocxTableCell({ children: [new Paragraph(laporan.judul_kegiatan)] }),
            new DocxTableCell({ children: [new Paragraph(laporan.tempat_pelaksanaan || '-') ]}),
            new DocxTableCell({ children: [new Paragraph(laporan.narasumber || '-') ]}),
            new DocxTableCell({ children: [new Paragraph(stripHtml(laporan.deskripsi_kegiatan))] }),
            new DocxTableCell({ children: [new Paragraph(laporan.rencana_tindak_lanjut || '-') ]}),
            new DocxTableCell({ children: [new Paragraph(new Date(laporan.tanggal_kegiatan).toLocaleDateString('id-ID'))] }),
            new DocxTableCell({ children: [new Paragraph(laporan.status)] }),
        ],
    }));

    const doc = new Document({
        sections: [{
            properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
            children: [
                new Paragraph({ text: `Rekapitulasi Laporan Kelompok ${ketua?.nama_lengkap || ''}`, heading: "Heading1", alignment: "center" }),
                new Paragraph({ text: `Program Studi: ${selectedProdiForDownload}`, heading: "Heading2", alignment: "center" }),
                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "DPL: ", bold: true }), new TextRun({ text: dpl?.nama_lengkap || 'Belum Ditugaskan' })] }),
                new Paragraph({ children: [new TextRun({ text: "Anggota dari Prodi Terpilih:", bold: true })] }),
                ...anggotaFiltered.map(a => new Paragraph({ text: `- ${a.nama} (${a.nim})`, bullet: { level: 0 } })),
                new Paragraph({ text: "" }),
                new DocxTable({ rows: [tableHeader, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `rekap-prodi-${selectedProdiForDownload.replace(/ /g, "_")}-kelompok-${ketua?.nama_lengkap.replace(/ /g, "_")}.docx`);
    toast.success("Dokumen berhasil diunduh!");
  };


  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IconPrinter />Cetak Laporan Lengkap per Kelompok</CardTitle>
          <CardDescription>Pilih kelompok untuk mengunduh rekapitulasi semua laporan dan anggota dari kelompok tersebut.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Select onValueChange={handleKelompokChange}>
              <SelectTrigger className="w-full sm:w-[300px]"><SelectValue placeholder="Pilih Kelompok (Ketua)..." /></SelectTrigger>
              <SelectContent>
                {allKelompok.map(k => <SelectItem key={k.id} value={k.id}>{k.expand?.ketua?.nama_lengkap || 'Tanpa Nama'}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleDownloadKelompokDocx} disabled={!selectedKelompok}>
              <IconDownload className="mr-2 h-4 w-4" /> Download Rekap Kelompok
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><IconPrinter />Cetak Laporan Kelompok (Filter per Prodi)</CardTitle>
            <CardDescription>Pilih kelompok, lalu pilih prodi untuk mengunduh rekapitulasi laporan dengan daftar anggota yang telah difilter.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Select onValueChange={handleKelompokForProdiChange}>
                    <SelectTrigger className="w-full sm:w-[300px]"><SelectValue placeholder="1. Pilih Kelompok..." /></SelectTrigger>
                    <SelectContent>
                        {allKelompok.map(k => <SelectItem key={k.id} value={k.id}>{k.expand?.ketua?.nama_lengkap || 'Tanpa Nama'}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select onValueChange={setSelectedProdiForDownload} disabled={!kelompokForProdiRekap}>
                    <SelectTrigger className="w-full sm:w-[250px]"><SelectValue placeholder="2. Pilih Prodi..." /></SelectTrigger>
                    <SelectContent>
                        {prodiInKelompok.map(prodi => <SelectItem key={prodi} value={prodi}>{prodi}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button onClick={handleDownloadKelompokPerProdiDocx} disabled={!selectedProdiForDownload}>
                    <IconDownload className="mr-2 h-4 w-4" /> Download Rekap Terfilter
                </Button>
            </div>
        </CardContent>
      </Card>
    </main>
  );
}
