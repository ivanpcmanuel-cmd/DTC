import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, GraduationCap, 
  Wallet, Briefcase, Settings, LogOut, Menu, X
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { NotificationCenter } from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', label: 'Dashboards', icon: LayoutDashboard },
    { path: '/students', label: 'Alunos', icon: Users },
    { path: '/academics', label: 'Turmas & Cursos', icon: GraduationCap },
    { path: '/finance', label: 'Financeiro', icon: Wallet },
    { path: '/hr', label: 'Recursos Humanos', icon: Briefcase },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-dtc-blue text-white transition-all duration-300 flex flex-col shadow-xl z-20`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-blue-800">
          {isSidebarOpen ? (
            <span className="font-bold text-xl tracking-tight">DTC Manager</span>
          ) : (
            <span className="font-bold text-xl mx-auto">DTC</span>
          )}
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-blue-700 rounded lg:hidden"
          >
             <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors group ${
                  isActive 
                    ? 'bg-white text-dtc-blue font-semibold shadow-md' 
                    : 'text-blue-100 hover:bg-blue-800'
                }`}
              >
                <Icon size={20} className={`${isActive ? 'text-dtc-blue' : 'text-blue-300'} ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button 
            onClick={onLogout}
            className="flex items-center w-full px-4 py-2 text-red-200 hover:text-white hover:bg-red-700/50 rounded-lg transition-colors"
          >
            <LogOut size={20} className={`${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
            {isSidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-dtc-blue hidden lg:block">
            <Menu size={24} />
          </button>
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-dtc-blue lg:hidden">
            <Menu size={24} />
          </button>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <NotificationCenter />

            <div className="h-6 w-px bg-gray-300 mx-2"></div>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-dtc-blue text-white flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};