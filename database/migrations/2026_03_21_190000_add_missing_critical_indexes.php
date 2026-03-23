<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * These indexes address critical performance bottlenecks identified in the
     * performance analysis report. Each index targets specific slow queries.
     */
    public function up(): void
    {
        // 🔴 CRITICAL: users.role_id - Loaded by CheckRole middleware on EVERY request
        Schema::table('users', function (Blueprint $table) {
            if (!$this->indexExists('users', 'users_role_id_index')) {
                $table->index('role_id', 'users_role_id_index');
            }
        });

        // 🔴 CRITICAL: products table - Low stock checks in dashboard
        Schema::table('products', function (Blueprint $table) {
            if (!$this->indexExists('products', 'products_stock_min_stock_index')) {
                $table->index(['stock', 'min_stock'], 'products_stock_min_stock_index');
            }
            if (!$this->indexExists('products', 'products_is_active_index')) {
                $table->index('is_active', 'products_is_active_index');
            }
        });

        // 🔴 CRITICAL: orders composite index for dashboard queries
        Schema::table('orders', function (Blueprint $table) {
            if (!$this->indexExists('orders', 'orders_status_created_at_index')) {
                // DESC order for recent orders (ORDER BY created_at DESC)
                $table->index(['status', 'created_at'], 'orders_status_created_at_index');
            }
        });

        // 🔴 CRITICAL: deliveries composite for chauffeur filtering + status checking
        Schema::table('deliveries', function (Blueprint $table) {
            // Improve existing composite index or create if missing
            if (!$this->compositeIndexExists('deliveries', ['chauffeur_id', 'status'])) {
                $table->index(['chauffeur_id', 'status'], 'deliveries_chauffeur_status_index');
            }

            // Additional index for date range queries
            if (!$this->indexExists('deliveries', 'deliveries_created_at_index')) {
                $table->index('created_at', 'deliveries_created_at_index');
            }
        });

        // 🟡 MEDIUM: Improve notifications for unread count queries
        Schema::table('notifications', function (Blueprint $table) {
            // Already has [user_id, read] composite, but add read-only index for global queries
            if (!$this->indexExists('notifications', 'notifications_read_index')) {
                $table->index('read', 'notifications_read_index');
            }
        });

        // 🟡 MEDIUM: invoices for status filtering in list
        Schema::table('invoices', function (Blueprint $table) {
            if (!$this->indexExists('invoices', 'invoices_status_created_at_index')) {
                $table->index(['status', 'created_at'], 'invoices_status_created_at_index');
            }
        });

        // 🟡 MEDIUM: order_items for product performance analysis
        Schema::table('order_items', function (Blueprint $table) {
            if (!$this->indexExists('order_items', 'order_items_product_id_order_id_index')) {
                $table->index(['product_id', 'order_id'], 'order_items_product_id_order_id_index');
            }
        });

        // 🟡 MEDIUM: customers for search and filtering
        Schema::table('customers', function (Blueprint $table) {
            if (!$this->indexExists('customers', 'customers_is_active_index')) {
                $table->index('is_active', 'customers_is_active_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $this->dropIndexIfExists($table, 'users_role_id_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $this->dropIndexIfExists($table, 'products_stock_min_stock_index');
            $this->dropIndexIfExists($table, 'products_is_active_index');
        });

        Schema::table('orders', function (Blueprint $table) {
            $this->dropIndexIfExists($table, 'orders_status_created_at_index');
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $this->dropIndexIfExists($table, 'deliveries_chauffeur_status_index');
            $this->dropIndexIfExists($table, 'deliveries_created_at_index');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $this->dropIndexIfExists($table, 'notifications_read_index');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $this->dropIndexIfExists($table, 'invoices_status_created_at_index');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $this->dropIndexIfExists($table, 'order_items_product_id_order_id_index');
        });

        Schema::table('customers', function (Blueprint $table) {
            $this->dropIndexIfExists($table, 'customers_is_active_index');
        });
    }

    /**
     * Check if an index exists on a table
     */
    private function indexExists(string $table, string $indexName): bool
    {
        try {
            $indexes = \Illuminate\Support\Facades\DB::select(
                "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?",
                [\DB::getDatabaseName(), $table, $indexName]
            );
            return count($indexes) > 0;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Check if a composite index exists
     */
    private function compositeIndexExists(string $table, array $columns): bool
    {
        try {
            $indexCount = \Illuminate\Support\Facades\DB::select(
                "SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.STATISTICS 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME IN (?,?)",
                [\DB::getDatabaseName(), $table, $columns[0], $columns[1]]
            );
            return $indexCount[0]->count >= 2;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Helper to drop index if it exists
     */
    private function dropIndexIfExists(Blueprint $table, string $indexName): void
    {
        try {
            $table->dropIndex($indexName);
        } catch (\Exception $e) {
            // Index doesn't exist, that's fine
        }
    }
};
