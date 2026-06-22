import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { User, Student, Course, ClassSession, Staff, Transaction, Notification, NotificationSettings } from '../types';

// In-memory caches to serve fast synchronous reads for existing rendering logic
let cachedUsers: User[] = [];
let cachedStudents: Student[] = [];
let cachedCourses: Course[] = [];
let cachedClasses: ClassSession[] = [];
let cachedStaff: Staff[] = [];
let cachedTransactions: Transaction[] = [];
let cachedNotifications: Notification[] = [];
let cachedNotifSettings: NotificationSettings = {
  notifyOnEnrollment: true,
  notifyOverduePayment: true,
  notifyNewPayment: true,
  notifySystem: true,
  emailAlerts: false
};
const masterKey = 'DTC2024';

const dispatchSyncEvent = () => {
  window.dispatchEvent(new Event('dtc_data_synchronized'));
  window.dispatchEvent(new Event('dtc_notifications_updated'));
};

let listeners: (() => void)[] = [];

export const initRealtimeSync = (onReady?: () => void) => {
  // Clear any existing active listeners
  listeners.forEach(unsub => unsub());
  listeners = [];

  // 1. Users
  const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
    cachedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    dispatchSyncEvent();
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'users');
  });
  listeners.push(unsubUsers);

  // 2. Students
  const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
    cachedStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    dispatchSyncEvent();
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'students');
  });
  listeners.push(unsubStudents);

  // 3. Courses
  const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
    cachedCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    // Seed default courses if empty on Firestore
    if (snapshot.empty) {
      seedDefaultData();
    }
    dispatchSyncEvent();
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'courses');
  });
  listeners.push(unsubCourses);

  // 4. Classes
  const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
    cachedClasses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassSession));
    dispatchSyncEvent();
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'classes');
  });
  listeners.push(unsubClasses);

  // 5. Staff
  const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
    cachedStaff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
    dispatchSyncEvent();
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'staff');
  });
  listeners.push(unsubStaff);

  // 6. Transactions
  const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
    cachedTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    dispatchSyncEvent();
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'transactions');
  });
  listeners.push(unsubTransactions);

  // 7. Notifications
  const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
    cachedNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    dispatchSyncEvent();
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'notifications');
  });
  listeners.push(unsubNotifications);

  // 8. Settings
  const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
    if (docSnap.exists()) {
      cachedNotifSettings = docSnap.data() as NotificationSettings;
    } else {
      // Create defaults
      const defaults: NotificationSettings = {
        notifyOnEnrollment: true,
        notifyOverduePayment: true,
        notifyNewPayment: true,
        notifySystem: true,
        emailAlerts: false
      };
      setDoc(doc(db, 'settings', 'global'), defaults).catch(console.error);
    }
    dispatchSyncEvent();
    if (onReady) onReady();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'settings/global');
  });
  listeners.push(unsubSettings);
};

export const clearRealtimeSync = () => {
  listeners.forEach(unsub => unsub());
  listeners = [];
  cachedUsers = [];
  cachedStudents = [];
  cachedCourses = [];
  cachedClasses = [];
  cachedStaff = [];
  cachedTransactions = [];
  cachedNotifications = [];
};

async function seedDefaultData() {
  try {
    const defaultCourses: Course[] = [
      { id: '1', name: 'Inglês Geral', description: 'Curso completo de língua inglesa', durationMonths: 12 },
      { id: '2', name: 'Design Gráfico', description: 'Photoshop, Illustrator e InDesign', durationMonths: 6 },
      { id: '3', name: 'Informática na Ótica do Utilizador', description: 'Word, Excel, PowerPoint', durationMonths: 3 }
    ];
    for (const c of defaultCourses) {
      await setDoc(doc(db, 'courses', c.id), c);
    }

    const defaultStaff: Staff[] = [
      { id: '1', name: 'Teacher Silvano', role: 'Formador', salary: 150000, assignedClassIds: ['1'], evaluation: 'Excelente performance' },
      { id: '2', name: 'Teacher Amaral', role: 'Formador', salary: 145000, assignedClassIds: ['2'], evaluation: 'Muito pontual' }
    ];
    for (const s of defaultStaff) {
      await setDoc(doc(db, 'staff', s.id), s);
    }

    const defaultClasses: ClassSession[] = [
      { id: '1', name: 'Turma A - Manhã', courseId: '1', teacherId: '1', schedule: '08:00 - 09:30', capacity: 15, status: 'excellent' },
      { id: '2', name: 'Turma B - Tarde', courseId: '2', teacherId: '2', schedule: '14:00 - 15:30', capacity: 10, status: 'remedy' }
    ];
    for (const cls of defaultClasses) {
      await setDoc(doc(db, 'classes', cls.id), cls);
    }
  } catch (error) {
    console.error("Failed to seed default data to Firestore", error);
  }
}

