"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowRight, ChevronDown, Goal, Mail, Phone, MapPin, Briefcase, BookUser, FileText, Users, Lightbulb, Share2 } from 'lucide-react';
import Image from 'next/image';

// Komponen Header
const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm shadow-sm">
    <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
      {/* REVISI: Logo dibuat lebih proporsional dan teks dihilangkan */}
      <Link href="/" className="flex items-center gap-3">
        <Image src="/logo_IAI_persis_garut.svg" alt="Logo IAI Persis Garut" width={70} height={70} />
        {/* <span className="font-bold text-lg whitespace-nowrap">LPPM IAI Persis Garut</span> */}
      </Link>
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link href="#tentang" className="text-muted-foreground hover:text-primary transition-colors">Tentang Kami</Link>
        <Link href="#visi-misi" className="text-muted-foreground hover:text-primary transition-colors">Visi & Misi</Link>
        <Link href="#aplikasi" className="text-muted-foreground hover:text-primary transition-colors">Aplikasi LPPM</Link>
        <Link href="#kontak" className="text-muted-foreground hover:text-primary transition-colors">Kontak</Link>
      </nav>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="hidden md:flex">
            Aplikasi LPPM <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/login">
              <BookUser className="mr-2 h-4 w-4" />
              <span>SI Pengabdian Mahasiswa</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="http://slp2m.lppm.iaipersisgarut.ac.id" target="_blank" rel="noopener noreferrer">
              <FileText className="mr-2 h-4 w-4" />
              <span>SI Laporan Penelitian Dosen</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
);

// Komponen Hero Section
const HeroSection = () => (
  <section className="w-full bg-slate-50 dark:bg-slate-900/50">
    <div className="container mx-auto px-4 md:px-6 pt-32 pb-20 text-center">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary">
        Lembaga Penelitian dan Pengabdian Masyarakat
      </h1>
      <h2 className="text-2xl font-semibold tracking-tighter sm:text-3xl md:text-4xl mt-2">
        Institut Agama Islam Persis Garut
      </h2>
      <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
        Mendorong inovasi melalui penelitian yang berkualitas dan memberikan dampak nyata bagi masyarakat melalui program pengabdian yang berkelanjutan.
      </p>
      <div className="mt-6">
        <Link href="#aplikasi">
          <Button size="lg">
            Jelajahi Aplikasi Kami <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

// REVISI: Komponen ilustrasi kustom
const LppmIllustration = () => (
    <div className="relative w-full max-w-md h-80 flex items-center justify-center">
        <div className="absolute top-0 left-1/4 w-48 h-48 bg-green-200 dark:bg-green-800/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-200 dark:bg-sky-800/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="relative w-full h-full flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="flex flex-col items-center justify-center p-6 bg-background/60 backdrop-blur-md rounded-xl border shadow-lg">
                    <Lightbulb className="h-12 w-12 text-primary"/>
                    <p className="mt-2 font-semibold">Penelitian</p>
                    <p className="text-xs text-muted-foreground">Inovasi & Karya Ilmiah</p>
                </div>
                 <div className="flex flex-col items-center justify-center p-6 bg-background/60 backdrop-blur-md rounded-xl border shadow-lg mt-12">
                    <Users className="h-12 w-12 text-primary"/>
                    <p className="mt-2 font-semibold">Pengabdian</p>
                     <p className="text-xs text-muted-foreground">Dampak untuk Masyarakat</p>
                </div>
                 <div className="flex flex-col items-center justify-center p-6 bg-background/60 backdrop-blur-md rounded-xl border shadow-lg">
                    <Share2 className="h-12 w-12 text-primary"/>
                    <p className="mt-2 font-semibold">Kolaborasi</p>
                     <p className="text-xs text-muted-foreground">Jaringan & Kerjasama</p>
                </div>
                 <div className="flex flex-col items-center justify-center p-6 bg-background/60 backdrop-blur-md rounded-xl border shadow-lg mt-12">
                    <FileText className="h-12 w-12 text-primary"/>
                    <p className="mt-2 font-semibold">Publikasi</p>
                     <p className="text-xs text-muted-foreground">Diseminasi Hasil</p>
                </div>
            </div>
        </div>
    </div>
);


// Komponen Tentang Kami
const AboutSection = () => (
    <section id="tentang" className="w-full py-12 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-10 md:grid-cols-2 items-center">
                <div className="space-y-4">
                    <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Tentang Kami</div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Profil LPPM IAI Persis Garut</h2>
                    <p className="text-muted-foreground text-justify">
                        Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) IAI Persis Garut merupakan unit kerja strategis di lingkungan Institut Agama Islam Persis Garut yang memiliki tanggung jawab dalam mengkoordinasikan, memfasilitasi, dan memantau pelaksanaan kegiatan penelitian dan pengabdian kepada masyarakat yang dilakukan oleh civitas academica.
                    </p>
                    <p className="text-muted-foreground text-justify">
                        Kami berkomitmen untuk menghasilkan penelitian yang inovatif dan relevan dengan kebutuhan zaman, serta menyelenggarakan program pengabdian yang memberdayakan dan memberikan solusi atas permasalahan di masyarakat, sejalan dengan nilai-nilai keislaman dan keindonesiaan.
                    </p>
                </div>
                 <div className="flex items-center justify-center">
                    {/* REVISI: Mengganti Image dengan komponen ilustrasi kustom */}
                    <LppmIllustration />
                </div>
            </div>
        </div>
    </section>
);

