<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->boolean('use_customer_address')->default(true)->after('delivery_date');
            $table->string('delivery_address', 500)->nullable()->after('use_customer_address');
            $table->string('delivery_city', 100)->nullable()->after('delivery_address');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'use_customer_address',
                'delivery_address',
                'delivery_city',
            ]);
        });
    }
};
