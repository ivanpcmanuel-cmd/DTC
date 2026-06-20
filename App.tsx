import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Academics } from './pages/Academics';
import { Finance } from './pages/Finance';
import { HR } from './pages/HR';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { User } from './types';
import { FirebaseSyncService, SYNC_CONFIG, setActiveUserId } from './services/firebaseSync';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthResolving, setIsAuthResolving] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedCollections, setSyncedCollections] = useState<string[]>([]);

  useEffect(() => {
    let syncUnsubscribe: (() => void) | null = null;
    let isMounted = true;

    // Listen to Firebase Auth state changes
    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous sync subscriptions if any
      if (syncUnsubscribe) {
        syncUnsubscribe();
        syncUnsubscribe = null;
      }

      if (firebaseUser) {
        console.log("Firebase Auth User logged in:", firebaseUser.email, firebaseUser.uid);
        
        // 1. Configure the active tenant account sandbox
        setActiveUserId(firebaseUser.uid);
        
        if (isMounted) {
          setIsSyncing(true);
          setSyncedCollections([]);
        }

        try {
          // 2. Perform bootstrapping/seeding if initial Firestore collection is empty
          await FirebaseSyncService.bootstrapData();
        } catch (err) {
          console.error("Bootstrapping error during auth state change:", err);
        }

        if (!isMounted) return;

        // 3. Setup real-time listener for this user session
        syncUnsubscribe = FirebaseSyncService.initializeSync((loadedList) => {
          if (!isMounted) return;
          setSyncedCollections(loadedList);

          // 4. If all collections are synchronized, resolve authentication
          if (loadedList.length >= SYNC_CONFIG.length) {
            // Find or seed our user profile representation locally inside the loaded list of 'dtc_users'
            let localUsers: User[] = [];
            const localUsersRaw = localStorage.getItem('dtc_users');
            if (localUsersRaw) {
              try {
                localUsers = JSON.parse(localUsersRaw);
              } catch (e) {
                console.error(e);
              }
            }

            let profile = localUsers.find(u => u.id === firebaseUser.uid);
            if (!profile) {
              // Try to find any admin
              profile = localUsers.find(u => u.role === 'admin');
            }
            if (!profile) {
              // Create dynamic profile if none is recovered from backup databases
              profile = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Administrador",
                username: firebaseUser.email?.split('@')[0] || "admin",
                passwordHash: '',
                role: 'admin'
              };
              // Save profile so it syncs up to Firestore
              localUsers.push(profile);
              localStorage.setItem('dtc_users', JSON.stringify(localUsers));
              FirebaseSyncService.saveListItem('users', profile.id, profile);
            }

            // Sync current session state
            localStorage.setItem('dtc_current_user', JSON.stringify(profile));
            setUser(profile);

            // Turn off loading screens
            setTimeout(() => {
              if (isMounted) {
                setIsSyncing(false);
                setIsAuthResolving(false);
              }
            }, 600); // Smooth animation ease-out
          }
        });

      } else {
        console.log("Firebase Auth is unauthenticated.");
        
        // Clear active session
        setActiveUserId(null);
        setUser(null);
        
        if (isMounted) {
          setIsSyncing(false);
          setIsAuthResolving(false);
        }
      }
    });

    return () => {
      isMounted = false;
      authUnsubscribe();
      if (syncUnsubscribe) {
        syncUnsubscribe();
      }
    };
  }, []);

  const handleLogin = (loggedInUser: User) => {
    // User already logged in via Firebase Auth; Auth.tsx triggers Firebase session,
    // which in turn fires onAuthStateChanged. But for backward-compatibility or safe states:
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      
      // Safety clean local cookies so no cached state compromises the next user
      localStorage.removeItem('dtc_current_user');
      SYNC_CONFIG.forEach(config => {
        localStorage.removeItem(config.storageKey);
      });
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isAuthResolving && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-500">A carregar sessão segura...</p>
        </div>
      </div>
    );
  }

  if (isSyncing) {
    const percentage = Math.round((syncedCollections.length / SYNC_CONFIG.length) * 100);
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="flex flex-col items-center text-center">
            {/* Elegant Header Visual */}
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-100 opacity-20 animate-pulse" />
              <svg className="w-8 h-8 animate-spin text-blue-600 relative z-10" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Sincronizando Base de Dados
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              A ligar aos servidores cloud para sincronizar as informações em tempo real...
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Progresso global</span>
                <span>{percentage}% ({syncedCollections.length}/{SYNC_CONFIG.length})</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Subcomponents list */}
            <div className="border border-slate-100 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-50 bg-slate-50/50 p-2 font-medium">
              {SYNC_CONFIG.map((config) => {
                const isItemSynced = syncedCollections.includes(config.collectionName);
                return (
                  <div key={config.collectionName} className="flex items-center justify-between py-2 px-3 text-xs">
                    <span className="font-semibold text-slate-600">{config.label}</span>
                    <div className="flex items-center gap-1.5">
                      {isItemSynced ? (
                        <>
                          <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                            Sincronizado
                          </span>
                          <span className="text-emerald-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400 font-bold text-[10px]">
                            A carregar...
                          </span>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Footer branding element */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-bold">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Sincronização Segura DTC Cloud
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/hr" element={<HR />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
