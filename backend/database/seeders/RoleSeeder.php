<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\User;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (['admin', 'commercial', 'technicien', 'client'] as $r) {
            Role::firstOrCreate(['name' => $r]);
        }

        User::firstOrCreate(
            ['email' => 'admin@vengineers.net'],
            [
                'name' => 'Admin',
                'password' => bcrypt('vengineers@123'),
                'role_id' => Role::where('name', 'admin')->first()->id,
            ]
        );

        User::firstOrCreate(
            ['email' => 'commercial@vengineers.net'],
            [
                'name' => 'Commercial',
                'password' => bcrypt('vengineers@123'),
                'role_id' => Role::where('name', 'commercial')->first()->id,
            ]
        );

        User::firstOrCreate(
            ['email' => 'technicien@vengineers.net'],
            [
                'name' => 'Technicien',
                'password' => bcrypt('vengineers@123'),
                'role_id' => Role::where('name', 'technicien')->first()->id,
            ]
        );
    }
}
