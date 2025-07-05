"use client";

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { pb } from '@/lib/pocketbase';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { IconFileImport, IconDownload, IconLoader2 } from '@tabler/icons-react';
import { Label } from '@/components/ui/label';

interface UserImportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImportSuccess: () => void;
}

// Tipe data fleksibel untuk mengakomodasi kedua peran
interface UserData {
  nama_lengkap: string;
  email: string;
  password_default: string;
  nim?: string;
  prodi?: string;
  dpl_email?: string;
}

export function UserImportDialog({ isOpen, onOpenChange, onImportSuccess }: UserImportDialogProps) {
  const [data, setData] = useState<UserData[]>([]);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importRole, setImportRole] = useState<'mahasiswa' | 'dpl'>('mahasiswa'); // State untuk memilih peran
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<UserData>(worksheet);
        
        // Validasi kolom berdasarkan peran yang dipilih
        if (jsonData.length > 0) {
            const requiredColumns = importRole === 'mahasiswa'
              ? ['nama_lengkap', 'email', 'nim', 'password_default', 'prodi', 'dpl_email']
              : ['nama_lengkap', 'email', 'password_default'];
              
            const firstRow = jsonData[0];
            const hasAllColumns = requiredColumns.every(col => col in firstRow);
            if (!hasAllColumns) {
                toast.error(`Format file tidak sesuai untuk peran "${importRole}". Pastikan semua kolom yang diperlukan ada.`);
                return;
            }
        }
        setData(jsonData);
      } catch (error) {
        toast.error("Gagal membaca file. Pastikan formatnya benar.");
        console.error("File read error:", error);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    let templateData: UserData[];
    let fileName: string;

    if (importRole === 'mahasiswa') {
        templateData = [{ nama_lengkap: "Contoh Nama Mahasiswa", email: "mahasiswa@email.com", nim: "12345678", password_default: "password123", prodi: "Pendidikan Agama Islam", dpl_email: "dpl@email.com" }];
        fileName = "template_import_mahasiswa.xlsx";
    } else { // DPL
        templateData = [{ nama_lengkap: "Contoh Nama DPL", email: "dpl@email.com", password_default: "password123" }];
        fileName = "template_import_dpl.xlsx";
    }

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, fileName);
  };

  const handleImport = async () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diimpor.");
      return;
    }
    setIsLoading(true);
    toast.loading(`Mengimpor ${data.length} pengguna sebagai ${importRole}...`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Logika impor utama
    for (const user of data) {
      try {
        if (importRole === 'mahasiswa') {
          // Logika untuk impor mahasiswa (yang sudah ada)
          const prodiList = await pb.collection('program_studi').getFullList();
          const dplList = await pb.collection('users').getFullList({ filter: 'role = "dpl"' });
          const prodiMap = new Map(prodiList.map(p => [p.nama_prodi.toLowerCase(), p.id]));
          const dplMap = new Map(dplList.map(d => [d.email, d.id]));

          const prodiId = prodiMap.get(user.prodi!.toLowerCase());
          const dplId = dplMap.get(user.dpl_email!);

          if (!prodiId) throw new Error(`Prodi "${user.prodi}" tidak ditemukan.`);
          if (!dplId) throw new Error(`DPL dengan email "${user.dpl_email}" tidak ditemukan.`);

          const newUser = await pb.collection('users').create({
            nama_lengkap: user.nama_lengkap, email: user.email, nim: user.nim,
            password: user.password_default, passwordConfirm: user.password_default,
            role: 'mahasiswa', prodi: prodiId,
          });
          await pb.collection('kelompok_mahasiswa').create({ ketua: newUser.id, dpl: dplId, anggota: [] });

        } else { // Logika untuk impor DPL
          await pb.collection('users').create({
            nama_lengkap: user.nama_lengkap,
            email: user.email,
            password: user.password_default,
            passwordConfirm: user.password_default,
            role: 'dpl',
          });
        }
        successCount++;
      } catch (err: unknown) {
        errorCount++;
        let errorMessage = `Gagal mengimpor ${user.email}.`;
        if (err instanceof Error) { errorMessage = err.message; }
        errors.push(errorMessage);
        console.error(`Import failed for ${user.email}:`, err);
      }
    }

    toast.dismiss();
    if (errorCount > 0) {
      toast.warning(`${successCount} pengguna berhasil diimpor, ${errorCount} gagal.`, {
        description: `Error: ${errors.slice(0, 2).join(', ')}...`,
      });
    } else {
      toast.success("Semua pengguna berhasil diimpor!");
    }
    
    onImportSuccess();
    onOpenChange(false);
    setData([]);
    setFileName('');
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Impor Pengguna dari Excel</DialogTitle>
          <DialogDescription>
            Pilih peran, lalu unggah file .xlsx untuk menambahkan pengguna. Pastikan format file sesuai dengan template yang diunduh.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div className="grid gap-1.5">
              <Label htmlFor="role-import">Pilih Peran untuk Diimpor</Label>
              <Select value={importRole} onValueChange={(value) => setImportRole(value as 'mahasiswa' | 'dpl')}>
                <SelectTrigger id="role-import">
                  <SelectValue placeholder="Pilih peran..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                  <SelectItem value="dpl">DPL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
                <IconFileImport className="mr-2 h-4 w-4" /> Pilih File
                </Button>
                {fileName && <span className="text-sm text-muted-foreground truncate">{fileName}</span>}
            </div>
             <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
                <IconDownload className="mr-2 h-4 w-4" /> Unduh Template
                </Button>
            </div>
          </div>
          <Input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />

          {data.length > 0 && (
            <div className="mt-2 max-h-64 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Email</TableHead>
                    {importRole === 'mahasiswa' && <TableHead>NIM</TableHead>}
                    {importRole === 'mahasiswa' && <TableHead>Prodi</TableHead>}
                    {importRole === 'mahasiswa' && <TableHead>Email DPL</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.nama_lengkap}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      {importRole === 'mahasiswa' && <TableCell>{row.nim}</TableCell>}
                      {importRole === 'mahasiswa' && <TableCell>{row.prodi}</TableCell>}
                      {importRole === 'mahasiswa' && <TableCell>{row.dpl_email}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={isLoading || data.length === 0}>
            {isLoading ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconFileImport className="mr-2 h-4 w-4" />}
            {isLoading ? 'Mengimpor...' : `Impor ${data.length} Pengguna`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
