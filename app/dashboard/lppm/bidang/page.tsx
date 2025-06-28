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
import { Textarea } from '@/components/ui/textarea';
import { IconBooks, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { toast } from "sonner";

interface Bidang extends RecordModel {
    nama_bidang: string;
    deskripsi: string;
}

export default function LppmBidangManagementPage() {
  const [bidangList, setBidangList] = useState<Bidang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBidang, setEditingBidang] = useState<Bidang | null>(null);

  const fetchBidang = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const list = await pb.collection('bidang_penelitian').getFullList<Bidang>({ sort: '-created', signal });
      setBidangList(list);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        console.error("Gagal memuat data bidang:", error);
        toast.error("Gagal memuat data bidang penelitian.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchBidang(controller.signal);
    return () => controller.abort();
  }, [fetchBidang]);

  const handleOpenDialog = (bidang: Bidang | null = null) => {
    setEditingBidang(bidang);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      if (editingBidang) {
        await pb.collection('bidang_penelitian').update(editingBidang.id, data);
        toast.success("Bidang penelitian berhasil diperbarui.");
      } else {
        await pb.collection('bidang_penelitian').create(data);
        toast.success("Bidang penelitian baru berhasil ditambahkan.");
      }
      fetchBidang();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      toast.error("Gagal menyimpan data.");
    }
  };
  
  const handleDelete = (bidangId: string, bidangNama: string) => {
    toast.error(`Hapus bidang "${bidangNama}"?`, {
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await pb.collection('bidang_penelitian').delete(bidangId);
            toast.success("Bidang penelitian berhasil dihapus.");
            fetchBidang();
          } catch (error) {
            console.error("Gagal menghapus data:", error);
            toast.error("Gagal menghapus data.");
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
            <CardTitle className="flex items-center gap-2"><IconBooks />Manajemen Bidang Penelitian</CardTitle>
            <CardDescription>Tambah, edit, atau hapus daftar bidang penelitian.</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}><IconPlus className="mr-2 h-4 w-4" /> Tambah Bidang</Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Bidang</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center h-24">Memuat data...</TableCell></TableRow>
                ) : bidangList.length > 0 ? (
                  bidangList.map((bidang) => (
                    <TableRow key={bidang.id}>
                      <TableCell className="font-medium">{bidang.nama_bidang}</TableCell>
                      <TableCell>{bidang.deskripsi}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenDialog(bidang)}><IconEdit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(bidang.id, bidang.nama_bidang)}><IconTrash className="h-4 w-4" /></Button>
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
            <DialogTitle>{editingBidang ? 'Edit Bidang' : 'Tambah Bidang Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nama_bidang">Nama Bidang</Label>
              <Input id="nama_bidang" name="nama_bidang" defaultValue={editingBidang?.nama_bidang} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea id="deskripsi" name="deskripsi" defaultValue={editingBidang?.deskripsi} />
            </div>
            <DialogFooter>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
