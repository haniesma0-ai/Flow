import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, UserCog,
  CheckCircle2, XCircle, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import type { User } from '@/types';
import { usersService } from '@/services/users';
import { toast } from 'sonner';

const UsersPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await usersService.getUsers();
        const list = Array.isArray(data) ? data : [];
        setUsers(list);
        setFilteredUsers(list);
      } catch (err) {
        console.error('Failed to load users:', err);
        toast.error(t('users.toast.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const handleDeleteUser = async (userId: number) => {
    if (confirm(t('users.toast.deleteConfirm'))) {
      try {
        await usersService.deleteUser(userId);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast.success(t('users.toast.deleted'));
      } catch {
        toast.error(t('users.toast.deleteError'));
      }
    }
  };

  const handleToggleStatus = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    try {
      await usersService.updateUser(userId, { is_active: !user.isActive });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isActive: !u.isActive } : u
        )
      );
      toast.success(t('users.toast.statusUpdated'));
    } catch {
      toast.error(t('users.toast.statusError'));
    }
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; variant: string }> = {
      admin: { label: t('users.roleAdmin'), variant: 'destructive' },
      manager: { label: t('users.roleManager'), variant: 'warning' },
      commercial: { label: t('users.roleCommercial'), variant: 'default' },
      chauffeur: { label: t('users.roleChauffeur'), variant: 'secondary' },
      user: { label: t('users.roleUser'), variant: 'outline' },
    };
    const c = config[role] || { label: role, variant: 'secondary' };
    return <Badge variant={c.variant as "default" | "secondary" | "destructive" | "outline"}>{c.label}</Badge>;
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
          <h2 className="text-2xl font-bold text-slate-900">{t('users.title')}</h2>
          <p className="text-slate-600 mt-1">
            {t('users.subtitle')}
          </p>
        </div>
        <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('users.newUser')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('users.dialog.createTitle')}</DialogTitle>
            </DialogHeader>
            <UserForm
              onClose={() => setShowNewUserDialog(false)}
              onSubmit={(user) => {
                setUsers((prev) => [...prev, user]);
                setShowNewUserDialog(false);
                toast.success(t('users.toast.created'));
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if (!open) setEditingUser(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('users.dialog.editTitle')}</DialogTitle>
            </DialogHeader>
            <UserForm
              initialData={editingUser}
              onClose={() => { setShowEditDialog(false); setEditingUser(null); }}
              onSubmit={(user) => {
                setUsers((prev) => prev.map((u) => u.id === user.id ? user : u));
                setShowEditDialog(false);
                setEditingUser(null);
                toast.success(t('users.toast.updated'));
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t('users.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <UserCog className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('users.allRoles')}</SelectItem>
                <SelectItem value="admin">{t('users.roleAdmin')}</SelectItem>
                <SelectItem value="manager">{t('users.roleManager', 'Manager')}</SelectItem>
                <SelectItem value="commercial">{t('users.roleCommercial')}</SelectItem>
                <SelectItem value="chauffeur">{t('users.roleChauffeur')}</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('users.table.user')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('users.table.role')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('users.table.contact')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('users.table.status')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    {t('users.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {t('users.noUsersFound')}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm">{user.phone || t('users.noPhone')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {user.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingUser(user);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(user.id)}
                            >
                              {user.isActive ? (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {t('common.deactivate')}
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  {t('common.activate')}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// User Form Component (used for both create and edit)
interface UserFormProps {
  onClose: () => void;
  onSubmit: (user: User) => void;
  initialData?: User | null;
}

const UserForm = ({ onClose, onSubmit, initialData }: UserFormProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialData?.role || 'commercial');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (initialData) {
        // Edit
        const payload: Record<string, string | undefined> = { name, email, phone, role };
        if (password) payload.password = password;
        const updated = await usersService.updateUser(initialData.id, payload);
        onSubmit(updated);
      } else {
        // Create
        if (!password) {
          toast.error(t('users.toast.passwordRequired'));
          setIsSaving(false);
          return;
        }
        const created = await usersService.createUser({
          name,
          email,
          password,
          password_confirmation: password,
          role,
          phone,
        } as { name: string; email: string; password: string; role: string; phone?: string });
        onSubmit(created);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: { email?: string[] }; error?: string } } };
      const msg = axiosErr.response?.data?.errors?.email?.[0] || axiosErr.response?.data?.error || t('users.toast.saveError');
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('users.form.fullName')} *
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('users.form.fullNamePlaceholder')}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('users.form.email')} *
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemple.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {initialData ? t('users.form.editPassword') : `${t('users.form.password')} *`}
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required={!initialData}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('users.form.phone')}
        </label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+212 5XX-XXXXXX"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('users.form.role')} *
        </label>
        <Select value={role} onValueChange={(v) => setRole(v as User['role'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">{t('users.roleAdmin')}</SelectItem>
            <SelectItem value="manager">{t('users.roleManager', 'Manager')}</SelectItem>
            <SelectItem value="commercial">{t('users.roleCommercial')}</SelectItem>
            <SelectItem value="chauffeur">{t('users.roleChauffeur')}</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          {t('users.form.cancel')}
        </Button>
        <Button type="submit" className="flex-1" disabled={isSaving}>
          {isSaving ? t('common.saving') : (initialData ? t('common.save') : t('users.form.create'))}
        </Button>
      </div>
    </form>
  );
};

export default UsersPage;
