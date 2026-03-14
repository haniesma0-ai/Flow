import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Filter, MoreHorizontal, Eye, Download,
  CheckCircle2, AlertCircle, FileText, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import type { Invoice, InvoiceStatus } from '@/types';
import { invoicesService } from '@/services/invoices';
import { toast } from 'sonner';
import { generateInvoicePDF, printInvoice, exportInvoicesCSV } from '@/utils/exportUtils';

const InvoicesPage = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await invoicesService.getInvoices();
        const list = Array.isArray(data) ? data : [];
        setInvoices(list);
        setFilteredInvoices(list);
      } catch (err) {
        console.error('Failed to load invoices:', err);
        toast.error(t('invoices.toast.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  useEffect(() => {
    let filtered = invoices;

    if (searchQuery) {
      filtered = filtered.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  }, [searchQuery, statusFilter, invoices]);

  const handleStatusChange = async (invoiceId: number, newStatus: string) => {
    try {
      await invoicesService.updateInvoiceStatus(invoiceId, newStatus as InvoiceStatus);
      setInvoices((prev) =>
        prev.map((i) => (i.id === invoiceId ? { ...i, status: newStatus as InvoiceStatus } : i))
      );
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
        filteredInvoices.map((i) => ({
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
          <Button>
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
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      {t('invoices.noInvoicesFound')}
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
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
                            <DropdownMenuItem>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesPage;
