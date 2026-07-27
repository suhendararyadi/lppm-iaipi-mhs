"use client";

import { useState, useEffect, useCallback } from "react";
import { pb } from "@/lib/pocketbase";
import { RecordModel, ClientResponseError } from "pocketbase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { IconCalendarStats, IconArchive, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

interface Periode extends RecordModel {
  nama: string;
  tahun_akademik: string;
  semester: string;
  status: "aktif" | "arsip";
}

export default function LppmPeriodePage() {
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [kelompokCount, setKelompokCount] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nama, setNama] = useState("");
  const [tahunAkademik, setTahunAkademik] = useState("");
  const [semester, setSemester] = useState("");

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const [periodes, kelompoks] = await Promise.all([
        pb.collection("periode").getFullList<Periode>({ sort: "-created", signal }),
        pb.collection("kelompok_mahasiswa").getFullList({ fields: "id,periode", signal }),
      ]);
      setPeriodeList(periodes);
      const counts: Record<string, number> = {};
      kelompoks.forEach((k: RecordModel) => {
        const pid = k.periode as string;
        if (pid) counts[pid] = (counts[pid] || 0) + 1;
      });
      setKelompokCount(counts);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        console.error("Gagal memuat data periode:", error);
        toast.error("Gagal memuat data periode.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const activePeriode = periodeList.find((p) => p.status === "aktif");

  const handleCreatePeriode = async () => {
    if (!nama.trim() || !semester) {
      toast.error("Nama sesi dan semester wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    try {
      const oldPeriodeId = activePeriode?.id;
      if (activePeriode) {
        await pb.collection("periode").update(activePeriode.id, { status: "arsip" });
      }
      const newPeriode = await pb.collection("periode").create({
        nama: nama.trim(),
        tahun_akademik: tahunAkademik.trim(),
        semester,
        status: "aktif",
      });

      // Lanjutkan kelompok mahasiswa yang ketuanya masih aktif ke sesi baru — tanpa ini,
      // kelompok lama tetap terkunci di sesi arsip dan mahasiswa kehilangan akses CRUD
      // (anggota/laporan) sampai LPPM membuat ulang kelompoknya secara manual.
      let migratedCount = 0;
      if (oldPeriodeId) {
        const oldKelompokList = await pb.collection("kelompok_mahasiswa").getFullList({
          filter: `periode = "${oldPeriodeId}"`,
          expand: "ketua",
        });
        for (const k of oldKelompokList) {
          if (k.expand?.ketua?.status !== "aktif") continue;
          await pb.collection("kelompok_mahasiswa").create({
            ketua: k.ketua,
            dpl: k.dpl,
            anggota: k.anggota ?? [],
            periode: newPeriode.id,
            ketua_nama: k.ketua_nama,
            dpl_nama: k.dpl_nama,
          });
          migratedCount++;
        }
      }

      toast.success(
        activePeriode
          ? `Sesi "${activePeriode.nama}" diarsipkan. Sesi baru aktif — ${migratedCount} kelompok mahasiswa aktif dilanjutkan otomatis.`
          : "Sesi baru berhasil diaktifkan."
      );
      setIsDialogOpen(false);
      setNama("");
      setTahunAkademik("");
      setSemester("");
      fetchData();
    } catch (error) {
      console.error("Gagal membuat periode baru:", error);
      toast.error("Gagal membuat periode baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconCalendarStats />
              Sesi Aktif Saat Ini
            </CardTitle>
            <CardDescription>
              Mahasiswa &amp; kelompok baru otomatis masuk ke sesi ini. Laporan Manajemen Laporan hanya menampilkan sesi ini secara default.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={() => setIsDialogOpen(true)} className="shrink-0">
              <IconArchive className="mr-2 h-4 w-4" /> Arsipkan &amp; Mulai Sesi Baru
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mulai Sesi Baru</DialogTitle>
                <DialogDescription>
                  {activePeriode
                    ? `Sesi "${activePeriode.nama}" akan diarsipkan (semua laporannya menjadi baca-saja) dan sesi baru di bawah ini akan menjadi sesi aktif.`
                    : "Belum ada sesi aktif. Sesi baru di bawah ini akan menjadi sesi aktif."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="nama">Nama Sesi</Label>
                  <Input
                    id="nama"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder='mis. "Sesi Ganjil 2025/2026"'
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="tahun">Tahun Akademik</Label>
                  <Input
                    id="tahun"
                    value={tahunAkademik}
                    onChange={(e) => setTahunAkademik(e.target.value)}
                    placeholder='mis. "2025/2026"'
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Semester</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih semester..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ganjil">Ganjil</SelectItem>
                      <SelectItem value="Genap">Genap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreatePeriode} disabled={isSubmitting}>
                  {isSubmitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Memproses..." : "Konfirmasi"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : activePeriode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Aktif</Badge>
              <span className="font-medium">{activePeriode.nama}</span>
              <span className="text-sm text-muted-foreground">
                {activePeriode.tahun_akademik} · {activePeriode.semester} ·{" "}
                {kelompokCount[activePeriode.id] || 0} kelompok
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Belum ada sesi aktif. Klik &quot;Arsipkan &amp; Mulai Sesi Baru&quot; untuk membuat sesi pertama.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Sesi</CardTitle>
          <CardDescription>Sesi berstatus arsip bersifat baca-saja — laporannya tidak bisa diubah siapa pun.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Sesi</TableHead>
                  <TableHead>Tahun Akademik</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Jumlah Kelompok</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Memuat data periode...
                    </TableCell>
                  </TableRow>
                ) : periodeList.length > 0 ? (
                  periodeList.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nama}</TableCell>
                      <TableCell>{p.tahun_akademik || "-"}</TableCell>
                      <TableCell>{p.semester || "-"}</TableCell>
                      <TableCell>{kelompokCount[p.id] || 0}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "aktif" ? "default" : "secondary"}>
                          {p.status === "aktif" ? "Aktif" : "Arsip"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Belum ada sesi.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
