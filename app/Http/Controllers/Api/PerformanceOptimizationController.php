<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Delivery;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class PerformanceOptimizationController extends Controller
{
    // Cache keys and TTL
    const CACHE_TTL = 300; // 5 minutes
    const ORDERS_STATS_CACHE = 'dashboard.orders.stats';
    const DELIVERIES_STATS_CACHE = 'dashboard.deliveries.stats';
    const REVENUE_CACHE = 'dashboard.revenue';
    const TOP_PRODUCTS_CACHE = 'dashboard.top.products';

    /**
     * Get optimized dashboard data with caching
     */
    public function getOptimizedDashboard()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'totalOrders' => Order::count(),
                'totalRevenue' => $this->getCachedYearlyRevenue(),
                'totalCustomers' => Customer::count(),
                'totalProducts' => Product::count(),
                'pendingDeliveries' => Delivery::whereNotIn('status', ['completed', 'cancelled'])->count(),
                'lowStockProducts' => Product::whereRaw('stock <= min_stock')->count(),
                'overdueInvoices' => Invoice::where('status', 'overdue')
                    ->orWhere(function ($q) {
                        $q->where('status', 'pending')
                            ->where('due_date', '<', now());
                    })->count(),
                'ordersByStatus' => $this->getCachedOrdersByStatus(),
                'deliveriesByStatus' => $this->getCachedDeliveriesByStatus(),
                'revenueByMonth' => $this->getCachedRevenueByMonth(),
                'topProducts' => $this->getCachedTopProducts(),
                'recentOrders' => $this->getRecentOrders(),
            ],
        ]);
    }

    private function getCachedOrdersByStatus()
    {
        return Cache::remember(self::ORDERS_STATS_CACHE, self::CACHE_TTL, function () {
            return Order::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status');
        });
    }

    private function getCachedDeliveriesByStatus()
    {
        return Cache::remember(self::DELIVERIES_STATS_CACHE, self::CACHE_TTL, function () {
            return Delivery::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status');
        });
    }

    private function getCachedRevenueByMonth()
    {
        return Cache::remember(self::REVENUE_CACHE, self::CACHE_TTL, function () {
            return Order::select(
                DB::raw('MONTH(created_at) as month_num'),
                DB::raw('SUM(total) as amount')
            )
                ->whereYear('created_at', now()->year)
                ->where('status', '!=', 'cancelled')
                ->groupBy(DB::raw('MONTH(created_at)'))
                ->orderBy('month_num')
                ->get()
                ->map(function ($row) {
                    $months = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                    return [
                        'month' => $months[$row->month_num] ?? '',
                        'amount' => (float) $row->amount,
                    ];
                });
        });
    }

    private function getCachedTopProducts()
    {
        return Cache::remember(self::TOP_PRODUCTS_CACHE, self::CACHE_TTL, function () {
            return Product::select('products.*', DB::raw('COALESCE(SUM(order_items.quantity), 0) as total_sold'))
                ->leftJoin('order_items', 'products.id', '=', 'order_items.product_id')
                ->groupBy('products.id')
                ->orderByDesc('total_sold')
                ->limit(5)
                ->get()
                ->map(fn($p) => [
                    'product' => [
                        'id' => $p->id,
                        'code' => $p->code,
                        'name' => $p->name,
                        'price' => (float) $p->price,
                        'stock' => $p->stock,
                        'minStock' => $p->min_stock,
                        'unit' => $p->unit,
                    ],
                    'quantity' => (int) $p->total_sold,
                ]);
        });
    }

    private function getCachedYearlyRevenue()
    {
        return Cache::remember('dashboard.yearly.revenue', self::CACHE_TTL, function () {
            return (float) Order::whereYear('created_at', now()->year)
                ->where('status', '!=', 'cancelled')
                ->sum('total');
        });
    }

    private function getRecentOrders()
    {
        return Order::with(['customer', 'commercial.role'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'orderNumber' => $o->order_number,
                'status' => $o->status,
                'total' => (float) $o->total,
                'createdAt' => $o->created_at?->toISOString(),
                'customer' => $o->customer ? [
                    'id' => $o->customer->id,
                    'name' => $o->customer->name,
                ] : null,
            ]);
    }

    /**
     * Clear all dashboard caches
     */
    public function clearDashboardCache()
    {
        Cache::forget(self::ORDERS_STATS_CACHE);
        Cache::forget(self::DELIVERIES_STATS_CACHE);
        Cache::forget(self::REVENUE_CACHE);
        Cache::forget(self::TOP_PRODUCTS_CACHE);
        Cache::forget('dashboard.yearly.revenue');

        return response()->json([
            'success' => true,
            'message' => 'Dashboard cache cleared',
        ]);
    }
}
