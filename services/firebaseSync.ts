import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';

export const SYNC_CONFIG = [
  { collectionName: 'users', storageKey: 'dtc_users', isSingleDoc: false, label: 'Utilizadores' },
  { collectionName: 'students', storageKey: 'dtc_students', isSingleDoc: false, label: 'Alunos' },
  { collectionName: 'courses', storageKey: 'dtc_courses', isSingleDoc: false, label: 'Cursos' },
  { collectionName: 'classes', storageKey: 'dtc_classes', isSingleDoc: false, label: 'Turmas' },
  { collectionName: 'staff', storageKey: 'dtc_staff', isSingleDoc: false, label: 'Funcionários' },
  { collectionName: 'transactions', storageKey: 'dtc_transactions', isSingleDoc: false, label: 'Transações Financeiras' },
  { collectionName: 'notifications', storageKey: 'dtc_notifications', isSingleDoc: false, label: 'Notificações' },
  { collectionName: 'notif_settings', storageKey: 'dtc_notif_settings', isSingleDoc: true, docId: 'default', label: 'Alertas e Definições' },
  { collectionName: 'master_key', storageKey: 'dtc_master_key', isSingleDoc: true, docId: 'default', isPlainString: true, label: 'Segurança (Chave Mestra)' }
];

// Active Firebase Auth user Id for sandbox isolation
let activeUserId: string | null = null;

export const setActiveUserId = (userId: string | null) => {
  activeUserId = userId;
};

export const getActiveUserId = () => {
  return activeUserId;
};

// Dispatch event on storage updates
export const dispatchStorageUpdate = () => {
  window.dispatchEvent(new Event('dtc_storage_updated'));
};

export const FirebaseSyncService = {
  // Save local storage item to Firestore list collection
  saveListItem: async (collectionName: string, docId: string, data: any) => {
    if (!activeUserId) return;
    try {
      const cleanData = JSON.parse(JSON.stringify(data)); // Deep clean reactive properties/methods
      await setDoc(doc(db, 'users', activeUserId, collectionName, docId), cleanData);
    } catch (error) {
      console.error(`Error saving item to Firestore [${collectionName}] for user [${activeUserId}]:`, error);
    }
  },

  // Delete local item from Firestore list collection
  deleteListItem: async (collectionName: string, docId: string) => {
    if (!activeUserId) return;
    try {
      await deleteDoc(doc(db, 'users', activeUserId, collectionName, docId));
    } catch (error) {
      console.error(`Error deleting item from Firestore [${collectionName}] for user [${activeUserId}]:`, error);
    }
  },

  // Save single document (e.g. notifications settings)
  saveSingleDoc: async (collectionName: string, docId: string, data: any) => {
    if (!activeUserId) return;
    try {
      const cleanData = JSON.parse(JSON.stringify(data));
      await setDoc(doc(db, 'users', activeUserId, collectionName, docId), cleanData);
    } catch (error) {
      console.error(`Error saving single doc to Firestore [${collectionName}] for user [${activeUserId}]:`, error);
    }
  },

  // Save absolute plain strings (like master key)
  savePlainString: async (collectionName: string, docId: string, value: string) => {
    if (!activeUserId) return;
    try {
      await setDoc(doc(db, 'users', activeUserId, collectionName, docId), { value });
    } catch (error) {
      console.error(`Error saving plain string to Firestore [${collectionName}] for user [${activeUserId}]:`, error);
    }
  },

  // Bootstrap data: if Firestore has no data for a collection, upload from local Storage to Firestore
  bootstrapData: async () => {
    if (!activeUserId) return;
    try {
      await Promise.all(SYNC_CONFIG.map(async (config) => {
        const colRef = collection(db, 'users', activeUserId!, config.collectionName);
        const snapshot = await getDocs(colRef);
        
        // If collection is empty on Firestore, let's bootstrap it with what's in local storage
        if (snapshot.empty) {
          const localData = localStorage.getItem(config.storageKey);
          if (localData) {
            console.log(`Bootstrapping Firestore collection '${config.collectionName}' with local storage data for user [${activeUserId}]...`);
            if (config.isSingleDoc) {
              if (config.isPlainString) {
                await setDoc(doc(db, 'users', activeUserId!, config.collectionName, config.docId!), { value: localData });
              } else {
                try {
                  const parsed = JSON.parse(localData);
                  await setDoc(doc(db, 'users', activeUserId!, config.collectionName, config.docId!), parsed);
                } catch (e) {
                  console.error(`Failed to parse local storage for single doc bootstrap [${config.storageKey}]:`, e);
                }
              }
            } else {
              try {
                const parsedList = JSON.parse(localData);
                if (Array.isArray(parsedList)) {
                  // Write batch for efficiency
                  const batch = writeBatch(db);
                  parsedList.forEach((item: any) => {
                    if (item && item.id) {
                      const dRef = doc(db, 'users', activeUserId!, config.collectionName, item.id);
                      batch.set(dRef, item);
                    }
                  });
                  await batch.commit();
                  console.log(`Successfully bootstrapped ${parsedList.length} items to Firestore collection '${config.collectionName}' for user [${activeUserId}]`);
                }
              } catch (e) {
                console.error(`Failed to parse/write local storage list bootstrap [${config.storageKey}]:`, e);
              }
            }
          }
        }
      }));
    } catch (error) {
      console.error("Error bootstrapping data to Firebase:", error);
    }
  },

  // Setup real-time listeners for all synced collections
  initializeSync: (onProgress?: (loadedCollections: string[]) => void) => {
    if (!activeUserId) return () => {};
    console.log("Initializing Firestore real-time sync listeners with progress callback for user:", activeUserId);
    const loaded = new Set<string>();

    const triggerProgress = (collectionName: string) => {
      if (!loaded.has(collectionName)) {
        loaded.add(collectionName);
        if (onProgress) {
          onProgress(Array.from(loaded));
        }
      }
    };

    const unsubscribes = SYNC_CONFIG.map(config => {
      return onSnapshot(collection(db, 'users', activeUserId!, config.collectionName), (snapshot) => {
        const currentLocalRaw = localStorage.getItem(config.storageKey);

        if (config.isSingleDoc) {
          const docSnap = snapshot.docs.find(d => d.id === config.docId);
          if (docSnap) {
            const data = docSnap.data();
            if (config.isPlainString) {
              const val = data.value || '';
              if (currentLocalRaw !== val) {
                localStorage.setItem(config.storageKey, val);
                dispatchStorageUpdate();
              }
            } else {
              const stringified = JSON.stringify(data);
              if (currentLocalRaw !== stringified) {
                localStorage.setItem(config.storageKey, stringified);
                dispatchStorageUpdate();
              }
            }
          }
        } else {
          // List collections
          const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          const stringifiedList = JSON.stringify(list);
          if (currentLocalRaw !== stringifiedList) {
            localStorage.setItem(config.storageKey, stringifiedList);
            dispatchStorageUpdate();
          }
        }

        // Mark as loaded and notify progress
        triggerProgress(config.collectionName);
      }, (error) => {
        console.error(`Error in snapshot listener for [${config.collectionName}]:`, error);
        // Mark as completed anyway to unblock opening the app
        triggerProgress(config.collectionName);
      });
    });

    // Return Cleanup function
    return () => {
      console.log("Stopping Firestore real-time sync listeners...");
      unsubscribes.forEach(unsub => unsub());
    };
  }
};
