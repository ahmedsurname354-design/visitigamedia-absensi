'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Fingerprint,
  MapPin,
  Camera,
  Clock,
  FileText,
  ShieldCheck,
  Download,
  ArrowRight,
  Building2,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from 'next-themes';

const features = [
  {
    icon: Camera,
    title: 'Live Camera Selfie',
    desc: 'Absen langsung dengan kamera HP/webcam — bukan upload dari galeri. Mencegah kecurangan foto lama.',
  },
  {
    icon: MapPin,
    title: 'GPS & Reverse Geocoding',
    desc: 'Lokasi real-time dengan koordinat dan nama kota/alamat. Admin melihat titik di Google Maps.',
  },
  {
    icon: Clock,
    title: 'Lembur Terdokumentasi',
    desc: 'Pengajuan lembur dengan alasan, jam mulai/selesai, bukti foto kerja, dan GPS.',
  },
  {
    icon: FileText,
    title: 'Izin & Sakit + Surat',
    desc: 'Form izin/sakit dengan upload surat dokter ke Supabase Storage. Admin approve/reject.',
  },
  {
    icon: Download,
    title: 'Export Excel',
    desc: 'Rekap absensi seluruh karyawan atau per individu ke .xlsx dengan satu klik.',
  },
  {
    icon: ShieldCheck,
    title: 'Aman & Role-Based',
    desc: 'Supabase Auth + RLS. Karyawan hanya lihat data sendiri. Admin kelola semua karyawan.',
  },
];

export default function LandingPage() {
  const { user, profile, loading } = useAuth();
  const { theme, setTheme } = useTheme();

  const dashboardHref =
    profile?.role === 'admin' || profile?.role === 'owner' ? '/admin' : '/dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/30">
      <header className="sticky top-0 z-40 glass border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-primary/30">
              <Fingerprint className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-sm sm:text-base">VisitigaMedia</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Absensi Resmi</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {loading ? (
              <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
            ) : user ? (
              <Button asChild className="gradient-orange text-white border-0">
                <Link href={dashboardHref}>
                  Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/login">Masuk</Link>
                </Button>
                <Button asChild className="gradient-orange text-white border-0">
                  <Link href="/login">Masuk / Daftar</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-orange-soft" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary mb-6 animate-fade-in">
            <Building2 className="w-3.5 h-3.5" />
            Sistem Absensi Skala Perusahaan
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight animate-fade-in">
            Absensi Digital <span className="text-gradient-orange">VisitigaMedia</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in">
            Catat kehadiran karyawan di seluruh pulau dan kota dengan selfie live camera, verifikasi
            GPS, pengajuan lembur & izin, serta rekap admin yang bisa di-export ke Excel.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
            <Button asChild size="lg" className="gradient-orange text-white border-0 w-full sm:w-auto">
              <Link href="/login">
                Mulai Absen <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/login">Login Karyawan / Admin</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Card
              key={f.title}
              className="border-border/60 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <CardContent className="p-6">
                <div className="w-11 h-11 rounded-xl gradient-orange-soft flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 mt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} VisitigaMedia. Sistem Absensi Resmi.</p>
        </div>
      </footer>
    </div>
  );
}
