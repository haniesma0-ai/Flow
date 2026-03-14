import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Clock, CheckCircle2, DollarSign, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dashboardService } from '@/services/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ClientStats {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalSpent: number;
}

interface RecentOrder {
    id: number;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
}

const ClientDashboard = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState<ClientStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { auth } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await dashboardService.getDashboardStats();
                // The client dashboard endpoint returns { stats, recentOrders, customerName }
                const raw = data as unknown as {
                    stats?: ClientStats;
                    recentOrders?: RecentOrder[];
                    customerName?: string;
                };
                setStats(raw.stats || null);
                setRecentOrders(Array.isArray(raw.recentOrders) ? raw.recentOrders : []);
                setCustomerName(raw.customerName || auth.user?.name || '');
            } catch (err) {
                console.error('Failed to load client dashboard:', err);
                toast.error(t('clientDashboard.toast.loadError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [auth.user?.name]);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'delivered': return t('status.delivered');
            case 'cancelled': return t('status.cancelled');
            case 'preparation': return t('status.preparation');
            case 'confirmed': return t('status.confirmed');
            case 'delivery': return t('status.delivery');
            default: return t('status.draft');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800 border-green-300';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
            case 'preparation': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'confirmed': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
            case 'delivery': return 'bg-orange-100 text-orange-800 border-orange-300';
            default: return 'bg-slate-100 text-slate-800 border-slate-300';
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
            {/* Welcome */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    {t('clientDashboard.welcome', { name: customerName })}
                </h2>
                <p className="text-slate-600 mt-1">{t('clientDashboard.subtitle')}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats?.totalOrders ?? 0}</p>
                            <p className="text-sm text-slate-500">{t('clientDashboard.totalOrders')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{stats?.pendingOrders ?? 0}</p>
                            <p className="text-sm text-slate-500">{t('clientDashboard.inProgress')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{stats?.completedOrders ?? 0}</p>
                            <p className="text-sm text-slate-500">{t('clientDashboard.delivered')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">
                                {Number(stats?.totalSpent ?? 0).toLocaleString('fr-FR')} MAD
                            </p>
                            <p className="text-sm text-slate-500">{t('clientDashboard.totalSpent')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('clientDashboard.recentOrders')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">{t('clientDashboard.noOrders')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{order.orderNumber}</p>
                                            <p className="text-sm text-slate-500">
                                                {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className={getStatusColor(order.status)}>
                                            {getStatusLabel(order.status)}
                                        </Badge>
                                        <p className="font-semibold text-slate-900 min-w-[80px] text-right">
                                            {Number(order.total).toLocaleString('fr-FR')} MAD
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ClientDashboard;
