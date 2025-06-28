"use client";

import { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation'; // Dihapus karena tidak digunakan
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IconUsers, IconUserPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { toast } from "sonner";
// Kita akan membuat komponen ini nanti
// import { UserFormDialog } from './user-form-dialog'; 

interface User extends RecordModel {
    nama_lengkap: string;
    email: string;
    role: 'mahasiswa' | 'dpl' | 'lppm';
}

export default function LppmUserManagementPage() {
  // const router = useRouter(); // Dihapus karena tidak digunakan
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const userList = await pb.collection('users').getFullList<User>({
          sort: '-created',
          signal,
      });
      setUsers(userList);
    } catch (error) {
      if (!(error instanceof ClientResponseError && error.isAbort)) {
        console.error("Gagal memuat data pengguna:", error);
        toast.error("Gagal memuat data pengguna.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, [fetchUsers]);

  const handleDelete = (userId: string, userName: string) => {
    toast.error(`Apakah Anda yakin ingin menghapus pengguna "${userName}"?`, {
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await pb.collection('users').delete(userId);
            toast.success("Pengguna berhasil dihapus.");
            fetchUsers();
          } catch (error) {
            // Diperbaiki: Menambahkan console.error untuk menggunakan variabel 'error'
            console.error("Gagal menghapus pengguna:", error);
            toast.error("Gagal menghapus pengguna.");
          }
        },
      },
      // Diperbaiki: Menambahkan onClick handler kosong untuk memenuhi tipe data
      cancel: { label: "Batal", onClick: () => {} },
    });
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><IconUsers />Manajemen Pengguna</CardTitle>
            <CardDescription>Tambah, edit, atau hapus data pengguna Mahasiswa dan DPL.</CardDescription>
          </div>
          {/* Tombol Tambah Pengguna akan kita fungsikan nanti */}
          <Button><IconUserPlus className="mr-2 h-4 w-4" /> Tambah Pengguna</Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Peran (Role)</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Memuat data pengguna...</TableCell></TableRow>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nama_lengkap}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><Badge variant={user.role === 'dpl' ? 'secondary' : 'outline'}>{user.role}</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon"><IconEdit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(user.id, user.nama_lengkap)}><IconTrash className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">Tidak ada data pengguna.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
