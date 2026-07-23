'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Download, Loader2, Search, Pencil, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { exportProfilesExcel, formatDateTime } from '@/lib/supabase/helpers';
import type { Profile, UserRole } from '@/lib/supabase/types';
import { toast } from 'sonner';

export default function AdminKaryawanPage() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  // edit form
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setRows((data ?? []) as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(s) ||
      r.email?.toLowerCase().includes(s) ||
      r.employee_id?.toLowerCase().includes(s) ||
      r.position?.toLowerCase().includes(s) ||
      r.department?.toLowerCase().includes(s)
    );
  });

  const openEdit = (p: Profile) => {
    setEditing(p);
    setFullName(p.full_name);
    setEmployeeId(p.employee_id ?? '');
    setRole(p.role);
    setPosition(p.position ?? '');
    setDepartment(p.department ?? '');
    setPhone(p.phone ?? '');
    setIsActive(p.is_active);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        employee_id: employeeId || null,
        role,
        position: position || null,
        department: department || null,
        phone: phone || null,
        is_active: isActive,
      })
      .eq('id', editing.id);
    setSaving(false);
    if (error) return toast.error('Gagal menyimpan: ' + error.message);
    toast.success('Data karyawan diperbarui');
    setEditing(null);
    await load();
  };

  const handleExport = () => {
    if (filtered.length === 0) return toast.error('Tidak ada data');
    setExporting(true);
    try {
      exportProfilesExcel(filtered, `data-karyawan-${new Date().toISOString().slice(0, 10)}`);
      toast.success('Excel diunduh');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Kelola Karyawan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Lihat dan edit data semua karyawan.</p>
        </div>
        <Button onClick={handleExport} className="gradient-orange text-white border-0" disabled={exporting || filtered.length === 0}>
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Export Excel
        </Button>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, email, jabatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">ID</TableHead>
                  <TableHead className="hidden lg:table-cell">Jabatan</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                      Tidak ada karyawan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{p.email}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">{p.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{p.employee_id ?? '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">{p.position ?? '-'}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                          p.role === 'admin' || p.role === 'owner'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {p.role === 'admin' || p.role === 'owner' ? <ShieldCheck className="w-3 h-3" /> : null}
                          {p.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs ${p.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Karyawan</DialogTitle>
            <DialogDescription>{editing?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nama Lengkap</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>ID Karyawan</Label>
              <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="VM-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Karyawan</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jabatan</Label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Staff" />
            </div>
            <div className="space-y-1.5">
              <Label>Departemen</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Marketing" />
            </div>
            <div className="space-y-1.5">
              <Label>Telepon</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08..." />
            </div>
            <div className="space-y-1.5 flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <Label>Aktif</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <Button className="w-full gradient-orange text-white border-0 mt-2" onClick={saveEdit} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Simpan Perubahan
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
