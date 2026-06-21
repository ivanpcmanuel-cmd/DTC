import { 
  collection, doc, getDocs, setDoc, deleteDoc, 
  onSnapshot, getDoc, query, where, writeBatch 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  getAuth,
  updatePassword
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { auth, db, firebaseConfig } from '../firebase';
import { User, Student, Course, ClassSession, Staff, Transaction, Notification, NotificationSettings } from '../types';

// Helper functions for safe offline cache
function getLocalStorageCache<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(`dtc_cache_${key}`);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultValue;
  }
}

function setLocalStorageCache<T>(key: string, value: T) {
  localStorage.setItem(`dtc_cache_${key}`, JSON.stringify(value));
}

// Memory caches initialized from localStorage for offline-first support
let cachedStudents: Student[] = getLocalStorageCache<Student[]>('students', []);
let cachedStaff: Staff[] = getLocalStorageCache<Staff[]>('staff', []);
let cachedTransactions: Transaction[] = getLocalStorageCache<Transaction[]>('transactions', []);
let cachedCourses: Course[] = getLocalStorageCache<Course[]>('courses', []);
let cachedClasses: ClassSession[] = getLocalStorageCache<ClassSession[]>('classes', []);
let cachedNotifications: Notification[] = getLocalStorageCache<Notification[]>('notifications', []);
let cachedNotifSettings: NotificationSettings = getLocalStorageCache<NotificationSettings>('notif_settings', {
  notifyOnEnrollment: true,
  notifyOverduePayment: true,
  notifyNewPayment: true,
  notifySystem: true,
  emailAlerts: false
});
let cachedUsers: User[] = getLocalStorageCache<User[]>('users', []);
let cachedMasterKey = localStorage.getItem('dtc_cache_master_key') || 'DTC2024';

// Real-time synchronization listeners
let unsubscribes: (() => void)[] = [];

// Listen to users collection globally
onSnapshot(collection(db, "users"), (snapshot) => {
  cachedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  setLocalStorageCache('users', cachedUsers);
  window.dispatchEvent(new Event('dtc_users_updated'));
}, (error) => {
  console.warn("Users listener permission note:", error);
});

// Listen to global master key config
onSnapshot(doc(db, "configs", "system"), (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.masterKey) {
      cachedMasterKey = data.masterKey;
      localStorage.setItem('dtc_cache_master_key', data.masterKey);
    }
  } else {
    setDoc(doc(db, "configs", "system"), { masterKey: 'DTC2024' }).catch(() => {});
  }
}, (error) => {
  console.warn("Config listener permission note:", error);
});

// Seed default data helper for new synced accounts
const seedDefaultDataForUser = async (uid: string) => {
  const defaultCourses: Course[] = [
    { id: '1', name: 'Inglês Geral', description: 'Curso completo de língua inglesa', durationMonths: 12 },
    { id: '2', name: 'Design Gráfico', description: 'Photoshop, Illustrator e InDesign', durationMonths: 6 },
    { id: '3', name: 'Informática na Ótica do Utilizador', description: 'Word, Excel, PowerPoint', durationMonths: 3 }
  ];

  const defaultStaff: Staff[] = [
    { id: '1', name: 'Teacher Silvano', role: 'Formador', salary: 150000, assignedClassIds: ['1'], evaluation: 'Excelente performance' },
    { id: '2', name: 'Teacher Amaral', role: 'Formador', salary: 145000, assignedClassIds: ['2'], evaluation: 'Muito pontual' }
  ];

  const defaultClasses: ClassSession[] = [
    { id: '1', name: 'Turma A - Manhã', courseId: '1', teacherId: '1', schedule: '08:00 - 09:30', capacity: 15, status: 'excellent' },
    { id: '2', name: 'Turma B - Tarde', courseId: '2', teacherId: '2', schedule: '14:00 - 15:30', capacity: 10, status: 'remedy' }
  ];

  const batch = writeBatch(db);

  defaultCourses.forEach(c => {
    batch.set(doc(db, "users", uid, "courses", c.id), c);
  });
  defaultStaff.forEach(s => {
    batch.set(doc(db, "users", uid, "staff", s.id), s);
  });
  defaultClasses.forEach(cl => {
    batch.set(doc(db, "users", uid, "classes", cl.id), cl);
  });

  await batch.commit();
};

