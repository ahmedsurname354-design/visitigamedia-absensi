'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Clock, FileText, History, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/supabase/helpers';
import type { Attendance } from '@/lib/supabase/types';

export default function EmployeeHome() {
  const { profile } = useAuth();
  const [today, setToday] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    supabase
      .from('attendance')
      .select('*')
      .eq('user_id', profile.id)
      .gte('recorded_at', start.toISOString())
      .lte('recorded_at', end.toISOString())
      .order('recorded_at', { ascending: true })
      .then(({ data }) => {
        setToday((data ?? []) as Attendance[]);
        setLoading(false);
      });
  }, [profile]);

  const checkIn = today.find((a) => a.type === 'check_in');
  const checkOut = today.find((a) => a.type === 'check_out');

  const quickActions = [
    { href: '/dashboard/absen', label: 'Absen', desc: 'Masuk / Pulang', icon: Camera },
    { href: '/dashboard/lembur', label: 'Lembur', desc: 'Ajukan lembur', icon: Clock },
    { href: '/dashboard/izin', label: 'Izin / Sakit', desc: 'Ajukan izin', icon: FileText },
    { href: '/dashboard/riwayat', label: 'Riwayat', desc: 'Lihat riwayat', icon: History },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Halo, {profile?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Today status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" /> Absen Masuk
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-32 rounded bg-muted animate-pulse" />
            ) : checkIn ? (
              <div>
                <p className="text-2xl font-bold text-success">
                  {new Date(checkIn.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {checkIn.city || checkIn.address || 'Lokasi tercatat'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum absen masuk hari ini</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" /> Absen Pulang
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-32 rounded bg-muted animate-pulse" />
            ) : checkOut ? (
              <div>
                <p className="text-2xl font-bold text-warning">
                  {new Date(checkOut.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {checkOut.city || checkOut.address || 'Lokasi tercatat'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum absen pulang hari ini</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="border-border/60 hover:border-primary/40 hover:shadow-md transition-all h-full">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-orange-soft flex items-center justify-center">
                  <a.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Today detail */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Aktivitas Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {today.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Belum ada aktivitas. Silakan absen di halaman Absen.
            </p>
          ) : (
            <div className="space-y-3">
              {today.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                  <div
                    className={`w-2 h-2 rounded-full ${a.type === 'check_in' ? 'bg-success' : 'bg-warning'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.type === 'check_in' ? 'Masuk' : 'Pulang'}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.address || a.city}</p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(a.recorded_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button asChild className="gradient-orange text-white border-0">
          <Link href="/dashboard/absen">Absen Sekarang</Link>
        </Button>
      </div>
    </div>
  );
}
