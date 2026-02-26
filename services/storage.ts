import { User, Student, Course, ClassSession, Staff, Transaction, Notification, NotificationSettings } from '../types';

const KEYS = {
  USERS: 'dtc_users',
  STUDENTS: 'dtc_students',
  COURSES: 'dtc_courses',
  CLASSES: 'dtc_classes',
  STAFF: 'dtc_staff',
  TRANSACTIONS: 'dtc_transactions',
  NOTIFICATIONS: 'dtc_notifications',
  NOTIF_SETTINGS: 'dtc_notif_settings',
  MASTER_KEY: 'dtc_master_key' // In real app, this is env var
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

  // Staff
  getStaff: () => getItems<Staff>(KEYS.STAFF),
  saveStaff: (item: Staff) => {
    const items = getItems<Staff>(KEYS.STAFF);
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    saveItems(KEYS.STAFF, items);
  },

  // Finance
  getTransactions: () => getItems<Transaction>(KEYS.TRANSACTIONS),
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

  // Master Key Check
  verifyMasterKey: (key: string) => {
    return localStorage.getItem(KEYS.MASTER_KEY) === key;
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
  }
};