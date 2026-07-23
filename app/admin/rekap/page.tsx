'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Search, MapPin, Loader2, History } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { exportAttendanceExcel, formatDateTime, googleMapsLink } from '@/lib/supabase/helpers';
import type { Attendance, Profile } from '@/lib/supabase/types';
import { toast } from 'sonner';

type Row = Attendance & { profile?: Profile };

export default function AdminRekapPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('attendance')
      .select('*, profile:profiles(full_name,email,employee_id,position,department)')
      .order('recorded_at', { ascending: false })
      .limit(500);

    if (userId !== 'all') q = q.eq('user_id', userId);
    if (typeFilter !== 'all') q = q.eq('type', typeFilter);
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      q = q.gte('recorded_at', s.toISOString());
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      q = q.lte('recorded_at', e.toISOString());
    }

    const { data, error } = await q;
    if (error) toast.error('Gagal memuat data');
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [userId, typeFilter, startDate, endDate]);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })
      .then(({ data }) => setEmployees((data ?? []) as Profile[]));
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.profile?.full_name?.toLowerCase().includes(s) ||
      r.profile?.email?.toLowerCase().includes(s) ||
      r.profile?.employee_id?.toLowerCase().includes(s) ||
      r.address?.toLowerCase().includes(s) ||
      r.city?.toLowerCase().includes(s)
    );
  });

  const handleExport = () => {
    if (filtered.length === 0) return toast.error('Tidak ada data untuk diexport');
    setExporting(true);
    try {
      exportAttendanceExcel(filtered, `rekap-absensi-${new Date().toISOString().slice(0, 10)}`);
      toast.success('File Excel berhasil diunduh');
    } catch (e: any) {
      toast.error('Gagal export: ' + (e?.message ?? ''));
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setUserId('all');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-primary" /> Rekap Absensi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Filter dan export semua data absensi karyawan.</p>
        </div>
        <Button onClick={handleExport} className="gradient-orange text-white border-0" disabled={exporting || filtered.length === 0}>
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Export Excel ({filtered.length})
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Cari</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nama / email / kota"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Karyawan</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Karyawan</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipe</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="check_in">Masuk</SelectItem>
                  <SelectItem value="check_out">Pulang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Aksi</Label>
              <Button variant="outline" className="w-full" onClick={resetFilters}>Reset Filter</Button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Dari Tanggal</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sampai Tanggal</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[60px]">Foto</TableHead>
                  <TableHead className="min-w-[140px]">Karyawan</TableHead>
                  <TableHead className="min-w-[80px]">Tipe</TableHead>
                  <TableHead className="min-w-[140px]">Waktu</TableHead>
                  <TableHead className="min-w-[200px]">Lokasi</TableHead>
                  <TableHead className="min-w-[120px]">Maps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, 100).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={r.photo_url} alt="foto" className="w-full h-full object-cover" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{r.profile?.full_name ?? '-'}</p>
                        <p className="text-xs text-muted-foreground">{r.profile?.position ?? '-'}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${r.type === 'check_in' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {r.type === 'check_in' ? 'Masuk' : 'Pulang'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{formatDateTime(r.recorded_at)}</TableCell>
                      <TableCell className="text-xs">
                        <p className="truncate max-w-[200px]">{r.address || '-'}</p>
                        <p className="text-muted-foreground">{r.city}</p>
                      </TableCell>
                      <TableCell>
                        <a
                          href={googleMapsLink(r.latitude, r.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <MapPin className="w-3 h-3" /> Lihat
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 100 && (
            <p className="text-xs text-muted-foreground text-center py-3 border-t border-border/60">
              Menampilkan 100 dari {filtered.length} data. Export Excel untuk melihat semua.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
