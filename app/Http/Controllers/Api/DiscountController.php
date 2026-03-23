<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DiscountController extends Controller
{
    private function formatDiscount(Discount $discount): array
    {
        return [
            'id' => $discount->id,
            'code' => $discount->code,
            'name' => $discount->name,
            'description' => $discount->description,
            'type' => $discount->type,
            'value' => (float) $discount->value,
            'minOrderAmount' => (float) $discount->min_order_amount,
            'maxDiscountAmount' => $discount->max_discount_amount !== null ? (float) $discount->max_discount_amount : null,
            'startDate' => $discount->start_date?->toISOString(),
            'endDate' => $discount->end_date?->toISOString(),
            'isActive' => (bool) $discount->is_active,
            'createdAt' => $discount->created_at?->toISOString(),
            'updatedAt' => $discount->updated_at?->toISOString(),
        ];
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->get('per_page', 15);
        $perPage = min($perPage, 100); // Cap at 100

        $query = Discount::query();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $discounts = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $discounts->items(),
            'pagination' => [
                'total' => $discounts->total(),
                'per_page' => $discounts->perPage(),
                'current_page' => $discounts->currentPage(),
                'last_page' => $discounts->lastPage(),
                'has_more' => $discounts->hasMorePages(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:60|unique:discounts,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:percent,fixed',
            'value' => 'required|numeric|min:0.01',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($request->type === 'percent' && (float) $request->value > 100) {
            return response()->json([
                'success' => false,
                'error' => 'La réduction en pourcentage ne peut pas dépasser 100%.',
            ], 422);
        }

        $discount = Discount::create([
            'code' => strtoupper(trim($request->code)),
            'name' => $request->name,
            'description' => $request->description,
            'type' => $request->type,
            'value' => $request->value,
            'min_order_amount' => $request->min_order_amount ?? 0,
            'max_discount_amount' => $request->max_discount_amount,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatDiscount($discount),
            'message' => 'Réduction créée avec succès.',
        ], 201);
    }

    public function show(Discount $discount)
    {
        return response()->json([
            'success' => true,
            'data' => $this->formatDiscount($discount),
        ]);
    }

    public function update(Request $request, Discount $discount)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'sometimes|string|max:60|unique:discounts,code,' . $discount->id,
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|in:percent,fixed',
            'value' => 'sometimes|numeric|min:0.01',
            'min_order_amount' => 'sometimes|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $type = $request->input('type', $discount->type);
        $value = (float) $request->input('value', $discount->value);
        if ($type === 'percent' && $value > 100) {
            return response()->json([
                'success' => false,
                'error' => 'La réduction en pourcentage ne peut pas dépasser 100%.',
            ], 422);
        }

        $payload = $request->only([
            'name',
            'description',
            'type',
            'value',
            'min_order_amount',
            'max_discount_amount',
            'start_date',
            'end_date',
            'is_active',
        ]);

        if ($request->has('code')) {
            $payload['code'] = strtoupper(trim((string) $request->input('code')));
        }

        $discount->update($payload);

        return response()->json([
            'success' => true,
            'data' => $this->formatDiscount($discount->fresh()),
            'message' => 'Réduction mise à jour avec succès.',
        ]);
    }

    public function destroy(Discount $discount)
    {
        $discount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Réduction supprimée avec succès.',
        ]);
    }
}
