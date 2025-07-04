"use client";

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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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


export default function DetailLaporanDplPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [laporan, setLaporan] = useState<LaporanDetail | null>(null);
  const [catatan, setCatatan] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLaporan = useCallback(async (signal?: AbortSignal) => {
    if (!id || typeof id !== 'string') return;
    
    try {
      const record = await pb.collection('laporans').getOne<LaporanDetail>(id, {
        expand: 'bidang_penelitian,kelompok,kelompok.ketua,kelompok.dpl,kelompok.ketua.prodi',
        signal,
      });
      setLaporan(record);
      setCatatan(record.catatan_dpl || '');
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        toast.error("Gagal memuat detail laporan.");
        router.push('/dashboard/dpl');
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchLaporan(controller.signal);
    return () => controller.abort();
  }, [fetchLaporan]);

  const handleVerifikasi = async (status: 'Disetujui' | 'Revisi') => {
    if (!laporan) return;
    setIsSubmitting(true);
    try {
        await pb.collection('laporans').update(laporan.id, {
            status: status,
            catatan_dpl: catatan,
            tanggal_disetujui: status === 'Disetujui' ? new Date().toISOString() : null,
        });
        toast.success(`Laporan telah ditandai sebagai "${status}"`);
        router.push('/dashboard/dpl');
    } catch (error) {
        toast.error("Gagal memperbarui status laporan.");
        console.error("Update error:", error);
    } finally {
        setIsSubmitting(false);
    }
  }
  
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
                new Paragraph({ text: "LAPORAN KEGIATAN PENELITIAN", heading: "Heading1", alignment: "center" }),
                new Paragraph({ text: judul_kegiatan, heading: "Heading2", alignment: "center" }),
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
    <main className="flex-1 overflow-y-auto p-4 md:p-6 grid gap-6">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/dpl">
          <Button variant="outline" size="sm"><IconChevronLeft className="h-4 w-4 mr-1" />Kembali ke Daftar Verifikasi</Button>
        </Link>
        <Button variant="outline" onClick={handleDownloadDocx}>
            <IconDownload className="mr-2 h-4 w-4" />
            Download DOCX
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col"><span className="text-muted-foreground">Bidang Penelitian</span><span className="font-medium">{laporan.expand?.bidang_penelitian?.nama_bidang || '-'}</span></div>
                    <div className="flex flex-col"><span className="text-muted-foreground">Tempat</span><span className="font-medium">{laporan.tempat_pelaksanaan}</span></div>
                    <div className="flex flex-col"><span className="text-muted-foreground">Narasumber</span><span className="font-medium">{laporan.narasumber || '-'}</span></div>
                </div>
                <div className="space-y-2"><h3 className="font-semibold">Deskripsi Kegiatan</h3><div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: laporan.deskripsi_kegiatan }}></div></div>
                <div className="space-y-2"><h3 className="font-semibold">Rencana Tindak Lanjut</h3><p className="text-muted-foreground">{laporan.rencana_tindak_lanjut || '-'}</p></div>
                <div className="space-y-2">
                    <h3 className="font-semibold">Informasi Kelompok</h3>
                    <div className="text-sm text-muted-foreground pl-4 space-y-1">
                        <p><strong>Ketua:</strong> {laporan.expand?.kelompok?.expand?.ketua?.nama_lengkap} ({laporan.expand?.kelompok?.expand?.ketua?.nim || 'N/A'}) - {laporan.expand?.kelompok?.expand?.ketua?.expand?.prodi?.nama_prodi || 'N/A'}</p>
                        <p><strong>Anggota:</strong></p>
                        <ul className="list-disc list-inside ml-4">
                            {laporan.expand?.kelompok?.anggota?.map((a, i) => <li key={i}>{a.nama} ({a.nim}) - {a.prodiNama}</li>)}
                        </ul>
                    </div>
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
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Aksi Verifikasi</CardTitle>
                    <CardDescription>Berikan catatan dan setujui atau minta revisi untuk laporan ini.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div>
                        <Label htmlFor="catatan_dpl">Catatan/Feedback</Label>
                        <Textarea 
                            id="catatan_dpl"
                            placeholder="Tulis catatan di sini jika ada revisi..."
                            rows={8}
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Button onClick={() => handleVerifikasi('Disetujui')} disabled={isSubmitting}>
                            {isSubmitting ? 'Memproses...' : 'Setujui Laporan'}
                        </Button>
                        <Button variant="destructive" onClick={() => handleVerifikasi('Revisi')} disabled={isSubmitting}>
                            {isSubmitting ? 'Memproses...' : 'Minta Revisi'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}
