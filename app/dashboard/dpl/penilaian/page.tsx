"use client";

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table as UiTable, TableBody, TableCell as UiTableCell, TableHead as UiTableHead, TableHeader, TableRow as UiTableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IconAward, IconDownload, IconDeviceFloppy } from '@tabler/icons-react';
import { toast } from "sonner";

// --- Tipe Data ---
interface Prodi {
    nama_prodi: string;
}

interface KelompokBimbingan extends RecordModel {
    anggota: { nama: string; nim: string; prodiNama: string }[];
    expand?: {
        ketua: { 
            id: string; 
            nama_lengkap: string; 
            nim: string;
            expand?: {
                prodi: Prodi;
            }
        };
    }
}

interface NilaiRecord extends RecordModel {
    kelompok: string;
    mahasiswa_nim: string;
    mahasiswa_nama: string;
    dpl: string;
    nilai_akhir: number;
    catatan: string;
}

interface MahasiswaWithNilai {
    nim: string;
    nama: string;
    prodi: string;
    nilaiId?: string;
    nilai_akhir: number;
    catatan: string;
}

export default function PenilaianPage() {
    const [kelompokList, setKelompokList] = useState<KelompokBimbingan[]>([]);
    const [selectedKelompok, setSelectedKelompok] = useState<KelompokBimbingan | null>(null);
    const [mahasiswaList, setMahasiswaList] = useState<MahasiswaWithNilai[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingAll, setIsSavingAll] = useState(false); // REVISI: State untuk tombol simpan semua
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = pb.authStore.onChange(() => {
            setIsAuthReady(pb.authStore.isValid);
        }, true);

        return () => {
            unsubscribe();
        };
    }, []);

    const fetchKelompokBimbingan = useCallback(async (signal: AbortSignal) => {
        const user = pb.authStore.model;
        if (!user) return;

        setIsLoading(true);
        try {
            const filter = `dpl.id = "${user.id}"`;
            const data = await pb.collection('kelompok_mahasiswa').getFullList<KelompokBimbingan>({
                filter: filter,
                expand: 'ketua,ketua.prodi',
                signal,
            });
            setKelompokList(data);
        } catch (error) {
            if (!(error instanceof ClientResponseError && error.isAbort)) {
                toast.error("Gagal memuat daftar kelompok bimbingan.");
                console.error("Fetch Kelompok Error:", error);
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (isAuthReady) {
            const controller = new AbortController();
            fetchKelompokBimbingan(controller.signal);
            return () => {
                controller.abort();
            };
        }
    }, [isAuthReady, fetchKelompokBimbingan]);

    const handleKelompokChange = useCallback(async (kelompokId: string) => {
        if (!kelompokId) {
            setSelectedKelompok(null);
            setMahasiswaList([]);
            return;
        }

        setIsLoading(true);
        try {
            const kelompok = kelompokList.find(k => k.id === kelompokId);
            setSelectedKelompok(kelompok || null);

            if (kelompok) {
                const mahasiswaMap = new Map<string, { nama: string; prodi: string }>();

                if (kelompok.anggota && Array.isArray(kelompok.anggota)) {
                    kelompok.anggota.forEach(a => {
                        if (a.nim && a.nama) {
                            mahasiswaMap.set(a.nim, { nama: a.nama, prodi: a.prodiNama });
                        }
                    });
                }

                if (kelompok.expand?.ketua?.nim && kelompok.expand?.ketua?.nama_lengkap) {
                    mahasiswaMap.set(kelompok.expand.ketua.nim, {
                        nama: kelompok.expand.ketua.nama_lengkap,
                        prodi: kelompok.expand.ketua.expand?.prodi?.nama_prodi || 'Ketua'
                    });
                }
                
                const allMahasiswaInGroup = Array.from(mahasiswaMap.entries()).map(([nim, data]) => ({
                    nim,
                    ...data
                }));
                
                if (allMahasiswaInGroup.length === 0) {
                    setMahasiswaList([]);
                    setIsLoading(false);
                    return;
                }

                const existingNilai = await pb.collection('penilaian_mahasiswa').getFullList<NilaiRecord>({
                    filter: `kelompok.id = "${kelompokId}"`,
                });

                const mergedList = allMahasiswaInGroup.map(mhs => {
                    const nilai = existingNilai.find(n => n.mahasiswa_nim === mhs.nim);
                    return {
                        nim: mhs.nim,
                        nama: mhs.nama,
                        prodi: mhs.prodi,
                        nilaiId: nilai?.id,
                        nilai_akhir: nilai?.nilai_akhir ?? 0,
                        catatan: nilai?.catatan ?? '',
                    };
                });
                setMahasiswaList(mergedList);
            }
        } catch (error) {
             console.error("Gagal memuat data mahasiswa:", error);
             toast.error("Gagal memuat data mahasiswa untuk kelompok ini.");
             setMahasiswaList([]);
        } finally {
            setIsLoading(false);
        }
    }, [kelompokList]);

    const handleNilaiChange = (nim: string, value: string | number) => {
        setMahasiswaList(prev =>
            prev.map(mhs => mhs.nim === nim ? { ...mhs, nilai_akhir: Number(value) || 0 } : mhs)
        );
    };

    const handleCatatanChange = (nim: string, value: string) => {
        setMahasiswaList(prev => prev.map(mhs => mhs.nim === nim ? { ...mhs, catatan: value } : mhs));
    };

    // REVISI: Fungsi baru untuk menyimpan semua nilai sekaligus
    const handleSaveAllNilai = async () => {
        const user = pb.authStore.model;
        if (!selectedKelompok || !user || mahasiswaList.length === 0) {
            toast.error("Tidak ada data untuk disimpan.");
            return;
        }

        setIsSavingAll(true);
        toast.loading("Menyimpan semua nilai...");

        const promises = mahasiswaList.map(mahasiswaData => {
            const payload = {
                kelompok: selectedKelompok.id,
                mahasiswa_nim: mahasiswaData.nim,
                mahasiswa_nama: mahasiswaData.nama,
                dpl: user.id,
                nilai_akhir: mahasiswaData.nilai_akhir,
                catatan: mahasiswaData.catatan,
            };

            if (mahasiswaData.nilaiId) {
                return pb.collection('penilaian_mahasiswa').update(mahasiswaData.nilaiId, payload);
            } else {
                return pb.collection('penilaian_mahasiswa').create(payload);
            }
        });

        try {
            await Promise.all(promises);
            toast.dismiss();
            toast.success("Semua nilai berhasil disimpan.");
            // Muat ulang data untuk mendapatkan nilaiId yang baru
            handleKelompokChange(selectedKelompok.id);
        } catch (error) {
            toast.dismiss();
            console.error("Gagal menyimpan semua nilai:", error);
            toast.error("Terjadi kesalahan saat menyimpan nilai.");
        } finally {
            setIsSavingAll(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedKelompok) return;

        const tableHeader = new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ text: "No", style: "tableHeader" })] }),
                new TableCell({ children: [new Paragraph({ text: "Nama Mahasiswa", style: "tableHeader" })] }),
                new TableCell({ children: [new Paragraph({ text: "NIM", style: "tableHeader" })] }),
                new TableCell({ children: [new Paragraph({ text: "Nilai Akhir", style: "tableHeader" })] }),
                new TableCell({ children: [new Paragraph({ text: "Catatan", style: "tableHeader" })] }),
            ],
        });

        const dataRows = mahasiswaList.map((mhs, index) => new TableRow({
            children: [
                new TableCell({ children: [new Paragraph(`${index + 1}`)] }),
                new TableCell({ children: [new Paragraph(mhs.nama)] }),
                new TableCell({ children: [new Paragraph(mhs.nim)] }),
                new TableCell({ children: [new Paragraph(mhs.nilai_akhir.toString())] }),
                new TableCell({ children: [new Paragraph(mhs.catatan || '-')] }),
            ],
        }));

        const doc = new Document({
            styles: {
                paragraphStyles: [{ id: "tableHeader", name: "Table Header", run: { bold: true } }]
            },
            sections: [{
                children: [
                    new Paragraph({ text: "Rekapitulasi Nilai Pengabdian Mahasiswa", heading: HeadingLevel.HEADING_1, alignment: "center" }),
                    new Paragraph({ text: `Kelompok: ${selectedKelompok.expand?.ketua.nama_lengkap}`, heading: HeadingLevel.HEADING_2, alignment: "center" }),
                    new Paragraph(""),
                    new Table({ rows: [tableHeader, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `nilai-kelompok-${selectedKelompok.expand?.ketua.nama_lengkap}.docx`);
    };

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><IconAward />Penilaian Mahasiswa Bimbingan</CardTitle>
                    <CardDescription>Pilih kelompok, lalu input nilai akhir untuk setiap mahasiswa.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Select onValueChange={handleKelompokChange} disabled={!isAuthReady || (isLoading && kelompokList.length === 0)}>
                            <SelectTrigger className="w-full sm:w-[350px]">
                                <SelectValue placeholder={isLoading ? "Memuat kelompok..." : "Pilih Kelompok Bimbingan..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading ? (
                                    <SelectItem value="loading" disabled>Memuat...</SelectItem>
                                ) : kelompokList.length > 0 ? (
                                    kelompokList.map(k => (
                                        <SelectItem key={k.id} value={k.id}>
                                            Kelompok: {k.expand?.ketua?.nama_lengkap || 'Tanpa Nama'}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="no-data" disabled>
                                        Tidak ada kelompok bimbingan.
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleDownload} disabled={!selectedKelompok || mahasiswaList.length === 0}>
                            <IconDownload className="mr-2 h-4 w-4" /> Download Nilai
                        </Button>
                    </div>

                    {selectedKelompok && (
                        <>
                            <div className="border rounded-lg overflow-x-auto">
                                <UiTable>
                                    <TableHeader>
                                        <UiTableRow>
                                            <UiTableHead className="w-[50px]">No</UiTableHead>
                                            <UiTableHead className="min-w-[250px]">Nama Mahasiswa</UiTableHead>
                                            <UiTableHead>Nilai Akhir (0-100)</UiTableHead>
                                            <UiTableHead className="min-w-[250px]">Catatan</UiTableHead>
                                        </UiTableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <UiTableRow><UiTableCell colSpan={4} className="text-center h-24">Memuat mahasiswa...</UiTableCell></UiTableRow>
                                        ) : mahasiswaList.length > 0 ? (
                                            mahasiswaList.map((mhs, index) => (
                                                <UiTableRow key={mhs.nim}>
                                                    <UiTableCell>{index + 1}</UiTableCell>
                                                    <UiTableCell className="font-medium">{mhs.nama}<br/><span className="text-xs text-muted-foreground">{mhs.nim}</span></UiTableCell>
                                                    <UiTableCell><Input type="number" min="0" max="100" value={mhs.nilai_akhir} onChange={(e) => handleNilaiChange(mhs.nim, e.target.value)} className="w-28" /></UiTableCell>
                                                    <UiTableCell><Textarea value={mhs.catatan} onChange={(e) => handleCatatanChange(mhs.nim, e.target.value)} placeholder="Catatan (opsional)..." /></UiTableCell>
                                                </UiTableRow>
                                            ))
                                        ) : (
                                            <UiTableRow><UiTableCell colSpan={4} className="text-center h-24">Kelompok ini belum memiliki anggota.</UiTableCell></UiTableRow>
                                        )}
                                    </TableBody>
                                </UiTable>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSaveAllNilai} disabled={isSavingAll || mahasiswaList.length === 0}>
                                    <IconDeviceFloppy className="mr-2 h-4 w-4"/>
                                    {isSavingAll ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
