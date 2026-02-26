import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Card, Select } from '../components/UI';
import { StorageService } from '../services/storage';
import { Student, Transaction, Staff, ClassSession } from '../types';
import { Users, DollarSign, Activity, UserPlus, Calendar } from 'lucide-react';

const COLORS = ['#0047AB', '#D32F2F', '#FFBB28', '#00C49F'];

export const Dashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  
  // Date State for Filters (Default to current month)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    StorageService.checkOverduePayments();
    
    setStudents(StorageService.getStudents());
    setTransactions(StorageService.getTransactions());
    setStaff(StorageService.getStaff());
    setClasses(StorageService.getClasses());
  }, []);

  // --- KPI Calculations (Based on Selected Month) ---
  const activeStudents = students.filter(s => s.status === 'active').length;
  const totalStudents = students.length;
  const inactiveStudents = totalStudents - activeStudents;
  
  const monthlyRevenue = transactions
    .filter(t => t.type === 'income' && new Date(t.date).getMonth() === selectedMonth && new Date(t.date).getFullYear() === selectedYear)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // New Enrollments in selected Month
  const newEnrollments = students.filter(s => {
      const d = new Date(s.registrationDate);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  }).length;
  
  // Occupancy Rate
  const totalCapacity = classes.reduce((acc, cls) => acc + cls.capacity, 0);
  const occupancyRate = totalCapacity > 0 ? (activeStudents / totalCapacity) * 100 : 0;

  // --- Chart Data Prep: Daily Breakdown for Selected Month ---
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      // Format date string YYYY-MM-DD for comparison
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const dayIncome = transactions
        .filter(t => t.type === 'income' && t.date === dateStr)
        .reduce((acc, curr) => acc + curr.amount, 0);
      
      const dayExpense = transactions
        .filter(t => t.type === 'expense' && t.date === dateStr)
        .reduce((acc, curr) => acc + curr.amount, 0);
        
      const dayNewStudents = students.filter(s => s.registrationDate.startsWith(dateStr)).length;

      return {
          name: day.toString(),
          Receitas: dayIncome,
          Despesas: dayExpense,
          Saldo: dayIncome - dayExpense,
          Matriculas: dayNewStudents
      };
  });

  // --- Chart Data: Teacher Workload (Classes count) ---
  const teacherWorkload = staff
    .filter(s => s.role.toLowerCase().includes('formador') || s.role.toLowerCase().includes('teacher'))
    .map(s => {
        const classCount = classes.filter(c => c.teacherId === s.id).length;
        return { name: s.name.split(' ')[0], Turmas: classCount }; // Just first name
    })
    .sort((a, b) => b.Turmas - a.Turmas);

  // --- Chart Data: Time Slot Occupancy ---
  const timeSlotOccupancy = classes.reduce((acc: any[], cls) => {
      const slot = cls.schedule;
      const found = acc.find(i => i.name === slot);
      if (found) found.Ocupacao++;
      else acc.push({ name: slot, Ocupacao: 1 });
      return acc;
  }, []).sort((a,b) => b.Ocupacao - a.Ocupacao);


  // --- Acquisition Channels ---
  const channelData = students.reduce((acc: any[], curr) => {
    const channel = curr.acquisitionChannel || 'Outros';
    const found = acc.find(i => i.name === channel);
    if (found) found.value++;
    else acc.push({ name: channel, value: 1 });
    return acc;
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} className={color.replace('bg-', 'text-').replace('-100', '-600')} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Visão Geral & Indicadores</h1>
        
        {/* Date Filter */}
        <div className="flex gap-2 bg-white p-2 rounded shadow-sm border">
            <Calendar size={20} className="text-gray-400 mt-2" />
            <select 
                className="bg-transparent font-semibold text-gray-700 outline-none cursor-pointer"
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
            >
                {Array.from({length: 12}, (_, i) => (
                    <option key={i} value={i}>{new Date(0, i).toLocaleString('pt-PT', {month: 'long'})}</option>
                ))}
            </select>
            <select 
                className="bg-transparent font-semibold text-gray-700 outline-none cursor-pointer"
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
            >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
            </select>
        </div>
      </div>
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Receita (Mês Selecionado)" value={`${monthlyRevenue.toLocaleString()} AOA`} icon={DollarSign} color="bg-green-100" />
        <StatCard title="Total Alunos" value={totalStudents} icon={Users} color="bg-blue-100" subtext={`${activeStudents} Ativos • ${inactiveStudents} Inativos`} />
        <StatCard title="Novas Matrículas" value={newEnrollments} icon={UserPlus} color="bg-blue-100" subtext="No mês selecionado" />
        <StatCard title="Ocupação Global" value={`${occupancyRate.toFixed(1)}%`} icon={Activity} color="bg-yellow-100" subtext="Vagas preenchidas" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Chart - Daily */}
        <Card title={`Fluxo de Caixa Diário (${new Date(selectedYear, selectedMonth).toLocaleString('pt-PT', {month: 'long'})})`}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00C49F" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D32F2F" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#D32F2F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={2} />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="Receitas" stroke="#00C49F" fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="Despesas" stroke="#D32F2F" fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Student Growth Chart - Daily */}
        <Card title={`Evolução de Matrículas (${new Date(selectedYear, selectedMonth).toLocaleString('pt-PT', {month: 'long'})})`}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={2} />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="Matriculas" fill="#0047AB" name="Novas Matrículas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* New Charts: Productivity & Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Carga Horária (Top Formadores)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teacherWorkload} layout="vertical" margin={{left: 20}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={80} />
                        <RechartsTooltip />
                        <Bar dataKey="Turmas" fill="#FFBB28" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </Card>

          <Card title="Horários Mais Cheios (Ocupação)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeSlotOccupancy} margin={{bottom: 20}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="Ocupacao" fill="#00C49F" name="Qtd Turmas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </Card>
      </div>

      {/* Channels */}
      <div className="grid grid-cols-1">
        <Card title="Canais de Aquisição (Total)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {channelData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};