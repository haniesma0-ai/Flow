import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Filter, MoreHorizontal, Eye, Truck,
  CheckCircle2, MapPin, Calendar, Banknote, PenLine,
  Shield, AlertTriangle, Send, RefreshCw, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Delivery, DeliveryStatus, Order } from '@/types';
import { deliveriesService } from '@/services/deliveries';
import { ordersService } from '@/services/orders';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DeliveriesPage = () => {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const userRole = auth.user?.role || 'commercial';
  const isAdmin = userRole === 'admin' || userRole === 'manager';
  const canCreate = userRole === 'admin' || userRole === 'manager' || userRole === 'commercial';

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Detail dialog
  const [detailDelivery, setDetailDelivery] = useState<Delivery | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chauffeurs, setChauffeurs] = useState<{ id: number; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ id: number; registration: string; brand: string; model: string }[]>([]);
  const [newDelivery, setNewDelivery] = useState({
    order_id: '',
    chauffeur_id: '',
    vehicle_id: '',
    planned_date: '',
    notes: '',
  });

  const fetchDeliveries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await deliveriesService.getDeliveries();
      const list = Array.isArray(data) ? data : [];
      setDeliveries(list);
      setFilteredDeliveries(list);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
      toast.error(t('deliveries.toast.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const hasSignature = (delivery?: Delivery | null) =>
    Boolean(delivery?.hasSignature || delivery?.signatureData);

  const openDetailDialog = async (delivery: Delivery) => {
    setDetailDialogOpen(true);
    setDetailDelivery(delivery);
    setDetailLoading(true);
    try {
      const fullDelivery = await deliveriesService.getDelivery(delivery.id);
      setDetailDelivery(fullDelivery);
    } catch {
      toast.error('Impossible de charger les détails complets.');
    } finally {
      setDetailLoading(false);
    }
  };

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchDeliveries();
    // Auto-refresh every 30 seconds
    pollRef.current = setInterval(() => {
      if (document.hidden) {
        return;
      }

      deliveriesService.getDeliveries().then(data => {
        const list = Array.isArray(data) ? data : [];
        setDeliveries(list);
      }).catch(() => { });
    }, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchDeliveries]);

  // Load dropdown data when create dialog opens
  useEffect(() => {
    if (!createDialogOpen) return;
    const loadFormData = async () => {
      try {
        const [ordersData, chauffeursRes, vehiclesRes] = await Promise.all([
          ordersService.getOrders(),
          api.get('/chauffeurs'),
          api.get('/vehicles'),
        ]);
        const orderList = Array.isArray(ordersData) ? ordersData : [];
        // Allow selecting orders that are ready for delivery
        // (confirmed/preparation/delivery), but exclude already delivered/cancelled
        setOrders(
          orderList.filter(
            (o) => !['delivered', 'cancelled', 'draft'].includes(o.status)
          )
        );
        setChauffeurs(Array.isArray(chauffeursRes.data) ? chauffeursRes.data : []);
        setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);
      } catch {
        toast.error('Erreur lors du chargement des données');
      }
    };
    loadFormData();
  }, [createDialogOpen]);

  const handleCreateDelivery = async () => {
    if (!newDelivery.order_id || !newDelivery.chauffeur_id || !newDelivery.vehicle_id || !newDelivery.planned_date) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setCreateLoading(true);
    try {
      await deliveriesService.createDelivery({
        order_id: Number(newDelivery.order_id),
        chauffeur_id: Number(newDelivery.chauffeur_id),
        vehicle_id: Number(newDelivery.vehicle_id),
        planned_date: newDelivery.planned_date,
        notes: newDelivery.notes || undefined,
      } as unknown as Partial<Delivery>);
      toast.success(t('deliveries.toast.created'));
      setCreateDialogOpen(false);
      setNewDelivery({ order_id: '', chauffeur_id: '', vehicle_id: '', planned_date: '', notes: '' });
      fetchDeliveries();
    } catch {
      toast.error(t('deliveries.toast.createError'));
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    let filtered = deliveries;

    if (searchQuery) {
      filtered = filtered.filter(
        (d) =>
          d.order?.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.order?.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    setFilteredDeliveries(filtered);
  }, [searchQuery, statusFilter, deliveries]);

  const handleStatusChange = async (deliveryId: number, newStatus: DeliveryStatus) => {
    try {
      await deliveriesService.updateDeliveryStatus(deliveryId, newStatus);
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === deliveryId ? { ...d, status: newStatus } : d
        )
      );
      toast.success(t('deliveries.toast.statusUpdated'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur';
      toast.error(message);
    }
  };

  const handleVerifyCash = async (deliveryId: number) => {
    try {
      await deliveriesService.verifyCash(deliveryId);
      setDeliveries(prev => prev.map(d =>
        d.id === deliveryId ? { ...d, cashVerified: true, cashVerifiedAt: new Date().toISOString() } : d
      ));
      toast.success('Caisse vérifiée avec succès.');
    } catch {
      toast.error('Erreur lors de la vérification.');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: string }> = {
      pending: { label: t('status.planned'), variant: 'secondary' },
      planned: { label: t('status.planned'), variant: 'secondary' },
      in_progress: { label: t('status.inProgress'), variant: 'warning' },
      completed: { label: t('status.completed'), variant: 'success' },
      cancelled: { label: t('status.cancelled'), variant: 'destructive' },
    };
    const c = config[status] || { label: status, variant: 'secondary' };
    return <Badge variant={c.variant as "default" | "secondary" | "destructive" | "outline"}>{c.label}</Badge>;
  };

  // Summary stats
  const totalCash = deliveries.filter(d => d.status === 'completed').reduce((s, d) => s + (d.cashAmount || 0), 0);
  const totalCollected = deliveries.filter(d => d.paymentConfirmed).reduce((s, d) => s + (d.collectedAmount || 0), 0);
  const pendingVerification = deliveries.filter(d => d.cashSubmitted && !d.cashVerified).length;
  const discrepancies = deliveries.filter(d => d.hasDiscrepancy).length;

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
          <h2 className="text-2xl font-bold text-slate-900">{t('deliveries.title')}</h2>
          <p className="text-slate-600 mt-1">
            {t('deliveries.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDeliveries} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
          {canCreate && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('deliveries.newDelivery')}
            </Button>
          )}
        </div>
      </div>

      {/* Admin COD Stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{totalCash.toFixed(0)} MAD</p>
                  <p className="text-xs text-slate-500">Total attendu</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{totalCollected.toFixed(0)} MAD</p>
                  <p className="text-xs text-slate-500">Total encaissé</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{pendingVerification}</p>
                  <p className="text-xs text-slate-500">En attente vérification</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${discrepancies > 0 ? 'bg-red-100' : 'bg-slate-100'} rounded-lg flex items-center justify-center`}>
                  <AlertTriangle className={`w-5 h-5 ${discrepancies > 0 ? 'text-red-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${discrepancies > 0 ? 'text-red-600' : 'text-slate-900'}`}>{discrepancies}</p>
                  <p className="text-xs text-slate-500">Écarts / Incidents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t('deliveries.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('deliveries.allStatuses')}</SelectItem>
                <SelectItem value="planned">{t('status.planned')}</SelectItem>
                <SelectItem value="in_progress">{t('status.inProgress')}</SelectItem>
                <SelectItem value="completed">{t('status.completed')}</SelectItem>
                <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('deliveries.table.order')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('deliveries.table.customer')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('deliveries.table.date')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('deliveries.table.driver')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    COD (MAD)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('deliveries.table.status')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Vérification
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    {t('deliveries.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      {t('deliveries.noDeliveriesFound')}
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {delivery.order?.orderNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {delivery.order?.customer?.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {delivery.order?.customer?.city}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {delivery.plannedDate && new Date(delivery.plannedDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary text-sm font-medium">
                              {delivery.chauffeur?.name?.charAt(0)}
                            </span>
                          </div>
                          <span className="text-slate-700">{delivery.chauffeur?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{delivery.cashAmount?.toFixed(2)}</p>
                          {delivery.paymentConfirmed && delivery.collectedAmount !== null && delivery.collectedAmount !== undefined && (
                            <p className={`text-xs ${delivery.hasDiscrepancy ? 'text-red-600 font-semibold' : 'text-green-600'}`}>
                              Reçu: {delivery.collectedAmount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {getStatusBadge(delivery.status)}
                          <div className="flex gap-1 mt-1">
                            {delivery.paymentConfirmed && (
                              <span title="Paiement confirmé"><Banknote className="w-3 h-3 text-green-500" /></span>
                            )}
                            {hasSignature(delivery) && (
                              <span title="Signé"><PenLine className="w-3 h-3 text-green-500" /></span>
                            )}
                            {delivery.paymentLocked && (
                              <span title="Verrouillé"><Shield className="w-3 h-3 text-blue-500" /></span>
                            )}
                            {delivery.hasDiscrepancy && (
                              <span title="Écart"><AlertTriangle className="w-3 h-3 text-red-500" /></span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {delivery.status === 'completed' && (
                          <div className="space-y-1">
                            {delivery.cashSubmitted && !delivery.cashVerified && isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                onClick={() => handleVerifyCash(delivery.id)}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Vérifier
                              </Button>
                            )}
                            {delivery.cashVerified && (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
                                Vérifié
                              </Badge>
                            )}
                            {!delivery.cashSubmitted && (
                              <span className="text-xs text-slate-400">Non soumis</span>
                            )}
                            {delivery.cashSubmitted && !delivery.cashVerified && !isAdmin && (
                              <span className="text-xs text-amber-600">En attente</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailDialog(delivery)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/dashboard/orders/${delivery.orderId}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                {t('deliveries.action.viewOrder')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/dashboard/tracking">
                                <MapPin className="w-4 h-4 mr-2" />
                                {t('deliveries.action.trackOnMap')}
                              </Link>
                            </DropdownMenuItem>
                            {delivery.status === 'planned' && isAdmin && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(delivery.id, 'in_progress')}
                              >
                                <Truck className="w-4 h-4 mr-2" />
                                {t('deliveries.action.start')}
                              </DropdownMenuItem>
                            )}
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

      {/* ─── Delivery Detail Dialog ──────────────────────── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la livraison</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : detailDelivery && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="font-medium">{detailDelivery.order?.orderNumber}</p>
                <p className="text-sm text-slate-500">{detailDelivery.order?.customer?.name}</p>
                <p className="text-sm text-slate-500">{detailDelivery.order?.customer?.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded text-center">
                  <p className="text-xs text-blue-600">Montant attendu</p>
                  <p className="text-lg font-bold text-blue-900">{detailDelivery.cashAmount?.toFixed(2)} MAD</p>
                </div>
                <div className={`p-3 rounded text-center ${detailDelivery.hasDiscrepancy ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className={`text-xs ${detailDelivery.hasDiscrepancy ? 'text-red-600' : 'text-green-600'}`}>
                    Montant encaissé
                  </p>
                  <p className={`text-lg font-bold ${detailDelivery.hasDiscrepancy ? 'text-red-900' : 'text-green-900'}`}>
                    {detailDelivery.collectedAmount?.toFixed(2) || '—'} MAD
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Chauffeur</span>
                  <span className="font-medium">{detailDelivery.chauffeur?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Véhicule</span>
                  <span className="font-medium">{detailDelivery.vehicle?.registration || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Statut</span>
                  {getStatusBadge(detailDelivery.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Paiement</span>
                  <Badge variant={detailDelivery.paymentConfirmed ? 'default' : 'secondary'}>
                    {detailDelivery.paymentConfirmed ? 'Confirmé' : 'Non confirmé'}
                  </Badge>
                </div>
                {detailDelivery.paymentConfirmedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Heure paiement</span>
                    <span className="text-xs">{new Date(detailDelivery.paymentConfirmedAt).toLocaleString('fr-FR')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Signature</span>
                  <Badge variant={hasSignature(detailDelivery) ? 'default' : 'secondary'}>
                    {hasSignature(detailDelivery) ? 'Capturée' : 'Non capturée'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Verrouillé</span>
                  <Badge variant={detailDelivery.paymentLocked ? 'default' : 'secondary'}>
                    {detailDelivery.paymentLocked ? 'Oui' : 'Non'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Caisse soumise</span>
                  <Badge variant={detailDelivery.cashSubmitted ? 'default' : 'secondary'}>
                    {detailDelivery.cashSubmitted ? 'Oui' : 'Non'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Vérifiée</span>
                  <Badge variant={detailDelivery.cashVerified ? 'default' : 'secondary'}>
                    {detailDelivery.cashVerified ? 'Oui' : 'Non'}
                  </Badge>
                </div>
              </div>

              {/* GPS payment location */}
              {detailDelivery.paymentLatitude && detailDelivery.paymentLongitude && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">GPS lors du paiement</p>
                  <p className="text-sm font-mono">
                    {detailDelivery.paymentLatitude.toFixed(6)}, {detailDelivery.paymentLongitude.toFixed(6)}
                  </p>
                </div>
              )}

              {/* Signature preview */}
              {detailDelivery.signatureData && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Signature du client:</p>
                  <img
                    src={detailDelivery.signatureData}
                    alt="Signature client"
                    className="border rounded-lg w-full max-h-32 object-contain bg-white"
                  />
                  {detailDelivery.signatureCapturedAt && (
                    <p className="text-xs text-slate-400 mt-1">
                      Capturée le {new Date(detailDelivery.signatureCapturedAt).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
              )}

              {/* Incident report */}
              {detailDelivery.hasDiscrepancy && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Rapport d'incident
                  </p>
                  <p className="text-xs text-red-600 mt-1">{detailDelivery.incidentReport}</p>
                  {detailDelivery.incidentReportedAt && (
                    <p className="text-xs text-red-400 mt-1">
                      Signalé le {new Date(detailDelivery.incidentReportedAt).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
              )}

              {/* GPS tracking log */}
              {detailDelivery.gpsTrackingLog && detailDelivery.gpsTrackingLog.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Historique GPS ({detailDelivery.gpsTrackingLog.length} points)</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {detailDelivery.gpsTrackingLog.map((entry, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded">
                        <span className="font-mono">{entry.lat.toFixed(4)}, {entry.lng.toFixed(4)}</span>
                        <span className="text-slate-500">{entry.event}</span>
                        <span className="text-slate-400">{new Date(entry.timestamp).toLocaleTimeString('fr-FR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin verify button */}
              {isAdmin && detailDelivery.cashSubmitted && !detailDelivery.cashVerified && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    handleVerifyCash(detailDelivery.id);
                    setDetailDelivery({ ...detailDelivery, cashVerified: true });
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Vérifier et valider la caisse
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Create Delivery Dialog ──────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('deliveries.newDelivery')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Commande *</Label>
              <Select value={newDelivery.order_id} onValueChange={(v) => setNewDelivery({ ...newDelivery, order_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une commande" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.orderNumber} — {o.customer?.name} ({o.total?.toFixed(2)} MAD)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chauffeur *</Label>
                <Select value={newDelivery.chauffeur_id} onValueChange={(v) => setNewDelivery({ ...newDelivery, chauffeur_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chauffeur" />
                  </SelectTrigger>
                  <SelectContent>
                    {chauffeurs.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Véhicule *</Label>
                <Select value={newDelivery.vehicle_id} onValueChange={(v) => setNewDelivery({ ...newDelivery, vehicle_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Véhicule" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.registration} — {v.brand} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date prévue *</Label>
              <Input
                type="date"
                value={newDelivery.planned_date}
                onChange={(e) => setNewDelivery({ ...newDelivery, planned_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                placeholder="Notes optionnelles..."
                value={newDelivery.notes}
                onChange={(e) => setNewDelivery({ ...newDelivery, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateDelivery} disabled={createLoading}>
              {createLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveriesPage;
