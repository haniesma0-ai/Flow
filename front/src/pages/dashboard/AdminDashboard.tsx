import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Users, Package, TrendingUp, ArrowUpRight,
  ArrowDownRight, AlertTriangle, Clock, ChevronRight, Percent
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { DashboardStats } from '@/types';
import { dashboardService } from '@/services/dashboard';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        toast.error(t('adminDashboard.toast.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const revenueData = stats?.revenueByMonth || [];

  const orderStatusData = [
    { name: t('status.draft'), value: stats?.ordersByStatus.draft || 0, color: '#94a3b8' },
    { name: t('status.confirmed'), value: stats?.ordersByStatus.confirmed || 0, color: '#3b82f6' },
    { name: t('status.preparation'), value: stats?.ordersByStatus.preparation || 0, color: '#8b5cf6' },
    { name: t('status.delivery'), value: stats?.ordersByStatus.delivery || 0, color: '#f97316' },
    { name: t('status.delivered'), value: stats?.ordersByStatus.delivered || 0, color: '#22c55e' },
    { name: t('status.cancelled'), value: stats?.ordersByStatus.cancelled || 0, color: '#ef4444' },
  ];

  const statCards = [
    {
      title: t('adminDashboard.stats.totalOrders'),
      value: stats?.totalOrders || 0,
      change: '+12.5%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'blue',
      href: '/dashboard/orders',
    },
    {
      title: t('adminDashboard.stats.revenue'),
      value: `${(stats?.totalRevenue || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 })}`,
      change: '+8.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'green',
      href: '/dashboard/reports',
    },
    {
      title: t('adminDashboard.stats.customers'),
      value: stats?.totalCustomers || 0,
      change: '+5.3%',
      trend: 'up',
      icon: Users,
      color: 'purple',
      href: '/dashboard/customers',
    },
    {
      title: t('adminDashboard.stats.products'),
      value: stats?.totalProducts || 0,
      change: '-2.1%',
      trend: 'down',
      icon: Package,
      color: 'orange',
      href: '/dashboard/products',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {t('adminDashboard.title')}
          </h2>
          <p className="text-slate-600 mt-1">
            {t('adminDashboard.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/orders/new">
            <Button>{t('adminDashboard.newOrder')}</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Link key={index} to={card.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{card.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{card.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {card.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm ${card.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        {card.change}
                      </span>
                      <span className="text-sm text-slate-400">{t('adminDashboard.stats.vsLastMonth')}</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    card.color === 'green' ? 'bg-green-100 text-green-600' :
                      card.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        'bg-orange-100 text-orange-600'
                    }`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {(stats?.lowStockProducts || 0) > 0 || (stats?.overdueInvoices || 0) > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {(stats?.lowStockProducts || 0) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-900">
                  {t('adminDashboard.lowStock', { count: stats?.lowStockProducts })}
                </p>
                <p className="text-sm text-amber-700">
                  {t('adminDashboard.lowStockAction')}
                </p>
              </div>
              <Link to="/dashboard/products">
                <Button variant="ghost" size="sm" className="text-amber-700">
                  {t('common.view')}
                </Button>
              </Link>
            </div>
          )}
          {(stats?.overdueInvoices || 0) > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-900">
                  {t('adminDashboard.overdueInvoices', { count: stats?.overdueInvoices })}
                </p>
                <p className="text-sm text-red-700">
                  {t('adminDashboard.overdueInvoicesAction')}
                </p>
              </div>
              <Link to="/dashboard/invoices">
                <Button variant="ghost" size="sm" className="text-red-700">
                  {t('common.view')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : null}

      {/* Operations */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/dashboard/discounts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-sky-200 bg-sky-50/60">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Gestion des reductions</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">Codes promo et remises</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/incidents">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-amber-200 bg-amber-50/60">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Gestion des incidents</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">Suivi et resolution des livraisons</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('adminDashboard.revenueChart')}</CardTitle>
            <Link to="/dashboard/reports">
              <Button variant="ghost" size="sm">
                {t('common.viewAll')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    formatter={(value: number) =>
                      value.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 })
                    }
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('adminDashboard.orderStatusChart')}</CardTitle>
            <Link to="/dashboard/orders">
              <Button variant="ghost" size="sm">
                {t('common.viewAll')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {orderStatusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-slate-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('adminDashboard.recentOrders')}</CardTitle>
            <Link to="/dashboard/orders">
              <Button variant="ghost" size="sm">
                {t('common.viewAll')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('adminDashboard.topProducts')}</CardTitle>
            <Link to="/dashboard/products">
              <Button variant="ghost" size="sm">
                {t('common.viewAll')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topProducts.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-sm text-slate-500">{item.product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{item.quantity} {t('adminDashboard.units')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
