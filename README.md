# VisitigaMedia Absensi — Sistem Absensi Resmi Perusahaan

Sistem absensi digital production-ready untuk VisitigaMedia. Karyawan absen dengan **live camera selfie + GPS**, ajukan lembur & izin/sakit, dan admin memiliki dashboard rekap lengkap dengan **export Excel**.

## Fitur

- **Auth & Role** (Supabase Auth): Karyawan vs Admin/Owner
- **Absen Masuk & Pulang**: Live camera (MediaDevices), GPS + reverse geocoding, timestamp server
- **Lembur**: Form alasan, jam mulai/selesai, bukti foto, GPS
- **Izin/Sakit**: Upload surat dokter/surat izin ke Supabase Storage
- **Dashboard Admin**: Rekap semua karyawan, filter & cari, link Google Maps, export Excel (.xlsx)
- **Kelola Karyawan**: Edit data, role, status aktif
- **Dark/Light Mode**, fully responsive (mobile-first untuk karyawan, desktop untuk admin)

## Tech Stack

- Next.js 13 (App Router) + TypeScript + Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage)
- SheetJS (xlsx) untuk export Excel
- Lucide React untuk ikon
- shadcn/ui untuk komponen

## Menjalankan di VS Code

### 1. Prasyarat
- Node.js 18+
- Akun Supabase (sudah dikonfigurasi di `.env`)

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment
File `.env` sudah terisi otomatis. Untuk setup manual, salin `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Isi dengan URL dan anon key project Supabase Anda:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
```

### 4. Database & Storage
Skema database (tabel `profiles`, `attendance`, `overtime`, `leaves`, RLS policies, storage buckets) **sudah otomatis di-apply** ke project Supabase yang terhubung. Tidak perlu menjalankan SQL manual.

### 5. Buat Akun Admin Pertama
1. Buka aplikasi, klik "Daftar"
2. Buat akun dengan email Anda
3. Buka Supabase Dashboard → Table Editor → `profiles`
4. Ubah kolom `role` dari `employee` menjadi `admin` atau `owner` untuk akun Anda
5. Login ulang — Anda akan diarahkan ke `/admin`

### 6. Jalankan Dev Server
```bash
npm run dev
```
Buka http://localhost:3000

### 7. Build untuk Production
```bash
npm run build
npm start
```

## Deploy ke Vercel (Gratis)

1. Push project ke GitHub:
```bash
git init
git add .
git commit -m "VisitigaMedia Absensi"
git branch -M main
git remote add origin https://github.com/USERNAME/visitigamedia-absensi.git
git push -u origin main
```

2. Buka https://vercel.com → "New Project" → import repo
3. Tambahkan Environment Variables di Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik "Deploy" — selesai!

## Struktur Folder

```
app/
  layout.tsx              # Root layout + providers
  page.tsx                # Landing page
  login/page.tsx          # Auth (login + signup)
  dashboard/
    layout.tsx            # Employee route guard
    page.tsx              # Employee home
    absen/page.tsx        # Absen masuk/pulang
    lembur/page.tsx       # Pengajuan lembur
    izin/page.tsx         # Pengajuan izin/sakit
    riwayat/page.tsx      # Riwayat karyawan
  admin/
    layout.tsx            # Admin route guard
    page.tsx              # Admin dashboard
    rekap/page.tsx        # Rekap absensi + export Excel
    lembur/page.tsx       # Approval lembur
    izin/page.tsx         # Approval izin
    karyawan/page.tsx     # Kelola karyawan
components/
  app-shell.tsx           # Sidebar + topbar navigation
  camera/camera-capture.tsx  # Live camera + GPS component
  providers/
    auth-provider.tsx     # Auth context
    theme-provider.tsx    # Dark/light mode
  ui/                     # shadcn/ui components
lib/
  supabase/
    client.ts             # Supabase client singleton
    types.ts              # TypeScript types
    helpers.ts            # Export Excel, geocoding, upload
  utils.ts                # cn() helper
```

## Catatan Keamanan

- Semua tabel diaktifkan **Row Level Security (RLS)**
- Karyawan hanya bisa melihat data diri sendiri
- Admin/Owner bisa melihat semua data
- Storage bucket terpisah untuk foto absen, foto lembur, dan dokumen izin
- Timestamp absen menggunakan `now()` server-side (mencegah manipulasi jam HP)

© VisitigaMedia
