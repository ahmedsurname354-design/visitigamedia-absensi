'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Clock, FileText, Camera, ArrowRight, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/supabase/helpers';
import type { Attendance, Profile } from '@/lib/supabase/types';

export default function AdminHome() {
  const [stats, setStats] = useState({ employees: 0, todayCheckIn: 0, pendingOvertime: 0, pendingLeaves: 0 });
  const [recent, setRecent] = useState<(Attendance & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    (async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [emp, att, ot, lv, recentAtt] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'check_in')
          .gte('recorded_at', today.toISOString())
          .lt('recorded_at', tomorrow.toISOString()),
        supabase.from('overtime').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('leaves').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase
          .from('attendance')
          .select('*, profile:profiles(full_name,email,employee_id,position,department)')
          .order('recorded_at', { ascending: false })
          .limit(8),
      ]);

      setStats({
        employees: emp.count ?? 0,
        todayCheckIn: att.count ?? 0,
        pendingOvertime: ot.count ?? 0,
        pendingLeaves: lv.count ?? 0,
      });
      setRecent(recentAtt.data as any);
      setLoading(false);
    })();
  }, []);

  if (!mounted) {
    return null;
  }

  const cards = [
    { label: 'Karyawan Aktif', value: stats.employees, icon: Users, href: '/admin/karyawan', color: 'text-primary' },
    { label: 'Absen Masuk Hari Ini', value: stats.todayCheckIn, icon: Camera, href: '/admin/rekap', color: 'text-success' },
    { label: 'Lembur Menunggu', value: stats.pendingOvertime, icon: Clock, href: '/admin/lembur', color: 'text-warning' },
    { label: 'Izin Menunggu', value: stats.pendingLeaves, icon: FileText, href: '/admin/izin', color: 'text-warning' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" /> Dashboard Admin
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="border-border/60 hover:border-primary/40 hover:shadow-md transition-all h-full">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl gradient-orange-soft flex items-center justify-center">
                    <c.icon className={`w-5 h-5 ${c.color}`} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{loading ? '—' : c.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Absensi Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 rounded bg-muted animate-pulse" />
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada data absensi.</p>
          ) : (
            <div className="space-y-3">
              {recent.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.photo_url} alt="foto" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.profile?.full_name ?? 'Karyawan'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.type === 'check_in' ? 'Masuk' : 'Pulang'} — {a.city || a.address || 'Lokasi'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(a.recorded_at)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/rekap">Lihat Rekap Absensi</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/karyawan">Kelola Karyawan</Link>
        </Button>
      </div>
    </div>
  );
}