import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Modal } from '../components/UI';
import { StorageService } from '../services/storage';
import { Course, ClassSession, Staff, Student } from '../types';
import { BookOpen, Users, Clock, Edit2, Calendar } from 'lucide-react';

export const Academics: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'schedule'>('cards');
  
  // Modals
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  
  // Forms
  const [courseForm, setCourseForm] = useState<Partial<Course>>({});
  const [classForm, setClassForm] = useState<Partial<ClassSession>>({});

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setCourses(StorageService.getCourses());
    setClasses(StorageService.getClasses());
    setStaff(StorageService.getStaff().filter(s => s.role.includes('Formador') || s.role.includes('Teacher')));
    setStudents(StorageService.getStudents());
  };

  const saveCourse = () => {
    if (!courseForm.name) return alert('Nome é obrigatório');
    StorageService.saveCourse({
      id: courseForm.id || Date.now().toString(),
      name: courseForm.name,
      description: courseForm.description || '',
      durationMonths: Number(courseForm.durationMonths) || 1
    });
    setIsCourseModalOpen(false);
    refreshData();
  };

  const saveClass = () => {
    if (!classForm.name || !classForm.courseId) return alert('Campos obrigatórios faltando');
    StorageService.saveClass({
      id: classForm.id || Date.now().toString(),
      name: classForm.name,
      courseId: classForm.courseId,
      teacherId: classForm.teacherId || '',
      schedule: classForm.schedule || '',
      capacity: Number(classForm.capacity) || 0,
      status: classForm.status || 'excellent'
    });
    setIsClassModalOpen(false);
    refreshData();
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
                            className="text-gray-400 hover:text-dtc-blue p-1"
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

        {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classes.map(cls => {
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

                            <div className="mt-4 flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => { setClassForm(cls); setIsClassModalOpen(true); }}>Editar</Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
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
                        {classes.sort((a,b) => a.schedule.localeCompare(b.schedule)).map(cls => {
                             const courseName = courses.find(c => c.id === cls.courseId)?.name;
                             const teacherName = staff.find(s => s.id === cls.teacherId)?.name;
                             const count = getStudentCount(cls.id);

                             return (
                                 <tr key={cls.id} className="border-b hover:bg-blue-50">
                                     <td className="p-4 border-r font-bold text-dtc-blue whitespace-nowrap">{cls.schedule}</td>
                                     <td className="p-4">
                                         <div className="font-bold">{cls.name}</div>
                                         <div className="text-xs text-gray-500">{courseName}</div>
                                     </td>
                                     <td className="p-4 text-sm">{teacherName}</td>
                                     <td className="p-4 text-right">
                                         <span className={`px-2 py-1 rounded text-xs font-bold ${count >= cls.capacity ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                             {count} / {cls.capacity}
                                         </span>
                                     </td>
                                 </tr>
                             );
                        })}
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