<?php
// app/Models/Delivery.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Delivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'chauffeur_id',
        'vehicle_id',
        'status',
        'planned_date',
        'actual_departure',
        'actual_arrival',
        'notes',
        'latitude',
        'longitude',
        // COD fields
        'cash_amount',
        'collected_amount',
        'payment_confirmed',
        'payment_confirmed_at',
        'payment_locked',
        // Digital signature
        'signature_data',
        'signature_captured_at',
        // GPS payment location
        'payment_latitude',
        'payment_longitude',
        'gps_tracking_log',
        // Incident
        'has_discrepancy',
        'incident_report',
        'incident_reported_at',
        // Cash reconciliation
        'cash_submitted',
        'cash_submitted_at',
        'cash_verified',
        'cash_verified_at',
        'verified_by',
    ];

    protected $casts = [
        'planned_date' => 'datetime',
        'actual_departure' => 'datetime',
        'actual_arrival' => 'datetime',
        'payment_confirmed_at' => 'datetime',
        'signature_captured_at' => 'datetime',
        'incident_reported_at' => 'datetime',
        'cash_submitted_at' => 'datetime',
        'cash_verified_at' => 'datetime',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'payment_latitude' => 'decimal:8',
        'payment_longitude' => 'decimal:8',
        'cash_amount' => 'decimal:2',
        'collected_amount' => 'decimal:2',
        'payment_confirmed' => 'boolean',
        'payment_locked' => 'boolean',
        'has_discrepancy' => 'boolean',
        'cash_submitted' => 'boolean',
        'cash_verified' => 'boolean',
        'gps_tracking_log' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function chauffeur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'chauffeur_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function verifiedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * Append a GPS tracking entry to the log.
     * Does NOT call save() — the caller is responsible for persisting.
     */
    public function appendGpsLog(float $lat, float $lng, string $event = 'tracking'): void
    {
        $log = $this->gps_tracking_log ?? [];
        $log[] = [
            'lat' => $lat,
            'lng' => $lng,
            'event' => $event,
            'timestamp' => now()->toISOString(),
        ];
        $this->gps_tracking_log = $log;
    }

    /**
     * Check if delivery can be completed (payment + signature required).
     */
    public function canBeCompleted(): bool
    {
        return $this->payment_confirmed && $this->signature_data !== null;
    }

    /**
     * Check if there is a cash discrepancy.
     */
    public function checkCashDiscrepancy(): bool
    {
        if ($this->collected_amount === null) {
            return false;
        }
        return abs((float) $this->cash_amount - (float) $this->collected_amount) > 0.01;
    }
}