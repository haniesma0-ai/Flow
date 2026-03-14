import { useState, useEffect } from 'react';
import { ShoppingCart, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/services/api';
import { toast } from 'sonner';

interface OrderProduct {
    id: number;
    name: string;
    code: string;
    price: number;
    unit: string;
}

interface OrderItem {
    id: number;
    productId: number;
    product: OrderProduct | null;
    quantity: number;
    price: number;
    tva: number;
    total: number;
}

interface ClientOrder {
    id: number;
    orderNumber: string;
    status: string;
    subtotal: number;
    totalTva: number;
    total: number;
    notes: string | null;
    deliveryDate: string | null;
    createdAt: string;
    items: OrderItem[];
}

const ClientOrdersPage = () => {
    const [orders, setOrders] = useState<ClientOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get('/client/orders');
                setOrders(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error(err);
                toast.error('Erreur lors du chargement des commandes');
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            draft: 'Brouillon',
            confirmed: 'Confirmée',
            preparation: 'En préparation',
            delivery: 'En livraison',
            delivered: 'Livrée',
            cancelled: 'Annulée',
        };
        return map[status] || status;
    };

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            draft: 'bg-slate-100 text-slate-700 border-slate-300',
            confirmed: 'bg-indigo-100 text-indigo-700 border-indigo-300',
            preparation: 'bg-blue-100 text-blue-700 border-blue-300',
            delivery: 'bg-orange-100 text-orange-700 border-orange-300',
            delivered: 'bg-green-100 text-green-700 border-green-300',
            cancelled: 'bg-red-100 text-red-700 border-red-300',
        };
        return map[status] || 'bg-slate-100 text-slate-700';
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
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Mes Commandes</h2>
                <p className="text-slate-600 mt-1">Historique et suivi de vos commandes</p>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-16">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">Vous n'avez pas encore de commande</p>
                    <p className="text-sm text-slate-400">
                        Rendez-vous dans le catalogue pour passer une commande
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const isExpanded = expandedId === order.id;
                        return (
                            <Card key={order.id} className="overflow-hidden">
                                {/* Order header row */}
                                <button
                                    className="w-full text-left"
                                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="outline" className={getStatusColor(order.status)}>
                                                    {getStatusLabel(order.status)}
                                                </Badge>
                                                <p className="font-bold text-slate-900 min-w-[90px] text-right">
                                                    {Number(order.total).toLocaleString('fr-FR')} MAD
                                                </p>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </button>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
                                        {/* Items table */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-slate-500 border-b border-slate-200">
                                                        <th className="pb-2 font-medium">Produit</th>
                                                        <th className="pb-2 font-medium text-center">Qté</th>
                                                        <th className="pb-2 font-medium text-right">P.U.</th>
                                                        <th className="pb-2 font-medium text-right">TVA</th>
                                                        <th className="pb-2 font-medium text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {order.items.map((item) => (
                                                        <tr key={item.id} className="border-b border-slate-100">
                                                            <td className="py-2 text-slate-900">
                                                                {item.product?.name || '—'}
                                                                <span className="text-xs text-slate-400 ml-1">
                                                                    {item.product?.code}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 text-center">{item.quantity}</td>
                                                            <td className="py-2 text-right">
                                                                {Number(item.price).toLocaleString('fr-FR')} MAD
                                                            </td>
                                                            <td className="py-2 text-right">{item.tva}%</td>
                                                            <td className="py-2 text-right font-medium">
                                                                {Number(item.total).toLocaleString('fr-FR')} MAD
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Totals */}
                                        <div className="flex flex-col items-end gap-1 pt-2 text-sm">
                                            <div className="flex gap-8">
                                                <span className="text-slate-500">Sous-total HT</span>
                                                <span className="font-medium">{Number(order.subtotal).toLocaleString('fr-FR')} MAD</span>
                                            </div>
                                            <div className="flex gap-8">
                                                <span className="text-slate-500">TVA</span>
                                                <span className="font-medium">{Number(order.totalTva).toLocaleString('fr-FR')} MAD</span>
                                            </div>
                                            <div className="flex gap-8 pt-1 border-t border-slate-200">
                                                <span className="font-semibold text-slate-900">Total TTC</span>
                                                <span className="font-bold text-primary">
                                                    {Number(order.total).toLocaleString('fr-FR')} MAD
                                                </span>
                                            </div>
                                        </div>

                                        {order.notes && (
                                            <div className="bg-white p-3 rounded-lg">
                                                <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                                                <p className="text-sm text-slate-700">{order.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ClientOrdersPage;
