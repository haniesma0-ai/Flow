import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download, FileText, BarChart3, TrendingUp,
  Calendar, Filter, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardService } from '@/services/dashboard';
import { toast } from 'sonner';
import { exportReportPDF, exportReportCSV, printReport } from '@/utils/exportUtils';

const ReportsPage = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('month');
  const [reportType, setReportType] = useState('sales');
  const [salesData, setSalesData] = useState<{ month: string; sales: number; orders: number }[]>([]);
  const [productData, setProductData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [customerData, setCustomerData] = useState<{ name: string; orders: number; amount: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await dashboardService.getDashboardStats();
        // Map revenue by month to sales data
        const sales = (stats.revenueByMonth || []).map((m: { month: string; amount: number; orders?: number }) => ({
          month: m.month,
          sales: m.amount || 0,
          orders: m.orders || 0,
        }));
        setSalesData(sales);

        // Map top products for pie chart
        const products = (stats.topProducts || []).map((p: { product?: { name?: string }; quantity?: number }, i: number) => ({
          name: p.product?.name || `Produit ${i + 1}`,
          value: p.quantity || 0,
          color: ['#0ea5e9', '#f97316', '#22c55e', '#8b5cf6', '#ef4444'][i % 5],
        }));
        setProductData(products.length > 0 ? products : [
          { name: 'Aucune donnée', value: 1, color: '#94a3b8' },
        ]);

        // Recent orders as customer data
        const custMap: Record<string, { name: string; orders: number; amount: number }> = {};
        (stats.recentOrders || []).forEach((o: { customer?: { name?: string }; total?: number }) => {
          const name = o.customer?.name || 'Inconnu';
          if (!custMap[name]) custMap[name] = { name, orders: 0, amount: 0 };
          custMap[name].orders++;
          custMap[name].amount += o.total || 0;
        });
        setCustomerData(Object.values(custMap));
      } catch (err) {
        console.error('Failed to load report data:', err);
        toast.error(t('reports.toast.loadError'));
      }
    };
    fetchData();
  }, []);

  const periodLabels: Record<string, string> = {
    week: t('reports.period.week'),
    month: t('reports.period.month'),
    quarter: t('reports.period.quarter'),
    year: t('reports.period.year'),
  };

  const summaryCards = useMemo(() => {
    const totalSales = salesData.reduce((s, r) => s + r.sales, 0);
    const totalOrders = salesData.reduce((s, r) => s + (r.orders || 0), 0);
    const avgBasket = totalOrders > 0 ? totalSales / totalOrders : 0;
    return [
      { label: t('reports.revenue'), value: totalSales.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }) },
      { label: t('reports.orders'), value: String(totalOrders) },
      { label: t('reports.averageBasket'), value: avgBasket.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }) },
      { label: t('reports.activeCustomers'), value: String(customerData.length) },
    ];
  }, [salesData, customerData, t]);

  const buildReportData = () => ({
    period: periodLabels[period] || period,
    reportType: reportType,
    salesData,
    customerData,
    summaryCards,
  });

  const handleExport = async (format: string) => {
    try {
      const data = buildReportData();
      if (format === 'pdf') {
        await exportReportPDF(data);
      } else if (format === 'csv') {
        exportReportCSV(data);
      }
      toast.success(`${t('reports.toast.exported')} ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(t('reports.toast.exportError') || 'Export failed');
    }
  };

  const handlePrint = () => {
    try {
      printReport(buildReportData());
    } catch (err) {
      console.error('Print failed:', err);
      toast.error('Print failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('reports.title')}</h2>
          <p className="text-slate-600 mt-1">
            {t('reports.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            {t('common.export')} PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            {t('common.export')} CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-48">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">{t('reports.period.week')}</SelectItem>
                <SelectItem value="month">{t('reports.period.month')}</SelectItem>
                <SelectItem value="quarter">{t('reports.period.quarter')}</SelectItem>
                <SelectItem value="year">{t('reports.period.year')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type de rapport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">{t('reports.type.sales')}</SelectItem>
                <SelectItem value="products">{t('reports.type.products')}</SelectItem>
                <SelectItem value="customers">{t('reports.type.customers')}</SelectItem>
                <SelectItem value="deliveries">{t('reports.type.deliveries')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              {t('common.print')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, color: 'bg-amber-100 text-amber-600', idx: 0 },
          { icon: FileText, color: 'bg-green-100 text-green-600', idx: 1 },
          { icon: BarChart3, color: 'bg-purple-100 text-purple-600', idx: 2 },
          { icon: PieChart, color: 'bg-orange-100 text-orange-600', idx: 3 },
        ].map((card) => {
          const s = summaryCards[card.idx];
          return (
            <Card key={card.idx}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{s?.value || '—'}</p>
                    <p className="text-xs text-slate-500">{s?.label || ''}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.salesChart')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    formatter={(value: number) =>
                      value.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'MAD',
                        maximumFractionDigits: 0,
                      })
                    }
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ fill: '#0ea5e9' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.categoryChart')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {productData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {productData.map((item, index) => (
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

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.topCustomers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('reports.table.customer')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    {t('reports.table.orders')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    {t('reports.table.amount')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    {t('reports.table.revenuePercent')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customerData.map((customer, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {customer.name}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {customer.orders}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {customer.amount.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'MAD',
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${(customer.amount / 540000) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-slate-600">
                          {((customer.amount / 540000) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
