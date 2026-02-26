import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Modal } from '../components/UI';
import { StorageService } from '../services/storage';
import { Student, Course, Transaction, ClassSession } from '../types';
import { Plus, Search, CheckCircle, XCircle, GraduationCap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({});

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setStudents(StorageService.getStudents());
    setCourses(StorageService.getCourses());
    setClasses(StorageService.getClasses());
    setTransactions(StorageService.getTransactions());
  };

  const handleSave = () => {
    if (!formData.fullName || !formData.age || !formData.courseId) {
      alert("Preencha os campos obrigatórios!");
      return;
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
      registrationDate: selectedStudent?.registrationDate || new Date().toISOString(),
      acquisitionChannel: formData.acquisitionChannel || 'Indicação',
      description: formData.description || '',
      behaviorNotes: formData.behaviorNotes || '',
      grades: selectedStudent?.grades || [],
      attendances: selectedStudent?.attendances || [],
      tuitionPayments: selectedStudent?.tuitionPayments || {},
      completedCourses: selectedStudent?.completedCourses || []
    };

    StorageService.saveStudent(newStudent);
    setIsModalOpen(false);
    refreshData();
    // If editing in detail mode, update the view
    if (viewMode === 'detail' && selectedStudent?.id === newStudent.id) {
        setSelectedStudent(newStudent);
    }
  };

  const openNewStudent = () => {
    setSelectedStudent(null);
    setFormData({ status: 'active', acquisitionChannel: 'Indicação' });
    setViewMode('list');
    setIsModalOpen(true);
  };

  const openStudentDetail = (student: Student) => {
    setSelectedStudent(student);
    setFormData(student);
    setViewMode('detail');
  };

  const handleStatusToggle = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation(); // Prevent opening detail view
    const newStatus: 'active' | 'inactive' = student.status === 'active' ? 'inactive' : 'active';
    const updatedStudent: Student = { ...student, status: newStatus };
    StorageService.saveStudent(updatedStudent);
    
    // Update local state immediately
    setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
    if (selectedStudent?.id === student.id) setSelectedStudent(updatedStudent);
  };

  const togglePayment = (monthKey: string) => {
    if (!selectedStudent) return;
    const payments = { ...selectedStudent.tuitionPayments };
    payments[monthKey] = !payments[monthKey];
    
    const updated = { ...selectedStudent, tuitionPayments: payments };
    StorageService.saveStudent(updated);
    setSelectedStudent(updated);
    refreshData();
  };
  
  const addGrade = (assessment: string, score: number) => {
      if(!selectedStudent) return;
      const newGrades = [...selectedStudent.grades, { assessment, score, date: new Date().toISOString() }];
      const updated = { ...selectedStudent, grades: newGrades };
      StorageService.saveStudent(updated);
      setSelectedStudent(updated);
      refreshData();
  }

  // Check if student has paid all necessary months for current course
  const canFinishCourse = (student: Student) => {
      const paymentMonths = getPaymentMonths(student);
      if (paymentMonths.length === 0) return false;
      return paymentMonths.every(m => student.tuitionPayments[m.key]);
  };

  const handleFinishCourse = () => {
      if (!selectedStudent) return;
      if (!confirm("Tem certeza que deseja marcar este curso como concluído? O aluno será removido da turma atual.")) return;

      const currentCourse = courses.find(c => c.id === selectedStudent.courseId);
      if (!currentCourse) return;

      const updatedStudent: Student = {
          ...selectedStudent,
          completedCourses: [
              ...(selectedStudent.completedCourses || []),
              { courseName: currentCourse.name, completionDate: new Date().toISOString() }
          ],
          courseId: '', // Clear current course
          classId: '', // Clear current class
          status: 'alumni' // Optional: mark as alumni/inactive
      };

      StorageService.saveStudent(updatedStudent);
      setSelectedStudent(updatedStudent);
      refreshData();
      alert("Curso marcado como concluído com sucesso!");
  };

  // Helper to generate monthly payment keys based on course duration and start date
  const getPaymentMonths = (student: Student) => {
    const course = courses.find(c => c.id === student.courseId);
    if (!course) return [];
    
    const duration = course.durationMonths || 12; // Default to 12 if not set
    const startDate = new Date(student.registrationDate);
    const months = [];

    for (let i = 0; i < duration; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-based
        const monthName = d.toLocaleString('pt-PT', { month: 'short' });
        
        months.push({
            key: `${year}-${month}`,
            label: `${monthName} ${year}`
        });
    }
    return months;
  };

  const getStudentFinancialHistory = (studentId: string) => {
    return transactions
      .filter(t => t.relatedStudentId === studentId && t.type === 'income')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {viewMode === 'list' ? 'Gestão de Alunos' : `Ficha: ${selectedStudent?.fullName}`}
        </h1>
        <div className="flex gap-2">
          {viewMode === 'detail' && (
             <Button variant="secondary" onClick={() => setViewMode('list')}>Voltar à Lista</Button>
          )}
          {viewMode === 'list' && (
            <Button onClick={openNewStudent} icon={Plus}>Novo Aluno</Button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <Card>
          <div className="mb-4">
             <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Pesquisar por nome..." 
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-dtc-blue"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs">
                  <th className="p-4">Nome</th>
                  <th className="p-4">Idade</th>
                  <th className="p-4">Curso / Turma</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map(student => {
                    const courseName = courses.find(c => c.id === student.courseId)?.name || 'N/A';
                    const className = classes.find(c => c.id === student.classId)?.name || '-';
                    return (
                      <tr key={student.id} className="hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => openStudentDetail(student)}>
                        <td className="p-4 font-medium text-gray-800">{student.fullName}</td>
                        <td className="p-4 text-gray-600">{student.age}</td>
                        <td className="p-4 text-gray-600">
                            <div className="font-medium text-sm">{courseName}</div>
                            <div className="text-xs text-gray-400">{className}</div>
                        </td>
                        <td className="p-4">
                          <button 
                            onClick={(e) => handleStatusToggle(e, student)}
                            className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer transition-transform active:scale-95 ${
                                student.status === 'active' ? 'bg-green-100 text-green-700' : 
                                student.status === 'alumni' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                            }`}
                            title="Clique para alternar status"
                          >
                            {student.status === 'active' ? 'Ativo' : student.status === 'alumni' ? 'Concluído' : 'Inativo'}
                          </button>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">Ver Ficha</Button>
                        </td>
                      </tr>
                    );
                })}
                {filteredStudents.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum aluno encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
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
                        <p className="text-gray-500">{courses.find(c => c.id === selectedStudent.courseId)?.name || 'Sem curso ativo'}</p>
                        <p className="text-sm text-gray-400 font-bold">{classes.find(c => c.id === selectedStudent.classId)?.name || 'Sem Turma'}</p>
                        
                        <div className="mt-4 w-full">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Idade</span>
                                <span>{selectedStudent.age} Anos</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Status</span>
                                <span className={`font-bold uppercase text-sm`}>{selectedStudent.status}</span>
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
                    <p className="text-sm text-gray-600 italic mb-4">"{selectedStudent.behaviorNotes || 'Sem observações.'}"</p>
                    <h4 className="font-bold text-gray-700 mb-2">Desempenho (Gráfico)</h4>
                    
                    {/* Performance Chart */}
                    <div className="h-40 mb-4">
                        {selectedStudent.grades.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={selectedStudent.grades}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="assessment" tick={{fontSize: 10}} interval={0} />
                                    <YAxis domain={[0, 20]} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="score" stroke="#0047AB" strokeWidth={2} dot={{r: 3}} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-xs">Sem dados para gráfico</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Financial & Attendance */}
            <div className="lg:col-span-2 space-y-6">
                <Card title="Controle de Propinas (Curso Atual)">
                    <div className="mb-4 text-sm text-gray-500 flex justify-between items-center">
                        <span>Matriculado em: {new Date(selectedStudent.registrationDate).toLocaleDateString()}</span>
                        {selectedStudent.courseId && (
                            <Button 
                                size="sm" 
                                variant={canFinishCourse(selectedStudent) ? 'primary' : 'secondary'}
                                onClick={handleFinishCourse}
                                disabled={!canFinishCourse(selectedStudent)}
                                icon={GraduationCap}
                                title={!canFinishCourse(selectedStudent) ? "Regularize todas as propinas para concluir." : ""}
                            >
                                Concluir Curso
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {getPaymentMonths(selectedStudent).map((item) => {
                             const isPaid = selectedStudent.tuitionPayments[item.key];
                             
                             return (
                                 <div 
                                    key={item.key} 
                                    onClick={() => togglePayment(item.key)}
                                    className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center transition-all ${isPaid ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-dtc-blue'}`}
                                 >
                                     <span className="text-sm font-bold text-gray-700 mb-1 capitalize">{item.label}</span>
                                     {isPaid ? <CheckCircle className="text-green-500" size={20} /> : <XCircle className="text-gray-300" size={20} />}
                                     <span className="text-xs mt-1 text-gray-500">{isPaid ? 'Pago' : 'Pendente'}</span>
                                 </div>
                             )
                        })}
                        {getPaymentMonths(selectedStudent).length === 0 && (
                            <div className="col-span-full text-center text-gray-400 py-4">
                                Selecione um curso para visualizar as mensalidades ou veja o histórico de cursos concluídos.
                            </div>
                        )}
                    </div>
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
            <Input label="Idade *" type="number" value={formData.age || ''} onChange={e => setFormData({...formData, age: Number(e.target.value)})} />
            
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
                label="Status" 
                value={formData.status || 'active'} 
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                options={[{value: 'active', label: 'Ativo'}, {value: 'inactive', label: 'Inativo'}, {value: 'alumni', label: 'Concluído'}]}
            />

            <Input label="Telefone 1" value={formData.phone1 || ''} onChange={e => setFormData({...formData, phone1: e.target.value})} />
            <Input label="Email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
            
            <div className="col-span-2 border-t pt-2 mt-2 font-bold text-gray-500">Responsável (Se menor)</div>
            <Input label="Nome do Responsável" value={formData.guardianName || ''} onChange={e => setFormData({...formData, guardianName: e.target.value})} />
            <Input label="Contato do Responsável" value={formData.guardianContact || ''} onChange={e => setFormData({...formData, guardianContact: e.target.value})} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Registro</Button>
        </div>
      </Modal>
    </div>
  );
};