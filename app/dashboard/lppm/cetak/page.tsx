"use client";

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, PageOrientation, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconPrinter, IconDownload } from '@tabler/icons-react';
import { toast } from "sonner";

// Tipe data yang diperlukan
interface Prodi extends RecordModel {
    nama_prodi: string;
}
interface Anggota {
    nama: string;
    nim: string;
    prodiId: string;
    prodiNama: string;
}
interface Kelompok extends RecordModel {
    anggota: Anggota[];
    expand?: {
        ketua: {
            id: string;
            nama_lengkap: string;
            nim: string;
            prodi: string;
            expand?: {
                prodi: Prodi;
            }
        };
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
    mahasiswa_terlibat: string[];
    expand?: { 
        bidang_penelitian: { nama_bidang: string; };
        kelompok: Kelompok;
    }
}

export default function CetakLaporanPage() {
  const [allKelompok, setAllKelompok] = useState<Kelompok[]>([]);
  const [allLaporan, setAllLaporan] = useState<Laporan[]>([]);
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [selectedProdiForRekap, setSelectedProdiForRekap] = useState<string>('');
  
  // State untuk fitur cetak per kelompok
  const [selectedKelompok, setSelectedKelompok] = useState<Kelompok | null>(null);
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const [kelompokData, laporanData, prodiData] = await Promise.all([
            pb.collection('kelompok_mahasiswa').getFullList<Kelompok>({ sort: 'created', expand: 'ketua,dpl,ketua.prodi', signal: controller.signal }),
            pb.collection('laporans').getFullList<Laporan>({ sort: '-created', expand: 'kelompok,kelompok.ketua,kelompok.dpl,kelompok.ketua.prodi,bidang_penelitian', signal: controller.signal }),
            pb.collection('program_studi').getFullList<Prodi>({ sort: 'nama_prodi', signal: controller.signal })
        ]);
        setAllKelompok(kelompokData);
        setAllLaporan(laporanData);
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

  const handleKelompokChange = useCallback((kelompokId: string) => {
    if (!kelompokId) return;
    const kelompokDetail = allKelompok.find(k => k.id === kelompokId);
    if (kelompokDetail) {
        setSelectedKelompok(kelompokDetail);
        const laporanData = allLaporan.filter(l => l.expand?.kelompok?.id === kelompokId);
        setLaporanList(laporanData);
    }
  }, [allKelompok, allLaporan]);

  // REVISI: Mengimplementasikan fungsi download per kelompok
  const handleDownloadKelompokDocx = async () => {
    if (!selectedKelompok || laporanList.length === 0) {
        toast.error("Pilih kelompok dan pastikan kelompok memiliki laporan untuk diunduh.");
        return;
    }

    const kelompok = selectedKelompok;
    const laporans = laporanList;
    const ketua = kelompok.expand?.ketua;
    const dpl = kelompok.expand?.dpl;
    const anggota = kelompok.anggota || [];
    const prodiKetua = kelompok.expand?.ketua?.expand?.prodi?.nama_prodi || 'N/A';
    const stripHtml = (html: string) => html ? html.replace(/<[^>]*>?/gm, '') : '';

    const tableHeader = new DocxTableRow({
        children: [
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Bidang", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Judul Kegiatan", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tempat", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Narasumber", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Deskripsi", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mahasiswa Terlibat", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "RTL", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tanggal", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
        ],
    });

    const dataRows = laporans.map((laporan, index) => new DocxTableRow({
        children: [
            new DocxTableCell({ children: [new Paragraph(`${index + 1}`)] }),
            new DocxTableCell({ children: [new Paragraph(laporan.expand?.bidang_penelitian?.nama_bidang || '-')] }),
            new DocxTableCell({ children: [new Paragraph(laporan.judul_kegiatan)] }),
            new DocxTableCell({ children: [new Paragraph(laporan.tempat_pelaksanaan || '-')] }),
            new DocxTableCell({ children: [new Paragraph(laporan.narasumber || '-')] }),
            new DocxTableCell({ children: [new Paragraph(stripHtml(laporan.deskripsi_kegiatan))] }),
            new DocxTableCell({ children: [new Paragraph(laporan.mahasiswa_terlibat.join(', '))] }),
            new DocxTableCell({ children: [new Paragraph(laporan.rencana_tindak_lanjut || '-')] }),
            new DocxTableCell({ children: [new Paragraph(new Date(laporan.tanggal_kegiatan).toLocaleDateString('id-ID'))] }),
            new DocxTableCell({ children: [new Paragraph(laporan.status)] }),
        ],
    }));

    const doc = new Document({
        sections: [{
            properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
            children: [
                new Paragraph({ text: "Rekapitulasi Laporan Pengabdian Mahasiswa", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "Ketua Kelompok: ", bold: true }), new TextRun({ text: `${ketua?.nama_lengkap || 'N/A'} (${ketua?.nim || 'NIM tidak ada'}) - ${prodiKetua}` })] }),
                new Paragraph({ children: [new TextRun({ text: "DPL: ", bold: true }), new TextRun({ text: dpl?.nama_lengkap || 'Belum Ditugaskan' })] }),
                new Paragraph({ children: [new TextRun({ text: "Anggota:", bold: true })] }),
                ...anggota.map(a => new Paragraph({ text: `- ${a.nama} (${a.nim}) - ${a.prodiNama}`, bullet: { level: 0 }})),
                new Paragraph({ text: "" }),
                new DocxTable({ rows: [tableHeader, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `rekap-laporan-kelompok-${ketua?.nama_lengkap?.replace(/ /g, "_") || 'kelompok'}.docx`);
    toast.success("Dokumen berhasil diunduh!");
  };

  const handleDownloadProdiDocx = async () => {
    if (!selectedProdiForRekap) {
        toast.error("Silakan pilih program studi terlebih dahulu.");
        return;
    }

    const prodiTerpilih = prodiList.find(p => p.id === selectedProdiForRekap);
    if (!prodiTerpilih) return;

    const relevantKelompokIds = allKelompok
      .filter(kelompok =>
        (kelompok.expand?.ketua?.prodi === selectedProdiForRekap) ||
        (kelompok.anggota || []).some(anggota => anggota.prodiId === selectedProdiForRekap)
      )
      .map(kelompok => kelompok.id);

    const laporanFiltered = allLaporan.filter(laporan => {
      const kelompokId = laporan.expand?.kelompok?.id;
      return kelompokId && relevantKelompokIds.includes(kelompokId);
    });

    if (laporanFiltered.length === 0) {
        toast.info(`Tidak ada laporan yang ditemukan untuk prodi ${prodiTerpilih.nama_prodi}.`);
        return;
    }

    const groupedByKelompok = laporanFiltered.reduce((acc, laporan) => {
        const kelompokId = laporan.expand?.kelompok?.id;
        if (!kelompokId) return acc;
        if (!acc[kelompokId]) acc[kelompokId] = [];
        acc[kelompokId].push(laporan);
        return acc;
    }, {} as Record<string, Laporan[]>);

    const stripHtml = (html: string) => html ? html.replace(/<[^>]*>?/gm, '') : '';
    const docChildren: (Paragraph | DocxTable)[] = [];

    docChildren.push(new Paragraph({ text: "REKAPITULASI LAPORAN PENGABDIAN MAHASISWA", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }));
    docChildren.push(new Paragraph({ text: `PROGRAM STUDI: ${prodiTerpilih.nama_prodi.toUpperCase()}`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }));
    docChildren.push(new Paragraph({ text: "" }));

    for (const kelompokId in groupedByKelompok) {
        const kelompok = allKelompok.find(k => k.id === kelompokId);
        const laporansInGroup = groupedByKelompok[kelompokId];
        if (!kelompok) continue;

        docChildren.push(new Paragraph({ text: `Laporan Kelompok: ${kelompok.expand?.ketua?.nama_lengkap || 'N/A'}`, heading: HeadingLevel.HEADING_3 }));
        docChildren.push(new Paragraph({ children: [new TextRun({ text: "Nama DPL: ", bold: true }), new TextRun({ text: kelompok.expand?.dpl?.nama_lengkap || 'Belum Ditugaskan' })] }));
        docChildren.push(new Paragraph({ children: [new TextRun({ text: "Mahasiswa:", bold: true })] }));
        
        (kelompok.anggota || []).forEach(mahasiswa => {
            docChildren.push(new Paragraph({ text: `- ${mahasiswa.nama} (${mahasiswa.nim})`, bullet: { level: 0 } }));
        });
        docChildren.push(new Paragraph({ text: "" }));

        const tableHeader = new DocxTableRow({
            children: [
                new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })] }),
                new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Bidang", bold: true })] })] }),
                new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Judul Kegiatan", bold: true })] })] }),
                new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tempat", bold: true })] })] }),
                new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Narasumber", bold: true })] })] }),
                new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Deskripsi", bold: true })] })] }),
                new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mahasiswa Terlibat", bold: true })] })] }),
                new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "RTL", bold: true })] })] }),
                new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tanggal", bold: true })] })] }),
                new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
            ],
        });

        const dataRows = laporansInGroup.map((laporan, index) => new DocxTableRow({
            children: [
                new DocxTableCell({ children: [new Paragraph(`${index + 1}`)] }),
                new DocxTableCell({ children: [new Paragraph(laporan.expand?.bidang_penelitian?.nama_bidang || '-')] }),
                new DocxTableCell({ children: [new Paragraph(laporan.judul_kegiatan)] }),
                new DocxTableCell({ children: [new Paragraph(laporan.tempat_pelaksanaan || '-')] }),
                new DocxTableCell({ children: [new Paragraph(laporan.narasumber || '-')] }),
                new DocxTableCell({ children: [new Paragraph(stripHtml(laporan.deskripsi_kegiatan))] }),
                new DocxTableCell({ children: [new Paragraph(laporan.mahasiswa_terlibat.join(', '))] }),
                new DocxTableCell({ children: [new Paragraph(laporan.rencana_tindak_lanjut || '-')] }),
                new DocxTableCell({ children: [new Paragraph(new Date(laporan.tanggal_kegiatan).toLocaleDateString('id-ID'))] }),
                new DocxTableCell({ children: [new Paragraph(laporan.status)] }),
            ],
        }));
        
        docChildren.push(new DocxTable({ rows: [tableHeader, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }));
        docChildren.push(new Paragraph({ text: "" }));
    }

    const doc = new Document({
        sections: [{
            properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
            children: docChildren,
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `rekap-laporan-prodi-${prodiTerpilih.nama_prodi.replace(/ /g, "_")}.docx`);
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
            <CardTitle className="flex items-center gap-2"><IconPrinter />Cetak Rekapitulasi per Prodi</CardTitle>
            <CardDescription>Pilih program studi untuk mengunduh rekapitulasi semua laporan dari prodi tersebut.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Select onValueChange={setSelectedProdiForRekap}>
                    <SelectTrigger className="w-full sm:w-[300px]"><SelectValue placeholder="Pilih Program Studi..." /></SelectTrigger>
                    <SelectContent>
                        {prodiList.map(p => <SelectItem key={p.id} value={p.id}>{p.nama_prodi}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button onClick={handleDownloadProdiDocx} disabled={!selectedProdiForRekap}>
                    <IconDownload className="mr-2 h-4 w-4" /> Download Rekap Prodi
                </Button>
            </div>
        </CardContent>
      </Card>
    </main>
  );
}
