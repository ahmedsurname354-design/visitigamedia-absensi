'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { CameraCapture } from '@/components/camera/camera-capture';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera, LogIn, LogOut, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { uploadToBucket, googleMapsLink, formatDateTime } from '@/lib/supabase/helpers';
import type { Attendance } from '@/lib/supabase/types';
import { toast } from 'sonner';

interface CapturedData {
  photoUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}

export default function AbsenPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [today, setToday] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [captured, setCaptured] = useState<CapturedData | null>(null);
  const [note, setNote] = useState('');

  const loadToday = async () => {
    if (!profile) return;
    setLoading(true);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', profile.id)
      .gte('recorded_at', start.toISOString())
      .lte('recorded_at', end.toISOString())
      .order('recorded_at', { ascending: true });
    setToday((data ?? []) as Attendance[]);
    setLoading(false);
  };

  useEffect(() => {
    loadToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const checkIn = today.find((a) => a.type === 'check_in');
  const checkOut = today.find((a) => a.type === 'check_out');
  const mode: 'check_in' | 'check_out' = checkIn && !checkOut ? 'check_out' : 'check_in';
  const canAbsen = !checkOut;

  const handleSubmit = async () => {
    if (!profile || !captured) return;
    setSubmitting(true);
    try {
      const photoUrl = await uploadToBucket('attendance-photos', profile.id, captured.photoUrl, 'jpg');
      const attendanceInsert: any = {
        user_id: profile.id,
        type: mode,
        photo_url: photoUrl,
        latitude: captured.latitude,
        longitude: captured.longitude,
        address: captured.address,
        note: note || null,
      };
      if (captured.city) {
        attendanceInsert.city = captured.city;
      }

      const { error } = await supabase.from('attendance').insert(attendanceInsert);
      if (error) throw error;
      toast.success(mode === 'check_in' ? 'Absen masuk berhasil!' : 'Absen pulang berhasil!');
      setCaptured(null);
      setNote('');
      await loadToday();
      setTimeout(() => router.push('/dashboard/riwayat'), 800);
    } catch (e: any) {
      toast.error(e?.message ?? 'Gagal menyimpan absen');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Camera className="w-6 h-6 text-primary" /> Absen
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ambil selfie dengan kamera dan pastikan GPS aktif. Waktu dicatat otomatis oleh server.
        </p>
      </div>

      {/* Status */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <LogIn className="w-4 h-4 text-success" />
              <p className="text-xs font-medium text-muted-foreground">Masuk</p>
            </div>
            {loading ? (
              <div className="h-6 w-20 rounded bg-muted animate-pulse" />
            ) : checkIn ? (
              <p className="text-lg font-bold text-success">
                {new Date(checkIn.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Belum</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <LogOut className="w-4 h-4 text-warning" />
              <p className="text-xs font-medium text-muted-foreground">Pulang</p>
            </div>
            {loading ? (
              <div className="h-6 w-20 rounded bg-muted animate-pulse" />
            ) : checkOut ? (
              <p className="text-lg font-bold text-warning">
                {new Date(checkOut.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Belum</p>
            )}
          </CardContent>
        </Card>
      </div>

      {checkOut && !loading ? (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
            <p className="font-semibold">Absensi hari ini sudah lengkap</p>
            <p className="text-sm text-muted-foreground mt-1">Anda sudah absen masuk dan pulang.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {mode === 'check_in' ? <LogIn className="w-5 h-5 text-success" /> : <LogOut className="w-5 h-5 text-warning" />}
              {mode === 'check_in' ? 'Absen Masuk' : 'Absen Pulang'}
            </CardTitle>
            <CardDescription>
              {mode === 'check_in'
                ? 'Posisikan wajah di tengah kamera, lalu ambil foto.'
                : 'Sebelum pulang, ambil foto selfie konfirmasi.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {captured ? (
              <>
                <div className="rounded-xl border border-border/60 p-4 bg-accent/30">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium">Lokasi Terkonfirmasi</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{captured.address}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {captured.latitude.toFixed(5)}, {captured.longitude.toFixed(5)}
                    {captured.city ? ` — ${captured.city}` : ''}
                  </p>
                  <a
                    href={googleMapsLink(captured.latitude, captured.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Lihat di Google Maps →
                  </a>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Catatan (opsional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Catatan tambahan..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button
                  className="w-full gradient-orange text-white border-0"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Konfirmasi {mode === 'check_in' ? 'Masuk' : 'Pulang'}
                    </>
                  )}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setCaptured(null)} disabled={submitting}>
                  Ambil ulang foto
                </Button>
              </>
            ) : (
              <CameraCapture
                onCapture={(d) => setCaptured(d)}
                label={mode === 'check_in' ? 'Ambil Foto Masuk' : 'Ambil Foto Pulang'}
              />
            )}
          </CardContent>
        </Card>
      )}

      {today.length > 0 && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Riwayat Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {today.map((a) => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${a.type === 'check_in' ? 'bg-success' : 'bg-warning'}`} />
                  <span className="font-medium">{a.type === 'check_in' ? 'Masuk' : 'Pulang'}</span>
                  <span className="text-muted-foreground ml-auto">{formatDateTime(a.recorded_at)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
