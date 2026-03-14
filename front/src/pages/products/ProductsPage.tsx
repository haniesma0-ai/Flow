import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Filter, MoreHorizontal, Edit, Trash2,
  AlertTriangle, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
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
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types';
import { productsService } from '@/services/products';
import { toast } from 'sonner';

const ProductsPage = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formUnit, setFormUnit] = useState('L');
  const [formPrice, setFormPrice] = useState('');
  const [formTva, setFormTva] = useState('20');
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('');
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productsService.getProducts();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        toast.error(t('products.toast.loadError'));
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    if (showLowStock) {
      filtered = filtered.filter((product) => product.stock <= product.minStock);
    }

    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, showLowStock, products]);

  const handleDeleteProduct = async (productId: number) => {
    if (confirm(t('products.toast.deleteConfirm'))) {
      try {
        await productsService.deleteProduct(productId);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        toast.success(t('products.toast.deleted'));
      } catch (error) {
        toast.error(t('products.toast.deleteError'));
        console.error('Error deleting product:', error);
      }
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormCode('');
    setFormName('');
    setFormDescription('');
    setFormCategory('');
    setFormUnit('L');
    setFormPrice('');
    setFormTva('20');
    setFormStock('0');
    setFormMinStock('0');
    setFormActive(true);
    setShowDialog(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setFormCode(product.code);
    setFormName(product.name);
    setFormDescription(product.description || '');
    setFormCategory(product.category || '');
    setFormUnit(product.unit);
    setFormPrice(product.price.toString());
    setFormTva(product.tva.toString());
    setFormStock(product.stock.toString());
    setFormMinStock(product.minStock.toString());
    setFormActive(product.isActive);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formCode.trim() || !formName.trim() || !formPrice || !formUnit.trim()) {
      toast.error(t('products.toast.requiredFields'));
      return;
    }
    setIsSaving(true);
    const payload: Record<string, unknown> = {
      code: formCode.trim(),
      name: formName.trim(),
      description: formDescription.trim() || null,
      category: formCategory.trim() || 'general',
      unit: formUnit.trim(),
      price: Number(formPrice),
      tva_rate: Number(formTva),
      stock: Number(formStock) || 0,
      min_stock: Number(formMinStock) || 0,
      is_active: formActive,
    };
    try {
      if (editing) {
        const updated = await productsService.updateProduct(editing.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? updated : p)));
        toast.success(t('products.toast.updated'));
      } else {
        const created = await productsService.createProduct(payload);
        setProducts((prev) => [...prev, created]);
        toast.success(t('products.toast.created'));
      }
      setShowDialog(false);
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { code?: string[] } } })?.response?.data;
      if (errData?.code) {
        toast.error(errData.code[0]);
      } else {
        toast.error(t('products.toast.saveError'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const getStockStatus = (product: Product) => {
    if (product.stock <= 0) {
      return { label: t('products.stock.outOfStock'), variant: 'destructive' as const, className: 'bg-red-100 text-red-800' };
    }
    if (product.stock <= product.minStock) {
      return { label: t('products.stock.critical'), variant: 'outline' as const, className: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    if (product.stock <= product.minStock * 1.5) {
      return { label: t('products.stock.low'), variant: 'outline' as const, className: 'bg-yellow-50 text-yellow-700' };
    }
    return { label: t('products.stock.ok'), variant: 'secondary' as const, className: 'bg-green-100 text-green-800' };
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
          <h2 className="text-2xl font-bold text-slate-900">{t('products.title')}</h2>
          <p className="text-slate-600 mt-1">
            {t('products.subtitle')}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {t('products.newProduct')}
        </Button>
      </div>

      {/* Alerts */}
      {products.some((p) => p.stock <= p.minStock) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-900">
              {t('products.lowStockAlert', { count: products.filter((p) => p.stock <= p.minStock).length })}
            </p>
            <p className="text-sm text-amber-700">
              {t('products.lowStockDesc')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-amber-700"
            onClick={() => setShowLowStock(!showLowStock)}
          >
            {showLowStock ? t('products.showAll') : t('products.showProducts')}
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t('products.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('products.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('products.allCategories')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showLowStock ? 'default' : 'outline'}
              onClick={() => setShowLowStock(!showLowStock)}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {t('products.lowStockFilter')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">{t('products.noProductsFound')}</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            return (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(product)}>
                          <Edit className="w-4 h-4 mr-2" />
                          {t('products.action.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('products.action.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-1">{product.code}</p>
                    <h3 className="font-semibold text-slate-900 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-500">{product.category}</p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        {Number(product.price).toFixed(2)} MAD
                      </p>
                      <p className="text-xs text-slate-500">TVA: {product.tva}%</p>
                    </div>
                    <Badge variant={stockStatus.variant} className={stockStatus.className}>{stockStatus.label}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{t('products.stock.label')}</span>
                      <span className={`font-medium ${product.stock <= product.minStock ? 'text-red-600' : 'text-slate-900'
                        }`}>
                        {product.stock} {product.unit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${product.stock <= product.minStock
                          ? 'bg-red-500'
                          : product.stock <= product.minStock * 1.5
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                          }`}
                        style={{
                          width: `${Math.min(
                            (product.stock / (product.minStock * 2)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {t('products.stock.min')}: {product.minStock} {product.unit}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('products.dialog.editTitle') : t('products.dialog.createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('products.form.code')} *</Label>
                <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="PRD-001" />
              </div>
              <div className="space-y-2">
                <Label>{t('products.form.category')}</Label>
                <Input value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="Carburant" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('products.form.name')} *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Gasoil 50" />
            </div>
            <div className="space-y-2">
              <Label>{t('products.form.description')}</Label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('products.form.descPlaceholder')}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px]"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('products.form.price')} *</Label>
                <Input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="12.50" />
              </div>
              <div className="space-y-2">
                <Label>{t('products.form.tva')}</Label>
                <Input type="number" value={formTva} onChange={(e) => setFormTva(e.target.value)} placeholder="20" />
              </div>
              <div className="space-y-2">
                <Label>{t('products.form.unit')} *</Label>
                <Input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="L" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('products.form.stock')}</Label>
                <Input type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>{t('products.form.minStock')}</Label>
                <Input type="number" value={formMinStock} onChange={(e) => setFormMinStock(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label>{t('products.form.active')}</Label>
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
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>{t('products.form.cancel')}</Button>
              <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? t('common.saving') : editing ? t('products.action.edit') : t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
