import * as XLSX from 'xlsx';
import type { Attendance, Overtime, Leave, Profile } from './types';

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function googleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function uploadToBucket(
  bucket: string,
  userId: string,
  dataUrl: string,
  ext = 'jpg',
): Promise<string> {
  const { supabase } = await import('./client');
  const blob = dataUrlToBlob(dataUrl);
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) throw new Error('geocode failed');
    const json = await res.json();
    const address = json.display_name ?? '';
    const city =
      json.address?.city ??
      json.address?.town ??
      json.address?.village ??
      json.address?.county ??
      json.address?.state ??
      '';
    return { address, city };
  } catch {
    return { address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, city: '' };
  }
}

type AdminRow = {
  Nama: string;
  Email: string;
  'ID Karyawan': string;
  Jabatan: string;
  Departemen: string;
  Tipe: string;
  Waktu: string;
  Latitude: number;
  Longitude: number;
  Alamat: string;
  Kota: string;
  Catatan: string;
  'Link Maps': string;
};

export function exportAttendanceExcel(rows: Attendance[], filename = 'rekap-absensi') {
  const data: AdminRow[] = rows.map((r) => ({
    Nama: r.profile?.full_name ?? '-',
    Email: r.profile?.email ?? '-',
    'ID Karyawan': r.profile?.employee_id ?? '-',
    Jabatan: r.profile?.position ?? '-',
    Departemen: r.profile?.department ?? '-',
    Tipe: r.type === 'check_in' ? 'Masuk' : 'Pulang',
    Waktu: formatDateTime(r.recorded_at),
    Latitude: r.latitude,
    Longitude: r.longitude,
    Alamat: r.address ?? '-',
    Kota: r.city ?? '-',
    Catatan: r.note ?? '-',
    'Link Maps': googleMapsLink(r.latitude, r.longitude),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = Object.keys(data[0] ?? {}).map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportOvertimeExcel(rows: Overtime[], filename = 'rekap-lembur') {
  const data = rows.map((r) => ({
    Nama: r.profile?.full_name ?? '-',
    Email: r.profile?.email ?? '-',
    Alasan: r.reason,
    Mulai: formatDateTime(r.start_time),
    Selesai: formatDateTime(r.end_time),
    Status: r.status,
    'Catatan Admin': r.admin_note ?? '-',
    Diajukan: formatDateTime(r.created_at),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = Object.keys(data[0] ?? {}).map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lembur');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportLeavesExcel(rows: Leave[], filename = 'rekap-izin') {
  const data = rows.map((r) => ({
    Nama: r.profile?.full_name ?? '-',
    Email: r.profile?.email ?? '-',
    Tipe: r.type,
    Alasan: r.reason,
    Mulai: formatDate(r.start_date),
    Selesai: formatDate(r.end_date),
    Status: r.status,
    'Catatan Admin': r.admin_note ?? '-',
    Diajukan: formatDateTime(r.created_at),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = Object.keys(data[0] ?? {}).map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Izin');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportProfilesExcel(rows: Profile[], filename = 'data-karyawan') {
  const data = rows.map((r) => ({
    Nama: r.full_name,
    Email: r.email,
    'ID Karyawan': r.employee_id ?? '-',
    Role: r.role,
    Jabatan: r.position ?? '-',
    Departemen: r.department ?? '-',
    Telepon: r.phone ?? '-',
    Aktif: r.is_active ? 'Ya' : 'Tidak',
    Terdaftar: formatDateTime(r.created_at),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = Object.keys(data[0] ?? {}).map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Karyawan');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
