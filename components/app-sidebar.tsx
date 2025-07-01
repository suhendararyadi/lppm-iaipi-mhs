"use client"

import * as React from "react"
import { pb } from "@/lib/pocketbase";
import {
  IconLayoutDashboard, IconFileText, IconUsers, IconSettings, IconHelp,
  IconBuildingCommunity, IconFileCheck, IconBooks, IconUsersGroup, IconPrinter, IconSchool, IconChartBar,
  IconAward,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar"

// Data menu untuk Mahasiswa
const dataMahasiswa = {
  navMain: [
    { title: "Dasbor", url: "/dashboard/mahasiswa", icon: IconLayoutDashboard },
    { title: "Laporan Saya", url: "/dashboard/mahasiswa/laporan", icon: IconFileText },
    { title: "Anggota Kelompok", url: "/dashboard/mahasiswa/anggota", icon: IconUsers },
    { title: "Nilai Akhir", url: "/dashboard/mahasiswa/nilai", icon: IconAward },
  ],
  navSecondary: [
    { title: "Pengaturan", url: "#", icon: IconSettings },
    { title: "Bantuan", url: "#", icon: IconHelp },
  ],
};

// REVISI: Memperbarui URL untuk Riwayat Verifikasi
const dataDpl = {
  navMain: [
    { title: "Dasbor", url: "/dashboard/dpl", icon: IconLayoutDashboard },
    { title: "Verifikasi Laporan", url: "/dashboard/dpl/laporan", icon: IconFileCheck },
    { title: "Penilaian Mahasiswa", url: "/dashboard/dpl/penilaian", icon: IconAward },
    //{ title: "Riwayat Verifikasi", url: "/dashboard/dpl/riwayat", icon: IconHistory }, 
  ],
  navSecondary: [
    { title: "Pengaturan", url: "#", icon: IconSettings },
    { title: "Bantuan", url: "#", icon: IconHelp },
  ],
};

// Data menu untuk LPPM
const dataLppm = {
  navMain: [
    { title: "Dasbor", url: "/dashboard/lppm", icon: IconLayoutDashboard },
    { title: "Statistik", url: "/dashboard/lppm/statistik", icon: IconChartBar },
    { title: "Manajemen Pengguna", url: "/dashboard/lppm/users", icon: IconUsers },
    { title: "Manajemen Kelompok", url: "/dashboard/lppm/kelompok", icon: IconUsersGroup },
    { title: "Manajemen Prodi", url: "/dashboard/lppm/prodi", icon: IconSchool },
    { title: "Bidang Penelitian", url: "/dashboard/lppm/bidang", icon: IconBooks },
    { title: "Cetak Laporan", url: "/dashboard/lppm/cetak", icon: IconPrinter },
    { title: "Cetak Nilai", url: "/dashboard/lppm/nilai", icon: IconAward },
  ],
  navSecondary: [
    { title: "Pengaturan", url: "#", icon: IconSettings },
    { title: "Bantuan", url: "#", icon: IconHelp },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [menuData, setMenuData] = React.useState(dataMahasiswa); // Default

  React.useEffect(() => {
    const updateMenu = () => {
      const user = pb.authStore.model;
      if (user?.role === 'dpl') {
        setMenuData(dataDpl);
      } else if (user?.role === 'lppm') {
        setMenuData(dataLppm);
      } else {
        setMenuData(dataMahasiswa);
      }
    };
    const unsubscribe = pb.authStore.onChange(updateMenu, true);
    return () => unsubscribe();
  }, []);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/dashboard">
                <IconBuildingCommunity className="!size-5" />
                <span className="text-base font-semibold">LPPM IAI Persis</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menuData.navMain} />
        <NavSecondary items={menuData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
