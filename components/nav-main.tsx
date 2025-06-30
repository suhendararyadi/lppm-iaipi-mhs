"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type Icon, IconPlus } from "@tabler/icons-react" // Menambahkan IconPlus

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

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

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Diperbarui: Mengubah Quick Create menjadi Buat Laporan */}
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard/mahasiswa/laporan/baru" className="w-full">
              <SidebarMenuButton
                tooltip="Buat Laporan Baru"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <IconPlus className="h-5 w-5" />
                <span>Buat Laporan</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>

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