// Komponen Visi & Misi
const VisiMisiSection = () => (
    <section id="visi-misi" className="w-full py-12 md:py-24 bg-muted">
        <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-10 md:grid-cols-2">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary text-primary-foreground p-3 rounded-full">
                            <Goal className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-bold">Visi</h3>
                    </div>
                    <p className="text-muted-foreground">
                        Menjadi lembaga yang unggul dan terkemuka dalam pengembangan ilmu pengetahuan, teknologi, dan seni melalui kegiatan penelitian dan pengabdian kepada masyarakat yang berbasis pada nilai-nilai Islam dan kearifan lokal untuk kemaslahatan umat dan bangsa.
                    </p>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary text-primary-foreground p-3 rounded-full">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-bold">Misi</h3>
                    </div>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>Meningkatkan kualitas dan kuantitas penelitian dosen dan mahasiswa yang inovatif dan berdaya saing.</li>
                        <li>Menyelenggarakan program pengabdian kepada masyarakat yang efektif untuk pemberdayaan dan peningkatan kualitas hidup.</li>
                        <li>Mengembangkan jaringan kerjasama dengan berbagai pihak untuk mendukung kegiatan penelitian dan pengabdian.</li>
                        <li>Mempublikasikan hasil-hasil penelitian dan pengabdian kepada masyarakat melalui media ilmiah dan populer.</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>
);

// Komponen Aplikasi LPPM
const AplikasiSection = () => (
    <section id="aplikasi" className="w-full py-12 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Aplikasi Digital LPPM</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Kami menyediakan dua sistem informasi utama untuk mendukung digitalisasi proses penelitian dan pengabdian.
                    </p>
                </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-8 sm:grid-cols-2 md:gap-12 mt-12">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookUser /> SI Pengabdian Mahasiswa</CardTitle>
                        <CardDescription>Platform untuk mahasiswa melaporkan kegiatan pengabdian, diverifikasi oleh DPL, dan dikelola oleh LPPM.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">Sistem ini dirancang untuk mempermudah alur pelaporan dan penilaian kegiatan pengabdian mahasiswa.</p>
                    </CardContent>
                    <div className="p-6 pt-0">
                        <Link href="/login">
                            <Button className="w-full">Masuk ke Sistem <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </Link>
                    </div>
                </Card>
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText /> SI Laporan Penelitian Dosen</CardTitle>
                        <CardDescription>Sistem informasi untuk manajemen laporan penelitian, pengabdian, dan publikasi ilmiah oleh dosen.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">Akses platform khusus untuk dosen dalam melaporkan dan mengelola hasil Tridharma Perguruan Tinggi.</p>
                    </CardContent>
                    <div className="p-6 pt-0">
                        <a href="http://slp2m.lppm.iaipersisgarut.ac.id" target="_blank" rel="noopener noreferrer">
                            <Button className="w-full">Kunjungi SLP2M <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </a>
                    </div>
                </Card>
            </div>
        </div>
    </section>
);

// Komponen Kontak
const Footer = () => (
    <footer id="kontak" className="w-full bg-slate-900 text-slate-200">
        <div className="container mx-auto px-4 md:px-6 py-12 grid md:grid-cols-3 gap-8">
            <div>
                <h3 className="text-lg font-semibold text-white">LPPM IAI Persis Garut</h3>
                <p className="mt-2 text-sm text-slate-400">Lembaga Penelitian dan Pengabdian kepada Masyarakat, Institut Agama Islam Persis Garut.</p>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-white">Kontak Kami</h3>
                <ul className="mt-2 space-y-2 text-sm">
                    <li className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 mt-1 text-primary" />
                        <span className="text-slate-400">Jl. Aruji Kartawinata No.20, Sukagalih, Kec. Tarogong Kidul, Kabupaten Garut, Jawa Barat 44151</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <a href="mailto:lppm@iaipersis.ac.id" className="text-slate-400 hover:text-white">lppm@iaipersis.ac.id</a>
                    </li>
                     <li className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary" />
                        <span className="text-slate-400">(0262) 123-4567</span>
                    </li>
                </ul>
            </div>
             <div>
                <h3 className="text-lg font-semibold text-white">Tautan Terkait</h3>
                <ul className="mt-2 space-y-2 text-sm">
                    <li><a href="https://iaipersis.ac.id" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">Website IAI Persis Garut</a></li>
                    <li><a href="#" className="text-slate-400 hover:text-white">Jurnal Penelitian</a></li>
                    <li><a href="#" className="text-slate-400 hover:text-white">Panduan Pengabdian</a></li>
                </ul>
            </div>
        </div>
        <div className="border-t border-slate-800">
            <div className="container mx-auto px-4 md:px-6 py-4 text-center text-xs text-slate-500">
                &copy; {new Date().getFullYear()} LPPM IAI Persis Garut. All rights reserved.
            </div>
        </div>
    </footer>
);


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <VisiMisiSection />
        <AplikasiSection />
      </main>
      <Footer />
    </div>
  );
}
