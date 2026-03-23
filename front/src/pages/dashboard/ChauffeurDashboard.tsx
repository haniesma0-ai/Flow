import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Truck, MapPin, CheckCircle2, Clock, Package,
  Navigation, Phone, AlertCircle, Banknote, PenLine,
  Send, Eye, Shield, XCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Delivery, CashSummary } from '@/types';
import { deliveriesService } from '@/services/deliveries';
import { useGpsTracking } from '@/hooks/useGpsTracking';
import SignaturePad from '@/components/SignaturePad';
import { toast } from 'sonner';

const ChauffeurDashboard = () => {
  const { t } = useTranslation();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDelivery, setPaymentDelivery] = useState<Delivery | null>(null);
  const [collectedAmount, setCollectedAmount] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Signature dialog state
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signatureDelivery, setSignatureDelivery] = useState<Delivery | null>(null);
  const [signatureSubmitting, setSignatureSubmitting] = useState(false);

  // Cash summary dialog state
  const [cashSummaryDialogOpen, setCashSummaryDialogOpen] = useState(false);
  const [cashSummary, setCashSummary] = useState<CashSummary | null>(null);
  const [cashSummarySubmitting, setCashSummarySubmitting] = useState(false);

  // Delivery detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailDelivery, setDetailDelivery] = useState<Delivery | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // GPS tracking for active deliveries
  const activeDeliveryId = deliveries.find(d => d.status === 'in_progress')?.id;
  const { position, isTracking, getCurrentPosition } = useGpsTracking({
    enabled: deliveries.some(d => d.status === 'in_progress'),
    updateInterval: 15000,
    onPositionUpdate: async (pos) => {
      if (activeDeliveryId) {
        try {
          await deliveriesService.updateLocation(activeDeliveryId, {
            latitude: pos.latitude,
            longitude: pos.longitude,
          });
        } catch {
          // Silently fail location updates
        }
      }
    },
  });

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDeliveries = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const data = await deliveriesService.getDeliveries();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!silent) {
        console.error('Failed to load deliveries:', err);
        toast.error(t('chauffeurDashboard.toast.loadError'));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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

  useEffect(() => {
    fetchDeliveries();
    // Auto-refresh every 30 seconds
    pollRef.current = setInterval(() => {
      if (!document.hidden) {
        fetchDeliveries(true);
      }
    }, 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchDeliveries]);

  const todayDeliveries = deliveries.filter(d => {
    const plannedDate = new Date(d.plannedDate);
    const today = new Date();
    return plannedDate.toDateString() === today.toDateString();
  });

  const pendingDeliveries = deliveries.filter(d => d.status === 'planned');
  const inProgressDeliveries = deliveries.filter(d => d.status === 'in_progress');
  const completedDeliveries = deliveries.filter(d => d.status === 'completed');
  const cancelledDeliveries = deliveries.filter(d => d.status === 'cancelled');
  const completedNotSubmitted = completedDeliveries.filter(d => d.paymentConfirmed && !d.cashSubmitted);

  const totalCollectedToday = todayDeliveries
    .filter(d => d.paymentConfirmed)
    .reduce((sum, d) => sum + (d.collectedAmount || 0), 0);

  // ─── Start delivery ───────────────────────────────────────
  const handleStartDelivery = async (deliveryId: number) => {
    try {
      const pos = await getCurrentPosition().catch(() => null);
      const location = pos ? { latitude: pos.latitude, longitude: pos.longitude } : undefined;
      await deliveriesService.updateDeliveryStatus(deliveryId, 'in_progress', location);
      setDeliveries(prev => prev.map(d =>
        d.id === deliveryId ? { ...d, status: 'in_progress', startedAt: new Date().toISOString() } : d
      ));
      toast.success(t('chauffeurDashboard.toast.started'));
    } catch {
      toast.error(t('chauffeurDashboard.toast.startError'));
    }
  };

  // ─── Cancel delivery ──────────────────────────────────────
  const handleCancelDelivery = async (deliveryId: number) => {
    try {
      const pos = await getCurrentPosition().catch(() => null);
      const location = pos ? { latitude: pos.latitude, longitude: pos.longitude } : undefined;
      await deliveriesService.updateDeliveryStatus(deliveryId, 'cancelled', location);
      setDeliveries(prev => prev.map(d =>
        d.id === deliveryId ? { ...d, status: 'cancelled' } : d
      ));
      toast.success('Livraison annulée');
    } catch {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  // ─── Confirm payment (COD) ────────────────────────────────
  const openPaymentDialog = (delivery: Delivery) => {
    setPaymentDelivery(delivery);
    setCollectedAmount(String(delivery.cashAmount));
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!paymentDelivery) return;
    setPaymentSubmitting(true);

    const amount = parseFloat(collectedAmount);
    if (Number.isNaN(amount)) {
      toast.error('Montant invalide.');
      setPaymentSubmitting(false);
      return;
    }

    // Try to use the most recent GPS position, but allow proceeding if unavailable.
    let latitude: number | undefined;
    let longitude: number | undefined;

    try {
      const pos = await getCurrentPosition();
      latitude = pos.latitude;
      longitude = pos.longitude;
    } catch (err) {
      if (position) {
        latitude = position.latitude;
        longitude = position.longitude;
      } else {
        toast.warning('Impossible de récupérer la localisation GPS. Le paiement sera confirmé sans coordonnées.');
      }
    }

    try {
      const updated = await deliveriesService.confirmPayment(paymentDelivery.id, {
        collected_amount: amount,
        latitude,
        longitude,
      });
      setDeliveries(prev => prev.map(d => d.id === paymentDelivery.id ? { ...d, ...updated } : d));
      setPaymentDialogOpen(false);
      if (updated.hasDiscrepancy) {
        toast.warning('Paiement confirmé avec un écart détecté. Un rapport d\'incident a été créé.');
      } else {
        toast.success('Paiement confirmé avec succès.');
      }
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.error
        || (err as any)?.response?.data?.message
        || (err as Error).message
        || 'Erreur lors de la confirmation du paiement.';
      toast.error(message);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // ─── Capture signature ────────────────────────────────────
  const openSignatureDialog = (delivery: Delivery) => {
    setSignatureDelivery(delivery);
    setSignatureDialogOpen(true);
  };

  const handleCaptureSignature = useCallback(async (signatureData: string) => {
    if (!signatureDelivery) return;
    setSignatureSubmitting(true);
    try {
      const pos = await getCurrentPosition().catch(() => null);
      const updated = await deliveriesService.captureSignature(signatureDelivery.id, {
        signature_data: signatureData,
        latitude: pos?.latitude,
        longitude: pos?.longitude,
      });
      setDeliveries(prev => prev.map(d => d.id === signatureDelivery.id ? { ...d, ...updated } : d));
      setSignatureDialogOpen(false);
      toast.success('Signature capturée avec succès.');
    } catch {
      toast.error('Erreur lors de la capture de la signature.');
    } finally {
      setSignatureSubmitting(false);
    }
  }, [signatureDelivery, getCurrentPosition]);

  // ─── Complete delivery (requires payment + signature) ─────
  const handleCompleteDelivery = async (deliveryId: number) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;

    if (!delivery.paymentConfirmed) {
      toast.error('Le paiement doit être confirmé avant de terminer la livraison.');
      openPaymentDialog(delivery);
      return;
    }
    if (!hasSignature(delivery)) {
      toast.error('La signature du client est requise avant de terminer la livraison.');
      openSignatureDialog(delivery);
      return;
    }

    try {
      const pos = await getCurrentPosition().catch(() => null);
      const location = pos ? { latitude: pos.latitude, longitude: pos.longitude } : undefined;
      await deliveriesService.updateDeliveryStatus(deliveryId, 'completed', location);
      setDeliveries(prev => prev.map(d =>
        d.id === deliveryId ? {
          ...d,
          status: 'completed',
          completedAt: new Date().toISOString(),
          paymentLocked: true,
        } : d
      ));
      toast.success(t('chauffeurDashboard.toast.completed'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la finalisation';
      toast.error(message);
    }
  };

  // ─── Submit cash summary ──────────────────────────────────
  const handleSubmitCashSummary = async () => {
    setCashSummarySubmitting(true);
    try {
      const ids = completedNotSubmitted.map(d => d.id);
      const summary = await deliveriesService.submitCashSummary(ids);
      setCashSummary(summary);
      // Refresh deliveries
      setDeliveries(prev => prev.map(d =>
        ids.includes(d.id) ? { ...d, cashSubmitted: true, cashSubmittedAt: new Date().toISOString() } : d
      ));
      toast.success('Résumé de caisse soumis avec succès.');
    } catch {
      toast.error('Erreur lors de la soumission du résumé de caisse.');
    } finally {
      setCashSummarySubmitting(false);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {t('chauffeurDashboard.title')}
          </h2>
          <p className="text-slate-600 mt-1">
            {t('chauffeurDashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDeliveries()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '...' : t('common.refresh', 'Actualiser')}
          </Button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isTracking ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}>
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-sm font-medium">
              {isTracking ? 'GPS actif' : 'GPS inactif'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{todayDeliveries.length}</p>
                <p className="text-xs text-slate-500">{t('chauffeurDashboard.today')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pendingDeliveries.length}</p>
                <p className="text-xs text-slate-500">{t('chauffeurDashboard.pending')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Banknote className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{totalCollectedToday.toFixed(0)}</p>
                <p className="text-xs text-slate-500">MAD encaissé</p>
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
                <p className="text-2xl font-bold text-slate-900">{completedDeliveries.length}</p>
                <p className="text-xs text-slate-500">{t('chauffeurDashboard.completed')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Delivery (in progress) */}
      {inProgressDeliveries.map(delivery => (
        <Card key={delivery.id} className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Navigation className="w-5 h-5" />
              {t('chauffeurDashboard.currentDelivery')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">{delivery.order?.orderNumber}</p>
                <p className="text-slate-600">{delivery.order?.customer?.name}</p>
              </div>
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                En cours
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{delivery.order?.customer?.address}</span>
            </div>

            {/* COD Info */}
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Montant à encaisser (COD)</span>
                <span className="text-lg font-bold text-slate-900">{delivery.cashAmount?.toFixed(2)} MAD</span>
              </div>
              <div className="flex gap-2">
                {/* Payment status */}
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${delivery.paymentConfirmed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                  <Banknote className="w-3 h-3" />
                  {delivery.paymentConfirmed ? 'Paiement confirmé' : 'Paiement en attente'}
                </div>
                {/* Signature status */}
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${hasSignature(delivery) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                  <PenLine className="w-3 h-3" />
                  {hasSignature(delivery) ? 'Signé' : 'Signature requise'}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://maps.google.com/?q=${delivery.order?.customer?.address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full" size="sm">
                  <Navigation className="w-4 h-4 mr-1" />
                  Itinéraire
                </Button>
              </a>
              <a href={`tel:${delivery.order?.customer?.phone}`}>
                <Button variant="outline" className="w-full" size="sm">
                  <Phone className="w-4 h-4 mr-1" />
                  Appeler
                </Button>
              </a>

              {!delivery.paymentConfirmed && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                  onClick={() => openPaymentDialog(delivery)}
                >
                  <Banknote className="w-4 h-4 mr-1" />
                  Encaisser
                </Button>
              )}

              {delivery.paymentConfirmed && !hasSignature(delivery) && (
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  size="sm"
                  onClick={() => openSignatureDialog(delivery)}
                >
                  <PenLine className="w-4 h-4 mr-1" />
                  Signature
                </Button>
              )}

              {delivery.paymentConfirmed && hasSignature(delivery) && (
                <Button
                  className="bg-green-600 hover:bg-green-700 col-span-2"
                  onClick={() => handleCompleteDelivery(delivery.id)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Terminer la livraison
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => handleCancelDelivery(delivery.id)}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Annuler
              </Button>
            </div>

            {/* Discrepancy warning */}
            {delivery.hasDiscrepancy && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Écart de paiement détecté</p>
                  <p className="text-xs text-red-600">{delivery.incidentReport}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Pending Deliveries */}
      {pendingDeliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('chauffeurDashboard.pendingDeliveries')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingDeliveries.map(delivery => (
                <div
                  key={delivery.id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{delivery.order?.orderNumber}</p>
                      <p className="text-slate-600">{delivery.order?.customer?.name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        Planifiée
                      </Badge>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {delivery.cashAmount?.toFixed(2)} MAD
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{delivery.order?.customer?.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(delivery.plannedDate).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={`https://maps.google.com/?q=${delivery.order?.customer?.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <Navigation className="w-4 h-4 mr-2" />
                        {t('chauffeurDashboard.route')}
                      </Button>
                    </a>
                    <Button
                      className="flex-1"
                      onClick={() => handleStartDelivery(delivery.id)}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      {t('chauffeurDashboard.start')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Summary Section */}
      {completedNotSubmitted.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Banknote className="w-5 h-5" />
              Résumé de caisse à soumettre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              {completedNotSubmitted.map(delivery => (
                <div key={delivery.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium text-slate-900">{delivery.order?.orderNumber}</p>
                    <p className="text-sm text-slate-500">{delivery.order?.customer?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{delivery.collectedAmount?.toFixed(2)} MAD</p>
                    {delivery.hasDiscrepancy && (
                      <Badge variant="destructive" className="text-xs">Écart</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg mb-4">
              <span className="font-medium text-green-800">Total à remettre</span>
              <span className="text-lg font-bold text-green-900">
                {completedNotSubmitted.reduce((sum, d) => sum + (d.collectedAmount || 0), 0).toFixed(2)} MAD
              </span>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => {
                setCashSummaryDialogOpen(true);
                handleSubmitCashSummary();
              }}
              disabled={cashSummarySubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              {cashSummarySubmitting ? 'Envoi en cours...' : 'Soumettre le résumé de caisse'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Completed Deliveries */}
      {completedDeliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('chauffeurDashboard.completedDeliveries')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedDeliveries.slice(0, 5).map(delivery => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                          onClick={() => openDetailDialog(delivery)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{delivery.order?.orderNumber}</p>
                      <p className="text-sm text-slate-500">{delivery.order?.customer?.name}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{delivery.collectedAmount?.toFixed(2)} MAD</p>
                      <div className="flex gap-1 justify-end mt-1">
                        {delivery.paymentConfirmed && (
                          <Shield className="w-3 h-3 text-green-500" />
                        )}
                        {hasSignature(delivery) && (
                          <PenLine className="w-3 h-3 text-green-500" />
                        )}
                        {delivery.cashSubmitted && (
                          <Send className="w-3 h-3 text-blue-500" />
                        )}
                        {delivery.cashVerified && (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Deliveries */}
      {cancelledDeliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              Livraisons annulées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cancelledDeliveries.map(delivery => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100"
                  onClick={() => openDetailDialog(delivery)}
                >
                  <div>
                    <p className="font-medium text-slate-900">{delivery.order?.orderNumber}</p>
                    <p className="text-sm text-slate-500">{delivery.order?.customer?.name}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <Badge variant="destructive">Annulée</Badge>
                    <Eye className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/dashboard/deliveries">
          <div className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <p className="font-medium text-slate-900">Toutes les livraisons</p>
          </div>
        </Link>
        <Link to="/dashboard/tracking">
          <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-slate-600" />
            </div>
            <p className="font-medium text-slate-900">{t('chauffeurDashboard.deliveryMap')}</p>
          </div>
        </Link>
      </div>

      {/* ─── Payment Dialog ──────────────────────────────── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-600" />
              Confirmation de paiement (COD)
            </DialogTitle>
          </DialogHeader>
          {paymentDelivery && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="font-medium">{paymentDelivery.order?.orderNumber}</p>
                <p className="text-sm text-slate-500">{paymentDelivery.order?.customer?.name}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-sm text-blue-700">Montant attendu</p>
                <p className="text-2xl font-bold text-blue-900">{paymentDelivery.cashAmount?.toFixed(2)} MAD</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Montant reçu du client (MAD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(e.target.value)}
                  className="text-lg font-semibold text-center"
                  placeholder="0.00"
                />
                {parseFloat(collectedAmount) !== paymentDelivery.cashAmount && collectedAmount !== '' && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Écart de {Math.abs(parseFloat(collectedAmount) - paymentDelivery.cashAmount).toFixed(2)} MAD — un rapport d'incident sera créé
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="w-3 h-3" />
                {position ? (
                  <span>GPS: {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}</span>
                ) : (
                  <span>Localisation GPS en cours...</span>
                )}
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleConfirmPayment}
                disabled={paymentSubmitting || !collectedAmount}
              >
                {paymentSubmitting ? 'Confirmation...' : 'Confirmer le paiement'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Signature Dialog ────────────────────────────── */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="w-5 h-5 text-purple-600" />
              Signature électronique du client
            </DialogTitle>
          </DialogHeader>
          {signatureDelivery && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="font-medium">{signatureDelivery.order?.orderNumber}</p>
                <p className="text-sm text-slate-500">
                  Client: {signatureDelivery.order?.customer?.name}
                </p>
                <p className="text-sm font-semibold text-slate-700 mt-1">
                  Montant: {signatureDelivery.cashAmount?.toFixed(2)} MAD
                </p>
              </div>
              <SignaturePad
                onCapture={handleCaptureSignature}
                onCancel={() => setSignatureDialogOpen(false)}
              />
              {signatureSubmitting && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Envoi de la signature...
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Cash Summary Dialog ─────────────────────────── */}
      <Dialog open={cashSummaryDialogOpen} onOpenChange={setCashSummaryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              Résumé de caisse
            </DialogTitle>
          </DialogHeader>
          {cashSummary ? (
            <div className="space-y-4">
              <div className="space-y-2">
                {cashSummary.deliveries.map(item => (
                  <div key={item.deliveryId} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{item.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{item.collectedAmount.toFixed(2)} MAD</p>
                      {item.hasDiscrepancy && (
                        <span className="text-xs text-red-600">Écart</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total attendu</span>
                  <span className="font-semibold">{cashSummary.totalExpected.toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total encaissé</span>
                  <span className="font-semibold">{cashSummary.totalCollected.toFixed(2)} MAD</span>
                </div>
                {cashSummary.difference > 0.01 && (
                  <div className="flex justify-between text-red-600">
                    <span className="text-sm">Écart</span>
                    <span className="font-semibold">{cashSummary.difference.toFixed(2)} MAD</span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-lg text-center ${cashSummary.hasDiscrepancies ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'
                }`}>
                {cashSummary.hasDiscrepancies
                  ? 'Résumé soumis avec des écarts — sera vérifié par l\'administration'
                  : 'Résumé soumis avec succès — en attente de vérification'}
              </div>
              <Button variant="outline" className="w-full" onClick={() => setCashSummaryDialogOpen(false)}>
                Fermer
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Delivery Detail Dialog ──────────────────────── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la livraison</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : detailDelivery && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="font-medium">{detailDelivery.order?.orderNumber}</p>
                <p className="text-sm text-slate-500">{detailDelivery.order?.customer?.name}</p>
                <p className="text-sm text-slate-500">{detailDelivery.order?.customer?.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-2 rounded text-center">
                  <p className="text-xs text-blue-600">Attendu</p>
                  <p className="font-bold text-blue-900">{detailDelivery.cashAmount?.toFixed(2)} MAD</p>
                </div>
                <div className="bg-green-50 p-2 rounded text-center">
                  <p className="text-xs text-green-600">Encaissé</p>
                  <p className="font-bold text-green-900">{detailDelivery.collectedAmount?.toFixed(2) || '—'} MAD</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Paiement</span>
                  <Badge variant={detailDelivery.paymentConfirmed ? 'default' : 'secondary'}>
                    {detailDelivery.paymentConfirmed ? 'Confirmé' : 'Non confirmé'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Signature</span>
                  <Badge variant={hasSignature(detailDelivery) ? 'default' : 'secondary'}>
                    {hasSignature(detailDelivery) ? 'Capturée' : 'Non capturée'}
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
              {detailDelivery.signatureData && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Signature du client:</p>
                  <img
                    src={detailDelivery.signatureData}
                    alt="Signature"
                    className="border rounded-lg w-full max-h-24 object-contain bg-white"
                  />
                </div>
              )}
              {detailDelivery.hasDiscrepancy && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800">Rapport d'incident</p>
                  <p className="text-xs text-red-600">{detailDelivery.incidentReport}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChauffeurDashboard;
