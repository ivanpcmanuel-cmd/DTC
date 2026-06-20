import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal } from '../components/UI';
import { StorageService } from '../services/storage';
import { Staff, Transaction, ClassSession } from '../types';
import { UserCheck, DollarSign, Clock, Trash2 } from 'lucide-react';

export const HR: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Staff>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshData = () => {
    setStaffList(StorageService.getStaff());
    setTransactions(StorageService.getTransactions());
    setClasses(StorageService.getClasses());
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('dtc_current_user') || '{}');
    setIsAdmin(user?.role === 'admin');
    refreshData();

    const handleUpdate = () => {
      refreshData();
    };
    window.addEventListener('dtc_storage_updated', handleUpdate);
    return () => {
      window.removeEventListener('dtc_storage_updated', handleUpdate);
    };
  }, []);

  const handleDeleteStaff = (id: string) => {
      if (confirm('Tem certeza que deseja excluir este funcionário?')) {
          StorageService.deleteStaff(id);
          refreshData();
          setIsModalOpen(false);
      }
  };

  const handleSave = () => {
    if(!form.name || !form.role) return;
    StorageService.saveStaff({
        id: form.id || Date.now().toString(),
        name: form.name,
        role: form.role,
        salary: Number(form.salary) || 0,
        evaluation: form.evaluation || '',
        assignedClassIds: form.assignedClassIds || []
    });
    refreshData();
    setIsModalOpen(false);
  };

  const getStaffTransactions = (staffId: string) => {
      return transactions
        .filter(t => t.relatedStaffId === staffId && t.type === 'expense')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getAssignedClasses = (staffId: string) => {
      return classes.filter(c => c.teacherId === staffId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Recursos Humanos</h1>
        {isAdmin && <Button onClick={() => { setForm({}); setIsModalOpen(true); }}>Novo Funcionário</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffList.map(person => (
              <Card key={person.id} className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-dtc-red"></div>
                  <div className="pl-4">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
                              {person.name.charAt(0)}
                          </div>
                          <div>
                              <h3 className="font-bold text-lg">{person.name}</h3>
                              <p className="text-sm text-dtc-blue font-medium">{person.role}</p>
                          </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                              <DollarSign size={16} className="mr-2" />
                              Salário: <span className="font-bold ml-1">{person.salary.toLocaleString()} AOA</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded italic border border-gray-100">
                              "{person.evaluation || 'Sem avaliação.'}"
                          </div>
                          {/* Quick Workload Overview */}
                          {getAssignedClasses(person.id).length > 0 && (
                              <div className="text-xs bg-blue-50 text-blue-800 p-1 rounded inline-block">
                                  {getAssignedClasses(person.id).length} Turmas Atribuídas
                              </div>
                          )}
                      </div>
                      <div className="mt-4 flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { setForm(person); setIsModalOpen(true); }}>
                              {isAdmin ? 'Editar Ficha' : 'Ver Ficha'}
                          </Button>
                          {isAdmin && (
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteStaff(person.id)}
                              >
                                  <Trash2 size={16} />
                              </Button>
                          )}
                      </div>
                  </div>
              </Card>
          ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isAdmin ? "Ficha do Colaborador" : "Ficha do Colaborador (Leitura)"}>
          <Input label="Nome Completo" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} disabled={!isAdmin} />
          <div className="grid grid-cols-2 gap-4">
              <Input label="Cargo/Função" value={form.role || ''} onChange={e => setForm({...form, role: e.target.value})} disabled={!isAdmin} />
              <Input label="Salário Base" type="number" value={form.salary || ''} onChange={e => setForm({...form, salary: Number(e.target.value)})} disabled={!isAdmin} />
          </div>
          <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação de Desempenho</label>
              <textarea 
                className="w-full border rounded p-2 disabled:bg-gray-100 disabled:text-gray-500" 
                rows={3} 
                value={form.evaluation || ''} 
                onChange={e => setForm({...form, evaluation: e.target.value})}
                placeholder="Notas sobre pontualidade, desempenho, etc..."
                disabled={!isAdmin}
              />
          </div>

          {/* Assigned Classes */}
          {form.id && (
              <div className="mt-6 border-t pt-4">
                 <h4 className="font-bold text-gray-700 mb-2 flex items-center"><Clock size={16} className="mr-2"/> Carga Horária & Turmas</h4>
                 {getAssignedClasses(form.id).length > 0 ? (
                     <ul className="space-y-2">
                         {getAssignedClasses(form.id).map(cls => (
                             <li key={cls.id} className="bg-blue-50 p-2 rounded text-sm flex justify-between items-center border border-blue-100">
                                 <div>
                                     <span className="font-bold text-dtc-blue block">{cls.name}</span>
                                     <span className="text-xs text-gray-500">{cls.schedule}</span>
                                 </div>
                                 <span className="text-xs bg-white px-2 py-1 rounded shadow-sm">
                                     Cap: {cls.capacity}
                                 </span>
                             </li>
                         ))}
                     </ul>
                 ) : (
                     <p className="text-gray-400 text-sm">Nenhuma turma atribuída.</p>
                 )}
              </div>
          )}

          {/* Transaction History for Staff */}
          {form.id && (
              <div className="mt-6 border-t pt-4">
                  <h4 className="font-bold text-gray-700 mb-2">Histórico de Pagamentos</h4>
                  <div className="bg-gray-50 p-3 rounded mb-2 flex justify-between items-center">
                      <span className="text-sm">Total Pago</span>
                      <span className="font-bold text-red-600">
                          {getStaffTransactions(form.id).reduce((acc, t) => acc + t.amount, 0).toLocaleString()} AOA
                      </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto border rounded bg-white">
                      <table className="w-full text-xs text-left">
                          <thead className="bg-gray-100">
                              <tr>
                                  <th className="p-2">Data</th>
                                  <th className="p-2">Descrição</th>
                                  <th className="p-2">Valor</th>
                              </tr>
                          </thead>
                          <tbody>
                              {getStaffTransactions(form.id).map(t => (
                                  <tr key={t.id} className="border-b last:border-0">
                                      <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                                      <td className="p-2">{t.description}</td>
                                      <td className="p-2 font-bold text-gray-600">{t.amount.toLocaleString()}</td>
                                  </tr>
                              ))}
                              {getStaffTransactions(form.id).length === 0 && (
                                  <tr><td colSpan={3} className="p-2 text-center text-gray-400">Nenhum registro.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          <div className="mt-6 flex justify-end">
              {isAdmin && <Button onClick={handleSave} icon={UserCheck}>Salvar Dados</Button>}
              {!isAdmin && <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Fechar</Button>}
          </div>
      </Modal>
    </div>
  );
};