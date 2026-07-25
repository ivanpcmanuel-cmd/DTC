import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Input, Select, Modal } from '../components/UI';
import { StorageService } from '../services/storage';
import { Course, ClassSession, Staff, Student } from '../types';
import { BookOpen, Users, Clock, Edit2, Calendar, Trash2, Filter, X } from 'lucide-react';

export const Academics: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'schedule'>('cards');
  
  // Filters for classes management
  const [filterClassId, setFilterClassId] = useState<string>('');
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [filterTeacher, setFilterTeacher] = useState<string>('');
  const [filterSchedule, setFilterSchedule] = useState<string>('');

  // Modals
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  
  // Forms
  const [courseForm, setCourseForm] = useState<Partial<Course>>({});
  const [classForm, setClassForm] = useState<Partial<ClassSession>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('dtc_current_user') || '{}');
    setIsAdmin(user?.role === 'admin');
    refreshData();
  }, []);

  useEffect(() => {
    const targetClassId = searchParams.get('classId');
    if (targetClassId) {
      setFilterClassId(targetClassId);
    }
  }, [searchParams]);

  const refreshData = () => {
    const loadedClasses = StorageService.getClasses();
    const loadedStaff = StorageService.getStaff();
    setCourses(StorageService.getCourses());
    setClasses(loadedClasses);
    setStaff(loadedStaff.filter(s => s.role.includes('Formador') || s.role.includes('Teacher') || s.role.includes('Professor') || loadedClasses.some(c => c.teacherId === s.id)));
    setStudents(StorageService.getStudents());
  };

  const saveCourse = () => {
    if (!courseForm.name) return alert('Nome é obrigatório');
    const isEditing = !!courseForm.id;
    StorageService.saveCourse({
      id: courseForm.id || Date.now().toString(),
      name: courseForm.name,
      description: courseForm.description || '',
      durationMonths: Number(courseForm.durationMonths) || 1
    });
    StorageService.addAuditLog('course_save', `${isEditing ? 'Atualizou os dados do' : 'Criou o'} curso ${courseForm.name}`);
    setIsCourseModalOpen(false);
    refreshData();
  };

  const saveClass = () => {
    if (!classForm.name || !classForm.courseId) return alert('Campos obrigatórios faltando');
    const isEditing = !!classForm.id;
    StorageService.saveClass({
      id: classForm.id || Date.now().toString(),
      name: classForm.name,
      courseId: classForm.courseId,
      teacherId: classForm.teacherId || '',
      schedule: classForm.schedule || '',
      capacity: Number(classForm.capacity) || 0,
      status: classForm.status || 'excellent'
    });
    StorageService.addAuditLog('class_save', `${isEditing ? 'Atualizou os dados da' : 'Criou a'} turma ${classForm.name}`);
    setIsClassModalOpen(false);
    refreshData();
  };

  const handleDeleteClass = (id: string) => {
      const classToDelete = classes.find(c => c.id === id);
      if (confirm('Tem certeza que deseja excluir esta turma?')) {
          StorageService.deleteClass(id);
          StorageService.addAuditLog('class_delete', `Eliminou a turma ${classToDelete?.name || id}`);
          refreshData();
      }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
        case 'remedy': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'inadequate': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100';
    }
  };

  // Helper to count students in a class
  const getStudentCount = (classId: string) => {
      return students.filter(s => s.classId === classId && s.status === 'active').length;
  };

  // Unique schedules extracted from classes
  const uniqueSchedules = Array.from(new Set(classes.map(c => c.schedule).filter(Boolean))).sort();

  // Filtered classes list based on Class ID, Course, Teacher, and Schedule
  const filteredClasses = classes.filter(cls => {
    if (filterClassId && cls.id !== filterClassId) return false;
    if (filterCourse && cls.courseId !== filterCourse) return false;
    if (filterTeacher) {
      if (filterTeacher === 'unassigned') {
        if (cls.teacherId) return false;
      } else if (cls.teacherId !== filterTeacher) {
        return false;
      }
    }
    if (filterSchedule && cls.schedule !== filterSchedule) return false;
    return true;
  });

  const hasActiveFilters = Boolean(filterClassId || filterCourse || filterTeacher || filterSchedule);

  const clearFilters = () => {
    setFilterClassId('');
    setFilterCourse('');
    setFilterTeacher('');
    setFilterSchedule('');
    setSearchParams({});
  };

  return (
    <div className="space-y-8">
      {/* Courses Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center"><BookOpen className="mr-2" /> Cursos Disponíveis</h2>
            <Button onClick={() => { setCourseForm({ durationMonths: 3 }); setIsCourseModalOpen(true); }} size="sm">Adicionar Curso</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
                <Card key={course.id} className="hover:shadow-md transition-shadow relative group">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-dtc-blue">{course.name}</h3>
                        <button 
                            onClick={() => { setCourseForm(course); setIsCourseModalOpen(true); }}
                            className="text-gray-400 hover:text-dtc-blue p-1 cursor-pointer"
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>
                    <p className="text-gray-600 mt-2 text-sm">{course.description || 'Sem descrição'}</p>
                    <div className="mt-2 text-xs font-semibold text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded">
                        Duração: {course.durationMonths} meses
                    </div>
                    <div className="mt-4 pt-4 border-t text-xs text-gray-400">
                        {classes.filter(c => c.courseId === course.id).length} Turmas ativas
                    </div>
                </Card>
            ))}
        </div>
      </section>

      {/* Classes Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center"><Users className="mr-2" /> Gestão de Turmas</h2>
            <div className="flex gap-2">
                <Button variant={viewMode === 'cards' ? 'primary' : 'secondary'} onClick={() => setViewMode('cards')} size="sm">Lista</Button>
                <Button variant={viewMode === 'schedule' ? 'primary' : 'secondary'} onClick={() => setViewMode('schedule')} size="sm" icon={Calendar}>Cronograma</Button>
                <Button onClick={() => { setClassForm({ status: 'excellent' }); setIsClassModalOpen(true); }} size="sm">Nova Turma</Button>
            </div>
        </div>

        {/* Filter Bar for Gestão de Turmas */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
          {filterClassId && (
            <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 flex items-center justify-between">
              <span>
                Filtro direcionado para a turma: <strong>{classes.find(c => c.id === filterClassId)?.name || 'Turma Selecionada'}</strong>
              </span>
              <button 
                onClick={() => { setFilterClassId(''); setSearchParams({}); }}
                className="text-dtc-blue hover:underline font-bold cursor-pointer"
              >
                Ver todas as turmas
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Filter size={18} className="text-dtc-blue" />
              <span>Filtrar Gestão de Turmas</span>
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
                <X size={14} className="mr-1" /> Limpar Filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Filter by Curso */}
            <Select
              label="Curso"
              value={filterCourse}
              onChange={e => setFilterCourse(e.target.value)}
              className="mb-0"
              options={[
                { value: '', label: 'Todos os Cursos' },
                ...courses.map(c => ({ value: c.id, label: c.name }))
              ]}
            />

            {/* Filter by Professor */}
            <Select
              label="Professor"
              value={filterTeacher}
              onChange={e => setFilterTeacher(e.target.value)}
              className="mb-0"
              options={[
                { value: '', label: 'Todos os Professores' },
                { value: 'unassigned', label: 'Sem Professor Atribuído' },
                ...staff.map(s => ({ value: s.id, label: s.name }))
              ]}
            />

            {/* Filter by Horário */}
            <Select
              label="Horário"
              value={filterSchedule}
              onChange={e => setFilterSchedule(e.target.value)}
              className="mb-0"
              options={[
                { value: '', label: 'Todos os Horários' },
                ...uniqueSchedules.map(sch => ({ value: sch, label: sch }))
              ]}
            />
          </div>

          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Exibindo <strong className="text-gray-800">{filteredClasses.length}</strong> de <strong className="text-gray-800">{classes.length}</strong> turmas
            </span>
            {hasActiveFilters && (
              <span className="text-dtc-blue font-medium">
                {filteredClasses.length === 0 ? 'Nenhum resultado para os filtros' : `${classes.length - filteredClasses.length} turma(s) oculta(s)`}
              </span>
            )}
          </div>
        </div>

        {viewMode === 'cards' ? (
            filteredClasses.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-lg border border-gray-200 shadow-sm">
                    <Filter className="mx-auto text-gray-400 mb-3" size={32} />
                    <h3 className="text-base font-semibold text-gray-700">Nenhuma turma encontrada</h3>
                    <p className="text-sm text-gray-500 mt-1">Nenhuma turma corresponde aos filtros selecionados (Curso, Professor ou Horário).</p>
                    {hasActiveFilters && (
                        <Button variant="secondary" size="sm" onClick={clearFilters} className="mt-4">
                            Limpar Filtros
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredClasses.map(cls => {
                        const courseName = courses.find(c => c.id === cls.courseId)?.name;
                        const teacherName = staff.find(s => s.id === cls.teacherId)?.name;
                        const studentCount = getStudentCount(cls.id);
                        const occupancy = cls.capacity > 0 ? (studentCount / cls.capacity) * 100 : 0;
                        
                        return (
                            <Card key={cls.id} className="border-l-4 border-l-dtc-blue">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{cls.name}</h3>
                                        <p className="text-dtc-blue text-sm font-semibold">{courseName}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(cls.status)}`}>
                                        {cls.status.toUpperCase()}
                                    </span>
                                </div>
                                
                                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center text-gray-600">
                                        <Clock size={16} className="mr-2" />
                                        {cls.schedule}
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Users size={16} className="mr-2" />
                                        {studentCount} / {cls.capacity} Alunos
                                    </div>
                                </div>

                                {/* Occupancy Bar */}
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Ocupação</span>
                                        <span>{occupancy.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${occupancy >= 100 ? 'bg-red-500' : occupancy > 80 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                            style={{ width: `${Math.min(occupancy, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <div className="mt-4 bg-gray-50 p-2 rounded text-sm">
                                    <span className="font-semibold text-gray-700">Professor: </span>
                                    {teacherName || 'Não atribuído'}
                                </div>

                                {/* Alunos Inscritos na Turma */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Alunos Inscritos ({students.filter(s => s.classId === cls.id).length})
                                    </h4>
                                    {students.filter(s => s.classId === cls.id).length > 0 ? (
                                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                            {students.filter(s => s.classId === cls.id).map(student => (
                                                <div 
                                                    key={student.id} 
                                                    className="flex items-center justify-between text-xs p-1.5 hover:bg-gray-50 rounded transition-colors"
                                                >
                                                    <button 
                                                        onClick={() => navigate(`/students?studentId=${student.id}`)}
                                                        className="text-gray-700 hover:text-dtc-blue font-semibold hover:underline text-left cursor-pointer truncate max-w-[70%]"
                                                        title={`Ver ficha de ${student.fullName}`}
                                                    >
                                                        {student.fullName}
                                                    </button>
                                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                                        student.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 
                                                        student.status === 'alumni' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                                                        'bg-red-50 text-red-700 border border-red-200'
                                                    }`}>
                                                        {student.status === 'active' ? 'Ativo' : student.status === 'alumni' ? 'Concluído' : 'Inativo'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">Nenhum aluno inscrito nesta turma.</p>
                                    )}
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => { setClassForm(cls); setIsClassModalOpen(true); }}>Editar</Button>
                                    {isAdmin && (
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            className="text-red-600 hover:bg-red-50"
                                            onClick={() => handleDeleteClass(cls.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )
        ) : (
            /* Schedule Grid View */
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                    <h3 className="font-bold text-gray-700">Ocupação de Horários & Salas</h3>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-sm text-gray-600 border-b">
                            <th className="p-4 border-r w-32">Horário</th>
                            <th className="p-4">Turma / Curso</th>
                            <th className="p-4">Professor</th>
                            <th className="p-4 text-right">Ocupação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClasses.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    <p className="font-semibold text-gray-700 mb-1">Nenhuma turma encontrada</p>
                                    <p className="text-xs mb-3">Tente ajustar ou limpar os filtros selecionados.</p>
                                    {hasActiveFilters && (
                                        <Button variant="secondary" size="sm" onClick={clearFilters}>
                                            Limpar Filtros
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            filteredClasses.sort((a,b) => a.schedule.localeCompare(b.schedule)).map(cls => {
                                 const courseName = courses.find(c => c.id === cls.courseId)?.name;
                                 const teacherName = staff.find(s => s.id === cls.teacherId)?.name;
                                 const count = getStudentCount(cls.id);

                                 return (
                                     <tr key={cls.id} className="border-b hover:bg-blue-50">
                                         <td className="p-4 border-r font-bold text-dtc-blue whitespace-nowrap">{cls.schedule}</td>
                                         <td className="p-4">
                                             <div className="font-bold">{cls.name}</div>
                                             <div className="text-xs text-gray-500">{courseName}</div>
                                             <div className="mt-2 flex flex-wrap gap-1.5">
                                                 {students.filter(s => s.classId === cls.id).map(student => (
                                                     <button
                                                         key={student.id}
                                                         onClick={() => navigate(`/students?studentId=${student.id}`)}
                                                         className="text-[10px] bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-dtc-blue px-1.5 py-0.5 rounded border border-gray-200 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                                                         title={`Ver ficha de ${student.fullName} (Status: ${student.status})`}
                                                     >
                                                         <span>{student.fullName}</span>
                                                         <span className={`w-1.5 h-1.5 rounded-full ${
                                                             student.status === 'active' ? 'bg-green-500' : 
                                                             student.status === 'alumni' ? 'bg-blue-500' : 'bg-red-500'
                                                         }`} />
                                                     </button>
                                                 ))}
                                                 {students.filter(s => s.classId === cls.id).length === 0 && (
                                                     <span className="text-[10px] text-gray-400 italic">Sem alunos inscritos</span>
                                                 )}
                                             </div>
                                         </td>
                                         <td className="p-4 text-sm">{teacherName}</td>
                                         <td className="p-4 text-right">
                                             <span className={`px-2 py-1 rounded text-xs font-bold ${count >= cls.capacity ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                 {count} / {cls.capacity}
                                             </span>
                                         </td>
                                     </tr>
                                 );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </section>

      {/* Course Modal */}
      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title={courseForm.id ? "Editar Curso" : "Novo Curso"}>
          <Input label="Nome do Curso" value={courseForm.name || ''} onChange={e => setCourseForm({...courseForm, name: e.target.value})} />
          <Input label="Duração (Meses)" type="number" value={courseForm.durationMonths || ''} onChange={e => setCourseForm({...courseForm, durationMonths: Number(e.target.value)})} />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea className="w-full border rounded p-2" value={courseForm.description || ''} onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
              <Button onClick={saveCourse}>Salvar</Button>
          </div>
      </Modal>

      {/* Class Modal */}
      <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Gerir Turma">
          <Input label="Nome da Turma (Ex: Turma A)" value={classForm.name || ''} onChange={e => setClassForm({...classForm, name: e.target.value})} />
          
          <Select 
            label="Curso" 
            value={classForm.courseId || ''} 
            onChange={e => setClassForm({...classForm, courseId: e.target.value})}
            options={[{value: '', label: 'Selecione...'}, ...courses.map(c => ({value: c.id, label: c.name}))]}
          />
          
          <Select 
            label="Professor Responsável" 
            value={classForm.teacherId || ''} 
            onChange={e => setClassForm({...classForm, teacherId: e.target.value})}
            options={[{value: '', label: 'Selecione...'}, ...staff.map(s => ({value: s.id, label: s.name}))]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Horário (Ex: 08:00-09:30)" value={classForm.schedule || ''} onChange={e => setClassForm({...classForm, schedule: e.target.value})} />
            <Input label="Capacidade" type="number" value={classForm.capacity || ''} onChange={e => setClassForm({...classForm, capacity: Number(e.target.value)})} />
          </div>

          <Select 
            label="Estado da Turma" 
            value={classForm.status || 'excellent'} 
            onChange={e => setClassForm({...classForm, status: e.target.value as any})}
            options={[
                {value: 'excellent', label: 'Excellent (Verde)'},
                {value: 'remedy', label: 'Remedy (Amarelo)'},
                {value: 'inadequate', label: 'Inadequate (Vermelho)'}
            ]}
          />
          
          <div className="flex justify-end gap-2 mt-4">
              <Button onClick={saveClass}>Salvar Turma</Button>
          </div>
      </Modal>
    </div>
  );
};
