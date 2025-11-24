export interface SchoolClass {
  id: string;
  name: string;
  created_at?: string;
}

export interface Student {
  id: string;
  class_id: string;
  first_name: string;
  last_name: string;
  code: string;
  created_at?: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent_justified' | 'absent_unjustified';

export interface AttendanceRecord {
  id?: string;
  class_id: string;
  student_id: string;
  date: string; // Persian Date String YYYY/MM/DD
  weekday: string;
  status: AttendanceStatus;
  created_at?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'حاضر',
  late: 'تأخیر',
  absent_justified: 'موجه',
  absent_unjustified: 'غیرموجه',
};

// Updated Colors for Green Minimal Theme (Emerald primary, with semantic alerts)
export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  late: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  absent_justified: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  absent_unjustified: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
};