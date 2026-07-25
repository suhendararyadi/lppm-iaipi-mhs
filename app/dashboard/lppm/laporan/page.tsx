"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { IconFileText, IconEye } from "@tabler/icons-react";
import { pb } from "@/lib/pocketbase";
import { RecordModel, ClientResponseError } from "pocketbase";
import { toast } from "sonner";

// Tipe data yang diperluas
interface Laporan extends RecordModel {
    judul_kegiatan: string;
    status: string;
    updated: string;
    expand?: {
        kelompok?: {
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

interface Periode extends RecordModel {
    nama: string;
    status: "aktif" | "arsip";
}

export default function LppmLaporanListPage() {
  const [laporans, setLaporans] = useState<Laporan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>("");

  // Muat daftar periode sekali di awal; defaultkan filter ke periode aktif
  // supaya laporan sesi berjalan tidak tercampur dengan sesi yang sudah diarsipkan.
  useEffect(() => {
    const controller = new AbortController();
    pb.collection('periode')
      .getFullList<Periode>({ sort: '-created', signal: controller.signal })
      .then((periodes) => {
        setPeriodeList(periodes);
        const aktif = periodes.find((p) => p.status === 'aktif');
        setSelectedPeriodeId(aktif ? aktif.id : 'all');
      })
      .catch((error) => {
        if (!(error instanceof ClientResponseError && error.isAbort)) {
          console.error("Gagal memuat data periode:", error);
        }
      });
    return () => controller.abort();
  }, []);

  const fetchAllLaporan = useCallback(async (page: number = 1, perPage: number = 10, periodeId: string = 'all', signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const laporanList = await pb.collection('laporans').getList<Laporan>(page, perPage, {
          sort: '-updated',
          expand: 'kelompok,kelompok.ketua,kelompok.dpl',
          filter: periodeId && periodeId !== 'all' ? pb.filter('kelompok.periode = {:pid}', { pid: periodeId }) : '',
          signal,
      });
      setLaporans(laporanList.items);
      setTotalItems(laporanList.totalItems);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        console.error("Gagal memuat data laporan:", error);
        toast.error("Gagal memuat daftar laporan.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Tunggu periode aktif terdeteksi (atau fallback 'all') sebelum memuat laporan pertama kali
    if (!selectedPeriodeId) return;
    const controller = new AbortController();
    fetchAllLaporan(currentPage, itemsPerPage, selectedPeriodeId, controller.signal);
    return () => controller.abort();
  }, [fetchAllLaporan, currentPage, itemsPerPage, selectedPeriodeId]);

  const handlePeriodeChange = (value: string) => {
    setSelectedPeriodeId(value);
    setCurrentPage(1);
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'Disetujui': return 'default';
        case 'Menunggu Persetujuan': return 'secondary';
        case 'Revisi': return 'destructive';
        default: return 'outline';
    }
  }

  // Fungsi untuk menghitung total halaman
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Fungsi untuk mengubah halaman
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Fungsi untuk mengubah jumlah item per halaman
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1); // Reset ke halaman pertama
  };

  // Menghitung range data yang ditampilkan
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Fungsi untuk generate nomor halaman yang akan ditampilkan
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IconFileText />Manajemen Laporan Mahasiswa</CardTitle>
          <CardDescription>Berikut adalah daftar semua laporan yang telah diinput oleh seluruh mahasiswa.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter periode/sesi */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Sesi:</span>
            <Select value={selectedPeriodeId || undefined} onValueChange={handlePeriodeChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Pilih sesi..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Sesi</SelectItem>
                {periodeList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama}{p.status === 'arsip' ? ' (Arsip)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Header dengan informasi dan kontrol pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {totalItems > 0 ? (
                  <>Menampilkan {startItem}-{endItem} dari {totalItems} entri</>
                ) : (
                  <>Tidak ada data</>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tampilkan:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per halaman</span>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul Laporan</TableHead>
                  <TableHead>Ketua Kelompok</TableHead>
                  <TableHead>DPL</TableHead>
                  <TableHead>Update Terakhir</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">Memuat semua laporan...</TableCell></TableRow>
                ) : laporans.length > 0 ? (
                  laporans.map((laporan) => (
                    <TableRow key={laporan.id}>
                      <TableCell className="font-medium">{laporan.judul_kegiatan}</TableCell>
                      <TableCell>{laporan.expand?.kelompok?.expand?.ketua?.nama_lengkap || '-'}</TableCell>
                      <TableCell>{laporan.expand?.kelompok?.expand?.dpl?.nama_lengkap || 'Belum Ditugaskan'}</TableCell>
                      <TableCell>{new Date(laporan.updated).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</TableCell>
                      <TableCell><Badge variant={getStatusBadgeVariant(laporan.status)}>{laporan.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/dpl/laporan/${laporan.id}`}>
                            <Button variant="outline" size="icon"><IconEye className="h-4 w-4" /></Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center h-24">Belum ada laporan yang dibuat.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  {/* Previous Button */}
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {/* First Page */}
                  {currentPage > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer">
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage > 4 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}

                  {/* Page Numbers */}
                  {generatePageNumbers().map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  {/* Last Page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(totalPages)} className="cursor-pointer">
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  {/* Next Button */}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
