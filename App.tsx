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
import { StorageService } from './services/storage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [syncKey, setSyncKey] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('dtc_current_user');
    if (stored) {
      setUser(JSON.parse(stored));
      StorageService.syncFromFirestore().catch(console.error);
    }

    const handleSync = () => {
      setSyncKey(prev => prev + 1);
    };

    window.addEventListener('dtc_data_synced', handleSync);
    return () => {
      window.removeEventListener('dtc_data_synced', handleSync);
    };
  }, []);

  const handleLogin = (loggedInUser: User) => {
    localStorage.setItem('dtc_current_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    StorageService.syncFromFirestore().catch(console.error);
  };

  const handleLogout = () => {
    localStorage.removeItem('dtc_current_user');
    setUser(null);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <HashRouter key={syncKey}>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/hr" element={user?.role === 'admin' ? <HR /> : <Navigate to="/" />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
