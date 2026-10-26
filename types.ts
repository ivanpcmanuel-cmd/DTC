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
  birthDate?: string; // Format YYYY-MM-DD
  address?: string;
  
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

export interface Bank {
  id: string;
  name: string;
  initialBalance?: number;
  isVisibleToOthers?: boolean;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: 'tuition' | 'material' | 'enrollment' | 'salary' | 'rent' | 'maintenance' | 'tax' | 'transfer' | 'other';
  amount: number;
  date: string;
  description: string;
  relatedStudentId?: string;
  relatedStaffId?: string; // New field to link expenses to staff
  status: 'paid' | 'pending';
  isAdminOnly?: boolean;
  destinationType?: 'caixa' | 'banco';
  bankId?: string;
  isTransfer?: boolean;
}

// Stats for Dashboards
export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
}

export interface SADFEvaluation {
  id: string;
  staffId: string;
  monthYear: string; // "YYYY-MM" (e.g. "2026-07")
  classRevenue: number;
  
  // 1. Assiduidade e Pontualidade
  unjustifiedAbsences: number;
  totalDelayMinutes: number;
  
  // 2. Retenção
  initialStudents: number;
  dropouts: number;
  
  // 3. Questionário (1-5)
  studentRatings: {
    domain: number; // Clarividência e domínio científico
    clarity: number; // Capacidade de resposta e esclarecimento
    punctuality: number; // Pontualidade e cumprimento de horário
    relation: number; // Relação interpessoal, respeito e ética
    dynamics: number; // Utilização de dinâmicas práticas
  };
  
  // 4. Observação Pedagógica (Auditoria)
  auditResult: 'favoravel' | 'desfavoravel';
  feedbackNotes?: string;
  
  // Status of the payment
  paymentProcessed: boolean;
  transactionId?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  userRole: Role;
  action: string;      // e.g. "student_create", "student_update", "transaction_create", "backup_import", etc.
  description: string; // Description of the change
  timestamp: string;   // ISO timestamp
}

// --- Tipos para o menu Pendentes & Operações em Curso ---
export type PendingType = 'checklist' | 'list' | 'note';
export type PendingPriority = 'low' | 'medium' | 'high' | 'urgent';
export type PendingStatus = 'pending' | 'in_progress' | 'completed';
export type PendingCategory = 'academic' | 'finance' | 'secretary' | 'it' | 'events' | 'general';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
}

export interface PendingItem {
  id: string;
  type: PendingType;
  title: string;
  description?: string;
  category: PendingCategory;
  priority: PendingPriority;
  status: PendingStatus;
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  color?: string; // 'amber' | 'blue' | 'emerald' | 'purple' | 'rose'
  checklistItems?: ChecklistItem[];
  tags?: string[];
}