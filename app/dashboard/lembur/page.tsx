'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { CameraCapture } from '@/components/camera/camera-capture';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, Loader2, MapPin, CheckCircle2, XCircle, Hourglass } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { uploadToBucket, formatDateTime, googleMapsLink } from '@/lib/supabase/helpers';
import { STATUS_LABELS } from '@/lib/supabase/types';
import type { Overtime } from '@/lib/supabase/types';
import { toast } from 'sonner';

interface CapturedData {
  photoUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}

export default function LemburPage() {
  const { profile } = useAuth();
  const [reason, setReason] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [captured, setCaptured] = useState<CapturedData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [list, setList] = useState<Overtime[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('overtime')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setList((data ?? []) as Overtime[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleSubmit = async () => {
    if (!profile || !captured) return toast.error('Ambil foto bukti terlebih dahulu');
    if (!reason || !startTime || !endTime) return toast.error('Lengkapi semua field');
    if (new Date(endTime) <= new Date(startTime)) return toast.error('Jam selesai harus setelah jam mulai');
    setSubmitting(true);
    try {
      const photoUrl = await uploadToBucket('overtime-photos', profile.id, captured.photoUrl, 'jpg');
      const { error } = await supabase.from('overtime').insert({
        user_id: profile.id,
        reason,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        photo_url: photoUrl,
        latitude: captured.latitude,
        longitude: captured.longitude,
        address: captured.address,
        city: captured.city,
      });
      if (error) throw error;
      toast.success('Pengajuan lembur terkirim');
      setReason('');
      setStartTime('');
      setEndTime('');
      setCaptured(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? 'Gagal mengajukan lembur');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'approved')
      return { icon: CheckCircle2, cls: 'bg-success/10 text-success border-success/30' };
    if (s === 'rejected')
      return { icon: XCircle, cls: 'bg-destructive/10 text-destructive border-destructive/30' };
    return { icon: Hourglass, cls: 'bg-warning/10 text-warning border-warning/30' };
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" /> Pengajuan Lembur
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Isi form di bawah, ambil foto bukti kerja, dan pastikan GPS aktif.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Form Lembur</CardTitle>
          <CardDescription>Semua field wajib diisi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Alasan Lembur</Label>
            <Textarea
              id="reason"
              placeholder="Jelaskan alasan lembur..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start">Jam Mulai</Label>
              <Input id="start" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Jam Selesai</Label>
              <Input id="end" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          {captured ? (
            <div className="rounded-xl border border-border/60 p-4 bg-accent/30 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Lokasi & Foto Terkonfirmasi</p>
              </div>
              <p className="text-xs text-muted-foreground">{captured.address}</p>
              <a
                href={googleMapsLink(captured.latitude, captured.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Lihat di Google Maps →
              </a>
            </div>
          ) : (
            <div>
              <Label className="mb-2 block">Bukti Foto Kerja</Label>
              <CameraCapture onCapture={(d) => setCaptured(d)} label="Ambil Foto Bukti" />
            </div>
          )}

          <Button
            className="w-full gradient-orange text-white border-0"
            onClick={handleSubmit}
            disabled={submitting || !captured}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...
              </>
            ) : (
              <>Ajukan Lembur</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Riwayat Pengajuan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-20 rounded bg-muted animate-pulse" />
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada pengajuan lembur.</p>
          ) : (
            <div className="space-y-3">
              {list.map((o) => {
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
                      {o.admin_note && <p className="text-foreground/80">Catatan admin: {o.admin_note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
