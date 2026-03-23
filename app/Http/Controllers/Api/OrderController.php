<?php
// app/Http/Controllers/Api/OrderController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
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
        $perPage = (int) $request->get('per_page', 20);
        $perPage = min($perPage, 100); // Cap at 100

        $query = Order::select('id', 'order_number', 'customer_id', 'commercial_id', 'subtotal', 'total_tva', 'total', 'status', 'notes', 'delivery_date', 'use_customer_address', 'delivery_address', 'delivery_city', 'created_at', 'updated_at')
            ->with(['customer:id,name,email,phone,city', 'commercial:id,name']);

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

        $orders = $query->orderBy('created_at', 'desc')->paginate($perPage);

        $formatted = collect($orders->items())->map(function ($order) {
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
                'subtotal' => (float) $order->subtotal,
                'totalTva' => (float) $order->total_tva,
                'total' => (float) $order->total,
                'status' => $order->status,
                'notes' => $order->notes,
                'deliveryDate' => $order->delivery_date?->toISOString() ?? $order->delivery_date,
                'useCustomerAddress' => (bool) ($order->use_customer_address ?? true),
                'deliveryAddress' => $order->delivery_address,
                'deliveryCity' => $order->delivery_city,
                'createdAt' => $order->created_at?->toISOString(),
                'updatedAt' => $order->updated_at?->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted,
            'pagination' => [
                'total' => $orders->total(),
                'per_page' => $orders->perPage(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'has_more' => $orders->hasMorePages(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.productId' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
            'deliveryDate' => 'nullable|date|after_or_equal:today',
            'use_customer_address' => 'sometimes|boolean',
            'delivery_address' => 'required_if:use_customer_address,false|nullable|string|max:500',
            'delivery_city' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $customer = Customer::findOrFail($request->customer_id);
        $useCustomerAddress = $request->boolean('use_customer_address', true);
        $deliveryAddress = $useCustomerAddress
            ? trim((string) ($customer->address ?? ''))
            : trim((string) $request->input('delivery_address', ''));
        $deliveryCity = $useCustomerAddress
            ? trim((string) ($customer->city ?? ''))
            : trim((string) $request->input('delivery_city', ''));

        if (!$useCustomerAddress && $deliveryAddress === '') {
            return response()->json([
                'success' => false,
                'error' => 'Veuillez renseigner une adresse de livraison personnalisée.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Générer le numéro de commande unique
            $orderNumber = null;
            $counter = Order::count() + 1;
            do {
                $orderNumber = 'ORD-' . date('Y') . '-' . str_pad($counter, 4, '0', STR_PAD_LEFT);
                $counter++;
            } while (Order::where('order_number', $orderNumber)->exists());

            // Calculer les totaux
            $subtotal = 0;
            $totalTva = 0;

            // Pre-fetch all products to avoid N+1 queries
            $productIds = collect($request->items)->pluck('productId')->unique();
            $products = \App\Models\Product::whereIn('id', $productIds)->get()->keyBy('id');

            foreach ($request->items as $item) {
                $product = $products[$item['productId']] ?? null;
                if (!$product) {
                    throw new \Exception('Product not found: ' . $item['productId']);
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
                'delivery_date' => $request->deliveryDate,
                'use_customer_address' => $useCustomerAddress,
                'delivery_address' => $deliveryAddress !== '' ? $deliveryAddress : null,
                'delivery_city' => $deliveryCity !== '' ? $deliveryCity : null,
            ]);

            // Créer les items de commande
            foreach ($request->items as $item) {
                $product = $products[$item['productId']];
                $itemTotal = $product->price * $item['quantity'];
                $itemTva = $itemTotal * ($product->tva_rate / 100);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['productId'],
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
                "Commande {$orderNumber} créée par " . auth()->user()->name . " pour {$customerName} — " . number_format((float) ($order->total ?? 0), 2) . ' MAD',
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
            \Log::error('Failed to create order: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to create order: ' . $e->getMessage()], 500);
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
            'useCustomerAddress' => (bool) ($order->use_customer_address ?? true),
            'deliveryAddress' => $order->delivery_address,
            'deliveryCity' => $order->delivery_city,
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
            'use_customer_address' => 'sometimes|boolean',
            'delivery_address' => 'required_if:use_customer_address,false|nullable|string|max:500',
            'delivery_city' => 'nullable|string|max:100',
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

            $updates = $request->only(['customer_id', 'notes', 'delivery_date']);

            if ($request->has('use_customer_address')) {
                $useCustomerAddress = $request->boolean('use_customer_address');
                $updates['use_customer_address'] = $useCustomerAddress;

                if ($useCustomerAddress) {
                    $customerId = $request->input('customer_id', $order->customer_id);
                    $customer = Customer::find($customerId);
                    $updates['delivery_address'] = $customer?->address;
                    $updates['delivery_city'] = $customer?->city;
                }
            }

            if ($request->has('delivery_address')) {
                $updates['delivery_address'] = $request->input('delivery_address');
            }

            if ($request->has('delivery_city')) {
                $updates['delivery_city'] = $request->input('delivery_city');
            }

            $order->update($updates);

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

        // If delivery status, notify chauffeurs and create a delivery record (if none exists)
        if ($request->status === 'delivery') {
            Notification::notifyRole(
                ['chauffeur'],
                'delivery',
                'Commande prête pour livraison',
                "Commande {$order->order_number} pour {$customerName} est prête à être livrée.",
                '/dashboard/deliveries'
            );

            // Create a Delivery record to make it visible in the deliveries dashboard
            if (!$order->delivery) {
                $chauffeur = \App\Models\User::whereHas('role', fn($q) => $q->where('name', 'chauffeur'))->first();
                $vehicle = \App\Models\Vehicle::first();

                if ($chauffeur && $vehicle) {
                    \App\Models\Delivery::create([
                        'order_id' => $order->id,
                        'chauffeur_id' => $chauffeur->id,
                        'vehicle_id' => $vehicle->id,
                        'status' => 'planned',
                        'planned_date' => $order->delivery_date ?? now(),
                        'notes' => 'Créé automatiquement lors du passage en livraison',
                    ]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => $order,
            'message' => 'Order status updated successfully',
        ]);
    }
}
