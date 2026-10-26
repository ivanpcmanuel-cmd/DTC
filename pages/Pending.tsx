import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, 
  ListTodo, 
  StickyNote, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Pin, 
  Trash2, 
  Edit3, 
  Calendar, 
  User as UserIcon, 
  Tag, 
  X, 
  Check, 
  ChevronDown,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FolderOpen
} from 'lucide-react';
import { Card, Button, Modal } from '../components/UI';
import { StorageService } from '../services/storage';
import { 
  PendingItem, 
  PendingType, 
  PendingPriority, 
  PendingStatus, 
  PendingCategory,
  ChecklistItem,
  Staff
} from '../types';

export const Pending: React.FC = () => {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  
  // Filters
  const [selectedType, setSelectedType] = useState<PendingType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<PendingStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<PendingPriority | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<PendingCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeTypeToCreate, setActiveTypeToCreate] = useState<PendingType>('checklist');
  const [editingItem, setEditingItem] = useState<PendingItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PendingItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<PendingCategory>('academic');
  const [formPriority, setFormPriority] = useState<PendingPriority>('medium');
  const [formStatus, setFormStatus] = useState<PendingStatus>('in_progress');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formPinned, setFormPinned] = useState(false);
  const [formColor, setFormColor] = useState('amber');
  const [formTags, setFormTags] = useState('');
  const [formChecklistItems, setFormChecklistItems] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newChecklistInput, setNewChecklistInput] = useState('');

  // Inline checklist quick-add state per card
  const [quickAddChecklist, setQuickAddChecklist] = useState<{ [cardId: string]: string }>({});

  const loadData = () => {
    setItems(StorageService.getPendingItems());
    setStaffList(StorageService.getStaff());
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Type Filter
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      // Status Filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
      // Priority Filter
      if (selectedPriority !== 'all' && item.priority !== selectedPriority) return false;
      // Category Filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = item.title.toLowerCase().includes(q);
        const inDesc = item.description?.toLowerCase().includes(q) || false;
        const inAssignee = item.assignedTo?.toLowerCase().includes(q) || false;
        const inTags = item.tags?.some(t => t.toLowerCase().includes(q)) || false;
        const inChecklist = item.checklistItems?.some(c => c.text.toLowerCase().includes(q)) || false;
        if (!inTitle && !inDesc && !inAssignee && !inTags && !inChecklist) return false;
      }
      return true;
    }).sort((a, b) => {
      // Pinned first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // Then by updatedAt/createdAt descending
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  }, [items, selectedType, selectedStatus, selectedPriority, selectedCategory, searchQuery]);

  // Counts for tabs & badges
  const stats = useMemo(() => {
    const total = items.length;
    const inProgress = items.filter(i => i.status === 'in_progress').length;
    const pending = items.filter(i => i.status === 'pending').length;
    const completed = items.filter(i => i.status === 'completed').length;

    const checklists = items.filter(i => i.type === 'checklist');
    const lists = items.filter(i => i.type === 'list');
    const notes = items.filter(i => i.type === 'note');

    // Total checklist completion percentage
    let totalCheckItems = 0;
    let completedCheckItems = 0;
    checklists.forEach(c => {
      if (c.checklistItems) {
        totalCheckItems += c.checklistItems.length;
        completedCheckItems += c.checklistItems.filter(item => item.completed).length;
      }
    });
    const checklistProgress = totalCheckItems > 0 ? Math.round((completedCheckItems / totalCheckItems) * 100) : 0;

    const urgentCount = items.filter(i => (i.priority === 'urgent' || i.priority === 'high') && i.status !== 'completed').length;
    const pinnedNotesCount = notes.filter(n => n.pinned).length;

    return {
      total,
      inProgress,
      pending,
      completed,
      checklistsCount: checklists.length,
      listsCount: lists.length,
      notesCount: notes.length,
      checklistProgress,
      completedCheckItems,
      totalCheckItems,
      urgentCount,
      pinnedNotesCount
    };
  }, [items]);

  // Open modal for Create
  const handleOpenCreate = (type: PendingType) => {
    setModalMode('create');
    setActiveTypeToCreate(type);
    setEditingItem(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('academic');
    setFormPriority('medium');
    setFormStatus('in_progress');
    setFormAssignedTo('');
    setFormDueDate('');
    setFormPinned(false);
    setFormColor(type === 'note' ? 'amber' : 'blue');
    setFormTags('');
    setFormChecklistItems([
      { id: 'item-1', text: '', completed: false },
      { id: 'item-2', text: '', completed: false }
    ]);
    setNewChecklistInput('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item: PendingItem) => {
    setModalMode('edit');
    setActiveTypeToCreate(item.type);
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormCategory(item.category);
    setFormPriority(item.priority);
    setFormStatus(item.status);
    setFormAssignedTo(item.assignedTo || '');
    setFormDueDate(item.dueDate || '');
    setFormPinned(item.pinned || false);
    setFormColor(item.color || 'blue');
    setFormTags(item.tags?.join(', ') || '');
    setFormChecklistItems(
      item.checklistItems ? item.checklistItems.map(c => ({ ...c })) : []
    );
    setNewChecklistInput('');
    setIsModalOpen(true);
  };

  // Save Modal Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const now = new Date().toISOString();
    const tagArray = formTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    let cleanChecklistItems: ChecklistItem[] | undefined = undefined;
    if (activeTypeToCreate === 'checklist') {
      cleanChecklistItems = formChecklistItems
        .filter(c => c.text.trim().length > 0)
        .map(c => ({
          id: c.id || `c-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
          text: c.text.trim(),
          completed: c.completed,
          completedAt: c.completed ? now : undefined
        }));
    }

    // Determine status for checklist if all are completed
    let finalStatus = formStatus;
    if (activeTypeToCreate === 'checklist' && cleanChecklistItems && cleanChecklistItems.length > 0) {
      const allDone = cleanChecklistItems.every(c => c.completed);
      const anyDone = cleanChecklistItems.some(c => c.completed);
      if (allDone) finalStatus = 'completed';
      else if (anyDone) finalStatus = 'in_progress';
    }

    const itemToSave: PendingItem = {
      id: editingItem ? editingItem.id : `pending-${Date.now()}`,
      type: activeTypeToCreate,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      priority: formPriority,
      status: finalStatus,
      assignedTo: formAssignedTo.trim() || undefined,
      dueDate: formDueDate || undefined,
      createdAt: editingItem ? editingItem.createdAt : now,
      updatedAt: now,
      pinned: formPinned,
      color: activeTypeToCreate === 'note' ? formColor : undefined,
      checklistItems: cleanChecklistItems,
      tags: tagArray.length > 0 ? tagArray : undefined
    };

    StorageService.savePendingItem(itemToSave);
    loadData();
    setIsModalOpen(false);
  };

  // Toggle checklist item completion
  const handleToggleCheckItem = (pendingId: string, itemId: string) => {
    StorageService.toggleChecklistItem(pendingId, itemId);
    loadData();
  };

  // Add item directly to checklist card
  const handleAddCardCheckItem = (cardId: string) => {
    const text = quickAddChecklist[cardId]?.trim();
    if (!text) return;

    const currentItem = items.find(i => i.id === cardId);
    if (!currentItem) return;

    const updatedChecklist: ChecklistItem[] = [
      ...(currentItem.checklistItems || []),
      {
        id: `c-${Date.now()}`,
        text,
        completed: false
      }
    ];

    const updatedItem: PendingItem = {
      ...currentItem,
      checklistItems: updatedChecklist,
      status: currentItem.status === 'completed' ? 'in_progress' : currentItem.status,
      updatedAt: new Date().toISOString()
    };

    StorageService.savePendingItem(updatedItem);
    setQuickAddChecklist(prev => ({ ...prev, [cardId]: '' }));
    loadData();
  };

  // Toggle Pin
  const handleTogglePin = (item: PendingItem) => {
    const updated: PendingItem = {
      ...item,
      pinned: !item.pinned,
      updatedAt: new Date().toISOString()
    };
    StorageService.savePendingItem(updated);
    loadData();
  };

  // Quick Change Status
  const handleStatusChange = (item: PendingItem, newStatus: PendingStatus) => {
    let updatedChecklist = item.checklistItems;
    if (newStatus === 'completed' && item.checklistItems) {
      updatedChecklist = item.checklistItems.map(c => ({
        ...c,
        completed: true,
        completedAt: c.completedAt || new Date().toISOString()
      }));
    } else if (newStatus === 'pending' && item.checklistItems) {
      updatedChecklist = item.checklistItems.map(c => ({
        ...c,
        completed: false,
        completedAt: undefined
      }));
    }

    const updated: PendingItem = {
      ...item,
      status: newStatus,
      checklistItems: updatedChecklist,
      updatedAt: new Date().toISOString()
    };
    StorageService.savePendingItem(updated);
    loadData();
  };

  // Delete
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      StorageService.deletePendingItem(itemToDelete.id);
      setItemToDelete(null);
      loadData();
    }
  };

  // Helper labels and badges
  const getCategoryLabel = (category: PendingCategory) => {
    switch (category) {
      case 'academic': return 'Académico & Aulas';
      case 'finance': return 'Financeiro & Caixa';
      case 'secretary': return 'Secretaria & Atendimento';
      case 'it': return 'TI & Equipamentos';
      case 'events': return 'Eventos & Exames';
      case 'general': return 'Geral & Gestão';
    }
  };

  const getPriorityBadge = (priority: PendingPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Urgente</span>;
      case 'high':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Alta</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Média</span>;
      case 'low':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Baixa</span>;
    }
  };

  const getStatusBadge = (status: PendingStatus) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5 animate-pulse"></span>
            Em Curso
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} className="mr-1" />
            Pendente
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="mr-1" />
            Concluído
          </span>
        );
    }
  };

  const getNoteColorClasses = (color?: string) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-50/90 border-amber-200 text-amber-950 hover:border-amber-300';
      case 'blue':
        return 'bg-blue-50/90 border-blue-200 text-blue-950 hover:border-blue-300';
      case 'emerald':
        return 'bg-emerald-50/90 border-emerald-200 text-emerald-950 hover:border-emerald-300';
      case 'purple':
        return 'bg-purple-50/90 border-purple-200 text-purple-950 hover:border-purple-300';
      case 'rose':
        return 'bg-rose-50/90 border-rose-200 text-rose-950 hover:border-rose-300';
      default:
        return 'bg-amber-50/90 border-amber-200 text-amber-950 hover:border-amber-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-blue-50 text-dtc-blue rounded-lg">
              <CheckSquare size={26} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pendentes & Operações em Curso</h1>
              <p className="text-sm text-gray-500">
                Gerenciamento operacional: crie e acompanhe listas de tarefas, checklists de rotina e notas informativas.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={() => handleOpenCreate('checklist')}
            className="bg-dtc-blue hover:bg-blue-800 text-white shadow-sm text-xs md:text-sm"
            icon={CheckSquare}
          >
            Nova Checklist
          </Button>
          <Button 
            onClick={() => handleOpenCreate('list')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-xs md:text-sm"
            icon={ListTodo}
          >
            Nova Tarefa
          </Button>
          <Button 
            onClick={() => handleOpenCreate('note')}
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm text-xs md:text-sm"
            icon={StickyNote}
          >
            Nova Nota
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Em Curso */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Operações em Curso</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{stats.pending} pendentes / {stats.completed} concluídas</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Checklists Progresso */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progresso das Checklists</p>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {stats.checklistProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${stats.checklistProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {stats.completedCheckItems} de {stats.totalCheckItems} itens verificados ({stats.checklistsCount} checklists)
          </p>
        </div>

        {/* Urgentes / Alta Prioridade */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alta Prioridade / Urgentes</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.urgentCount}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Requerem atenção imediata</p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertCircle size={24} />
          </div>
        </div>

        {/* Notas & Recados */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notas & Recados</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.notesCount}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{stats.pinnedNotesCount} notas fixadas no topo</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <StickyNote size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Tab Section */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        {/* Type Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                selectedType === 'all'
                  ? 'bg-dtc-blue text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Layers size={16} />
              <span>Todos</span>
              <span className={`text-xs ml-1 px-1.5 py-0.2 rounded-full ${selectedType === 'all' ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setSelectedType('checklist')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                selectedType === 'checklist'
                  ? 'bg-dtc-blue text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CheckSquare size={16} />
              <span>Checklists</span>
              <span className={`text-xs ml-1 px-1.5 py-0.2 rounded-full ${selectedType === 'checklist' ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {stats.checklistsCount}
              </span>
            </button>

            <button
              onClick={() => setSelectedType('list')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                selectedType === 'list'
                  ? 'bg-dtc-blue text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ListTodo size={16} />
              <span>Listas de Tarefas</span>
              <span className={`text-xs ml-1 px-1.5 py-0.2 rounded-full ${selectedType === 'list' ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {stats.listsCount}
              </span>
            </button>

            <button
              onClick={() => setSelectedType('note')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                selectedType === 'note'
                  ? 'bg-dtc-blue text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <StickyNote size={16} />
              <span>Notas & Recados</span>
              <span className={`text-xs ml-1 px-1.5 py-0.2 rounded-full ${selectedType === 'note' ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {stats.notesCount}
              </span>
            </button>
          </div>

          {/* Quick reset filters if any applied */}
          {(selectedStatus !== 'all' || selectedPriority !== 'all' || selectedCategory !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus('all');
                setSelectedPriority('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-xs text-dtc-blue hover:underline flex items-center space-x-1"
            >
              <X size={14} />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        {/* Search and Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por título, item, responsável ou tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dtc-blue focus:border-dtc-blue"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-dtc-blue focus:border-dtc-blue"
            >
              <option value="all">Status: Todos</option>
              <option value="in_progress">Status: Em Curso</option>
              <option value="pending">Status: Pendente</option>
              <option value="completed">Status: Concluído</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-dtc-blue focus:border-dtc-blue"
            >
              <option value="all">Prioridade: Todas</option>
              <option value="urgent">Prioridade: Urgente</option>
              <option value="high">Prioridade: Alta</option>
              <option value="medium">Prioridade: Média</option>
              <option value="low">Prioridade: Baixa</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-dtc-blue focus:border-dtc-blue"
            >
              <option value="all">Categoria: Todas</option>
              <option value="academic">Académico & Aulas</option>
              <option value="finance">Financeiro & Caixa</option>
              <option value="secretary">Secretaria & Atendimento</option>
              <option value="it">TI & Equipamentos</option>
              <option value="events">Eventos & Exames</option>
              <option value="general">Geral & Gestão</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid of Items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm">
          <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-800">Nenhum item pendente encontrado</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-6">
            Não foram encontradas operações correspondentes aos filtros selecionados. Crie uma nova checklist, lista de tarefas ou nota para começar.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => handleOpenCreate('checklist')} icon={CheckSquare} className="bg-dtc-blue hover:bg-blue-800">
              Criar Checklist
            </Button>
            <Button onClick={() => handleOpenCreate('list')} icon={ListTodo} className="bg-indigo-600 hover:bg-indigo-700">
              Criar Tarefa
            </Button>
            <Button onClick={() => handleOpenCreate('note')} icon={StickyNote} className="bg-amber-600 hover:bg-amber-700">
              Criar Nota
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map(item => {
            const isNote = item.type === 'note';
            const isChecklist = item.type === 'checklist';
            const isList = item.type === 'list';

            // Checklist specific calculations
            const checkItems = item.checklistItems || [];
            const completedCount = checkItems.filter(c => c.completed).length;
            const totalCount = checkItems.length;
            const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            if (isNote) {
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-5 transition-all shadow-sm flex flex-col justify-between relative group ${getNoteColorClasses(item.color)}`}
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        <span className="p-1 rounded bg-black/5 text-gray-700">
                          <StickyNote size={14} />
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/70 text-gray-700 border border-black/5">
                          {getCategoryLabel(item.category)}
                        </span>
                        {item.priority === 'urgent' && getPriorityBadge(item.priority)}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleTogglePin(item)}
                          title={item.pinned ? 'Desafixar nota' : 'Fixar nota no topo'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.pinned ? 'text-amber-600 bg-amber-100 hover:bg-amber-200' : 'text-gray-400 hover:bg-black/5 hover:text-gray-700'
                          }`}
                        >
                          <Pin size={15} className={item.pinned ? 'fill-current' : ''} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-black/5 hover:text-gray-700 transition-colors"
                          title="Editar nota"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                          title="Excluir nota"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="font-bold text-gray-900 text-base leading-snug mb-2">
                      {item.title}
                    </h4>

                    {/* Content / Body */}
                    {item.description && (
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line mb-4 font-normal">
                        {item.description}
                      </p>
                    )}

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {item.tags.map((t, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 rounded-md bg-white/60 text-gray-700 border border-black/5 flex items-center space-x-1">
                            <Tag size={10} className="mr-0.5" />
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Note Footer */}
                  <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      {item.assignedTo ? (
                        <>
                          <UserIcon size={12} className="text-gray-500" />
                          <span className="font-medium truncate max-w-[150px]">{item.assignedTo}</span>
                        </>
                      ) : (
                        <span>Nota institucional</span>
                      )}
                    </div>
                    <span className="text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                </div>
              );
            }

            // Checklist or Task List Card
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className={`p-1.5 rounded-lg ${isChecklist ? 'bg-blue-50 text-dtc-blue' : 'bg-indigo-50 text-indigo-700'}`}>
                        {isChecklist ? <CheckSquare size={16} /> : <ListTodo size={16} />}
                      </span>
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        {getCategoryLabel(item.category)}
                      </span>
                      {getPriorityBadge(item.priority)}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleTogglePin(item)}
                        title={item.pinned ? 'Desafixar' : 'Fixar no topo'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.pinned ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                        }`}
                      >
                        <Pin size={15} className={item.pinned ? 'fill-current' : ''} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-gray-900 text-base leading-snug mb-1">
                    {item.title}
                  </h4>

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  {/* Status Dropdown Pill */}
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(item.status)}
                    </div>

                    {/* Quick status cycle button */}
                    <div className="flex items-center space-x-1 text-xs">
                      {item.status !== 'completed' ? (
                        <button
                          onClick={() => handleStatusChange(item, 'completed')}
                          className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors flex items-center space-x-1"
                          title="Marcar como Concluído"
                        >
                          <Check size={13} />
                          <span>Concluir</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(item, 'in_progress')}
                          className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
                          title="Reabrir operação"
                        >
                          Reabrir
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Checklist Items if Type === 'checklist' */}
                  {isChecklist && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                      {/* Progress bar */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span className="font-medium text-gray-700">Progresso</span>
                        <span className="font-bold text-dtc-blue">{completedCount}/{totalCount} ({progressPct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-3">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progressPct === 100 ? 'bg-emerald-500' : 'bg-dtc-blue'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>

                      {/* Interactive Item list */}
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {checkItems.map(c => (
                          <div
                            key={c.id}
                            onClick={() => handleToggleCheckItem(item.id, c.id)}
                            className={`flex items-start space-x-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                              c.completed ? 'bg-emerald-50/60 text-gray-500' : 'hover:bg-gray-50 text-gray-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={c.completed}
                              onChange={() => {}} // handled by parent onClick
                              className="mt-0.5 rounded text-dtc-blue focus:ring-dtc-blue cursor-pointer h-4 w-4"
                            />
                            <span className={`text-xs leading-relaxed flex-1 ${c.completed ? 'line-through text-gray-400' : 'font-medium'}`}>
                              {c.text}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Quick inline item input */}
                      <div className="flex items-center space-x-1.5 mt-2 pt-2 border-t border-gray-100">
                        <input
                          type="text"
                          placeholder="Adicionar novo item..."
                          value={quickAddChecklist[item.id] || ''}
                          onChange={(e) => setQuickAddChecklist({ ...quickAddChecklist, [item.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCardCheckItem(item.id);
                            }
                          }}
                          className="flex-1 px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-dtc-blue"
                        />
                        <button
                          onClick={() => handleAddCardCheckItem(item.id)}
                          className="p-1 px-2 bg-gray-100 hover:bg-dtc-blue hover:text-white text-gray-700 rounded-md text-xs font-medium transition-colors"
                          title="Inserir item"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Task List Metadata & Tags */}
                  {isList && item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                      {item.tags.map((t, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 flex items-center">
                          <Tag size={10} className="mr-1 text-gray-400" />
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center space-x-1.5 truncate max-w-[60%]">
                    <UserIcon size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate font-medium text-gray-700">
                      {item.assignedTo || 'Não atribuído'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {item.dueDate ? (
                      <span className="flex items-center text-gray-600" title={`Prazo: ${item.dueDate}`}>
                        <Calendar size={13} className="mr-1 text-gray-400" />
                        {new Date(item.dueDate).toLocaleDateString('pt-PT')}
                      </span>
                    ) : (
                      <span className="text-gray-400">Sem prazo</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Creation / Edition Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === 'create'
            ? activeTypeToCreate === 'checklist'
              ? 'Nova Checklist Operacional'
              : activeTypeToCreate === 'list'
              ? 'Nova Lista de Tarefas'
              : 'Nova Nota Operacional'
            : `Editar ${editingItem?.type === 'checklist' ? 'Checklist' : editingItem?.type === 'list' ? 'Lista' : 'Nota'}`
        }
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          {/* Type Selector (only in create mode) */}
          {modalMode === 'create' && (
            <div className="flex items-center space-x-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTypeToCreate('checklist')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center space-x-1 ${
                  activeTypeToCreate === 'checklist' ? 'bg-white text-dtc-blue shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CheckSquare size={14} />
                <span>Checklist</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTypeToCreate('list')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center space-x-1 ${
                  activeTypeToCreate === 'list' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListTodo size={14} />
                <span>Lista / Tarefa</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTypeToCreate('note')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center space-x-1 ${
                  activeTypeToCreate === 'note' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <StickyNote size={14} />
                <span>Nota</span>
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Título da Operação <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                activeTypeToCreate === 'checklist'
                  ? 'Ex: Checklist de Encerramento do Turno da Noite'
                  : activeTypeToCreate === 'list'
                  ? 'Ex: Emissão e Assinatura dos Certificados da Turma A'
                  : 'Ex: Aviso sobre Reposição de Aula Prática'
              }
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dtc-blue"
            />
          </div>

          {/* Description / Content */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {activeTypeToCreate === 'note' ? 'Texto / Conteúdo da Nota' : 'Descrição / Orientações'}
            </label>
            <textarea
              rows={activeTypeToCreate === 'note' ? 4 : 2}
              placeholder={
                activeTypeToCreate === 'note'
                  ? 'Digite as informações, avisos ou instruções desta nota...'
                  : 'Detalhes ou instruções para a execução desta operação...'
              }
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dtc-blue"
            />
          </div>

          {/* Row: Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Categoria / Setor</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-dtc-blue"
              >
                <option value="academic">Académico & Aulas</option>
                <option value="finance">Financeiro & Caixa</option>
                <option value="secretary">Secretaria & Atendimento</option>
                <option value="it">TI & Equipamentos</option>
                <option value="events">Eventos & Exames</option>
                <option value="general">Geral & Gestão</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nível de Prioridade</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-dtc-blue"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          {/* Row: Status & Assigned To & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status Operacional</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-dtc-blue"
              >
                <option value="in_progress">Em Curso</option>
                <option value="pending">Pendente</option>
                <option value="completed">Concluído</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Responsável</label>
              <input
                type="text"
                list="staff-suggestions"
                placeholder="Ex: Formador Silvano / Secretaria"
                value={formAssignedTo}
                onChange={(e) => setFormAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dtc-blue"
              />
              <datalist id="staff-suggestions">
                {staffList.map(s => (
                  <option key={s.id} value={s.name} />
                ))}
                <option value="Secretaria Académica" />
                <option value="Coordenação Pedagógica" />
                <option value="Financeiro" />
                <option value="Suporte TI" />
                <option value="Direção" />
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Prazo Limite</label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dtc-blue"
              />
            </div>
          </div>

          {/* Checklist Items Editor */}
          {activeTypeToCreate === 'checklist' && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700">
                Itens da Checklist de Verificação
              </label>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {formChecklistItems.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) => {
                        const updated = [...formChecklistItems];
                        updated[index].completed = e.target.checked;
                        setFormChecklistItems(updated);
                      }}
                      className="rounded text-dtc-blue focus:ring-dtc-blue h-4 w-4"
                    />
                    <input
                      type="text"
                      placeholder={`Item ${index + 1}`}
                      value={item.text}
                      onChange={(e) => {
                        const updated = [...formChecklistItems];
                        updated[index].text = e.target.value;
                        setFormChecklistItems(updated);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-dtc-blue"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormChecklistItems(formChecklistItems.filter((_, idx) => idx !== index));
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add item input */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  placeholder="Novo item de verificação..."
                  value={newChecklistInput}
                  onChange={(e) => setNewChecklistInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newChecklistInput.trim()) {
                        setFormChecklistItems([
                          ...formChecklistItems,
                          { id: `c-${Date.now()}`, text: newChecklistInput.trim(), completed: false }
                        ]);
                        setNewChecklistInput('');
                      }
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-dtc-blue"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (newChecklistInput.trim()) {
                      setFormChecklistItems([
                        ...formChecklistItems,
                        { id: `c-${Date.now()}`, text: newChecklistInput.trim(), completed: false }
                      ]);
                      setNewChecklistInput('');
                    }
                  }}
                  icon={Plus}
                  className="text-xs py-1.5"
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}

          {/* Color palette for Notes */}
          {activeTypeToCreate === 'note' && (
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cor do Bloco de Notas</label>
              <div className="flex items-center space-x-3">
                {[
                  { id: 'amber', label: 'Amarelo', bg: 'bg-amber-300 border-amber-400' },
                  { id: 'blue', label: 'Azul', bg: 'bg-blue-300 border-blue-400' },
                  { id: 'emerald', label: 'Verde', bg: 'bg-emerald-300 border-emerald-400' },
                  { id: 'purple', label: 'Roxo', bg: 'bg-purple-300 border-purple-400' },
                  { id: 'rose', label: 'Rosa', bg: 'bg-rose-300 border-rose-400' }
                ].map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setFormColor(color.id)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${color.bg} ${
                      formColor === color.id ? 'ring-2 ring-dtc-blue scale-110' : 'hover:scale-105'
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tags & Pin Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 items-center">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tags / Marcadores (separados por vírgula)
              </label>
              <input
                type="text"
                placeholder="Ex: Turno Noturno, Certificados, Propinas"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-dtc-blue"
              />
            </div>

            <div className="flex items-center pt-4">
              <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                  className="rounded text-dtc-blue focus:ring-dtc-blue h-4 w-4 cursor-pointer"
                />
                <span className="flex items-center space-x-1">
                  <Pin size={13} className="text-amber-500" />
                  <span>Fixar no topo</span>
                </span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-dtc-blue hover:bg-blue-800 text-white"
            >
              {modalMode === 'create' ? 'Salvar Operação' : 'Atualizar Dados'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza de que deseja excluir permanentemente o item:{' '}
            <strong className="text-gray-900">{itemToDelete?.title}</strong>?
          </p>
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="secondary" onClick={() => setItemToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
