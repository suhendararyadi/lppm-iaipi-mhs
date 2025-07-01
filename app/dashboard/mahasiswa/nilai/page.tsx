"use client";

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAward, IconUsers } from '@tabler/icons-react';
import { toast } from "sonner";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { IconChevronLeft } from '@tabler/icons-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Tipe data untuk anggota kelompok dengan nilai
interface NilaiAnggota extends RecordModel {
    mahasiswa_nama: string;
    mahasiswa_nim: string;
    nilai_akhir: number;
    catatan: string;
}

// Tipe data untuk informasi kelompok
interface InfoKelompok {
    namaKelompok: string;
    namaDpl: string;
}

export default function NilaiMahasiswaPage() {
    const [daftarNilai, setDaftarNilai] = useState<NilaiAnggota[]>([]);
    const [infoKelompok, setInfoKelompok] = useState<InfoKelompok | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = pb.authStore.onChange(() => {
            setIsAuthReady(pb.authStore.isValid);
        }, true);
        return () => unsubscribe();
    }, []);

    const fetchNilaiKelompok = useCallback(async (signal: AbortSignal) => {
        const user = pb.authStore.model;
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // 1. Cari kelompok mahasiswa berdasarkan ID atau NIM user
            const filter = `ketua.id = "${user.id}" || anggota.nim ?~ "${user.nim}"`;
            const kelompok = await pb.collection('kelompok_mahasiswa').getFirstListItem(filter, {
                expand: 'ketua,dpl',
                signal,
            });

            setInfoKelompok({
                namaKelompok: kelompok.expand?.ketua.nama_lengkap || 'Kelompok',
                namaDpl: kelompok.expand?.dpl.nama_lengkap || 'N/A'
            });
            
            // 2. Ambil semua data nilai untuk kelompok tersebut
            const nilaiList = await pb.collection('penilaian_mahasiswa').getFullList<NilaiAnggota>({
                filter: `kelompok.id = "${kelompok.id}"`,
                sort: 'mahasiswa_nama',
                signal,
            });
            setDaftarNilai(nilaiList);

        } catch (error) {
            if (error instanceof ClientResponseError && error.status === 404) {
                console.log("Kelompok atau nilai belum ada.");
                setDaftarNilai([]);
            } else if (!(error instanceof ClientResponseError && error.isAbort)) {
                toast.error("Gagal memuat data nilai kelompok.");
                console.error("Fetch Nilai Error:", error);
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
            fetchNilaiKelompok(controller.signal);
            return () => controller.abort();
        }
    }, [isAuthReady, fetchNilaiKelompok]);

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="mb-6">
                <Link href="/dashboard/mahasiswa">
                    <Button variant="outline" size="sm">
                        <IconChevronLeft className="h-4 w-4 mr-1" />
                        Kembali ke Dasbor
                    </Button>
                </Link>
            </div>
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IconAward />
                        Nilai Akhir Kelompok
                    </CardTitle>
                    <CardDescription>
                        Berikut adalah rekapitulasi nilai akhir untuk semua anggota kelompok Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-40 w-full" />
                        </div>
                    ) : daftarNilai.length > 0 && infoKelompok ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-muted/50 rounded-lg text-sm">
                                <p><strong>Kelompok:</strong> {infoKelompok.namaKelompok}</p>
                                <p><strong>Dosen Pembimbing:</strong> {infoKelompok.namaDpl}</p>
                            </div>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">No</TableHead>
                                            <TableHead>Nama Mahasiswa</TableHead>
                                            <TableHead>NIM</TableHead>
                                            <TableHead>Nilai Akhir</TableHead>
                                            <TableHead>Catatan DPL</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {daftarNilai.map((nilai, index) => (
                                            <TableRow key={nilai.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell className="font-medium">{nilai.mahasiswa_nama}</TableCell>
                                                <TableCell>{nilai.mahasiswa_nim}</TableCell>
                                                <TableCell className="font-bold text-primary">{nilai.nilai_akhir}</TableCell>
                                                <TableCell className="italic text-muted-foreground">{nilai.catatan || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <IconUsers className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-2 text-lg font-semibold">Nilai Belum Tersedia</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Nilai untuk kelompok Anda belum diinput oleh Dosen Pembimbing Lapangan.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
