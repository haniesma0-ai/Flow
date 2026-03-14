<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Career;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CareerController extends Controller
{
    private function formatCareer(Career $career): array
    {
        return [
            'id' => $career->id,
            'title' => $career->title,
            'location' => $career->location,
            'type' => $career->type,
            'description' => $career->description,
            'requirements' => $career->requirements,
            'department' => $career->department,
            'contactEmail' => $career->contact_email,
            'isActive' => (bool) $career->is_active,
            'createdAt' => $career->created_at?->toISOString(),
            'updatedAt' => $career->updated_at?->toISOString(),
        ];
    }

    /**
     * Public: list active careers (for the public careers page)
     */
    public function publicIndex()
    {
        $careers = Career::where('is_active', true)->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $careers->map(fn($c) => $this->formatCareer($c)),
        ]);
    }

    /**
     * Admin: list all careers
     */
    public function index(Request $request)
    {
        $query = Career::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $careers = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $careers->map(fn($c) => $this->formatCareer($c)),
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'type' => 'required|string|in:CDI,CDD,Stage,Freelance,Intérim',
            'description' => 'required|string',
            'requirements' => 'nullable|string',
            'department' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $career = Career::create($request->all());

        return response()->json([
            'success' => true,
            'data' => $this->formatCareer($career),
            'message' => 'Offre d\'emploi créée avec succès',
        ], 201);
    }

    public function show(Career $career)
    {
        return response()->json([
            'success' => true,
            'data' => $this->formatCareer($career),
        ]);
    }

    public function update(Request $request, Career $career)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:CDI,CDD,Stage,Freelance,Intérim',
            'description' => 'sometimes|string',
            'requirements' => 'nullable|string',
            'department' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $career->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $this->formatCareer($career->fresh()),
            'message' => 'Offre d\'emploi mise à jour avec succès',
        ]);
    }

    public function destroy(Career $career)
    {
        $career->delete();

        return response()->json([
            'success' => true,
            'message' => 'Offre d\'emploi supprimée avec succès',
        ]);
    }
}
