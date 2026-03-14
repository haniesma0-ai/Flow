import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2,
  ArrowUpDown, Download, Truck, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Order, OrderStatus, Customer, Product } from '@/types';
import { ordersService } from '@/services/orders';
import { toast } from 'sonner';

const OrdersPage = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await ordersService.getOrders();
        const list = Array.isArray(data) ? data : [];
        setOrders(list);
        setFilteredOrders(list);
      } catch (err) {
        console.error('Failed to load orders:', err);
        toast.error(t('orders.toast.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, orders]);

  const handleDeleteOrder = async (orderId: number) => {
    if (confirm(t('orders.confirm.delete'))) {
      try {
        await ordersService.deleteOrder(orderId);
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        toast.success(t('orders.toast.deleted'));
      } catch {
        toast.error(t('orders.toast.deleteError'));
      }
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await ordersService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(t('orders.toast.statusUpdated'));
    } catch {
      toast.error(t('orders.toast.statusError'));
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig: Record<OrderStatus, { label: string; variant: string }> = {
      draft: { label: t('status.draft'), variant: 'secondary' },
      confirmed: { label: t('status.confirmed'), variant: 'default' },
      preparation: { label: t('status.preparation'), variant: 'outline' },
      delivery: { label: t('status.delivery'), variant: 'warning' },
      delivered: { label: t('status.delivered'), variant: 'success' },
      cancelled: { label: t('status.cancelled'), variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant as "default" | "secondary" | "destructive" | "outline"}>{config.label}</Badge>;
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
          <h2 className="text-2xl font-bold text-slate-900">{t('orders.title')}</h2>
          <p className="text-slate-600 mt-1">
            {t('orders.subtitle')}
          </p>
        </div>
        <Dialog open={showNewOrderDialog} onOpenChange={setShowNewOrderDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('orders.newOrder')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('orders.newOrder')}</DialogTitle>
            </DialogHeader>
            <NewOrderForm
              onClose={() => setShowNewOrderDialog(false)}
              onSubmit={(order) => {
                setOrders(prev => [order, ...prev]);
                setShowNewOrderDialog(false);
                toast.success(t('orders.toast.created'));
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
                placeholder={t('orders.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
            >
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('orders.filterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('orders.allStatuses')}</SelectItem>
                <SelectItem value="draft">{t('status.draft')}</SelectItem>
                <SelectItem value="confirmed">{t('status.confirmed')}</SelectItem>
                <SelectItem value="preparation">{t('status.preparation')}</SelectItem>
                <SelectItem value="delivery">{t('status.delivery')}</SelectItem>
                <SelectItem value="delivered">{t('status.delivered')}</SelectItem>
                <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    <button className="flex items-center gap-1 hover:text-slate-700">
                      {t('orders.table.orderNumber')}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('orders.table.customer')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('orders.table.date')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('orders.table.total')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('orders.table.status')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    {t('orders.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      {t('orders.noOrdersFound')}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {order.customer.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {order.customer.city}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {Number(order.total).toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'MAD',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/dashboard/orders/${order.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                {t('orders.action.viewDetails')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/dashboard/orders/${order.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                {t('orders.action.edit')}
                              </Link>
                            </DropdownMenuItem>
                            {order.status === 'confirmed' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, 'preparation')}
                              >
                                <Truck className="w-4 h-4 mr-2" />
                                {t('orders.action.startPreparation')}
                              </DropdownMenuItem>
                            )}
                            {order.status === 'preparation' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, 'delivery')}
                              >
                                <Truck className="w-4 h-4 mr-2" />
                                {t('orders.action.startDelivery')}
                              </DropdownMenuItem>
                            )}
                            {order.status === 'delivery' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, 'delivered')}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {t('orders.action.markDelivered')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('orders.action.delete')}
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

// New Order Form Component
interface NewOrderFormProps {
  onClose: () => void;
  onSubmit: (order: Order) => void;
}

const NewOrderForm = ({ onClose, onSubmit }: NewOrderFormProps) => {
  const { t } = useTranslation();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [items, setItems] = useState<Array<{ productId: number; quantity: number }>>([]);
  const [notes, setNotes] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { customersService } = await import('@/services/customers');
        const { productsService } = await import('@/services/products');
        const [custData, prodData] = await Promise.all([
          customersService.getCustomers(),
          productsService.getProducts(),
        ]);
        setCustomers(Array.isArray(custData) ? custData : []);
        setProducts(Array.isArray(prodData) ? prodData : []);
      } catch {
        toast.error(t('orders.form.dataError'));
      }
    };
    fetchData();
  }, []);

  const addItem = () => {
    setItems([...items, { productId: 0, quantity: 1 }]);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const orderData = {
        customer_id: Number(selectedCustomer),
        items: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
        notes,
      };
      const created = await ordersService.createOrder(orderData as Record<string, unknown>);
      onSubmit(created);
      toast.success(t('orders.toast.created'));
    } catch {
      toast.error(t('orders.toast.createError'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('orders.form.customer')} *
        </label>
        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
          <SelectTrigger>
            <SelectValue placeholder={t('orders.form.selectCustomer')} />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={String(customer.id)}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700">
            {t('orders.form.products')}
          </label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" />
            {t('orders.form.add')}
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex gap-3 items-start">
              <Select
                value={String(item.productId)}
                onValueChange={(value) => updateItem(index, 'productId', Number(value))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('orders.form.product')} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name} - {product.price?.toFixed(2)} MAD
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                className="w-24"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('orders.form.notes')}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field min-h-[100px]"
          placeholder={t('orders.form.notesPlaceholder')}
        />
      </div>

      <div className="bg-slate-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium text-slate-700">{t('orders.form.estimatedTotal')}:</span>
          <span className="text-xl font-bold text-slate-900">
            {calculateTotal().toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'MAD',
            })}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          {t('orders.form.cancel')}
        </Button>
        <Button type="submit" className="flex-1">
          {t('orders.form.createOrder')}
        </Button>
      </div>
    </form>
  );
};

export default OrdersPage;
