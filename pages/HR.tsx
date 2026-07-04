import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Select } from '../components/UI';
import { StorageService } from '../services/storage';
import { Staff, Transaction, ClassSession, SADFEvaluation, Bank } from '../types';
import { 
  UserCheck, DollarSign, Clock, Trash2,
  Calendar, Star, FileText, CheckCircle2, 
  AlertTriangle, Award, Users, Plus, 
  TrendingUp, HelpCircle, Check, X, ArrowRight, Building
} from 'lucide-react';

const getMonthLabel = (monthYear: string) => {
  if (!monthYear) return '';
  const [year, month] = monthYear.split('-');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const mIdx = parseInt(month, 10) - 1;
  return `${months[mIdx] || ''} de ${year}`;
};

const calculateSADFMetrics = (evalu: Partial<SADFEvaluation>) => {
  const revenue = evalu.classRevenue || 0;
  
  // 1. Assiduidade (2%)
  const hasAssiduidadeBonus = (evalu.unjustifiedAbsences || 0) === 0 && (evalu.totalDelayMinutes || 0) <= 15;
  const assiduidadeBonusPct = hasAssiduidadeBonus ? 2 : 0;
  const assiduidadeBonusAmt = revenue * (assiduidadeBonusPct / 100);
  
  // 2. Retenção (3%)
  const initial = evalu.initialStudents || 0;
  const dropouts = evalu.dropouts || 0;
  const retentionRate = initial > 0 ? ((initial - dropouts) / initial) * 100 : 100;
  
  let retentionBonusPct = 0;
  if (retentionRate >= 95) {
    retentionBonusPct = 3;
  } else if (retentionRate >= 90) {
    retentionBonusPct = 1.5;
  } else {
    retentionBonusPct = 0;
  }
  const retentionBonusAmt = revenue * (retentionBonusPct / 100);
  
  // 3. Questionário (Média)
  const ratings = evalu.studentRatings || { domain: 5, clarity: 5, punctuality: 5, relation: 5, dynamics: 5 };
  const avgStudentScore = (ratings.domain + ratings.clarity + ratings.punctuality + ratings.relation + ratings.dynamics) / 5;
  
  // 4. Excelência Pedagógica (5%)
  const isExcelenciaEligible = avgStudentScore >= 4.5 && evalu.auditResult === 'favoravel';
  const excelenciaBonusPct = isExcelenciaEligible ? 5 : 0;
  const excelenciaBonusAmt = revenue * (excelenciaBonusPct / 100);
  
  // Base component (20%)
  const basePct = 20;
  const baseAmt = revenue * (basePct / 100);
  
  const totalPct = basePct + assiduidadeBonusPct + retentionBonusPct + excelenciaBonusPct;
  const totalAmt = baseAmt + assiduidadeBonusAmt + retentionBonusAmt + excelenciaBonusAmt;
  
  return {
    revenue,
    hasAssiduidadeBonus,
    assiduidadeBonusPct,
    assiduidadeBonusAmt,
    retentionRate,
    retentionBonusPct,
    retentionBonusAmt,
    avgStudentScore,
    isExcelenciaEligible,
    excelenciaBonusPct,
    excelenciaBonusAmt,
    basePct,
    baseAmt,
    totalPct,
    totalAmt
  };
};

