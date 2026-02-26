import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { User } from '../types';
import { Button, Input, Card } from '../components/UI';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isSetupMode, setIsSetupMode] = useState(false);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Setup State
  const [setupData, setSetupData] = useState({ name: '', username: '', password: '', confirmPassword: '' });

  useEffect(() => {
    const existingUsers = StorageService.getUsers();
    setUsers(existingUsers);
    if (existingUsers.length === 0) {
      setIsSetupMode(true);
    }
  }, []);

  const handleLogin = () => {
    const user = users.find(u => u.username === username && u.passwordHash === btoa(password));
    if (user) {
      onLogin(user);
    } else {
      alert("Credenciais inválidas");
    }
  };

  const handleSetup = () => {
    if (setupData.password !== setupData.confirmPassword) return alert("Senhas não coincidem");
    if (!setupData.name || !setupData.username) return alert("Preencha tudo");

    const firstUser: User = {
      id: 'admin_01',
      name: setupData.name,
      username: setupData.username,
      passwordHash: btoa(setupData.password),
      role: 'admin',
      isFirstUser: true
    };
    
    StorageService.saveUser(firstUser);
    onLogin(firstUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-dtc-blue">DTC Manager</h1>
            <p className="text-gray-500 mt-2">Sistema Integrado de Gestão</p>
        </div>

        {isSetupMode ? (
          <Card title="Configuração Inicial (Primeiro Acesso)">
            <p className="text-sm text-gray-600 mb-4">Registre o Administrador Principal do sistema.</p>
            <Input label="Nome Completo" value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} />
            <Input label="Usuário" value={setupData.username} onChange={e => setSetupData({...setupData, username: e.target.value})} />
            <Input label="Senha" type="password" value={setupData.password} onChange={e => setSetupData({...setupData, password: e.target.value})} />
            <Input label="Confirmar Senha" type="password" value={setupData.confirmPassword} onChange={e => setSetupData({...setupData, confirmPassword: e.target.value})} />
            <Button className="w-full mt-4" onClick={handleSetup}>Configurar Sistema</Button>
          </Card>
        ) : (
          <Card title="Login">
            <Input label="Usuário" value={username} onChange={e => setUsername(e.target.value)} />
            <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <Button className="w-full mt-4" onClick={handleLogin}>Entrar</Button>
          </Card>
        )}
        
        <div className="mt-8 text-center text-xs text-gray-400">
            &copy; 2024 Dosign Training Center
        </div>
      </div>
    </div>
  );
};
