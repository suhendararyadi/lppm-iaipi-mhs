"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';

export default function DashboardRedirector() {
  const router = useRouter();

  useEffect(() => {
    // Pastikan model pengguna tersedia
    const user = pb.authStore.model;

    if (user) {
      // Arahkan berdasarkan peran pengguna
      switch (user.role) {
        case 'mahasiswa':
          router.replace('/dashboard/mahasiswa');
          break;
        case 'dpl':
          router.replace('/dashboard/dpl');
          break;
        case 'lppm':
          router.replace('/dashboard/lppm');
          break;
        default:
          // Jika peran tidak dikenali, arahkan ke halaman login
          pb.authStore.clear();
          router.replace('/login');
      }
    } else {
        // Jika tidak ada user yang login, kembali ke halaman login
        router.replace('/login');
    }
  }, [router]);

  // Tampilkan pesan loading selama proses pengalihan
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
      <p>Mengarahkan...</p>
    </div>
  );
}
