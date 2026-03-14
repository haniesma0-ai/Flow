import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Truck, Navigation, Phone, Clock, Package,
  RefreshCw, Banknote, AlertTriangle, User, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Delivery, DriverLocation } from '@/types';
import { deliveriesService } from '@/services/deliveries';
import { toast } from 'sonner';

// Fix default Leaflet marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createColorIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const markerIcons: Record<string, L.Icon> = {
  completed: createColorIcon('green'),
  in_progress: createColorIcon('orange'),
  planned: createColorIcon('blue'),
  driver: createColorIcon('red'),
};

const center: [number, number] = [31.6295, -7.9811];

// Component to fly to a position on the map
const FlyToPosition = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { duration: 0.8 });
    }
  }, [position, map]);
  return null;
};

type ViewMode = 'deliveries' | 'drivers';

const MapTrackingPage = () => {
  const { t } = useTranslation();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'planned' | 'in_progress' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('drivers');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  // Fetch deliveries
  const fetchDeliveries = useCallback(async () => {
    try {
      const data = await deliveriesService.getDeliveries();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    }
  }, []);

  // Fetch driver locations
  const fetchDriverLocations = useCallback(async () => {
    try {
      const data = await deliveriesService.trackDrivers();
      setDriverLocations(Array.isArray(data) ? data : []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load driver locations:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchDeliveries(), fetchDriverLocations()]);
      setIsLoading(false);
    };
    load();
  }, [fetchDeliveries, fetchDriverLocations]);

  // Auto-refresh driver locations every 15 seconds
  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        fetchDriverLocations();
      }, 15000);
    }
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [autoRefresh, fetchDriverLocations]);

  const handleManualRefresh = () => {
    fetchDeliveries();
    fetchDriverLocations();
    toast.success('Carte actualisée');
  };

  const filteredDeliveries = useMemo(
    () => deliveries.filter((d) => filter === 'all' || d.status === filter),
    [deliveries, filter]
  );

  // Compute stats
  const activeDrivers = driverLocations.length;
  const totalCashInTransit = deliveries
    .filter(d => d.status === 'in_progress' && d.cashAmount)
    .reduce((s, d) => s + (d.cashAmount || 0), 0);
  const discrepancyCount = deliveries.filter(d => d.hasDiscrepancy).length;

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
          <h2 className="text-2xl font-bold text-slate-900">{t('tracking.title')}</h2>
          <p className="text-slate-600 mt-1">
            {t('tracking.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border ${autoRefresh ? 'bg-green-50 text-green-700 border-green-300' : 'bg-slate-50 text-slate-600 border-slate-300'
                }`}
            >
              <Radio className={`w-3 h-3 ${autoRefresh ? 'animate-pulse' : ''}`} />
              {autoRefresh ? 'Live' : 'Pause'}
            </button>
            <span className="text-xs text-slate-400">
              {lastRefresh.toLocaleTimeString('fr-FR')}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleManualRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('tracking.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <Card className="lg:col-span-1 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="space-y-3">
              {/* View mode toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('drivers')}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-md transition-colors ${viewMode === 'drivers'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  <User className="w-4 h-4" />
                  Chauffeurs ({activeDrivers})
                </button>
                <button
                  onClick={() => setViewMode('deliveries')}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-md transition-colors ${viewMode === 'deliveries'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  <Package className="w-4 h-4" />
                  Livraisons
                </button>
              </div>

              {/* Delivery status filters (only in deliveries mode) */}
              {viewMode === 'deliveries' && (
                <div className="flex gap-1">
                  {(['all', 'planned', 'in_progress', 'completed'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${filter === f
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {f === 'all' && t('tracking.filterAll')}
                      {f === 'planned' && t('tracking.filterPlanned')}
                      {f === 'in_progress' && t('tracking.filterInProgress')}
                      {f === 'completed' && t('tracking.filterCompleted')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
            <div className="space-y-3">
              {/* ─── Driver List ──────────────────────── */}
              {viewMode === 'drivers' && (
                <>
                  {driverLocations.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">
                      Aucun chauffeur actif
                    </p>
                  ) : (
                    driverLocations.map((driver) => {
                      const driverCash = driver.activeDeliveries.reduce((s, d) => s + (d.cashAmount || 0), 0);
                      return (
                        <div
                          key={driver.chauffeur?.id ?? 'unknown'}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedDriver?.chauffeur?.id === driver.chauffeur?.id
                            ? 'border-red-400 bg-red-50'
                            : 'border-transparent bg-slate-50 hover:bg-slate-100'
                            }`}
                          onClick={() => {
                            setSelectedDriver(driver);
                            setSelectedDelivery(null);
                            if (driver.currentLocation.latitude && driver.currentLocation.longitude) {
                              setFlyTarget([driver.currentLocation.latitude, driver.currentLocation.longitude]);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <Truck className="w-4 h-4 text-red-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {driver.chauffeur?.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {driver.activeDeliveries.length} livraison{driver.activeDeliveries.length > 1 ? 's' : ''} active{driver.activeDeliveries.length > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Radio className="w-3 h-3 text-green-500 animate-pulse" />
                              <span className="text-xs text-green-600">En ligne</span>
                            </div>
                          </div>

                          {/* COD info for active deliveries */}
                          {driverCash > 0 && (
                            <div className="flex items-center gap-2 mt-2 text-sm">
                              <Banknote className="w-4 h-4 text-amber-500" />
                              <span className="text-slate-600">
                                Cash en cours: <span className="font-semibold">{driverCash.toFixed(0)} MAD</span>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {/* ─── Delivery List ──────────────────────── */}
              {viewMode === 'deliveries' && (
                <>
                  {filteredDeliveries.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">
                      {t('tracking.noDeliveries')}
                    </p>
                  ) : (
                    filteredDeliveries.map((delivery) => (
                      <div
                        key={delivery.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedDelivery?.id === delivery.id
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent bg-slate-50 hover:bg-slate-100'
                          }`}
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setSelectedDriver(null);
                          if (delivery.latitude && delivery.longitude) {
                            setFlyTarget([delivery.latitude, delivery.longitude]);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-900">
                              {delivery.order?.orderNumber}
                            </p>
                            <p className="text-sm text-slate-500">
                              {delivery.order?.customer?.name}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              delivery.status === 'completed'
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : delivery.status === 'in_progress'
                                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                                  : 'bg-blue-100 text-blue-800 border-blue-300'
                            }
                          >
                            {delivery.status === 'completed'
                              ? t('status.completed')
                              : delivery.status === 'in_progress'
                                ? t('status.inProgress')
                                : t('status.planned')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {delivery.plannedDate && new Date(delivery.plannedDate).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Truck className="w-4 h-4" />
                            <span>{delivery.chauffeur?.name?.split(' ')[0]}</span>
                          </div>
                          {delivery.cashAmount && delivery.cashAmount > 0 && (
                            <div className="flex items-center gap-1">
                              <Banknote className="w-4 h-4 text-amber-500" />
                              <span className="font-medium">{delivery.cashAmount.toFixed(0)}</span>
                            </div>
                          )}
                        </div>
                        {delivery.hasDiscrepancy && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            Écart de paiement signalé
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardContent className="p-0 h-full">
            <MapContainer
              center={center}
              zoom={12}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FlyToPosition position={flyTarget} />

              {/* Driver markers */}
              {driverLocations.map((driver) => {
                const lat = driver.currentLocation.latitude;
                const lng = driver.currentLocation.longitude;
                if (!lat || !lng) return null;
                const cash = driver.activeDeliveries.reduce((s, d) => s + (d.cashAmount || 0), 0);
                return (
                  <Marker
                    key={`driver-${driver.chauffeur?.id}`}
                    position={[lat, lng]}
                    icon={markerIcons.driver}
                    eventHandlers={{
                      click: () => {
                        setSelectedDriver(driver);
                        setSelectedDelivery(null);
                        setViewMode('drivers');
                      },
                    }}
                  >
                    <Popup>
                      <div className="min-w-[220px]">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-4 h-4 text-red-600" />
                          <span className="font-medium">{driver.chauffeur?.name}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">
                          {driver.activeDeliveries.length} livraison{driver.activeDeliveries.length > 1 ? 's' : ''} en cours
                        </p>
                        {cash > 0 && (
                          <p className="text-sm font-medium text-amber-700 mb-1">
                            Cash: {cash.toFixed(0)} MAD
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Accuracy circles around drivers */}
              {driverLocations.map((driver) => {
                const lat = driver.currentLocation.latitude;
                const lng = driver.currentLocation.longitude;
                if (!lat || !lng) return null;
                return (
                  <Circle
                    key={`circle-${driver.chauffeur?.id}`}
                    center={[lat, lng]}
                    radius={100}
                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, weight: 1 }}
                  />
                );
              })}

              {/* Delivery markers */}
              {filteredDeliveries.map(
                (delivery) =>
                  delivery.latitude &&
                  delivery.longitude && (
                    <Marker
                      key={`del-${delivery.id}`}
                      position={[delivery.latitude, delivery.longitude]}
                      icon={markerIcons[delivery.status] || markerIcons.planned}
                      eventHandlers={{
                        click: () => {
                          setSelectedDelivery(delivery);
                          setSelectedDriver(null);
                          setViewMode('deliveries');
                        },
                      }}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">
                              {delivery.order?.orderNumber}
                            </span>
                            {delivery.hasDiscrepancy && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-1">
                            {delivery.order?.customer?.name}
                          </p>
                          <p className="text-sm text-slate-500 mb-1">
                            {delivery.order?.customer?.address}
                          </p>
                          {delivery.cashAmount && delivery.cashAmount > 0 && (
                            <p className="text-sm font-medium text-amber-700 mb-2">
                              COD: {delivery.cashAmount.toFixed(0)} MAD
                              {delivery.paymentConfirmed && (
                                <span className="text-green-600 ml-1">✓ Encaissé</span>
                              )}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <a
                              href={`https://maps.google.com/?q=${delivery.order?.customer?.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 text-xs border rounded hover:bg-slate-100"
                            >
                              <Navigation className="w-3 h-3 mr-1" />
                              {t('tracking.route')}
                            </a>
                            {delivery.order?.customer?.phone && (
                              <a
                                href={`tel:${delivery.order.customer.phone}`}
                                className="inline-flex items-center px-2 py-1 text-xs border rounded hover:bg-slate-100"
                              >
                                <Phone className="w-3 h-3 mr-1" />
                                {t('tracking.call')}
                              </a>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
              )}
            </MapContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeDrivers}</p>
                <p className="text-xs text-slate-500">Chauffeurs actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {deliveries.length}
                </p>
                <p className="text-xs text-slate-500">{t('tracking.totalDeliveries')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {deliveries.filter((d) => d.status === 'in_progress').length}
                </p>
                <p className="text-xs text-slate-500">{t('tracking.inProgress')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Banknote className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalCashInTransit.toFixed(0)}</p>
                <p className="text-xs text-slate-500">Cash en transit (MAD)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${discrepancyCount > 0 ? 'bg-red-100' : 'bg-green-100'} rounded-lg flex items-center justify-center`}>
                <AlertTriangle className={`w-5 h-5 ${discrepancyCount > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${discrepancyCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {discrepancyCount}
                </p>
                <p className="text-xs text-slate-500">Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MapTrackingPage;
