export type Role = 'admin' | 'staff' | 'viewer';

export interface User {
  id: string;
  name: string;
  username: string;
  passwordHash: string; // Simple storage for demo
  role: Role;
  isFirstUser?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'finance' | 'academic' | 'system';
  date: string;
  read: boolean;
}

export interface NotificationSettings {
  notifyOnEnrollment: boolean;
  notifyOverduePayment: boolean;
  notifyNewPayment: boolean;
  notifySystem: boolean;
  emailAlerts: boolean; // Visual only for this demo
}

export interface Student {
  id: string;
  fullName: string;
  age: number;
  email?: string;
  phone1?: string;
  phone2?: string;
  guardianName?: string;
  guardianContact?: string;
  courseId: string;
  classId?: string; // Link to specific ClassSession (Turma)
  status: 'active' | 'inactive' | 'alumni';
  description?: string;
  behaviorNotes?: string;
  registrationDate: string;
  acquisitionChannel: string; // Instagram, Facebook, etc.
  
  // Academic
  grades: { assessment: string; score: number; date: string }[];
  attendances: { date: string; present: boolean }[];
  completedCourses: { courseName: string; completionDate: string }[]; // History
  
  // Financial
  tuitionPayments: { [yearMonth: string]: boolean }; // Format "2023-10": true
}

export interface Course {
  id: string;
  name: string;
  description: string;
  durationMonths: number; // New field for course duration
}

export interface ClassSession {
  id: string;
  name: string; // "Turma 1"
  courseId: string;
  teacherId: string;
  schedule: string; // "08:00 - 09:00"
  capacity: number;
  status: 'excellent' | 'remedy' | 'inadequate'; // Green, Yellow, Red
}

export interface Staff {
  id: string;
  name: string;
  role: string; // "Teacher", "Receptionist"
  salary: number;
  assignedClassIds: string[];
  evaluation: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: 'tuition' | 'material' | 'enrollment' | 'salary' | 'rent' | 'maintenance' | 'tax' | 'other';
  amount: number;
  date: string;
  description: string;
  relatedStudentId?: string;
  relatedStaffId?: string; // New field to link expenses to staff
  status: 'paid' | 'pending';
}

// Stats for Dashboards
export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
}