"use client";

import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconAward, IconDownload } from '@tabler/icons-react';
import { toast } from "sonner";

// --- Tipe Data ---
interface NilaiRecord extends RecordModel {
    mahasiswa_nama: string;
    mahasiswa_nim: string;
    nilai_akhir: number;
    catatan: string;
}

interface Kelompok extends RecordModel {
    expand?: {
        ketua: { nama_lengkap: string; };
        dpl?: { nama_lengkap: string; };
    }
}

export default function CetakNilaiLppmPage() {
    const [allKelompok, setAllKelompok] = useState<Kelompok[]>([]);
    const [allNilai, setAllNilai] = useState<NilaiRecord[]>([]);
    const [selectedKelompokId, setSelectedKelompokId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [kelompokData, nilaiData] = await Promise.all([
                    pb.collection('kelompok_mahasiswa').getFullList<Kelompok>({ sort: 'created', expand: 'ketua,dpl', signal: controller.signal }),
                    pb.collection('penilaian_mahasiswa').getFullList<NilaiRecord>({ sort: 'created', signal: controller.signal })
                ]);
                setAllKelompok(kelompokData);
                setAllNilai(nilaiData);
            } catch (error) {
                if (!(error instanceof ClientResponseError && error.isAbort)) {
                    toast.error("Gagal memuat data awal.");
                }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        };
        fetchData();
        return () => controller.abort();
    }, []);

    const generateDoc = (title: string, content: (Paragraph | Table)[]) => {
        return new Document({
            sections: [{
                children: [
                    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, alignment: "center" }),
                    new Paragraph(""),
                    ...content
                ],
            }],
        });
    };

    const handleDownloadPerKelompok = async () => {
        if (!selectedKelompokId) {
            toast.error("Silakan pilih kelompok terlebih dahulu.");
            return;
        }
        const kelompok = allKelompok.find(k => k.id === selectedKelompokId);
        const nilaiKelompok = allNilai.filter(n => n.kelompok === selectedKelompokId);

        if (!kelompok || nilaiKelompok.length === 0) {
            toast.info("Tidak ada data nilai untuk kelompok yang dipilih.");
            return;
        }

        const tableHeader = new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "No", style: "tableHeader" })] }), new TableCell({ children: [new Paragraph({ text: "Nama Mahasiswa", style: "tableHeader" })] }), new TableCell({ children: [new Paragraph({ text: "NIM", style: "tableHeader" })] }), new TableCell({ children: [new Paragraph({ text: "Nilai Akhir", style: "tableHeader" })] }) ] });
        const dataRows = nilaiKelompok.map((nilai, i) => new TableRow({ children: [ new TableCell({ children: [new Paragraph(`${i + 1}`)] }), new TableCell({ children: [new Paragraph(nilai.mahasiswa_nama)] }), new TableCell({ children: [new Paragraph(nilai.mahasiswa_nim)] }), new TableCell({ children: [new Paragraph(String(nilai.nilai_akhir))] }) ] }));
        
        const content = [
            new Paragraph({ text: `Kelompok: ${kelompok.expand?.ketua.nama_lengkap}`, heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: `DPL: ${kelompok.expand?.dpl?.nama_lengkap || 'N/A'}` }),
            new Paragraph(""),
            new Table({ rows: [tableHeader, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } })
        ];

        const doc = generateDoc("Rekapitulasi Nilai per Kelompok", content);
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `nilai-kelompok-${kelompok.expand?.ketua.nama_lengkap}.docx`);
    };

    const handleDownloadKeseluruhan = async () => {
        if (allNilai.length === 0) {
            toast.info("Tidak ada data nilai untuk diunduh.");
            return;
        }

        const content: (Paragraph | Table)[] = [];
        allKelompok.forEach(kelompok => {
            const nilaiKelompok = allNilai.filter(n => n.kelompok === kelompok.id);
            if (nilaiKelompok.length > 0) {
                content.push(new Paragraph({ text: `Kelompok: ${kelompok.expand?.ketua.nama_lengkap}`, heading: HeadingLevel.HEADING_2 }));
                content.push(new Paragraph({ text: `DPL: ${kelompok.expand?.dpl?.nama_lengkap || 'N/A'}` }));
                
                const tableHeader = new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "No", style: "tableHeader" })] }), new TableCell({ children: [new Paragraph({ text: "Nama Mahasiswa", style: "tableHeader" })] }), new TableCell({ children: [new Paragraph({ text: "NIM", style: "tableHeader" })] }), new TableCell({ children: [new Paragraph({ text: "Nilai Akhir", style: "tableHeader" })] }) ] });
                const dataRows = nilaiKelompok.map((nilai, i) => new TableRow({ children: [ new TableCell({ children: [new Paragraph(`${i + 1}`)] }), new TableCell({ children: [new Paragraph(nilai.mahasiswa_nama)] }), new TableCell({ children: [new Paragraph(nilai.mahasiswa_nim)] }), new TableCell({ children: [new Paragraph(String(nilai.nilai_akhir))] }) ] }));

                content.push(new Table({ rows: [tableHeader, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }));
                content.push(new Paragraph("")); // Spacer
            }
        });

        const doc = generateDoc("Rekapitulasi Nilai Keseluruhan", content);
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `rekap-nilai-keseluruhan.docx`);
    };

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><IconAward />Cetak Nilai Mahasiswa</CardTitle>
                    <CardDescription>Unduh rekapitulasi nilai akhir mahasiswa per kelompok atau secara keseluruhan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">Cetak per Kelompok</h3>
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <Select onValueChange={setSelectedKelompokId} disabled={isLoading}>
                                <SelectTrigger className="w-full sm:w-[350px]">
                                    <SelectValue placeholder={isLoading ? "Memuat..." : "Pilih Kelompok..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {allKelompok.map(k => <SelectItem key={k.id} value={k.id}>Kelompok: {k.expand?.ketua?.nama_lengkap || 'Tanpa Nama'}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleDownloadPerKelompok} disabled={!selectedKelompokId}>
                                <IconDownload className="mr-2 h-4 w-4" /> Download per Kelompok
                            </Button>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Cetak Keseluruhan</h3>
                        <Button onClick={handleDownloadKeseluruhan} disabled={isLoading || allNilai.length === 0}>
                            <IconDownload className="mr-2 h-4 w-4" /> Download Semua Nilai
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
