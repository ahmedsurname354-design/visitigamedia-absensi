export type UserRole = 'employee' | 'admin' | 'owner';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  employee_id: string | null;
  role: UserRole;
  position: string | null;
  department: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AttendanceType = 'check_in' | 'check_out';

export interface Attendance {
  id: string;
  user_id: string;
  type: AttendanceType;
  photo_url: string;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  note: string | null;
  recorded_at: string;
  created_at: string;
  profile?: Pick<Profile, 'full_name' | 'email' | 'employee_id' | 'position' | 'department'>;
}

export type OvertimeStatus = 'pending' | 'approved' | 'rejected';

export interface Overtime {
  id: string;
  user_id: string;
  reason: string;
  start_time: string;
  end_time: string;
  photo_url: string;
  latitude: number;
  longitude: number;
  address: string | null;
  status: OvertimeStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  profile?: Pick<Profile, 'full_name' | 'email' | 'employee_id' | 'position' | 'department'>;
}

export type LeaveType = 'sakit' | 'izin' | 'cuti' | 'dinas_luar';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface Leave {
  id: string;
  user_id: string;
  type: LeaveType;
  reason: string;
  start_date: string;
  end_date: string;
  document_url: string | null;
  status: LeaveStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  profile?: Pick<Profile, 'full_name' | 'email' | 'employee_id' | 'position' | 'department'>;
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sakit: 'Sakit',
  izin: 'Izin',
  cuti: 'Cuti',
  dinas_luar: 'Dinas Luar',
};

export const STATUS_LABELS: Record<'pending' | 'approved' | 'rejected', string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};
