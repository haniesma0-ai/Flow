<?php
// app/Http/Controllers/Api/ProductController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    private function formatProduct(Product $product): array
    {
        return [
            'id' => $product->id,
            'code' => $product->code,
            'name' => $product->name,
            'description' => $product->description,
            'category' => $product->category ?? 'general',
            'unit' => $product->unit,
            'price' => (float) $product->price,
            'tva' => (float) $product->tva_rate,
            'stock' => (int) $product->stock,
            'minStock' => (int) $product->min_stock,
            'isActive' => (bool) $product->is_active,
            'createdAt' => $product->created_at?->toISOString(),
            'updatedAt' => $product->updated_at?->toISOString(),
        ];
    }

    public function index(Request $request)
    {
        $query = Product::query();

        // Filtrage par statut actif
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Recherche par nom ou code
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Filtrage par stock faible
        if ($request->has('low_stock') && $request->boolean('low_stock')) {
            $query->whereRaw('stock <= min_stock');
        }

        $products = $query->orderBy('name')->get();

        $formatted = $products->map(fn($product) => $this->formatProduct($product));

        return response()->json([
            'success' => true,
            'data' => $formatted,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:products,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'tva_rate' => 'required|numeric|min:0|max:100',
            'stock' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:10',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $product = Product::create($request->all());

        return response()->json([
            'success' => true,
            'data' => $this->formatProduct($product),
            'message' => 'Product created successfully',
        ], 201);
    }

    public function show(Product $product)
    {
        return response()->json([
            'success' => true,
            'data' => $this->formatProduct($product),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'sometimes|string|unique:products,code,' . $product->id,
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'tva_rate' => 'sometimes|numeric|min:0|max:100',
            'stock' => 'sometimes|integer|min:0',
            'min_stock' => 'sometimes|integer|min:0',
            'unit' => 'sometimes|string|max:10',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $product->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $this->formatProduct($product->fresh()),
            'message' => 'Product updated successfully',
        ]);
    }

    public function destroy(Product $product)
    {
        // Vérifier si le produit est utilisé dans des commandes
        if ($product->orderItems()->exists()) {
            return response()->json(['error' => 'Cannot delete product that is used in orders'], 422);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }
}
