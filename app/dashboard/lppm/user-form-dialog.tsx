"use client";

import { useState, FormEvent } from 'react'; // Diperbaiki: Menghapus useEffect
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFormSubmit: () => void; // Untuk merefresh data di halaman utama
  user?: RecordModel | null; // Data pengguna jika dalam mode edit
}

export function UserFormDialog({ isOpen, onOpenChange, onFormSubmit, user }: UserFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!user;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    // Validasi password jika bukan mode edit atau jika password diisi
    if (!isEditMode || data.password) {
        if (data.password !== data.passwordConfirm) {
            toast.error("Password dan konfirmasi password tidak cocok.");
            setIsLoading(false);
            return;
        }
    } else {
        // Hapus field password jika kosong di mode edit
        delete data.password;
        delete data.passwordConfirm;
    }

    try {
      if (isEditMode) {
        await pb.collection('users').update(user.id, data);
        toast.success("Data pengguna berhasil diperbarui.");
      } else {
        await pb.collection('users').create(data);
        toast.success("Pengguna baru berhasil ditambahkan.");
      }
      onFormSubmit(); // Panggil fungsi untuk merefresh tabel
      onOpenChange(false); // Tutup dialog
    } catch (error: unknown) { // Diperbaiki: Menggunakan 'unknown' untuk tipe error
      console.error("Form submission error:", error);
      if (error instanceof ClientResponseError) {
        // Menampilkan pesan error yang lebih spesifik dari PocketBase
        toast.error(error.response.message || "Gagal menyimpan data pengguna.");
      } else {
        toast.error("Terjadi kesalahan yang tidak diketahui.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Perbarui detail pengguna di bawah ini.' : 'Isi formulir untuk membuat akun baru.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nama_lengkap" className="text-right">Nama</Label>
            <Input id="nama_lengkap" name="nama_lengkap" defaultValue={user?.nama_lengkap} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={user?.email} className="col-span-3" required />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Peran</Label>
            <Select name="role" defaultValue={user?.role} required>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih peran..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                    <SelectItem value="dpl">DPL</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">Password</Label>
            <Input id="password" name="password" type="password" className="col-span-3" placeholder={isEditMode ? 'Kosongkan jika tidak diubah' : ''} required={!isEditMode} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="passwordConfirm" className="text-right">Konfirmasi</Label>
            <Input id="passwordConfirm" name="passwordConfirm" type="password" className="col-span-3" placeholder={isEditMode ? 'Kosongkan jika tidak diubah' : ''} required={!isEditMode} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
