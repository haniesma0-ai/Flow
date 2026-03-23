<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add indexes for better query performance on dashboard
        Schema::table('orders', function (Blueprint $table) {
            // Only add if it doesn't already exist
            if (!$this->indexExists('orders', 'orders_status_index')) {
                $table->index('status');
            }
            if (!$this->indexExists('orders', 'orders_created_at_index')) {
                $table->index('created_at');
            }
            if (!$this->indexExists('orders', 'orders_customer_id_index')) {
                $table->index('customer_id');
            }
            if (!$this->indexExists('orders', 'orders_commercial_id_index')) {
                $table->index('commercial_id');
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (!$this->indexExists('order_items', 'order_items_product_id_index')) {
                $table->index('product_id');
            }
            if (!$this->indexExists('order_items', 'order_items_order_id_index')) {
                $table->index('order_id');
            }
        });

        Schema::table('deliveries', function (Blueprint $table) {
            if (!$this->indexExists('deliveries', 'deliveries_status_index')) {
                $table->index('status');
            }
            if (!$this->indexExists('deliveries', 'deliveries_planned_date_index')) {
                $table->index('planned_date');
            }
            if (!$this->indexExists('deliveries', 'deliveries_order_id_index')) {
                $table->index('order_id');
            }
            if (!$this->indexExists('deliveries', 'deliveries_chauffeur_id_index')) {
                $table->index('chauffeur_id');
            }
            if (!$this->indexExists('deliveries', 'deliveries_vehicle_id_index')) {
                $table->index('vehicle_id');
            }
            // Composite index - check with specific name
            if (!$this->compositeIndexExists('deliveries', ['chauffeur_id', 'status'])) {
                $table->index(['chauffeur_id', 'status']);
            }
        });

        Schema::table('invoices', function (Blueprint $table) {
            if (!$this->indexExists('invoices', 'invoices_status_index')) {
                $table->index('status');
            }
            if (!$this->indexExists('invoices', 'invoices_due_date_index')) {
                $table->index('due_date');
            }
            if (!$this->indexExists('invoices', 'invoices_order_id_index')) {
                $table->index('order_id');
            }
        });

        Schema::table('notifications', function (Blueprint $table) {
            if (!$this->indexExists('notifications', 'notifications_user_id_index')) {
                $table->index('user_id');
            }
            if (!$this->compositeIndexExists('notifications', ['user_id', 'read'])) {
                $table->index(['user_id', 'read']); // Composite index for unread count
            }
            if (!$this->indexExists('notifications', 'notifications_created_at_index')) {
                $table->index('created_at');
            }
        });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        try {
            $indexes = \Illuminate\Support\Facades\DB::select(
                "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?",
                [\DB::getDatabaseName(), $table, $indexName]
            );
            return count($indexes) > 0;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function compositeIndexExists(string $table, array $columns): bool
    {
        try {
            $columnStr = implode(',', $columns);
            // This is a simplified check - just verify any key contains these columns
            $keys = \Illuminate\Support\Facades\DB::select(
                "SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                [\DB::getDatabaseName(), $table]
            );

            // Check if there's an index with all these columns
            foreach ($keys as $key) {
                $cols = \Illuminate\Support\Facades\DB::select(
                    "SELECT GROUP_CONCAT(COLUMN_NAME) as cols FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?",
                    [\DB::getDatabaseName(), $table, $key->INDEX_NAME]
                );
                if (!empty($cols) && strpos($cols[0]->cols, $columns[0]) !== false) {
                    return true;
                }
            }
            return false;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe drop with error suppression
        try {
            Schema::table('orders', function (Blueprint $table) {
                try {
                    $table->dropIndex(['status']);
                } catch (\Exception $e) {
                }
                try {
                    $table->dropIndex(['created_at']);
                } catch (\Exception $e) {
                }
                try {
                    $table->dropIndex(['customer_id']);
                } catch (\Exception $e) {
                }
                try {
                    $table->dropIndex(['commercial_id']);
                } catch (\Exception $e) {
                }
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('order_items', function (Blueprint $table) {
                try {
                    $table->dropIndex(['product_id']);
                } catch (\Exception $e) {
                }
                try {
                    $table->dropIndex(['order_id']);
                } catch (\Exception $e) {
                }
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('deliveries', function (Blueprint $table) {
                try {
                    $table->dropIndex(['status']);
                } catch (\Exception $e) {
                }
                try {
                    $table->dropIndex(['planned_date']);
                } catch (\Exception $e) {
                }
                try {
                    $table->dropIndex(['order_id']);
                } catch (\Exception $e) {
                }
                try {
                    $table->dropIndex(['chauffeur_id']);
                } catch (\Exception $e) {
                }
                try {
                    $table->dropIndex(['vehicle_id']);
                } catch (\Exception $e) {
                }
                try {
                    $table->dropIndex(['chauffeur_id', 'status']);
                } catch (\Exception $e) {
                }
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('invoices', function (Blueprint $table) {
                try {
                    $table->dropIndex(['status']);
                } catch (\Exception $e) {
                }
                try {
                    $table->dropIndex(['due_date']);
                } catch (\Exception $e) {
                }
                try {
                    $table->dropIndex(['order_id']);
                } catch (\Exception $e) {
                }
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('notifications', function (Blueprint $table) {
                try {
                    $table->dropIndex(['user_id']);
                } catch (\Exception $e) {
                }
                try {
                    $table->dropIndex(['user_id', 'read']);
                } catch (\Exception $e) {
                }
                try {
                    $table->dropIndex(['created_at']);
                } catch (\Exception $e) {
                }
            });
        } catch (\Exception $e) {
        }
    }
};
