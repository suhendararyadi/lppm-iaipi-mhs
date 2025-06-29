"use client";

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconSchool, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { toast } from "sonner";

interface Prodi extends RecordModel {
    nama_prodi: string;
    kode_prodi: string;
}

export default function LppmProdiManagementPage() {
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // State untuk loading tombol simpan
  const [editingProdi, setEditingProdi] = useState<Prodi | null>(null);

  const fetchProdi = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const list = await pb.collection('program_studi').getFullList<Prodi>({ sort: 'nama_prodi', signal });
      setProdiList(list);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        toast.error("Gagal memuat data program studi.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProdi(controller.signal);
    return () => controller.abort();
  }, [fetchProdi]);

  const handleOpenDialog = (prodi: Prodi | null = null) => {
    setEditingProdi(prodi);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      if (editingProdi) {
        await pb.collection('program_studi').update(editingProdi.id, data);
        toast.success("Program studi berhasil diperbarui.");
      } else {
        await pb.collection('program_studi').create(data);
        toast.success("Program studi baru berhasil ditambahkan.");
      }
      fetchProdi();
      setIsDialogOpen(false);
    } catch (error: unknown) {
      // Diperbaiki: Menampilkan pesan error yang lebih spesifik dari PocketBase
      console.error("Gagal menyimpan data:", error);
      if (error instanceof ClientResponseError) {
        toast.error(`Gagal: ${error.response.message || 'Silakan periksa kembali data Anda.'}`);
      } else {
        toast.error("Terjadi kesalahan yang tidak terduga.");
      }
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDelete = (prodiId: string, prodiNama: string) => {
    toast.error(`Hapus prodi "${prodiNama}"?`, {
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await pb.collection('program_studi').delete(prodiId);
            toast.success("Program studi berhasil dihapus.");
            fetchProdi();
          } catch (error) {
            console.error("Gagal menghapus data:", error);
            toast.error("Gagal menghapus data. Pastikan tidak ada pengguna yang terhubung dengan prodi ini.");
          }
        },
      },
      cancel: { label: "Batal", onClick: () => {} },
    });
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><IconSchool />Manajemen Program Studi</CardTitle>
            <CardDescription>Tambah, edit, atau hapus daftar program studi.</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}><IconPlus className="mr-2 h-4 w-4" /> Tambah Prodi</Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Program Studi</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center h-24">Memuat data...</TableCell></TableRow>
                ) : prodiList.length > 0 ? (
                  prodiList.map((prodi) => (
                    <TableRow key={prodi.id}>
                      <TableCell className="font-medium">{prodi.nama_prodi}</TableCell>
                      <TableCell>{prodi.kode_prodi || '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenDialog(prodi)}><IconEdit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(prodi.id, prodi.nama_prodi)}><IconTrash className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} className="text-center h-24">Belum ada data.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProdi ? 'Edit Program Studi' : 'Tambah Prodi Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nama_prodi">Nama Prodi</Label>
              <Input id="nama_prodi" name="nama_prodi" defaultValue={editingProdi?.nama_prodi} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kode_prodi">Kode Prodi (Opsional)</Label>
              <Input id="kode_prodi" name="kode_prodi" defaultValue={editingProdi?.kode_prodi} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
