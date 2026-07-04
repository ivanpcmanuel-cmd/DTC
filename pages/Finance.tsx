import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Modal } from '../components/UI';
import { StorageService } from '../services/storage';
import { Transaction, Student, Staff, Bank } from '../types';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Filter, X, Trash2, Lock, Plus, ArrowLeftRight, Building } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const INCOMING_COLORS = ['#10B981', '#059669', '#34D399', '#6EE7B7', '#A7F3D0'];
const OUTGOING_COLORS = ['#EF4444', '#DC2626', '#F87171', '#FCA5A5', '#FECACA'];
const COMPARE_COLORS = ['#3B82F6', '#EF4444'];

export const Finance: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<{ type: 'caixa' | 'banco'; id?: string }>({ type: 'caixa' });
  const [appliedDate, setAppliedDate] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Transaction>>({ 
    type: 'income', 
    status: 'paid', 
    date: new Date().toISOString().split('T')[0],
    destinationType: 'caixa',
    bankId: ''
  });
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Banks and Transfers State
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromType: 'caixa',
    fromBankId: '',
    toType: 'banco',
    toBankId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: 'Transferência de Fundos'
  });
  
  // Filter State
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('dtc_current_user') || '{}');
    const isUserAdmin = user?.role === 'admin';
    setIsAdmin(isUserAdmin);
    if (!isUserAdmin) {
      setSelectedAccount({ type: 'caixa' });
    }
    refreshData();
  }, []);

  const refreshData = () => {
    const data = StorageService.getTransactions().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllTransactions(data);
    setStudents(StorageService.getStudents());
    setStaffList(StorageService.getStaff());
    setBanks(StorageService.getBanks());
  };

  const handleDeleteTransaction = (id: string) => {
      if (confirm('Tem certeza que deseja excluir esta transação?')) {
          StorageService.deleteTransaction(id);
          refreshData();
      }
  };

  const applyFilter = () => {
    setAppliedDate(filterDate);
  };

  const clearFilter = () => {
      setFilterDate('');
      setAppliedDate('');
  };

  // Create custom bank
  const handleCreateBank = () => {
    if (!newBankName.trim()) return alert('Nome do banco obrigatório');
    const newBank: Bank = {
      id: Date.now().toString(),
      name: newBankName.trim()
    };
    StorageService.saveBank(newBank);
    setNewBankName('');
    refreshData();
  };

  const handleDeleteBank = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este banco? Isso não afetará transações passadas.')) {
      StorageService.deleteBank(id);
      if (selectedAccount.type === 'banco' && selectedAccount.id === id) {
        setSelectedAccount({ type: 'caixa' });
      }
      refreshData();
    }
  };

  // Perform transfer
  const handleExecuteTransfer = () => {
    const amountVal = Number(transferForm.amount);
    if (!amountVal || amountVal <= 0) {
      alert('Por favor insira um valor válido de transferência.');
      return;
    }
    if (transferForm.fromType === transferForm.toType) {
      if (transferForm.fromType === 'caixa' || transferForm.fromBankId === transferForm.toBankId) {
        alert('Origem e destino não podem ser iguais.');
        return;
      }
    }

    const tDate = transferForm.date || new Date().toISOString().split('T')[0];
    const desc = transferForm.description || 'Transferência de Fundos';

    const fromLabel = transferForm.fromType === 'caixa' ? 'Caixa' : (banks.find(b => b.id === transferForm.fromBankId)?.name || 'Banco');
    const toLabel = transferForm.toType === 'caixa' ? 'Caixa' : (banks.find(b => b.id === transferForm.toBankId)?.name || 'Banco');

    // 1. Expense from the SOURCE account
    const expenseTx: Transaction = {
      id: 'trans-exp-' + Date.now().toString(),
      type: 'expense',
      category: 'transfer',
      amount: amountVal,
      date: tDate,
      description: `${desc} -> De ${fromLabel} para ${toLabel} (Origem)`,
      status: 'paid',
      destinationType: transferForm.fromType as 'caixa' | 'banco',
      bankId: transferForm.fromType === 'banco' ? transferForm.fromBankId : undefined,
      isTransfer: true
    };

    // 2. Income to the DESTINATION account
    const incomeTx: Transaction = {
      id: 'trans-inc-' + (Date.now() + 1).toString(),
      type: 'income',
      category: 'transfer',
      amount: amountVal,
      date: tDate,
      description: `${desc} -> De ${fromLabel} para ${toLabel} (Destino)`,
      status: 'paid',
      destinationType: transferForm.toType as 'caixa' | 'banco',
      bankId: transferForm.toType === 'banco' ? transferForm.toBankId : undefined,
      isTransfer: true
    };

    StorageService.saveTransaction(expenseTx);
    StorageService.saveTransaction(incomeTx);

    setIsTransferModalOpen(false);
    refreshData();
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
        isAdminOnly: !!form.isAdminOnly,
        destinationType: (form.destinationType || 'caixa') as 'caixa' | 'banco',
        bankId: form.destinationType === 'banco' ? form.bankId : undefined
    };

    StorageService.saveTransaction(newTransaction);
    
    setIsModalOpen(false);
    refreshData();
  };

  // Helper calculations for overall separate balances
  const getBalances = () => {
    let caixa = 0;
    let bancoTotal = 0;
    const bankBreakdown: Record<string, number> = {};
    
    banks.forEach(b => {
      bankBreakdown[b.id] = 0;
    });

    allTransactions.forEach(t => {
      const dest = t.destinationType || 'caixa';
      const isPaid = t.status === 'paid';
      if (!isPaid) return;

      const val = t.amount;
      if (dest === 'caixa') {
        if (t.type === 'income') {
          caixa += val;
        } else {
          caixa -= val;
        }
      } else if (dest === 'banco') {
        if (t.type === 'income') {
          bancoTotal += val;
          if (t.bankId) {
            bankBreakdown[t.bankId] = (bankBreakdown[t.bankId] || 0) + val;
          }
        } else {
          bancoTotal -= val;
          if (t.bankId) {
            bankBreakdown[t.bankId] = (bankBreakdown[t.bankId] || 0) - val;
          }
        }
      }
    });

    return {
      caixa,
      bancoTotal,
      total: caixa + bancoTotal,
      bankBreakdown
    };
  };

  const balances = getBalances();

  const getTransactionAccountBadge = (t: Transaction) => {
    if (!t.destinationType || t.destinationType === 'caixa') {
      return (
        <span className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium inline-flex items-center gap-1">
          💵 Caixa
        </span>
      );
    }
    const bank = banks.find(b => b.id === t.bankId);
    return (
      <span className="px-1.5 py-0.5 text-xs bg-blue-50 text-dtc-blue rounded border border-blue-200 font-medium inline-flex items-center gap-1">
        🏦 {bank ? bank.name : 'Banco'}
      </span>
    );
  };

  // Categories allowed to be linked to a student
  const studentLinkableCategories = ['tuition', 'enrollment', 'material'];

  // 1. Filter allTransactions by selected account (Caixa vs specific Bank)
  const accountTransactions = allTransactions.filter(t => {
    const effectiveType = isAdmin ? selectedAccount.type : 'caixa';
    if (effectiveType === 'caixa') {
      return !t.destinationType || t.destinationType === 'caixa';
    } else {
      return t.destinationType === 'banco' && t.bankId === selectedAccount.id;
    }
  });

  // 2. Filter by applied date if any
  const displayedTransactions = appliedDate
    ? accountTransactions.filter(t => t.date === appliedDate)
    : accountTransactions;

  const income = displayedTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const expense = displayedTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  // Administrative Hidden/Restricted information metrics calculations
  const restrictedIncomes = displayedTransactions.filter(t => t.type === 'income' && t.isAdminOnly);
  const restrictedExpenses = displayedTransactions.filter(t => t.type === 'expense' && t.isAdminOnly);

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
  displayedTransactions.filter(t => t.type === 'income').forEach(t => {
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
  displayedTransactions.filter(t => t.type === 'expense').forEach(t => {
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

  // Derive selected account name for dynamic headings
  const activeAccountName = (!isAdmin || selectedAccount.type === 'caixa') 
    ? 'Caixa Geral' 
    : (banks.find(b => b.id === selectedAccount.id)?.name || 'Banco');

  return (
    <div className="space-y-6">
      {/* Cards de Contas interativas */}
      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          Conta Ativa de Movimentação
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => setSelectedAccount({ type: 'caixa' })}
            className={`p-4 rounded-xl shadow-sm border-2 cursor-pointer transition-all ${
              selectedAccount.type === 'caixa'
                ? 'border-dtc-blue bg-blue-50/40 ring-2 ring-dtc-blue/10 scale-[1.01]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${selectedAccount.type === 'caixa' ? 'bg-blue-100 text-dtc-blue' : 'bg-slate-100 text-slate-500'}`}>
                <DollarSign size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">💵 Caixa Geral</p>
                <h4 className="text-lg font-bold text-slate-800 truncate">{balances.caixa.toLocaleString()} AOA</h4>
              </div>
            </div>
          </div>

          {isAdmin && banks.map(b => {
            const isSelected = selectedAccount.type === 'banco' && selectedAccount.id === b.id;
            const balance = balances.bankBreakdown[b.id] || 0;
            return (
              <div 
                key={b.id}
                onClick={() => setSelectedAccount({ type: 'banco', id: b.id })}
                className={`p-4 rounded-xl shadow-sm border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-dtc-blue bg-blue-50/40 ring-2 ring-dtc-blue/10 scale-[1.01]'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-blue-100 text-dtc-blue' : 'bg-slate-100 text-slate-500'}`}>
                    <Building size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">🏦 {b.name}</p>
                    <h4 className="text-lg font-bold text-slate-800 truncate">{balance.toLocaleString()} AOA</h4>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500 flex flex-col justify-between">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 font-medium truncate">Entradas ({activeAccountName})</p>
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
                    <p className="text-gray-500 font-medium truncate">Saídas ({activeAccountName})</p>
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
                    <p className="text-gray-500 font-medium truncate">Saldo ({activeAccountName})</p>
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
             
             <div className="flex flex-wrap items-center gap-2">
                 {isAdmin && (
                     <>
                         <Button variant="secondary" size="sm" icon={Building} onClick={() => setIsBankModalOpen(true)}>Gerir Bancos</Button>
                         <Button variant="secondary" size="sm" icon={ArrowLeftRight} onClick={() => {
                             setTransferForm({
                                 fromType: 'caixa',
                                 fromBankId: banks[0]?.id || '',
                                 toType: 'banco',
                                 toBankId: banks[0]?.id || '',
                                 amount: '',
                                 date: new Date().toISOString().split('T')[0],
                                 description: 'Transferência de Fundos'
                             });
                             setIsTransferModalOpen(true);
                         }}>Transferir</Button>
                     </>
                 )}
                 <Button size="sm" icon={Plus} onClick={() => { 
                     setForm({
                         type: 'income', 
                         status: 'paid', 
                         date: new Date().toISOString().split('T')[0], 
                         isAdminOnly: false,
                         destinationType: 'caixa',
                         bankId: banks[0]?.id || ''
                     }); 
                     setIsModalOpen(true); 
                 }}>Nova Transação</Button>
             </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 uppercase text-gray-500">
                    <tr>
                        <th className="p-3">Data</th>
                        <th className="p-3">Descrição</th>
                        <th className="p-3">Conta</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3">Status</th>
                        {isAdmin && <th className="p-3">Ações</th>}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {displayedTransactions.map(t => (
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
                            <td className="p-3">
                                {getTransactionAccountBadge(t)}
                            </td>
                            <td className="p-3 capitalize">{t.category === 'tuition' ? 'Propina Mensal' : t.category === 'transfer' ? 'Transferência' : t.category}</td>
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
                    {displayedTransactions.length === 0 && (
                        <tr><td colSpan={7} className="p-4 text-center text-gray-400">Nenhum movimento encontrado para esta conta ou data selecionada.</td></tr>
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

              {isAdmin ? (
                <>
                  <Select 
                    label="Conta de Movimentação" 
                    options={[{value: 'caixa', label: '💵 Caixa Físico'}, {value: 'banco', label: '🏦 Conta Bancária'}]}
                    value={form.destinationType || 'caixa'}
                    onChange={e => setForm({...form, destinationType: e.target.value as any, bankId: e.target.value === 'banco' ? (banks[0]?.id || '') : undefined})}
                  />

                  {form.destinationType === 'banco' ? (
                    <Select 
                      label="Selecionar Banco" 
                      options={banks.map(b => ({value: b.id, label: b.name}))}
                      value={form.bankId || ''}
                      onChange={e => setForm({...form, bankId: e.target.value})}
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded border border-gray-100 flex items-center justify-center text-xs text-gray-400 font-medium">
                      Caixa Físico Geral
                    </div>
                  )}
                </>
              ) : (
                <div className="col-span-2 p-3.5 bg-blue-50/50 rounded-xl border border-blue-100/70 flex flex-col justify-center text-xs font-semibold text-blue-700">
                  <span className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Conta de Movimentação</span>
                  💵 Caixa Físico Geral
                </div>
              )}
              
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

      {/* Modal - Gerir Bancos */}
      <Modal isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} title="Gerir Bancos">
          <div className="space-y-4">
              <div className="flex flex-col gap-2">
                  <Input 
                      label="Nome do Novo Banco" 
                      placeholder="Ex: Banco Sol, Keve" 
                      value={newBankName} 
                      onChange={e => setNewBankName(e.target.value)} 
                  />
                  <div className="flex justify-end">
                      <Button onClick={handleCreateBank}>Criar Banco</Button>
                  </div>
              </div>
              
              <div className="border border-gray-100 rounded-lg divide-y max-h-60 overflow-y-auto">
                  <div className="p-2 bg-gray-50 text-xs font-semibold text-gray-400 uppercase">Lista de Bancos</div>
                  {banks.map(b => (
                      <div key={b.id} className="p-3 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                          <span className="font-semibold text-gray-700 flex items-center gap-2">
                              <Building size={14} className="text-gray-400" />
                              {b.name}
                          </span>
                          <button 
                              onClick={() => handleDeleteBank(b.id)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                              title="Excluir Banco"
                          >
                              <Trash2 size={15} />
                          </button>
                      </div>
                  ))}
                  {banks.length === 0 && (
                      <p className="p-4 text-center text-gray-400 text-xs italic">Nenhum banco cadastrado.</p>
                  )}
              </div>
          </div>
      </Modal>

      {/* Modal - Transferência de Fundos */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Nova Transferência de Conta">
          <div className="space-y-4 grid grid-cols-2 gap-4">
              <div className="col-span-2 text-xs text-gray-500 bg-slate-50 p-2.5 rounded border border-gray-100">
                Ao efetuar uma transferência, serão gerados de forma automática dois lançamentos (mútuo débito e crédito) para equilibrar os saldos da origem e do destino.
              </div>

              {/* Origem */}
              <div className="col-span-2 md:col-span-1 p-3 bg-red-50/30 border border-red-100/50 rounded-lg space-y-2">
                <span className="text-xs font-bold text-red-800 uppercase block">1. Conta de Origem (Saída)</span>
                <Select 
                  label="Tipo de Conta" 
                  options={[{value: 'caixa', label: '💵 Caixa Físico'}, {value: 'banco', label: '🏦 Banco'}]}
                  value={transferForm.fromType}
                  onChange={e => setTransferForm({...transferForm, fromType: e.target.value, fromBankId: e.target.value === 'banco' ? (banks[0]?.id || '') : ''})}
                />
                {transferForm.fromType === 'banco' && (
                  <Select 
                    label="Selecionar Banco" 
                    options={banks.map(b => ({value: b.id, label: b.name}))}
                    value={transferForm.fromBankId}
                    onChange={e => setTransferForm({...transferForm, fromBankId: e.target.value})}
                  />
                )}
              </div>

              {/* Destino */}
              <div className="col-span-2 md:col-span-1 p-3 bg-emerald-50/30 border border-emerald-100/50 rounded-lg space-y-2">
                <span className="text-xs font-bold text-emerald-800 uppercase block">2. Conta de Destino (Entrada)</span>
                <Select 
                  label="Tipo de Conta" 
                  options={[{value: 'caixa', label: '💵 Caixa Físico'}, {value: 'banco', label: '🏦 Banco'}]}
                  value={transferForm.toType}
                  onChange={e => setTransferForm({...transferForm, toType: e.target.value, toBankId: e.target.value === 'banco' ? (banks[0]?.id || '') : ''})}
                />
                {transferForm.toType === 'banco' && (
                  <Select 
                    label="Selecionar Banco" 
                    options={banks.map(b => ({value: b.id, label: b.name}))}
                    value={transferForm.toBankId}
                    onChange={e => setTransferForm({...transferForm, toBankId: e.target.value})}
                  />
                )}
              </div>

              <div className="col-span-2">
                <Input 
                  label="Descrição da Transferência" 
                  value={transferForm.description} 
                  onChange={e => setTransferForm({...transferForm, description: e.target.value})} 
                />
              </div>

              <Input 
                label="Valor a Transferir (AOA)" 
                type="number" 
                value={transferForm.amount} 
                onChange={e => setTransferForm({...transferForm, amount: e.target.value})} 
              />

              <Input 
                label="Data" 
                type="date" 
                value={transferForm.date} 
                onChange={e => setTransferForm({...transferForm, date: e.target.value})} 
              />
          </div>
          <div className="mt-6 flex justify-end gap-2">
              <Button onClick={handleExecuteTransfer}>Transferir</Button>
          </div>
      </Modal>
    </div>
  );
};