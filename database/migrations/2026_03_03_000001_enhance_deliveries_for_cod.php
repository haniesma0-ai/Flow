<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            // COD (Cash On Delivery) fields
            $table->decimal('cash_amount', 12, 2)->default(0)->after('longitude')
                ->comment('Expected cash amount to collect from customer');
            $table->decimal('collected_amount', 12, 2)->nullable()->after('cash_amount')
                ->comment('Actual cash amount collected by driver');
            $table->boolean('payment_confirmed')->default(false)->after('collected_amount');
            $table->timestamp('payment_confirmed_at')->nullable()->after('payment_confirmed');
            $table->boolean('payment_locked')->default(false)->after('payment_confirmed_at')
                ->comment('Once true, payment data cannot be modified');

            // Digital signature
            $table->longText('signature_data')->nullable()->after('payment_locked')
                ->comment('Base64 encoded customer signature');
            $table->timestamp('signature_captured_at')->nullable()->after('signature_data');

            // GPS tracking for payment/status events
            $table->decimal('payment_latitude', 10, 8)->nullable()->after('signature_captured_at');
            $table->decimal('payment_longitude', 11, 8)->nullable()->after('payment_latitude');

            // GPS location history (JSON array of {lat, lng, timestamp, event})
            $table->json('gps_tracking_log')->nullable()->after('payment_longitude')
                ->comment('Array of GPS coordinates recorded during delivery');

            // Incident / discrepancy
            $table->boolean('has_discrepancy')->default(false)->after('gps_tracking_log');
            $table->text('incident_report')->nullable()->after('has_discrepancy');
            $table->timestamp('incident_reported_at')->nullable()->after('incident_report');

            // Cash reconciliation
            $table->boolean('cash_submitted')->default(false)->after('incident_reported_at')
                ->comment('Driver has submitted cash summary');
            $table->timestamp('cash_submitted_at')->nullable()->after('cash_submitted');
            $table->boolean('cash_verified')->default(false)->after('cash_submitted_at')
                ->comment('Admin/accountant has verified the cash');
            $table->timestamp('cash_verified_at')->nullable()->after('cash_verified');
            $table->unsignedBigInteger('verified_by')->nullable()->after('cash_verified_at');
            $table->foreign('verified_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropForeign(['verified_by']);
            $table->dropColumn([
                'cash_amount',
                'collected_amount',
                'payment_confirmed',
                'payment_confirmed_at',
                'payment_locked',
                'signature_data',
                'signature_captured_at',
                'payment_latitude',
                'payment_longitude',
                'gps_tracking_log',
                'has_discrepancy',
                'incident_report',
                'incident_reported_at',
                'cash_submitted',
                'cash_submitted_at',
                'cash_verified',
                'cash_verified_at',
                'verified_by',
            ]);
        });
    }
};
