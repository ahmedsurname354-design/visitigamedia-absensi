'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, MapPin, Clock, FileText, CheckCircle2, XCircle, Hourglass } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime, formatDate, googleMapsLink } from '@/lib/supabase/helpers';
import { STATUS_LABELS, LEAVE_TYPE_LABELS } from '@/lib/supabase/types';
import type { Attendance, Overtime, Leave } from '@/lib/supabase/types';

export default function RiwayatPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [overtime, setOvertime] = useState<Overtime[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    if (profile.role === 'admin' || profile.role === 'owner') {
      router.replace('/admin/rekap');
      return;
    }

    (async () => {
      const [att, ot, lv] = await Promise.all([
        supabase
          .from('attendance')
          .select('*')
          .eq('user_id', profile.id)
          .order('recorded_at', { ascending: false })
          .limit(50),
        supabase
          .from('overtime')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('leaves')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);
      setAttendance((att.data ?? []) as Attendance[]);
      setOvertime((ot.data ?? []) as Overtime[]);
      setLeaves((lv.data ?? []) as Leave[]);
      setLoading(false);
    })();
  }, [profile, router]);

  const statusBadge = (s: string) => {
    if (s === 'approved')
      return { icon: CheckCircle2, cls: 'bg-success/10 text-success border-success/30' };
    if (s === 'rejected')
      return { icon: XCircle, cls: 'bg-destructive/10 text-destructive border-destructive/30' };
    return { icon: Hourglass, cls: 'bg-warning/10 text-warning border-warning/30' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="w-6 h-6 text-primary" /> Riwayat Saya
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Semua catatan absensi, lembur, dan izin Anda.</p>
      </div>

      <Tabs defaultValue="attendance">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="attendance">Absensi</TabsTrigger>
          <TabsTrigger value="overtime">Lembur</TabsTrigger>
          <TabsTrigger value="leaves">Izin</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Riwayat Absensi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-20 rounded bg-muted animate-pulse" />
              ) : attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada riwayat absensi.</p>
              ) : (
                <div className="space-y-3">
                  {attendance.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.photo_url} alt="foto" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${a.type === 'check_in' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                            {a.type === 'check_in' ? 'Masuk' : 'Pulang'}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatDateTime(a.recorded_at)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{a.address || a.city || 'Lokasi tercatat'}</span>
                        </p>
                        <a href={googleMapsLink(a.latitude, a.longitude)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          Lihat di Maps →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overtime">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Riwayat Lembur
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-20 rounded bg-muted animate-pulse" />
              ) : overtime.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada riwayat lembur.</p>
              ) : (
                <div className="space-y-3">
                  {overtime.map((o) => {
                    const b = statusBadge(o.status);
                    return (
                      <div key={o.id} className="rounded-lg border border-border/60 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-2">{o.reason}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border whitespace-nowrap ${b.cls}`}>
                            <b.icon className="w-3 h-3" /> {STATUS_LABELS[o.status]}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                          <p>Mulai: {formatDateTime(o.start_time)}</p>
                          <p>Selesai: {formatDateTime(o.end_time)}</p>
                          {o.admin_note && <p className="text-foreground/80">Catatan: {o.admin_note}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Riwayat Izin
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-20 rounded bg-muted animate-pulse" />
              ) : leaves.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada riwayat izin.</p>
              ) : (
                <div className="space-y-3">
                  {leaves.map((l) => {
                    const b = statusBadge(l.status);
                    return (
                      <div key={l.id} className="rounded-lg border border-border/60 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded-md text-xs bg-accent text-accent-foreground font-medium mb-1">
                              {LEAVE_TYPE_LABELS[l.type]}
                            </span>
                            <p className="text-sm font-medium line-clamp-2">{l.reason}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border whitespace-nowrap ${b.cls}`}>
                            <b.icon className="w-3 h-3" /> {STATUS_LABELS[l.status]}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                          <p>{formatDate(l.start_date)} — {formatDate(l.end_date)}</p>
                          {l.document_url && (
                            <a href={l.document_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              Lihat surat →
                            </a>
                          )}
                          {l.admin_note && <p className="text-foreground/80">Catatan: {l.admin_note}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
