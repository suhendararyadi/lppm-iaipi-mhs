"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, PageOrientation } from 'docx';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconFileText, IconEye, IconPencil, IconTrash, IconDownload, IconDotsVertical } from '@tabler/icons-react';
import { toast } from "sonner";

interface Anggota {
  nama: string;
  nim: string;
  prodiNama: string;
}
// Diperbarui: Menambahkan nim dan expand prodi untuk ketua
interface Kelompok extends RecordModel {
    anggota: Anggota[];
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
        },
        periode?: {
            status: 'aktif' | 'arsip';
        }
    }
}
interface Laporan extends RecordModel {
    judul_kegiatan: string;
    tanggal_kegiatan: string;
    status: 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Revisi';
    tempat_pelaksanaan: string;
    narasumber: string;
    deskripsi_kegiatan: string;
    rencana_tindak_lanjut: string;
    mahasiswa_terlibat: string[];
    expand?: {
        bidang_penelitian: {
            nama_bidang: string;
        },
        kelompok?: {
            expand?: {
                periode?: {
                    status: 'aktif' | 'arsip';
                }
            }
        }
    }
}

export default function LaporanListPage() {
  const router = useRouter();
  const [laporans, setLaporans] = useState<Laporan[]>([]);
  const [kelompok, setKelompok] = useState<Kelompok | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLaporan = useCallback(async (signal?: AbortSignal) => {
    const user = pb.authStore.model;
    if (!user) {
      router.replace('/login');
      return;
    }
    setIsLoading(true);
    try {
      // Mahasiswa yang lanjut lintas sesi kini bisa punya lebih dari satu record kelompok
      // (lama + baru) — ambil semuanya supaya riwayat laporan dari sesi lama tetap terlihat,
      // lalu pakai kelompok yang periodenya aktif untuk header rekap & tombol "Buat Laporan Baru".
      const kelompokList = await pb.collection('kelompok_mahasiswa').getFullList<Kelompok>({
          filter: `ketua.id="${user.id}"`,
          expand: 'ketua,dpl,ketua.prodi,periode',
          signal,
      });
      if (kelompokList.length === 0) {
        throw new Error('Kelompok tidak ditemukan');
      }
      const kelompokAktif = kelompokList.find(k => k.expand?.periode?.status === 'aktif') ?? null;
      setKelompok(kelompokAktif ?? kelompokList[0]);

      const kelompokIdFilter = kelompokList.map(k => `kelompok.id="${k.id}"`).join(' || ');
      const laporanList = await pb.collection('laporans').getFullList<Laporan>({
          filter: kelompokIdFilter,
          sort: '-tanggal_kegiatan',
          expand: 'bidang_penelitian,kelompok.periode',
          signal: signal,
      });
      setLaporans(laporanList);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        console.error("Gagal memuat data laporan:", error);
        toast.error("Gagal memuat daftar laporan.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchLaporan(controller.signal);
    return () => controller.abort();
  }, [fetchLaporan]);

  const handleDelete = (laporanId: string, laporanJudul: string) => {
    toast.error(`Apakah Anda yakin ingin menghapus laporan "${laporanJudul}"?`, {
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await pb.collection('laporans').delete(laporanId);
            toast.success("Laporan berhasil dihapus.");
            fetchLaporan();
          } catch (error) {
            console.error("Gagal menghapus laporan:", error);
            toast.error("Gagal menghapus laporan.");
          }
        },
      },
      cancel: { label: "Batal", onClick: () => {} },
    });
  };

  const handleDownloadDocx = async () => {
    if (!kelompok || laporans.length === 0) {
        toast.error("Data laporan belum lengkap untuk diunduh.");
        return;
    }
    const ketua = kelompok.expand?.ketua;
    const dpl = kelompok.expand?.dpl;
    const anggota = kelompok.anggota || [];
    const prodiKetua = ketua?.expand?.prodi?.nama_prodi || 'N/A';
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
                new Paragraph({ text: "Rekapitulasi Laporan Pengabdian Mahasiswa", heading: "Heading1", alignment: "center" }),
                new Paragraph({ text: "" }),
                // Diperbarui: Menambahkan NIM dan Prodi untuk Ketua
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
    saveAs(blob, `rekap-laporan-${ketua?.nama_lengkap || 'kelompok'}.docx`);
    toast.success("Dokumen berhasil diunduh!");
  };

  // Dipakai untuk tombol "Buat Laporan Baru" — sesi yang sedang aktif untuk mahasiswa ini.
  const isPeriodeArsip = !kelompok || kelompok.expand?.periode?.status === 'arsip';
  // Status arsip per-laporan — karena daftar ini sekarang bisa berisi laporan dari sesi lama
  // DAN sesi baru sekaligus, kuncinya harus dicek per baris lewat kelompok masing-masing laporan,
  // bukan satu flag global seperti sebelumnya.
  const isLaporanArsip = (laporan: Laporan) => laporan.expand?.kelompok?.expand?.periode?.status === 'arsip';

  const getStatusBadgeVariant = (status: Laporan['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'Disetujui': return 'default';
        case 'Menunggu Persetujuan': return 'secondary';
        case 'Revisi': return 'destructive';
        default: return 'outline';
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><IconFileText />Daftar Laporan Pengabdian</CardTitle>
            <CardDescription>Lihat, edit, atau hapus laporan yang telah Anda buat.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadDocx} disabled={isLoading || laporans.length === 0}>
              <IconDownload className="mr-2 h-4 w-4" />
              Download Rekap
            </Button>
            {isPeriodeArsip ? (
              <Button disabled title="Sesi Anda sudah diarsipkan">Buat Laporan Baru</Button>
            ) : (
              <Link href="/dashboard/mahasiswa/laporan/baru">
                <Button>Buat Laporan Baru</Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul Kegiatan</TableHead>
                  <TableHead>Bidang</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Memuat laporan...</TableCell></TableRow>
                ) : laporans.length > 0 ? (
                  laporans.map((laporan) => {
                    const arsip = isLaporanArsip(laporan);
                    return (
                    <TableRow key={laporan.id}>
                      <TableCell className="font-medium">{laporan.judul_kegiatan}</TableCell>
                      <TableCell>{laporan.expand?.bidang_penelitian?.nama_bidang || '-'}</TableCell>
                      <TableCell>{new Date(laporan.tanggal_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                      <TableCell><Badge variant={getStatusBadgeVariant(laporan.status)}>{laporan.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><IconDotsVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/mahasiswa/laporan/${laporan.id}`}>
                                <IconEye className="h-4 w-4" /> Lihat
                              </Link>
                            </DropdownMenuItem>
                            {arsip ? (
                              <DropdownMenuItem disabled title="Sesi sudah diarsipkan">
                                <IconPencil className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/mahasiswa/laporan/${laporan.id}/edit`}>
                                  <IconPencil className="h-4 w-4" /> Edit
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={arsip}
                              title={arsip ? "Sesi sudah diarsipkan" : undefined}
                              onClick={() => handleDelete(laporan.id, laporan.judul_kegiatan)}
                            >
                              <IconTrash className="h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );})
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">Belum ada laporan yang dibuat.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
