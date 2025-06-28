"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
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
        expand: 'bidang_penelitian',
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

  if (isLoading) {
    return <main className="flex-1 p-6"><div className="flex h-full items-center justify-center">Memuat detail laporan...</div></main>;
  }

  if (!laporan) {
    return <main className="flex-1 p-6"><div className="flex h-full items-center justify-center">Laporan tidak ditemukan.</div></main>;
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 grid gap-6">
      <div className="mb-6">
        <Link href="/dashboard/dpl">
          <Button variant="outline" size="sm"><IconChevronLeft className="h-4 w-4 mr-1" />Kembali ke Daftar Verifikasi</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kolom Kiri: Detail Laporan */}
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
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2"><h3 className="font-semibold">Mahasiswa Terlibat</h3><ul className="list-disc list-inside text-muted-foreground">{laporan.mahasiswa_terlibat.map((nama, i) => <li key={i}>{nama}</li>)}</ul></div>
                    <div className="space-y-2"><h3 className="font-semibold">Unsur Luar Terlibat</h3><p className="text-muted-foreground">{laporan.unsur_terlibat || '-'}</p></div>
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

        {/* Kolom Kanan: Aksi Verifikasi */}
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
