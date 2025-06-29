"use client";

import { useState, useEffect, FormEvent } from 'react';
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
  onFormSubmit: () => void;
  user?: RecordModel | null;
}

// Diperbaiki: Menambahkan interface untuk payload data pengguna
interface UserPayload {
  nama_lengkap: string;
  email: string;
  role: string;
  password?: string;
  passwordConfirm?: string;
}

export function UserFormDialog({ isOpen, onOpenChange, onFormSubmit, user }: UserFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dplList, setDplList] = useState<RecordModel[]>([]);
  const [selectedRole, setSelectedRole] = useState(user?.role || '');
  const [selectedDpl, setSelectedDpl] = useState('');
  const isEditMode = !!user;

  useEffect(() => {
    if (isOpen) {
      const fetchDpls = async () => {
        try {
          const dpls = await pb.collection('users').getFullList({ filter: 'role = "dpl"' });
          setDplList(dpls);
        } catch (error) {
          console.error("Gagal memuat daftar DPL:", error);
          toast.error("Gagal memuat daftar DPL.");
        }
      };
      
      fetchDpls();
      setSelectedRole(user?.role || '');
      setSelectedDpl('');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.currentTarget;
    const nama_lengkap = (form.elements.namedItem('nama_lengkap') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const passwordConfirm = (form.elements.namedItem('passwordConfirm') as HTMLInputElement).value;

    // Diperbaiki: Menggunakan interface UserPayload untuk tipe yang kuat
    const userData: UserPayload = {
        nama_lengkap,
        email,
        role: selectedRole,
    };

    if (!isEditMode || password) {
        if (password !== passwordConfirm) {
            toast.error("Password dan konfirmasi password tidak cocok.");
            setIsLoading(false);
            return;
        }
        userData.password = password;
        userData.passwordConfirm = passwordConfirm;
    }

    try {
      if (isEditMode) {
        await pb.collection('users').update(user.id, userData);
        toast.success("Data pengguna berhasil diperbarui.");
      } else {
        const newUserRecord = await pb.collection('users').create(userData);
        toast.success("Pengguna baru berhasil ditambahkan.");

        if (newUserRecord && newUserRecord.role === 'mahasiswa') {
            if (!selectedDpl) {
                toast.error("Silakan pilih DPL untuk mahasiswa.");
                await pb.collection('users').delete(newUserRecord.id); // Rollback
                setIsLoading(false);
                return;
            }
            
            await pb.collection('kelompok_mahasiswa').create({
                ketua: newUserRecord.id,
                dpl: selectedDpl,
                anggota: [],
            });
            toast.info(`Kelompok untuk ${newUserRecord.nama_lengkap} telah dibuat & DPL ditugaskan.`);
        }
      }
      onFormSubmit();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Form submission error:", error);
      if (error instanceof ClientResponseError) {
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
            <Select name="role" defaultValue={user?.role} onValueChange={setSelectedRole} required>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih peran..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                    <SelectItem value="dpl">DPL</SelectItem>
                </SelectContent>
            </Select>
          </div>
          {selectedRole === 'mahasiswa' && !isEditMode && (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dpl" className="text-right">DPL</Label>
                <Select name="dpl" onValueChange={setSelectedDpl} required>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Pilih DPL Pembimbing..." />
                    </SelectTrigger>
                    <SelectContent>
                        {dplList.map(dpl => (
                            <SelectItem key={dpl.id} value={dpl.id}>{dpl.nama_lengkap}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          )}
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
