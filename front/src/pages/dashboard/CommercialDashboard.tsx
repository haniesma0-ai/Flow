import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingCart, Package, Truck, Users, Plus,
  AlertCircle, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Order, Product, Customer } from '@/types';
import { ordersService } from '@/services/orders';
import { productsService } from '@/services/products';
import { customersService } from '@/services/customers';
import { toast } from 'sonner';

const CommercialDashboard = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordData, prodData, custData] = await Promise.all([
          ordersService.getOrders(),
          productsService.getProducts(),
          customersService.getCustomers(),
        ]);
        setOrders(Array.isArray(ordData) ? ordData : []);
        setProducts(Array.isArray(prodData) ? prodData : []);
        setCustomers(Array.isArray(custData) ? custData : []);
      } catch (err) {
        console.error('Failed to load commercial dashboard:', err);
        toast.error(t('commercialDashboard.toast.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const myOrders = orders;
  const pendingOrders = myOrders.filter(o => ['draft', 'confirmed', 'preparation'].includes(o.status));
  const deliveryOrders = myOrders.filter(o => o.status === 'delivery');
  const lowStockItems = products.filter(p => p.stock <= p.minStock);

  const monthlyData = (() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    const byMonth: Record<number, { orders: number; revenue: number }> = {};
    orders.forEach(o => {
      const d = new Date(o.createdAt);
      if (d.getFullYear() === currentYear && o.status !== 'cancelled') {
        const m = d.getMonth();
        if (!byMonth[m]) byMonth[m] = { orders: 0, revenue: 0 };
        byMonth[m].orders += 1;
        byMonth[m].revenue += o.total;
      }
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([m, v]) => ({ month: months[Number(m)], orders: v.orders, revenue: v.revenue }));
  })();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {t('commercialDashboard.title')}
          </h2>
          <p className="text-slate-600 mt-1">
            {t('commercialDashboard.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/orders/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('commercialDashboard.newOrder')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('commercialDashboard.myOrders')}</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{myOrders.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('commercialDashboard.pending')}</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{pendingOrders.length}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-sm text-slate-400">{t('commercialDashboard.pendingAction')}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('commercialDashboard.myCustomers')}</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{customers.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('commercialDashboard.deliveriesToday')}</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{deliveryOrders.length}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-sm text-slate-400">{t('commercialDashboard.inProgress', { count: 2 })}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-900">
              {t('commercialDashboard.lowStockAlert', { count: lowStockItems.length })}
            </p>
            <p className="text-sm text-amber-700">
              {t('commercialDashboard.lowStockDesc')}
            </p>
          </div>
          <Link to="/dashboard/products">
            <Button variant="ghost" size="sm" className="text-amber-700">
              {t('commercialDashboard.viewProducts')}
            </Button>
          </Link>
        </div>
      )}

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>{t('commercialDashboard.monthlyActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis yAxisId="left" stroke="#64748b" />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar yAxisId="left" dataKey="orders" name={t('commercialDashboard.chartOrders')} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" name={t('commercialDashboard.chartRevenue')} fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders & Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('commercialDashboard.recentOrders')}</CardTitle>
            <Link to="/dashboard/orders">
              <Button variant="ghost" size="sm">
                {t('common.viewAll')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myOrders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  to={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{order.orderNumber}</p>
                    <p className="text-sm text-slate-500">{order.customer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">
                      {order.total.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
                    </p>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status === 'draft' && t('status.draft')}
                      {order.status === 'confirmed' && t('status.confirmed')}
                      {order.status === 'preparation' && t('status.preparation')}
                      {order.status === 'delivery' && t('status.delivery')}
                      {order.status === 'delivered' && t('status.delivered')}
                      {order.status === 'cancelled' && t('status.cancelled')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('commercialDashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/dashboard/orders/new">
                <div className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="font-medium text-slate-900">{t('commercialDashboard.actionNewOrder')}</p>
                </div>
              </Link>
              <Link to="/dashboard/kanban">
                <div className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="font-medium text-slate-900">{t('commercialDashboard.actionKanban')}</p>
                </div>
              </Link>
              <Link to="/dashboard/calendar">
                <div className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors cursor-pointer text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Truck className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-medium text-slate-900">{t('commercialDashboard.actionDelivery')}</p>
                </div>
              </Link>
              <Link to="/dashboard/customers/new">
                <div className="p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="font-medium text-slate-900">{t('commercialDashboard.actionNewCustomer')}</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommercialDashboard;
