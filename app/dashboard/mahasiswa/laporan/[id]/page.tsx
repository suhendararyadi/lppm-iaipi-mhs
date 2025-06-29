"use client";

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconChevronLeft, IconPaperclip, IconDownload } from '@tabler/icons-react';
import { toast } from 'sonner';

// Tipe untuk data laporan yang diperluas
interface LaporanDetail extends RecordModel {
    judul_kegiatan: string;
    tanggal_kegiatan: string;
    tempat_pelaksanaan: string;
    narasumber: string;
    unsur_terlibat: string;
    deskripsi_kegiatan: string;
    rencana_tindak_lanjut: string;
    status: string;
    catatan_dpl?: string;
    mahasiswa_terlibat: string[];
    dokumen_pendukung?: string[];
    expand?: {
        bidang_penelitian?: {
            nama_bidang: string;
        },
        kelompok?: {
            anggota: { nama: string, nim: string, prodiNama: string }[];
            expand?: {
                ketua: {
                    nama_lengkap: string;
                    nim: string;
                    expand?: {
                        prodi: {
                            nama_prodi: string;
                        }
                    }
                },
                dpl?: {
                    nama_lengkap: string;
                }
            }
        }
    }
}


export default function DetailLaporanPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [laporan, setLaporan] = useState<LaporanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLaporan = useCallback(async (signal?: AbortSignal) => {
    if (!id || typeof id !== 'string') {
        setIsLoading(false);
        return;
    };
    
    try {
      const record = await pb.collection('laporans').getOne<LaporanDetail>(id, {
        expand: 'bidang_penelitian,kelompok,kelompok.ketua,kelompok.dpl,kelompok.ketua.prodi',
        signal,
      });
      setLaporan(record);
    } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) {
        console.log("Request was aborted, this is expected.");
        return;
      }
      console.error("Gagal memuat detail laporan:", error);
      toast.error("Gagal memuat detail laporan atau laporan tidak ditemukan.");
      router.push('/dashboard/mahasiswa/laporan');
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [id, router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchLaporan(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchLaporan]);

  const handleDownloadDocx = async () => {
    if (!laporan) {
        toast.error("Data laporan belum lengkap untuk membuat dokumen.");
        return;
    }
    
    const { expand, judul_kegiatan, tanggal_kegiatan, tempat_pelaksanaan, narasumber, status, deskripsi_kegiatan, mahasiswa_terlibat, rencana_tindak_lanjut, catatan_dpl } = laporan;
    const ketua = expand?.kelompok?.expand?.ketua;
    const dpl = expand?.kelompok?.expand?.dpl;
    const anggota = expand?.kelompok?.anggota || [];
    const prodiKetua = ketua?.expand?.prodi?.nama_prodi || 'N/A';

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    text: "LAPORAN KEGIATAN PENELITIAN",
                    heading: "Heading1",
                    alignment: "center",
                }),
                new Paragraph({
                    text: judul_kegiatan,
                    heading: "Heading2",
                    alignment: "center",
                }),
                new Paragraph({ text: "" }),
                
                new Paragraph({ children: [new TextRun({ text: "Tanggal Kegiatan: ", bold: true }), new TextRun({ text: new Date(tanggal_kegiatan).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) })] }),
                new Paragraph({ children: [new TextRun({ text: "Bidang Penelitian: ", bold: true }), new TextRun({ text: expand?.bidang_penelitian?.nama_bidang || '-' })] }),
                new Paragraph({ children: [new TextRun({ text: "Tempat Pelaksanaan: ", bold: true }), new TextRun({ text: tempat_pelaksanaan })] }),
                new Paragraph({ children: [new TextRun({ text: "Narasumber: ", bold: true }), new TextRun({ text: narasumber || '-' })] }),
                new Paragraph({ children: [new TextRun({ text: "Status Laporan: ", bold: true }), new TextRun({ text: status })] }),
                new Paragraph({ text: "" }),

                new Paragraph({ children: [new TextRun({ text: "Informasi Kelompok", bold: true })] }),
                new Paragraph({ children: [new TextRun({ text: "Ketua Kelompok: ", bold: true }), new TextRun({ text: `${ketua?.nama_lengkap || 'N/A'} (${ketua?.nim || 'NIM tidak ada'}) - ${prodiKetua}` })] }),
                new Paragraph({ children: [new TextRun({ text: "DPL: ", bold: true }), new TextRun({ text: dpl?.nama_lengkap || 'Belum Ditugaskan' })] }),
                new Paragraph({ children: [new TextRun({ text: "Anggota:", bold: true })] }),
                ...anggota.map(a => new Paragraph({ text: `- ${a.nama} (${a.nim}) - ${a.prodiNama}`, bullet: { level: 0 } })),
                new Paragraph({ text: "" }),

                new Paragraph({ children: [new TextRun({ text: "Deskripsi Kegiatan", bold: true })] }),
                new Paragraph({ text: deskripsi_kegiatan.replace(/<[^>]*>?/gm, '') }),
                new Paragraph({ text: "" }),

                new Paragraph({ children: [new TextRun({ text: "Mahasiswa Terlibat", bold: true })] }),
                ...mahasiswa_terlibat.map(nama => new Paragraph({ text: `- ${nama}`, bullet: { level: 0 }})),
                new Paragraph({ text: "" }),

                new Paragraph({ children: [new TextRun({ text: "Rencana Tindak Lanjut", bold: true })] }),
                new Paragraph({ text: rencana_tindak_lanjut || '-' }),
                new Paragraph({ text: "" }),

                ...(catatan_dpl ? [
                    new Paragraph({ children: [new TextRun({ text: "Catatan Revisi dari DPL", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: catatan_dpl, italics: true })] }),
                ] : []),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `laporan-${judul_kegiatan.replace(/ /g, "_")}.docx`);
    toast.success("Dokumen berhasil diunduh!");
  };

  if (isLoading) {
    return <main className="flex-1 p-6"><div className="flex h-full items-center justify-center">Memuat detail laporan...</div></main>;
  }

  if (!laporan) {
    return <main className="flex-1 p-6"><div className="flex h-full items-center justify-center">Laporan tidak ditemukan.</div></main>;
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
    <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/mahasiswa/laporan">
        <Button variant="outline" size="sm"><IconChevronLeft className="h-4 w-4 mr-1" />Kembali ke Daftar Laporan</Button>
        </Link>
        <Button variant="outline" onClick={handleDownloadDocx}>
            <IconDownload className="mr-2 h-4 w-4" />
            Download DOCX
        </Button>
    </div>

    <Card>
        <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-2xl">{laporan.judul_kegiatan}</CardTitle>
                <CardDescription>
                {new Date(laporan.tanggal_kegiatan).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
            </div>
            <Badge>{laporan.status}</Badge>
        </div>
        </CardHeader>
        <CardContent className="grid gap-6">
            <div className="space-y-2">
                <h3 className="font-semibold">Informasi Kelompok</h3>
                <div className="text-sm text-muted-foreground pl-4 space-y-1">
                    <p><strong>Ketua:</strong> {laporan.expand?.kelompok?.expand?.ketua?.nama_lengkap} ({laporan.expand?.kelompok?.expand?.ketua?.nim || 'N/A'}) - {laporan.expand?.kelompok?.expand?.ketua?.expand?.prodi?.nama_prodi || 'N/A'}</p>
                    <p><strong>DPL:</strong> {laporan.expand?.kelompok?.expand?.dpl?.nama_lengkap || 'Belum Ditugaskan'}</p>
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="font-semibold">Detail Kegiatan</h3>
                <div className="text-sm text-muted-foreground pl-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                    <p><strong>Bidang Penelitian:</strong> {laporan.expand?.bidang_penelitian?.nama_bidang || '-'}</p>
                    <p><strong>Tempat Pelaksanaan:</strong> {laporan.tempat_pelaksanaan}</p>
                    <p><strong>Narasumber:</strong> {laporan.narasumber || '-'}</p>
                </div>
            </div>
            <div className="space-y-2"><h3 className="font-semibold">Deskripsi Kegiatan</h3><div className="prose prose-sm max-w-none text-muted-foreground pl-4" dangerouslySetInnerHTML={{ __html: laporan.deskripsi_kegiatan }}></div></div>
            <div className="space-y-2"><h3 className="font-semibold">Rencana Tindak Lanjut</h3><p className="text-muted-foreground pl-4">{laporan.rencana_tindak_lanjut || '-'}</p></div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2"><h3 className="font-semibold">Mahasiswa Terlibat</h3><ul className="list-disc list-inside text-muted-foreground pl-4">{laporan.mahasiswa_terlibat.map((nama, i) => <li key={i}>{nama}</li>)}</ul></div>
                <div className="space-y-2"><h3 className="font-semibold">Anggota Kelompok</h3><ul className="list-disc list-inside text-muted-foreground pl-4">{laporan.expand?.kelompok?.anggota.map((a, i) => <li key={i}>{a.nama} ({a.nim}) - {a.prodiNama}</li>)}</ul></div>
            </div>
            {laporan.dokumen_pendukung && laporan.dokumen_pendukung.length > 0 && (
                <div className="space-y-2">
                <h3 className="font-semibold">Dokumen Pendukung</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {laporan.dokumen_pendukung.map((file, i) => (
                    <a key={i} href={pb.getFileUrl(laporan, file)} target="_blank" rel="noopener noreferrer" className="text-sm">
                        <Button variant="outline" className="w-full justify-start gap-2"><IconPaperclip className="h-4 w-4" /><span className="truncate">{file}</span><IconDownload className="h-4 w-4 ml-auto" /></Button>
                    </a>
                    ))}
                </div>
                </div>
            )}
            {laporan.catatan_dpl && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md"><h3 className="font-semibold text-yellow-800">Catatan Revisi dari DPL</h3><p className="text-yellow-700 mt-1">{laporan.catatan_dpl}</p></div>
            )}
        </CardContent>
    </Card>
    </main>
  );
}
