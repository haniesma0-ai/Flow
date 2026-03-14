import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Plus, Search, MoreHorizontal, Edit, Trash2, Truck, CheckCircle, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/services/api';
import { toast } from 'sonner';

interface Vehicle {
    id: number;
    licensePlate: string;
    brand: string;
    model: string;
    capacity: number | null;
    isActive: boolean;
    deliveriesCount: number;
    createdAt: string;
    updatedAt: string;
}

const VehiclesPage = () => {
    const { t } = useTranslation();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [filtered, setFiltered] = useState<Vehicle[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    // Form dialog
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<Vehicle | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form fields
    const [formPlate, setFormPlate] = useState('');
    const [formBrand, setFormBrand] = useState('');
    const [formModel, setFormModel] = useState('');
    const [formCapacity, setFormCapacity] = useState('');
    const [formActive, setFormActive] = useState(true);

    const fetchVehicles = async () => {
        try {
            const res = await api.get('/admin/vehicles');
            const data = Array.isArray(res.data) ? res.data : [];
            setVehicles(data);
        } catch {
            toast.error(t('vehicles.toast.loadError'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    useEffect(() => {
        let list = vehicles;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (v) =>
                    v.licensePlate.toLowerCase().includes(q) ||
                    v.brand.toLowerCase().includes(q) ||
                    v.model.toLowerCase().includes(q)
            );
        }
        if (statusFilter === 'active') list = list.filter((v) => v.isActive);
        if (statusFilter === 'inactive') list = list.filter((v) => !v.isActive);
        setFiltered(list);
    }, [vehicles, searchQuery, statusFilter]);

    const openCreate = () => {
        setEditing(null);
        setFormPlate('');
        setFormBrand('');
        setFormModel('');
        setFormCapacity('');
        setFormActive(true);
        setShowDialog(true);
    };

    const openEdit = (v: Vehicle) => {
        setEditing(v);
        setFormPlate(v.licensePlate);
        setFormBrand(v.brand);
        setFormModel(v.model);
        setFormCapacity(v.capacity?.toString() || '');
        setFormActive(v.isActive);
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!formPlate.trim() || !formBrand.trim() || !formModel.trim()) {
            toast.error(t('vehicles.toast.requiredFields'));
            return;
        }
        setIsSaving(true);
        const payload = {
            license_plate: formPlate.trim(),
            brand: formBrand.trim(),
            model: formModel.trim(),
            capacity: formCapacity ? Number(formCapacity) : null,
            is_active: formActive,
        };
        try {
            if (editing) {
                const res = await api.put(`/admin/vehicles/${editing.id}`, payload);
                setVehicles((prev) => prev.map((v) => (v.id === editing.id ? res.data : v)));
                toast.success(t('vehicles.toast.updated'));
            } else {
                const res = await api.post('/admin/vehicles', payload);
                setVehicles((prev) => [...prev, res.data]);
                toast.success(t('vehicles.toast.created'));
            }
            setShowDialog(false);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
            const errors = axiosErr.response?.data?.errors;
            if (errors) {
                const first = Object.values(errors).flat()[0] as string;
                toast.error(first);
            } else {
                toast.error(t('vehicles.toast.saveError'));
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (v: Vehicle) => {
        if (!confirm(`Supprimer le véhicule ${v.licensePlate} ?`)) return;
        try {
            await api.delete(`/admin/vehicles/${v.id}`);
            setVehicles((prev) => prev.filter((x) => x.id !== v.id));
            toast.success(t('vehicles.toast.deleted'));
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || t('vehicles.toast.deleteError'));
        }
    };

    const toggleActive = async (v: Vehicle) => {
        try {
            const res = await api.put(`/admin/vehicles/${v.id}`, { is_active: !v.isActive });
            setVehicles((prev) => prev.map((x) => (x.id === v.id ? res.data : x)));
            toast.success(v.isActive ? t('vehicles.toast.deactivated') : t('vehicles.toast.activated'));
        } catch {
            toast.error(t('vehicles.toast.updateError'));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const activeCount = vehicles.filter((v) => v.isActive).length;
    const inactiveCount = vehicles.length - activeCount;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{t('vehicles.title')}</h2>
                    <p className="text-slate-600 mt-1">{t('vehicles.subtitle')}</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('vehicles.newVehicle')}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Truck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{vehicles.length}</p>
                            <p className="text-sm text-slate-500">{t('vehicles.total')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                            <p className="text-sm text-slate-500">{t('vehicles.active')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-500">{inactiveCount}</p>
                            <p className="text-sm text-slate-500">{t('vehicles.inactive')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder={t('vehicles.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('vehicles.statusAll')}</SelectItem>
                                <SelectItem value="active">{t('vehicles.statusActive')}</SelectItem>
                                <SelectItem value="inactive">{t('vehicles.statusInactive')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Vehicles Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('vehicles.tableTitle', { count: filtered.length })}</CardTitle>
                </CardHeader>
                <CardContent>
                    {filtered.length === 0 ? (
                        <div className="text-center py-12">
                            <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">{t('vehicles.noVehiclesFound')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-3 font-medium text-slate-500">{t('vehicles.table.plate')}</th>
                                        <th className="pb-3 font-medium text-slate-500">{t('vehicles.table.brand')}</th>
                                        <th className="pb-3 font-medium text-slate-500">{t('vehicles.table.model')}</th>
                                        <th className="pb-3 font-medium text-slate-500">{t('vehicles.table.capacity')}</th>
                                        <th className="pb-3 font-medium text-slate-500">{t('vehicles.table.deliveries')}</th>
                                        <th className="pb-3 font-medium text-slate-500">{t('vehicles.table.status')}</th>
                                        <th className="pb-3 font-medium text-slate-500 text-right">{t('vehicles.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((v) => (
                                        <tr key={v.id} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="py-3 font-medium text-slate-900">{v.licensePlate}</td>
                                            <td className="py-3 text-slate-700">{v.brand}</td>
                                            <td className="py-3 text-slate-700">{v.model}</td>
                                            <td className="py-3 text-slate-700">{v.capacity ?? '—'}</td>
                                            <td className="py-3 text-slate-700">{v.deliveriesCount}</td>
                                            <td className="py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        v.isActive
                                                            ? 'bg-green-100 text-green-800 border-green-300 cursor-pointer'
                                                            : 'bg-red-100 text-red-800 border-red-300 cursor-pointer'
                                                    }
                                                    onClick={() => toggleActive(v)}
                                                >
                                                    {v.isActive ? t('common.active') : t('common.inactive')}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEdit(v)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            {t('common.edit')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => toggleActive(v)}>
                                                            {v.isActive ? (
                                                                <><XCircle className="w-4 h-4 mr-2" />{t('common.deactivate')}</>
                                                            ) : (
                                                                <><CheckCircle className="w-4 h-4 mr-2" />{t('common.activate')}</>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(v)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            {t('common.delete')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? t('vehicles.dialog.editTitle') : t('vehicles.dialog.createTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('vehicles.form.plate')} *</Label>
                            <Input
                                value={formPlate}
                                onChange={(e) => setFormPlate(e.target.value)}
                                placeholder="Ex: AB-123-CD"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('vehicles.form.brand')} *</Label>
                                <Input
                                    value={formBrand}
                                    onChange={(e) => setFormBrand(e.target.value)}
                                    placeholder="Ex: Renault"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('vehicles.form.model')} *</Label>
                                <Input
                                    value={formModel}
                                    onChange={(e) => setFormModel(e.target.value)}
                                    placeholder="Ex: Master"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('vehicles.form.capacity')}</Label>
                            <Input
                                type="number"
                                value={formCapacity}
                                onChange={(e) => setFormCapacity(e.target.value)}
                                placeholder="Ex: 5000"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Label>{t('vehicles.form.active')}</Label>
                            <button
                                type="button"
                                onClick={() => setFormActive(!formActive)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formActive ? 'bg-green-500' : 'bg-slate-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formActive ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                                {t('vehicles.form.cancel')}
                            </Button>
                            <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? t('common.saving') : t('common.save')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VehiclesPage;
