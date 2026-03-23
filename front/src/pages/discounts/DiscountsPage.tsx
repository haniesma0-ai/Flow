import { useEffect, useMemo, useState } from 'react';
import {
    Percent,
    CheckCircle2,
    Edit,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
    XCircle,
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
import type { Discount } from '@/types';
import { discountsService } from '@/services/discounts';
import { toast } from 'sonner';

const DiscountsPage = () => {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'percent' | 'fixed'>('all');
    const [isLoading, setIsLoading] = useState(true);

    const [showDialog, setShowDialog] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formCode, setFormCode] = useState('');
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formType, setFormType] = useState<'percent' | 'fixed'>('percent');
    const [formValue, setFormValue] = useState('');
    const [formMinOrderAmount, setFormMinOrderAmount] = useState('0');
    const [formMaxDiscountAmount, setFormMaxDiscountAmount] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    const [formIsActive, setFormIsActive] = useState(true);

    const fetchDiscounts = async () => {
        setIsLoading(true);
        try {
            const data = await discountsService.getDiscounts();
            setDiscounts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            toast.error('Erreur lors du chargement des réductions');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const filteredDiscounts = useMemo(() => {
        let list = discounts;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (d) => d.code.toLowerCase().includes(q)
                    || d.name.toLowerCase().includes(q)
                    || d.description?.toLowerCase().includes(q)
            );
        }

        if (statusFilter === 'active') {
            list = list.filter((d) => d.isActive);
        }
        if (statusFilter === 'inactive') {
            list = list.filter((d) => !d.isActive);
        }

        if (typeFilter !== 'all') {
            list = list.filter((d) => d.type === typeFilter);
        }

        return list;
    }, [discounts, searchQuery, statusFilter, typeFilter]);

    const resetForm = () => {
        setFormCode('');
        setFormName('');
        setFormDescription('');
        setFormType('percent');
        setFormValue('');
        setFormMinOrderAmount('0');
        setFormMaxDiscountAmount('');
        setFormStartDate('');
        setFormEndDate('');
        setFormIsActive(true);
    };

    const openCreate = () => {
        setEditingDiscount(null);
        resetForm();
        setShowDialog(true);
    };

    const openEdit = (discount: Discount) => {
        setEditingDiscount(discount);
        setFormCode(discount.code);
        setFormName(discount.name);
        setFormDescription(discount.description || '');
        setFormType(discount.type);
        setFormValue(String(discount.value));
        setFormMinOrderAmount(String(discount.minOrderAmount || 0));
        setFormMaxDiscountAmount(discount.maxDiscountAmount !== null && discount.maxDiscountAmount !== undefined ? String(discount.maxDiscountAmount) : '');
        setFormStartDate(discount.startDate ? discount.startDate.slice(0, 10) : '');
        setFormEndDate(discount.endDate ? discount.endDate.slice(0, 10) : '');
        setFormIsActive(discount.isActive);
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!formCode.trim() || !formName.trim() || !formValue.trim()) {
            toast.error('Code, nom et valeur sont obligatoires');
            return;
        }

        const value = Number(formValue);
        if (Number.isNaN(value) || value <= 0) {
            toast.error('Valeur de réduction invalide');
            return;
        }

        if (formType === 'percent' && value > 100) {
            toast.error('Une réduction en pourcentage ne peut pas dépasser 100');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                code: formCode.trim().toUpperCase(),
                name: formName.trim(),
                description: formDescription.trim() || undefined,
                type: formType,
                value,
                min_order_amount: Number(formMinOrderAmount || 0),
                max_discount_amount: formMaxDiscountAmount ? Number(formMaxDiscountAmount) : null,
                start_date: formStartDate ? `${formStartDate} 00:00:00` : null,
                end_date: formEndDate ? `${formEndDate} 23:59:59` : null,
                is_active: formIsActive,
            };

            if (editingDiscount) {
                await discountsService.updateDiscount(editingDiscount.id, payload);
                toast.success('Réduction mise à jour');
            } else {
                await discountsService.createDiscount(payload);
                toast.success('Réduction créée');
            }

            setShowDialog(false);
            await fetchDiscounts();
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                || 'Erreur lors de la sauvegarde';
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (discount: Discount) => {
        if (!confirm(`Supprimer la réduction ${discount.code} ?`)) return;

        try {
            await discountsService.deleteDiscount(discount.id);
            toast.success('Réduction supprimée');
            await fetchDiscounts();
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                || 'Erreur lors de la suppression';
            toast.error(msg);
        }
    };

    const toggleActive = async (discount: Discount) => {
        try {
            await discountsService.updateDiscount(discount.id, { is_active: !discount.isActive });
            await fetchDiscounts();
            toast.success(!discount.isActive ? 'Réduction activée' : 'Réduction désactivée');
        } catch {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const activeCount = discounts.filter((d) => d.isActive).length;
    const inactiveCount = discounts.length - activeCount;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Réductions</h2>
                    <p className="text-slate-600 mt-1">Gestion complète des remises commerciales</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle réduction
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Percent className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{discounts.length}</p>
                            <p className="text-sm text-slate-500">Total</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                            <p className="text-sm text-slate-500">Actives</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
                            <p className="text-sm text-slate-500">Inactives</p>
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
                                className="pl-10"
                                placeholder="Rechercher code, nom, description..."
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                            <SelectTrigger className="w-full sm:w-44">
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous</SelectItem>
                                <SelectItem value="active">Actives</SelectItem>
                                <SelectItem value="inactive">Inactives</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                            <SelectTrigger className="w-full sm:w-44">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous types</SelectItem>
                                <SelectItem value="percent">Pourcentage</SelectItem>
                                <SelectItem value="fixed">Montant fixe</SelectItem>
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Valeur</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Min commande</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredDiscounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                            Aucune réduction trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDiscounts.map((discount) => (
                                        <tr key={discount.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{discount.code}</td>
                                            <td className="px-4 py-3 text-slate-700">{discount.name}</td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {discount.type === 'percent' ? 'Pourcentage' : 'Montant fixe'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {discount.type === 'percent'
                                                    ? `${discount.value}%`
                                                    : `${Number(discount.value).toLocaleString('fr-FR')} MAD`}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {Number(discount.minOrderAmount).toLocaleString('fr-FR')} MAD
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={discount.isActive
                                                        ? 'bg-green-100 text-green-700 border-green-300 cursor-pointer'
                                                        : 'bg-red-100 text-red-700 border-red-300 cursor-pointer'}
                                                    onClick={() => toggleActive(discount)}
                                                >
                                                    {discount.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEdit(discount)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Modifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(discount)}>
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Supprimer
                                                        </DropdownMenuItem>
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingDiscount ? 'Modifier réduction' : 'Créer réduction'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Code *</Label>
                                <Input value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())} placeholder="Ex: SPRING10" />
                            </div>
                            <div className="space-y-2">
                                <Label>Nom *</Label>
                                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Offre Printemps" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <textarea
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder="Détails de la réduction"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Type *</Label>
                                <Select value={formType} onValueChange={(v) => setFormType(v as typeof formType)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percent">Pourcentage</SelectItem>
                                        <SelectItem value="fixed">Montant fixe</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Valeur *</Label>
                                <Input type="number" value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="10" />
                            </div>
                            <div className="space-y-2">
                                <Label>Min commande</Label>
                                <Input type="number" value={formMinOrderAmount} onChange={(e) => setFormMinOrderAmount(e.target.value)} placeholder="0" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Plafond réduction</Label>
                                <Input
                                    type="number"
                                    value={formMaxDiscountAmount}
                                    onChange={(e) => setFormMaxDiscountAmount(e.target.value)}
                                    placeholder="Optionnel"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date début</Label>
                                <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Date fin</Label>
                                <Input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Label>Active</Label>
                            <button
                                type="button"
                                onClick={() => setFormIsActive(!formIsActive)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formIsActive ? 'bg-green-500' : 'bg-slate-300'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formIsActive ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
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

export default DiscountsPage;
