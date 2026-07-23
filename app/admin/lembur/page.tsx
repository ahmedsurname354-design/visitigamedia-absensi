'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';  
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, Download, Loader2, CheckCircle2, XCircle, Hourglass, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { exportOvertimeExcel, formatDateTime, googleMapsLink } from '@/lib/supabase/helpers';
import { STATUS_LABELS } from '@/lib/supabase/types';
import type { Overtime, Profile } from '@/lib/supabase/types';
import { toast } from 'sonner';

type Row = Overtime & { profile?: Profile };

export default function AdminLemburPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewing, setReviewing] = useState<Row | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('overtime')
      .select('*, profile:profiles(full_name,email,employee_id,position,department)')
      .order('created_at', { ascending: false })
      .limit(300);
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    const { data } = await q;
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const openReview = (r: Row, act: 'approved' | 'rejected') => {
    setReviewing(r);
    setAdminNote(r.admin_note ?? '');
    setAction(act);
  };

  const submitReview = async () => {
    if (!reviewing || !action) return;
    setSaving(true);
    const { error } = await supabase
      .from('overtime')
      .update({ status: action, admin_note: adminNote || null })
      .eq('id', reviewing.id);
    setSaving(false);
    if (error) return toast.error('Gagal memperbarui status');
    toast.success(action === 'approved' ? 'Lembur disetujui' : 'Lembur ditolak');
    setReviewing(null);
    setAction(null);
    setAdminNote('');
    await load();
  };

  const handleExport = () => {
    if (rows.length === 0) return toast.error('Tidak ada data');
    setExporting(true);
    try {
      exportOvertimeExcel(rows, `rekap-lembur-${new Date().toISOString().slice(0, 10)}`);
      toast.success('Excel diunduh');
    } finally {
      setExporting(false);
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'approved') return { icon: CheckCircle2, cls: 'bg-success/10 text-success border-success/30' };
    if (s === 'rejected') return { icon: XCircle, cls: 'bg-destructive/10 text-destructive border-destructive/30' };
    return { icon: Hourglass, cls: 'bg-warning/10 text-warning border-warning/30' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" /> Pengajuan Lembur
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Tinjau dan setujui pengajuan lembur karyawan.</p>
        </div>
        <Button onClick={handleExport} className="gradient-orange text-white border-0" disabled={exporting || rows.length === 0}>
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Export Excel
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm whitespace-nowrap">Status:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="md:col-span-2 h-32 rounded bg-muted animate-pulse" />
        ) : rows.length === 0 ? (
          <p className="md:col-span-2 text-sm text-muted-foreground text-center py-8">Tidak ada pengajuan.</p>
        ) : (
          rows.map((o) => {
            const b = statusBadge(o.status);
            return (
              <Card key={o.id} className="border-border/60">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{o.profile?.full_name ?? '-'}</p>
                      <p className="text-xs text-muted-foreground">{o.profile?.position ?? '-'}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${b.cls}`}>
                      <b.icon className="w-3 h-3" /> {STATUS_LABELS[o.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{o.reason}</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Mulai: {formatDateTime(o.start_time)}</p>
                    <p>Selesai: {formatDateTime(o.end_time)}</p>
                    <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {o.address}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <a href={o.photo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      Lihat foto →
                    </a>
                    <a href={googleMapsLink(o.latitude, o.longitude)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      Maps →
                    </a>
                  </div>
                  {o.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="gradient-orange text-white border-0 flex-1" onClick={() => openReview(o, 'approved')}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Setujui
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openReview(o, 'rejected')}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
                      </Button>
                    </div>
                  )}
                  {o.admin_note && <p className="text-xs text-muted-foreground pt-1">Catatan: {o.admin_note}</p>}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={!!reviewing} onOpenChange={(v) => !v && setReviewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === 'approved' ? 'Setujui Lembur' : 'Tolak Lembur'}</DialogTitle>
            <DialogDescription>
              {reviewing?.profile?.full_name} — {reviewing?.reason}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Catatan untuk karyawan (opsional)</Label>
              <Textarea
                placeholder="Catatan..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
              />
            </div>
            <Button className="w-full gradient-orange text-white border-0" onClick={submitReview} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Konfirmasi {action === 'approved' ? 'Setujui' : 'Tolak'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
