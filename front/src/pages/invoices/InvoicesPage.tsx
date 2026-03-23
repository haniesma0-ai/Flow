import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Filter, MoreHorizontal, Eye, Download,
  CheckCircle2, AlertCircle, FileText, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Invoice, InvoiceStatus, Order } from '@/types';
import { invoicesService } from '@/services/invoices';
import { ordersService } from '@/services/orders';
import type { PaginationMeta } from '@/services/api';
import { toast } from 'sonner';
import { generateInvoicePDF, printInvoice, exportInvoicesCSV } from '@/utils/exportUtils';

const InvoicesPage = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [newInvoiceOrderId, setNewInvoiceOrderId] = useState('');
  const [newInvoiceDueDate, setNewInvoiceDueDate] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    let isActive = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { items, pagination: pageMeta } = await invoicesService.getInvoicesPage({
          page: currentPage,
          per_page: 20,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined,
        });

        if (!isActive) {
          return;
        }

        setInvoices(items);
        setPagination(pageMeta);
      } catch (err) {
        if (!isActive) {
          return;
        }
        console.error('Failed to load invoices:', err);
        toast.error(t('invoices.toast.loadError'));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [currentPage, reloadTick, searchQuery, statusFilter, t]);

  const resetCreateInvoiceForm = () => {
    setNewInvoiceOrderId('');
    setNewInvoiceDueDate('');
  };

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const data = await ordersService.getOrders();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error('Impossible de charger les commandes.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const openCreateInvoiceDialog = async () => {
    setShowCreateInvoice(true);
    resetCreateInvoiceForm();
    await fetchOrders();
  };

  const openInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetails(true);
  };

  const handleCreateInvoice = async () => {
    if (!newInvoiceOrderId || !newInvoiceDueDate) {
      toast.error('Sélectionne une commande et une date d\'échéance.');
      return;
    }

    setIsCreatingInvoice(true);
    try {
      await invoicesService.createInvoice({
        orderId: Number(newInvoiceOrderId),
        dueDate: newInvoiceDueDate,
      } as Partial<Invoice>);

      setShowCreateInvoice(false);
      resetCreateInvoiceForm();
      setCurrentPage(1);
      setReloadTick((value) => value + 1);
      toast.success('Facture créée avec succès.');
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.message ||
        'Erreur lors de la création de la facture.';
      toast.error(errorMessage);
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleStatusChange = async (invoiceId: number, newStatus: string) => {
    try {
      await invoicesService.updateInvoiceStatus(invoiceId, newStatus as InvoiceStatus);
      setInvoices((prev) =>
        prev.map((i) => (i.id === invoiceId ? { ...i, status: newStatus as InvoiceStatus } : i))
      );

      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice((prev) => (prev ? { ...prev, status: newStatus as InvoiceStatus } : prev));
      }

      toast.success(t('invoices.toast.statusUpdated'));
    } catch {
      toast.error(t('invoices.toast.statusError', 'Erreur lors du changement de statut'));
    }
  };

  const buildInvoicePDFData = (invoice: Invoice) => ({
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.createdAt,
    dueDate: invoice.dueDate,
    status: invoice.status,
    customer: {
      name: invoice.customer.name,
      address: invoice.customer.address,
      city: invoice.customer.city,
      postalCode: invoice.customer.postalCode,
      phone: invoice.customer.phone,
      email: invoice.customer.email,
      ice: invoice.customer.ice,
      rc: invoice.customer.rc,
    },
    items: (invoice.order?.items || []).map((item) => ({
      name: item.product?.name || 'Produit',
      code: item.product?.code,
      quantity: item.quantity,
      price: item.price,
      tva: item.tva,
      total: item.total,
    })),
    subtotal: invoice.order?.subtotal || invoice.amount,
    totalTva: invoice.order?.totalTva || 0,
    total: Number(invoice.amount),
    paidAmount: Number(invoice.paidAmount),
    remainingAmount: Number(invoice.remainingAmount),
  });

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      await generateInvoicePDF(buildInvoicePDFData(invoice));
      toast.success(t('invoices.toast.pdfGenerated') || 'PDF généré');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    try {
      printInvoice(buildInvoicePDFData(invoice));
    } catch (err) {
      console.error('Print failed:', err);
      toast.error('Erreur lors de l\'impression');
    }
  };

  const handleExportCSV = () => {
    try {
      exportInvoicesCSV(
        invoices.map((i) => ({
          invoiceNumber: i.invoiceNumber,
          customerName: i.customer.name,
          date: i.createdAt,
          amount: Number(i.amount),
          paidAmount: Number(i.paidAmount),
          remainingAmount: Number(i.remainingAmount),
          status: i.status,
        }))
      );
      toast.success(t('reports.toast.exported') || 'CSV exporté');
    } catch (err) {
      console.error('CSV export failed:', err);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: string }> = {
      pending: { label: t('status.pending'), variant: 'secondary' },
      paid: { label: t('status.paid'), variant: 'success' },
      overdue: { label: t('status.overdue'), variant: 'destructive' },
      cancelled: { label: t('status.cancelled'), variant: 'outline' },
    };
    const c = config[status] || { label: status, variant: 'secondary' };
    return <Badge variant={c.variant as "default" | "secondary" | "destructive" | "outline"}>{c.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalOutstanding = invoices
    .filter((i) => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.remainingAmount, 0);

  const ordersAlreadyInvoiced = new Set(invoices.map((invoice) => invoice.orderId));
  const availableOrders = orders.filter(
    (order) => !ordersAlreadyInvoiced.has(order.id) && order.status !== 'cancelled'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('invoices.title')}</h2>
          <p className="text-slate-600 mt-1">
            {t('invoices.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            {t('common.export')} CSV
          </Button>
          <Button onClick={openCreateInvoiceDialog}>
            <Plus className="w-4 h-4 mr-2" />
            {t('invoices.newInvoice')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{invoices.length}</p>
                <p className="text-xs text-slate-500">{t('invoices.totalInvoices')}</p>
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
                <p className="text-2xl font-bold text-slate-900">
                  {invoices.filter((i) => i.status === 'paid').length}
                </p>
                <p className="text-xs text-slate-500">{t('invoices.paidInvoices')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {totalOutstanding.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'MAD',
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-slate-500">{t('invoices.outstanding')}</p>
              </div>
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
                placeholder={t('invoices.searchPlaceholder')}
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
                <SelectItem value="all">{t('invoices.allStatuses')}</SelectItem>
                <SelectItem value="pending">{t('status.pending')}</SelectItem>
                <SelectItem value="paid">{t('status.paid')}</SelectItem>
                <SelectItem value="overdue">{t('status.overdue')}</SelectItem>
                <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('invoices.table.invoiceNumber')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('invoices.table.customer')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('invoices.table.date')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    {t('invoices.table.amount')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    {t('invoices.table.remaining')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t('invoices.table.status')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    {t('invoices.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      {t('invoices.noInvoicesFound')}
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {invoice.customer.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {Number(invoice.amount).toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'MAD',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-medium ${invoice.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'
                            }`}
                        >
                          {Number(invoice.remainingAmount).toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'MAD',
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openInvoiceDetails(invoice)}>
                              <Eye className="w-4 h-4 mr-2" />
                              {t('invoices.action.view')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                              <Download className="w-4 h-4 mr-2" />
                              {t('invoices.action.downloadPdf')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintInvoice(invoice)}>
                              <Printer className="w-4 h-4 mr-2" />
                              {t('common.print')}
                            </DropdownMenuItem>
                            {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(invoice.id, 'paid')}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {t('invoices.action.markPaid')}
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
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-600">
                Page {pagination.current_page} / {pagination.last_page} ({pagination.total} factures)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.current_page <= 1 || isLoading}
                  onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.has_more || isLoading}
                  onClick={() => setCurrentPage((value) => value + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showInvoiceDetails} onOpenChange={setShowInvoiceDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice?.invoiceNumber || 'Facture'}
            </DialogTitle>
            <DialogDescription>
              Détails de la facture sélectionnée.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Client</p>
                  <p className="font-medium text-slate-900">{selectedInvoice.customer?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Statut</p>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div>
                  <p className="text-slate-500">Date</p>
                  <p className="font-medium text-slate-900">
                    {new Date(selectedInvoice.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Échéance</p>
                  <p className="font-medium text-slate-900">
                    {selectedInvoice.dueDate
                      ? new Date(selectedInvoice.dueDate).toLocaleDateString('fr-FR')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Montant total</span>
                  <span className="font-semibold text-slate-900">
                    {Number(selectedInvoice.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Montant payé</span>
                  <span className="font-medium text-green-700">
                    {Number(selectedInvoice.paidAmount).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Reste à payer</span>
                  <span className="font-medium text-red-700">
                    {Number(selectedInvoice.remainingAmount).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedInvoice && (
              <Button variant="outline" onClick={() => handleDownloadPDF(selectedInvoice)}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            )}
            {selectedInvoice && (
              <Button variant="outline" onClick={() => handlePrintInvoice(selectedInvoice)}>
                <Printer className="w-4 h-4 mr-2" />
                {t('common.print')}
              </Button>
            )}
            {selectedInvoice && (selectedInvoice.status === 'pending' || selectedInvoice.status === 'overdue') && (
              <Button onClick={() => handleStatusChange(selectedInvoice.id, 'paid')}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {t('invoices.action.markPaid')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCreateInvoice}
        onOpenChange={(open) => {
          setShowCreateInvoice(open);
          if (!open) {
            resetCreateInvoiceForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('invoices.newInvoice')}</DialogTitle>
            <DialogDescription>
              Crée une facture à partir d'une commande sans facture.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Commande</Label>
              <Select value={newInvoiceOrderId} onValueChange={setNewInvoiceOrderId}>
                <SelectTrigger id="orderId">
                  <SelectValue
                    placeholder={isLoadingOrders ? 'Chargement...' : 'Sélectionner une commande'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableOrders.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      Aucune commande disponible
                    </SelectItem>
                  ) : (
                    availableOrders.map((order) => (
                      <SelectItem key={order.id} value={String(order.id)}>
                        {order.orderNumber} - {order.customer?.name || 'Client'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Date d'échéance</Label>
              <Input
                id="dueDate"
                type="date"
                value={newInvoiceDueDate}
                onChange={(e) => setNewInvoiceDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateInvoice(false);
                resetCreateInvoiceForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={isCreatingInvoice || isLoadingOrders || availableOrders.length === 0}
            >
              {isCreatingInvoice ? 'Création...' : 'Créer la facture'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;
