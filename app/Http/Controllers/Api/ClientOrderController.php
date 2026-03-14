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
     * List only the client's own orders.
     */
    public function index()
    {
        $customer = $this->getCustomer();

        if (!$customer) {
            return response()->json(['success' => true, 'data' => []], 200);
        }

        $orders = Order::with(['items.product'])
            ->where('customer_id', $customer->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($o) => $this->formatOrder($o));

        return response()->json(['success' => true, 'data' => $orders]);
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
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
            'delivery_date' => 'nullable|date|after_or_equal:today',
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

        DB::beginTransaction();
        try {
            $orderNumber = 'ORD-' . date('Y') . '-' . str_pad(Order::count() + 1, 4, '0', STR_PAD_LEFT);

            $subtotal = 0;
            $totalTva = 0;

            foreach ($request->items as $item) {
                $product = \App\Models\Product::findOrFail($item['product_id']);
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
                'delivery_date' => $request->delivery_date,
            ]);

            foreach ($request->items as $item) {
                $product = \App\Models\Product::findOrFail($item['product_id']);
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
