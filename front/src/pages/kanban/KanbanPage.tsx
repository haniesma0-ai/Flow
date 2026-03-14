import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, MoreHorizontal, Calendar, User, AlertCircle,
  CheckCircle2, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { tasksService } from '@/services/tasks';
import { toast } from 'sonner';

const columnDefs: { id: TaskStatus; titleKey: string; color: string }[] = [
  { id: 'todo', titleKey: 'kanban.column.todo', color: 'bg-slate-100' },
  { id: 'pending_validation', titleKey: 'kanban.column.pendingValidation', color: 'bg-amber-50' },
  { id: 'validated', titleKey: 'kanban.column.validated', color: 'bg-blue-50' },
  { id: 'in_progress', titleKey: 'kanban.column.inProgress', color: 'bg-purple-50' },
  { id: 'done', titleKey: 'kanban.column.done', color: 'bg-green-50' },
];

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const priorityKeyMap: Record<TaskPriority, string> = {
  low: 'kanban.priority.low',
  medium: 'kanban.priority.medium',
  high: 'kanban.priority.high',
  urgent: 'kanban.priority.urgent',
};

const KanbanPage = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await tasksService.getTasks();
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load tasks:', err);
        toast.error(t('kanban.toast.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      try {
        await tasksService.updateTaskStatus(draggedTask.id, status);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === draggedTask.id
              ? { ...t, status, updatedAt: new Date().toISOString() }
              : t
          )
        );
        toast.success(t('kanban.toast.moved'));
      } catch {
        toast.error(t('kanban.toast.moveError'));
      }
    }
    setDraggedTask(null);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    let filtered = tasks.filter((t) => t.status === status);
    if (filterPriority !== 'all') {
      filtered = filtered.filter((t) => t.priority === filterPriority);
    }
    return filtered;
  };

  const handleDeleteTask = async (taskId: number) => {
    if (confirm(t('kanban.toast.deleteConfirm'))) {
      try {
        await tasksService.deleteTask(taskId);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        toast.success(t('kanban.toast.deleted'));
      } catch {
        toast.error(t('kanban.toast.deleteError'));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('kanban.title')}</h2>
          <p className="text-slate-600 mt-1">
            {t('kanban.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as TaskPriority | 'all')}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('kanban.priority.all')}</SelectItem>
              <SelectItem value="low">{t('kanban.priority.low')}</SelectItem>
              <SelectItem value="medium">{t('kanban.priority.medium')}</SelectItem>
              <SelectItem value="high">{t('kanban.priority.high')}</SelectItem>
              <SelectItem value="urgent">{t('kanban.priority.urgent')}</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t('kanban.newTask')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t('kanban.newTask')}</DialogTitle>
              </DialogHeader>
              <NewTaskForm
                onClose={() => setShowNewTaskDialog(false)}
                onSubmit={(task) => {
                  setTasks((prev) => [task, ...prev]);
                  setShowNewTaskDialog(false);
                  toast.success(t('kanban.toast.created'));
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columnDefs.map((column) => (
          <div
            key={column.id}
            className={`flex-shrink-0 w-80 ${column.color} rounded-xl p-4`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{t(column.titleKey)}</h3>
              <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-slate-600">
                {getTasksByStatus(column.id).length}
              </span>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {getTasksByStatus(column.id).map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-move hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge
                      variant="secondary"
                      className={priorityColors[task.priority]}
                    >
                      {t(priorityKeyMap[task.priority])}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setTasks((prev) =>
                              prev.map((t) =>
                                t.id === task.id
                                  ? { ...t, status: 'done', completedAt: new Date().toISOString() }
                                  : t
                              )
                            );
                            toast.success(t('kanban.toast.markedDone'));
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {t('kanban.action.markDone')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {t('kanban.action.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h4 className="font-medium text-slate-900 mb-2">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {task.order && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                      <span className="bg-slate-100 px-2 py-1 rounded">
                        {task.order.orderNumber}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <User className="w-4 h-4" />
                      <span>{task.assignedTo?.name || t('kanban.unassigned')}</span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(task.dueDate).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// New Task Form Component
interface NewTaskFormProps {
  onClose: () => void;
  onSubmit: (task: Task) => void;
}

const NewTaskForm = ({ onClose, onSubmit }: NewTaskFormProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [users, setUsers] = useState<{ id: number; name: string; role: string }[]>([]);
  const [orders, setOrders] = useState<{ id: number; orderNumber?: string; order_number?: string; customer?: { name: string } }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { usersService } = await import('@/services/users');
        const { ordersService } = await import('@/services/orders');
        const [uData, oData] = await Promise.all([
          usersService.getUsers().catch(() => []),
          ordersService.getOrders().catch(() => []),
        ]);
        setUsers(Array.isArray(uData) ? uData : []);
        setOrders(Array.isArray(oData) ? oData : []);
      } catch { /* ignored */ }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData: Record<string, unknown> = {
        title,
        description,
        status: 'todo',
        priority,
        assigned_to_id: assignedTo ? Number(assignedTo) : undefined,
        order_id: orderId ? Number(orderId) : undefined,
        due_date: dueDate || undefined,
      };
      const created = await tasksService.createTask(taskData);
      onSubmit(created);
      toast.success(t('kanban.toast.created'));
    } catch {
      toast.error(t('kanban.toast.createError'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('kanban.form.title')}
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('kanban.form.titlePlaceholder')}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('kanban.form.description')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field min-h-[100px]"
          placeholder={t('kanban.form.descPlaceholder')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('kanban.form.priority')}
          </label>
          <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{t('kanban.priority.low')}</SelectItem>
              <SelectItem value="medium">{t('kanban.priority.medium')}</SelectItem>
              <SelectItem value="high">{t('kanban.priority.high')}</SelectItem>
              <SelectItem value="urgent">{t('kanban.priority.urgent')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('kanban.form.dueDate')}
          </label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('kanban.form.assignedTo')}
        </label>
        <Select value={assignedTo} onValueChange={setAssignedTo}>
          <SelectTrigger>
            <SelectValue placeholder={t('kanban.form.selectUser')} />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={String(user.id)}>
                {user.name} ({user.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('kanban.form.linkedOrder')}
        </label>
        <Select value={orderId} onValueChange={setOrderId}>
          <SelectTrigger>
            <SelectValue placeholder={t('kanban.form.selectOrder')} />
          </SelectTrigger>
          <SelectContent>
            {orders.map((order) => (
              <SelectItem key={order.id} value={String(order.id)}>
                {order.orderNumber || order.order_number} - {order.customer?.name || 'N/A'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          {t('kanban.form.cancel')}
        </Button>
        <Button type="submit" className="flex-1">
          {t('kanban.form.create')}
        </Button>
      </div>
    </form>
  );
};

export default KanbanPage;
