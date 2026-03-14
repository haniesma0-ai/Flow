<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'admin',
                'description' => 'Administrator with full access',
            ],
            [
                'name' => 'manager',
                'description' => 'Manager with operational access',
            ],
            [
                'name' => 'commercial',
                'description' => 'Commercial user for sales',
            ],
            [
                'name' => 'chauffeur',
                'description' => 'Driver for deliveries',
            ],
            [
                'name' => 'client',
                'description' => 'Client who can view their orders and profile',
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['name' => $role['name']],
                $role
            );
        }
    }
}
