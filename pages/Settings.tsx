import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select } from '../components/UI';
import { StorageService } from '../services/storage';
import { auth } from '../services/firebase';
import { User, NotificationSettings } from '../types';
import { Shield, Trash2, Save, Bell, Mail } from 'lucide-react';

export const Settings: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState('');
  
  // Notification Settings
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    notifyOnEnrollment: true,
    notifyOverduePayment: true,
    notifyNewPayment: true,
    notifySystem: true,
    emailAlerts: false
  });

  // New User Form (username field here acts as Google email)
  const [newUser, setNewUser] = useState({ name: '', username: '', role: 'staff' });

  useEffect(() => {
    const handleSync = () => {
      setUsers(StorageService.getUsers());
      setNotifSettings(StorageService.getNotificationSettings());
      
      const activeUser = StorageService.getUsers().find(u => u.id === auth.currentUser?.uid);
      if (activeUser) {
        setCurrentUser(activeUser);
      }
    };

    handleSync();
    window.addEventListener('dtc_data_synchronized', handleSync);
    return () => {
      window.removeEventListener('dtc_data_synchronized', handleSync);
    };
  }, []);

  const handleCreateUser = () => {
    if (!StorageService.verifyMasterKey(masterKey)) {
      alert("Chave Mestra Inválida!");
      return;
    }
    if (!newUser.name || !newUser.username) {
        alert("Preencha todos os campos obrigatórios");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newUser.username)) {
      alert("Por favor, insira um endereço de e-mail Google válido!");
      return;
    }

    StorageService.saveUser({
        id: 'u_temp_' + Date.now().toString(),
        name: newUser.name,
        username: newUser.username.toLowerCase().trim(),
        passwordHash: '', 
        role: newUser.role as any
    });

    setNewUser({ name: '', username: '', role: 'staff' });
    setMasterKey('');
    alert("Usuário pré-registrado com sucesso! Poderá fazer login imediatamente via Google.");
  };

  const handleDelete = (id: string) => {
    if(!window.confirm("Tem certeza que deseja remover este usuário?")) return;
    if (!StorageService.verifyMasterKey(prompt("Insira a Chave Mestra para confirmar:") || '')) {
        alert("Chave inválida. Ação negada.");
        return;
    }
    StorageService.deleteUser(id);
    alert("Usuário removido.");
  };
  
  const handleSaveNotifSettings = () => {
    StorageService.saveNotificationSettings(notifSettings);
    alert("Preferências de notificação salvas com sucesso!");
  };

  const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <span className="text-sm text-gray-700">{label}</span>
        <button 
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-dtc-blue focus:ring-offset-2 ${checked ? 'bg-dtc-blue' : 'bg-gray-200'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
  );

  if (!currentUser) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-dtc-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
      return <div className="p-8 text-center text-red-500 font-semibold bg-red-50 rounded-lg border border-red-200 max-w-xl mx-auto mt-10">Acesso restrito a Administradores do sistema.</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications Config */}
          <div className="lg:col-span-2">
            <Card title="Preferências de Notificação" className="relative">
                 <div className="absolute top-4 right-4 text-dtc-blue opacity-5">
                    <Bell size={40} />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-gray-700 mb-2 flex items-center"><Bell size={16} className="mr-2"/> Alertas no Sistema</h4>
                        <Toggle label="Novas Matrículas" checked={notifSettings.notifyOnEnrollment} onChange={v => setNotifSettings({...notifSettings, notifyOnEnrollment: v})} />
                        <Toggle label="Propinas em Atraso" checked={notifSettings.notifyOverduePayment} onChange={v => setNotifSettings({...notifSettings, notifyOverduePayment: v})} />
                        <Toggle label="Novos Pagamentos" checked={notifSettings.notifyNewPayment} onChange={v => setNotifSettings({...notifSettings, notifyNewPayment: v})} />
                        <Toggle label="Avisos do Sistema" checked={notifSettings.notifySystem} onChange={v => setNotifSettings({...notifSettings, notifySystem: v})} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-700 mb-2 flex items-center"><Mail size={16} className="mr-2"/> Canais Externos</h4>
                        <Toggle label="Receber alertas por E-mail" checked={notifSettings.emailAlerts} onChange={v => setNotifSettings({...notifSettings, emailAlerts: v})} />
                        <p className="text-xs text-gray-500 mt-2 italic">
                            * O envio de e-mails requer configuração de servidor SMTP (Simulado nesta versão).
                        </p>
                    </div>
                 </div>
                 <div className="mt-6 flex justify-end">
                      <Button onClick={handleSaveNotifSettings}>Salvar Preferências</Button>
                 </div>
            </Card>
          </div>

          <Card title="Gerir Usuários" className="h-fit">
              <div className="space-y-4">
                  {users.map(u => (
                      <div key={u.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                          <div>
                              <p className="font-bold text-gray-800">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.username} • <span className="capitalize">{u.role}</span></p>
                          </div>
                          {u.id !== currentUser.id && (
                              <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 p-1 transition-colors">
                                  <Trash2 size={18} />
                              </button>
                          )}
                      </div>
                  ))}
              </div>
          </Card>

          <Card title="Adicionar Novo Usuário">
              <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 flex items-center mb-4">
                      <Shield size={16} className="mr-2" />
                      Requer autorização com Chave Mestra
                  </div>
                  
                  <Input label="Nome" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Ex: Silvano Manuel" />
                  <Input label="E-mail (Google Login)" type="email" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="exemplo@gmail.com" />
                  
                  <Select 
                    label="Privilégios"
                    options={[
                      {value: 'staff', label: 'Funcionário (Registro/Consulta)'}, 
                      {value: 'viewer', label: 'Visualizador (Apenas Leitura)'},
                      {value: 'admin', label: 'Administrador Total'}
                    ]}
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                  />
                  
                  <div className="border-t pt-4 mt-4">
                      <Input label="Chave Mestra *" type="password" value={masterKey} onChange={e => setMasterKey(e.target.value)} placeholder="Insira a chave mestra..." />
                  </div>

                  <Button className="w-full mt-2" onClick={handleCreateUser} icon={Save}>Pré-registrar Usuário</Button>
              </div>
          </Card>
      </div>
    </div>
  );
};
