<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->unsignedBigInteger('incident_reported_by')->nullable()->after('incident_reported_at');
            $table->enum('incident_status', ['open', 'in_review', 'resolved'])->nullable()->after('incident_reported_by');
            $table->text('incident_resolution_notes')->nullable()->after('incident_status');
            $table->timestamp('incident_resolved_at')->nullable()->after('incident_resolution_notes');
            $table->unsignedBigInteger('incident_resolved_by')->nullable()->after('incident_resolved_at');

            $table->foreign('incident_reported_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('incident_resolved_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['incident_status', 'incident_reported_at']);
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropForeign(['incident_reported_by']);
            $table->dropForeign(['incident_resolved_by']);
            $table->dropIndex(['incident_status', 'incident_reported_at']);

            $table->dropColumn([
                'incident_reported_by',
                'incident_status',
                'incident_resolution_notes',
                'incident_resolved_at',
                'incident_resolved_by',
            ]);
        });
    }
};
