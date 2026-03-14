<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'code' => 'HUI-001',
                'name' => 'Huile Moteur 5W30',
                'description' => 'Huile synthétique haute performance pour moteurs essence et diesel',
                'price' => 85.50,
                'tva_rate' => 20.00,
                'stock' => 450,
                'min_stock' => 100,
                'unit' => 'L',
                'is_active' => true,
            ],
            [
                'code' => 'HUI-002',
                'name' => 'Huile Moteur 10W40',
                'description' => 'Huile semi-synthétique pour moteurs diesel',
                'price' => 65.00,
                'tva_rate' => 20.00,
                'stock' => 320,
                'min_stock' => 80,
                'unit' => 'L',
                'is_active' => true,
            ],
            [
                'code' => 'HUI-003',
                'name' => 'Huile Transmission 80W90',
                'description' => 'Huile pour boîtes de vitesse et ponts',
                'price' => 45.00,
                'tva_rate' => 20.00,
                'stock' => 180,
                'min_stock' => 50,
                'unit' => 'L',
                'is_active' => true,
            ],
            [
                'code' => 'MAZ-001',
                'name' => 'Mazout FOD',
                'description' => 'Fioul domestique pour chauffage',
                'price' => 12.50,
                'tva_rate' => 20.00,
                'stock' => 5000,
                'min_stock' => 1000,
                'unit' => 'L',
                'is_active' => true,
            ],
            [
                'code' => 'LUB-001',
                'name' => 'Graisse Lithium EP2',
                'description' => 'Graisse multi-usage pour roulements et mécanismes',
                'price' => 35.00,
                'tva_rate' => 20.00,
                'stock' => 75,
                'min_stock' => 30,
                'unit' => 'Kg',
                'is_active' => true,
            ],
            [
                'code' => 'HUI-004',
                'name' => 'Huile Hydraulique ISO 46',
                'description' => 'Huile pour systèmes hydrauliques',
                'price' => 55.00,
                'tva_rate' => 20.00,
                'stock' => 25,
                'min_stock' => 50,
                'unit' => 'L',
                'is_active' => true,
            ],
            [
                'code' => 'GAZ-001',
                'name' => 'Gasoil 50',
                'description' => 'Gasoil standard pour véhicules diesel',
                'price' => 14.20,
                'tva_rate' => 20.00,
                'stock' => 8000,
                'min_stock' => 2000,
                'unit' => 'L',
                'is_active' => true,
            ],
            [
                'code' => 'HUI-005',
                'name' => 'Huile Moteur 15W40',
                'description' => 'Huile minérale pour moteurs industriels',
                'price' => 42.00,
                'tva_rate' => 20.00,
                'stock' => 600,
                'min_stock' => 150,
                'unit' => 'L',
                'is_active' => true,
            ],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(
                ['code' => $product['code']],
                $product
            );
        }
    }
}
