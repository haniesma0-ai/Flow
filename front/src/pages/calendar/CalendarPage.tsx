import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Plus, Truck, Package, Calendar as CalendarIcon, List, Play, CheckCircle2, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Delivery, DeliveryStatus, Order } from '@/types';
import { deliveriesService } from '@/services/deliveries';
import { ordersService } from '@/services/orders';
import api from '@/services/api';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  extendedProps: {
    delivery: Delivery;
    type: 'delivery';
  };
  backgroundColor: string;
  borderColor: string;
}

interface SimpleItem {
  id: number;
  name: string;
  registration?: string;
  brand?: string;
  model?: string;
}

const CalendarPage = () => {
  const { t } = useTranslation();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  // Create / Edit dialog state
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chauffeurs, setChauffeurs] = useState<SimpleItem[]>([]);
  const [vehicles, setVehicles] = useState<SimpleItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [formOrderId, setFormOrderId] = useState('');
  const [formChauffeurId, setFormChauffeurId] = useState('');
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formPlannedDate, setFormPlannedDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const fetchDeliveries = useCallback(async () => {
    try {
      const data = await deliveriesService.getDeliveries();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
      toast.error(t('calendar.toast.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  useEffect(() => {
    const calendarEvents: CalendarEvent[] = deliveries.map((delivery) => ({
      id: delivery.id.toString(),
      title: `${delivery.order?.orderNumber || 'N/A'} - ${delivery.order?.customer?.name || 'Client'}`,
      start: delivery.plannedDate,
      extendedProps: {
        delivery,
        type: 'delivery',
      },
      backgroundColor:
        delivery.status === 'completed'
          ? '#22c55e'
          : delivery.status === 'in_progress'
            ? '#f97316'
            : '#3b82f6',
      borderColor:
        delivery.status === 'completed'
          ? '#22c55e'
          : delivery.status === 'in_progress'
            ? '#f97316'
            : '#3b82f6',
    }));
    setEvents(calendarEvents);
  }, [deliveries]);

  const handleEventClick = (info: { event: { extendedProps: Record<string, unknown> } }) => {
    setSelectedDelivery(info.event.extendedProps.delivery as Delivery);
  };

  const handleDateSelect = (selectInfo: { startStr: string }) => {
    openCreateDialog(selectInfo.startStr);
  };

  // Load dropdown data for create/edit form
  const loadFormData = async () => {
    try {
      const [ordersData, chauffeursRes, vehiclesRes] = await Promise.all([
        ordersService.getOrders(),
        api.get('/chauffeurs'),
        api.get('/vehicles'),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setChauffeurs(Array.isArray(chauffeursRes.data) ? chauffeursRes.data : []);
      setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);
    } catch (err) {
      console.error('Failed to load form data:', err);
    }
  };

  const openCreateDialog = (date?: string) => {
    setEditingDelivery(null);
    setFormOrderId('');
    setFormChauffeurId('');
    setFormVehicleId('');
    setFormPlannedDate(date || new Date().toISOString().slice(0, 16));
    setFormNotes('');
    loadFormData();
    setShowFormDialog(true);
  };

  const openEditDialog = (delivery: Delivery) => {
    setEditingDelivery(delivery);
    setFormOrderId(delivery.orderId?.toString() || '');
    setFormChauffeurId(delivery.chauffeurId?.toString() || '');
    setFormVehicleId(delivery.vehicleId?.toString() || '');
    setFormPlannedDate(delivery.plannedDate ? delivery.plannedDate.slice(0, 16) : '');
    setFormNotes(delivery.notes || '');
    setSelectedDelivery(null);
    loadFormData();
    setShowFormDialog(true);
  };

  const handleFormSave = async () => {
    if (!formChauffeurId || !formVehicleId || !formPlannedDate) {
      toast.error(t('calendar.toast.requiredFields'));
      return;
    }
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        chauffeur_id: Number(formChauffeurId),
        vehicle_id: Number(formVehicleId),
        planned_date: formPlannedDate,
        notes: formNotes || null,
      };
      if (editingDelivery) {
        const updated = await deliveriesService.updateDelivery(editingDelivery.id, payload);
        setDeliveries((prev) => prev.map((d) => (d.id === editingDelivery.id ? updated : d)));
        toast.success(t('calendar.toast.updated'));
      } else {
        if (!formOrderId) {
          toast.error(t('calendar.toast.selectOrder'));
          setIsSaving(false);
          return;
        }
        payload.order_id = Number(formOrderId);
        const created = await deliveriesService.createDelivery(payload);
        setDeliveries((prev) => [...prev, created]);
        toast.success(t('calendar.toast.created'));
      }
      setShowFormDialog(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; errors?: { order_id?: string[] } } } };
      const msg = axiosErr.response?.data?.error || axiosErr.response?.data?.errors?.order_id?.[0] || t('calendar.toast.saveError');
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (delivery: Delivery, newStatus: string) => {
    try {
      const updated = await deliveriesService.updateDeliveryStatus(delivery.id, newStatus as DeliveryStatus);
      setDeliveries((prev) => prev.map((d) => (d.id === delivery.id ? updated : d)));
      setSelectedDelivery(updated);
      toast.success(t('calendar.toast.statusUpdated'));
    } catch {
      toast.error(t('calendar.toast.statusError'));
    }
  };

  const handleDelete = async (delivery: Delivery) => {
    if (!confirm(t('calendar.toast.deleteConfirm'))) return;
    try {
      await deliveriesService.deleteDelivery(delivery.id);
      setDeliveries((prev) => prev.filter((d) => d.id !== delivery.id));
      setSelectedDelivery(null);
      toast.success(t('calendar.toast.deleted'));
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || t('calendar.toast.deleteError'));
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t('status.completed');
      case 'in_progress': return t('status.inProgress');
      case 'cancelled': return t('status.cancelled');
      default: return t('status.planned');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('calendar.title')}</h2>
          <p className="text-slate-600 mt-1">
            {t('calendar.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'calendar'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <CalendarIcon className="w-4 h-4" />
              {t('calendar.calendarView')}
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'list'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <List className="w-4 h-4" />
              {t('calendar.listView')}
            </button>
          </div>
          <Button onClick={() => openCreateDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            {t('calendar.newDelivery')}
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span className="text-sm text-slate-600">{t('calendar.legendPlanned')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span className="text-sm text-slate-600">{t('calendar.legendInProgress')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-sm text-slate-600">{t('calendar.legendCompleted')}</span>
        </div>
      </div>

      {/* Calendar or List View */}
      {view === 'calendar' ? (
        <Card>
          <CardContent className="p-6">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              initialView="dayGridMonth"
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={events}
              eventClick={handleEventClick}
              select={handleDateSelect}
              locale="fr"
              buttonText={{
                today: t('calendar.today'),
                month: t('calendar.month'),
                week: t('calendar.week'),
                day: t('calendar.day'),
              }}
              height="auto"
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('calendar.listTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deliveries.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  {t('calendar.noDeliveries')}
                </p>
              ) : (
                deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedDelivery(delivery)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${delivery.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : delivery.status === 'in_progress'
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-blue-100 text-blue-600'
                          }`}
                      >
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {delivery.order?.orderNumber || 'N/A'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {delivery.order?.customer?.name || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={getStatusColor(delivery.status)}>
                        {getStatusLabel(delivery.status)}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">
                          {new Date(delivery.plannedDate).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        <p className="text-sm text-slate-500">
                          {delivery.chauffeur?.name || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Detail Dialog */}
      <Dialog
        open={!!selectedDelivery}
        onOpenChange={() => setSelectedDelivery(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('calendar.detailTitle')}</DialogTitle>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${selectedDelivery.status === 'completed'
                    ? 'bg-green-100 text-green-600'
                    : selectedDelivery.status === 'in_progress'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-blue-100 text-blue-600'
                    }`}
                >
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedDelivery.order?.orderNumber || 'N/A'}
                  </p>
                  <Badge variant="outline" className={getStatusColor(selectedDelivery.status)}>
                    {getStatusLabel(selectedDelivery.status)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">{t('calendar.client')}</p>
                    <p className="font-medium text-slate-900">
                      {selectedDelivery.order?.customer?.name || '—'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {selectedDelivery.order?.customer?.address || ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">{t('calendar.plannedDate')}</p>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedDelivery.plannedDate).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">{t('calendar.driver')}</p>
                    <p className="font-medium text-slate-900">
                      {selectedDelivery.chauffeur?.name || '—'}
                    </p>
                  </div>
                </div>

                {selectedDelivery.vehicle && (
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">{t('calendar.vehicle')}</p>
                      <p className="font-medium text-slate-900">
                        {selectedDelivery.vehicle.registration} — {selectedDelivery.vehicle.brand} {selectedDelivery.vehicle.model}
                      </p>
                    </div>
                  </div>
                )}

                {selectedDelivery.notes && (
                  <div className="p-3 bg-slate-50 rounded-md">
                    <p className="text-sm text-slate-500 mb-1">{t('calendar.notes')}</p>
                    <p className="text-sm text-slate-700">{selectedDelivery.notes}</p>
                  </div>
                )}
              </div>

              {/* Status change actions */}
              {selectedDelivery.status !== 'completed' && selectedDelivery.status !== 'cancelled' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {selectedDelivery.status === 'planned' && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(selectedDelivery, 'in_progress')}>
                      <Play className="w-4 h-4 mr-1" /> {t('calendar.start')}
                    </Button>
                  )}
                  {selectedDelivery.status === 'in_progress' && (
                    <Button size="sm" variant="outline" className="text-green-700" onClick={() => handleStatusChange(selectedDelivery, 'completed')}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> {t('calendar.complete')}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleStatusChange(selectedDelivery, 'cancelled')}>
                    <XCircle className="w-4 h-4 mr-1" /> {t('common.cancel')}
                  </Button>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedDelivery(null)}
                >
                  {t('common.close')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => openEditDialog(selectedDelivery)}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(selectedDelivery)}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Edit Delivery Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDelivery ? t('calendar.dialog.editTitle') : t('calendar.dialog.createTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingDelivery && (
              <div className="space-y-2">
                <Label>{t('calendar.form.order')}</Label>
                <Select value={formOrderId} onValueChange={setFormOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('calendar.form.selectOrder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        {order.orderNumber} — {order.customer?.name || 'Client'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('calendar.form.driver')}</Label>
              <Select value={formChauffeurId} onValueChange={setFormChauffeurId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('calendar.form.selectDriver')} />
                </SelectTrigger>
                <SelectContent>
                  {chauffeurs.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('calendar.form.vehicle')}</Label>
              <Select value={formVehicleId} onValueChange={setFormVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('calendar.form.selectVehicle')} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id.toString()}>
                      {v.registration} — {v.brand} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('calendar.form.plannedDate')}</Label>
              <Input
                type="datetime-local"
                value={formPlannedDate}
                onChange={(e) => setFormPlannedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('calendar.form.notes')}</Label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder={t('calendar.form.notesPlaceholder')}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowFormDialog(false)}>
                {t('calendar.form.cancel')}
              </Button>
              <Button className="flex-1" onClick={handleFormSave} disabled={isSaving}>
                {isSaving ? t('common.saving') : (editingDelivery ? t('common.edit') : t('common.create'))}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