export const StorageService = {
  // Users
  getUsers: () => cachedUsers,
  saveUser: async (user: User) => {
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.id}`);
    }
  },
  deleteUser: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${id}`);
    }
  },
  
  // Students
  getStudents: () => cachedStudents,
  saveStudent: async (student: Student) => {
    try {
      const idx = cachedStudents.findIndex(i => i.id === student.id);
      const isNew = idx === -1;
      await setDoc(doc(db, 'students', student.id), student);
      
      if (isNew) {
        await StorageService.addNotification({
          title: 'Nova Matrícula',
          message: `O aluno ${student.fullName} foi registrado no sistema.`,
          type: 'success',
          category: 'academic'
        }, 'notifyOnEnrollment');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `students/${student.id}`);
    }
  },
  deleteStudent: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `students/${id}`);
    }
  },

  // Courses
  getCourses: () => cachedCourses,
  saveCourse: async (item: Course) => {
    try {
      await setDoc(doc(db, 'courses', item.id), item);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `courses/${item.id}`);
    }
  },

  // Classes
  getClasses: () => cachedClasses,
  saveClass: async (item: ClassSession) => {
    try {
      await setDoc(doc(db, 'classes', item.id), item);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `classes/${item.id}`);
    }
  },
  deleteClass: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'classes', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `classes/${id}`);
    }
  },

  // Staff
  getStaff: () => cachedStaff,
  saveStaff: async (item: Staff) => {
    try {
      await setDoc(doc(db, 'staff', item.id), item);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `staff/${item.id}`);
    }
  },
  deleteStaff: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'staff', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `staff/${id}`);
    }
  },

  // Finance
  getTransactions: () => {
    const usr = auth.currentUser;
    const matchedUser = cachedUsers.find(u => u.id === usr?.uid);
    if (matchedUser && matchedUser.role !== 'admin') {
      return cachedTransactions.filter(t => !t.isAdminOnly);
    }
    return cachedTransactions;
  },
  saveTransaction: async (item: Transaction) => {
    try {
      await setDoc(doc(db, 'transactions', item.id), item);
      if (item.type === 'income') {
        await StorageService.addNotification({
          title: 'Pagamento Recebido',
          message: `Entrada de ${item.amount.toLocaleString()} AOA - ${item.description}`,
          type: 'info',
          category: 'finance'
        }, 'notifyNewPayment');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `transactions/${item.id}`);
    }
  },
  deleteTransaction: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `transactions/${id}`);
    }
  },

  // Master Key Check
  verifyMasterKey: (key: string) => {
    return masterKey === key;
  },

  // --- Notifications System ---
  getNotificationSettings: (): NotificationSettings => {
    return cachedNotifSettings;
  },

  saveNotificationSettings: async (settings: NotificationSettings) => {
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/global');
    }
  },

  getNotifications: () => {
    return [...cachedNotifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addNotification: async (
    notif: Omit<Notification, 'id' | 'date' | 'read'>, 
    settingKey?: keyof NotificationSettings
  ) => {
    if (settingKey && !cachedNotifSettings[settingKey]) {
      return; 
    }

    const id = Date.now().toString() + Math.random().toString().slice(2,5);
    const newNotif: Notification = {
      id,
      date: new Date().toISOString(),
      read: false,
      ...notif
    };

    try {
      await setDoc(doc(db, 'notifications', id), newNotif);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `notifications/${id}`);
    }
  },

  markAsRead: async (id: string) => {
    const notif = cachedNotifications.find(n => n.id === id);
    if (notif) {
      try {
        await setDoc(doc(db, 'notifications', id), { ...notif, read: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `notifications/${id}`);
      }
    }
  },

  markAllAsRead: async () => {
    try {
      const unread = cachedNotifications.filter(n => !n.read);
      for (const n of unread) {
        await setDoc(doc(db, 'notifications', n.id), { ...n, read: true });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'notifications');
    }
  },

  checkOverduePayments: async () => {
    if (!cachedNotifSettings.notifyOverduePayment) return;

    const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
    
    for (const s of cachedStudents) {
      if (s.status === 'active' && !s.tuitionPayments[currentMonthKey]) {
        const alertTitle = `Propina em Atraso: ${s.fullName}`;
        const alreadyNotified = cachedNotifications.some(n => n.title === alertTitle && !n.read);
         
        if (!alreadyNotified) {
          await StorageService.addNotification({
            title: alertTitle,
            message: `O aluno ${s.fullName} ainda não regularizou o mês atual (${currentMonthKey}).`,
            type: 'warning',
            category: 'finance'
          });
        }
      }
    }
  }
};
