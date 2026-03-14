<?php
// app/Http/Controllers/Api/OrderController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['customer', 'commercial', 'items.product']);

        // Filtrage par statut
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filtrage par commercial
        if ($request->has('commercial_id')) {
            $query->where('commercial_id', $request->commercial_id);
        }

        // Recherche
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        $formatted = $orders->map(function ($order) {
            return [
                'id' => $order->id,
                'orderNumber' => $order->order_number,
                'customerId' => $order->customer_id,
                'customer' => $order->customer ? [
                    'id' => $order->customer->id,
                    'name' => $order->customer->name,
                    'email' => $order->customer->email,
                    'phone' => $order->customer->phone,
                    'city' => $order->customer->city,
                ] : null,
                'commercialId' => $order->commercial_id,
                'commercial' => $order->commercial ? [
                    'id' => $order->commercial->id,
                    'name' => $order->commercial->name,
                ] : null,
                'items' => $order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'productId' => $item->product_id,
                        'product' => $item->product ? [
                            'id' => $item->product->id,
                            'name' => $item->product->name,
                            'code' => $item->product->code,
                            'price' => (float) $item->product->price,
                            'unit' => $item->product->unit,
                        ] : null,
                        'quantity' => (int) $item->quantity,
                        'price' => (float) $item->price,
                        'tva' => (float) $item->tva_rate,
                        'total' => (float) $item->total,
                    ];
                }),
                'subtotal' => (float) $order->subtotal,
                'totalTva' => (float) $order->total_tva,
                'total' => (float) $order->total,
                'status' => $order->status,
                'notes' => $order->notes,
                'deliveryDate' => $order->delivery_date?->toISOString() ?? $order->delivery_date,
                'createdAt' => $order->created_at?->toISOString(),
                'updatedAt' => $order->updated_at?->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
            'delivery_date' => 'nullable|date|after_or_equal:today',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Générer le numéro de commande
            $orderNumber = 'ORD-' . date('Y') . '-' . str_pad(Order::count() + 1, 4, '0', STR_PAD_LEFT);

            // Calculer les totaux
            $subtotal = 0;
            $totalTva = 0;

            // Pre-fetch all products to avoid N+1 queries
            $productIds = collect($request->items)->pluck('product_id')->unique();
            $products = \App\Models\Product::whereIn('id', $productIds)->get()->keyBy('id');

            foreach ($request->items as $item) {
                $product = $products[$item['product_id']] ?? null;
                if (!$product) {
                    throw new \Exception('Product not found: ' . $item['product_id']);
                }
                $itemTotal = $product->price * $item['quantity'];
                $itemTva = $itemTotal * ($product->tva_rate / 100);

                $subtotal += $itemTotal;
                $totalTva += $itemTva;
            }

            $total = $subtotal + $totalTva;

            // Créer la commande
            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $request->customer_id,
                'commercial_id' => auth()->id(),
                'subtotal' => $subtotal,
                'total_tva' => $totalTva,
                'total' => $total,
                'status' => 'draft',
                'notes' => $request->notes,
                'delivery_date' => $request->delivery_date,
            ]);

            // Créer les items de commande
            foreach ($request->items as $item) {
                $product = $products[$item['product_id']];
                $itemTotal = $product->price * $item['quantity'];
                $itemTva = $itemTotal * ($product->tva_rate / 100);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'tva_rate' => $product->tva_rate,
                    'total' => $itemTotal + $itemTva,
                ]);
            }

            DB::commit();

            // Notify admin & manager about new order
            $order->load(['customer', 'commercial', 'items.product']);
            $customerName = $order->customer->name ?? 'Client';
            Notification::notifyRole(
                ['admin', 'manager'],
                'order',
                'Nouvelle commande',
                "Commande {$orderNumber} créée par " . auth()->user()->name . " pour {$customerName} — " . number_format($order->total, 2) . ' MAD',
                '/dashboard/orders/' . $order->id
            );
            // Notify the commercial who created it (if different from admin)
            if (auth()->user()->role?->name === 'commercial') {
                Notification::notifyUser(
                    auth()->id(),
                    'order',
                    'Commande créée',
                    "Votre commande {$orderNumber} pour {$customerName} a été enregistrée.",
                    '/dashboard/orders/' . $order->id
                );
            }

            return response()->json([
                'success' => true,
                'data' => $order,
                'message' => 'Order created successfully',
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to create order'], 500);
        }
    }

    public function show(Order $order)
    {
        $order->load(['customer', 'commercial', 'items.product', 'delivery', 'invoice']);

        $formatted = [
            'id' => $order->id,
            'orderNumber' => $order->order_number,
            'customerId' => $order->customer_id,
            'customer' => $order->customer ? [
                'id' => $order->customer->id,
                'code' => $order->customer->code,
                'name' => $order->customer->name,
                'email' => $order->customer->email,
                'phone' => $order->customer->phone,
                'address' => $order->customer->address,
                'city' => $order->customer->city,
            ] : null,
            'commercialId' => $order->commercial_id,
            'commercial' => $order->commercial ? [
                'id' => $order->commercial->id,
                'name' => $order->commercial->name,
            ] : null,
            'items' => $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'productId' => $item->product_id,
                    'product' => $item->product ? [
                        'id' => $item->product->id,
                        'name' => $item->product->name,
                        'code' => $item->product->code,
                        'price' => (float) $item->product->price,
                        'unit' => $item->product->unit,
                    ] : null,
                    'quantity' => (int) $item->quantity,
                    'price' => (float) $item->price,
                    'tva' => (float) $item->tva_rate,
                    'total' => (float) $item->total,
                ];
            }),
            'subtotal' => (float) $order->subtotal,
            'totalTva' => (float) $order->total_tva,
            'total' => (float) $order->total,
            'status' => $order->status,
            'notes' => $order->notes,
            'deliveryDate' => $order->delivery_date?->toISOString() ?? $order->delivery_date,
            'createdAt' => $order->created_at?->toISOString(),
            'updatedAt' => $order->updated_at?->toISOString(),
        ];

        return response()->json([
            'success' => true,
            'data' => $formatted,
        ]);
    }

    public function update(Request $request, Order $order)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'sometimes|exists:customers,id',
            'items' => 'sometimes|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
            'delivery_date' => 'nullable|date|after_or_equal:today',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Recalculer les totaux si les items sont modifiés
            if ($request->has('items')) {
                $subtotal = 0;
                $totalTva = 0;

                $productIds = collect($request->items)->pluck('product_id')->unique();
                $products = \App\Models\Product::whereIn('id', $productIds)->get()->keyBy('id');

                foreach ($request->items as $item) {
                    $product = $products[$item['product_id']] ?? null;
                    if (!$product) {
                        throw new \Exception('Product not found: ' . $item['product_id']);
                    }
                    $itemTotal = $product->price * $item['quantity'];
                    $itemTva = $itemTotal * ($product->tva_rate / 100);

                    $subtotal += $itemTotal;
                    $totalTva += $itemTva;
                }

                $total = $subtotal + $totalTva;

                $order->update([
                    'subtotal' => $subtotal,
                    'total_tva' => $totalTva,
                    'total' => $total,
                ]);

                // Supprimer les anciens items et en créer de nouveaux
                $order->items()->delete();

                foreach ($request->items as $item) {
                    $product = $products[$item['product_id']];
                    $itemTotal = $product->price * $item['quantity'];
                    $itemTva = $itemTotal * ($product->tva_rate / 100);

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'price' => $product->price,
                        'tva_rate' => $product->tva_rate,
                        'total' => $itemTotal + $itemTva,
                    ]);
                }
            }

            $order->update($request->only(['customer_id', 'notes', 'delivery_date']));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $order->load(['customer', 'commercial', 'items.product']),
                'message' => 'Order updated successfully',
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to update order'], 500);
        }
    }

    public function destroy(Order $order)
    {
        if ($order->status !== 'draft') {
            return response()->json(['error' => 'Cannot delete order that is not in draft status'], 422);
        }

        $order->delete();

        return response()->json([
            'success' => true,
            'message' => 'Order deleted successfully',
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:draft,confirmed,preparation,delivery,delivered,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $order->update(['status' => $request->status]);
        $order->load('customer');

        $statusLabels = [
            'confirmed' => 'confirmée',
            'preparation' => 'en préparation',
            'delivery' => 'en livraison',
            'delivered' => 'livrée',
            'cancelled' => 'annulée',
        ];
        $label = $statusLabels[$request->status] ?? $request->status;
        $customerName = $order->customer->name ?? '';

        // Notify admin/manager of status changes
        Notification::notifyRole(
            ['admin', 'manager'],
            'order',
            'Statut commande mis à jour',
            "Commande {$order->order_number} ({$customerName}) est maintenant {$label}.",
            '/dashboard/orders/' . $order->id
        );

        // Notify the assigned commercial
        if ($order->commercial_id && $order->commercial_id !== auth()->id()) {
            Notification::notifyUser(
                $order->commercial_id,
                'order',
                'Statut commande mis à jour',
                "Commande {$order->order_number} est maintenant {$label}.",
                '/dashboard/orders/' . $order->id
            );
        }

        // If delivery status, notify chauffeurs
        if ($request->status === 'delivery') {
            Notification::notifyRole(
                ['chauffeur'],
                'delivery',
                'Commande prête pour livraison',
                "Commande {$order->order_number} pour {$customerName} est prête à être livrée.",
                '/dashboard/deliveries'
            );
        }

        return response()->json([
            'success' => true,
            'data' => $order,
            'message' => 'Order status updated successfully',
        ]);
    }
}
