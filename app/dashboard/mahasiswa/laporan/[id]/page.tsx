"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconChevronLeft, IconPaperclip, IconDownload } from '@tabler/icons-react';

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
    expand: {
        bidang_penelitian: {
            nama_bidang: string;
        }
    }
}

export default function DetailLaporanPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [laporan, setLaporan] = useState<LaporanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLaporan = async () => {
      if (!id || typeof id !== 'string') return;
      
      try {
        const record = await pb.collection('laporans').getOne<LaporanDetail>(id, {
          expand: 'bidang_penelitian',
        });
        setLaporan(record);
      } catch (error) {
        console.error("Gagal memuat detail laporan:", error);
        router.push('/dashboard/mahasiswa/laporan'); // Kembali jika laporan tidak ditemukan
      } finally {
        setIsLoading(false);
      }
    };
    fetchLaporan();
  }, [id, router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Memuat detail laporan...</div>;
  }

  if (!laporan) {
    return <div className="flex h-screen items-center justify-center">Laporan tidak ditemukan.</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-6 flex justify-between items-center">
            <Link href="/dashboard/mahasiswa/laporan">
              <Button variant="outline" size="sm"><IconChevronLeft className="h-4 w-4 mr-1" />Kembali ke Daftar Laporan</Button>
            </Link>
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
              {/* Detail Laporan */}
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col"><span className="text-muted-foreground">Bidang Penelitian</span><span className="font-medium">{laporan.expand.bidang_penelitian.nama_bidang}</span></div>
                <div className="flex flex-col"><span className="text-muted-foreground">Tempat</span><span className="font-medium">{laporan.tempat_pelaksanaan}</span></div>
                <div className="flex flex-col"><span className="text-muted-foreground">Narasumber</span><span className="font-medium">{laporan.narasumber || '-'}</span></div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-2">
                <h3 className="font-semibold">Deskripsi Kegiatan</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: laporan.deskripsi_kegiatan }}></div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Rencana Tindak Lanjut</h3>
                <p className="text-muted-foreground">{laporan.rencana_tindak_lanjut || '-'}</p>
              </div>

              {/* Mahasiswa & Unsur Terlibat */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <h3 className="font-semibold">Mahasiswa Terlibat</h3>
                    <ul className="list-disc list-inside text-muted-foreground">
                        {laporan.mahasiswa_terlibat.map((nama, i) => <li key={i}>{nama}</li>)}
                    </ul>
                </div>
                 <div className="space-y-2">
                    <h3 className="font-semibold">Unsur Luar Terlibat</h3>
                    <p className="text-muted-foreground">{laporan.unsur_terlibat || '-'}</p>
                </div>
              </div>

              {/* Dokumen Pendukung */}
              {laporan.dokumen_pendukung && laporan.dokumen_pendukung.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Dokumen Pendukung</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {laporan.dokumen_pendukung.map((file, i) => (
                      <a 
                        key={i} 
                        href={pb.getFileUrl(laporan, file)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm"
                      >
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <IconPaperclip className="h-4 w-4" />
                          <span className="truncate">{file}</span>
                          <IconDownload className="h-4 w-4 ml-auto" />
                        </Button>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Catatan DPL */}
              {laporan.catatan_dpl && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
                    <h3 className="font-semibold text-yellow-800">Catatan Revisi dari DPL</h3>
                    <p className="text-yellow-700 mt-1">{laporan.catatan_dpl}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

