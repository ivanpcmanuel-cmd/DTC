import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select } from '../components/UI';
import { StorageService } from '../services/storage';
import { User, NotificationSettings, AuditLog } from '../types';
import { Shield, Trash2, Save, Bell, Mail, Database, Download, Upload, History, Search, RefreshCw } from 'lucide-react';

const getActionBadgeColor = (action: string) => {
  if (action.includes('create') || action.includes('save') || action.includes('import')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (action.includes('delete')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (action.includes('backup') || action.includes('export')) return 'bg-blue-50 text-dtc-blue border-blue-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

const getActionLabel = (action: string) => {
  switch(action) {
    case 'user_create': return 'Criar Usuário';
    case 'user_delete': return 'Eliminar Usuário';
    case 'settings_update': return 'Configurações';
    case 'backup_export': return 'Exportar Backup';
    case 'backup_import': return 'Restaurar Backup';
    case 'student_create': return 'Matrícula Aluno';
    case 'student_update': return 'Editar Aluno';
    case 'student_delete': return 'Eliminar Aluno';
    case 'class_save': return 'Gravar Turma';
    case 'class_delete': return 'Eliminar Turma';
    case 'course_save': return 'Gravar Curso';
    case 'staff_save': return 'Gravar Funcionário';
    case 'staff_delete': return 'Eliminar Funcionário';
    case 'transaction_create': return 'Registrar Transação';
    case 'transaction_delete': return 'Eliminar Transação';
    default: return action;
  }
};

export const Settings: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser] = useState<User>(JSON.parse(localStorage.getItem('dtc_current_user') || '{}'));
  const [masterKey, setMasterKey] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  
  // Notification Settings
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    notifyOnEnrollment: true,
    notifyOverduePayment: true,
    notifyNewPayment: true,
    notifySystem: true,
    emailAlerts: false
  });

  // New User Form
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'staff' });

  useEffect(() => {
    setUsers(StorageService.getUsers());
    setNotifSettings(StorageService.getNotificationSettings());
    setAuditLogs(StorageService.getAuditLogs());
  }, []);

  const handleCreateUser = () => {
    if (!StorageService.verifyMasterKey(masterKey)) {
      alert("Chave Mestra Inválida!");
      return;
    }
    if (!newUser.name || !newUser.username || !newUser.password) {
        alert("Preencha todos os campos");
        return;
    }

    StorageService.saveUser({
        id: Date.now().toString(),
        name: newUser.name,
        username: newUser.username,
        passwordHash: btoa(newUser.password), // Mock hashing
        role: newUser.role as any
    });

    StorageService.addAuditLog('user_create', `Criou o utilizador @${newUser.username} com a função de ${newUser.role}`);
    setUsers(StorageService.getUsers());
    setAuditLogs(StorageService.getAuditLogs());
    setNewUser({ name: '', username: '', password: '', role: 'staff' });
    setMasterKey('');
    alert("Usuário criado com sucesso!");
  };

  const handleDelete = (id: string) => {
    const deletedUser = users.find(u => u.id === id);
    if(!window.confirm("Tem certeza?")) return;
    if (!StorageService.verifyMasterKey(prompt("Insira a Chave Mestra para confirmar:") || '')) {
        alert("Chave inválida. Ação negada.");
        return;
    }
    StorageService.deleteUser(id);
    StorageService.addAuditLog('user_delete', `Eliminou o utilizador @${deletedUser?.username || id}`);
    setUsers(StorageService.getUsers());
    setAuditLogs(StorageService.getAuditLogs());
  };
  
  const handleSaveNotifSettings = () => {
    StorageService.saveNotificationSettings(notifSettings);
    StorageService.addAuditLog('settings_update', 'Atualizou as preferências de notificações do sistema');
    setAuditLogs(StorageService.getAuditLogs());
    alert("Preferências de notificação salvas!");
  };

  const handleExportBackup = () => {
    try {
      const backupObj = StorageService.exportBackup();
      const jsonString = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `backup_dtc_centro_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      StorageService.addAuditLog('backup_export', 'Exportou uma cópia de segurança completa (JSON)');
      setAuditLogs(StorageService.getAuditLogs());
    } catch (err) {
      console.error(err);
      alert('Erro ao exportar backup de dados.');
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Atenção: Ao importar este arquivo de backup, todos os dados atuais do sistema serão substituídos pelos dados do arquivo de backup carregado. Deseja continuar?")) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        StorageService.importBackup(json);
        StorageService.addAuditLog('backup_import', 'Restaurou a base de dados a partir de uma cópia de segurança carregada (JSON)');
        alert("Backup importado com sucesso! O sistema será recarregado.");
        window.location.reload();
      } catch (err: any) {
        console.error(err);
        alert(`Erro ao importar backup: ${err.message || 'Formato de arquivo inválido.'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <span className="text-sm text-gray-700">{label}</span>
        <button 
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-dtc-blue focus:ring-offset-2 ${checked ? 'bg-dtc-blue' : 'bg-gray-200'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
  );

  if (currentUser.role !== 'admin') {
      return <div className="p-8 text-center text-red-500">Acesso restrito a Administradores.</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications Config */}
          <div className="lg:col-span-2">
            <Card title="Preferências de Notificação" className="relative">
                 <div className="absolute top-4 right-4 text-dtc-blue opacity-20">
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
                 <div className="mt-4 flex justify-end">
                     <Button onClick={handleSaveNotifSettings} size="sm">Salvar Preferências</Button>
                 </div>
            </Card>
          </div>

          {/* Backup & Security Config */}
          <div className="lg:col-span-2">
            <Card title="Segurança & Backup da Base de Dados" className="relative">
                 <div className="absolute top-4 right-4 text-dtc-blue opacity-10">
                    <Database size={40} />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-gray-700 mb-2 flex items-center"><Download size={16} className="mr-2 text-dtc-blue"/> Exportar Base de Dados</h4>
                        <p className="text-sm text-gray-600 mb-4">
                            Gere e descarregue um backup completo em formato JSON contendo todos os registos do Centro de Formação (Alunos, Cursos, Turmas, Propinas, Funcionários, Bancos e Avaliações SADF). Guarde o arquivo em local seguro.
                        </p>
                        <Button onClick={handleExportBackup} icon={Download} size="sm">Exportar Base de Dados (JSON)</Button>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-700 mb-2 flex items-center"><Upload size={16} className="mr-2 text-amber-600"/> Restaurar Base de Dados</h4>
                        <p className="text-sm text-gray-600 mb-4">
                            Permite repor o sistema para um estado anterior a partir de um backup guardado. <span className="font-semibold text-red-600">Atenção:</span> Esta ação é irreversível e substituirá por completo todos os dados atuais.
                        </p>
                        <div>
                           <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-dtc-blue">
                              <Upload size={16} className="text-gray-500" />
                              <span>Carregar Cópia JSON</span>
                              <input 
                                 type="file" 
                                 accept=".json" 
                                 onChange={handleImportBackup} 
                                 className="hidden" 
                              />
                           </label>
                        </div>
                    </div>
                 </div>
            </Card>
          </div>

          <Card title="Gerir Usuários" className="h-fit">
              <div className="space-y-4">
                  {users.map(u => (
                      <div key={u.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                          <div>
                              <p className="font-bold">{u.name}</p>
                              <p className="text-xs text-gray-500">@{u.username} • {u.role}</p>
                          </div>
                          {u.id !== currentUser.id && (
                              <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700">
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
                      Requer Chave Mestra
                  </div>
                  
                  <Input label="Nome" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                  <Input label="Usuário (Login)" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                  <Input label="Senha" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                  
                  <Select 
                    label="Privilégios"
                    options={[{value: 'staff', label: 'Funcionário (Registro/Consulta)'}, {value: 'admin', label: 'Administrador Total'}]}
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                  />
                  
                  <div className="border-t pt-4 mt-4">
                      <Input label="Chave Mestra *" type="password" value={masterKey} onChange={e => setMasterKey(e.target.value)} placeholder="Insira a chave mestra..." />
                  </div>

                  <Button className="w-full mt-2" onClick={handleCreateUser} icon={Save}>Criar Usuário</Button>
              </div>
          </Card>

          {/* Audit Logs Card */}
          <div className="lg:col-span-2">
            <Card title="Histórico de Auditoria & Alterações" className="relative">
              <div className="absolute top-4 right-4 text-dtc-blue opacity-10">
                <History size={40} />
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Rastreia ações críticas de segurança, alterações na base de dados, criação de utilizadores e operações financeiras efetuadas pelos administradores e colaboradores.
              </p>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Select
                    label="Filtrar por Usuário"
                    options={[
                      { value: 'all', label: 'Todos os Usuários' },
                      ...Array.from(new Set(auditLogs.map(l => l.username))).map(u => ({ value: u, label: u }))
                    ]}
                    value={filterUser}
                    onChange={e => setFilterUser(e.target.value)}
                  />
                </div>
                <div>
                  <Select
                    label="Filtrar por Tipo de Ação"
                    options={[
                      { value: 'all', label: 'Todas as Ações' },
                      { value: 'user', label: 'Gestão de Usuários' },
                      { value: 'backup', label: 'Cópias de Segurança' },
                      { value: 'student', label: 'Alunos (Matrículas / Edições)' },
                      { value: 'class', label: 'Turmas' },
                      { value: 'course', label: 'Cursos' },
                      { value: 'staff', label: 'Recursos Humanos / Colaboradores' },
                      { value: 'transaction', label: 'Transações Financeiras' },
                    ]}
                    value={filterAction}
                    onChange={e => setFilterAction(e.target.value)}
                  />
                </div>
                <div className="flex items-end justify-end gap-2 pb-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={RefreshCw}
                    onClick={() => {
                      setAuditLogs(StorageService.getAuditLogs());
                    }}
                  >
                    Atualizar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => {
                      const key = prompt("Insira a Chave Mestra para limpar o histórico de auditoria:");
                      if (key && StorageService.verifyMasterKey(key)) {
                        StorageService.clearAuditLogs();
                        setAuditLogs([]);
                        alert("Histórico de auditoria limpo com sucesso!");
                      } else if (key) {
                        alert("Chave Mestra inválida. Ação negada.");
                      }
                    }}
                  >
                    Limpar Logs
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data / Hora</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ação</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    {(() => {
                      const filtered = auditLogs.filter(log => {
                        const matchesUser = filterUser === 'all' || log.username === filterUser;
                        let matchesAction = filterAction === 'all';
                        if (filterAction === 'user') matchesAction = log.action.includes('user');
                        else if (filterAction === 'backup') matchesAction = log.action.includes('backup');
                        else if (filterAction === 'student') matchesAction = log.action.includes('student');
                        else if (filterAction === 'class') matchesAction = log.action.includes('class');
                        else if (filterAction === 'course') matchesAction = log.action.includes('course');
                        else if (filterAction === 'staff') matchesAction = log.action.includes('staff');
                        else if (filterAction === 'transaction') matchesAction = log.action.includes('transaction');
                        
                        return matchesUser && matchesAction;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                              Nenhum registo de auditoria encontrado com os filtros aplicados.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString('pt-PT')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-semibold text-gray-800">{log.username}</span>
                            <span className="text-xs text-gray-400 block">@{log.userRole}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getActionBadgeColor(log.action)}`}>
                              {getActionLabel(log.action)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-medium">
                            {log.description}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
      </div>
    </div>
  );
};