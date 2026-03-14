<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('customer_id')->constrained();
            $table->foreignId('commercial_id')->constrained('users');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('total_tva', 12, 2);
            $table->decimal('total', 12, 2);
            $table->enum('status', ['draft', 'confirmed', 'preparation', 'delivery', 'delivered', 'cancelled'])->default('draft');
            $table->text('notes')->nullable();
            $table->timestamp('delivery_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

