<?php
// routes/api.php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CareerController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\DiscountController;
use App\Http\Controllers\Api\IncidentController;
use Illuminate\Support\Facades\Route;

Route::middleware('cors')->group(function () {
    // ── Public auth routes ────────────────────────────────────
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/contact', [ContactController::class, 'send']);
    Route::get('/careers/public', [CareerController::class, 'publicIndex']);

    // Handle preflight OPTIONS requests
    Route::options('/{any}', function () {
        return response()->json([], 200);
    })->where('any', '.*');

    // ── Protected routes ──────────────────────────────────────
    Route::middleware('auth:api')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('/auth/password', [AuthController::class, 'changePassword']);

        // ── Dashboard (all authenticated) ─────────────────────
        Route::get('/stats/dashboard', [DashboardController::class, 'dashboard']);
        Route::get('/stats/sales', [DashboardController::class, 'sales']);
        Route::get('/stats/products', [DashboardController::class, 'products']);

        // ── Notifications (all authenticated) ─────────────────
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
        Route::delete('/notifications', [NotificationController::class, 'clearAll']);

        // ── Vehicles & Chauffeurs (for dropdowns) ─────────────
        Route::get('/vehicles', function () {
            $vehicles = \App\Models\Vehicle::where('is_active', true)->get();
            return response()->json([
                'success' => true,
                'data' => $vehicles->map(fn($v) => [
                    'id' => $v->id,
                    'registration' => $v->license_plate,
                    'brand' => $v->brand,
                    'model' => $v->model,
                    'capacity' => $v->capacity,
                ]),
            ]);
        });
        Route::get('/chauffeurs', function () {
            $chauffeurs = \App\Models\User::whereHas('role', fn($q) => $q->where('name', 'chauffeur'))->get();
            return response()->json([
                'success' => true,
                'data' => $chauffeurs->map(fn($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'phone' => $u->phone,
                ]),
            ]);
        });

        // ── Orders ─────────────────────────────────────────────
        // All authenticated users can view orders (index + show)
        Route::get('orders', [OrderController::class, 'index']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
        // Only admin, manager, commercial can create/update/delete
        Route::middleware('checkrole:admin,manager,commercial')->group(function () {
            Route::post('orders', [OrderController::class, 'store']);
            Route::put('orders/{order}', [OrderController::class, 'update']);
            Route::delete('orders/{order}', [OrderController::class, 'destroy']);
            Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
        });

        // ── Products (admin, manager, commercial) ─────────────
        Route::middleware('checkrole:admin,manager,commercial')->group(function () {
            Route::apiResource('products', ProductController::class);
        });

        // ── Customers (admin, manager, commercial) ────────────
        Route::middleware('checkrole:admin,manager,commercial')->group(function () {
            Route::apiResource('customers', CustomerController::class);
        });

        // ── Deliveries ────────────────────────────────────────
        // Admin real-time driver tracking (MUST be before {delivery} wildcard)
        Route::middleware('checkrole:admin,manager')->group(function () {
            Route::get('/deliveries/track-drivers', [DeliveryController::class, 'trackDrivers']);
        });
        // Chauffeurs can list & view their own + update status + COD operations
        Route::middleware('checkrole:admin,manager,commercial,chauffeur')->group(function () {
            Route::get('deliveries', [DeliveryController::class, 'index']);
            Route::get('deliveries/{delivery}', [DeliveryController::class, 'show']);
            Route::patch('/deliveries/{delivery}/status', [DeliveryController::class, 'updateStatus']);
            Route::post('/deliveries/{delivery}/confirm-payment', [DeliveryController::class, 'confirmPayment']);
            Route::post('/deliveries/{delivery}/capture-signature', [DeliveryController::class, 'captureSignature']);
            Route::post('/deliveries/{delivery}/update-location', [DeliveryController::class, 'updateLocation']);
            Route::post('/deliveries/cash-summary', [DeliveryController::class, 'submitCashSummary']);
        });
        // Only admin/manager/commercial can create/update/delete deliveries + verify cash
        Route::middleware('checkrole:admin,manager,commercial')->group(function () {
            Route::post('deliveries', [DeliveryController::class, 'store']);
            Route::put('deliveries/{delivery}', [DeliveryController::class, 'update']);
            Route::delete('deliveries/{delivery}', [DeliveryController::class, 'destroy']);
            Route::post('/deliveries/{delivery}/verify-cash', [DeliveryController::class, 'verifyCash']);
        });

        // ── Invoices (admin, manager, commercial) ─────────────
        Route::middleware('checkrole:admin,manager,commercial')->group(function () {
            Route::apiResource('invoices', InvoiceController::class);
            Route::patch('/invoices/{invoice}/status', [InvoiceController::class, 'updateStatus']);
            Route::post('/invoices/{invoice}/payments', [InvoiceController::class, 'addPayment']);
        });

        // ── Discounts (admin, manager) ───────────────────────
        Route::middleware('checkrole:admin,manager')->group(function () {
            Route::apiResource('admin/discounts', DiscountController::class);
        });

        // ── Incidents ─────────────────────────────────────────
        Route::middleware('checkrole:admin,manager,chauffeur')->group(function () {
            Route::get('/incidents', [IncidentController::class, 'index']);
            Route::get('/incidents/{delivery}', [IncidentController::class, 'show']);
            Route::post('/deliveries/{delivery}/incident', [IncidentController::class, 'store']);
            Route::put('/incidents/{delivery}', [IncidentController::class, 'update']);
            Route::delete('/incidents/{delivery}', [IncidentController::class, 'destroy']);
        });

        // ── Tasks (all authenticated) ─────────────────────────
        Route::apiResource('tasks', TaskController::class);
        Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus']);

        // ── Client routes (browse products, place orders, view own orders) ──
        Route::middleware('checkrole:client,user')->prefix('client')->group(function () {
            // Products catalog (read-only)
            Route::get('/products', [ProductController::class, 'index']);
            Route::get('/products/{product}', [ProductController::class, 'show']);

            // Client orders
            Route::get('/orders', [\App\Http\Controllers\Api\ClientOrderController::class, 'index']);
            Route::get('/orders/{order}', [\App\Http\Controllers\Api\ClientOrderController::class, 'show']);
            Route::post('/orders', [\App\Http\Controllers\Api\ClientOrderController::class, 'store']);
        });

        // ── Admin-only routes ─────────────────────────────────
        Route::middleware('checkrole:admin')->group(function () {
            Route::get('/admin/users', [AdminUserController::class, 'index']);
            Route::post('/admin/users', [AdminUserController::class, 'store']);
            Route::put('/admin/users/{user}', [AdminUserController::class, 'update']);
            Route::delete('/admin/users/{user}', [AdminUserController::class, 'destroy']);

            // Vehicle management
            Route::get('/admin/vehicles', [VehicleController::class, 'index']);
            Route::post('/admin/vehicles', [VehicleController::class, 'store']);
            Route::put('/admin/vehicles/{vehicle}', [VehicleController::class, 'update']);
            Route::delete('/admin/vehicles/{vehicle}', [VehicleController::class, 'destroy']);

            // Career management
            Route::get('/admin/careers', [CareerController::class, 'index']);
            Route::post('/admin/careers', [CareerController::class, 'store']);
            Route::get('/admin/careers/{career}', [CareerController::class, 'show']);
            Route::put('/admin/careers/{career}', [CareerController::class, 'update']);
            Route::delete('/admin/careers/{career}', [CareerController::class, 'destroy']);
        });
    });
});

