import { useState, useEffect } from 'react';
import {
    Plus, Search, MoreHorizontal, Edit, Trash2, Briefcase, CheckCircle, XCircle, MapPin, Eye,
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
import { Textarea } from '@/components/ui/textarea';
import { careersService, type Career } from '@/services/careers';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Freelance', 'Intérim'];

const CareersAdminPage = () => {
    const { t } = useTranslation();
    const [careers, setCareers] = useState<Career[]>([]);
    const [filtered, setFiltered] = useState<Career[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    // Form dialog
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<Career | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // View dialog
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [viewing, setViewing] = useState<Career | null>(null);

    // Form fields
    const [formTitle, setFormTitle] = useState('');
    const [formLocation, setFormLocation] = useState('');
    const [formType, setFormType] = useState('CDI');
    const [formDescription, setFormDescription] = useState('');
    const [formRequirements, setFormRequirements] = useState('');
    const [formDepartment, setFormDepartment] = useState('');
    const [formContactEmail, setFormContactEmail] = useState('rh@foxpetroleum.ma');
    const [formActive, setFormActive] = useState(true);

    const fetchCareers = async () => {
        try {
            const data = await careersService.getCareers();
            setCareers(data || []);
        } catch {
            toast.error(t('careers.toast.loadError'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCareers();
    }, []);

    useEffect(() => {
        let list = careers;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (c) =>
                    c.title.toLowerCase().includes(q) ||
                    c.location.toLowerCase().includes(q) ||
                    (c.department || '').toLowerCase().includes(q)
            );
        }
        if (statusFilter === 'active') list = list.filter((c) => c.isActive);
        if (statusFilter === 'inactive') list = list.filter((c) => !c.isActive);
        if (typeFilter !== 'all') list = list.filter((c) => c.type === typeFilter);
        setFiltered(list);
    }, [careers, searchQuery, statusFilter, typeFilter]);

    const resetForm = () => {
        setFormTitle('');
        setFormLocation('');
        setFormType('CDI');
        setFormDescription('');
        setFormRequirements('');
        setFormDepartment('');
        setFormContactEmail('rh@foxpetroleum.ma');
        setFormActive(true);
    };

    const openCreate = () => {
        setEditing(null);
        resetForm();
        setShowDialog(true);
    };

    const openEdit = (c: Career) => {
        setEditing(c);
        setFormTitle(c.title);
        setFormLocation(c.location);
        setFormType(c.type);
        setFormDescription(c.description);
        setFormRequirements(c.requirements || '');
        setFormDepartment(c.department || '');
        setFormContactEmail(c.contactEmail || 'rh@foxpetroleum.ma');
        setFormActive(c.isActive);
        setShowDialog(true);
    };

    const openView = (c: Career) => {
        setViewing(c);
        setShowViewDialog(true);
    };

    const handleSave = async () => {
        if (!formTitle.trim() || !formLocation.trim() || !formDescription.trim()) {
            toast.error(t('careers.toast.requiredFields'));
            return;
        }
        setIsSaving(true);
        const payload = {
            title: formTitle.trim(),
            location: formLocation.trim(),
            type: formType,
            description: formDescription.trim(),
            requirements: formRequirements.trim() || undefined,
            department: formDepartment.trim() || undefined,
            contact_email: formContactEmail.trim() || 'rh@foxpetroleum.ma',
            is_active: formActive,
        };
        try {
            if (editing) {
                const updated = await careersService.updateCareer(editing.id, payload);
                setCareers((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
                toast.success(t('careers.toast.updated'));
            } else {
                const created = await careersService.createCareer(payload);
                setCareers((prev) => [created, ...prev]);
                toast.success(t('careers.toast.created'));
            }
            setShowDialog(false);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
            const errors = axiosErr.response?.data?.errors;
            if (errors) {
                const first = Object.values(errors).flat()[0] as string;
                toast.error(first);
            } else {
                toast.error(t('careers.toast.saveError'));
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (c: Career) => {
        if (!confirm(`Supprimer l'offre "${c.title}" ?`)) return;
        try {
            await careersService.deleteCareer(c.id);
            setCareers((prev) => prev.filter((x) => x.id !== c.id));
            toast.success(t('careers.toast.deleted'));
        } catch {
            toast.error(t('careers.toast.deleteError'));
        }
    };

    const toggleActive = async (c: Career) => {
        try {
            const updated = await careersService.updateCareer(c.id, { is_active: !c.isActive });
            setCareers((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
            toast.success(c.isActive ? t('careers.toast.deactivated') : t('careers.toast.activated'));
        } catch {
            toast.error(t('careers.toast.updateError'));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const activeCount = careers.filter((c) => c.isActive).length;
    const inactiveCount = careers.length - activeCount;

    const typeBadgeColor = (type: string) => {
        switch (type) {
            case 'CDI': return 'bg-green-100 text-green-800 border-green-300';
            case 'CDD': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'Stage': return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'Freelance': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'Intérim': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default: return 'bg-slate-100 text-slate-800 border-slate-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{t('careers.title')}</h2>
                    <p className="text-slate-600 mt-1">{t('careers.subtitle')}</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('careers.newOffer')}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{careers.length}</p>
                            <p className="text-sm text-slate-500">{t('careers.totalOffers')}</p>
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
                            <p className="text-sm text-slate-500">{t('careers.activeOffers')}</p>
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
                            <p className="text-sm text-slate-500">{t('careers.inactiveOffers')}</p>
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
                                placeholder={t('careers.searchPlaceholder')}
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
                                <SelectItem value="all">{t('careers.allStatuses')}</SelectItem>
                                <SelectItem value="active">{t('careers.filterActive')}</SelectItem>
                                <SelectItem value="inactive">{t('careers.filterInactive')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('careers.allTypes')}</SelectItem>
                                {CONTRACT_TYPES.map((ct) => (
                                    <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Careers Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('careers.tableTitle', { count: filtered.length })}</CardTitle>
                </CardHeader>
                <CardContent>
                    {filtered.length === 0 ? (
                        <div className="text-center py-12">
                            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">{t('careers.noOffersFound')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-3 font-medium text-slate-500">{t('careers.table.title')}</th>
                                        <th className="pb-3 font-medium text-slate-500">{t('careers.table.location')}</th>
                                        <th className="pb-3 font-medium text-slate-500">{t('careers.table.type')}</th>
                                        <th className="pb-3 font-medium text-slate-500">{t('careers.table.department')}</th>
                                        <th className="pb-3 font-medium text-slate-500">{t('careers.table.status')}</th>
                                        <th className="pb-3 font-medium text-slate-500">{t('careers.table.date')}</th>
                                        <th className="pb-3 font-medium text-slate-500 text-right">{t('careers.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((c) => (
                                        <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="py-3 font-medium text-slate-900">{c.title}</td>
                                            <td className="py-3 text-slate-700">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-slate-400" />
                                                    {c.location}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <Badge variant="outline" className={typeBadgeColor(c.type)}>
                                                    {c.type}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-slate-700">{c.department || '—'}</td>
                                            <td className="py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        c.isActive
                                                            ? 'bg-green-100 text-green-800 border-green-300 cursor-pointer'
                                                            : 'bg-red-100 text-red-800 border-red-300 cursor-pointer'
                                                    }
                                                    onClick={() => toggleActive(c)}
                                                >
                                                    {c.isActive ? t('careers.statusActive') : t('careers.statusInactive')}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-slate-500 text-xs">
                                                {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openView(c)}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            {t('careers.action.view')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openEdit(c)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            {t('careers.action.edit')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => toggleActive(c)}>
                                                            {c.isActive ? (
                                                                <><XCircle className="w-4 h-4 mr-2" />{t('careers.action.deactivate')}</>
                                                            ) : (
                                                                <><CheckCircle className="w-4 h-4 mr-2" />{t('careers.action.activate')}</>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(c)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            {t('careers.action.delete')}
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
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? t('careers.dialog.editTitle') : t('careers.dialog.createTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('careers.form.jobTitle')}</Label>
                            <Input
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="Ex: Chauffeur Poids Lourd"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('careers.form.location')}</Label>
                                <Input
                                    value={formLocation}
                                    onChange={(e) => setFormLocation(e.target.value)}
                                    placeholder="Ex: Tanger"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('careers.form.contractType')}</Label>
                                <Select value={formType} onValueChange={setFormType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CONTRACT_TYPES.map((ct) => (
                                            <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('careers.form.department')}</Label>
                            <Input
                                value={formDepartment}
                                onChange={(e) => setFormDepartment(e.target.value)}
                                placeholder={t('careers.form.deptPlaceholder')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('careers.form.description')}</Label>
                            <Textarea
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder={t('careers.form.descPlaceholder')}
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('careers.form.requirements')}</Label>
                            <Textarea
                                value={formRequirements}
                                onChange={(e) => setFormRequirements(e.target.value)}
                                placeholder={t('careers.form.reqPlaceholder')}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('careers.form.contactEmail')}</Label>
                            <Input
                                type="email"
                                value={formContactEmail}
                                onChange={(e) => setFormContactEmail(e.target.value)}
                                placeholder="rh@foxpetroleum.ma"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Label>{t('careers.form.activeLabel')}</Label>
                            <button
                                type="button"
                                onClick={() => setFormActive(!formActive)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formActive ? 'bg-green-500' : 'bg-slate-300'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formActive ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                                {t('careers.form.cancel')}
                            </Button>
                            <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? `${t('common.save')}...` : t('common.save')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{viewing?.title}</DialogTitle>
                    </DialogHeader>
                    {viewing && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className={typeBadgeColor(viewing.type)}>
                                    {viewing.type}
                                </Badge>
                                <Badge variant="outline" className={viewing.isActive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}>
                                    {viewing.isActive ? t('careers.statusActive') : t('careers.statusInactive')}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <MapPin className="w-4 h-4" />
                                {viewing.location}
                                {viewing.department && <span className="ml-2">• {viewing.department}</span>}
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-1">{t('careers.viewDialog.description')}</h4>
                                <p className="text-slate-600 whitespace-pre-line">{viewing.description}</p>
                            </div>
                            {viewing.requirements && (
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-1">{t('careers.viewDialog.requirements')}</h4>
                                    <p className="text-slate-600 whitespace-pre-line">{viewing.requirements}</p>
                                </div>
                            )}
                            <div className="text-sm text-slate-500">
                                <strong>{t('careers.viewDialog.contact')}</strong> {viewing.contactEmail}
                            </div>
                            <div className="text-xs text-slate-400">
                                {t('careers.viewDialog.createdAt')} {new Date(viewing.createdAt).toLocaleDateString('fr-FR')}
                                {' • '}
                                {t('careers.viewDialog.updatedAt')} {new Date(viewing.updatedAt).toLocaleDateString('fr-FR')}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CareersAdminPage;
