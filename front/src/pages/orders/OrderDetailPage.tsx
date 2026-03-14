import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Printer, Edit, Truck, CheckCircle2, XCircle,
  Package, User, MapPin, Phone, Mail, Calendar, FileText, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Order, OrderStatus } from '@/types';
import { ordersService } from '@/services/orders';
import { toast } from 'sonner';
import { generateInvoicePDF, printInvoice } from '@/utils/exportUtils';

const OrderDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await ordersService.getOrder(Number(id));
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order:', err);
        toast.error(t('orders.toast.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (order) {
      try {
        await ordersService.updateOrderStatus(order.id, newStatus);
        setOrder({ ...order, status: newStatus });
        toast.success(t('orders.toast.statusUpdated'));
      } catch {
        toast.error(t('orders.toast.statusError'));
      }
    }
  };

  const handlePrint = () => {
    if (!order) return;
    const data = buildReceiptData(order);
    printInvoice(data);
  };

  const handleDownloadPDF = async () => {
    if (!order) return;
    try {
      const data = buildReceiptData(order);
      await generateInvoicePDF(data);
      toast.success('PDF généré');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const buildReceiptData = (o: Order) => ({
    invoiceNumber: o.orderNumber,
    date: o.createdAt,
    dueDate: o.deliveryDate || o.createdAt,
    status: o.status === 'delivered' ? 'paid' : o.status === 'cancelled' ? 'cancelled' : 'sent',
    customer: {
      name: o.customer.name,
      address: o.customer.address,
      city: o.customer.city,
      postalCode: o.customer.postalCode,
      phone: o.customer.phone,
      email: o.customer.email,
      ice: o.customer.ice,
      rc: o.customer.rc,
    },
    items: o.items.map((item) => ({
      name: item.product?.name || 'Produit',
      code: item.product?.code,
      quantity: item.quantity,
      price: item.price,
      tva: item.tva,
      total: item.total,
    })),
    subtotal: o.subtotal,
    totalTva: o.totalTva,
    total: o.total,
    paidAmount: o.status === 'delivered' ? o.total : 0,
    remainingAmount: o.status === 'delivered' ? 0 : o.total,
  });

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig: Record<OrderStatus, { label: string; variant: string }> = {
      draft: { label: t('status.draft'), variant: 'secondary' },
      confirmed: { label: t('status.confirmed'), variant: 'default' },
      preparation: { label: t('status.preparation'), variant: 'outline' },
      delivery: { label: t('status.delivery'), variant: 'warning' },
      delivered: { label: t('status.delivered'), variant: 'success' },
      cancelled: { label: t('status.cancelled'), variant: 'destructive' },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant as "default" | "secondary" | "destructive" | "outline"}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">{t('orders.notFound')}</p>
        <Link to="/dashboard/orders">
          <Button variant="outline" className="mt-4">
            {t('orders.backToOrders')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {order.orderNumber}
            </h2>
            <p className="text-slate-600">
              {t('orders.detail.createdOn')} {new Date(order.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            {t('common.print')}
          </Button>
          <Link to={`/dashboard/orders/${order.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              {t('common.edit')}
            </Button>
          </Link>
          {order.status === 'confirmed' && (
            <Button size="sm" onClick={() => handleStatusChange('preparation')}>
              <Package className="w-4 h-4 mr-2" />
              {t('orders.action.startPreparation')}
            </Button>
          )}
          {order.status === 'preparation' && (
            <Button size="sm" onClick={() => handleStatusChange('delivery')}>
              <Truck className="w-4 h-4 mr-2" />
              {t('orders.action.startDelivery')}
            </Button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{t('orders.table.status')}:</span>
          {getStatusBadge(order.status)}
        </div>
        <div className="flex gap-2">
          {order.status === 'draft' && (
            <Button size="sm" onClick={() => handleStatusChange('confirmed')}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t('orders.action.confirm')}
            </Button>
          )}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleStatusChange('cancelled')}
            >
              <XCircle className="w-4 h-4 mr-2" />
              {t('common.cancel')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('orders.detail.orderedItems')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        {t('orders.form.product')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                        {t('orders.form.unitPrice')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                        {t('orders.form.quantity')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                        {t('orders.form.tva')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                        {t('orders.table.total')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {item.product.code}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {Number(item.price).toFixed(2)} MAD
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {item.tva}%
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {Number(item.total).toFixed(2)} MAD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator className="my-6" />

              {/* Totals */}
              <div className="space-y-2 max-w-xs ml-auto">
                <div className="flex justify-between text-slate-600">
                  <span>{t('orders.form.subtotalHT')}</span>
                  <span>{Number(order.subtotal).toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t('orders.form.tva')}</span>
                  <span>{Number(order.totalTva).toFixed(2)} MAD</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold text-slate-900">
                  <span>{t('orders.form.totalTTC')}</span>
                  <span>{Number(order.total).toFixed(2)} MAD</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('orders.form.notes')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('orders.form.customer')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-slate-900">{order.customer.name}</p>
                <p className="text-sm text-slate-500">{order.customer.code}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{order.customer.address}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 opacity-0" />
                  <span className="text-sm">
                    {order.customer.postalCode} {order.customer.city}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{order.customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{order.customer.email}</span>
                </div>
              </div>
              {order.customer.ice && (
                <>
                  <Separator />
                  <div className="text-sm text-slate-500">
                    <p>ICE: {order.customer.ice}</p>
                    {order.customer.rc && <p>RC: {order.customer.rc}</p>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                {t('orders.detail.delivery')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.deliveryDate ? (
                <>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {t('orders.detail.scheduledFor')} {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <Link to="/dashboard/deliveries">
                    <Button variant="outline" className="w-full" size="sm">
                      {t('orders.action.viewDetails')}
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-slate-500 text-sm">
                  {t('orders.detail.noDeliveryPlanned')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Commercial Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('orders.detail.commercial')}</CardTitle>
            </CardHeader>
            <CardContent>
              {order.commercial ? (
                <>
                  <p className="font-medium text-slate-900">{order.commercial.name}</p>
                  <p className="text-sm text-slate-500">{order.commercial.email}</p>
                </>
              ) : (
                <p className="text-sm text-slate-500 italic">{t('orders.detail.unassigned')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
