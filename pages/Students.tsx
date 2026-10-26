import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Input, Select, Modal } from '../components/UI';
import { StorageService } from '../services/storage';
import { Student, Course, Transaction, ClassSession, Staff } from '../types';
import { Plus, Search, CheckCircle, XCircle, GraduationCap, Trash2, Filter, X, Users, Calendar, Lock, KeyRound, AlertTriangle, Coins } from 'lucide-react';

export interface PaymentMonthInfo {
  key: string;
  paddedKey: string;
  label: string;
  shortLabel: string;
  year: number;
  month: number;
}

export const Students: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [searchParams, setSearchParams] = useSearchParams();

  // Admin password confirmation modal state for deleting paid tuition
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [pendingMonthToCancel, setPendingMonthToCancel] = useState<PaymentMonthInfo | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterRegDate, setFilterRegDate] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [gradeForm, setGradeForm] = useState({ type: 'Avaliação de Progresso', score: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [behaviorNotes, setBehaviorNotes] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('dtc_current_user') || '{}');
    setIsAdmin(user?.role === 'admin');
    refreshData();
  }, []);

  const refreshData = () => {
    setStudents(StorageService.getStudents());
    setCourses(StorageService.getCourses());
    setClasses(StorageService.getClasses());
    setStaff(StorageService.getStaff());
    setTransactions(StorageService.getTransactions());
  };

  const handleDeleteStudent = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const studentToDelete = students.find(s => s.id === id);
      if (confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) {
          StorageService.deleteStudent(id);
          StorageService.addAuditLog('student_delete', `Eliminou o registo do aluno ${studentToDelete?.fullName || id}`);
          refreshData();
          if (selectedStudent?.id === id) {
              setSelectedStudent(null);
              setViewMode('list');
          }
      }
  };

  const handleSave = () => {
    if (!formData.fullName || !formData.age || !formData.courseId) {
      alert("Preencha os campos obrigatórios!");
      return;
    }

    // Validation for students 17 or younger
    if (Number(formData.age) <= 17) {
        if (!formData.guardianName || !formData.guardianContact) {
            alert("Para alunos com 17 anos ou menos, é obrigatório preencher o Nome e Contato do Responsável.");
            return;
        }
    }

    const newStudent: Student = {
      id: selectedStudent?.id || Date.now().toString(),
      fullName: formData.fullName,
      age: Number(formData.age),
      courseId: formData.courseId,
      classId: formData.classId, 
      status: (formData.status as any) || 'active',
      email: formData.email || '',
      phone1: formData.phone1 || '',
      phone2: formData.phone2 || '',
      guardianName: formData.guardianName || '',
      guardianContact: formData.guardianContact || '',
      registrationDate: formData.registrationDate || new Date().toISOString(),
      acquisitionChannel: formData.acquisitionChannel || 'Indicação',
      birthDate: formData.birthDate || '',
      address: formData.address || '',
      description: formData.description || '',
      behaviorNotes: formData.behaviorNotes || '',
      grades: selectedStudent?.grades || [],
      attendances: selectedStudent?.attendances || [],
      tuitionPayments: selectedStudent?.tuitionPayments || {},
      completedCourses: selectedStudent?.completedCourses || []
    };

    const isEditing = !!selectedStudent;
    StorageService.saveStudent(newStudent);
    StorageService.addAuditLog(
      isEditing ? 'student_update' : 'student_create',
      isEditing ? `Atualizou os dados do aluno ${newStudent.fullName}` : `Registou a matrícula do aluno ${newStudent.fullName}`
    );
    setIsModalOpen(false);
    refreshData();
    // If editing in detail mode, update the view
    if (viewMode === 'detail' && selectedStudent?.id === newStudent.id) {
        setSelectedStudent(newStudent);
    }
  };

  const handleBirthDateChange = (dateVal: string) => {
    const updated: Partial<Student> = { ...formData, birthDate: dateVal };
    if (dateVal) {
        const birth = new Date(dateVal);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            calculatedAge--;
        }
        if (calculatedAge >= 0) {
            updated.age = calculatedAge;
        }
    }
    setFormData(updated);
  };

  const openNewStudent = () => {
    setSelectedStudent(null);
    setFormData({ 
        status: 'active', 
        acquisitionChannel: 'Indicação',
        registrationDate: new Date().toISOString().split('T')[0], // Default to today
        birthDate: '',
        address: ''
    });
    setViewMode('list');
    setIsModalOpen(true);
  };

  const openStudentDetail = (student: Student) => {
    setSelectedStudent(student);
    setFormData(student);
    setBehaviorNotes(student.behaviorNotes || '');
    setViewMode('detail');
  };

  useEffect(() => {
    const studentId = searchParams.get('studentId');
    if (studentId && students.length > 0) {
      const student = students.find(s => s.id === studentId);
      if (student) {
        openStudentDetail(student);
      }
    }
  }, [searchParams, students]);

  const handleStatusToggle = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation(); // Prevent opening detail view
    const newStatus: 'active' | 'inactive' = student.status === 'active' ? 'inactive' : 'active';
    const updatedStudent: Student = { ...student, status: newStatus };
    StorageService.saveStudent(updatedStudent);
    
    // Update local state immediately
    setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
    if (selectedStudent?.id === student.id) setSelectedStudent(updatedStudent);
  };

  // Helper to determine tuition fee: < 18 years = 12.000 Kz, >= 18 years = 15.000 Kz
  const getStudentFee = (student: Student) => {
    let age = student.age;
    if ((age === undefined || age === null || isNaN(age)) && student.birthDate) {
      const birth = new Date(student.birthDate);
      if (!isNaN(birth.getTime())) {
        const today = new Date();
        age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
      }
    }
    const isMinor = typeof age === 'number' && age < 18;
    const amount = isMinor ? 12000 : 15000;
    const tierLabel = isMinor ? '< 18 anos (12.000 Kz)' : '≥ 18 anos (15.000 Kz)';
    return { age, isMinor, amount, tierLabel };
  };

  // Helper to generate monthly payment items from registration month to current month
  const getPaymentMonths = (student: Student): PaymentMonthInfo[] => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1 to 12

    let startYear = currentYear;
    let startMonth = currentMonth;

    if (student.registrationDate) {
      const match = student.registrationDate.match(/^(\d{4})-(\d{1,2})/);
      if (match) {
        startYear = parseInt(match[1], 10);
        startMonth = parseInt(match[2], 10);
      } else {
        const d = new Date(student.registrationDate);
        if (!isNaN(d.getTime())) {
          startYear = d.getFullYear();
          startMonth = d.getMonth() + 1;
        }
      }
    }

    // Safety checks
    if (startYear > currentYear || (startYear === currentYear && startMonth > currentMonth)) {
      startYear = currentYear;
      startMonth = currentMonth;
    }
    if (currentYear - startYear > 10) {
      startYear = currentYear - 2;
    }

    const months: PaymentMonthInfo[] = [];
    let y = startYear;
    let m = startMonth;

    while (y < currentYear || (y === currentYear && m <= currentMonth)) {
      const d = new Date(y, m - 1, 1);
      const monthLong = d.toLocaleString('pt-PT', { month: 'long' });
      const monthShort = d.toLocaleString('pt-PT', { month: 'short' });
      const capLong = monthLong.charAt(0).toUpperCase() + monthLong.slice(1);
      const capShort = monthShort.charAt(0).toUpperCase() + monthShort.slice(1);

      months.push({
        key: `${y}-${m}`,
        paddedKey: `${y}-${String(m).padStart(2, '0')}`,
        label: `${capLong} de ${y}`,
        shortLabel: `${capShort} ${y}`,
        year: y,
        month: m
      });

      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }

    if (months.length === 0) {
      const d = new Date(currentYear, currentMonth - 1, 1);
      const monthLong = d.toLocaleString('pt-PT', { month: 'long' });
      const monthShort = d.toLocaleString('pt-PT', { month: 'short' });
      months.push({
        key: `${currentYear}-${currentMonth}`,
        paddedKey: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
        label: `${monthLong.charAt(0).toUpperCase() + monthLong.slice(1)} de ${currentYear}`,
        shortLabel: `${monthShort.charAt(0).toUpperCase() + monthShort.slice(1)} ${currentYear}`,
        year: currentYear,
        month: currentMonth
      });
    }

    return months;
  };

  const handleMonthClick = (monthItem: PaymentMonthInfo) => {
    if (!selectedStudent) return;
    const isPaid = Boolean(
      selectedStudent.tuitionPayments[monthItem.key] || 
      selectedStudent.tuitionPayments[monthItem.paddedKey]
    );

    if (!isPaid) {
      // 1. Pending -> Paid
      // Tuition rule: <18 = 12.000 Kz, >=18 = 15.000 Kz
      const feeInfo = getStudentFee(selectedStudent);
      const amount = feeInfo.amount;

      // Automatically register income transaction in Finance
      const newTransaction: Transaction = {
        id: 'tx_propina_' + Date.now().toString() + '_' + Math.random().toString().slice(2, 6),
        type: 'income',
        category: 'tuition',
        amount: amount,
        date: new Date().toISOString(),
        description: `Mensalidade - ${monthItem.label} - Aluno: ${selectedStudent.fullName}`,
        relatedStudentId: selectedStudent.id,
        status: 'paid',
        destinationType: 'caixa',
        relatedYearMonth: monthItem.key
      };

      StorageService.saveTransaction(newTransaction);

      // Update student payments
      const payments = { ...selectedStudent.tuitionPayments };
      payments[monthItem.key] = true;
      payments[monthItem.paddedKey] = true;

      const updatedStudent: Student = {
        ...selectedStudent,
        tuitionPayments: payments
      };

      StorageService.saveStudent(updatedStudent);
      StorageService.addAuditLog(
        'tuition_payment',
        `Registou pagamento de mensalidade de ${monthItem.label} para o aluno ${selectedStudent.fullName} (${amount.toLocaleString('pt-AO')} Kz - ${feeInfo.tierLabel})`
      );

      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      setSelectedStudent(updatedStudent);
      refreshData();
    } else {
      // 2. Paid -> Prompt for Admin Password to Cancel/Delete Transaction
      setPendingMonthToCancel(monthItem);
      setAdminPasswordInput('');
      setAdminAuthError('');
      setIsCancelModalOpen(true);
    }
  };

  const handleConfirmCancelTuition = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedStudent || !pendingMonthToCancel) return;

    if (!adminPasswordInput.trim()) {
      setAdminAuthError('Por favor, digite a palavra-passe de um administrador.');
      return;
    }

    const authResult = StorageService.validateAdminPassword(adminPasswordInput);
    if (!authResult.isValid) {
      setAdminAuthError('Palavra-passe de administrador incorreta! Ação não autorizada.');
      return;
    }

    // Validation succeeded: Delete transaction from Finance
    const allTx = StorageService.getTransactions();
    const txToDelete = allTx.find(t =>
      t.relatedStudentId === selectedStudent.id && (
        t.relatedYearMonth === pendingMonthToCancel.key ||
        t.relatedYearMonth === pendingMonthToCancel.paddedKey ||
        (t.category === 'tuition' && (
          t.description.includes(pendingMonthToCancel.label) ||
          t.description.includes(pendingMonthToCancel.shortLabel) ||
          t.description.includes(pendingMonthToCancel.key)
        ))
      )
    );

    if (txToDelete) {
      StorageService.deleteTransaction(txToDelete.id);
    }

    // Revert student tuition payment status
    const payments = { ...selectedStudent.tuitionPayments };
    delete payments[pendingMonthToCancel.key];
    delete payments[pendingMonthToCancel.paddedKey];

    const updatedStudent: Student = {
      ...selectedStudent,
      tuitionPayments: payments
    };

    StorageService.saveStudent(updatedStudent);
    StorageService.addAuditLog(
      'tuition_cancel',
      `Eliminou a transação da mensalidade de ${pendingMonthToCancel.label} do aluno ${selectedStudent.fullName} (autorizado pelo Administrador: ${authResult.adminName})`
    );

    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    setSelectedStudent(updatedStudent);
    refreshData();

    // Close modal
    setIsCancelModalOpen(false);
    setPendingMonthToCancel(null);
    setAdminPasswordInput('');
    setAdminAuthError('');
  };
  
  const handleAddGrade = () => {
      if (!selectedStudent) return;
      
      if (!gradeForm.score) {
          alert("Por favor insira uma nota.");
          return;
      }

      const scoreNum = Number(gradeForm.score);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
          alert("Por favor insira uma nota válida (0-100).");
          return;
      }
      
      const newGrade = { 
          assessment: gradeForm.type, 
          score: scoreNum, 
          date: new Date().toISOString() 
      };

      const updatedStudent = { 
          ...selectedStudent, 
          grades: [...(selectedStudent.grades || []), newGrade] 
      };
      
      StorageService.saveStudent(updatedStudent);
      
      // Update state
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      setSelectedStudent(updatedStudent);
      
      setGradeForm({ ...gradeForm, score: '' });
  };

  // Check if student has paid all necessary months for current course
  const canFinishCourse = (student: Student) => {
      const paymentMonths = getPaymentMonths(student);
      if (paymentMonths.length === 0) return false;
      return paymentMonths.every(m => student.tuitionPayments[m.key] || student.tuitionPayments[m.paddedKey]);
  };

  const handleFinishCourse = () => {
      if (!selectedStudent) return;
      
      // Get current course BEFORE clearing it
      const currentCourse = courses.find(c => c.id === selectedStudent.courseId);
      
      if (!currentCourse) {
          alert("Erro: Curso atual não encontrado.");
          return;
      }

      const pendingPayCount = getPaymentMonths(selectedStudent).filter(m => !selectedStudent.tuitionPayments[m.key] && !selectedStudent.tuitionPayments[m.paddedKey]).length;
      const warningText = pendingPayCount > 0 
        ? `\n\nAtenção: Este aluno possui ${pendingPayCount} mensalidade(s) pendente(s).` 
        : "";

      if (!confirm(`Tem certeza que deseja marcar o curso "${currentCourse.name}" como concluído? O aluno será removido da turma atual.${warningText}`)) return;

      const updatedStudent: Student = {
          ...selectedStudent,
          // ALTERAÇÃO: Adiciona o curso atual à lista de cursos concluídos
          completedCourses: [
              ...(selectedStudent.completedCourses || []),
              { 
                  courseName: currentCourse.name, 
                  completionDate: new Date().toISOString() 
              }
          ],
          // ALTERAÇÃO: Remove o curso atual do card de propinas (limpando o ID)
          courseId: '', 
          classId: '', 
          status: 'alumni' 
      };

      StorageService.saveStudent(updatedStudent);
      
      // Update state
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      setSelectedStudent(updatedStudent);
      
      alert("Curso concluído com sucesso!");
  };

  const handleSaveBehaviorNotes = () => {
    if (!selectedStudent) return;
    const updatedStudent: Student = {
        ...selectedStudent,
        behaviorNotes: behaviorNotes
    };
    StorageService.saveStudent(updatedStudent);
    
    // Update state
    setStudents(prev => prev.map(s => s.id === selectedStudent.id ? updatedStudent : s));
    setSelectedStudent(updatedStudent);
    alert("Observações de comportamento salvas com sucesso!");
  };

  const getStudentFinancialHistory = (studentId: string) => {
    return transactions
      .filter(t => t.relatedStudentId === studentId && t.type === 'income')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Sort students alphabetically by full name
  const sortedStudents = [...students].sort((a, b) => 
    a.fullName.localeCompare(b.fullName, 'pt', { sensitivity: 'base' })
  );

  // Filter students based on name, status, age, course, class, teacher, registration date
  const filteredStudents = sortedStudents.filter(student => {
    if (searchTerm && !student.fullName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterStatus && student.status !== filterStatus) {
      return false;
    }
    if (filterAge) {
      if (filterAge === 'under18') {
        if (!student.age || student.age >= 18) return false;
      } else if (filterAge === '18plus') {
        if (!student.age || student.age < 18) return false;
      } else if (String(student.age) !== String(filterAge)) {
        return false;
      }
    }
    if (filterCourse && student.courseId !== filterCourse) {
      return false;
    }
    if (filterClass && student.classId !== filterClass) {
      return false;
    }
    if (filterTeacher) {
      const studentClass = classes.find(c => c.id === student.classId);
      if (!studentClass || studentClass.teacherId !== filterTeacher) {
        return false;
      }
    }
    if (filterRegDate) {
      if (!student.registrationDate) return false;
      const studentDateStr = student.registrationDate.split('T')[0];
      if (studentDateStr !== filterRegDate) {
        return false;
      }
    }
    return true;
  });

  const hasActiveFilters = Boolean(searchTerm || filterStatus || filterAge || filterCourse || filterClass || filterTeacher || filterRegDate);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterAge('');
    setFilterCourse('');
    setFilterClass('');
    setFilterTeacher('');
    setFilterRegDate('');
  };

  const uniqueAges = Array.from(new Set(students.map(s => s.age).filter(Boolean))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {viewMode === 'list' ? 'Gestão de Alunos' : `Ficha: ${selectedStudent?.fullName}`}
        </h1>
        <div className="flex gap-2">
          {viewMode === 'detail' && (
             <Button variant="secondary" onClick={() => { setViewMode('list'); setSearchParams({}); }}>Voltar à Lista</Button>
          )}
          {viewMode === 'list' && (
            <Button onClick={openNewStudent} icon={Plus}>Novo Aluno</Button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Filter size={18} className="text-dtc-blue" />
                <span>Filtros de Alunos</span>
                {hasActiveFilters && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-dtc-blue font-bold rounded-full">
                    Filtro Ativo
                  </span>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center font-medium transition-colors cursor-pointer"
                >
                  <X size={14} className="mr-1" /> Limpar Todos os Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
              {/* Pesquisar por Nome */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar..." 
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-dtc-blue bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Status */}
              <Select
                label="Status"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="mb-0"
                options={[
                  { value: '', label: 'Todos os Status' },
                  { value: 'active', label: 'Ativos' },
                  { value: 'inactive', label: 'Inativos' },
                  { value: 'alumni', label: 'Concluídos' }
                ]}
              />

              {/* Idade */}
              <Select
                label="Idade"
                value={filterAge}
                onChange={e => setFilterAge(e.target.value)}
                className="mb-0"
                options={[
                  { value: '', label: 'Todas as Idades' },
                  { value: 'under18', label: 'Menores de 18 anos (< 18)' },
                  { value: '18plus', label: 'Maiores ou iguais a 18 anos (≥ 18)' },
                  ...uniqueAges.map(age => ({ value: String(age), label: `${age} anos` }))
                ]}
              />

              {/* Curso */}
              <Select
                label="Curso"
                value={filterCourse}
                onChange={e => {
                  setFilterCourse(e.target.value);
                  setFilterClass('');
                }}
                className="mb-0"
                options={[
                  { value: '', label: 'Todos os Cursos' },
                  ...courses.map(c => ({ value: c.id, label: c.name }))
                ]}
              />

              {/* Turma */}
              <Select
                label="Turma"
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="mb-0"
                options={[
                  { value: '', label: 'Todas as Turmas' },
                  ...(filterCourse 
                    ? classes.filter(c => c.courseId === filterCourse) 
                    : classes
                  ).map(c => ({ value: c.id, label: c.name }))
                ]}
              />

              {/* Professor */}
              <Select
                label="Professor"
                value={filterTeacher}
                onChange={e => setFilterTeacher(e.target.value)}
                className="mb-0"
                options={[
                  { value: '', label: 'Todos os Professores' },
                  ...staff
                    .filter(s => s.role.includes('Formador') || s.role.includes('Teacher') || s.role.includes('Professor') || classes.some(c => c.teacherId === s.id))
                    .map(s => ({ value: s.id, label: s.name }))
                ]}
              />

              {/* Data de Registo */}
              <div className="mb-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Data de Registo</label>
                <input
                  type="date"
                  value={filterRegDate}
                  onChange={e => setFilterRegDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-dtc-blue bg-white"
                />
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                Exibindo <strong className="text-gray-800">{filteredStudents.length}</strong> de <strong className="text-gray-800">{students.length}</strong> alunos (Ordem Alfabética)
              </span>
              {hasActiveFilters && (
                <span className="text-dtc-blue font-medium">
                  {filteredStudents.length === 0 ? 'Nenhum aluno com os filtros selecionados' : `${students.length - filteredStudents.length} aluno(s) oculto(s)`}
                </span>
              )}
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs">
                    <th className="p-4">Nome</th>
                    <th className="p-4">Idade</th>
                    <th className="p-4">Curso / Turma</th>
                    <th className="p-4">Professor Resp.</th>
                    <th className="p-4">Data Registo</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map(student => {
                      const courseName = courses.find(c => c.id === student.courseId)?.name || 'N/A';
                      const studentClass = classes.find(c => c.id === student.classId);
                      const className = studentClass?.name || '-';
                      const teacherName = staff.find(s => s.id === studentClass?.teacherId)?.name || 'Não atribuído';
                      const regDateStr = student.registrationDate ? new Date(student.registrationDate).toLocaleDateString() : '-';

                      return (
                        <tr key={student.id} className="hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => openStudentDetail(student)}>
                          <td className="p-4 font-medium text-gray-800">{student.fullName}</td>
                          <td className="p-4 text-gray-600">{student.age} Anos</td>
                          <td className="p-4 text-gray-600" onClick={e => e.stopPropagation()}>
                              <div className="font-medium text-sm text-gray-800">{courseName}</div>
                              {student.classId ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/academics?classId=${student.classId}`);
                                  }}
                                  className="text-xs text-dtc-blue hover:underline font-semibold flex items-center gap-1 cursor-pointer transition-colors bg-blue-50 px-2 py-0.5 rounded border border-blue-100 hover:bg-blue-100 mt-1"
                                  title={`Ver turma ${className} no menu Turmas & Cursos`}
                                >
                                  <Users size={12} />
                                  <span>{className}</span>
                                </button>
                              ) : (
                                <div className="text-xs text-gray-400 mt-1">{className}</div>
                              )}
                          </td>
                          <td className="p-4 text-gray-600 text-sm">{teacherName}</td>
                          <td className="p-4 text-gray-600 text-sm">{regDateStr}</td>
                          <td className="p-4">
                            <button 
                              onClick={(e) => handleStatusToggle(e, student)}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-transform active:scale-95 ${
                                  student.status === 'active' ? 'bg-green-100 text-green-700' : 
                                  student.status === 'alumni' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                              }`}
                              title="Clique para alternar status"
                            >
                              {student.status === 'active' ? 'Ativo' : student.status === 'alumni' ? 'Concluído' : 'Inativo'}
                            </button>
                          </td>
                          <td className="p-4 flex items-center gap-2">
                            <Button variant="ghost" size="sm">Ver Ficha</Button>
                            {isAdmin && (
                                <button 
                                  onClick={(e) => handleDeleteStudent(e, student.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Excluir Aluno"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                          </td>
                        </tr>
                      );
                  })}
                  {filteredStudents.length === 0 && (
                      <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nenhum aluno encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        /* Detail View */
        selectedStudent && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <div className="flex flex-col items-center p-4">
                        <div className="w-24 h-24 bg-dtc-blue rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                            {selectedStudent.fullName.charAt(0)}
                        </div>
                        <h2 className="text-xl font-bold text-center">{selectedStudent.fullName}</h2>
                        <p className="text-gray-500 font-medium">{courses.find(c => c.id === selectedStudent.courseId)?.name || 'Sem curso ativo'}</p>
                        {selectedStudent.classId ? (
                          <button
                            onClick={() => navigate(`/academics?classId=${selectedStudent.classId}`)}
                            className="mt-2 text-xs text-dtc-blue hover:underline font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 transition-colors"
                            title="Ver esta turma no menu Turmas & Cursos"
                          >
                            <Users size={14} />
                            <span>Turma: {classes.find(c => c.id === selectedStudent.classId)?.name || 'Ver Turma'}</span>
                          </button>
                        ) : (
                          <p className="text-sm text-gray-400 font-bold mt-1">Sem Turma</p>
                        )}
                        
                        <div className="mt-4 w-full">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Idade</span>
                                <span>{selectedStudent.age} Anos</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-gray-500">Turma</span>
                                {selectedStudent.classId ? (
                                    <button 
                                        onClick={() => navigate(`/academics?classId=${selectedStudent.classId}`)}
                                        className="text-sm font-semibold text-dtc-blue hover:underline flex items-center gap-1 cursor-pointer"
                                        title="Ir para esta turma no menu Turmas & Cursos"
                                    >
                                        <Users size={13} />
                                        <span>{classes.find(c => c.id === selectedStudent.classId)?.name || 'Ver Turma'}</span>
                                    </button>
                                ) : (
                                    <span className="text-gray-400 text-sm">N/A</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-gray-500">Professor Resp.</span>
                                <span className="text-sm font-medium text-gray-800">
                                    {(() => {
                                        const cls = classes.find(c => c.id === selectedStudent.classId);
                                        const teacher = staff.find(s => s.id === cls?.teacherId);
                                        return teacher ? teacher.name : 'Não atribuído';
                                    })()}
                                </span>
                            </div>
                            {selectedStudent.birthDate && (
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-500">Nascimento</span>
                                    <span>{new Date(selectedStudent.birthDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Data de Registo</span>
                                <span>{selectedStudent.registrationDate ? new Date(selectedStudent.registrationDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Telefone</span>
                                <span>{selectedStudent.phone1 || 'N/A'}</span>
                            </div>
                            {selectedStudent.address && (
                                <div className="flex justify-between py-2 border-b text-right">
                                    <span className="text-gray-500 text-left mr-2">Morada</span>
                                    <span className="text-sm truncate max-w-[160px]" title={selectedStudent.address}>{selectedStudent.address}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Responsável</span>
                                <span className="font-medium">{selectedStudent.guardianName || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Contato Resp.</span>
                                <span className="font-medium">{selectedStudent.guardianContact || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Status</span>
                                <button 
                                    onClick={(e) => handleStatusToggle(e, selectedStudent)}
                                    className={`font-bold uppercase text-sm cursor-pointer hover:underline ${
                                        selectedStudent.status === 'active' ? 'text-green-600' : 'text-red-600'
                                    }`}
                                    title="Clique para alternar (Ativo/Inativo)"
                                >
                                    {selectedStudent.status === 'active' ? 'Ativo' : 'Inativo'}
                                </button>
                            </div>
                        </div>
                        <Button className="w-full mt-6" onClick={() => setIsModalOpen(true)}>Editar Dados</Button>
                    </div>
                </Card>
                <Card title="Cursos Concluídos">
                    {selectedStudent.completedCourses && selectedStudent.completedCourses.length > 0 ? (
                        <ul className="space-y-2">
                            {selectedStudent.completedCourses.map((c, idx) => (
                                <li key={idx} className="flex items-center gap-2 bg-green-50 p-2 rounded border border-green-100">
                                    <GraduationCap size={16} className="text-green-600" />
                                    <div>
                                        <div className="text-sm font-bold text-gray-800">{c.courseName}</div>
                                        <div className="text-xs text-gray-500">{new Date(c.completionDate).toLocaleDateString()}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-4">Nenhum curso concluído ainda.</p>
                    )}
                </Card>
                <Card title="Comportamento & Notas">
                    <div className="mb-4">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Observações do Comportamento</label>
                        <textarea
                            className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-dtc-blue outline-none resize-none"
                            rows={3}
                            placeholder="Escreva observações ou notas de comportamento sobre o aluno..."
                            value={behaviorNotes}
                            onChange={e => setBehaviorNotes(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                            <Button 
                                size="sm" 
                                onClick={handleSaveBehaviorNotes}
                            >
                                Salvar Observação
                            </Button>
                        </div>
                    </div>
                    
                    {/* Add Grade Section */}
                    <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <h5 className="text-sm font-bold text-gray-700 mb-2">Adicionar Nota</h5>
                        <div className="flex flex-col sm:flex-row gap-2 items-end">
                            <div className="flex-1 w-full">
                                <label className="text-xs text-gray-500 mb-1 block">Tipo de Teste</label>
                                <select 
                                    className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-dtc-blue outline-none"
                                    value={gradeForm.type}
                                    onChange={e => setGradeForm({...gradeForm, type: e.target.value})}
                                >
                                    <option value="Avaliação de Progresso">Avaliação de Progresso</option>
                                    <option value="Mudança de Nível">Mudança de Nível</option>
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="text-xs text-gray-500 mb-1 block">Nota (0-100)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-dtc-blue outline-none"
                                    value={gradeForm.score}
                                    onChange={e => setGradeForm({...gradeForm, score: e.target.value})}
                                    min="0" max="100"
                                />
                            </div>
                            <Button size="sm" onClick={handleAddGrade} icon={Plus}>Adicionar</Button>
                        </div>
                    </div>

                    {/* Grades List */}
                    <div className="mb-4">
                        <h4 className="font-bold text-gray-700 mb-2 text-sm">Histórico de Notas</h4>
                        {selectedStudent.grades && selectedStudent.grades.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto space-y-2 mb-4 pr-1">
                                {[...selectedStudent.grades].reverse().map((g, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b pb-1 last:border-0">
                                        <div>
                                            <span className="font-medium text-gray-800">{g.assessment}</span>
                                            <span className="text-xs text-gray-400 block">{new Date(g.date).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`font-bold ${g.score >= 10 ? 'text-green-600' : 'text-red-600'}`}>{g.score}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 mb-4">Nenhuma nota registrada.</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Financial & Attendance */}
            <div className="lg:col-span-2 space-y-6">
                <Card title="Controle de Propinas">
                    {(() => {
                        const feeInfo = getStudentFee(selectedStudent);
                        const paymentMonths = getPaymentMonths(selectedStudent);
                        const pendingCount = paymentMonths.filter(m => !selectedStudent.tuitionPayments[m.key] && !selectedStudent.tuitionPayments[m.paddedKey]).length;
                        const paidCount = paymentMonths.length - pendingCount;

                        return (
                            <>
                                <div className="mb-4 text-sm text-gray-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
                                            <span className="flex items-center gap-1 font-medium">
                                                <Calendar size={14} className="text-dtc-blue" />
                                                Matrícula: <strong>{selectedStudent.registrationDate ? new Date(selectedStudent.registrationDate).toLocaleDateString('pt-PT') : 'N/A'}</strong>
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            <span className="flex items-center gap-1 font-medium">
                                                <Coins size={14} className="text-amber-600" />
                                                Mensalidade: <strong className="text-emerald-700 font-bold">{feeInfo.amount.toLocaleString('pt-AO')} Kz</strong> 
                                                <span className="text-gray-500 font-normal">({feeInfo.tierLabel})</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                            <span className="text-emerald-700 font-semibold">{paidCount} paga(s)</span>
                                            <span>•</span>
                                            <span className={pendingCount > 0 ? "text-amber-700 font-semibold" : "text-gray-500"}>
                                                {pendingCount} pendente(s) até ao mês atual
                                            </span>
                                        </div>
                                    </div>
                                    {selectedStudent.courseId && (
                                        <Button 
                                            size="sm" 
                                            variant="primary"
                                            onClick={handleFinishCourse}
                                            icon={GraduationCap}
                                        >
                                            Concluir Curso
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {paymentMonths.map((item) => {
                                         const isPaid = Boolean(
                                             selectedStudent.tuitionPayments[item.key] || 
                                             selectedStudent.tuitionPayments[item.paddedKey]
                                         );
                                         
                                         return (
                                             <div 
                                                key={item.key} 
                                                onClick={() => handleMonthClick(item)}
                                                className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center transition-all select-none relative group shadow-sm ${
                                                    isPaid 
                                                        ? 'bg-emerald-50/80 border-emerald-300 hover:border-red-400 hover:bg-red-50/40' 
                                                        : 'bg-white border-gray-200 hover:border-dtc-blue hover:shadow-md'
                                                }`}
                                                title={isPaid ? "Clique para eliminar a transação (Exige passe de Administrador)" : `Clique para pagar mensalidade (${feeInfo.amount.toLocaleString('pt-AO')} Kz)`}
                                             >
                                                 <span className="text-xs font-bold text-gray-800 mb-1 capitalize text-center">
                                                     {item.label}
                                                 </span>
                                                 {isPaid ? (
                                                     <div className="flex items-center gap-1 text-emerald-600 font-semibold text-xs my-1">
                                                         <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                                                         <span>Pago</span>
                                                     </div>
                                                 ) : (
                                                     <div className="flex items-center gap-1 text-amber-600 font-medium text-xs my-1">
                                                         <XCircle size={18} className="text-gray-300 shrink-0" />
                                                         <span>Pendente</span>
                                                     </div>
                                                 )}
                                                 <span className="text-[10px] text-gray-500 mt-0.5">
                                                     {isPaid ? 'Clique p/ cancelar' : `${feeInfo.amount.toLocaleString('pt-AO')} Kz`}
                                                 </span>
                                                 {isPaid && (
                                                     <span className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-red-100 text-red-600 text-[10px]" title="Exige passe de admin para eliminar">
                                                         <Lock size={12} />
                                                     </span>
                                                 )}
                                             </div>
                                         );
                                    })}
                                    {paymentMonths.length === 0 && (
                                        <div className="col-span-full text-center text-gray-400 py-6">
                                            Nenhum mês para exibir no controle de propinas.
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2">
                                    <span>Controle desde o mês de matrícula até ao mês atual ({paymentMonths.length} meses).</span>
                                    <span className="flex items-center gap-1 text-gray-600">
                                        <Lock size={12} className="text-gray-400" /> Cancelar transação requer autorização de Administrador.
                                    </span>
                                </div>
                            </>
                        );
                    })()}
                </Card>

                {/* Financial History Section */}
                <Card title="Histórico Financeiro Completo">
                    <div className="flex items-center justify-between mb-4 bg-gray-50 p-4 rounded-lg">
                        <span className="text-gray-600 font-medium">Total Contribuído</span>
                        <span className="text-2xl font-bold text-green-600">
                            {getStudentFinancialHistory(selectedStudent.id).reduce((sum, t) => sum + t.amount, 0).toLocaleString()} AOA
                        </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Data</th>
                                    <th className="px-4 py-2">Descrição</th>
                                    <th className="px-4 py-2">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getStudentFinancialHistory(selectedStudent.id).map(t => (
                                    <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="px-4 py-2">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-2">
                                            {t.description}
                                            <span className="block text-xs text-gray-400 capitalize">{t.category}</span>
                                        </td>
                                        <td className="px-4 py-2 font-bold text-gray-700">+{t.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {getStudentFinancialHistory(selectedStudent.id).length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-center text-gray-400">Nenhum pagamento registrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
          </div>
        )
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedStudent ? "Editar Aluno" : "Registrar Novo Aluno"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nome Completo *" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            <Input label="Data de Nascimento" type="date" value={formData.birthDate || ''} onChange={e => handleBirthDateChange(e.target.value)} />
            <Input label="Idade *" type="number" value={formData.age || ''} onChange={e => setFormData({...formData, age: Number(e.target.value)})} />
            <Input label="Morada (Endereço)" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
            
            <Select 
                label="Curso *" 
                value={formData.courseId || ''} 
                onChange={e => setFormData({...formData, courseId: e.target.value, classId: ''})}
                options={[{value: '', label: 'Selecione...'}, ...courses.map(c => ({value: c.id, label: c.name}))]}
            />

            {formData.courseId && (
                <Select 
                    label="Turma/Horário *" 
                    value={formData.classId || ''} 
                    onChange={e => setFormData({...formData, classId: e.target.value})}
                    options={[{value: '', label: 'Selecione a Turma...'}, ...classes.filter(c => c.courseId === formData.courseId).map(c => ({value: c.id, label: `${c.name} (${c.schedule})`}))]}
                />
            )}
            
            <Select 
                label="Canal de Aquisição" 
                value={formData.acquisitionChannel || 'Indicação'} 
                onChange={e => setFormData({...formData, acquisitionChannel: e.target.value})}
                options={[
                    {value: 'Facebook', label: 'Facebook'},
                    {value: 'WhatsApp', label: 'WhatsApp'},
                    {value: 'YouTube', label: 'YouTube'},
                    {value: 'Instagram', label: 'Instagram'},
                    {value: 'TikTok', label: 'TikTok'},
                    {value: 'Indicação', label: 'Indicação'},
                    {value: 'Nenhum', label: 'Nenhum'}
                ]}
            />

            <Input label="Telefone 1" value={formData.phone1 || ''} onChange={e => setFormData({...formData, phone1: e.target.value})} />
            <Input label="Email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
            <Input label="Data de Registro" type="date" value={formData.registrationDate ? new Date(formData.registrationDate).toISOString().split('T')[0] : ''} onChange={e => setFormData({...formData, registrationDate: e.target.value})} />
            
            <div className="col-span-2 border-t pt-2 mt-2 font-bold text-gray-500">Responsável (Se menor)</div>
            <Input label="Nome do Responsável" value={formData.guardianName || ''} onChange={e => setFormData({...formData, guardianName: e.target.value})} />
            <Input label="Contato do Responsável" value={formData.guardianContact || ''} onChange={e => setFormData({...formData, guardianContact: e.target.value})} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Registro</Button>
        </div>
      </Modal>

      {/* Admin Authorization Modal for Deleting/Reverting Tuition Payment */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setPendingMonthToCancel(null);
          setAdminPasswordInput('');
          setAdminAuthError('');
        }}
        title="Autorização de Administrador"
      >
        <form onSubmit={handleConfirmCancelTuition} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-sm text-amber-900 flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold text-amber-950">Eliminar Transação de Propina</p>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Esta ação irá remover a entrada financeira de mensalidade associada a este aluno no menu Financeiro e reverter o mês para <strong>Pendente</strong>.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Aluno:</span>
              <span className="font-bold text-gray-800">{selectedStudent?.fullName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Mês da Propina:</span>
              <span className="font-bold text-gray-800">{pendingMonthToCancel?.label}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
              <span className="text-gray-500 font-medium">Valor Registado:</span>
              <span className="font-bold text-emerald-700 text-sm">
                {selectedStudent ? getStudentFee(selectedStudent).amount.toLocaleString('pt-AO') : ''} Kz
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <KeyRound size={15} className="text-dtc-blue" />
              Palavra-passe de qualquer Administrador
            </label>
            <input
              type="password"
              autoFocus
              value={adminPasswordInput}
              onChange={(e) => {
                setAdminPasswordInput(e.target.value);
                setAdminAuthError('');
              }}
              placeholder="Digite a palavra-passe de um administrador..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dtc-blue focus:border-dtc-blue bg-white transition-all shadow-sm"
            />
            {adminAuthError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1 bg-red-50 p-2 rounded border border-red-100">
                <XCircle size={14} className="shrink-0 text-red-500" />
                <span>{adminAuthError}</span>
              </p>
            )}
            <p className="text-[11px] text-gray-500">
              Para segurança das contas da instituição, a transação só pode ser eliminada com a senha de um administrador.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCancelModalOpen(false);
                setPendingMonthToCancel(null);
                setAdminPasswordInput('');
                setAdminAuthError('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              icon={Trash2}
            >
              Eliminar Transação
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};