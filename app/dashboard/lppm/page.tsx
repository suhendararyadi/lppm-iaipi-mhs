"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pb } from '@/lib/pocketbase';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconArrowRight, IconUsers, IconUsersGroup, IconBooks, IconPrinter, IconChartBar } from '@tabler/icons-react';

export default function LppmWelcomePage() {
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    const user = pb.authStore.model;
    if (user) {
      setAdminName(user.nama_lengkap || 'Admin');
    }
  }, []);

  const menuItems = [
    { title: "Statistik & Analitik", href: "/dashboard/lppm/statistik", icon: IconChartBar },
    { title: "Manajemen Pengguna", href: "/dashboard/lppm/users", icon: IconUsers },
    { title: "Manajemen Kelompok", href: "/dashboard/lppm/kelompok", icon: IconUsersGroup },
    { title: "Manajemen Prodi", href: "/dashboard/lppm/prodi", icon: IconSchool },
    { title: "Bidang Penelitian", href: "/dashboard/lppm/bidang", icon: IconBooks },
    { title: "Cetak Laporan", href: "/dashboard/lppm/cetak", icon: IconPrinter },
  ];

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">Selamat Datang, {adminName}!</h1>
        <p className="text-muted-foreground">Anda berada di pusat kendali LPPM. Pilih menu di samping atau gunakan akses cepat di bawah ini untuk memulai.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Card key={item.href} className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <item.icon className="h-5 w-5 text-primary" />
                {item.title}
              </CardTitle>
              <Link href={item.href}>
                <Button variant="ghost" size="icon">
                  <IconArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
          </Card>
        ))}
      </div>
    </main>
  );
}
