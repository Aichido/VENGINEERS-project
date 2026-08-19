<?php

// database/factories/InterventionFactory.php
namespace Database\Factories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class InterventionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'client_id' => User::factory()->state(function () {
                $clientRole = Role::firstOrCreate(['name' => 'client']);
                return ['role_id' => $clientRole->id];
            }),
            'technicien_id' => null,
            'titre' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'equipement' => null,
            'statut' => 'nouvelle',
            'priorite' => 'normale',
            'date_souhaitee' => null,
        ];
    }
}