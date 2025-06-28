"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";

export default function DplLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Melindungi seluruh segmen layout ini untuk peran DPL
  useEffect(() => {
    const user = pb.authStore.model;
    if (!pb.authStore.isValid || user?.role !== 'dpl') {
      router.replace('/login');
    }
  }, [router]);

  if (!pb.authStore.isValid) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Memverifikasi sesi...</p>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
