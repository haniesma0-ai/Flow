<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::where('name', 'admin')->first();
        $managerRole = Role::where('name', 'manager')->first();
        $commercialRole = Role::where('name', 'commercial')->first();
        $chauffeurRole = Role::where('name', 'chauffeur')->first();
        $userRole = Role::where('name', 'user')->first();

        $defaultPassword = Hash::make('password');

        $users = [
            [
                'name' => 'Admin FoxPetroleum',
                'email' => 'admin@foxpetroleum.com',
                'role_id' => $adminRole->id,
                'phone' => '+212 522-000001',
            ],
            [
                'name' => 'Manager FoxPetroleum',
                'email' => 'manager@foxpetroleum.com',
                'role_id' => $managerRole->id,
                'phone' => '+212 522-000002',
            ],
            [
                'name' => 'Sara Moussaoui',
                'email' => 'commercial@foxpetroleum.com',
                'role_id' => $commercialRole->id,
                'phone' => '+212 522-000003',
            ],
            [
                'name' => 'Karim El Amrani',
                'email' => 'chauffeur@foxpetroleum.com',
                'role_id' => $chauffeurRole->id,
                'phone' => '+212 522-000004',
            ],
            [
                'name' => 'Client Test',
                'email' => 'client@foxpetroleum.com',
                'role_id' => $userRole->id,
                'phone' => '+212 522-000005',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => $defaultPassword,
                    'role_id' => $userData['role_id'],
                    'phone' => $userData['phone'],
                    'is_active' => true,
                ]
            );
        }
    }
}
