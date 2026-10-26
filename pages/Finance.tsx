import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, Button, Input, Select, Modal } from '../components/UI';
import { StorageService } from '../services/storage';
import { Transaction, Student, Staff, Bank, Course } from '../types';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  DollarSign, 
  Filter, 
  X, 
  Trash2, 
  Lock, 
  Plus, 
  ArrowLeftRight, 
  Building, 
  FileDown,
  Search,
  GraduationCap,
  UserCheck,
  Check
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface SearchableStudentSelectProps {
  students: Student[];
  courses: Course[];
  selectedStudentId?: string;
  onSelect: (studentId: string) => void;
}

const SearchableStudentSelect: React.FC<SearchableStudentSelectProps> = ({
  students,
  courses,
  selectedStudentId,
  onSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStudents = students.filter(student => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const course = courses.find(c => c.id === student.courseId);
    return (
      student.fullName.toLowerCase().includes(q) ||
      (student.phone1 && student.phone1.includes(q)) ||
      (course && course.name.toLowerCase().includes(q))
    );
  });

  if (selectedStudent) {
    const course = courses.find(c => c.id === selectedStudent.courseId);
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 shadow-sm transition-all">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-dtc-blue flex items-center justify-center font-bold text-sm shrink-0">
            <GraduationCap size={20} />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm truncate">{selectedStudent.fullName}</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded font-medium inline-flex items-center gap-0.5">
                <Check size={10} /> Aluno Selecionado
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">
              {course ? course.name : 'Sem curso'}
              {selectedStudent.phone1 ? ` • Tel: ${selectedStudent.phone1}` : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect('');
            setSearchQuery('');
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 shrink-0 ml-2 font-medium border border-red-200/60 cursor-pointer"
          title="Trocar aluno"
        >
          <X size={14} /> Trocar
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Digite para pesquisar o nome do aluno..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-dtc-blue focus:border-dtc-blue bg-white transition-all text-gray-800 placeholder-gray-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
            title="Limpar pesquisa"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 divide-y divide-gray-100">
          <div className="px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 flex justify-between items-center sticky top-0 border-b border-gray-100 z-10">
            <span>
              {searchQuery ? `${filteredStudents.length} encontrado(s)` : `Total de ${students.length} alunos`}
            </span>
            <span className="text-[10px] text-gray-400">Clique para vincular</span>
          </div>
          {filteredStudents.length > 0 ? (
            filteredStudents.map(student => {
              const course = courses.find(c => c.id === student.courseId);
              return (
                <div
                  key={student.id}
                  onClick={() => {
                    onSelect(student.id);
                    setSearchQuery('');
                    setIsOpen(false);
                  }}
                  className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-sm transition-colors group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-dtc-blue flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-dtc-blue group-hover:text-white transition-colors">
                      {student.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-slate-800 text-xs truncate group-hover:text-dtc-blue">
                        {student.fullName}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {course?.name || 'Sem curso'} {student.phone1 ? `• ${student.phone1}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-dtc-blue opacity-0 group-hover:opacity-100 transition-opacity font-medium shrink-0 ml-2">
                    Vincular →
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-gray-400">
              Nenhum aluno encontrado com "{searchQuery}".
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SearchableTeacherSelectProps {
  staffList: Staff[];
  selectedStaffId?: string;
  onSelect: (staffId: string) => void;
}

const SearchableTeacherSelect: React.FC<SearchableTeacherSelectProps> = ({
  staffList,
  selectedStaffId,
  onSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedStaff = staffList.find(s => s.id === selectedStaffId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStaff = staffList.filter(staff => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      staff.name.toLowerCase().includes(q) ||
      (staff.role && staff.role.toLowerCase().includes(q))
    );
  });

  if (selectedStaff) {
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-200 shadow-sm transition-all">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
            <UserCheck size={20} />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm truncate">{selectedStaff.name}</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-indigo-100 text-indigo-800 rounded font-medium inline-flex items-center gap-0.5">
                <Check size={10} /> Professor/Staff Selecionado
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">
              Cargo: {selectedStaff.role || 'Formador / Professor'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect('');
            setSearchQuery('');
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 shrink-0 ml-2 font-medium border border-red-200/60 cursor-pointer"
          title="Trocar professor"
        >
          <X size={14} /> Trocar
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Digite para pesquisar o nome do professor ou colaborador..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-dtc-blue focus:border-dtc-blue bg-white transition-all text-gray-800 placeholder-gray-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
            title="Limpar pesquisa"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 divide-y divide-gray-100">
          <div className="px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 flex justify-between items-center sticky top-0 border-b border-gray-100 z-10">
            <span>
              {searchQuery ? `${filteredStaff.length} encontrado(s)` : `Total de ${staffList.length} professores/colaboradores`}
            </span>
            <span className="text-[10px] text-gray-400">Clique para vincular</span>
          </div>
          {filteredStaff.length > 0 ? (
            filteredStaff.map(staff => {
              return (
                <div
                  key={staff.id}
                  onClick={() => {
                    onSelect(staff.id);
                    setSearchQuery('');
                    setIsOpen(false);
                  }}
                  className="px-3 py-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-sm transition-colors group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-slate-800 text-xs truncate group-hover:text-indigo-700">
                        {staff.name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {staff.role || 'Formador / Professor'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium shrink-0 ml-2">
                    Vincular →
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-gray-400">
              Nenhum professor ou colaborador encontrado com "{searchQuery}".
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const INCOMING_COLORS = ['#10B981', '#059669', '#34D399', '#6EE7B7', '#A7F3D0'];
const OUTGOING_COLORS = ['#EF4444', '#DC2626', '#F87171', '#FCA5A5', '#FECACA'];
const COMPARE_COLORS = ['#3B82F6', '#EF4444'];

export const Finance: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<{ type: 'caixa' | 'banco'; id?: string }>({ type: 'caixa' });
  const [appliedDate, setAppliedDate] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Transaction>>({ 
    type: 'income', 
    status: 'paid', 
    date: new Date().toISOString().split('T')[0],
    destinationType: 'caixa',
    bankId: '',
    relatedStudentId: '',
    relatedStaffId: ''
  });
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Banks and Transfers State
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankIsVisibleToOthers, setNewBankIsVisibleToOthers] = useState(true);
  
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
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStudentName, setFilterStudentName] = useState('');
  const [filterStaffId, setFilterStaffId] = useState('');

  const [appliedCategory, setAppliedCategory] = useState('');
  const [appliedStudentName, setAppliedStudentName] = useState('');
  const [appliedStaffId, setAppliedStaffId] = useState('');

  // PDF Extract Parameter State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfParams, setPdfParams] = useState({
    startDate: '',
    endDate: '',
    type: 'all',
    category: 'all',
    account: 'all',
    status: 'all',
  });

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
    setCourses(StorageService.getCourses());
    setStaffList(StorageService.getStaff());
    setBanks(StorageService.getBanks());
  };

  const handleDeleteTransaction = (id: string) => {
      const transactionToDelete = allTransactions.find(t => t.id === id);
      if (confirm('Tem certeza que deseja excluir esta transação?')) {
          StorageService.deleteTransaction(id);
          StorageService.addAuditLog('transaction_delete', `Eliminou a transação: "${transactionToDelete?.description || id}" no valor de ${transactionToDelete?.amount || 0} AOA`);
          
          // If a tuition transaction is deleted directly in Finance, synchronize student's payment state
          if (transactionToDelete?.category === 'tuition' && transactionToDelete.relatedStudentId) {
            const student = students.find(s => s.id === transactionToDelete.relatedStudentId);
            if (student && transactionToDelete.relatedYearMonth) {
              const updatedPayments = { ...student.tuitionPayments };
              delete updatedPayments[transactionToDelete.relatedYearMonth];
              StorageService.saveStudent({ ...student, tuitionPayments: updatedPayments });
            }
          }
          refreshData();
      }
  };

  const applyFilter = () => {
    setAppliedDate(filterDate);
    setAppliedCategory(filterCategory);
    setAppliedStudentName(filterStudentName);
    setAppliedStaffId(filterStaffId);
  };

  const clearFilter = () => {
      setFilterDate('');
      setFilterCategory('');
      setFilterStudentName('');
      setFilterStaffId('');
      setAppliedDate('');
      setAppliedCategory('');
      setAppliedStudentName('');
      setAppliedStaffId('');
  };

  // Create custom bank
  const handleCreateBank = () => {
    if (!newBankName.trim()) return alert('Nome do banco obrigatório');
    const newBank: Bank = {
      id: Date.now().toString(),
      name: newBankName.trim(),
      isVisibleToOthers: newBankIsVisibleToOthers
    };
    StorageService.saveBank(newBank);
    StorageService.addAuditLog('bank_create', `Criou o banco: "${newBank.name}" (${newBank.isVisibleToOthers ? 'Visível a todos' : 'Apenas Admin'})`);
    setNewBankName('');
    setNewBankIsVisibleToOthers(true);
    refreshData();
  };

  const handleToggleBankVisibility = (bank: Bank) => {
    const updatedBank: Bank = {
      ...bank,
      isVisibleToOthers: bank.isVisibleToOthers === false ? true : false
    };
    StorageService.saveBank(updatedBank);
    StorageService.addAuditLog('bank_update', `Alterou a visibilidade do banco "${bank.name}" para ${updatedBank.isVisibleToOthers ? 'visível a todos' : 'restrito ao admin'}`);
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

  const handleGeneratePdf = () => {
    try {
      const doc = new jsPDF();
      
      // Filter transactions matching pdfParams
      const filtered = allTransactions.filter(t => {
        // Date range
        if (pdfParams.startDate && t.date < pdfParams.startDate) return false;
        if (pdfParams.endDate && t.date > pdfParams.endDate) return false;
        
        // Type
        if (pdfParams.type !== 'all' && t.type !== pdfParams.type) return false;
        
        // Category
        if (pdfParams.category !== 'all' && t.category !== pdfParams.category) return false;
        
        // Account
        if (pdfParams.account !== 'all') {
          if (pdfParams.account === 'caixa') {
            if (t.destinationType && t.destinationType !== 'caixa') return false;
          } else if (pdfParams.account === 'bancos') {
            if (t.destinationType !== 'banco') return false;
          } else {
            // Specific bank
            if (t.destinationType !== 'banco' || t.bankId !== pdfParams.account) return false;
          }
        }
        
        // Status
        if (pdfParams.status !== 'all' && t.status !== pdfParams.status) return false;
        
        return true;
      });

      // Sort by date ascending for extract report
      const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Helper translations and formats
      const getCategoryLabel = (cat: string) => {
        switch(cat) {
          case 'tuition': return 'Propina Mensal';
          case 'enrollment': return 'Matrícula';
          case 'material': return 'Venda de Material';
          case 'salary': return 'Salários';
          case 'rent': return 'Renda';
          case 'maintenance': return 'Manutenção';
          case 'tax': return 'Impostos';
          case 'transfer': return 'Transferência';
          case 'other': return 'Outros';
          default: return cat || 'Outros';
        }
      };

      const getAccountLabel = (t: Transaction) => {
        if (!t.destinationType || t.destinationType === 'caixa') {
          return 'Caixa Geral';
        }
        const b = banks.find(bank => bank.id === t.bankId);
        return b ? b.name : 'Banco';
      };

      // Header details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(30, 58, 138); // DTC Blue rgb(30, 58, 138)
      doc.text('CENTRO DE FORMAÇÃO DTC', 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(75, 85, 99); // Slate-600
      doc.text('Extrato Financeiro Parametrizado', 14, 28);
      
      // Separator Line
      doc.setDrawColor(229, 231, 235); // Gray-200
      doc.setLineWidth(0.5);
      doc.line(14, 32, 196, 32);

      // Metadata / Parameters list
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128); // Gray-500
      
      const pStart = pdfParams.startDate ? new Date(pdfParams.startDate).toLocaleDateString('pt-PT') : 'Início';
      const pEnd = pdfParams.endDate ? new Date(pdfParams.endDate).toLocaleDateString('pt-PT') : 'Fim';
      
      doc.text(`Período: ${pStart} a ${pEnd}`, 14, 38);
      
      let accountText = 'Todas';
      if (pdfParams.account === 'caixa') accountText = 'Caixa Geral';
      else if (pdfParams.account === 'bancos') accountText = 'Todos os Bancos';
      else if (pdfParams.account !== 'all') {
        const foundB = banks.find(b => b.id === pdfParams.account);
        accountText = foundB ? foundB.name : 'Banco';
      }
      doc.text(`Conta: ${accountText}`, 14, 43);

      const typeText = pdfParams.type === 'all' ? 'Todos' : (pdfParams.type === 'income' ? 'Apenas Entradas' : 'Apenas Saídas');
      doc.text(`Tipo de Transação: ${typeText}`, 14, 48);

      const catText = pdfParams.category === 'all' ? 'Todas' : getCategoryLabel(pdfParams.category);
      doc.text(`Categoria: ${catText}`, 110, 38);

      const statusText = pdfParams.status === 'all' ? 'Todos' : (pdfParams.status === 'paid' ? 'Pago' : 'Pendente');
      doc.text(`Status: ${statusText}`, 110, 43);
      
      const dateEmitted = new Date().toLocaleDateString('pt-PT') + ' ' + new Date().toLocaleTimeString('pt-PT');
      doc.text(`Emitido em: ${dateEmitted}`, 110, 48);

      // Summaries (Entradas, Saídas, Saldo)
      const sumIncome = sorted.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
      const sumExpense = sorted.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
      const balanceValue = sumIncome - sumExpense;

      // Draw a box for summaries
      doc.setFillColor(249, 250, 251); // Gray-50
      doc.roundedRect(14, 53, 182, 18, 2, 2, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(31, 41, 55); // Gray-800
      doc.text('RESUMO DO PERÍODO', 18, 59);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128); // Gray-500
      doc.text('Total Entradas', 18, 66);
      doc.text('Total Saídas', 75, 66);
      doc.text('Saldo Líquido', 132, 66);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129); // Green-500
      doc.text(`+${sumIncome.toLocaleString()} AOA`, 18, 62);
      
      doc.setTextColor(239, 68, 68); // Red-500
      doc.text(`-${sumExpense.toLocaleString()} AOA`, 75, 62);

      if (balanceValue >= 0) {
        doc.setTextColor(29, 78, 216); // Blue-700
        doc.text(`+${balanceValue.toLocaleString()} AOA`, 132, 62);
      } else {
        doc.setTextColor(239, 68, 68); // Red-500
        doc.text(`${balanceValue.toLocaleString()} AOA`, 132, 62);
      }

      // Generate Table
      const head = [['Data', 'Descrição', 'Conta', 'Categoria', 'Valor', 'Status']];
      const body = sorted.map(t => {
        let fullDesc = t.description;
        if (t.relatedStudentId) {
          const s = students.find(stud => stud.id === t.relatedStudentId);
          if (s) fullDesc += ` (Aluno: ${s.fullName})`;
        } else if (t.relatedStaffId) {
          const st = staffList.find(staff => staff.id === t.relatedStaffId);
          if (st) fullDesc += ` (Colaborador: ${st.name})`;
        }
        
        return [
          new Date(t.date).toLocaleDateString('pt-PT'),
          fullDesc,
          getAccountLabel(t),
          getCategoryLabel(t.category),
          `${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()} AOA`,
          t.status === 'paid' ? 'Pago' : 'Pendente'
        ];
      });

      autoTable(doc, {
        head: head,
        body: body,
        startY: 76,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 58, 138], // DTC Blue rgb(30, 58, 138)
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [55, 65, 81] // Gray-700
        },
        columnStyles: {
          0: { cellWidth: 22 }, // Data
          1: { cellWidth: 'auto' }, // Descrição
          2: { cellWidth: 32 }, // Conta
          3: { cellWidth: 30 }, // Categoria
          4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }, // Valor
          5: { cellWidth: 18, halign: 'center' } // Status
        },
        didDrawCell: (data) => {
          // If body row and amount column (index 4)
          if (data.section === 'body' && data.column.index === 4) {
            const valText = data.cell.text[0];
            if (valText.startsWith('+')) {
              doc.setTextColor(16, 185, 129); // Green
            } else if (valText.startsWith('-')) {
              doc.setTextColor(239, 68, 68); // Red
            }
          }
          // If body row and status column (index 5)
          if (data.section === 'body' && data.column.index === 5) {
            const valText = data.cell.text[0];
            if (valText === 'Pago') {
              doc.setTextColor(22, 101, 52); // Dark Green
            } else if (valText === 'Pendente') {
              doc.setTextColor(161, 98, 7); // Dark Yellow/Gold
            }
          }
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // Gray-50
        },
        margin: { left: 14, right: 14 },
      });

      doc.save(`extrato_${new Date().toISOString().split('T')[0]}.pdf`);
      setIsPdfModalOpen(false);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Ocorreu um erro ao gerar o PDF do extrato.');
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
    StorageService.addAuditLog('transaction_create', `Efetou transferência de fundos no valor de ${amountVal} AOA de ${fromLabel} para ${toLabel}`);

    setIsTransferModalOpen(false);
    refreshData();
  };

  const handleSave = () => {
    if (!form.amount || !form.description) return alert('Valor e descrição obrigatórios');
    
    // Check if student link is required for income with tuition/enrollment/material
    if (form.type === 'income' && form.category && studentLinkableCategories.includes(form.category) && !form.relatedStudentId) {
      return alert('É obrigatório pesquisar e vincular um aluno para esta categoria.');
    }

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
    StorageService.addAuditLog('transaction_create', `Registou transação de ${newTransaction.type === 'income' ? 'entrada' : 'saída'} (${newTransaction.category}): ${newTransaction.description} de valor ${newTransaction.amount} AOA`);
    
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

  // Banks visible to current user
  const visibleBanksForUser = isAdmin ? banks : banks.filter(b => b.isVisibleToOthers !== false);

  // 1. Filter allTransactions by selected account (Caixa vs specific Bank)
  const accountTransactions = allTransactions.filter(t => {
    if (selectedAccount.type === 'caixa') {
      return !t.destinationType || t.destinationType === 'caixa';
    } else {
      return t.destinationType === 'banco' && t.bankId === selectedAccount.id;
    }
  });

  // 2. Filter by applied date, category, student name, staff ID
  let displayedTransactions = accountTransactions;
  if (appliedDate) {
    displayedTransactions = displayedTransactions.filter(t => t.date === appliedDate);
  }
  if (appliedCategory) {
    displayedTransactions = displayedTransactions.filter(t => t.category === appliedCategory);
  }
  if (appliedStudentName.trim()) {
    const query = appliedStudentName.trim().toLowerCase();
    displayedTransactions = displayedTransactions.filter(t => {
      let matchStudent = false;
      if (t.relatedStudentId) {
        const stud = students.find(s => s.id === t.relatedStudentId);
        if (stud && stud.fullName.toLowerCase().includes(query)) matchStudent = true;
      }
      const matchDesc = t.description.toLowerCase().includes(query);
      return matchStudent || matchDesc;
    });
  }
  if (appliedStaffId) {
    const selectedStaff = staffList.find(s => s.id === appliedStaffId);
    displayedTransactions = displayedTransactions.filter(t => {
      if (t.relatedStaffId === appliedStaffId) return true;
      if (selectedStaff && t.description.toLowerCase().includes(selectedStaff.name.toLowerCase())) return true;
      return false;
    });
  }

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

          {visibleBanksForUser.map(b => {
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
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">🏦 {b.name}</p>
                      {isAdmin && b.isVisibleToOthers === false && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-amber-100 text-amber-800 font-bold rounded" title="Oculto para funcionários">
                          Apenas Admin
                        </span>
                      )}
                    </div>
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
             <div className="flex flex-wrap items-end gap-2">
                 <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1 font-medium">Filtrar por Dia</label>
                    <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dtc-blue h-[38px] bg-white text-gray-700 cursor-pointer" 
                    />
                 </div>
                 <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1 font-medium">Filtrar por Categoria</label>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dtc-blue h-[38px] bg-white text-gray-700 cursor-pointer min-w-[140px]"
                    >
                        <option value="">Todas</option>
                        <option value="tuition">Propina Mensal</option>
                        <option value="enrollment">Matrícula</option>
                        <option value="material">Venda de Material</option>
                        <option value="salary">Salários</option>
                        <option value="rent">Renda</option>
                        <option value="maintenance">Manutenção</option>
                        <option value="tax">Impostos</option>
                        <option value="transfer">Transferência</option>
                        <option value="other">Outros</option>
                    </select>
                 </div>
                 <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1 font-medium">Filtrar por Aluno</label>
                    <input 
                        type="text" 
                        placeholder="Nome do aluno..."
                        value={filterStudentName}
                        onChange={(e) => setFilterStudentName(e.target.value)}
                        className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dtc-blue h-[38px] bg-white text-gray-700 min-w-[150px]"
                    />
                 </div>
                 <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1 font-medium">Filtrar por Funcionário</label>
                    <select
                        value={filterStaffId}
                        onChange={(e) => setFilterStaffId(e.target.value)}
                        className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dtc-blue h-[38px] bg-white text-gray-700 cursor-pointer min-w-[150px]"
                    >
                        <option value="">Todos os Funcionários</option>
                        {staffList.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                 </div>
                 <Button variant="secondary" size="sm" icon={Filter} onClick={applyFilter} className="h-[38px]">Aplicar</Button>
                 {(filterDate || filterCategory || filterStudentName || filterStaffId || appliedDate || appliedCategory || appliedStudentName || appliedStaffId) && (
                     <Button variant="ghost" size="sm" icon={X} onClick={clearFilter} className="h-[38px]">Limpar</Button>
                 )}
             </div>
             
             <div className="flex flex-wrap items-center gap-2">
                 {isAdmin && (
                     <>
                         <Button variant="secondary" size="sm" icon={FileDown} onClick={() => {
                              setPdfParams({
                                  startDate: '',
                                  endDate: '',
                                  type: 'all',
                                  category: 'all',
                                  account: 'all',
                                  status: 'all',
                              });
                              setIsPdfModalOpen(true);
                          }}>Retirar Extrato PDF</Button>
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
                         bankId: banks[0]?.id || '',
                         relatedStudentId: '',
                         relatedStaffId: ''
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
                                {t.relatedStudentId && (
                                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                        <span className="text-xs text-gray-500 font-medium">Ref Aluno: {students.find(s=>s.id === t.relatedStudentId)?.fullName}</span>
                                        {t.relatedYearMonth && (
                                            <span className="px-1.5 py-0.2 bg-blue-50 text-dtc-blue text-[10px] font-bold rounded border border-blue-200">
                                                Mês: {t.relatedYearMonth}
                                            </span>
                                        )}
                                    </div>
                                )}
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
                onChange={e => setForm({
                  ...form, 
                  type: e.target.value as any, 
                  category: undefined, 
                  relatedStudentId: '',
                  relatedStaffId: ''
                })}
              />
              <Input label="Data" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />

              {(isAdmin || visibleBanksForUser.length > 0) ? (
                <>
                  <Select 
                    label="Conta de Movimentação" 
                    options={[{value: 'caixa', label: '💵 Caixa Físico'}, {value: 'banco', label: '🏦 Conta Bancária'}]}
                    value={form.destinationType || 'caixa'}
                    onChange={e => setForm({...form, destinationType: e.target.value as any, bankId: e.target.value === 'banco' ? (visibleBanksForUser[0]?.id || '') : undefined})}
                  />

                  {form.destinationType === 'banco' ? (
                    <Select 
                      label="Selecionar Banco" 
                      options={visibleBanksForUser.map(b => ({value: b.id, label: b.name}))}
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

              {/* Student Link Section for Income */}
              {form.type === 'income' && (
                  <div className="col-span-2 p-3.5 rounded-xl border transition-all bg-blue-50/70 border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <GraduationCap size={15} className="text-dtc-blue" />
                          Vincular Aluno {form.category && studentLinkableCategories.includes(form.category) ? '(Obrigatório)' : '(Opcional)'}
                        </label>
                        {form.category && studentLinkableCategories.includes(form.category) && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                            Obrigatório para esta categoria
                          </span>
                        )}
                      </div>
                      <SearchableStudentSelect 
                        students={students}
                        courses={courses}
                        selectedStudentId={form.relatedStudentId}
                        onSelect={(id) => setForm({...form, relatedStudentId: id})}
                      />
                  </div>
              )}

              {/* Professor Link Section for Expense */}
              {form.type === 'expense' && (
                  <div className="col-span-2 bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck size={15} className="text-indigo-600" />
                          Vincular Professor / Colaborador (Opcional)
                        </label>
                        {form.category === 'salary' && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                            Recomendado para Salários
                          </span>
                        )}
                      </div>
                      <SearchableTeacherSelect 
                        staffList={staffList}
                        selectedStaffId={form.relatedStaffId}
                        onSelect={(id) => setForm({...form, relatedStaffId: id})}
                      />
                  </div>
              )}

              {/* Professor Link Section for Income (Optional) */}
              {form.type === 'income' && (
                  <div className="col-span-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck size={15} className="text-slate-500" />
                          Vincular Professor / Formador (Opcional)
                        </label>
                      </div>
                      <SearchableTeacherSelect 
                        staffList={staffList}
                        selectedStaffId={form.relatedStaffId}
                        onSelect={(id) => setForm({...form, relatedStaffId: id})}
                      />
                  </div>
              )}

              {/* Student Link Section for Expense (Optional e.g. refunds) */}
              {form.type === 'expense' && (
                  <div className="col-span-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <GraduationCap size={15} className="text-slate-500" />
                          Vincular Aluno (Opcional - Ex: Devolução/Reembolso)
                        </label>
                      </div>
                      <SearchableStudentSelect 
                        students={students}
                        courses={courses}
                        selectedStudentId={form.relatedStudentId}
                        onSelect={(id) => setForm({...form, relatedStudentId: id})}
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
              <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <Input 
                      label="Nome do Novo Banco" 
                      placeholder="Ex: Banco Sol, Keve" 
                      value={newBankName} 
                      onChange={e => setNewBankName(e.target.value)} 
                  />
                  <div className="flex items-center justify-between gap-2 pt-1">
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
                          <input 
                              type="checkbox"
                              checked={newBankIsVisibleToOthers}
                              onChange={e => setNewBankIsVisibleToOthers(e.target.checked)}
                              className="w-4 h-4 text-dtc-blue rounded border-gray-300 focus:ring-dtc-blue cursor-pointer"
                          />
                          <span>Visível para outros utilizadores (funcionários)</span>
                      </label>
                      <Button size="sm" onClick={handleCreateBank}>Criar Banco</Button>
                  </div>
              </div>
              
              <div className="border border-gray-100 rounded-lg divide-y max-h-64 overflow-y-auto">
                  <div className="p-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase flex justify-between items-center">
                      <span>Lista de Bancos</span>
                      <span>Visibilidade</span>
                  </div>
                  {banks.map(b => (
                      <div key={b.id} className="p-3 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors gap-2">
                          <span className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                              <Building size={16} className="text-gray-400" />
                              {b.name}
                          </span>
                          <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 transition-colors">
                                  <input 
                                      type="checkbox"
                                      checked={b.isVisibleToOthers !== false}
                                      onChange={() => handleToggleBankVisibility(b)}
                                      className="w-4 h-4 text-dtc-blue rounded border-gray-300 focus:ring-dtc-blue cursor-pointer"
                                  />
                                  <span className={b.isVisibleToOthers !== false ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                                      {b.isVisibleToOthers !== false ? 'Visível P/ Funcionários' : 'Apenas Admin'}
                                  </span>
                              </label>
                              <button 
                                  onClick={() => handleDeleteBank(b.id)}
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Excluir Banco"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
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

      {/* Modal - Extrato Parametrizado */}
      <Modal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} title="Emitir Extrato Parametrizado (PDF)">
          <div className="space-y-4 grid grid-cols-2 gap-4">
              <div className="col-span-2 text-xs text-gray-500 bg-blue-50/50 p-3 rounded border border-blue-100 flex items-start gap-2">
                <span>ℹ️</span>
                <span>Configure os filtros abaixo para gerar um relatório em PDF personalizado e detalhado de todas as transações correspondentes.</span>
              </div>

              <div className="col-span-2 md:col-span-1">
                <Input 
                  label="Data Inicial" 
                  type="date" 
                  value={pdfParams.startDate} 
                  onChange={e => setPdfParams({...pdfParams, startDate: e.target.value})} 
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <Input 
                  label="Data Final" 
                  type="date" 
                  value={pdfParams.endDate} 
                  onChange={e => setPdfParams({...pdfParams, endDate: e.target.value})} 
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <Select 
                  label="Tipo de Transação" 
                  options={[
                    { value: 'all', label: 'Todos os Tipos' },
                    { value: 'income', label: 'Apenas Entradas (Receitas)' },
                    { value: 'expense', label: 'Apenas Saídas (Despesas)' }
                  ]}
                  value={pdfParams.type}
                  onChange={e => setPdfParams({...pdfParams, type: e.target.value})}
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <Select 
                  label="Status" 
                  options={[
                    { value: 'all', label: 'Todos os Status' },
                    { value: 'paid', label: 'Apenas Pago' },
                    { value: 'pending', label: 'Apenas Pendente' }
                  ]}
                  value={pdfParams.status}
                  onChange={e => setPdfParams({...pdfParams, status: e.target.value})}
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <Select 
                  label="Categoria" 
                  options={[
                    { value: 'all', label: 'Todas as Categorias' },
                    { value: 'tuition', label: 'Propina Mensal' },
                    { value: 'enrollment', label: 'Matrícula' },
                    { value: 'material', label: 'Venda de Material' },
                    { value: 'salary', label: 'Salários' },
                    { value: 'rent', label: 'Renda' },
                    { value: 'maintenance', label: 'Manutenção' },
                    { value: 'tax', label: 'Impostos' },
                    { value: 'transfer', label: 'Transferência' },
                    { value: 'other', label: 'Outros' }
                  ]}
                  value={pdfParams.category}
                  onChange={e => setPdfParams({...pdfParams, category: e.target.value})}
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <Select 
                  label="Conta / Banco" 
                  options={[
                    { value: 'all', label: 'Todas as Contas' },
                    { value: 'caixa', label: 'Caixa Geral' },
                    { value: 'bancos', label: 'Apenas Bancos (Todos)' },
                    ...banks.map(b => ({ value: b.id, label: `Banco: ${b.name}` }))
                  ]}
                  value={pdfParams.account}
                  onChange={e => setPdfParams({...pdfParams, account: e.target.value})}
                />
              </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsPdfModalOpen(false)}>Cancelar</Button>
              <Button icon={FileDown} onClick={handleGeneratePdf}>Gerar PDF</Button>
          </div>
      </Modal>
    </div>
  );
};