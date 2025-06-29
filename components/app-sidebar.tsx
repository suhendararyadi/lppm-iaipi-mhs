"use client"

import * as React from "react"
import { pb } from "@/lib/pocketbase";
import {
  IconLayoutDashboard, IconFileText, IconUsers, IconSettings, IconHelp,
  IconBuildingCommunity, IconFileCheck, IconHistory, IconBooks, IconUsersGroup, IconPrinter, IconSchool,
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
  ],
  navSecondary: [
    { title: "Pengaturan", url: "#", icon: IconSettings },
    { title: "Bantuan", url: "#", icon: IconHelp },
  ],
};

// Data menu untuk DPL
const dataDpl = {
  navMain: [
    { title: "Dasbor", url: "/dashboard/dpl", icon: IconLayoutDashboard },
    { title: "Verifikasi Laporan", url: "/dashboard/dpl/laporan", icon: IconFileCheck },
    { title: "Riwayat Verifikasi", url: "#", icon: IconHistory },
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
    { title: "Manajemen Pengguna", url: "/dashboard/lppm/users", icon: IconUsers },
    { title: "Manajemen Kelompok", url: "/dashboard/lppm/kelompok", icon: IconUsersGroup },
    { title: "Bidang Penelitian", url: "/dashboard/lppm/bidang", icon: IconBooks },
    { title: "Manajemen Prodi", url: "/dashboard/lppm/prodi", icon: IconSchool },
    { title: "Cetak Laporan", url: "/dashboard/lppm/cetak", icon: IconPrinter },
  ],
  navSecondary: [
    { title: "Pengaturan", url: "#", icon: IconSettings },
    { title: "Bantuan", url: "#", icon: IconHelp },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Inisialisasi state dengan fungsi untuk mendapatkan nilai awal
  const [menuData, setMenuData] = React.useState(() => {
    const user = pb.authStore.model;
    if (user?.role === 'dpl') return dataDpl;
    if (user?.role === 'lppm') return dataLppm;
    return dataMahasiswa;
  });

  // Diperbaiki: Menggunakan listener untuk bereaksi terhadap perubahan login/logout
  React.useEffect(() => {
    // Fungsi ini akan dipanggil setiap kali ada perubahan pada authStore
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

    // Berlangganan pada perubahan authStore.
    // Argumen kedua (true) membuatnya langsung berjalan saat pertama kali dipanggil.
    const unsubscribe = pb.authStore.onChange(updateMenu, true);

    // Fungsi cleanup untuk berhenti berlangganan saat komponen di-unmount
    return () => {
      unsubscribe();
    };
  }, []); // Dependency array kosong sudah benar karena kita hanya ingin mengatur listener sekali.

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
