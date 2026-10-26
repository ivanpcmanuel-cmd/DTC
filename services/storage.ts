import { User, Student, Course, ClassSession, Staff, Transaction, Notification, NotificationSettings, Bank, SADFEvaluation, AuditLog, PendingItem } from '../types';

const KEYS = {
  USERS: 'dtc_users',
  STUDENTS: 'dtc_students',
  COURSES: 'dtc_courses',
  CLASSES: 'dtc_classes',
  STAFF: 'dtc_staff',
  TRANSACTIONS: 'dtc_transactions',
  NOTIFICATIONS: 'dtc_notifications',
  NOTIF_SETTINGS: 'dtc_notif_settings',
  MASTER_KEY: 'dtc_master_key', // In real app, this is env var
  BANKS: 'dtc_banks',
  SADF_EVALUATIONS: 'dtc_sadf_evaluations',
  AUDIT_LOGS: 'dtc_audit_logs',
  PENDINGS: 'dtc_pendings'
};

// Initial Seed Data Helper
const seedData = () => {
  if (!localStorage.getItem(KEYS.MASTER_KEY)) {
    localStorage.setItem(KEYS.MASTER_KEY, 'DTC2024'); // Default Master Key
  }
  
  // Check if we need seed data (only if empty)
  if (!localStorage.getItem(KEYS.COURSES)) {
    const courses: Course[] = [
      { id: '1', name: 'Inglês Geral', description: 'Curso completo de língua inglesa', durationMonths: 12 },
      { id: '2', name: 'Design Gráfico', description: 'Photoshop, Illustrator e InDesign', durationMonths: 6 },
      { id: '3', name: 'Informática na Ótica do Utilizador', description: 'Word, Excel, PowerPoint', durationMonths: 3 }
    ];
    localStorage.setItem(KEYS.COURSES, JSON.stringify(courses));

    const staff: Staff[] = [
      { id: '1', name: 'Teacher Silvano', role: 'Formador', salary: 150000, assignedClassIds: ['1'], evaluation: 'Excelente performance' },
      { id: '2', name: 'Teacher Amaral', role: 'Formador', salary: 145000, assignedClassIds: ['2'], evaluation: 'Muito pontual' }
    ];
    localStorage.setItem(KEYS.STAFF, JSON.stringify(staff));

    const classes: ClassSession[] = [
      { id: '1', name: 'Turma A - Manhã', courseId: '1', teacherId: '1', schedule: '08:00 - 09:30', capacity: 15, status: 'excellent' },
      { id: '2', name: 'Turma B - Tarde', courseId: '2', teacherId: '2', schedule: '14:00 - 15:30', capacity: 10, status: 'remedy' }
    ];
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
  }

  // Seed Default Notification Settings if not present
  if (!localStorage.getItem(KEYS.NOTIF_SETTINGS)) {
    const defaultSettings: NotificationSettings = {
      notifyOnEnrollment: true,
      notifyOverduePayment: true,
      notifyNewPayment: true,
      notifySystem: true,
      emailAlerts: false
    };
    localStorage.setItem(KEYS.NOTIF_SETTINGS, JSON.stringify(defaultSettings));
  }

  // Seed default banks if not present
  if (!localStorage.getItem(KEYS.BANKS)) {
    const defaultBanks: Bank[] = [
      { id: '1', name: 'Banco BAI', isVisibleToOthers: true },
      { id: '2', name: 'Banco BFA', isVisibleToOthers: true },
      { id: '3', name: 'Banco BIC', isVisibleToOthers: true }
    ];
    localStorage.setItem(KEYS.BANKS, JSON.stringify(defaultBanks));
  }

  // Seed default pendings (checklists, task lists, and notes on operations in progress)
  if (!localStorage.getItem(KEYS.PENDINGS)) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const defaultPendings: PendingItem[] = [
      {
        id: 'p-1',
        type: 'checklist',
        title: 'Checklist: Abertura e Início do Turno da Noite',
        description: 'Verificação operacional padrão para receção dos formandos do turno 18h-20h.',
        category: 'academic',
        priority: 'high',
        status: 'in_progress',
        assignedTo: 'Secretaria & Apoio Técnico',
        dueDate: todayStr,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        pinned: true,
        checklistItems: [
          { id: 'c1', text: 'Imprimir e disponibilizar listas de presença para os formadores', completed: true },
          { id: 'c2', text: 'Ligar e testar os projetores e aparelhos de ar condicionado da Sala 1 e 2', completed: true },
          { id: 'c3', text: 'Conferir kit de marcadores e apagadores nas salas de aula', completed: false },
          { id: 'c4', text: 'Receção e registo de formandos novos e entrega dos cartões', completed: false },
          { id: 'c5', text: 'Verificar fecho de portão e controlo de acesso após 18h30', completed: false }
        ],
        tags: ['Turno Noturno', 'Aulas', 'Salas']
      },
      {
        id: 'p-2',
        type: 'checklist',
        title: 'Checklist: Fecho Mensal de Caixa e Reconciliação',
        description: 'Rotina de conferência dos pagamentos em numerário, TPA e transferências bancárias.',
        category: 'finance',
        priority: 'urgent',
        status: 'in_progress',
        assignedTo: 'Área Financeira',
        dueDate: todayStr,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        pinned: true,
        checklistItems: [
          { id: 'f1', text: 'Emitir extrato bancário dos bancos BAI, BFA e BIC', completed: true },
          { id: 'f2', text: 'Reconciliar comprovativos de propina pendentes no sistema', completed: true },
          { id: 'f3', text: 'Conferir numerário físico em caixa forte com relatório do dia', completed: false },
          { id: 'f4', text: 'Disparar notificações para alunos com propina vencida há mais de 10 dias', completed: false }
        ],
        tags: ['Financeiro', 'Fecho', 'Propinas']
      },
      {
        id: 'p-3',
        type: 'list',
        title: 'Emissão e Assinatura dos Certificados da Turma B de Design',
        description: 'Conferir notas finais com o Formador Amaral, emitir os diplomas com QR Code e coletar assinatura da Direção Pedagógica.',
        category: 'secretary',
        priority: 'high',
        status: 'in_progress',
        assignedTo: 'Secretaria Académica',
        dueDate: todayStr,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        pinned: false,
        tags: ['Certificados', 'Design Gráfico', 'Formandos']
      },
      {
        id: 'p-4',
        type: 'list',
        title: 'Manutenção Preventiva dos Computadores do Laboratório 2',
        description: 'Atualização do software Adobe Illustrator e verificação da ligação de rede nos 15 postos de trabalho.',
        category: 'it',
        priority: 'medium',
        status: 'pending',
        assignedTo: 'Suporte TI',
        dueDate: todayStr,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        pinned: false,
        tags: ['Informática', 'Hardware', 'Software']
      },
      {
        id: 'p-5',
        type: 'note',
        title: 'Nota Operacional: Novo Procedimento de Justificação de Faltas',
        description: 'A partir de hoje, qualquer solicitação de reposição de aula prática deve ser entregue na secretaria com antecedência mínima de 48 horas mediante comprovativo de atestado ou laboral.',
        category: 'academic',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: 'Coordenação Pedagógica',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        pinned: true,
        color: 'amber',
        tags: ['Regulamento', 'Alunos', 'Docentes']
      },
      {
        id: 'p-6',
        type: 'note',
        title: 'Recado Rápido: Reposição de Stock de Toner e Papel A4',
        description: 'Pedir ao fornecedor 10 resmas de papel para emissão de avaliações do 2º trimestre e toner preto para impressora HP da Secretaria.',
        category: 'general',
        priority: 'low',
        status: 'pending',
        assignedTo: 'Administração',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        pinned: false,
        color: 'blue',
        tags: ['Logística', 'Suprimentos']
      }
    ];
    localStorage.setItem(KEYS.PENDINGS, JSON.stringify(defaultPendings));
  }
};


