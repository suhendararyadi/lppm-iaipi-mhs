"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { RecordModel } from 'pocketbase';
import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [user, setUser] = useState<RecordModel | null>(null);

  useEffect(() => {
    // Ambil data pengguna dari authStore saat komponen dimuat
    if (pb.authStore.isValid) {
      setUser(pb.authStore.model);
    }
  }, []);

  const handleLogout = () => {
    pb.authStore.clear(); // Hapus sesi dari PocketBase
    router.push('/login'); // Arahkan ke halaman login
  };

  if (!user) {
    // Tampilkan placeholder jika data pengguna belum termuat
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="animate-pulse">
                    <Avatar className="h-8 w-8 rounded-lg bg-muted"></Avatar>
                    <div className="grid flex-1 gap-2 text-left text-sm leading-tight">
                        <div className="h-4 w-24 rounded-md bg-muted"></div>
                        <div className="h-3 w-32 rounded-md bg-muted"></div>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar ? pb.getFileUrl(user, user.avatar) : ''} alt={user.nama_lengkap || 'Pengguna'} />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    {user.nama_lengkap?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.nama_lengkap || 'Pengguna'}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                   <AvatarImage src={user.avatar ? pb.getFileUrl(user, user.avatar) : ''} alt={user.nama_lengkap || 'Pengguna'} />
                   <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                       {user.nama_lengkap?.charAt(0).toUpperCase() || 'U'}
                   </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.nama_lengkap || 'Pengguna'}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* Menu dinonaktifkan untuk sementara */}
              <DropdownMenuItem disabled>
                <IconUserCircle />
                Profil Saya
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <IconCreditCard />
                Tagihan
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <IconNotification />
                Notifikasi
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Fungsi Logout */}
            <DropdownMenuItem onClick={handleLogout}>
              <IconLogout />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
