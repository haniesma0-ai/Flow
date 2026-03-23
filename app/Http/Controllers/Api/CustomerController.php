<?php
// app/Http/Controllers/Api/CustomerController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->get('per_page', 20);
        $perPage = min(max($perPage, 1), 100);

        $query = Customer::query();

        // Filtrage par statut actif
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Recherche par nom, email ou code
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $customers = $query
            ->select('id', 'code', 'name', 'email', 'phone', 'address', 'city', 'delivery_address', 'delivery_city', 'billing_same_as_delivery', 'ice', 'rc', 'is_active', 'created_at', 'updated_at')
            ->orderBy('name')
            ->paginate($perPage);

        $formatted = collect($customers->items())->map(function ($customer) {
            return [
                'id' => $customer->id,
                'code' => $customer->code,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'city' => $customer->city,
                'deliveryAddress' => $customer->delivery_address,
                'deliveryCity' => $customer->delivery_city,
                'billingSameAsDelivery' => (bool) $customer->billing_same_as_delivery,
                'ice' => $customer->ice,
                'rc' => $customer->rc,
                'isActive' => (bool) $customer->is_active,
                'createdAt' => $customer->created_at?->toISOString(),
                'updatedAt' => $customer->updated_at?->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted,
            'pagination' => [
                'total' => $customers->total(),
                'per_page' => $customers->perPage(),
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'has_more' => $customers->hasMorePages(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:customers,code',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:customers,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'delivery_address' => 'nullable|string',
            'delivery_city' => 'nullable|string|max:100',
            'billing_same_as_delivery' => 'boolean',
            'ice' => 'nullable|string|max:50',
            'rc' => 'nullable|string|max:50',
            'credit_limit' => 'numeric|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $customer = Customer::create($request->all());

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $customer->id,
                'code' => $customer->code,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'city' => $customer->city,
                'deliveryAddress' => $customer->delivery_address,
                'deliveryCity' => $customer->delivery_city,
                'billingSameAsDelivery' => (bool) $customer->billing_same_as_delivery,
                'ice' => $customer->ice,
                'rc' => $customer->rc,
                'isActive' => (bool) $customer->is_active,
                'createdAt' => $customer->created_at?->toISOString(),
                'updatedAt' => $customer->updated_at?->toISOString(),
            ],
            'message' => 'Customer created successfully',
        ], 201);
    }

    public function show(Customer $customer)
    {
        $customer->load(['orders']);
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $customer->id,
                'code' => $customer->code,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'city' => $customer->city,
                'deliveryAddress' => $customer->delivery_address,
                'deliveryCity' => $customer->delivery_city,
                'billingSameAsDelivery' => (bool) $customer->billing_same_as_delivery,
                'ice' => $customer->ice,
                'rc' => $customer->rc,
                'isActive' => (bool) $customer->is_active,
                'creditLimit' => (float) $customer->credit_limit,
                'createdAt' => $customer->created_at?->toISOString(),
                'updatedAt' => $customer->updated_at?->toISOString(),
                'orders' => $customer->orders,
            ],
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'sometimes|string|unique:customers,code,' . $customer->id,
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|unique:customers,email,' . $customer->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'delivery_address' => 'nullable|string',
            'delivery_city' => 'nullable|string|max:100',
            'billing_same_as_delivery' => 'boolean',
            'ice' => 'nullable|string|max:50',
            'rc' => 'nullable|string|max:50',
            'credit_limit' => 'sometimes|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $customer->update($request->all());

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $customer->id,
                'code' => $customer->code,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'city' => $customer->city,
                'deliveryAddress' => $customer->delivery_address,
                'deliveryCity' => $customer->delivery_city,
                'billingSameAsDelivery' => (bool) $customer->billing_same_as_delivery,
                'ice' => $customer->ice,
                'rc' => $customer->rc,
                'isActive' => (bool) $customer->is_active,
                'createdAt' => $customer->created_at?->toISOString(),
                'updatedAt' => $customer->updated_at?->toISOString(),
            ],
            'message' => 'Customer updated successfully',
        ]);
    }

    public function destroy(Customer $customer)
    {
        // Vérifier si le client a des commandes
        if ($customer->orders()->exists()) {
            return response()->json(['error' => 'Cannot delete customer with existing orders'], 422);
        }

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer deleted successfully',
        ]);
    }
}

