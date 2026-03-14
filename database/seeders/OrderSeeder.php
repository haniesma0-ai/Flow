<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Delivery;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $commercial = User::whereHas('role', fn($q) => $q->where('name', 'commercial'))->first();
        $chauffeur = User::whereHas('role', fn($q) => $q->where('name', 'chauffeur'))->first();
        $admin = User::whereHas('role', fn($q) => $q->where('name', 'admin'))->first();

        if (!$commercial || !$chauffeur || !$admin) {
            return;
        }

        $products = Product::all()->keyBy('code');

        // --- Orders ---
        $ordersData = [
            ['CMD-2026-0001', 1, $commercial->id, 2685.00, 537.00, 3222.00, 'delivered', 'Livraison urgente', '2026-02-01 10:00:00', '2026-01-28 14:30:00'],
            ['CMD-2026-0002', 2, $commercial->id, 2250.00, 450.00, 2700.00, 'delivery', '', '2026-02-05 09:00:00', '2026-02-01 10:00:00'],
            ['CMD-2026-0003', 3, $commercial->id, 12500.00, 2500.00, 15000.00, 'confirmed', 'Livraison mensuelle', '2026-02-10 08:00:00', '2026-02-03 11:00:00'],
            ['CMD-2026-0004', 4, $commercial->id, 3250.00, 650.00, 3900.00, 'preparation', '', '2026-02-06 14:00:00', '2026-02-04 09:30:00'],
            ['CMD-2026-0005', 1, $commercial->id, 855.00, 171.00, 1026.00, 'draft', 'En attente de validation', null, '2026-02-05 16:00:00'],
        ];

        foreach ($ordersData as $d) {
            Order::updateOrCreate(
                ['order_number' => $d[0]],
                [
                    'customer_id' => $d[1],
                    'commercial_id' => $d[2],
                    'subtotal' => $d[3],
                    'total_tva' => $d[4],
                    'total' => $d[5],
                    'status' => $d[6],
                    'notes' => $d[7],
                    'delivery_date' => $d[8],
                    'created_at' => $d[9],
                    'updated_at' => now(),
                ]
            );
        }

        // --- Order Items ---
        $order1 = Order::where('order_number', 'CMD-2026-0001')->first();
        $order2 = Order::where('order_number', 'CMD-2026-0002')->first();
        $order3 = Order::where('order_number', 'CMD-2026-0003')->first();
        $order4 = Order::where('order_number', 'CMD-2026-0004')->first();
        $order5 = Order::where('order_number', 'CMD-2026-0005')->first();

        $itemsData = [
            [$order1->id, $products['HUI-001']->id, 20, 85.50, 20.00, 2052.00],
            [$order1->id, $products['HUI-002']->id, 15, 65.00, 20.00, 1170.00],
            [$order2->id, $products['HUI-003']->id, 50, 45.00, 20.00, 2700.00],
            [$order3->id, $products['MAZ-001']->id, 1000, 12.50, 20.00, 15000.00],
            [$order4->id, $products['LUB-001']->id, 30, 35.00, 20.00, 1260.00],
            [$order4->id, $products['HUI-004']->id, 40, 55.00, 20.00, 2640.00],
            [$order5->id, $products['HUI-001']->id, 10, 85.50, 20.00, 1026.00],
        ];

        foreach ($itemsData as $item) {
            OrderItem::updateOrCreate(
                ['order_id' => $item[0], 'product_id' => $item[1]],
                [
                    'quantity' => $item[2],
                    'price' => $item[3],
                    'tva_rate' => $item[4],
                    'total' => $item[5],
                ]
            );
        }

        // --- Deliveries ---
        $vehicle1 = \App\Models\Vehicle::where('license_plate', '12345-A-50')->first();
        $vehicle2 = \App\Models\Vehicle::where('license_plate', '67890-B-40')->first();
        $vehicle3 = \App\Models\Vehicle::where('license_plate', '11111-C-30')->first();

        if ($vehicle1 && $vehicle2 && $vehicle3) {
            Delivery::updateOrCreate(
                ['order_id' => $order1->id],
                [
                    'chauffeur_id' => $chauffeur->id,
                    'vehicle_id' => $vehicle1->id,
                    'status' => 'completed',
                    'planned_date' => '2026-02-01 10:00:00',
                    'actual_departure' => '2026-02-01 09:30:00',
                    'actual_arrival' => '2026-02-01 11:45:00',
                    'notes' => 'Livraison effectuée sans problème',
                    'latitude' => 31.6295,
                    'longitude' => -7.9811,
                ]
            );

            Delivery::updateOrCreate(
                ['order_id' => $order2->id],
                [
                    'chauffeur_id' => $chauffeur->id,
                    'vehicle_id' => $vehicle2->id,
                    'status' => 'in_progress',
                    'planned_date' => '2026-02-05 09:00:00',
                    'actual_departure' => '2026-02-05 08:15:00',
                    'notes' => 'En route vers Casablanca',
                    'latitude' => 33.5731,
                    'longitude' => -7.5898,
                ]
            );

            Delivery::updateOrCreate(
                ['order_id' => $order3->id],
                [
                    'chauffeur_id' => $chauffeur->id,
                    'vehicle_id' => $vehicle3->id,
                    'status' => 'planned',
                    'planned_date' => '2026-02-10 08:00:00',
                    'notes' => '',
                ]
            );
        }

        // --- Invoices ---
        Invoice::updateOrCreate(
            ['invoice_number' => 'FAC-2026-0001'],
            [
                'order_id' => $order1->id,
                'customer_id' => $order1->customer_id,
                'amount' => 3222.00,
                'paid_amount' => 3222.00,
                'status' => 'paid',
                'due_date' => '2026-03-01',
                'paid_at' => '2026-02-15 10:00:00',
            ]
        );

        $inv2 = Invoice::updateOrCreate(
            ['invoice_number' => 'FAC-2026-0002'],
            [
                'order_id' => $order2->id,
                'customer_id' => $order2->customer_id,
                'amount' => 2700.00,
                'paid_amount' => 0,
                'status' => 'pending',
                'due_date' => '2026-03-05',
            ]
        );

        // --- Payments ---
        $inv1 = Invoice::where('invoice_number', 'FAC-2026-0001')->first();
        Payment::updateOrCreate(
            ['invoice_id' => $inv1->id, 'reference' => 'VIR-2026-0215'],
            [
                'amount' => 3222.00,
                'payment_method' => 'bank_transfer',
                'payment_date' => '2026-02-15 10:00:00',
                'notes' => 'Paiement intégral par virement',
            ]
        );

        // --- Tasks ---
        Task::updateOrCreate(
            ['title' => 'Validation prix spécial Client Atlas'],
            [
                'description' => 'Demande de remise de 10% pour commande > 10 000L mazout',
                'status' => 'todo',
                'priority' => 'high',
                'created_by_id' => $commercial->id,
                'assigned_to_id' => $admin->id,
                'order_id' => $order3->id,
                'due_date' => '2026-02-08 17:00:00',
            ]
        );

        Task::updateOrCreate(
            ['title' => 'Commande urgente Carrière du Sud'],
            [
                'description' => 'Client demande livraison express pour demain',
                'status' => 'in_progress',
                'priority' => 'urgent',
                'created_by_id' => $commercial->id,
                'assigned_to_id' => $chauffeur->id,
                'order_id' => $order4->id,
                'due_date' => '2026-02-06 08:00:00',
            ]
        );

        Task::updateOrCreate(
            ['title' => 'Mise à jour stock huiles'],
            [
                'description' => 'Inventaire mensuel des huiles moteur',
                'status' => 'todo',
                'priority' => 'medium',
                'created_by_id' => $admin->id,
                'due_date' => '2026-02-10 17:00:00',
            ]
        );

        Task::updateOrCreate(
            ['title' => 'Relance paiement FAC-2026-0002'],
            [
                'description' => 'Envoyer relance pour facture impayée',
                'status' => 'done',
                'priority' => 'medium',
                'created_by_id' => $admin->id,
                'assigned_to_id' => $commercial->id,
            ]
        );
    }
}
