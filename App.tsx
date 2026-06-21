import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Academics } from './pages/Academics';
import { Finance } from './pages/Finance';
import { HR } from './pages/HR';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { User } from './types';
import { StorageService } from './services/storage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fast local restore during connection phase
    const stored = localStorage.getItem('dtc_current_user');
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        setUser(profile);
        StorageService.startFirebaseSync(profile.id);
      } catch (e) {
        // Fallback
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = { id: firebaseUser.uid, ...userDoc.data() } as User;
            localStorage.setItem('dtc_current_user', JSON.stringify(profile));
            setUser(profile);
            StorageService.startFirebaseSync(firebaseUser.uid);
          } else {
            console.warn("Autenticado mas perfil não encontrado no Firestore.");
            setUser(null);
          }
        } catch (e) {
          console.error("Erro ao ler perfil do Firestore:", e);
        }
      } else {
        localStorage.removeItem('dtc_current_user');
        setUser(null);
        StorageService.stopFirebaseSync();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error("Erro ao terminar sessão:", e);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-dtc-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-semibold text-sm">A carregar o sistema...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={() => {}} />;
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