export const HR: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Staff>>({});
  
  // SADF states
  const [activeTab, setActiveTab] = useState<'colaboradores' | 'sadf'>('colaboradores');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [sadfEvaluations, setSadfEvaluations] = useState<SADFEvaluation[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  
  // Evaluation Modal states
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Staff | null>(null);
  const [evalForm, setEvalForm] = useState<Partial<SADFEvaluation>>({});
  const [paymentAccount, setPaymentAccount] = useState<{ type: 'caixa' | 'banco'; bankId?: string }>({ type: 'caixa' });

  // Report Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportEval, setSelectedReportEval] = useState<SADFEvaluation | null>(null);

  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('dtc_current_user') || '{}');
      return user?.role === 'admin';
    } catch {
      return false;
    }
  });

  const refreshAllData = () => {
    setStaffList(StorageService.getStaff());
    setTransactions(StorageService.getTransactions());
    setClasses(StorageService.getClasses());
    setSadfEvaluations(StorageService.getSADFEvaluations());
    setBanks(StorageService.getBanks());
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('dtc_current_user') || '{}');
    const roleIsAdmin = user?.role === 'admin';
    setIsAdmin(roleIsAdmin);
    if (roleIsAdmin) {
      refreshAllData();
    }
  }, []);

  const handleDeleteStaff = (id: string) => {
      const staffToDelete = staffList.find(s => s.id === id);
      if (confirm('Tem certeza que deseja excluir este funcionário?')) {
          StorageService.deleteStaff(id);
          StorageService.addAuditLog('staff_delete', `Eliminou o registo do colaborador ${staffToDelete?.name || id}`);
          refreshAllData();
          setIsModalOpen(false);
      }
  };

  const handleSave = () => {
    if(!form.name || !form.role) return;
    const isEditing = !!form.id;
    StorageService.saveStaff({
        id: form.id || Date.now().toString(),
        name: form.name,
        role: form.role,
        salary: Number(form.salary) || 0,
        evaluation: form.evaluation || '',
        assignedClassIds: form.assignedClassIds || []
    });
    StorageService.addAuditLog('staff_save', `${isEditing ? 'Atualizou os dados do' : 'Registou o'} colaborador ${form.name}`);
    refreshAllData();
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

  // SADF core logic
  const trainers = staffList.filter(s => 
    s.role.toLowerCase().includes('formador') || 
    s.role.toLowerCase().includes('teacher') || 
    s.role.toLowerCase().includes('professor')
  );

  const handleOpenEval = (trainer: Staff) => {
    setSelectedTrainer(trainer);
    const existingEval = sadfEvaluations.find(e => e.staffId === trainer.id && e.monthYear === selectedMonth);
    
    setEvalForm({
      id: existingEval?.id || Date.now().toString(),
      staffId: trainer.id,
      monthYear: selectedMonth,
      classRevenue: existingEval?.classRevenue || 0,
      unjustifiedAbsences: existingEval?.unjustifiedAbsences || 0,
      totalDelayMinutes: existingEval?.totalDelayMinutes || 0,
      initialStudents: existingEval?.initialStudents || 10,
      dropouts: existingEval?.dropouts || 0,
      studentRatings: existingEval?.studentRatings || {
        domain: 5,
        clarity: 5,
        punctuality: 5,
        relation: 5,
        dynamics: 5,
      },
      auditResult: existingEval?.auditResult || 'favoravel',
      feedbackNotes: existingEval?.feedbackNotes || '',
      paymentProcessed: existingEval?.paymentProcessed || false,
      transactionId: existingEval?.transactionId || undefined
    });
    
    setPaymentAccount({ type: 'caixa' });
    setIsEvalModalOpen(true);
  };

  const handleSaveEval = () => {
    if (!selectedTrainer || !evalForm.id) return;
    
    const finalEval: SADFEvaluation = {
      id: evalForm.id,
      staffId: selectedTrainer.id,
      monthYear: selectedMonth,
      classRevenue: Number(evalForm.classRevenue) || 0,
      unjustifiedAbsences: Number(evalForm.unjustifiedAbsences) || 0,
      totalDelayMinutes: Number(evalForm.totalDelayMinutes) || 0,
      initialStudents: Number(evalForm.initialStudents) || 0,
      dropouts: Number(evalForm.dropouts) || 0,
      studentRatings: {
        domain: Number(evalForm.studentRatings?.domain) || 5,
        clarity: Number(evalForm.studentRatings?.clarity) || 5,
        punctuality: Number(evalForm.studentRatings?.punctuality) || 5,
        relation: Number(evalForm.studentRatings?.relation) || 5,
        dynamics: Number(evalForm.studentRatings?.dynamics) || 5,
      },
      auditResult: (evalForm.auditResult as any) || 'favoravel',
      feedbackNotes: evalForm.feedbackNotes || '',
      paymentProcessed: !!evalForm.paymentProcessed,
      transactionId: evalForm.transactionId
    };
    
    StorageService.saveSADFEvaluation(finalEval);
    refreshAllData();
    setIsEvalModalOpen(false);
  };

  const handleProcessPayment = (trainer: Staff, evalu: SADFEvaluation) => {
    if (evalu.paymentProcessed) {
      alert('O pagamento para este mês já foi processado.');
      return;
    }
    
    const metrics = calculateSADFMetrics(evalu);
    if (metrics.totalAmt <= 0) {
      alert('O valor a pagar deve ser maior que 0 AOA. Certifique-se de que a Receita da Turma foi preenchida.');
      return;
    }
    
    const confirmPayment = confirm(
      `Deseja processar o salário de ${trainer.name} referente a ${getMonthLabel(selectedMonth)}?\n\n` +
      `Receita da Turma: ${metrics.revenue.toLocaleString()} AOA\n` +
      `Total a Receber (${metrics.totalPct}%): ${metrics.totalAmt.toLocaleString()} AOA\n\n` +
      `Conta Selecionada: ${paymentAccount.type === 'caixa' ? '💵 Caixa Físico' : `🏦 Banco (${banks.find(b => b.id === paymentAccount.bankId)?.name || 'Selecionado'})`}`
    );
    
    if (!confirmPayment) return;
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'expense',
      category: 'salary',
      amount: metrics.totalAmt,
      date: new Date().toISOString().split('T')[0],
      description: `SADF - Processamento Salarial - ${trainer.name} - ${getMonthLabel(selectedMonth)}`,
      relatedStaffId: trainer.id,
      status: 'paid',
      isAdminOnly: true,
      destinationType: paymentAccount.type,
      bankId: paymentAccount.type === 'banco' ? paymentAccount.bankId : undefined
    };
    
    StorageService.saveTransaction(newTransaction);
    
    const updatedEval: SADFEvaluation = {
      ...evalu,
      paymentProcessed: true,
      transactionId: newTransaction.id
    };
    StorageService.saveSADFEvaluation(updatedEval);
    
    StorageService.addNotification({
      title: `Salário Processado: ${trainer.name}`,
      message: `Salário de ${metrics.totalAmt.toLocaleString()} AOA para ${trainer.name} (${getMonthLabel(selectedMonth)}) foi debitado.`,
      type: 'success',
      category: 'finance'
    });
    
    refreshAllData();
    setIsEvalModalOpen(false);
  };

  if (!isAdmin) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto mt-12 text-center border-t-4 border-dtc-red">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Acesso Restrito</h2>
        <p className="text-gray-600">Este menu é acessível apenas para utilizadores com privilégio de Administrador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1.5 rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab('colaboradores')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 flex items-center gap-2 ${
            activeTab === 'colaboradores' 
              ? 'bg-white text-dtc-blue shadow-sm font-semibold' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Users size={16} />
          Fichas de Colaboradores
        </button>
        <button
          onClick={() => setActiveTab('sadf')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 flex items-center gap-2 ${
            activeTab === 'sadf' 
              ? 'bg-white text-dtc-blue shadow-sm font-semibold' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Award size={16} />
          SADF - Avaliação & Processamento
        </button>
      </div>

      {/* Tab 1: Colaboradores */}
      {activeTab === 'colaboradores' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Recursos Humanos</h1>
              <p className="text-sm text-gray-500">Gestão de colaboradores, salários base e turmas atribuídas.</p>
            </div>
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
                                  <div className="text-xs bg-blue-50 text-blue-800 p-1 rounded inline-block font-semibold">
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
        </div>
      )}

      {/* Tab 2: SADF Avaliação & Processamento */}
      {activeTab === 'sadf' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-dtc-blue flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">SADF - Processamento de Salários de Formadores</h2>
                <p className="text-xs text-gray-500">Selecione o mês de referência para aplicar a fórmula de remuneração por desempenho</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mês de Referência:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-semibold text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-dtc-blue"
              />
            </div>
          </div>

          <Card className="overflow-hidden border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Award size={20} className="text-dtc-blue" />
                  SADF - Consolidação Mensal de Desempenho
                </h3>
                <p className="text-xs text-gray-400">Relação de honorários variáveis calculados para o mês: <strong className="text-slate-600 font-semibold">{getMonthLabel(selectedMonth)}</strong></p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 border">
                <Building size={12} />
                Fórmula de Distribuição SADF
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="p-4">Formador</th>
                    <th className="p-4 text-right">Receita Turma</th>
                    <th className="p-4 text-center">Produção (20%)</th>
                    <th className="p-4 text-center">Retenção (3%)</th>
                    <th className="p-4 text-center">Excelência (5%)</th>
                    <th className="p-4 text-center">Assiduidade (2%)</th>
                    <th className="p-4 text-center">Total (%)</th>
                    <th className="p-4 text-right">Total (AOA)</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trainers.map(trainer => {
                    const evalu = sadfEvaluations.find(e => e.staffId === trainer.id && e.monthYear === selectedMonth);
                    const metrics = evalu ? calculateSADFMetrics(evalu) : null;
                    
                    return (
                      <tr key={trainer.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100/70 text-dtc-blue flex items-center justify-center font-bold text-sm">
                              {trainer.name.charAt(0)}
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-slate-800">{trainer.name}</span>
                              <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">{trainer.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-700">
                          {metrics ? `${metrics.revenue.toLocaleString()} AOA` : <span className="text-gray-300 italic">-</span>}
                        </td>
                        <td className="p-4 text-center text-xs font-medium text-slate-600">
                          {metrics ? `${metrics.baseAmt.toLocaleString()} AOA` : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="p-4 text-center">
                          {metrics ? (
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                              metrics.retentionBonusPct === 3 ? 'bg-green-100 text-green-700' :
                              metrics.retentionBonusPct === 1.5 ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {metrics.retentionBonusAmt.toLocaleString()} ({metrics.retentionBonusPct}%)
                            </span>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="p-4 text-center">
                          {metrics ? (
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                              metrics.excelenciaBonusPct > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {metrics.excelenciaBonusAmt.toLocaleString()} ({metrics.excelenciaBonusPct}%)
                            </span>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="p-4 text-center">
                          {metrics ? (
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                              metrics.assiduidadeBonusPct > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {metrics.assiduidadeBonusAmt.toLocaleString()} ({metrics.assiduidadeBonusPct}%)
                            </span>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="p-4 text-center font-extrabold text-slate-700">
                          {metrics ? `${metrics.totalPct}%` : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="p-4 text-right font-black text-dtc-blue">
                          {metrics ? `${metrics.totalAmt.toLocaleString()} AOA` : <span className="text-gray-300 font-normal italic">-</span>}
                        </td>
                        <td className="p-4 text-center">
                          {evalu ? (
                            evalu.paymentProcessed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                                <CheckCircle2 size={12} /> Pago
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 animate-pulse">
                                <Clock size={12} /> Pendente
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                              Não Avaliado
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button 
                              size="sm" 
                              variant={evalu ? "secondary" : "primary"}
                              onClick={() => handleOpenEval(trainer)}
                              className="text-[11px] font-bold py-1 px-2.5"
                            >
                              {evalu ? 'Editar' : 'Avaliar'}
                            </Button>
                            {evalu && (
                              <button
                                onClick={() => {
                                  setSelectedReportEval(evalu);
                                  setIsReportModalOpen(true);
                                }}
                                className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                                title="Visualizar Boletim SADF"
                              >
                                <FileText size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {trainers.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-400 italic">
                        Nenhum formador registado no sistema para aplicar SADF.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-gray-100 mt-4 rounded-lg text-xs text-slate-500 space-y-1.5">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Nota Executiva do SADF:</h4>
              <p>1. A coluna <strong>Produção (20%)</strong> constitui os honorários base contratualizados por produtividade regular.</p>
              <p>2. As colunas de <strong>Retenção (3%)</strong>, <strong>Excelência (5%)</strong>, e <strong>Assiduidade (2%)</strong> são cumulativas, perfazendo um teto máximo potencial de <strong>30% da Receita da Turma</strong> sob a forma de remuneração variável por desempenho.</p>
            </div>
          </Card>
        </div>
      )}

      {/* Collaborator Detail Modal */}
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

      {/* SADF Evaluation & Input Form Modal */}
      <Modal 
        isOpen={isEvalModalOpen} 
        onClose={() => setIsEvalModalOpen(false)} 
        title="SADF - Ficha de Avaliação de Desempenho"
      >
        {selectedTrainer && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            {/* Header Info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-gray-100 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Formador Avaliado</span>
                <span className="font-bold text-dtc-blue text-base block">{selectedTrainer.name}</span>
                <span className="text-xs text-gray-500">{selectedTrainer.role}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mês de Referência</span>
                <span className="font-bold text-slate-700 block flex items-center gap-1.5 justify-end">
                  <Calendar size={14} className="text-dtc-blue" />
                  {getMonthLabel(selectedMonth)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side: Forms */}
              <div className="space-y-4">
                {/* Ficha 1: Assiduidade */}
                <div className="border border-slate-100 rounded-lg p-4 bg-white shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-dtc-blue flex items-center justify-center text-xs font-extrabold">1</span>
                    Assiduidade e Pontualidade
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Faltas Injustificadas</label>
                      <input 
                        type="number" 
                        min="0"
                        value={evalForm.unjustifiedAbsences ?? 0}
                        onChange={e => setEvalForm({...evalForm, unjustifiedAbsences: parseInt(e.target.value, 10) || 0})}
                        disabled={evalForm.paymentProcessed}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-dtc-blue bg-white disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Soma de Atrasos (Minutos)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={evalForm.totalDelayMinutes ?? 0}
                        onChange={e => setEvalForm({...evalForm, totalDelayMinutes: parseInt(e.target.value, 10) || 0})}
                        disabled={evalForm.paymentProcessed}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-dtc-blue bg-white disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                  {/* Real-time Indicator */}
                  {(() => {
                    const eligible = (evalForm.unjustifiedAbsences || 0) === 0 && (evalForm.totalDelayMinutes || 0) <= 15;
                    return (
                      <div className={`text-[11px] p-2 rounded flex items-center gap-1.5 font-bold ${
                        eligible ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {eligible ? (
                          <>
                            <CheckCircle2 size={14} /> Elegível para Bónus de Assiduidade (+2%)
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={14} /> Não Elegível (Requisito: 0 Faltas e ≤ 15m Atraso)
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Ficha 2: Retenção */}
                <div className="border border-slate-100 rounded-lg p-4 bg-white shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-dtc-blue flex items-center justify-center text-xs font-extrabold">2</span>
                    Retenção de Estudantes
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Estudantes Iniciais</label>
                      <input 
                        type="number" 
                        min="1"
                        value={evalForm.initialStudents ?? 10}
                        onChange={e => setEvalForm({...evalForm, initialStudents: Math.max(1, parseInt(e.target.value, 10) || 0)})}
                        disabled={evalForm.paymentProcessed}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-dtc-blue bg-white disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Desistências (No Mês)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={evalForm.dropouts ?? 0}
                        onChange={e => setEvalForm({...evalForm, dropouts: parseInt(e.target.value, 10) || 0})}
                        disabled={evalForm.paymentProcessed}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-dtc-blue bg-white disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                  {/* Real-time Indicator */}
                  {(() => {
                    const initial = evalForm.initialStudents || 10;
                    const dropouts = evalForm.dropouts || 0;
                    const rate = Math.max(0, ((initial - dropouts) / initial) * 100);
                    let pct = 0;
                    if (rate >= 95) pct = 3;
                    else if (rate >= 90) pct = 1.5;
                    
                    return (
                      <div className={`text-[11px] p-2 rounded flex flex-col gap-0.5 font-bold ${
                        pct > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        <span className="flex justify-between">
                          <span>Taxa de Retenção Atendida:</span>
                          <strong>{rate.toFixed(1)}%</strong>
                        </span>
                        <span className="flex justify-between">
                          <span>Elegibilidade do Bónus:</span>
                          <strong>{pct > 0 ? `Sim (+${pct}%)` : 'Não (Taxa < 90%)'}</strong>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Ficha 3: Questionário de Avaliação (Alunos) */}
                <div className="border border-slate-100 rounded-lg p-4 bg-white shadow-sm space-y-3.5">
                  <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-dtc-blue flex items-center justify-center text-xs font-extrabold">3</span>
                    Questionário de Avaliação (Alunos)
                  </h4>
                  <p className="text-[10px] text-gray-400 italic">Preenchido com a média das respostas de 1 a 5 para cada critério pedagógico:</p>
                  
                  {[
                    { key: 'domain', label: '1. Domínio científico dos conteúdos' },
                    { key: 'clarity', label: '2. Esclarecimento de dúvidas' },
                    { key: 'punctuality', label: '3. Cumprimento rigoroso do horário' },
                    { key: 'relation', label: '4. Relação interpessoal e ética' },
                    { key: 'dynamics', label: '5. Dinâmicas práticas e materiais' }
                  ].map((crit) => {
                    const currentVal = (evalForm.studentRatings as any)?.[crit.key] || 5;
                    return (
                      <div key={crit.key} className="space-y-1">
                        <span className="block text-[11px] font-semibold text-slate-600">{crit.label}</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              type="button"
                              disabled={evalForm.paymentProcessed}
                              onClick={() => {
                                const currentRatings = evalForm.studentRatings || { domain: 5, clarity: 5, punctuality: 5, relation: 5, dynamics: 5 };
                                setEvalForm({
                                  ...evalForm,
                                  studentRatings: {
                                    ...currentRatings,
                                    [crit.key]: v
                                  }
                                });
                              }}
                              className={`flex-1 py-1 rounded font-bold text-xs border text-center transition-all ${
                                currentVal === v
                                  ? 'bg-dtc-blue border-dtc-blue text-white shadow-sm'
                                  : 'bg-white border-gray-200 text-gray-500 hover:bg-slate-50 disabled:opacity-75'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Real-time Indicator */}
                  {(() => {
                    const ratings = evalForm.studentRatings || { domain: 5, clarity: 5, punctuality: 5, relation: 5, dynamics: 5 };
                    const avg = (ratings.domain + ratings.clarity + ratings.punctuality + ratings.relation + ratings.dynamics) / 5;
                    return (
                      <div className={`text-xs p-2 rounded flex justify-between items-center font-bold ${
                        avg >= 4.5 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        <span>Média de Avaliação:</span>
                        <span className="flex items-center gap-1">
                          <Star size={14} className="fill-current text-amber-400" />
                          {avg.toFixed(2)} / 5.0
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Ficha 4: Observação Pedagógica (Coordenação) */}
                <div className="border border-slate-100 rounded-lg p-4 bg-white shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-dtc-blue flex items-center justify-center text-xs font-extrabold">4</span>
                    Ficha de Observação Pedagógica
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Avaliação da Coordenação (Audit)</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'favoravel', label: '👍 Favorável' },
                          { value: 'desfavoravel', label: '👎 Desfavorável' }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={evalForm.paymentProcessed}
                            onClick={() => setEvalForm({...evalForm, auditResult: opt.value as any})}
                            className={`py-1.5 rounded-lg border font-bold text-xs text-center transition-all ${
                              evalForm.auditResult === opt.value
                                ? 'bg-dtc-blue border-dtc-blue text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-slate-50 disabled:opacity-75'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Feedback e Plano de Melhoria Contínua</label>
                      <textarea 
                        value={evalForm.feedbackNotes || ''}
                        onChange={e => setEvalForm({...evalForm, feedbackNotes: e.target.value})}
                        disabled={evalForm.paymentProcessed}
                        placeholder="Parecer descritivo da coordenação pedagógica..."
                        rows={2}
                        className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-dtc-blue"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Financial & Process */}
              <div className="space-y-4">
                <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50 shadow-inner space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm pb-2 border-b border-gray-200 flex items-center gap-2">
                    <DollarSign size={16} className="text-dtc-blue" />
                    Processamento Financeiro
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Receita Mensal Turma (AOA)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={evalForm.classRevenue || ''}
                      onChange={e => setEvalForm({...evalForm, classRevenue: Number(e.target.value) || 0})}
                      disabled={evalForm.paymentProcessed}
                      placeholder="Faturamento da turma..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-dtc-blue bg-white disabled:bg-slate-100"
                    />
                  </div>

                  {/* Calculations Breakdown */}
                  {(() => {
                    const metrics = calculateSADFMetrics(evalForm);
                    return (
                      <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Demonstração de Remuneração</h5>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-slate-600">
                            <span>Componente Base (20%):</span>
                            <span className="font-bold">{metrics.baseAmt.toLocaleString()} AOA</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Bónus Assiduidade (+2%):</span>
                            <span className="font-bold text-slate-700">
                              {metrics.assiduidadeBonusAmt > 0 ? `+ ${metrics.assiduidadeBonusAmt.toLocaleString()} AOA` : '0 AOA'}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Bónus Retenção (+{metrics.retentionBonusPct}%):</span>
                            <span className="font-bold text-slate-700">
                              {metrics.retentionBonusAmt > 0 ? `+ ${metrics.retentionBonusAmt.toLocaleString()} AOA` : '0 AOA'}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Bónus Excelência Pedagógica (+{metrics.excelenciaBonusPct}%):</span>
                            <span className="font-bold text-slate-700">
                              {metrics.excelenciaBonusAmt > 0 ? `+ ${metrics.excelenciaBonusAmt.toLocaleString()} AOA` : '0 AOA'}
                            </span>
                          </div>
                          
                          <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center font-bold text-slate-900 text-sm">
                            <span>Total Líquido ({metrics.totalPct}%):</span>
                            <span className="text-dtc-blue font-extrabold">{metrics.totalAmt.toLocaleString()} AOA</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* If paid show transaction badge */}
                  {evalForm.paymentProcessed ? (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center space-y-1">
                      <span className="text-green-700 font-bold flex items-center justify-center gap-1.5 text-xs">
                        <CheckCircle2 size={16} /> Salário Mensal Pago & Registado!
                      </span>
                      <p className="text-[10px] text-green-600">
                        O montante foi debitado e lançado nas despesas salariais do mês.
                      </p>
                      {evalForm.transactionId && (
                        <span className="block font-mono text-[9px] text-slate-400 select-all">Transação: {evalForm.transactionId}</span>
                      )}
                    </div>
                  ) : (
                    /* If not paid, show account selector and pay button */
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm space-y-4">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Conta de Débito da Despesa</span>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPaymentAccount({ type: 'caixa' })}
                            className={`py-2 px-3 rounded-lg border text-xs font-bold text-center flex flex-col items-center justify-center gap-1 transition-all ${
                              paymentAccount.type === 'caixa'
                                ? 'bg-blue-50 border-dtc-blue text-dtc-blue shadow-sm'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-slate-50'
                            }`}
                          >
                            <span>💵 Caixa Geral</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const activeBanks = StorageService.getBanks();
                              setPaymentAccount({ type: 'banco', bankId: activeBanks[0]?.id || '' });
                            }}
                            className={`py-2 px-3 rounded-lg border text-xs font-bold text-center flex flex-col items-center justify-center gap-1 transition-all ${
                              paymentAccount.type === 'banco'
                                ? 'bg-blue-50 border-dtc-blue text-dtc-blue shadow-sm'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-slate-50'
                            }`}
                          >
                            <span>🏦 Bancos</span>
                          </button>
                        </div>
                      </div>

                      {paymentAccount.type === 'banco' && (
                        <Select
                          label="Selecionar Banco"
                          options={banks.map(b => ({ value: b.id, label: b.name }))}
                          value={paymentAccount.bankId || ''}
                          onChange={e => setPaymentAccount({ ...paymentAccount, bankId: e.target.value })}
                        />
                      )}

                      <div className="pt-2 border-t border-gray-100 flex gap-2">
                        <Button 
                          type="button" 
                          variant="secondary" 
                          className="flex-1 text-xs"
                          onClick={handleSaveEval}
                        >
                          Salvar Rascunho
                        </Button>
                        <Button 
                          type="button" 
                          variant="primary" 
                          className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => handleProcessPayment(selectedTrainer, {
                            id: evalForm.id!,
                            staffId: selectedTrainer.id,
                            monthYear: selectedMonth,
                            classRevenue: Number(evalForm.classRevenue) || 0,
                            unjustifiedAbsences: Number(evalForm.unjustifiedAbsences) || 0,
                            totalDelayMinutes: Number(evalForm.totalDelayMinutes) || 0,
                            initialStudents: Number(evalForm.initialStudents) || 0,
                            dropouts: Number(evalForm.dropouts) || 0,
                            studentRatings: {
                              domain: Number(evalForm.studentRatings?.domain) || 5,
                              clarity: Number(evalForm.studentRatings?.clarity) || 5,
                              punctuality: Number(evalForm.studentRatings?.punctuality) || 5,
                              relation: Number(evalForm.studentRatings?.relation) || 5,
                              dynamics: Number(evalForm.studentRatings?.dynamics) || 5,
                            },
                            auditResult: (evalForm.auditResult as any) || 'favoravel',
                            feedbackNotes: evalForm.feedbackNotes || '',
                            paymentProcessed: !!evalForm.paymentProcessed,
                            transactionId: evalForm.transactionId
                          })}
                        >
                          Pagar Salário
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-3 border-t">
              <Button variant="secondary" onClick={() => setIsEvalModalOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* SADF Monthly Performance Report / Scorecard Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => {
          setSelectedReportEval(null);
          setIsReportModalOpen(false);
        }}
        title="Boletim de Desempenho SADF"
      >
        {selectedReportEval && (() => {
          const trainer = staffList.find(s => s.id === selectedReportEval.staffId);
          const metrics = calculateSADFMetrics(selectedReportEval);
          return (
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
              <div className="bg-white border border-gray-300 p-6 md:p-8 rounded shadow-sm max-w-xl mx-auto space-y-6 font-sans text-slate-800">
                {/* Official Document Header */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-dtc-blue tracking-wider block">SADF - MODELO EXECUTIVO</span>
                    <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">Relatório de Avaliação Mensal</h2>
                    <span className="text-xs text-slate-400">Direção Geral de Ensino e Coordenação</span>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-semibold uppercase">
                    <span>Mês: {getMonthLabel(selectedReportEval.monthYear)}</span>
                  </div>
                </div>

                {/* Formador & Info */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded border">
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px]">Formador Avaliado</span>
                    <span className="font-bold text-slate-800 text-sm">{trainer?.name || 'Formador'}</span>
                    <span className="text-slate-500 block">{trainer?.role || 'Docente'}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px]">Estado de Processamento</span>
                    <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[9px] mt-1 ${
                      selectedReportEval.paymentProcessed 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedReportEval.paymentProcessed ? 'Processado e Pago' : 'Pendente'}
                    </span>
                  </div>
                </div>

                {/* Table Metrics */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Métricas Verificadas & Critérios de Desempenho</h4>
                  <div className="border rounded overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 border-b">
                        <tr>
                          <th className="p-2 font-bold text-slate-600">Indicador SADF</th>
                          <th className="p-2 text-center font-bold text-slate-600">Desempenho Real</th>
                          <th className="p-2 text-center font-bold text-slate-600">Atribuição de Bónus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        <tr>
                          <td className="p-2 font-medium">1. Taxa de Assiduidade e Pontualidade</td>
                          <td className="p-2 text-center">
                            Faltas: {selectedReportEval.unjustifiedAbsences} | Atrasos: {selectedReportEval.totalDelayMinutes}m
                          </td>
                          <td className="p-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded font-bold text-[9px] ${
                              metrics.hasAssiduidadeBonus ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {metrics.hasAssiduidadeBonus ? '✓ Atribuído (+2%)' : '✗ Não Elegível'}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">2. Taxa de Retenção de Estudantes</td>
                          <td className="p-2 text-center font-bold">
                            {metrics.retentionRate.toFixed(1)}%
                          </td>
                          <td className="p-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded font-bold text-[9px] ${
                              metrics.retentionBonusPct > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {metrics.retentionBonusPct > 0 ? `✓ Atribuído (+${metrics.retentionBonusPct}%)` : '✗ Não Elegível'}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">3. Média dos Questionários (Alunos)</td>
                          <td className="p-2 text-center font-bold">
                            {metrics.avgStudentScore.toFixed(2)} / 5.00
                          </td>
                          <td className="p-2 text-center text-[10px] text-slate-500 italic">
                            Elegível para excelência se ≥ 4.5
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">4. Avaliação da Coordenação (Auditoria)</td>
                          <td className="p-2 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                              selectedReportEval.auditResult === 'favoravel' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {selectedReportEval.auditResult === 'favoravel' ? 'Favorável' : 'Desfavorável'}
                            </span>
                          </td>
                          <td className="p-2 text-center text-[10px] text-slate-500 italic">
                            Obrigatório para bónus pedagógico
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Feedback Section */}
                <div className="space-y-1.5">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Parecer Técnico da Coordenação Pedagógica</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs italic text-slate-600 min-h-[50px]">
                    {selectedReportEval.feedbackNotes || 'Não foram especificadas notas pedagógicas adicionais.'}
                  </div>
                </div>

                {/* Salary Summary Breakdown */}
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Boletim de Remuneração Distribuída</h4>
                  <div className="bg-slate-50 border rounded p-4 grid grid-cols-2 gap-y-2 text-xs font-semibold">
                    <div className="text-slate-500">Receita Mensal da Turma:</div>
                    <div className="text-right font-bold text-slate-800">{metrics.revenue.toLocaleString()} AOA</div>
                    
                    <div className="text-slate-500">Componente Base Regular (20%):</div>
                    <div className="text-right font-bold text-slate-800">{metrics.baseAmt.toLocaleString()} AOA</div>
                    
                    <div className="text-slate-500">Bónus Assiduidade (2%):</div>
                    <div className="text-right font-bold text-slate-800">{metrics.assiduidadeBonusAmt > 0 ? `+ ${metrics.assiduidadeBonusAmt.toLocaleString()} AOA` : '0 AOA'}</div>
                    
                    <div className="text-slate-500">Bónus Retenção ({metrics.retentionBonusPct}%):</div>
                    <div className="text-right font-bold text-slate-800">{metrics.retentionBonusAmt > 0 ? `+ ${metrics.retentionBonusAmt.toLocaleString()} AOA` : '0 AOA'}</div>
                    
                    <div className="text-slate-500">Bónus Excelência Pedagógica ({metrics.excelenciaBonusPct}%):</div>
                    <div className="text-right font-bold text-slate-800">{metrics.excelenciaBonusAmt > 0 ? `+ ${metrics.excelenciaBonusAmt.toLocaleString()} AOA` : '0 AOA'}</div>
                    
                    <div className="col-span-2 border-t border-dashed border-gray-300 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                      <span>Total Líquido Atribuído ({metrics.totalPct}%):</span>
                      <span className="text-dtc-blue text-base font-extrabold">{metrics.totalAmt.toLocaleString()} AOA</span>
                    </div>
                  </div>
                </div>

                {/* Signatures line */}
                <div className="pt-10 flex justify-between gap-10 text-center text-[10px] text-slate-400">
                  <div className="flex-1">
                    <div className="border-b border-slate-300 mx-2 h-4 mb-1"></div>
                    <span>Assinatura do Formador</span>
                  </div>
                  <div className="flex-1">
                    <div className="border-b border-slate-300 mx-2 h-4 mb-1"></div>
                    <span>Assinatura da Coordenação</span>
                  </div>
                </div>
              </div>

              {/* Modal buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button 
                  variant="secondary" 
                  onClick={() => window.print()}
                  className="text-xs"
                >
                  Imprimir Boletim
                </Button>
                <Button variant="primary" onClick={() => {
                  setSelectedReportEval(null);
                  setIsReportModalOpen(false);
                }}>
                  Fechar
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};