seedData();

// Generic Storage Helper
function getItems<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveItems<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

// Event Dispatcher for Real-time UI updates
const dispatchNotificationEvent = () => {
  window.dispatchEvent(new Event('dtc_notifications_updated'));
};

// Specific Services
export const StorageService = {
  // Users
  getUsers: () => getItems<User>(KEYS.USERS),
  saveUser: (user: User) => {
    const users = getItems<User>(KEYS.USERS);
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    saveItems(KEYS.USERS, users);
  },
  deleteUser: (id: string) => {
    const users = getItems<User>(KEYS.USERS).filter(u => u.id !== id);
    saveItems(KEYS.USERS, users);
  },
  
  // Students
  getStudents: () => getItems<Student>(KEYS.STUDENTS),
  saveStudent: (student: Student) => {
    const items = getItems<Student>(KEYS.STUDENTS);
    const idx = items.findIndex(i => i.id === student.id);
    const isNew = idx === -1;
    
    if (!isNew) items[idx] = student;
    else items.push(student);
    
    saveItems(KEYS.STUDENTS, items);

    // Trigger Notification for New Student
    if (isNew) {
      StorageService.addNotification({
        title: 'Nova Matrícula',
        message: `O aluno ${student.fullName} foi registrado no sistema.`,
        type: 'success',
        category: 'academic'
      }, 'notifyOnEnrollment');
    }
  },
  deleteStudent: (id: string) => {
    saveItems(KEYS.STUDENTS, getItems<Student>(KEYS.STUDENTS).filter(i => i.id !== id));
  },

  // Courses
  getCourses: () => getItems<Course>(KEYS.COURSES),
  saveCourse: (item: Course) => {
    const items = getItems<Course>(KEYS.COURSES);
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    saveItems(KEYS.COURSES, items);
  },

  // Classes
  getClasses: () => getItems<ClassSession>(KEYS.CLASSES),
  saveClass: (item: ClassSession) => {
    const items = getItems<ClassSession>(KEYS.CLASSES);
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    saveItems(KEYS.CLASSES, items);
  },
  deleteClass: (id: string) => {
    saveItems(KEYS.CLASSES, getItems<ClassSession>(KEYS.CLASSES).filter(i => i.id !== id));
  },

  // Staff
  getStaff: () => getItems<Staff>(KEYS.STAFF),
  saveStaff: (item: Staff) => {
    const items = getItems<Staff>(KEYS.STAFF);
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    saveItems(KEYS.STAFF, items);
  },
  deleteStaff: (id: string) => {
    saveItems(KEYS.STAFF, getItems<Staff>(KEYS.STAFF).filter(i => i.id !== id));
  },

  // Finance
  getTransactions: () => {
    const transactions = getItems<Transaction>(KEYS.TRANSACTIONS);
    const currentUserRaw = localStorage.getItem('dtc_current_user');
    if (currentUserRaw) {
      try {
        const user = JSON.parse(currentUserRaw);
        if (user && user.role !== 'admin') {
          const banks = getItems<Bank>(KEYS.BANKS);
          const hiddenBankIds = new Set(banks.filter(b => b.isVisibleToOthers === false).map(b => b.id));
          return transactions.filter(t => !t.isAdminOnly && !(t.destinationType === 'banco' && t.bankId && hiddenBankIds.has(t.bankId)));
        }
      } catch (e) {
        // Fallback
      }
    }
    return transactions;
  },
  saveTransaction: (item: Transaction) => {
    const items = getItems<Transaction>(KEYS.TRANSACTIONS);
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    saveItems(KEYS.TRANSACTIONS, items);

    // Trigger Notification for Payment
    if (item.type === 'income') {
      StorageService.addNotification({
        title: 'Pagamento Recebido',
        message: `Entrada de ${item.amount.toLocaleString()} AOA - ${item.description}`,
        type: 'info',
        category: 'finance'
      }, 'notifyNewPayment');
    }
  },
  deleteTransaction: (id: string) => {
    saveItems(KEYS.TRANSACTIONS, getItems<Transaction>(KEYS.TRANSACTIONS).filter(i => i.id !== id));
  },

  // Banks Management
  getBanks: () => getItems<Bank>(KEYS.BANKS),
  saveBank: (bank: Bank) => {
    const items = getItems<Bank>(KEYS.BANKS);
    const idx = items.findIndex(i => i.id === bank.id);
    if (idx >= 0) items[idx] = bank;
    else items.push(bank);
    saveItems(KEYS.BANKS, items);
  },
  deleteBank: (id: string) => {
    saveItems(KEYS.BANKS, getItems<Bank>(KEYS.BANKS).filter(i => i.id !== id));
  },

  // Master Key Check
  verifyMasterKey: (key: string) => {
    return localStorage.getItem(KEYS.MASTER_KEY) === key;
  },

  // SADF Evaluations Management
  getSADFEvaluations: () => getItems<SADFEvaluation>(KEYS.SADF_EVALUATIONS),
  saveSADFEvaluation: (evalu: SADFEvaluation) => {
    const items = getItems<SADFEvaluation>(KEYS.SADF_EVALUATIONS);
    const idx = items.findIndex(i => i.id === evalu.id);
    if (idx >= 0) items[idx] = evalu;
    else items.push(evalu);
    saveItems(KEYS.SADF_EVALUATIONS, items);
  },
  deleteSADFEvaluation: (id: string) => {
    saveItems(KEYS.SADF_EVALUATIONS, getItems<SADFEvaluation>(KEYS.SADF_EVALUATIONS).filter(i => i.id !== id));
  },

  // --- Notifications System ---
  
  getNotificationSettings: (): NotificationSettings => {
    const data = localStorage.getItem(KEYS.NOTIF_SETTINGS);
    return data ? JSON.parse(data) : {
      notifyOnEnrollment: true,
      notifyOverduePayment: true,
      notifyNewPayment: true,
      notifySystem: true,
      emailAlerts: false
    };
  },

  saveNotificationSettings: (settings: NotificationSettings) => {
    localStorage.setItem(KEYS.NOTIF_SETTINGS, JSON.stringify(settings));
  },

  getNotifications: () => {
    return getItems<Notification>(KEYS.NOTIFICATIONS).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addNotification: (
    notif: Omit<Notification, 'id' | 'date' | 'read'>, 
    settingKey?: keyof NotificationSettings
  ) => {
    const settings = StorageService.getNotificationSettings();
    
    // Check if user has disabled this notification type
    if (settingKey && !settings[settingKey]) {
      return; 
    }

    const notifications = getItems<Notification>(KEYS.NOTIFICATIONS);
    const newNotif: Notification = {
      id: Date.now().toString() + Math.random().toString().slice(2,5),
      date: new Date().toISOString(),
      read: false,
      ...notif
    };
    
    // Limit to last 50 notifications to save space
    if (notifications.length > 50) notifications.pop();
    
    notifications.unshift(newNotif);
    saveItems(KEYS.NOTIFICATIONS, notifications);
    dispatchNotificationEvent();
  },

  markAsRead: (id: string) => {
    const notifications = getItems<Notification>(KEYS.NOTIFICATIONS);
    const idx = notifications.findIndex(n => n.id === id);
    if (idx >= 0) {
      notifications[idx].read = true;
      saveItems(KEYS.NOTIFICATIONS, notifications);
      dispatchNotificationEvent();
    }
  },

  markAllAsRead: () => {
    const notifications = getItems<Notification>(KEYS.NOTIFICATIONS);
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveItems(KEYS.NOTIFICATIONS, updated);
    dispatchNotificationEvent();
  },

  // --- Background Checks ---
  // Run this when App mounts or Dashboard loads
  checkOverduePayments: () => {
    const settings = StorageService.getNotificationSettings();
    if (!settings.notifyOverduePayment) return;

    const students = getItems<Student>(KEYS.STUDENTS);
    const notifications = getItems<Notification>(KEYS.NOTIFICATIONS);
    const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
    
    // Simple check: Active students who haven't paid current month
    // Avoid spamming: Check if we already notified about this student this month
    
    students.forEach(s => {
      if (s.status === 'active' && !s.tuitionPayments[currentMonthKey]) {
         const alertTitle = `Propina em Atraso: ${s.fullName}`;
         
         // Check if we already sent an alert for this specific student/month recently (e.g. within 24h or just existant)
         // For this demo, we just check if a notification with this title exists
         const alreadyNotified = notifications.some(n => n.title === alertTitle && !n.read);
         
         if (!alreadyNotified) {
            StorageService.addNotification({
              title: alertTitle,
              message: `O aluno ${s.fullName} ainda não regularizou o mês atual (${currentMonthKey}).`,
              type: 'warning',
              category: 'finance'
            });
         }
      }
    });
  },

  // --- Backup and Security ---
  exportBackup: () => {
    const backup: Record<string, any> = {};
    Object.entries(KEYS).forEach(([_, key]) => {
      const val = localStorage.getItem(key);
      if (val !== null) {
        try {
          backup[key] = JSON.parse(val);
        } catch (e) {
          backup[key] = val;
        }
      }
    });
    return backup;
  },

  importBackup: (backupData: any) => {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Formato de backup inválido.');
    }
    
    const expectedKeys = Object.values(KEYS);
    const hasAnyKey = expectedKeys.some(k => k in backupData);
    if (!hasAnyKey) {
      throw new Error('O arquivo carregado não contém dados válidos do sistema DTC.');
    }

    Object.entries(backupData).forEach(([key, val]) => {
      if (expectedKeys.includes(key)) {
        if (typeof val === 'string') {
          localStorage.setItem(key, val);
        } else {
          localStorage.setItem(key, JSON.stringify(val));
        }
      }
    });
    return true;
  },

  // --- Audit Logs ---
  getAuditLogs: () => {
    return getItems<AuditLog>(KEYS.AUDIT_LOGS).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  addAuditLog: (action: string, description: string) => {
    try {
      const user = JSON.parse(localStorage.getItem('dtc_current_user') || '{}');
      const logs = getItems<AuditLog>(KEYS.AUDIT_LOGS);
      const newLog: AuditLog = {
        id: Date.now().toString() + Math.random().toString().slice(2, 5),
        userId: user.id || 'system',
        username: user.name || user.username || 'Sistema',
        userRole: user.role || 'viewer',
        action,
        description,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newLog);
      
      // Limit to 250 records to prevent LocalStorage memory bloating
      if (logs.length > 250) {
        logs.pop();
      }
      
      saveItems(KEYS.AUDIT_LOGS, logs);
    } catch (e) {
      console.error('Erro ao registrar log de auditoria:', e);
    }
  },

  clearAuditLogs: () => {
    saveItems(KEYS.AUDIT_LOGS, []);
  },

  // Pendentes & Operações em Curso
  getPendingItems: () => getItems<PendingItem>(KEYS.PENDINGS),
  savePendingItem: (item: PendingItem) => {
    const items = getItems<PendingItem>(KEYS.PENDINGS);
    const existingIndex = items.findIndex(p => p.id === item.id);
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.unshift(item);
    }
    saveItems(KEYS.PENDINGS, items);
    StorageService.addAuditLog(
      existingIndex >= 0 ? 'pending_update' : 'pending_create',
      `${item.type === 'checklist' ? 'Checklist' : item.type === 'list' ? 'Lista de Tarefas' : 'Nota'} "${item.title}" ${existingIndex >= 0 ? 'atualizada' : 'criada'}`
    );
  },
  deletePendingItem: (id: string) => {
    const items = getItems<PendingItem>(KEYS.PENDINGS);
    const itemToDelete = items.find(p => p.id === id);
    const filtered = items.filter(p => p.id !== id);
    saveItems(KEYS.PENDINGS, filtered);
    if (itemToDelete) {
      StorageService.addAuditLog('pending_delete', `Item pendente removido: "${itemToDelete.title}"`);
    }
  },
  toggleChecklistItem: (pendingId: string, itemId: string) => {
    const items = getItems<PendingItem>(KEYS.PENDINGS);
    const target = items.find(p => p.id === pendingId);
    if (target && target.checklistItems) {
      const checkItem = target.checklistItems.find(c => c.id === itemId);
      if (checkItem) {
        checkItem.completed = !checkItem.completed;
        checkItem.completedAt = checkItem.completed ? new Date().toISOString() : undefined;
        // Auto update status if all completed
        const allCompleted = target.checklistItems.every(c => c.completed);
        const anyCompleted = target.checklistItems.some(c => c.completed);
        if (allCompleted) {
          target.status = 'completed';
        } else if (anyCompleted) {
          target.status = 'in_progress';
        }
        target.updatedAt = new Date().toISOString();
        saveItems(KEYS.PENDINGS, items);
      }
    }
  }
};