<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VehicleController extends Controller
{
    public function index()
    {
        $vehicles = Vehicle::orderBy('brand')->get();

        $formatted = $vehicles->map(function ($v) {
            return [
                'id' => $v->id,
                'licensePlate' => $v->license_plate,
                'brand' => $v->brand,
                'model' => $v->model,
                'capacity' => $v->capacity,
                'isActive' => (bool) $v->is_active,
                'deliveriesCount' => $v->deliveries()->count(),
                'createdAt' => $v->created_at?->toISOString(),
                'updatedAt' => $v->updated_at?->toISOString(),
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
            'license_plate' => 'required|string|unique:vehicles,license_plate',
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'capacity' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $vehicle = Vehicle::create($request->only(['license_plate', 'brand', 'model', 'capacity', 'is_active']));

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $vehicle->id,
                'licensePlate' => $vehicle->license_plate,
                'brand' => $vehicle->brand,
                'model' => $vehicle->model,
                'capacity' => $vehicle->capacity,
                'isActive' => (bool) $vehicle->is_active,
                'deliveriesCount' => 0,
                'createdAt' => $vehicle->created_at?->toISOString(),
                'updatedAt' => $vehicle->updated_at?->toISOString(),
            ],
            'message' => 'Véhicule créé avec succès',
        ], 201);
    }

    public function show(Vehicle $vehicle)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $vehicle->id,
                'licensePlate' => $vehicle->license_plate,
                'brand' => $vehicle->brand,
                'model' => $vehicle->model,
                'capacity' => $vehicle->capacity,
                'isActive' => (bool) $vehicle->is_active,
                'deliveriesCount' => $vehicle->deliveries()->count(),
                'createdAt' => $vehicle->created_at?->toISOString(),
                'updatedAt' => $vehicle->updated_at?->toISOString(),
            ],
        ]);
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        $validator = Validator::make($request->all(), [
            'license_plate' => 'sometimes|string|unique:vehicles,license_plate,' . $vehicle->id,
            'brand' => 'sometimes|string|max:255',
            'model' => 'sometimes|string|max:255',
            'capacity' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $vehicle->update($request->only(['license_plate', 'brand', 'model', 'capacity', 'is_active']));

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $vehicle->id,
                'licensePlate' => $vehicle->license_plate,
                'brand' => $vehicle->brand,
                'model' => $vehicle->model,
                'capacity' => $vehicle->capacity,
                'isActive' => (bool) $vehicle->is_active,
                'deliveriesCount' => $vehicle->deliveries()->count(),
                'createdAt' => $vehicle->created_at?->toISOString(),
                'updatedAt' => $vehicle->updated_at?->toISOString(),
            ],
            'message' => 'Véhicule modifié avec succès',
        ]);
    }

    public function destroy(Vehicle $vehicle)
    {
        if ($vehicle->deliveries()->exists()) {
            return response()->json([
                'success' => false,
                'error' => 'Impossible de supprimer un véhicule associé à des livraisons',
            ], 422);
        }

        $vehicle->delete();

        return response()->json([
            'success' => true,
            'message' => 'Véhicule supprimé avec succès',
        ]);
    }
}
