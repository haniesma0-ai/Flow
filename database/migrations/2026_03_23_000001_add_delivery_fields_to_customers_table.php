<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->text('delivery_address')->nullable()->after('city');
            $table->string('delivery_city')->nullable()->after('delivery_address');
            $table->boolean('billing_same_as_delivery')->default(true)->after('delivery_city');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['delivery_address', 'delivery_city', 'billing_same_as_delivery']);
        });
    }
};
