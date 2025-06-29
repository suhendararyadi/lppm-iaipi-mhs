"use client";

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useReactToPrint } from 'react-to-print';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconChevronLeft, IconPaperclip, IconDownload, IconPrinter } from '@tabler/icons-react';
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
            anggota: { nama: string, nim: string, prodi: string }[];
            expand?: {
                ketua: {
                    nama_lengkap: string;
                },
                dpl?: {
                    nama_lengkap: string;
                }
            }
        }
    }
}

// Komponen baru khusus untuk layout cetak
const PrintableLaporan = React.forwardRef<HTMLDivElement, { laporan: LaporanDetail }>(({ laporan }, ref) => {
    return (
        <div ref={ref} className="p-8 font-serif">
            <h1 className="text-xl font-bold mb-1">LAPORAN KEGIATAN PENELITIAN</h1>
            <h2 className="text-lg font-semibold mb-6">{laporan.judul_kegiatan}</h2>

            <table className="w-full text-sm mb-6">
                <tbody>
                    <tr><td className="font-bold pr-4 py-1 w-40">Tanggal Kegiatan</td><td>: {new Date(laporan.tanggal_kegiatan).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td></tr>
                    <tr><td className="font-bold pr-4 py-1">Bidang Penelitian</td><td>: {laporan.expand?.bidang_penelitian?.nama_bidang || '-'}</td></tr>
                    <tr><td className="font-bold pr-4 py-1">Tempat Pelaksanaan</td><td>: {laporan.tempat_pelaksanaan}</td></tr>
                    <tr><td className="font-bold pr-4 py-1">Narasumber</td><td>: {laporan.narasumber || '-'}</td></tr>
                    <tr><td className="font-bold pr-4 py-1">Status</td><td>: {laporan.status}</td></tr>
                </tbody>
            </table>

            <h3 className="font-bold text-md mb-2 border-b pb-1">Deskripsi Kegiatan</h3>
            <div className="text-sm mb-6" dangerouslySetInnerHTML={{ __html: laporan.deskripsi_kegiatan }}></div>

            <h3 className="font-bold text-md mb-2 border-b pb-1">Mahasiswa Terlibat</h3>
            <ul className="list-disc list-inside text-sm mb-6">
                {laporan.mahasiswa_terlibat.map((nama, i) => <li key={`print-${i}`}>{nama}</li>)}
            </ul>

            <h3 className="font-bold text-md mb-2 border-b pb-1">Rencana Tindak Lanjut</h3>
            <p className="text-sm mb-6">{laporan.rencana_tindak_lanjut || '-'}</p>

            {laporan.catatan_dpl && (
                <>
                    <h3 className="font-bold text-md mb-2 border-b pb-1">Catatan Revisi dari DPL</h3>
                    <p className="text-sm italic">{laporan.catatan_dpl}</p>
                </>
            )}
        </div>
    );
});
PrintableLaporan.displayName = 'PrintableLaporan';


export default function DetailLaporanPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [laporan, setLaporan] = useState<LaporanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const componentRef = useRef<HTMLDivElement>(null);

  const fetchLaporan = useCallback(async (signal?: AbortSignal) => {
    if (!id || typeof id !== 'string') {
        setIsLoading(false);
        return;
    };
    
    try {
      const record = await pb.collection('laporans').getOne<LaporanDetail>(id, {
        expand: 'bidang_penelitian,kelompok,kelompok.ketua,kelompok.dpl',
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

  // Diperbarui: Menggunakan hook useReactToPrint
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  if (isLoading) {
    return <main className="flex-1 p-6"><div className="flex h-full items-center justify-center">Memuat detail laporan...</div></main>;
  }

  if (!laporan) {
    return <main className="flex-1 p-6"><div className="flex h-full items-center justify-center">Laporan tidak ditemukan.</div></main>;
  }

  return (
    <>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-6 flex justify-between items-center">
            <Link href="/dashboard/mahasiswa/laporan">
            <Button variant="outline" size="sm"><IconChevronLeft className="h-4 w-4 mr-1" />Kembali ke Daftar Laporan</Button>
            </Link>
            {/* Diperbarui: Tombol sekarang memanggil fungsi handlePrint */}
            <Button variant="outline" onClick={handlePrint}>
                <IconPrinter className="mr-2 h-4 w-4" />
                Cetak Laporan
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
            {laporan.catatan_dpl && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md"><h3 className="font-semibold text-yellow-800">Catatan Revisi dari DPL</h3><p className="text-yellow-700 mt-1">{laporan.catatan_dpl}</p></div>
            )}
            </CardContent>
        </Card>
        </main>
        
        {/* Komponen cetak dirender di sini tetapi disembunyikan dari layar */}
        <div className="hidden">
            <PrintableLaporan ref={componentRef} laporan={laporan} />
        </div>
    </>
  );
}
