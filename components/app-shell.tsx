'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Fingerprint,
  LayoutDashboard,
  Camera,
  Clock,
  FileText,
  History,
  Users,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const employeeNav = [
  { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/dashboard/absen', label: 'Absen', icon: Camera },
  { href: '/dashboard/lembur', label: 'Lembur', icon: Clock },
  { href: '/dashboard/izin', label: 'Izin / Sakit', icon: FileText },
  { href: '/dashboard/riwayat', label: 'Riwayat', icon: History },
];

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/rekap', label: 'Rekap Absensi', icon: History },
  { href: '/admin/lembur', label: 'Pengajuan Lembur', icon: Clock },
  { href: '/admin/izin', label: 'Pengajuan Izin', icon: FileText },
  { href: '/admin/karyawan', label: 'Kelola Karyawan', icon: Users },
];

export function AppShell({ children, role }: { children: ReactNode; role: 'employee' | 'admin' }) {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = role === 'admin' ? adminNav : employeeNav;

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const initials = (profile?.full_name ?? '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 glass border-b border-border/60">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href={role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center">
              <Fingerprint className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">VisitigaMedia</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-border/60">
          <div className="w-9 h-9 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-primary/30">
            <Fingerprint className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-sm">VisitigaMedia</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              {role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : null}
              {role === 'admin' ? 'Admin Panel' : 'Absensi Karyawan'}
            </p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'gradient-orange text-white shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="gradient-orange text-white text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full mt-2 justify-start text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Keluar
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 top-14 bottom-0 w-72 bg-card border-l border-border/60 p-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-1">
              {nav.map((item) => {
                const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      active ? 'gradient-orange text-white' : 'text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6 pt-4 border-t border-border/60">
              <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="gradient-orange text-white text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-muted-foreground">
                <LogOut className="w-4 h-4 mr-2" /> Keluar
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="hidden lg:flex items-center justify-end gap-2 h-16 px-6 border-b border-border/60 sticky top-0 z-30 glass">
          <ThemeToggle />
        </div>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
