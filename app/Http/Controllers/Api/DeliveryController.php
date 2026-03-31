<?php
// app/Http/Controllers/Api/DeliveryController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Delivery;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DeliveryController extends Controller
{
    /**
     * @param bool $includeGpsLog  Pass false in list/tracking responses to avoid
     *                             sending potentially large GPS history arrays.
     */
    private function formatDelivery($delivery, bool $includeGpsLog = false)
    {
        return [
            'id' => $delivery->id,
            'orderId' => $delivery->order_id,
            'order' => $delivery->order ? [
                'id' => $delivery->order->id,
                'orderNumber' => $delivery->order->order_number,
                'total' => (float) $delivery->order->total,
                'customer' => $delivery->order->customer ? [
                    'id' => $delivery->order->customer->id,
                    'name' => $delivery->order->customer->name,
                    'city' => $delivery->order->customer->city,
                    'address' => $delivery->order->customer->address,
                    'phone' => $delivery->order->customer->phone,
                ] : null,
            ] : null,
            'chauffeurId' => $delivery->chauffeur_id,
            'chauffeur' => $delivery->chauffeur ? [
                'id' => $delivery->chauffeur->id,
                'name' => $delivery->chauffeur->name,
            ] : null,
            'vehicleId' => $delivery->vehicle_id,
            'vehicle' => $delivery->vehicle ? [
                'id' => $delivery->vehicle->id,
                'registration' => $delivery->vehicle->license_plate,
                'brand' => $delivery->vehicle->brand,
                'model' => $delivery->vehicle->model,
            ] : null,
            'status' => $delivery->status,
            'plannedDate' => $delivery->planned_date?->toISOString(),
            'startedAt' => $delivery->actual_departure?->toISOString(),
            'completedAt' => $delivery->actual_arrival?->toISOString(),
            'notes' => $delivery->notes,
            'latitude' => $delivery->latitude ? (float) $delivery->latitude : null,
            'longitude' => $delivery->longitude ? (float) $delivery->longitude : null,
            // COD fields
            'cashAmount' => (float) ($delivery->cash_amount ?? 0),
            'collectedAmount' => $delivery->collected_amount !== null ? (float) $delivery->collected_amount : null,
            'paymentConfirmed' => (bool) $delivery->payment_confirmed,
            'paymentConfirmedAt' => $delivery->payment_confirmed_at?->toISOString(),
            'paymentLocked' => (bool) $delivery->payment_locked,
            // Signature
            'signatureData' => $delivery->signature_data,
            'signatureCapturedAt' => $delivery->signature_captured_at?->toISOString(),
            // GPS payment
            'paymentLatitude' => $delivery->payment_latitude ? (float) $delivery->payment_latitude : null,
            'paymentLongitude' => $delivery->payment_longitude ? (float) $delivery->payment_longitude : null,
            'gpsTrackingLog' => $includeGpsLog ? ($delivery->gps_tracking_log ?? []) : [],
            // Incident
            'hasDiscrepancy' => (bool) $delivery->has_discrepancy,
            'incidentReport' => $delivery->incident_report,
            'incidentReportedAt' => $delivery->incident_reported_at?->toISOString(),
            // Cash reconciliation
            'cashSubmitted' => (bool) $delivery->cash_submitted,
            'cashSubmittedAt' => $delivery->cash_submitted_at?->toISOString(),
            'cashVerified' => (bool) $delivery->cash_verified,
            'cashVerifiedAt' => $delivery->cash_verified_at?->toISOString(),
            'verifiedBy' => $delivery->verified_by,
            'createdAt' => $delivery->created_at?->toISOString(),
            'updatedAt' => $delivery->updated_at?->toISOString(),
        ];
    }

    public function index(Request $request)
    {
        $query = Delivery::with(['order.customer', 'chauffeur', 'vehicle']);

        // Chauffeurs can only see their own deliveries
        $user = auth()->user();
        if ($user->role?->name === 'chauffeur') {
            $query->where('chauffeur_id', $user->id);
        }

        // Filtrage par statut
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filtrage par chauffeur (admin/manager filtering)
        if ($request->has('chauffeur_id') && $user->role?->name !== 'chauffeur') {
            $query->where('chauffeur_id', $request->chauffeur_id);
        }

        // Recherche
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('order', function ($orderQuery) use ($search) {
                $orderQuery->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $query->orderByRaw('(planned_date IS NULL) ASC')->orderBy('planned_date', 'desc');

        // Pagination — default 100, capped at 500 to avoid unbounded result sets
        $perPage = (int) $request->get('per_page', 100);
        $perPage = max(1, min($perPage, 500));
        $paginated = $query->paginate($perPage);

        $formatted = collect($paginated->items())->map(fn($d) => $this->formatDelivery($d, false));

        return response()->json([
            'success' => true,
            'data' => $formatted,
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'has_more' => $paginated->hasMorePages(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
            'chauffeur_id' => 'required|exists:users,id',
            'vehicle_id' => 'required|exists:vehicles,id',
            'planned_date' => 'required|date',
            'status' => 'nullable|in:planned,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        // Automatically set cash_amount from order total (COD)
        $order = \App\Models\Order::find($request->order_id);
        $cashAmount = $order ? $order->total : 0;

        $payload = $validator->validated();
        $payload['status'] = !empty($payload['status']) ? $payload['status'] : 'planned';

        $delivery = Delivery::create(array_merge($payload, [
            'cash_amount' => $cashAmount,
        ]));
        $delivery->load(['order.customer', 'chauffeur', 'vehicle']);

        $customerName = $delivery->order->customer->name ?? 'Client';
        $orderNum = $delivery->order->order_number ?? '';

        // Notify the assigned chauffeur
        Notification::notifyUser(
            $delivery->chauffeur_id,
            'delivery',
            'Nouvelle livraison assignée',
            "Livraison pour commande {$orderNum} ({$customerName}) vous a été assignée. Montant à encaisser: " . number_format($cashAmount, 2) . ' MAD.',
            '/dashboard/deliveries'
        );

        // Notify admin/manager
        Notification::notifyRole(
            ['admin', 'manager'],
            'delivery',
            'Livraison créée',
            "Livraison pour {$orderNum} assignée à " . ($delivery->chauffeur->name ?? 'chauffeur') . '. Montant COD: ' . number_format($cashAmount, 2) . ' MAD.',
            '/dashboard/deliveries'
        );

        // Audit log
        AuditLog::create([
            'action' => 'delivery_created',
            'model_type' => 'Delivery',
            'model_id' => $delivery->id,
            'user_id' => auth()->id(),
            'new_values' => $delivery->toArray(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatDelivery($delivery),
            'message' => 'Delivery created successfully',
        ], 201);
    }

    public function show(Delivery $delivery)
    {
        $delivery->load(['order.customer', 'chauffeur', 'vehicle']);

        return response()->json([
            'success' => true,
            'data' => $this->formatDelivery($delivery, true), // full GPS log for detail view
        ]);
    }

    public function update(Request $request, Delivery $delivery)
    {
        $validator = Validator::make($request->all(), [
            'chauffeur_id' => 'sometimes|exists:users,id',
            'vehicle_id' => 'sometimes|exists:vehicles,id',
            'planned_date' => 'sometimes|date',
            'actual_departure' => 'nullable|date',
            'actual_arrival' => 'nullable|date',
            'notes' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        // Prevent modification of payment data once locked
        if ($delivery->payment_locked) {
            $protectedFields = ['collected_amount', 'payment_confirmed', 'cash_amount'];
            foreach ($protectedFields as $field) {
                if ($request->has($field)) {
                    return response()->json([
                        'error' => 'Payment data cannot be modified after validation.',
                    ], 403);
                }
            }
        }

        // BUG FIX: use validated() not $request->all() to prevent mass-assignment
        // of sensitive fields (signature_data, cash_verified, etc.)
        $delivery->update($validator->validated());
        $delivery->load(['order.customer', 'chauffeur', 'vehicle']);

        return response()->json([
            'success' => true,
            'data' => $this->formatDelivery($delivery),
            'message' => 'Delivery updated successfully',
        ]);
    }

    public function destroy(Delivery $delivery)
    {
        if ($delivery->status !== 'planned') {
            return response()->json(['error' => 'Cannot delete delivery that is not planned'], 422);
        }

        $delivery->delete();

        return response()->json([
            'success' => true,
            'message' => 'Delivery deleted successfully',
        ]);
    }

    /**
     * Update delivery status with security enforcement.
     */
    public function updateStatus(Request $request, Delivery $delivery)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:planned,in_progress,completed,cancelled',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        // SECURITY: Cannot complete without payment confirmation AND digital signature
        if ($request->status === 'completed') {
            if (!$delivery->payment_confirmed) {
                return response()->json([
                    'error' => 'Delivery cannot be completed without payment confirmation.',
                ], 422);
            }
            if (!$delivery->signature_data) {
                return response()->json([
                    'error' => 'Delivery cannot be completed without digital signature capture.',
                ], 422);
            }
        }

        $oldStatus = $delivery->status;
        $delivery->status = $request->status;

        // Record GPS coordinates with status update
        if ($request->latitude && $request->longitude) {
            $delivery->latitude = $request->latitude;
            $delivery->longitude = $request->longitude;
            $delivery->appendGpsLog($request->latitude, $request->longitude, 'status_' . $request->status);
        }

        // Update timestamps
        if ($request->status === 'in_progress') {
            $delivery->actual_departure = now();
        } elseif ($request->status === 'completed') {
            $delivery->actual_arrival = now();
            // Lock payment after completion
            $delivery->payment_locked = true;
        }

        $delivery->save();
        $delivery->load(['order.customer', 'chauffeur', 'vehicle']);

        $customerName = $delivery->order->customer->name ?? 'Client';
        $orderNum = $delivery->order->order_number ?? '';

        if ($request->status === 'completed') {
            Notification::notifyRole(
                ['admin', 'manager', 'commercial'],
                'delivery',
                'Livraison terminée',
                "Livraison pour {$orderNum} ({$customerName}) a été effectuée par " . ($delivery->chauffeur->name ?? '') . '. Montant encaissé: ' . number_format((float) ($delivery->collected_amount ?? 0), 2) . ' MAD.',
                '/dashboard/deliveries'
            );
        } elseif ($request->status === 'in_progress') {
            Notification::notifyRole(
                ['admin', 'manager'],
                'delivery',
                'Livraison en cours',
                "Livraison pour {$orderNum} ({$customerName}) a démarré.",
                '/dashboard/deliveries'
            );
        } elseif ($request->status === 'cancelled') {
            Notification::notifyRole(
                ['admin', 'manager'],
                'delivery',
                'Livraison annulée',
                "Livraison pour {$orderNum} ({$customerName}) a été annulée.",
                '/dashboard/deliveries'
            );
        }

        // Audit log
        AuditLog::create([
            'action' => 'delivery_status_changed',
            'model_type' => 'Delivery',
            'model_id' => $delivery->id,
            'user_id' => auth()->id(),
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $request->status],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatDelivery($delivery),
            'message' => 'Delivery status updated successfully',
        ]);
    }

    /**
     * Driver confirms payment collection (COD).
     * Records amount, GPS location, and timestamp.
     */
    public function confirmPayment(Request $request, Delivery $delivery)
    {
        // Only the assigned driver or admin can confirm payment
        $user = auth()->user();
        if ($user->id !== $delivery->chauffeur_id && !in_array($user->role?->name ?? '', ['admin', 'manager'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($delivery->payment_locked) {
            return response()->json(['error' => 'Payment data is locked and cannot be modified.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'collected_amount' => 'required|numeric|min:0',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $delivery->collected_amount = $request->collected_amount;
        $delivery->payment_confirmed = true;
        $delivery->payment_confirmed_at = now();
        $delivery->payment_latitude = $request->latitude;
        $delivery->payment_longitude = $request->longitude;

        // Record GPS event
        $delivery->appendGpsLog($request->latitude, $request->longitude, 'payment_confirmed');

        // Check for discrepancy
        if ($delivery->checkCashDiscrepancy()) {
            $delivery->has_discrepancy = true;
            $delivery->incident_report = sprintf(
                'Cash discrepancy detected. Expected: %.2f MAD, Collected: %.2f MAD. Difference: %.2f MAD.',
                $delivery->cash_amount,
                $delivery->collected_amount,
                abs((float) $delivery->cash_amount - (float) $delivery->collected_amount)
            );
            $delivery->incident_reported_at = now();

            // Notify admin about discrepancy
            Notification::notifyRole(
                ['admin', 'manager'],
                'alert',
                'Écart de paiement détecté',
                "Livraison #{$delivery->id}: Attendu " . number_format((float) ($delivery->cash_amount ?? 0), 2) . ' MAD, Encaissé ' . number_format((float) ($delivery->collected_amount ?? 0), 2) . ' MAD. Écart: ' . number_format(abs((float) $delivery->cash_amount - (float) $delivery->collected_amount), 2) . ' MAD.',
                '/dashboard/deliveries'
            );
        }

        $delivery->save();
        $delivery->load(['order.customer', 'chauffeur', 'vehicle']);

        // Audit log
        AuditLog::create([
            'action' => 'delivery_payment_confirmed',
            'model_type' => 'Delivery',
            'model_id' => $delivery->id,
            'user_id' => auth()->id(),
            'new_values' => [
                'collected_amount' => $request->collected_amount,
                'has_discrepancy' => $delivery->has_discrepancy,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
            ],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatDelivery($delivery),
            'message' => $delivery->has_discrepancy
                ? 'Payment confirmed with discrepancy reported.'
                : 'Payment confirmed successfully.',
        ]);
    }

    /**
     * Capture digital signature from customer.
     */
    public function captureSignature(Request $request, Delivery $delivery)
    {
        $user = auth()->user();
        if ($user->id !== $delivery->chauffeur_id && !in_array($user->role?->name ?? '', ['admin', 'manager'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($delivery->payment_locked) {
            return response()->json(['error' => 'Delivery is already completed and locked.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'signature_data' => 'required|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $delivery->signature_data = $request->signature_data;
        $delivery->signature_captured_at = now();

        if ($request->latitude && $request->longitude) {
            $delivery->appendGpsLog($request->latitude, $request->longitude, 'signature_captured');
        }

        $delivery->save();
        $delivery->load(['order.customer', 'chauffeur', 'vehicle']);

        // Audit log
        AuditLog::create([
            'action' => 'delivery_signature_captured',
            'model_type' => 'Delivery',
            'model_id' => $delivery->id,
            'user_id' => auth()->id(),
            'new_values' => [
                'signature_captured_at' => $delivery->signature_captured_at,
            ],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatDelivery($delivery),
            'message' => 'Signature captured successfully.',
        ]);
    }

    /**
     * Update driver GPS location during delivery (real-time tracking).
     */
    public function updateLocation(Request $request, Delivery $delivery)
    {
        $user = auth()->user();
        if ($user->id !== $delivery->chauffeur_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $delivery->latitude = $request->latitude;
        $delivery->longitude = $request->longitude;
        $delivery->appendGpsLog($request->latitude, $request->longitude, 'location_update');
        $delivery->save(); // BUG FIX: appendGpsLog no longer auto-saves

        return response()->json([
            'success' => true,
            'message' => 'Location updated.',
        ]);
    }

    /**
     * Driver submits cash summary at end of delivery round.
     */
    public function submitCashSummary(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'delivery_ids' => 'required|array|min:1',
            'delivery_ids.*' => 'exists:deliveries,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, Delivery> $deliveries */
        $deliveries = Delivery::whereIn('id', $request->delivery_ids)
            ->where('chauffeur_id', $user->id)
            ->where('status', 'completed')
            ->where('payment_confirmed', true)
            ->where('cash_submitted', false)
            ->get();

        if ($deliveries->isEmpty()) {
            return response()->json(['error' => 'No eligible deliveries found.'], 422);
        }

        $totalExpected = 0;
        $totalCollected = 0;
        $summaryItems = [];

        // BUG FIX: wrap all saves in a transaction so a mid-loop crash
        // doesn't leave deliveries in a partially-submitted state.
        DB::transaction(function () use ($deliveries, &$totalExpected, &$totalCollected, &$summaryItems) {
            /** @var Delivery $delivery */
            foreach ($deliveries as $delivery) {
                $delivery->cash_submitted = true;
                $delivery->cash_submitted_at = now();
                $delivery->save();

                $totalExpected += (float) $delivery->cash_amount;
                $totalCollected += (float) $delivery->collected_amount;

                $summaryItems[] = [
                    'deliveryId' => $delivery->id,
                    'orderNumber' => $delivery->order->order_number ?? '',
                    'cashAmount' => (float) $delivery->cash_amount,
                    'collectedAmount' => (float) $delivery->collected_amount,
                    'hasDiscrepancy' => (bool) $delivery->has_discrepancy,
                ];
            }
        });

        // Notify admin for verification
        Notification::notifyRole(
            ['admin', 'manager'],
            'cash_summary',
            'Résumé de caisse soumis',
            ($user->name ?? 'Chauffeur') . " a soumis un résumé de caisse: {$deliveries->count()} livraisons, Total attendu: " . number_format($totalExpected, 2) . ' MAD, Total encaissé: ' . number_format($totalCollected, 2) . ' MAD.',
            '/dashboard/deliveries'
        );

        // Audit log
        AuditLog::create([
            'action' => 'cash_summary_submitted',
            'model_type' => 'Delivery',
            'model_id' => 0,
            'user_id' => $user->id,
            'new_values' => [
                'delivery_ids' => $request->delivery_ids,
                'total_expected' => $totalExpected,
                'total_collected' => $totalCollected,
            ],
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'deliveries' => $summaryItems,
                'totalExpected' => $totalExpected,
                'totalCollected' => $totalCollected,
                'difference' => abs($totalExpected - $totalCollected),
                'hasDiscrepancies' => $deliveries->where('has_discrepancy', true)->count() > 0,
            ],
            'message' => 'Cash summary submitted successfully.',
        ]);
    }

    /**
     * Admin verifies cash for completed deliveries.
     */
    public function verifyCash(Request $request, Delivery $delivery)
    {
        $user = auth()->user();
        $roleName = $user->role?->name ?? '';
        if (!in_array($roleName, ['admin', 'manager'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if (!$delivery->cash_submitted) {
            return response()->json(['error' => 'Cash has not been submitted by driver yet.'], 422);
        }

        $delivery->cash_verified = true;
        $delivery->cash_verified_at = now();
        $delivery->verified_by = $user->id;
        $delivery->save();

        // Audit log
        AuditLog::create([
            'action' => 'cash_verified',
            'model_type' => 'Delivery',
            'model_id' => $delivery->id,
            'user_id' => $user->id,
            'new_values' => [
                'cash_verified' => true,
                'verified_by' => $user->id,
            ],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatDelivery($delivery),
            'message' => 'Cash verified successfully.',
        ]);
    }

    /**
     * Get driver's active deliveries with real-time location data (for admin tracking).
     */
    public function trackDrivers(Request $request)
    {
        $query = Delivery::with(['order.customer', 'chauffeur', 'vehicle'])
            ->whereIn('status', ['in_progress']);

        if ($request->has('chauffeur_id')) {
            $query->where('chauffeur_id', $request->chauffeur_id);
        }

        $deliveries = $query->get();

        $drivers = $deliveries->groupBy('chauffeur_id')->map(function ($driverDeliveries) {
            $latest = $driverDeliveries->first();
            return [
                'chauffeur' => $latest->chauffeur ? [
                    'id' => $latest->chauffeur->id,
                    'name' => $latest->chauffeur->name,
                ] : null,
                'currentLocation' => [
                    'latitude' => $latest->latitude ? (float) $latest->latitude : null,
                    'longitude' => $latest->longitude ? (float) $latest->longitude : null,
                ],
                'activeDeliveries' => $driverDeliveries->map(fn($d) => $this->formatDelivery($d, false)),
                'vehicle' => $latest->vehicle ? [
                    'id' => $latest->vehicle->id,
                    'registration' => $latest->vehicle->license_plate,
                ] : null,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $drivers,
        ]);
    }
}

