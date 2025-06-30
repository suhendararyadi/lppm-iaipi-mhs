import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner"

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // Diperbarui: Mengganti "Penelitian" menjadi "Pengabdian"
  title: "LPPM IAI Persis - Laporan Pengabdian Mahasiswa",
  description: "Aplikasi untuk manajemen dan pelaporan kegiatan pengabdian mahasiswa di LPPM IAI Persis Garut.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