const dispatchNotificationEvent = () => {
  window.dispatchEvent(new Event('dtc_notifications_updated'));
};

const dispatchDataEvent = () => {
  window.dispatchEvent(new Event('dtc_data_updated'));
};

export const StorageService = {
  // Sync Initialization and Cleanup
  startFirebaseSync: (uid: string, onUpdate?: () => void) => {
    StorageService.stopFirebaseSync();

    const handleUpdate = () => {
      dispatchDataEvent();
      if (onUpdate) onUpdate();
    };

    // 1. Students
    unsubscribes.push(onSnapshot(collection(db, "users", uid, "students"), (snap) => {
      cachedStudents = snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      setLocalStorageCache('students', cachedStudents);
      handleUpdate();
    }));

    // 2. Staff
    unsubscribes.push(onSnapshot(collection(db, "users", uid, "staff"), (snap) => {
      cachedStaff = snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff));
      setLocalStorageCache('staff', cachedStaff);
      handleUpdate();
    }));

    // 3. Transactions
    unsubscribes.push(onSnapshot(collection(db, "users", uid, "transactions"), (snap) => {
      cachedTransactions = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setLocalStorageCache('transactions', cachedTransactions);
      handleUpdate();
    }));

    // 4. Courses
    unsubscribes.push(onSnapshot(collection(db, "users", uid, "courses"), (snap) => {
      cachedCourses = snap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
      setLocalStorageCache('courses', cachedCourses);
      if (snap.empty) {
        seedDefaultDataForUser(uid);
      }
      handleUpdate();
    }));

    // 5. Classes
    unsubscribes.push(onSnapshot(collection(db, "users", uid, "classes"), (snap) => {
      cachedClasses = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassSession));
      setLocalStorageCache('classes', cachedClasses);
      handleUpdate();
    }));

    // 6. Notifications
    unsubscribes.push(onSnapshot(collection(db, "users", uid, "notifications"), (snap) => {
      cachedNotifications = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLocalStorageCache('notifications', cachedNotifications);
      dispatchNotificationEvent();
      handleUpdate();
    }));

    // 7. Notification Settings
    unsubscribes.push(onSnapshot(doc(db, "users", uid, "config", "notifSettings"), (docSnap) => {
      if (docSnap.exists()) {
        cachedNotifSettings = docSnap.data() as NotificationSettings;
      } else {
        const defaultSettings: NotificationSettings = {
          notifyOnEnrollment: true,
          notifyOverduePayment: true,
          notifyNewPayment: true,
          notifySystem: true,
          emailAlerts: false
        };
        setDoc(doc(db, "users", uid, "config", "notifSettings"), defaultSettings).catch(() => {});
        cachedNotifSettings = defaultSettings;
      }
      setLocalStorageCache('notif_settings', cachedNotifSettings);
      handleUpdate();
    }));
  },

  stopFirebaseSync: () => {
    unsubscribes.forEach(unsub => unsub());
    unsubscribes = [];
  },

  // Users Management
  getUsers: () => cachedUsers,
  
  saveUser: async (user: User, clearTextPassword?: string) => {
    // Save to Firestore
    await setDoc(doc(db, "users", user.id), user);

    // Create Firebase Auth user dynamically via secondary instance if requested
    if (clearTextPassword) {
      try {
        const secondaryApp = initializeApp(firebaseConfig, "secondaryApp");
        const secondaryAuth = getAuth(secondaryApp);
        const email = `${user.username.toLowerCase()}@dtcmanager.local`;
        await createUserWithEmailAndPassword(secondaryAuth, email, clearTextPassword);
        await secondaryApp.delete();
      } catch (err) {
        console.warn("Auth creation warning (likely already exists):", err);
      }
    }
  },

  deleteUser: async (id: string) => {
    await deleteDoc(doc(db, "users", id));
  },

  // Students Management
  getStudents: () => cachedStudents,
  
  saveStudent: async (student: Student) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const isNew = !cachedStudents.some(s => s.id === student.id);
    await setDoc(doc(db, "users", uid, "students", student.id), student);

    if (isNew) {
      StorageService.addNotification({
        title: 'Nova Matrícula',
        message: `O aluno ${student.fullName} foi registrado no sistema.`,
        type: 'success',
        category: 'academic'
      }, 'notifyOnEnrollment');
    }
  },

  deleteStudent: async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "students", id));
  },

  // Courses Management
  getCourses: () => cachedCourses,
  
  saveCourse: async (course: Course) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await setDoc(doc(db, "users", uid, "courses", course.id), course);
  },

  // Classes Management
  getClasses: () => cachedClasses,
  
  saveClass: async (item: ClassSession) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await setDoc(doc(db, "users", uid, "classes", item.id), item);
  },

  deleteClass: async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "classes", id));
  },

  // Staff Management
  getStaff: () => cachedStaff,
  
  saveStaff: async (item: Staff) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await setDoc(doc(db, "users", uid, "staff", item.id), item);
  },

  deleteStaff: async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "staff", id));
  },

  // Finance Management
  getTransactions: () => {
    const currentUserRaw = localStorage.getItem('dtc_current_user');
    if (currentUserRaw) {
      try {
        const user = JSON.parse(currentUserRaw);
        if (user && user.role !== 'admin') {
          return cachedTransactions.filter(t => !t.isAdminOnly);
        }
      } catch (e) {
        // Fallback
      }
    }
    return cachedTransactions;
  },

  saveTransaction: async (item: Transaction) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await setDoc(doc(db, "users", uid, "transactions", item.id), item);

    if (item.type === 'income') {
      StorageService.addNotification({
        title: 'Pagamento Recebido',
        message: `Entrada de ${item.amount.toLocaleString()} AOA - ${item.description}`,
        type: 'info',
        category: 'finance'
      }, 'notifyNewPayment');
    }
  },

  deleteTransaction: async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "transactions", id));
  },

  // Master Key
  verifyMasterKey: (key: string) => {
    return cachedMasterKey === key;
  },

  // Notification Settings
  getNotificationSettings: (): NotificationSettings => {
    return cachedNotifSettings;
  },

  saveNotificationSettings: async (settings: NotificationSettings) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await setDoc(doc(db, "users", uid, "config", "notifSettings"), settings);
  },

  // Notifications List
  getNotifications: () => {
    return cachedNotifications;
  },

  addNotification: async (
    notif: Omit<Notification, 'id' | 'date' | 'read'>, 
    settingKey?: keyof NotificationSettings
  ) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Check if user has disabled this notification type
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

    await setDoc(doc(db, "users", uid, "notifications", id), newNotif);
  },

  markAsRead: async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const item = cachedNotifications.find(n => n.id === id);
    if (item) {
      await setDoc(doc(db, "users", uid, "notifications", id), { ...item, read: true });
    }
  },

  markAllAsRead: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const batch = writeBatch(db);
    cachedNotifications.forEach(n => {
      if (!n.read) {
        batch.update(doc(db, "users", uid, "notifications", n.id), { read: true });
      }
    });
    await batch.commit();
  },

  // Background check for overdue payments
  checkOverduePayments: () => {
    if (!cachedNotifSettings.notifyOverduePayment) return;

    const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
    
    cachedStudents.forEach(s => {
      if (s.status === 'active' && !s.tuitionPayments[currentMonthKey]) {
         const alertTitle = `Propina em Atraso: ${s.fullName}`;
         const alreadyNotified = cachedNotifications.some(n => n.title === alertTitle && !n.read);
         
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
