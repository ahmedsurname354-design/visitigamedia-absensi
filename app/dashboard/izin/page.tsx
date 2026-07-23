'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Loader2, Upload, CheckCircle2, XCircle, Hourglass, FileCheck2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { uploadToBucket, formatDate, formatDateTime } from '@/lib/supabase/helpers';
import { STATUS_LABELS, LEAVE_TYPE_LABELS } from '@/lib/supabase/types';
import type { Leave, LeaveType } from '@/lib/supabase/types';
import { toast } from 'sonner';

export default function IzinPage() {
  const { profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<LeaveType>('sakit');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [list, setList] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('leaves')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setList((data ?? []) as Leave[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error('Ukuran file maksimal 5MB');
    setDocFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setDocPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setDocPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!profile) return;
    if (!reason || !startDate || !endDate) return toast.error('Lengkapi semua field');
    if (new Date(endDate) < new Date(startDate)) return toast.error('Tanggal selesai tidak boleh sebelum mulai');
    setSubmitting(true);
    try {
      let documentUrl: string | null = null;
      if (docFile) {
        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(docFile);
        });
        const ext = docFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        documentUrl = await uploadToBucket('leave-documents', profile.id, dataUrl, ext);
      }
      const { error } = await supabase.from('leaves').insert({
        user_id: profile.id,
        type,
        reason,
        start_date: startDate,
        end_date: endDate,
        document_url: documentUrl,
      });
      if (error) throw error;
      toast.success('Pengajuan izin/sakit terkirim');
      setReason('');
      setStartDate('');
      setEndDate('');
      setDocFile(null);
      setDocPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? 'Gagal mengajukan izin');
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

  const types: LeaveType[] = ['sakit', 'izin', 'cuti', 'dinas_luar'];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" /> Izin / Sakit
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ajukan izin, sakit, cuti, atau dinas luar. Upload surat dokter/surat izin (opsional).
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Form Pengajuan</CardTitle>
          <CardDescription>Pilih tipe dan isi data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipe</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {types.map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={type === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setType(t)}
                  className={type === t ? 'gradient-orange text-white border-0' : ''}
                >
                  {LEAVE_TYPE_LABELS[t]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Alasan</Label>
            <Textarea
              id="reason"
              placeholder="Jelaskan alasan..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start">Tanggal Mulai</Label>
              <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Tanggal Selesai</Label>
              <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Upload Surat (opsional)</Label>
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" />
            <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> {docFile ? docFile.name : 'Pilih file (gambar/PDF, max 5MB)'}
            </Button>
            {docPreview && (
              <div className="rounded-lg border border-border/60 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={docPreview} alt="Preview" className="w-full max-h-48 object-contain bg-muted/30" />
              </div>
            )}
            {docFile && !docPreview && (
              <div className="flex items-center gap-2 rounded-lg border border-border/60 p-3 text-sm">
                <FileCheck2 className="w-4 h-4 text-primary" /> {docFile.name}
              </div>
            )}
          </div>

          <Button
            className="w-full gradient-orange text-white border-0"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...
              </>
            ) : (
              <>Kirim Pengajuan</>
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
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada pengajuan.</p>
          ) : (
            <div className="space-y-3">
              {list.map((l) => {
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
                      {l.admin_note && <p className="text-foreground/80">Catatan admin: {l.admin_note}</p>}
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
