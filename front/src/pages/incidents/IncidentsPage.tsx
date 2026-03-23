import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Edit,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import type { Delivery, Incident } from '@/types';
import { incidentsService } from '@/services/incidents';
import { deliveriesService } from '@/services/deliveries';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const IncidentsPage = () => {
    const { auth } = useAuth();
    const role = auth.user?.role || 'chauffeur';
    const canResolve = role === 'admin' || role === 'manager';
    const canDelete = canResolve;

    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_review' | 'resolved'>('all');
    const [isLoading, setIsLoading] = useState(true);

    const [showDialog, setShowDialog] = useState(false);
    const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formDeliveryId, setFormDeliveryId] = useState('');
    const [formReport, setFormReport] = useState('');
    const [formIncidentStatus, setFormIncidentStatus] = useState<'open' | 'in_review' | 'resolved'>('open');
    const [formResolutionNotes, setFormResolutionNotes] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [incidentsData, deliveriesData] = await Promise.all([
                incidentsService.getIncidents(),
                deliveriesService.getDeliveries(),
            ]);
            setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
            setDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);
        } catch (err) {
            console.error(err);
            toast.error('Erreur lors du chargement des incidents');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredIncidents = useMemo(() => {
        let list = incidents;

        if (statusFilter !== 'all') {
            list = list.filter((i) => i.incidentStatus === statusFilter);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter((i) =>
                i.order?.orderNumber?.toLowerCase().includes(q)
                || i.order?.customer?.name?.toLowerCase().includes(q)
                || i.chauffeur?.name?.toLowerCase().includes(q)
                || i.incidentReport?.toLowerCase().includes(q)
            );
        }

        return list;
    }, [incidents, searchQuery, statusFilter]);

    const availableDeliveries = useMemo(() => {
        const withIncident = new Set(incidents.map((i) => i.deliveryId));
        return deliveries
            .filter((d) => d.status !== 'cancelled')
            .filter((d) => !withIncident.has(d.id));
    }, [deliveries, incidents]);

    const openCreate = () => {
        setEditingIncident(null);
        setFormReport('');
        setFormIncidentStatus('open');
        setFormResolutionNotes('');
        setFormDeliveryId(availableDeliveries[0] ? String(availableDeliveries[0].id) : '');
        setShowDialog(true);
    };

    const openEdit = (incident: Incident) => {
        setEditingIncident(incident);
        setFormDeliveryId(String(incident.deliveryId));
        setFormReport(incident.incidentReport || '');
        setFormIncidentStatus(incident.incidentStatus || 'open');
        setFormResolutionNotes(incident.incidentResolutionNotes || '');
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!formReport.trim()) {
            toast.error('Le rapport d\'incident est obligatoire');
            return;
        }

        if (!editingIncident && !formDeliveryId) {
            toast.error('Veuillez sélectionner une livraison');
            return;
        }

        setIsSaving(true);
        try {
            if (editingIncident) {
                if (canResolve) {
                    await incidentsService.updateIncident(editingIncident.deliveryId, {
                        incident_report: formReport.trim(),
                        incident_status: formIncidentStatus,
                        incident_resolution_notes: formResolutionNotes.trim() || undefined,
                    });
                } else {
                    await incidentsService.updateIncident(editingIncident.deliveryId, {
                        incident_report: formReport.trim(),
                    });
                }
                toast.success('Incident mis à jour');
            } else {
                if (canResolve) {
                    await incidentsService.createIncident(Number(formDeliveryId), {
                        incident_report: formReport.trim(),
                        incident_status: formIncidentStatus,
                        incident_resolution_notes: formResolutionNotes.trim() || undefined,
                    });
                } else {
                    await incidentsService.createIncident(Number(formDeliveryId), {
                        incident_report: formReport.trim(),
                    });
                }
                toast.success('Incident déclaré');
            }

            setShowDialog(false);
            await fetchData();
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                || 'Erreur lors de la sauvegarde';
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (incident: Incident) => {
        if (!canDelete) return;
        if (!confirm('Supprimer cet incident ?')) return;

        try {
            await incidentsService.deleteIncident(incident.deliveryId);
            toast.success('Incident supprimé');
            await fetchData();
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                || 'Erreur lors de la suppression';
            toast.error(msg);
        }
    };

    const getIncidentStatusBadge = (status: Incident['incidentStatus']) => {
        const safeStatus = status || 'open';
        const styles: Record<string, string> = {
            open: 'bg-red-100 text-red-700 border-red-300',
            in_review: 'bg-amber-100 text-amber-700 border-amber-300',
            resolved: 'bg-green-100 text-green-700 border-green-300',
        };
        const labels: Record<string, string> = {
            open: 'Ouvert',
            in_review: 'En revue',
            resolved: 'Résolu',
        };
        return (
            <Badge variant="outline" className={styles[safeStatus] || styles.open}>
                {labels[safeStatus] || labels.open}
            </Badge>
        );
    };

    const openCount = incidents.filter((i) => i.incidentStatus === 'open').length;
    const inReviewCount = incidents.filter((i) => i.incidentStatus === 'in_review').length;
    const resolvedCount = incidents.filter((i) => i.incidentStatus === 'resolved').length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Incidents</h2>
                    <p className="text-slate-600 mt-1">Incidents déclarés pendant les livraisons</p>
                </div>
                <Button onClick={openCreate} disabled={availableDeliveries.length === 0}>
                    <Plus className="w-4 h-4 mr-2" />
                    Déclarer un incident
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{openCount}</p>
                            <p className="text-sm text-slate-500">Ouverts</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{inReviewCount}</p>
                            <p className="text-sm text-slate-500">En revue</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
                            <p className="text-sm text-slate-500">Résolus</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher commande, client, chauffeur, texte..."
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Statut incident" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous</SelectItem>
                                <SelectItem value="open">Ouvert</SelectItem>
                                <SelectItem value="in_review">En revue</SelectItem>
                                <SelectItem value="resolved">Résolu</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Commande</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Chauffeur</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredIncidents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                            Aucun incident trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    filteredIncidents.map((incident) => (
                                        <tr key={incident.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-slate-900">{incident.order?.orderNumber || '-'}</p>
                                                <p className="text-xs text-slate-500 line-clamp-1">{incident.incidentReport}</p>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">{incident.order?.customer?.name || '-'}</td>
                                            <td className="px-4 py-3 text-slate-700">{incident.chauffeur?.name || '-'}</td>
                                            <td className="px-4 py-3">{getIncidentStatusBadge(incident.incidentStatus)}</td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {incident.incidentReportedAt
                                                    ? new Date(incident.incidentReportedAt).toLocaleString('fr-FR')
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEdit(incident)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Modifier
                                                        </DropdownMenuItem>
                                                        {canDelete && (
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => handleDelete(incident)}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Supprimer
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

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingIncident ? 'Modifier incident' : 'Déclarer un incident'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {!editingIncident && (
                            <div className="space-y-2">
                                <Label>Livraison</Label>
                                <Select value={formDeliveryId} onValueChange={setFormDeliveryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner une livraison" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableDeliveries.map((d) => (
                                            <SelectItem key={d.id} value={String(d.id)}>
                                                {d.order?.orderNumber} - {d.order?.customer?.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Rapport d'incident</Label>
                            <textarea
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[110px]"
                                value={formReport}
                                onChange={(e) => setFormReport(e.target.value)}
                                placeholder="Décrivez précisément l'incident..."
                            />
                        </div>

                        {canResolve && (
                            <>
                                <div className="space-y-2">
                                    <Label>Statut incident</Label>
                                    <Select value={formIncidentStatus} onValueChange={(v) => setFormIncidentStatus(v as typeof formIncidentStatus)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Ouvert</SelectItem>
                                            <SelectItem value="in_review">En revue</SelectItem>
                                            <SelectItem value="resolved">Résolu</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Notes de résolution (optionnel)</Label>
                                    <textarea
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
                                        value={formResolutionNotes}
                                        onChange={(e) => setFormResolutionNotes(e.target.value)}
                                        placeholder="Actions menées, décision, suivi..."
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default IncidentsPage;
