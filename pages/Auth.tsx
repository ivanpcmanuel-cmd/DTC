import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { User } from '../types';
import { Button, Input, Card, Select, Modal } from '../components/UI';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const currentUsers = StorageService.getUsers();
      let systemUser = currentUsers.find(u => u.username === firebaseUser.email);
      
      if (!systemUser) {
        const isFirst = currentUsers.length === 0;
        const isAdminEmail = firebaseUser.email === 'ivanpcmanuel@gmail.com';
        const role = (isFirst || isAdminEmail) ? 'admin' : 'staff';
        
        systemUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email || 'Usuário Google',
          username: firebaseUser.email || firebaseUser.uid,
          passwordHash: '',
          role: role,
          isFirstUser: isFirst
        };
        
        StorageService.saveUser(systemUser);
        StorageService.addAuditLog('user_create', `Registou o utilizador @${systemUser.username} com a função de ${systemUser.role} via Google Sign-In`);
      }
      
      await StorageService.syncFromFirestore();
      setIsLoading(false);
      onLogin(systemUser);
    } catch (err: any) {
      setIsLoading(false);
      console.error(err);
      alert('Erro ao autenticar com o Google: ' + (err.message || err));
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
          <Card title="Login" className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center rounded-lg z-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-dtc-blue mb-2"></div>
                <p className="text-sm font-semibold text-gray-700 animate-pulse">A carregar dados do Firebase...</p>
              </div>
            )}
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

            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase font-semibold">Ou continuar com</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-xs bg-white hover:bg-gray-50 text-gray-700 font-medium transition duration-150 cursor-pointer text-sm"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.49 0,-0.64 -0.06,-1.25 -0.17,-1.89z" fill="#4285F4" />
                  <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.3,0.98 -2.34,0 -4.32,-1.58 -5.03,-3.7H2.94v2.66C4.42,18.73 8.01,20.6 12,20.6z" fill="#34A853" />
                  <path d="M6.97,13.12c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7 0,-0.59 0.1,-1.16 0.28,-1.7V7.06H2.94C2.35,8.24 2,9.58 2,11c0,1.42 0.35,2.76 0.94,3.94l4.03,-3.18z" fill="#FBBC05" />
                  <path d="M12,6.12c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,3.48 14.43,2.6 12,2.6 8.01,2.6 4.42,4.47 2.94,7.06l4.03,3.18c0.71,-2.12 2.69,-3.7 5.03,-3.7z" fill="#EA4335" />
                </g>
              </svg>
              {isLoading ? 'Sincronizando...' : 'Entrar com o Google'}
            </button>
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
