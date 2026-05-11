import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { User } from '../types';
import { Button, Input, Card, Select, Modal } from '../components/UI';

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

  // Recovery State
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = () => {
    const existingUsers = StorageService.getUsers();
    setUsers(existingUsers);
    if (existingUsers.length === 0) {
      setIsSetupMode(true);
    }
  };

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

  const openRecovery = () => {
    if (!username) {
        alert('Por favor, selecione um usuário primeiro.');
        return;
    }
    setIsRecoveryModalOpen(true);
  };

  const handleRecoverPassword = () => {
      if (!recoveryKey || !newPassword) {
          alert('Preencha a chave mestra e a nova palavra-passe.');
          return;
      }
      
      if (!StorageService.verifyMasterKey(recoveryKey)) {
          alert('Chave mestra incorreta.');
          return;
      }

      const targetUser = users.find(u => u.username === username);
      if (targetUser) {
          const updatedUser = { ...targetUser, passwordHash: btoa(newPassword) };
          StorageService.saveUser(updatedUser);
          refreshUsers();
          setIsRecoveryModalOpen(false);
          setRecoveryKey('');
          setNewPassword('');
          setPassword('');
          alert('Palavra-passe recuperada com sucesso!');
      }
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
            <Select 
              label="Usuário" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              options={[
                { value: '', label: 'Selecione um usuário...' },
                ...users.map(u => ({ value: u.username, label: `${u.name} (${u.role})` }))
              ]}
            />
            <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            
            <div className="flex justify-end mt-1 mb-4">
              <button 
                onClick={openRecovery} 
                className="text-xs text-dtc-blue hover:underline cursor-pointer bg-transparent border-0"
              >
                Esqueci a minha palavra-passe
              </button>
            </div>

            <Button className="w-full" onClick={handleLogin}>Entrar</Button>
          </Card>
        )}
        
        <div className="mt-8 text-center text-xs text-gray-400">
            &copy; 2024 Dosign Training Center
        </div>
      </div>

      <Modal isOpen={isRecoveryModalOpen} onClose={() => setIsRecoveryModalOpen(false)} title="Recuperar Palavra-passe">
        <p className="text-sm text-gray-600 mb-4">
          Insira a Chave Mestra do sistema para redefinir a palavra-passe do usuário selecionado.
        </p>
        <Input 
          label="Chave Mestra" 
          type="password" 
          value={recoveryKey} 
          onChange={e => setRecoveryKey(e.target.value)} 
        />
        <Input 
          label="Nova Palavra-passe" 
          type="password" 
          value={newPassword} 
          onChange={e => setNewPassword(e.target.value)} 
        />
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setIsRecoveryModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleRecoverPassword}>Redefinir</Button>
        </div>
      </Modal>
    </div>
  );
};
