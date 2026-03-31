<?php


namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Delivery;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = auth()->user();
        $user->load('role');
        $roleName = $user->role?->name;

        // Role-specific dashboard data
        switch ($roleName) {
            case 'chauffeur':
                return $this->chauffeurDashboard($user);
            case 'commercial':
                return $this->commercialDashboard($user);
            case 'client':
            case 'user':
                return $this->clientDashboard($user);
            case 'admin':
            case 'manager':
            default:
                return $this->adminDashboard();
        }
    }

    private function adminDashboard()
    {
        // Cache heavy aggregations for 5 minutes. Real-time counters are excluded
        // so they stay current on every request.
        $cached = Cache::remember('admin_dashboard_aggregations', 300, function () {
            return [
                'ordersByStatus'     => $this->getOrdersByStatus(),
                'deliveriesByStatus' => $this->getDeliveriesByStatus(),
                'revenueByMonth'     => $this->getRevenueByMonth(),
                'topProducts'        => $this->getTopProducts(),
                'yearlyRevenue'      => $this->getYearlyRevenue(),
            ];
        });

        $totalOrders        = Order::count();
        $totalRevenue       = $cached['yearlyRevenue'];
        $totalCustomers     = Customer::count();
        $totalProducts      = Product::count();
        $pendingDeliveries  = Delivery::whereNotIn('status', ['completed', 'cancelled'])->count();
        $lowStockProducts   = Product::whereRaw('stock <= min_stock')->count();
        $overdueInvoices    = Invoice::where('status', 'overdue')
            ->orWhere(function ($q) {
                $q->where('status', 'pending')
                  ->where('due_date', '<', now());
            })->count();
        $ordersByStatus     = $cached['ordersByStatus'];
        $deliveriesByStatus = $cached['deliveriesByStatus'];
        $revenueByMonth     = $cached['revenueByMonth'];
        $topProducts        = $cached['topProducts'];
        $recentOrders       = $this->getRecentOrders();

        return response()->json([
            'success' => true,
            'data' => [
                'totalOrders'        => $totalOrders,
                'totalRevenue'       => $totalRevenue,
                'totalCustomers'     => $totalCustomers,
                'totalProducts'      => $totalProducts,
                'pendingDeliveries'  => $pendingDeliveries,
                'lowStockProducts'   => $lowStockProducts,
                'overdueInvoices'    => $overdueInvoices,
                'ordersByStatus'     => $ordersByStatus,
                'deliveriesByStatus' => $deliveriesByStatus,
                'revenueByMonth'     => $revenueByMonth,
                'topProducts'        => $topProducts,
                'recentOrders'       => $recentOrders,
            ],
        ]);
    }

    private function getOrdersByStatus()
    {
        return Order::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');
    }

    private function getDeliveriesByStatus()
    {
        return Delivery::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');
    }

    private function getRevenueByMonth()
    {
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
    }

    private function getTopProducts()
    {
        return Product::withCount([
            'orderItems as total_sold' => function ($query) {
                $query->select(DB::raw('COALESCE(SUM(quantity), 0)'));
            }
        ])
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'product' => [
                    'id' => $p->id,
                    'code' => $p->code,
                    'name' => $p->name,
                    'category' => $p->category ?? '',
                    'price' => (float) $p->price,
                    'stock' => $p->stock,
                    'minStock' => $p->min_stock,
                    'unit' => $p->unit,
                ],
                'quantity' => (int) $p->total_sold,
            ]);
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

    private function getYearlyRevenue()
    {
        return (float) Order::whereYear('created_at', now()->year)
            ->where('status', '!=', 'cancelled')
            ->sum('total');
    }

    private function commercialDashboard($user)
    {
        $myOrders = Order::where('commercial_id', $user->id);

        $stats = [
            'total_orders' => (clone $myOrders)->count(),
            'total_customers' => Customer::count(),
            'total_products' => Product::count(),
            'pending_orders' => (clone $myOrders)->whereIn('status', ['draft', 'confirmed'])->count(),
            'monthly_revenue' => (float) (clone $myOrders)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->where('status', '!=', 'cancelled')
                ->sum('total'),
            'low_stock_products' => Product::whereRaw('stock <= min_stock')->count(),
        ];

        $recentOrders = Order::with(['customer'])
            ->where('commercial_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'recent_orders' => $recentOrders,
            ],
        ]);
    }

    private function chauffeurDashboard($user)
    {
        // Replace 5 separate COUNT queries with one GROUP BY query
        $statusCounts = Delivery::where('chauffeur_id', $user->id)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $todayCount = Delivery::where('chauffeur_id', $user->id)
            ->whereDate('planned_date', today())
            ->count();

        $stats = [
            'total_deliveries' => $statusCounts->sum(),
            'pending'          => (int) ($statusCounts['planned'] ?? 0),
            'in_progress'      => (int) ($statusCounts['in_progress'] ?? 0),
            'completed'        => (int) ($statusCounts['completed'] ?? 0),
            'today'            => $todayCount,
        ];

        $currentDelivery = Delivery::with(['order.customer', 'vehicle'])
            ->where('chauffeur_id', $user->id)
            ->where('status', 'in_progress')
            ->first();

        $pendingDeliveries = Delivery::with(['order.customer', 'vehicle'])
            ->where('chauffeur_id', $user->id)
            ->where('status', 'planned')
            ->orderBy('planned_date')
            ->limit(10)
            ->get();

        $recentDeliveries = Delivery::with(['order.customer', 'vehicle'])
            ->where('chauffeur_id', $user->id)
            ->where('status', 'completed')
            ->orderByDesc('actual_arrival')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'current_delivery' => $currentDelivery,
                'pending_deliveries' => $pendingDeliveries,
                'recent_deliveries' => $recentDeliveries,
            ],
        ]);
    }

    private function clientDashboard($user)
    {
        // Client can see their own orders (where they are the customer via email match)
        $customer = Customer::where('email', $user->email)->first();

        $stats = [
            'totalOrders' => 0,
            'pendingOrders' => 0,
            'completedOrders' => 0,
            'totalSpent' => 0.0,
        ];

        $recentOrders = collect();

        if ($customer) {
            $myOrders = Order::where('customer_id', $customer->id);
            $stats = [
                'totalOrders' => (clone $myOrders)->count(),
                'pendingOrders' => (clone $myOrders)->whereIn('status', ['draft', 'confirmed', 'preparation'])->count(),
                'completedOrders' => (clone $myOrders)->where('status', 'delivered')->count(),
                'totalSpent' => (float) (clone $myOrders)->where('status', '!=', 'cancelled')->sum('total'),
            ];

            $recentOrders = Order::with(['items.product'])
                ->where('customer_id', $customer->id)
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
                ->map(fn($o) => [
                    'id' => $o->id,
                    'orderNumber' => $o->order_number,
                    'status' => $o->status,
                    'total' => (float) $o->total,
                    'createdAt' => $o->created_at?->toISOString(),
                ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'recentOrders' => $recentOrders,
                'customerName' => $customer?->name ?? $user->name,
            ],
        ]);
    }

    public function sales(Request $request)
    {
        $period = $request->get('period', 'month');

        $query = Order::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as orders_count'),
            DB::raw('SUM(total) as total_amount')
        )
            ->where('status', '!=', 'cancelled');

        switch ($period) {
            case 'month':
                $query->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->groupBy(DB::raw('DATE(created_at)'));
                break;
            case 'quarter':
                $query = Order::select(
                    DB::raw('WEEK(created_at) as date'),
                    DB::raw('COUNT(*) as orders_count'),
                    DB::raw('SUM(total) as total_amount')
                )
                    ->where('status', '!=', 'cancelled')
                    ->whereRaw('QUARTER(created_at) = QUARTER(NOW())')
                    ->whereYear('created_at', now()->year)
                    ->groupBy(DB::raw('WEEK(created_at)'));
                break;
            case 'year':
                $query = Order::select(
                    DB::raw('MONTH(created_at) as date'),
                    DB::raw('COUNT(*) as orders_count'),
                    DB::raw('SUM(total) as total_amount')
                )
                    ->where('status', '!=', 'cancelled')
                    ->whereYear('created_at', now()->year)
                    ->groupBy(DB::raw('MONTH(created_at)'));
                break;
        }

        $sales = $query->orderBy('date')->get();

        return response()->json([
            'success' => true,
            'data' => $sales,
        ]);
    }

    public function products(Request $request)
    {
        $period = $request->get('period', 'month');

        $query = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->select(
                'products.name',
                'products.code',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.total) as total_amount')
            )
            ->where('orders.status', '!=', 'cancelled');

        switch ($period) {
            case 'month':
                $query->whereMonth('orders.created_at', now()->month)
                    ->whereYear('orders.created_at', now()->year);
                break;
            case 'quarter':
                $query->whereRaw('QUARTER(orders.created_at) = QUARTER(NOW())')
                    ->whereYear('orders.created_at', now()->year);
                break;
            case 'year':
                $query->whereYear('orders.created_at', now()->year);
                break;
        }

        $products = $query->groupBy('products.id', 'products.name', 'products.code')
            ->orderByDesc('total_amount')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }
}


