import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Modal } from '../components/UI';
import { StorageService } from '../services/storage';
import { Transaction, Student, Staff } from '../types';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Filter, X } from 'lucide-react';

export const Finance: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Transaction>>({ type: 'income', status: 'paid', date: new Date().toISOString().split('T')[0] });
  
  // Filter State
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const data = StorageService.getTransactions().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllTransactions(data);
    setFilteredTransactions(data);
    setStudents(StorageService.getStudents());
    setStaffList(StorageService.getStaff());
  };

  const applyFilter = () => {
    if (!filterDate) {
        setFilteredTransactions(allTransactions);
        return;
    }
    const filtered = allTransactions.filter(t => t.date === filterDate);
    setFilteredTransactions(filtered);
  };

  const clearFilter = () => {
      setFilterDate('');
      setFilteredTransactions(allTransactions);
  };

  const handleSave = () => {
    if (!form.amount || !form.description) return alert('Valor e descrição obrigatórios');
    
    // Create Transaction
    const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: form.type as 'income' | 'expense',
        category: form.category as any,
        amount: Number(form.amount),
        date: form.date || new Date().toISOString(),
        description: form.description,
        status: form.status as 'paid' | 'pending',
        relatedStudentId: form.relatedStudentId,
        relatedStaffId: form.relatedStaffId
    };

    StorageService.saveTransaction(newTransaction);
    
    setIsModalOpen(false);
    refreshData();
  };

  // Categories allowed to be linked to a student
  const studentLinkableCategories = ['tuition', 'enrollment', 'material'];

  const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500 flex items-center justify-between">
            <div>
                <p className="text-gray-500">Entradas (Filtro)</p>
                <h3 className="text-2xl font-bold text-green-600">+{income.toLocaleString()} AOA</h3>
            </div>
            <ArrowUpCircle className="text-green-200" size={40} />
         </div>
         <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500 flex items-center justify-between">
            <div>
                <p className="text-gray-500">Saídas (Filtro)</p>
                <h3 className="text-2xl font-bold text-red-600">-{expense.toLocaleString()} AOA</h3>
            </div>
            <ArrowDownCircle className="text-red-200" size={40} />
         </div>
         <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 flex items-center justify-between">
            <div>
                <p className="text-gray-500">Saldo (Filtro)</p>
                <h3 className={`text-2xl font-bold ${(income - expense) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {(income - expense).toLocaleString()} AOA
                </h3>
            </div>
            <DollarSign className="text-blue-200" size={40} />
         </div>
      </div>

      <Card title="Movimentos Financeiros">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
             <div className="flex items-end gap-2">
                 <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Filtrar por Dia</label>
                    <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dtc-blue" 
                    />
                 </div>
                 <Button variant="secondary" size="sm" icon={Filter} onClick={applyFilter}>Aplicar</Button>
                 {filterDate && <Button variant="ghost" size="sm" icon={X} onClick={clearFilter}>Limpar</Button>}
             </div>
             <Button onClick={() => { setForm({type: 'income', status: 'paid', date: new Date().toISOString().split('T')[0]}); setIsModalOpen(true); }}>Nova Transação</Button>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 uppercase text-gray-500">
                    <tr>
                        <th className="p-3">Data</th>
                        <th className="p-3">Descrição</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {filteredTransactions.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50">
                            <td className="p-3">{new Date(t.date).toLocaleDateString()}</td>
                            <td className="p-3">
                                {t.description}
                                {t.relatedStudentId && <span className="block text-xs text-gray-400">Ref Aluno: {students.find(s=>s.id === t.relatedStudentId)?.fullName}</span>}
                                {t.relatedStaffId && <span className="block text-xs text-gray-400">Ref Staff: {staffList.find(s=>s.id === t.relatedStaffId)?.name}</span>}
                            </td>
                            <td className="p-3 capitalize">{t.category === 'tuition' ? 'Propina Mensal' : t.category}</td>
                            <td className={`p-3 font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                            </td>
                            <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs ${t.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {t.status === 'paid' ? 'Pago' : 'Pendente'}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                        <tr><td colSpan={5} className="p-4 text-center text-gray-400">Nenhum movimento encontrado para esta data.</td></tr>
                    )}
                </tbody>
            </table>
         </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Transação">
          <div className="grid grid-cols-2 gap-4">
              <Select 
                label="Tipo" 
                options={[{value: 'income', label: 'Entrada'}, {value: 'expense', label: 'Saída'}]}
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value as any, category: undefined, relatedStudentId: ''})}
              />
              <Input label="Data" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              
              <div className="col-span-2">
                 <Select 
                    label="Categoria"
                    options={
                        form.type === 'income' 
                        ? [
                            {value: 'tuition', label: 'Propina Mensal'},
                            {value: 'enrollment', label: 'Matrícula'},
                            {value: 'material', label: 'Venda de Material'},
                            {value: 'other', label: 'Outros'}
                          ]
                        : [
                            {value: 'salary', label: 'Salários'},
                            {value: 'rent', label: 'Renda'},
                            {value: 'maintenance', label: 'Manutenção'},
                            {value: 'tax', label: 'Impostos'},
                            {value: 'other', label: 'Outros'}
                          ]
                    }
                    value={form.category || ''}
                    onChange={e => setForm({...form, category: e.target.value as any})}
                 />
              </div>

              <div className="col-span-2">
                  <Input label="Descrição" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              
              <Input label="Valor (AOA)" type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
              <Select 
                label="Status" 
                options={[{value: 'paid', label: 'Pago/Recebido'}, {value: 'pending', label: 'Pendente'}]}
                value={form.status}
                onChange={e => setForm({...form, status: e.target.value as any})}
              />

              {/* Only show Student Link for specific categories */}
              {form.type === 'income' && form.category && studentLinkableCategories.includes(form.category) && (
                  <div className="col-span-2 bg-blue-50 p-2 rounded border border-blue-100">
                      <Select 
                        label="Vincular Aluno (Obrigatório para esta categoria)"
                        options={[{value: '', label: 'Selecione...'}, ...students.map(s => ({value: s.id, label: s.fullName}))]}
                        value={form.relatedStudentId || ''}
                        onChange={e => setForm({...form, relatedStudentId: e.target.value})}
                      />
                  </div>
              )}

              {form.type === 'expense' && (
                  <div className="col-span-2">
                      <Select 
                        label="Vincular Colaborador (Opcional)"
                        options={[{value: '', label: 'Nenhum'}, ...staffList.map(s => ({value: s.id, label: s.name}))]}
                        value={form.relatedStaffId || ''}
                        onChange={e => setForm({...form, relatedStaffId: e.target.value})}
                      />
                  </div>
              )}
          </div>
          <div className="mt-6 flex justify-end gap-2">
              <Button onClick={handleSave}>Registrar</Button>
          </div>
      </Modal>
    </div>
  );
};