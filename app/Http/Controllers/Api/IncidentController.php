<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Delivery;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class IncidentController extends Controller
{
    private function canManageIncident(Delivery $delivery, $user): bool
    {
        $roleName = $user->role?->name ?? '';

        if (in_array($roleName, ['admin', 'manager'], true)) {
            return true;
        }

        return $roleName === 'chauffeur' && (int) $delivery->chauffeur_id === (int) $user->id;
    }

    private function formatIncident(Delivery $delivery): array
    {
        $delivery->loadMissing(['order.customer', 'chauffeur', 'incidentReportedByUser', 'incidentResolvedByUser']);

        return [
            'id' => $delivery->id,
            'deliveryId' => $delivery->id,
            'deliveryStatus' => $delivery->status,
            'hasDiscrepancy' => (bool) $delivery->has_discrepancy,
            'incidentReport' => $delivery->incident_report,
            'incidentStatus' => $delivery->incident_status,
            'incidentReportedAt' => $delivery->incident_reported_at?->toISOString(),
            'incidentReportedBy' => $delivery->incidentReportedByUser ? [
                'id' => $delivery->incidentReportedByUser->id,
                'name' => $delivery->incidentReportedByUser->name,
            ] : null,
            'incidentResolutionNotes' => $delivery->incident_resolution_notes,
            'incidentResolvedAt' => $delivery->incident_resolved_at?->toISOString(),
            'incidentResolvedBy' => $delivery->incidentResolvedByUser ? [
                'id' => $delivery->incidentResolvedByUser->id,
                'name' => $delivery->incidentResolvedByUser->name,
            ] : null,
            'order' => $delivery->order ? [
                'id' => $delivery->order->id,
                'orderNumber' => $delivery->order->order_number,
                'customer' => $delivery->order->customer ? [
                    'id' => $delivery->order->customer->id,
                    'name' => $delivery->order->customer->name,
                    'city' => $delivery->order->customer->city,
                ] : null,
            ] : null,
            'chauffeur' => $delivery->chauffeur ? [
                'id' => $delivery->chauffeur->id,
                'name' => $delivery->chauffeur->name,
            ] : null,
            'createdAt' => $delivery->created_at?->toISOString(),
            'updatedAt' => $delivery->updated_at?->toISOString(),
        ];
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->get('per_page', 20);
        $perPage = min(max($perPage, 1), 100);

        $user = $request->user();
        $roleName = $user->role?->name ?? '';

        $query = Delivery::with(['order.customer', 'chauffeur', 'incidentReportedByUser', 'incidentResolvedByUser'])
            ->whereNotNull('incident_report');

        if ($roleName === 'chauffeur') {
            $query->where('chauffeur_id', $user->id);
        }

        if ($request->filled('incident_status')) {
            $query->where('incident_status', $request->incident_status);
        }

        if ($request->filled('delivery_status')) {
            $query->where('status', $request->delivery_status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('incident_report', 'like', "%{$search}%")
                    ->orWhereHas('order', function ($oq) use ($search) {
                        $oq->where('order_number', 'like', "%{$search}%")
                            ->orWhereHas('customer', function ($cq) use ($search) {
                                $cq->where('name', 'like', "%{$search}%");
                            });
                    })
                    ->orWhereHas('chauffeur', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $incidents = $query
            ->orderByDesc('incident_reported_at')
            ->orderByDesc('updated_at')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => collect($incidents->items())->map(function (Delivery $delivery): array {
                return $this->formatIncident($delivery);
            }),
            'pagination' => [
                'total' => $incidents->total(),
                'per_page' => $incidents->perPage(),
                'current_page' => $incidents->currentPage(),
                'last_page' => $incidents->lastPage(),
                'has_more' => $incidents->hasMorePages(),
            ],
        ]);
    }

    public function show(Request $request, Delivery $delivery)
    {
        if (!$delivery->incident_report) {
            return response()->json(['error' => 'Incident introuvable.'], 404);
        }

        if (!$this->canManageIncident($delivery, $request->user())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatIncident($delivery),
        ]);
    }

    public function store(Request $request, Delivery $delivery)
    {
        $user = $request->user();
        $roleName = $user->role?->name ?? '';

        if (!$this->canManageIncident($delivery, $user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($roleName === 'chauffeur' && !in_array($delivery->status, ['in_progress', 'completed'], true)) {
            return response()->json([
                'error' => 'Un chauffeur peut déclarer un incident uniquement pendant ou après une livraison active.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'incident_report' => 'required|string|min:5|max:3000',
            'incident_status' => 'nullable|in:open,in_review,resolved',
            'incident_resolution_notes' => 'nullable|string|max:3000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $status = in_array($roleName, ['admin', 'manager'], true)
            ? ($request->incident_status ?? 'open')
            : 'open';

        $delivery->incident_report = $request->incident_report;
        $delivery->incident_reported_at = now();
        $delivery->incident_reported_by = $user->id;
        $delivery->incident_status = $status;
        $delivery->incident_resolution_notes = $request->incident_resolution_notes;
        $delivery->has_discrepancy = true;

        if ($status === 'resolved') {
            $delivery->incident_resolved_at = now();
            $delivery->incident_resolved_by = $user->id;
        } else {
            $delivery->incident_resolved_at = null;
            $delivery->incident_resolved_by = null;
        }

        $delivery->save();

        $orderNumber = $delivery->order?->order_number ?? ('#' . $delivery->order_id);

        Notification::notifyRole(
            ['admin', 'manager'],
            'alert',
            'Incident de livraison signalé',
            "Un incident a été signalé sur la livraison de la commande {$orderNumber}.",
            '/dashboard/incidents'
        );

        AuditLog::create([
            'action' => 'delivery_incident_reported',
            'model_type' => 'Delivery',
            'model_id' => $delivery->id,
            'user_id' => $user->id,
            'new_values' => [
                'incident_report' => $delivery->incident_report,
                'incident_status' => $delivery->incident_status,
            ],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatIncident($delivery->fresh()),
            'message' => 'Incident déclaré avec succès.',
        ], 201);
    }

    public function update(Request $request, Delivery $delivery)
    {
        $user = $request->user();
        $roleName = $user->role?->name ?? '';

        if (!$delivery->incident_report) {
            return response()->json(['error' => 'Incident introuvable.'], 404);
        }

        if (!$this->canManageIncident($delivery, $user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'incident_report' => 'sometimes|string|min:5|max:3000',
            'incident_status' => 'sometimes|in:open,in_review,resolved',
            'incident_resolution_notes' => 'nullable|string|max:3000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        if (!in_array($roleName, ['admin', 'manager'], true)) {
            if ($request->has('incident_status') || $request->has('incident_resolution_notes')) {
                return response()->json([
                    'error' => 'Seuls admin et manager peuvent gérer le statut ou la résolution d\'incident.',
                ], 403);
            }
        }

        $oldValues = [
            'incident_report' => $delivery->incident_report,
            'incident_status' => $delivery->incident_status,
            'incident_resolution_notes' => $delivery->incident_resolution_notes,
        ];

        if ($request->has('incident_report')) {
            $delivery->incident_report = $request->incident_report;
            if (!$delivery->incident_reported_at) {
                $delivery->incident_reported_at = now();
            }
            if (!$delivery->incident_reported_by) {
                $delivery->incident_reported_by = $user->id;
            }
            $delivery->has_discrepancy = true;
        }

        if (in_array($roleName, ['admin', 'manager'], true) && $request->has('incident_status')) {
            $delivery->incident_status = $request->incident_status;
            if ($delivery->incident_status === 'resolved') {
                $delivery->incident_resolved_at = now();
                $delivery->incident_resolved_by = $user->id;
            } else {
                $delivery->incident_resolved_at = null;
                $delivery->incident_resolved_by = null;
            }
        }

        if (in_array($roleName, ['admin', 'manager'], true) && $request->has('incident_resolution_notes')) {
            $delivery->incident_resolution_notes = $request->incident_resolution_notes;
        }

        $delivery->save();

        AuditLog::create([
            'action' => 'delivery_incident_updated',
            'model_type' => 'Delivery',
            'model_id' => $delivery->id,
            'user_id' => $user->id,
            'old_values' => $oldValues,
            'new_values' => [
                'incident_report' => $delivery->incident_report,
                'incident_status' => $delivery->incident_status,
                'incident_resolution_notes' => $delivery->incident_resolution_notes,
            ],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatIncident($delivery->fresh()),
            'message' => 'Incident mis à jour avec succès.',
        ]);
    }

    public function destroy(Request $request, Delivery $delivery)
    {
        $roleName = $request->user()->role?->name ?? '';
        if (!in_array($roleName, ['admin', 'manager'], true)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if (!$delivery->incident_report) {
            return response()->json(['error' => 'Incident introuvable.'], 404);
        }

        $delivery->incident_report = null;
        $delivery->incident_reported_at = null;
        $delivery->incident_reported_by = null;
        $delivery->incident_status = null;
        $delivery->incident_resolution_notes = null;
        $delivery->incident_resolved_at = null;
        $delivery->incident_resolved_by = null;
        $delivery->has_discrepancy = $delivery->checkCashDiscrepancy();
        $delivery->save();

        AuditLog::create([
            'action' => 'delivery_incident_deleted',
            'model_type' => 'Delivery',
            'model_id' => $delivery->id,
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Incident supprimé avec succès.',
        ]);
    }
}
