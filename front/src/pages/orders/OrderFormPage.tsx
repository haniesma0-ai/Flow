import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { Customer, Product } from '@/types';
import { ordersService } from '@/services/orders';
import { customersService } from '@/services/customers';
import { productsService } from '@/services/products';
import { toast } from 'sonner';

interface OrderItemForm {
    productId: number;
    quantity: number;
    price: number;
    tvaRate: number;
}

const OrderFormPage = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [customerId, setCustomerId] = useState<number>(0);
    const [items, setItems] = useState<OrderItemForm[]>([{ productId: 0, quantity: 1, price: 0, tvaRate: 20 }]);
    const [notes, setNotes] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersList, productsList] = await Promise.all([
                    customersService.getCustomers(),
                    productsService.getProducts(),
                ]);
                setCustomers(Array.isArray(customersList) ? customersList : (customersList as { data?: Customer[] })?.data || []);
                setProducts(Array.isArray(productsList) ? productsList : (productsList as { data?: Product[] })?.data || []);

                // Pre-select customer from query param
                const preselectedCustomer = searchParams.get('customer');
                if (preselectedCustomer) {
                    setCustomerId(Number(preselectedCustomer));
                }

                // Load existing order for edit
                if (isEdit && id) {
                    const order = await ordersService.getOrder(Number(id));
                    setCustomerId(order.customerId);
                    setNotes(order.notes || '');
                    setDeliveryDate(order.deliveryDate || '');
                    if (order.items?.length) {
                        setItems(order.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                            tvaRate: item.tva,
                        })));
                    }
                }
            } catch (err) {
                console.error('Failed to load form data:', err);
                toast.error(t('orders.form.dataError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, isEdit, searchParams]);

    const addItem = () => {
        setItems([...items, { productId: 0, quantity: 1, price: 0, tvaRate: 20 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof OrderItemForm, value: number) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-fill price and TVA from selected product
        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if (product) {
                updated[index].price = product.price;
                updated[index].tvaRate = product.tva;
            }
        }

        setItems(updated);
    };

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalTva = items.reduce((sum, item) => sum + (item.price * item.quantity * item.tvaRate) / 100, 0);
    const total = subtotal + totalTva;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerId) {
            toast.error(t('orders.form.selectCustomer'));
            return;
        }

        const validItems = items.filter(item => item.productId > 0 && item.quantity > 0);
        if (validItems.length === 0) {
            toast.error(t('orders.form.addProductError'));
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                customer_id: customerId,
                items: validItems.map(item => ({
                    product_id: item.productId,
                    quantity: item.quantity,
                })),
                notes: notes || undefined,
                delivery_date: deliveryDate || undefined,
            };

            if (isEdit && id) {
                await ordersService.updateOrder(Number(id), payload as Record<string, unknown>);
                toast.success(t('orders.toast.statusUpdated'));
            } else {
                await ordersService.createOrder(payload as Record<string, unknown>);
                toast.success(t('orders.toast.created'));
            }
            navigate('/dashboard/orders');
        } catch (err: unknown) {
            console.error('Failed to save order:', err);
            const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || t('orders.toast.createError');
            toast.error(message);
        } finally {
            setIsSaving(false);
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
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/orders')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('common.back')}
                </Button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {isEdit ? t('orders.form.editOrder') : t('orders.newOrder')}
                    </h2>
                    <p className="text-slate-600 mt-1">
                        {isEdit ? t('orders.form.editOrderSubtitle') : t('orders.form.newOrderSubtitle')}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer & Delivery */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('orders.form.generalInfo')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer">{t('orders.form.customer')} *</Label>
                                <select
                                    id="customer"
                                    value={customerId}
                                    onChange={(e) => setCustomerId(Number(e.target.value))}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value={0}>{t('orders.form.selectCustomer')}</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name} — {c.city}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deliveryDate">{t('orders.form.deliveryDate')}</Label>
                                <Input
                                    id="deliveryDate"
                                    type="date"
                                    value={deliveryDate}
                                    onChange={(e) => setDeliveryDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">{t('orders.form.notes')}</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={t('orders.form.notesPlaceholder')}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{t('orders.form.products')}</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('orders.form.add')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Table Header */}
                            <div className="hidden sm:grid sm:grid-cols-12 gap-4 text-sm font-medium text-slate-600 px-2">
                                <div className="col-span-5">{t('orders.form.product')}</div>
                                <div className="col-span-2">{t('orders.form.quantity')}</div>
                                <div className="col-span-2">{t('orders.form.unitPrice')}</div>
                                <div className="col-span-2">{t('orders.form.totalHT')}</div>
                                <div className="col-span-1"></div>
                            </div>
                            <Separator />

                            {items.map((item, index) => {
                                const lineTotal = item.price * item.quantity;
                                return (
                                    <div key={index} className="grid sm:grid-cols-12 gap-4 items-center">
                                        <div className="sm:col-span-5">
                                            <select
                                                value={item.productId}
                                                onChange={(e) => updateItem(index, 'productId', Number(e.target.value))}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                <option value={0}>{t('orders.form.selectProduct')}</option>
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.code} — {p.name} ({p.stock} {p.unit} dispo)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <Input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={item.price}
                                                readOnly
                                                className="bg-slate-50"
                                            />
                                        </div>
                                        <div className="sm:col-span-2 text-sm font-medium">
                                            {lineTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
                                        </div>
                                        <div className="sm:col-span-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeItem(index)}
                                                disabled={items.length === 1}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Totals & Submit */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-end space-y-2">
                            <div className="flex justify-between w-64">
                                <span className="text-slate-600">{t('orders.form.subtotalHT')} :</span>
                                <span className="font-medium">{subtotal.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}</span>
                            </div>
                            <div className="flex justify-between w-64">
                                <span className="text-slate-600">{t('orders.form.tva')} :</span>
                                <span className="font-medium">{totalTva.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}</span>
                            </div>
                            <Separator className="w-64" />
                            <div className="flex justify-between w-64">
                                <span className="text-lg font-bold">{t('orders.form.totalTTC')} :</span>
                                <span className="text-lg font-bold text-primary">{total.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/orders')}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? t('common.saving') : isEdit ? t('common.save') : t('orders.form.createOrder')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
};

export default OrderFormPage;
