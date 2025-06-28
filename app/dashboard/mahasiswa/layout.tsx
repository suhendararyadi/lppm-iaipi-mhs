"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";

export default function MahasiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Melindungi seluruh segmen layout ini
  useEffect(() => {
    const user = pb.authStore.model;
    if (!pb.authStore.isValid || user?.role !== 'mahasiswa') {
      router.replace('/login');
    }
  }, [router]);

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {/* 'children' di sini akan merender halaman page.tsx yang aktif */}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
