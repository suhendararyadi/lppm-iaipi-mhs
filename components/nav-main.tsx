"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type Icon, IconPlus, IconFileCheck, IconUserPlus } from "@tabler/icons-react"
import { pb } from '@/lib/pocketbase';
import * as React from 'react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Definisikan tipe untuk properti tombol
interface ActionButtonProps {
  href: string;
  tooltip: string;
  icon: Icon;
  text: string;
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const pathname = usePathname();
  const [actionButton, setActionButton] = React.useState<ActionButtonProps | null>(null);

  React.useEffect(() => {
    const updateUserRole = () => {
      const user = pb.authStore.model;
      switch (user?.role) {
        case 'mahasiswa':
          setActionButton({
            href: "/dashboard/mahasiswa/laporan/baru",
            tooltip: "Buat Laporan Baru",
            icon: IconPlus,
            text: "Buat Laporan"
          });
          break;
        case 'dpl':
          setActionButton({
            href: "/dashboard/dpl/laporan",
            tooltip: "Lihat Laporan Bimbingan",
            icon: IconFileCheck,
            text: "Verifikasi Laporan"
          });
          break;
        case 'lppm':
           setActionButton({
            href: "/dashboard/lppm/users",
            tooltip: "Buka Manajemen Pengguna",
            icon: IconUserPlus,
            text: "Tambah Pengguna"
          });
          break;
        default:
          setActionButton(null);
          break;
      }
    };
    
    const unsubscribe = pb.authStore.onChange(updateUserRole, true);
    return () => unsubscribe();
  }, []);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Tombol utama yang sekarang kontekstual */}
        {actionButton && (
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href={actionButton.href} className="w-full">
                <SidebarMenuButton
                  tooltip={actionButton.tooltip}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                >
                  <actionButton.icon className="h-5 w-5" />
                  <span>{actionButton.text}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        {/* Menu navigasi utama */}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.url}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  isActive={pathname === item.url}
                >
                  <div>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
