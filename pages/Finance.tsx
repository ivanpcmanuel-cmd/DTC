import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Modal } from '../components/UI';
import { StorageService } from '../services/storage';
import { Transaction, Student, Staff } from '../types';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Filter, X, Trash2, Lock } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const INCOMING_COLORS = ['#10B981', '#059669', '#34D399', '#6EE7B7', '#A7F3D0'];
const OUTGOING_COLORS = ['#EF4444', '#DC2626', '#F87171', '#FCA5A5', '#FECACA'];
const COMPARE_COLORS = ['#3B82F6', '#EF4444'];

export const Finance: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Transaction>>({ type: 'income', status: 'paid', date: new Date().toISOString().split('T')[0] });
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Filter State
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('dtc_current_user') || '{}');
    setIsAdmin(user?.role === 'admin');
    refreshData();

    window.addEventListener('dtc_data_updated', refreshData);
    return () => {
      window.removeEventListener('dtc_data_updated', refreshData);
    };
  }, []);

  const refreshData = () => {
    const data = StorageService.getTransactions().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllTransactions(data);
    setFilteredTransactions(data);
    setStudents(StorageService.getStudents());
    setStaffList(StorageService.getStaff());
  };

  const handleDeleteTransaction = (id: string) => {
      if (confirm('Tem certeza que deseja excluir esta transação?')) {
          StorageService.deleteTransaction(id);
          refreshData();
      }
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
        relatedStaffId: form.relatedStaffId,
        isAdminOnly: !!form.isAdminOnly
    };

    StorageService.saveTransaction(newTransaction);
    
    setIsModalOpen(false);
    refreshData();
  };

  // Categories allowed to be linked to a student
  const studentLinkableCategories = ['tuition', 'enrollment', 'material'];

  const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  // Administrative Hidden/Restricted information metrics calculations
  const restrictedIncomes = filteredTransactions.filter(t => t.type === 'income' && t.isAdminOnly);
  const restrictedExpenses = filteredTransactions.filter(t => t.type === 'expense' && t.isAdminOnly);

  const restrictedIncomeCount = restrictedIncomes.length;
  const restrictedIncomeSum = restrictedIncomes.reduce((acc, curr) => acc + curr.amount, 0);

  const restrictedExpenseCount = restrictedExpenses.length;
  const restrictedExpenseSum = restrictedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Pie Chart 1: Distribution of Incomes by Category
  const getIncomeCategoryLabel = (category: string) => {
    switch(category) {
      case 'tuition': return 'Propina Mensal';
      case 'enrollment': return 'Matrícula';
      case 'material': return 'Venda de Material';
      case 'other': return 'Outros';
      default: return category ? (category.charAt(0).toUpperCase() + category.slice(1)) : 'Outros';
    }
  };

  const incomeByCategoryMap: Record<string, number> = {};
  filteredTransactions.filter(t => t.type === 'income').forEach(t => {
    const label = getIncomeCategoryLabel(t.category || 'other');
    incomeByCategoryMap[label] = (incomeByCategoryMap[label] || 0) + t.amount;
  });

  const incomePieData = Object.keys(incomeByCategoryMap).map(name => ({
    name,
    value: incomeByCategoryMap[name]
  }));

  // Pie Chart 2: Distribution of Expenses by Category
  const getExpenseCategoryLabel = (category: string) => {
    switch(category) {
      case 'salary': return 'Salários';
      case 'rent': return 'Renda';
      case 'maintenance': return 'Manutenção';
      case 'tax': return 'Impostos';
      case 'other': return 'Outros';
      default: return category ? (category.charAt(0).toUpperCase() + category.slice(1)) : 'Outros';
    }
  };

  const expenseByCategoryMap: Record<string, number> = {};
  filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
    const label = getExpenseCategoryLabel(t.category || 'other');
    expenseByCategoryMap[label] = (expenseByCategoryMap[label] || 0) + t.amount;
  });

  const expensePieData = Object.keys(expenseByCategoryMap).map(name => ({
    name,
    value: expenseByCategoryMap[name]
  }));

  // Pie Chart 3: Incomes vs Liabilities/Passives (Expenses)
  const comparisonData = [
    { name: 'Entradas', value: income },
    { name: 'Passivos (Saídas)', value: expense }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500 flex flex-col justify-between">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 font-medium">Entradas (Filtro)</p>
                    <h3 className="text-2xl font-bold text-green-600">+{income.toLocaleString()} AOA</h3>
                </div>
                <ArrowUpCircle className="text-green-200" size={40} />
            </div>
            {isAdmin && (
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-red-700 font-medium bg-red-50/70 p-1.5 rounded">
                    <Lock size={12} className="text-red-500" />
                    <span>Oculto: <strong>{restrictedIncomeCount}</strong> ({restrictedIncomeSum.toLocaleString()} AOA)</span>
                </div>
            )}
         </div>
         <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500 flex flex-col justify-between">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 font-medium">Saídas (Filtro)</p>
                    <h3 className="text-2xl font-bold text-red-600">-{expense.toLocaleString()} AOA</h3>
                </div>
                <ArrowDownCircle className="text-red-200" size={40} />
            </div>
            {isAdmin && (
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-red-700 font-medium bg-red-50/70 p-1.5 rounded">
                    <Lock size={12} className="text-red-500" />
                    <span>Oculto: <strong>{restrictedExpenseCount}</strong> ({restrictedExpenseSum.toLocaleString()} AOA)</span>
                </div>
            )}
         </div>
         <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 flex flex-col justify-between">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 font-medium">Saldo (Filtro)</p>
                    <h3 className={`text-2xl font-bold ${(income - expense) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {(income - expense).toLocaleString()} AOA
                    </h3>
                </div>
                <DollarSign className="text-blue-200" size={40} />
            </div>
            {isAdmin && (
                <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500 font-medium bg-gray-50 p-1.5 rounded">
                    <span>Restritos total: <strong>{restrictedIncomeCount + restrictedExpenseCount}</strong> transações</span>
                </div>
            )}
         </div>
      </div>

      {/* Pizza / Pie Dashboards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card title="Distribuição de Entradas">
            <div className="h-64 flex flex-col justify-between">
              {incomePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart sm-size>
                    <Pie
                      data={incomePieData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={65}
                      dataKey="value"
                    >
                      {incomePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={INCOMING_COLORS[index % INCOMING_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `${Number(value).toLocaleString()} AOA`} />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                   Nenhuma entrada para este período.
                </div>
              )}
            </div>
         </Card>

         <Card title="Distribuição de Saídas">
            <div className="h-64 flex flex-col justify-between">
              {expensePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={65}
                      dataKey="value"
                    >
                      {expensePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={OUTGOING_COLORS[index % OUTGOING_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `${Number(value).toLocaleString()} AOA`} />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                   Nenhuma saída para este período.
                </div>
              )}
            </div>
         </Card>

         <Card title="Entradas vs Passivos (Saídas)">
            <div className="h-64 flex flex-col justify-between">
              {comparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={comparisonData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={({ name, percent }) => `${name.substring(0, 8)} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={65}
                      dataKey="value"
                    >
                      {comparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COMPARE_COLORS[index % COMPARE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `${Number(value).toLocaleString()} AOA`} />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                   Sem histórico para comparar.
                </div>
              )}
            </div>
         </Card>
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
             <Button onClick={() => { setForm({type: 'income', status: 'paid', date: new Date().toISOString().split('T')[0], isAdminOnly: false}); setIsModalOpen(true); }}>Nova Transação</Button>
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
                        {isAdmin && <th className="p-3">Ações</th>}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {filteredTransactions.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50">
                            <td className="p-3">{new Date(t.date).toLocaleDateString()}</td>
                            <td className="p-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{t.description}</span>
                                    {t.isAdminOnly && (
                                        <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 rounded border border-red-200 font-semibold inline-flex items-center gap-1">
                                            <Lock size={10} className="text-red-600" />
                                            Restrito Admin
                                        </span>
                                    )}
                                </div>
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
                            {isAdmin && (
                                <td className="p-3">
                                    <button 
                                        onClick={() => handleDeleteTransaction(t.id)}
                                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                                        title="Excluir Transação"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            )}
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

              {/* Toggle for Admin Only Visibility */}
              <div className="col-span-2 flex items-center gap-2 bg-red-50/50 p-3 rounded border border-red-100 mt-2">
                  <input 
                      type="checkbox" 
                      id="isAdminOnly"
                      checked={!!form.isAdminOnly}
                      onChange={e => setForm({...form, isAdminOnly: e.target.checked})}
                      className="w-4 h-4 text-dtc-blue cursor-pointer rounded border-gray-300 focus:ring-dtc-blue"
                  />
                  <label htmlFor="isAdminOnly" className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                      Restringido: Visível apenas para Administradores (Ocultar para funcionários)
                  </label>
              </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
              <Button onClick={handleSave}>Registrar</Button>
          </div>
      </Modal>
    </div>
  );
};