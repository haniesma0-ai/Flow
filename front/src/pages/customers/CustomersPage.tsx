import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Phone, Mail,
  MapPin, Building2, ArrowUpDown, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Customer } from '@/types';
import { customersService } from '@/services/customers';
import { toast } from 'sonner';

const emptyCustomer = {
  code: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'Maroc',
  ice: '',
  rc: '',
};

const CustomersPage = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyCustomer);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customersService.getCustomers();
        const list = Array.isArray(data) ? data : [];
        setCustomers(list);
        setFilteredCustomers(list);
      } catch (err) {
        console.error('Failed to load customers:', err);
        toast.error(t('customers.toast.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const handleDeleteCustomer = async (customerId: number) => {
    if (confirm(t('customers.toast.deleteConfirm'))) {
      try {
        await customersService.deleteCustomer(customerId);
        setCustomers((prev) => prev.filter((c) => c.id !== customerId));
        toast.success(t('customers.toast.deleted'));
      } catch {
        toast.error(t('customers.toast.deleteError'));
      }
    }
  };

  const openCreate = () => {
    setEditingCustomer(null);
    setForm(emptyCustomer);
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      code: customer.code,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      postalCode: customer.postalCode || '',
      country: customer.country || 'Maroc',
      ice: customer.ice || '',
      rc: customer.rc || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toast.error(t('customers.toast.requiredFields'));
      return;
    }
    setIsSaving(true);
    try {
      if (editingCustomer) {
        const updated = await customersService.updateCustomer(editingCustomer.id, form as Record<string, string>);
        setCustomers((prev) => prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...updated } : c)));
        toast.success(t('customers.toast.updated'));
      } else {
        const created = await customersService.createCustomer(form as Record<string, string>);
        setCustomers((prev) => [...prev, created]);
        toast.success(t('customers.toast.created'));
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || t('customers.toast.saveError');
      toast.error(msg);
    } finally {
      setIsSaving(false);
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
          <h2 className="text-2xl font-bold text-slate-900">{t('customers.title')}</h2>
          <p className="text-slate-600 mt-1">
            {t('customers.subtitle')}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {t('customers.newCustomer')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t('customers.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    <button className="flex items-center gap-1 hover:text-slate-700">
                      {t('customers.table.customer')}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('customers.table.contact')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('customers.table.address')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('customers.table.identifiers')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    {t('customers.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {t('customers.noCustomersFound')}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {customer.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {customer.code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">{customer.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{customer.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2 text-slate-600">
                          <MapPin className="w-4 h-4 mt-0.5" />
                          <div>
                            <p className="text-sm">{customer.address}</p>
                            <p className="text-sm text-slate-500">
                              {customer.postalCode} {customer.city}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-600">
                          {customer.ice && <p>ICE: {customer.ice}</p>}
                          {customer.rc && <p>RC: {customer.rc}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/dashboard/orders/new?customer=${customer.id}`}>
                                <Plus className="w-4 h-4 mr-2" />
                                {t('customers.action.newOrder')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(customer)}>
                              <Edit className="w-4 h-4 mr-2" />
                              {t('customers.action.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteCustomer(customer.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('customers.action.delete')}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? t('customers.dialog.editTitle') : t('customers.dialog.createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('customers.form.code')} *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CLI-001" />
              </div>
              <div className="space-y-2">
                <Label>{t('customers.form.name')} *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('customers.form.namePlaceholder')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('customers.form.email')}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label>{t('customers.form.phone')}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+212 ..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('customers.form.address')}</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder={t('customers.form.addressPlaceholder')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('customers.form.city')}</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Marrakech" />
              </div>
              <div className="space-y-2">
                <Label>{t('customers.form.postalCode')}</Label>
                <Input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="40000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('customers.form.ice')}</Label>
                <Input value={form.ice} onChange={(e) => setForm({ ...form, ice: e.target.value })} placeholder="ICE" />
              </div>
              <div className="space-y-2">
                <Label>{t('customers.form.rc')}</Label>
                <Input value={form.rc} onChange={(e) => setForm({ ...form, rc: e.target.value })} placeholder="RC" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('customers.form.cancel')}</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? t('common.save') : editingCustomer ? t('customers.form.update') : t('customers.form.create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;
