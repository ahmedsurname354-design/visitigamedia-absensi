'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { AppShell } from '@/components/app-shell';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (profile) {
        // Jika profile adalah admin/owner, lempar ke /admin
        if (profile.role === 'admin' || profile.role === 'owner') {
          router.replace('/admin');
        }
      }
    }
  }, [loading, user, profile, router]);

  // Tampilkan loading HANYA saat state loading utama masih aktif
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Jika tidak ada user atau role adalah admin/owner, tahan render sampai proses replace selesai
  if (!user || (profile && (profile.role === 'admin' || profile.role === 'owner'))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return <AppShell role="employee">{children}</AppShell>;
}