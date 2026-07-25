"use client";

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { IconUsers, IconUserPlus, IconEdit, IconTrash, IconFileImport, IconDotsVertical, IconUserOff, IconUserCheck } from '@tabler/icons-react';
import { toast } from "sonner";
import { UserFormDialog } from '../user-form-dialog';
import { UserImportDialog } from '../user-import-dialog'; // REVISI: Impor komponen baru

interface User extends RecordModel {
    nama_lengkap: string;
    email: string;
    role: 'mahasiswa' | 'dpl' | 'lppm';
    status?: 'aktif' | 'nonaktif';
}

export default function LppmUserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false); // REVISI: State untuk dialog impor
  const [editingUser, setEditingUser] = useState<RecordModel | null>(null);

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

  const handleOpenFormDialog = (user: RecordModel | null = null) => {
    setEditingUser(user);
    setIsFormDialogOpen(true);
  };

  // Nonaktifkan adalah aksi default untuk akun yang sudah tidak dipakai — akun tidak bisa
  // login lagi, tapi relasi (ketua/DPL di laporan lama) tetap utuh selamanya. Ini mencegah
  // kolom "N/A" bermunculan di Manajemen Kelompok seperti yang terjadi saat akun di-hapus permanen.
  const handleToggleStatus = async (user: User) => {
    const statusBaru = user.status === 'nonaktif' ? 'aktif' : 'nonaktif';
    try {
      await pb.collection('users').update(user.id, { status: statusBaru });
      toast.success(statusBaru === 'nonaktif' ? "Pengguna dinonaktifkan." : "Pengguna diaktifkan kembali.");
      fetchUsers();
    } catch (error) {
      console.error("Gagal mengubah status pengguna:", error);
      toast.error("Gagal mengubah status pengguna.");
    }
  };

  const handleDelete = (userId: string, userName: string) => {
    toast.error(`Hapus permanen "${userName}"? Nama & email akan hilang dari riwayat kelompok/laporan lama. Pertimbangkan "Nonaktifkan" sebagai gantinya.`, {
      action: {
        label: "Hapus Permanen",
        onClick: async () => {
          try {
            await pb.collection('users').delete(userId);
            toast.success("Pengguna berhasil dihapus.");
            fetchUsers();
          } catch (error) {
            console.error("Gagal menghapus pengguna:", error);
            toast.error("Gagal menghapus pengguna.");
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
            <CardTitle className="flex items-center gap-2"><IconUsers />Manajemen Pengguna</CardTitle>
            <CardDescription>Tambah, edit, atau hapus data pengguna Mahasiswa dan DPL.</CardDescription>
          </div>
          <div className="flex gap-2">
            {/* REVISI: Tambahkan tombol impor */}
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <IconFileImport className="mr-2 h-4 w-4" /> Impor
            </Button>
            <Button onClick={() => handleOpenFormDialog()}>
              <IconUserPlus className="mr-2 h-4 w-4" /> Tambah Pengguna
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Peran (Role)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Memuat data pengguna...</TableCell></TableRow>
                ) : users.length > 0 ? (
                  users.map((user) => {
                    const isNonaktif = user.status === 'nonaktif';
                    return (
                    <TableRow key={user.id} className={isNonaktif ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">{user.nama_lengkap}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><Badge variant={user.role === 'dpl' ? 'secondary' : user.role === 'lppm' ? 'default' : 'outline'}>{user.role}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={isNonaktif ? 'destructive' : 'outline'}>{isNonaktif ? 'Nonaktif' : 'Aktif'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><IconDotsVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenFormDialog(user)}>
                              <IconEdit className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            {pb.authStore.model?.id !== user.id && (
                              <>
                                <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                  {isNonaktif ? (
                                    <><IconUserCheck className="h-4 w-4" /> Aktifkan</>
                                  ) : (
                                    <><IconUserOff className="h-4 w-4" /> Nonaktifkan</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={() => handleDelete(user.id, user.nama_lengkap)}>
                                  <IconTrash className="h-4 w-4" /> Hapus Permanen
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );})
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">Tidak ada data pengguna.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <UserFormDialog 
        isOpen={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        onFormSubmit={fetchUsers}
        user={editingUser}
      />

      {/* REVISI: Tambahkan dialog impor ke halaman */}
      <UserImportDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={fetchUsers}
      />
    </main>
  );
}
