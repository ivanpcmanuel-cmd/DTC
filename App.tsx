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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('dtc_current_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    localStorage.setItem('dtc_current_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('dtc_current_user');
    setUser(null);
  };

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
