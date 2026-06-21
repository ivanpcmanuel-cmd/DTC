import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { StorageService } from '../services/storage';
import { User } from '../types';
import { Button, Input, Card, Select, Modal } from '../components/UI';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [loading, setLoading] = useState(true);
  
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
    const handleUsersUpdated = () => {
      const existingUsers = StorageService.getUsers();
      setUsers(existingUsers);
      setIsSetupMode(existingUsers.length === 0);
      setLoading(false);
    };

    // Load from local storage cache first
    const initialUsers = StorageService.getUsers();
    setUsers(initialUsers);
    if (initialUsers.length > 0) {
      setIsSetupMode(false);
      setLoading(false);
    } else {
      // Small timeout fallback to check from Firestore first before triggering Setup Mode
      const t = setTimeout(() => {
        setIsSetupMode(StorageService.getUsers().length === 0);
        setLoading(false);
      }, 1500);
      return () => clearTimeout(t);
    }

    window.addEventListener('dtc_users_updated', handleUsersUpdated);
    return () => {
      window.removeEventListener('dtc_users_updated', handleUsersUpdated);
    };
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      const email = `${username.toLowerCase().trim()}@dtcmanager.local`;
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      alert("Credenciais inválidas: " + err.message);
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (setupData.password !== setupData.confirmPassword) {
      alert("Senhas não coincidem");
      return;
    }
    if (!setupData.name || !setupData.username || !setupData.password) {
      alert("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const email = `${setupData.username.toLowerCase().trim()}@dtcmanager.local`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, setupData.password);
      const uid = userCredential.user.uid;

      const firstUser: User = {
        id: uid,
        name: setupData.name,
        username: setupData.username.trim(),
        passwordHash: btoa(setupData.password),
        role: 'admin',
        isFirstUser: true
      };
      
      await StorageService.saveUser(firstUser);
    } catch (err: any) {
      alert("Erro ao configurar primeiro acesso: " + err.message);
      setLoading(false);
    }
  };

  const openRecovery = () => {
    if (!username) {
        alert('Por favor, selecione um usuário primeiro.');
        return;
    }
    setIsRecoveryModalOpen(true);
  };

  const handleRecoverPassword = async () => {
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
          try {
              setLoading(true);
              const updatedUser = { ...targetUser, passwordHash: btoa(newPassword) };
              await StorageService.saveUser(updatedUser, newPassword);
              setIsRecoveryModalOpen(false);
              setRecoveryKey('');
              setNewPassword('');
              setPassword('');
              setLoading(false);
              alert('Palavra-passe recuperada com sucesso! Tente fazer login agora.');
          } catch (err: any) {
              alert('Erro ao recuperar senha: ' + err.message);
              setLoading(false);
          }
      }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-dtc-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-semibold text-sm">Carregando canais de autenticação...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-dtc-blue">DTC Manager</h1>
            <p className="text-gray-500 mt-2">Sistema Integrado de Gestão (Sincronizado)</p>
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
            &copy; 2024 Dosign Training Center • FireSync Enabled
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
