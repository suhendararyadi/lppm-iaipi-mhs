"use client"

import * as React from "react"
import {
  IconLayoutDashboard,
  IconFileText,
  IconUsers,
  IconSettings,
  IconHelp,
  IconBuildingCommunity,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Data menu telah disesuaikan untuk peran Mahasiswa
const dataMahasiswa = {
  navMain: [
    {
      title: "Dasbor",
      url: "/dashboard/mahasiswa",
      icon: IconLayoutDashboard,
    },
    {
      title: "Laporan Saya",
      url: "#", // URL akan kita sesuaikan nanti
      icon: IconFileText,
    },
    {
      title: "Anggota Kelompok",
      url: "/dashboard/mahasiswa", // Mengarah ke halaman yang sama untuk saat ini
      icon: IconUsers,
    },
  ],
  navSecondary: [
    {
      title: "Pengaturan",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Bantuan",
      url: "#",
      icon: IconHelp,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconBuildingCommunity className="!size-5" />
                <span className="text-base font-semibold">LPPM IAI Persis</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Menggunakan data menu yang baru */}
        <NavMain items={dataMahasiswa.navMain} />
        <NavSecondary items={dataMahasiswa.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
