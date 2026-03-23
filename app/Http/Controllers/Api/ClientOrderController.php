<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ClientOrderController extends Controller
{
    /**
     * Get the Customer record linked to the authenticated user (by email).
     */
    private function getCustomer()
    {
        return Customer::where('email', auth()->user()->email)->first();
    }

    /**
     * Normalize cart payload so we accept both productId and product_id keys.
     */
    private function normalizeItems(array $items): array
    {
        return collect($items)
            ->map(function ($item) {
                return [
                    'productId' => $item['productId'] ?? $item['product_id'] ?? null,
                    'quantity' => $item['quantity'] ?? null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Expose customer default delivery data for client checkout.
     */
    public function profileData()
    {
        $user = auth()->user();
        $customer = $this->getCustomer();

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $customer?->name ?? $user->name,
                'email' => $user->email,
                'phone' => $customer?->phone ?? $user->phone,
                'address' => $customer?->address,
                'city' => $customer?->city,
                'hasAddress' => !empty(trim((string) ($customer?->address ?? ''))),
            ],
        ]);
    }

    /**
     * List only the client's own orders.
     */
    public function index()
    {
        $perPage = (int) request()->get('per_page', 20);
        $perPage = min(max($perPage, 1), 100);

        $customer = $this->getCustomer();

        if (!$customer) {
            return response()->json([
                'success' => true,
                'data' => [],
                'pagination' => [
                    'total' => 0,
                    'per_page' => $perPage,
                    'current_page' => 1,
                    'last_page' => 1,
                    'has_more' => false,
                ],
            ], 200);
        }

        $orders = Order::with(['items.product'])
            ->where('customer_id', $customer->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => collect($orders->items())->map(function (Order $order): array {
                return $this->formatOrder($order);
            }),
            'pagination' => [
                'total' => $orders->total(),
                'per_page' => $orders->perPage(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'has_more' => $orders->hasMorePages(),
            ],
        ]);
    }

    /**
     * Show a single order (only if it belongs to the client).
     */
    public function show(Order $order)
    {
        $customer = $this->getCustomer();

        if (!$customer || $order->customer_id !== $customer->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $order->load(['items.product']);

        return response()->json(['success' => true, 'data' => $this->formatOrder($order)]);
    }

    /**
     * Place a new order as a client.
     */
    public function store(Request $request)
    {
        $normalizedItems = $this->normalizeItems((array) $request->input('items', []));
        $useDefaultAddress = filter_var(
            $request->input('useDefaultAddress', true),
            FILTER_VALIDATE_BOOLEAN,
            FILTER_NULL_ON_FAILURE
        );

        $validationPayload = array_merge($request->all(), [
            'items' => $normalizedItems,
            'useDefaultAddress' => $useDefaultAddress ?? true,
        ]);

        $validator = Validator::make($validationPayload, [
            'items' => 'required|array|min:1',
            'items.*.productId' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
            'deliveryDate' => 'nullable|date|after_or_equal:today',
            'useDefaultAddress' => 'required|boolean',
            'deliveryAddress' => 'required_if:useDefaultAddress,false|nullable|string|max:500',
            'deliveryCity' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        // Find or create a Customer record for this user
        $user = auth()->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            $customer = Customer::create([
                'code' => 'CLI-' . str_pad(Customer::count() + 1, 4, '0', STR_PAD_LEFT),
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'address' => '',
                'city' => '',
            ]);
        }

        $deliveryAddress = $useDefaultAddress
            ? trim((string) ($customer->address ?? ''))
            : trim((string) $request->input('deliveryAddress', ''));
        $deliveryCity = $useDefaultAddress
            ? trim((string) ($customer->city ?? ''))
            : trim((string) $request->input('deliveryCity', ''));

        if ($useDefaultAddress && $deliveryAddress === '') {
            return response()->json([
                'success' => false,
                'error' => 'Aucune adresse client enregistrée. Choisissez une adresse personnalisée.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $orderNumber = null;
            $counter = Order::count() + 1;
            do {
                $orderNumber = 'ORD-' . date('Y') . '-' . str_pad($counter, 4, '0', STR_PAD_LEFT);
                $counter++;
            } while (Order::where('order_number', $orderNumber)->exists());

            $subtotal = 0;
            $totalTva = 0;

            foreach ($normalizedItems as $item) {
                $product = \App\Models\Product::findOrFail($item['productId']);
                $itemTotal = $product->price * $item['quantity'];
                $itemTva = $itemTotal * ($product->tva_rate / 100);
                $subtotal += $itemTotal;
                $totalTva += $itemTva;
            }

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $customer->id,
                'commercial_id' => null,
                'subtotal' => $subtotal,
                'total_tva' => $totalTva,
                'total' => $subtotal + $totalTva,
                'status' => 'draft',
                'notes' => $request->notes,
                'delivery_date' => $request->deliveryDate,
                'use_customer_address' => $useDefaultAddress,
                'delivery_address' => $deliveryAddress,
                'delivery_city' => $deliveryCity !== '' ? $deliveryCity : null,
            ]);

            foreach ($normalizedItems as $item) {
                $product = \App\Models\Product::findOrFail($item['productId']);
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

            $order->load('items.product');

            return response()->json([
                'success' => true,
                'data' => $this->formatOrder($order),
                'message' => 'Commande créée avec succès',
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Erreur lors de la création de la commande'], 500);
        }
    }

    private function formatOrder(Order $order): array
    {
        return [
            'id' => $order->id,
            'orderNumber' => $order->order_number,
            'status' => $order->status,
            'subtotal' => (float) $order->subtotal,
            'totalTva' => (float) $order->total_tva,
            'total' => (float) $order->total,
            'notes' => $order->notes,
            'deliveryDate' => $order->delivery_date?->toISOString() ?? $order->delivery_date,
            'useCustomerAddress' => (bool) ($order->use_customer_address ?? true),
            'deliveryAddress' => $order->delivery_address,
            'deliveryCity' => $order->delivery_city,
            'createdAt' => $order->created_at?->toISOString(),
            'updatedAt' => $order->updated_at?->toISOString(),
            'items' => $order->items->map(fn($item) => [
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
            ]),
        ];
    }
}
