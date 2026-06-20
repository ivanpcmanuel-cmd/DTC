import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Academics } from './pages/Academics';
import { Finance } from './pages/Finance';
import { HR } from './pages/HR';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { User } from './types';
import { FirebaseSyncService, SYNC_CONFIG } from './services/firebaseSync';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [syncedCollections, setSyncedCollections] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const startSync = async () => {
      try {
        // 1. First run the parallel bootstrapping check to prep/seed empty collections if any
        await FirebaseSyncService.bootstrapData();
      } catch (err) {
        console.error("Bootstrap error:", err);
      }

      if (!isMounted) return;

      // 2. Initialize snap listeners with progress tracking
      unsubscribe = FirebaseSyncService.initializeSync((loadedList) => {
        if (!isMounted) return;
        setSyncedCollections(loadedList);
        
        // 3. If all collections are synced, open the app
        if (loadedList.length >= SYNC_CONFIG.length) {
          setTimeout(() => {
            if (isMounted) {
              setIsSyncing(false);
            }
          }, 600); // Gentle transition
        }
      });
    };

    startSync();

    // Safety timeout: after 7 seconds, auto-enable opening the app to prevent infinite lock
    const safetyTimeout = setTimeout(() => {
      if (isMounted && isSyncing) {
        console.warn("Safety trigger: Synchronisation reached timeout. Opening the app using cached/latest state.");
        setIsSyncing(false);
      }
    }, 7000);

    const stored = localStorage.getItem('dtc_current_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleLogin = (loggedInUser: User) => {
    localStorage.setItem('dtc_current_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('dtc_current_user');
    setUser(null);
  };

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
            <div className="border border-slate-100 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-50 bg-slate-50/50 p-2">
              {SYNC_CONFIG.map((config) => {
                const isItemSynced = syncedCollections.includes(config.collectionName);
                return (
                  <div key={config.collectionName} className="flex items-center justify-between py-2 px-3 text-xs">
                    <span className="font-medium text-slate-600">{config.label}</span>
                    <div className="flex items-center gap-1.5">
                      {isItemSynced ? (
                        <>
                          <span className="text-emerald-600 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
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
                          <span className="text-slate-400 font-medium text-[10px]">
                            A carregar...
                          </span>
                          <span className="relative flex h-2 w-2 border-emerald-100">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-bounce"></span>
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
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
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
