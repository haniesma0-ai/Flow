<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            [
                'code' => 'CLI-001',
                'name' => 'Auto Garage Marrakech',
                'email' => 'contact@autogarage.ma',
                'phone' => '+212 524-334455',
                'address' => '123 Boulevard Mohammed VI',
                'city' => 'Marrakech',
                'ice' => '001234567000089',
                'rc' => '123456',
                'credit_limit' => 50000.00,
                'is_active' => true,
            ],
            [
                'code' => 'CLI-002',
                'name' => 'Transport Rapide SA',
                'email' => 'achats@transportrapide.ma',
                'phone' => '+212 522-445566',
                'address' => '45 Avenue des FAR',
                'city' => 'Casablanca',
                'ice' => '001234567000090',
                'rc' => '234567',
                'credit_limit' => 75000.00,
                'is_active' => true,
            ],
            [
                'code' => 'CLI-003',
                'name' => 'Hôtel Atlas Palace',
                'email' => 'maintenance@atlas-palace.ma',
                'phone' => '+212 524-556677',
                'address' => 'Zone Industrielle Sidi Ghanem',
                'city' => 'Marrakech',
                'ice' => '001234567000091',
                'rc' => '345678',
                'credit_limit' => 60000.00,
                'is_active' => true,
            ],
            [
                'code' => 'CLI-004',
                'name' => 'Carrière du Sud',
                'email' => 'admin@carrieresud.ma',
                'phone' => '+212 528-667788',
                'address' => 'Route de Ouarzazate, Km 15',
                'city' => 'Marrakech',
                'ice' => '001234567000092',
                'rc' => '456789',
                'credit_limit' => 40000.00,
                'is_active' => true,
            ],
            [
                'code' => 'CLI-005',
                'name' => 'Société Minière Atlas',
                'email' => 'logistique@smatlas.ma',
                'phone' => '+212 524-778899',
                'address' => '88 Zone Industrielle Tassila',
                'city' => 'Agadir',
                'ice' => '001234567000093',
                'rc' => '567890',
                'credit_limit' => 100000.00,
                'is_active' => true,
            ],
        ];

        foreach ($customers as $customer) {
            Customer::updateOrCreate(
                ['code' => $customer['code']],
                $customer
            );
        }
    }
}
