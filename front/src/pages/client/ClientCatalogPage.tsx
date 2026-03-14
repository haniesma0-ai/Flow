import { useState, useEffect } from 'react';
import { Search, Package, ShoppingCart, Plus, Minus, Fuel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Product } from '@/types';
import api from '@/services/api';
import { toast } from 'sonner';

interface CartItem {
    product: Product;
    quantity: number;
}

const ClientCatalogPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    // Cart state
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showOrderDialog, setShowOrderDialog] = useState(false);
    const [orderNotes, setOrderNotes] = useState('');
    const [isOrdering, setIsOrdering] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('/client/products');
                const data = Array.isArray(response.data) ? response.data : [];
                setProducts(data.filter((p: Product) => p.isActive));
            } catch (error) {
                toast.error('Erreur lors du chargement des produits');
                console.error(error);
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
                (p) =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.code.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (categoryFilter !== 'all') {
            filtered = filtered.filter((p) => p.category === categoryFilter);
        }
        setFilteredProducts(filtered);
    }, [searchQuery, categoryFilter, products]);

    const categories = [...new Set(products.map((p) => p.category))];

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((c) => c.product.id === product.id);
            if (existing) {
                return prev.map((c) =>
                    c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        toast.success(`${product.name} ajouté au panier`);
    };

    const updateCartQty = (productId: number, delta: number) => {
        setCart((prev) =>
            prev
                .map((c) =>
                    c.product.id === productId
                        ? { ...c, quantity: Math.max(0, c.quantity + delta) }
                        : c
                )
                .filter((c) => c.quantity > 0)
        );
    };

    const removeFromCart = (productId: number) => {
        setCart((prev) => prev.filter((c) => c.product.id !== productId));
    };

    const cartTotal = cart.reduce((sum, c) => {
        const ht = c.product.price * c.quantity;
        const tva = ht * (c.product.tva / 100);
        return sum + ht + tva;
    }, 0);

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;
        setIsOrdering(true);
        try {
            await api.post('/client/orders', {
                items: cart.map((c) => ({
                    product_id: c.product.id,
                    quantity: c.quantity,
                })),
                notes: orderNotes || null,
            });
            toast.success('Commande passée avec succès !');
            setCart([]);
            setOrderNotes('');
            setShowOrderDialog(false);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur lors de la commande';
            toast.error(msg);
        } finally {
            setIsOrdering(false);
        }
    };

    const getCartQty = (productId: number) =>
        cart.find((c) => c.product.id === productId)?.quantity ?? 0;

    const getCategoryLabel = (cat: string) => {
        const map: Record<string, string> = {
            lubricants: 'Lubrifiants',
            fuels: 'Carburants',
            additives: 'Additifs',
            greases: 'Graisses',
        };
        return map[cat] || cat;
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
                    <h2 className="text-2xl font-bold text-slate-900">Catalogue Produits</h2>
                    <p className="text-slate-600 mt-1">Parcourez nos produits et passez commande</p>
                </div>
                {cart.length > 0 && (
                    <Button onClick={() => setShowOrderDialog(true)} className="gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Panier ({cart.length}) — {cartTotal.toLocaleString('fr-FR')} MAD
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Rechercher un produit..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes catégories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                                {getCategoryLabel(cat)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Aucun produit trouvé</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => {
                        const qty = getCartQty(product.id);
                        return (
                            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                {/* Product icon area */}
                                <div className="h-32 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                                    <Fuel className="w-12 h-12 text-amber-400" />
                                </div>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900 truncate">{product.name}</p>
                                            <p className="text-xs text-slate-500">{product.code}</p>
                                        </div>
                                        <Badge variant="outline" className="shrink-0 text-xs">
                                            {getCategoryLabel(product.category)}
                                        </Badge>
                                    </div>

                                    {product.description && (
                                        <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-bold text-primary">
                                                {Number(product.price).toLocaleString('fr-FR')} MAD
                                            </p>
                                            <p className="text-xs text-slate-500">/{product.unit} — TVA {product.tva}%</p>
                                        </div>
                                        {product.stock > 0 ? (
                                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                                En stock
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-red-100 text-red-700 border-red-200">
                                                Rupture
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Add to cart / qty controls */}
                                    {product.stock > 0 && (
                                        <div>
                                            {qty === 0 ? (
                                                <Button
                                                    className="w-full gap-2"
                                                    variant="outline"
                                                    onClick={() => addToCart(product)}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Ajouter au panier
                                                </Button>
                                            ) : (
                                                <div className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8"
                                                        onClick={() => updateCartQty(product.id, -1)}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="font-semibold text-slate-900">
                                                        {qty} {product.unit}
                                                    </span>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8"
                                                        onClick={() => updateCartQty(product.id, 1)}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Order Dialog */}
            <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Confirmer la commande</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Cart items */}
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {cart.map((c) => {
                                const ht = c.product.price * c.quantity;
                                const tva = ht * (c.product.tva / 100);
                                return (
                                    <div
                                        key={c.product.id}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                    >
                                        <div className="min-w-0 mr-4">
                                            <p className="font-medium text-sm text-slate-900 truncate">
                                                {c.product.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {c.quantity} × {Number(c.product.price).toLocaleString('fr-FR')} MAD
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-semibold text-sm">
                                                {(ht + tva).toLocaleString('fr-FR')} MAD
                                            </p>
                                            <button
                                                className="text-xs text-red-500 hover:text-red-700"
                                                onClick={() => removeFromCart(c.product.id)}
                                            >
                                                Retirer
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <p className="font-semibold text-slate-900">Total TTC</p>
                            <p className="text-xl font-bold text-primary">
                                {cartTotal.toLocaleString('fr-FR')} MAD
                            </p>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label>Notes (optionnel)</Label>
                            <textarea
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px]"
                                placeholder="Instructions de livraison, remarques..."
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handlePlaceOrder} disabled={isOrdering}>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {isOrdering ? 'Envoi...' : 'Passer la commande'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientCatalogPage;
