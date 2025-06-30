"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookCheck, FileUp, ShieldCheck } from 'lucide-react';

// Komponen untuk Header
const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
    <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2">
        <BookCheck className="h-8 w-8 text-primary" />
        <span className="font-bold text-lg">LPPM IAI Persis</span>
      </Link>
      <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
        <Link href="#fitur" className="hover:text-primary transition-colors">Fitur</Link>
        <Link href="#tentang" className="hover:text-primary transition-colors">Tentang</Link>
        <Link href="#kontak" className="hover:text-primary transition-colors">Kontak</Link>
      </nav>
      <Link href="/login">
        <Button>Masuk</Button>
      </Link>
    </div>
  </header>
);

// Komponen untuk Hero Section
const HeroSection = () => (
  <section className="w-full pt-24 md:pt-32 pb-12 md:pb-24">
    <div className="container mx-auto px-4 md:px-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col justify-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
              Digitalisasi Laporan Penelitian Mahasiswa
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Platform terpusat untuk memudahkan mahasiswa dalam melaporkan, DPL dalam memverifikasi, dan LPPM dalam mengelola seluruh data penelitian.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Link href="/login">
              <Button size="lg" className="w-full min-[400px]:w-auto">
                Mulai Pelaporan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        {/* Diperbarui: Mengganti gambar dengan ilustrasi SVG */}
        <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md">
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:bg-green-800"></div>
                <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 dark:bg-sky-800"></div>
                <div className="relative p-4 bg-background/60 backdrop-blur-md rounded-xl border">
                    <div className="p-6 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-semibold text-muted-foreground">Dasbor Anda</span>
                            <div className="flex space-x-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center"><FileUp className="w-5 h-5 text-primary" /></div>
                                <div className="flex-1 space-y-1">
                                    <div className="w-3/4 h-3 bg-muted-foreground/20 rounded-md"></div>
                                    <div className="w-1/2 h-2 bg-muted-foreground/10 rounded-md"></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center"><BookCheck className="w-5 h-5 text-primary" /></div>
                                <div className="flex-1 space-y-1">
                                    <div className="w-4/5 h-3 bg-muted-foreground/20 rounded-md"></div>
                                    <div className="w-2/3 h-2 bg-muted-foreground/10 rounded-md"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  </section>
);

// Komponen untuk Fitur
const FeatureSection = () => (
  <section id="fitur" className="w-full py-12 md:py-24 bg-muted">
    <div className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="space-y-2">
          <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Fitur Utama</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Sistem yang Terintegrasi & Efisien</h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Dirancang untuk menyederhanakan setiap langkah dalam siklus pelaporan penelitian.
          </p>
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
        <div className="grid gap-1 text-center">
            <FileUp className="h-10 w-10 mx-auto text-primary" />
            <h3 className="text-lg font-bold">Pelaporan Mudah</h3>
            <p className="text-sm text-muted-foreground">Mahasiswa dapat dengan cepat mengisi dan mengunggah dokumen laporan melalui formulir yang intuitif.</p>
        </div>
        <div className="grid gap-1 text-center">
            <BookCheck className="h-10 w-10 mx-auto text-primary" />
            <h3 className="text-lg font-bold">Verifikasi Terpusat</h3>
            <p className="text-sm text-muted-foreground">DPL dapat memberikan feedback dan menyetujui laporan dari mahasiswa bimbingannya dalam satu platform.</p>
        </div>
        <div className="grid gap-1 text-center">
            <ShieldCheck className="h-10 w-10 mx-auto text-primary" />
            <h3 className="text-lg font-bold">Manajemen oleh LPPM</h3>
            <p className="text-sm text-muted-foreground">LPPM memiliki kontrol penuh untuk mengelola pengguna, bidang penelitian, dan melihat rekapitulasi data.</p>
        </div>
      </div>
    </div>
  </section>
);

// Komponen untuk Footer
const Footer = () => (
    <footer id="kontak" className="w-full py-6 md:py-12 border-t">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} LPPM IAI Persis. Hak Cipta Dilindungi.</p>
            <nav className="flex gap-4 sm:gap-6">
                <Link href="#" className="text-xs hover:underline underline-offset-4">Persyaratan Layanan</Link>
                <Link href="#" className="text-xs hover:underline underline-offset-4">Kebijakan Privasi</Link>
            </nav>
        </div>
    </footer>
);


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeatureSection />
      </main>
      <Footer />
    </div>
  );
}
