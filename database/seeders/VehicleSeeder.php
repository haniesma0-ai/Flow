<?php

namespace Database\Seeders;

use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        $vehicles = [
            [
                'license_plate' => '12345-A-50',
                'model' => 'Actros 2545',
                'brand' => 'Mercedes',
                'capacity' => 20000,
                'is_active' => true,
            ],
            [
                'license_plate' => '67890-B-40',
                'model' => 'FM 460',
                'brand' => 'Volvo',
                'capacity' => 18000,
                'is_active' => true,
            ],
            [
                'license_plate' => '11111-C-30',
                'model' => 'Premium 450',
                'brand' => 'Renault',
                'capacity' => 15000,
                'is_active' => true,
            ],
        ];

        foreach ($vehicles as $vehicle) {
            Vehicle::updateOrCreate(
                ['license_plate' => $vehicle['license_plate']],
                $vehicle
            );
        }
    }
}
