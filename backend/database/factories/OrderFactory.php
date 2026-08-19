<?php

// database/factories/OrderFactory.php
namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'client_id' => User::factory(),
            'commercial_id' => null,
            'status' => 'en_attente',
            'total' => fake()->randomFloat(2, 10, 1000),
            // public_id est auto-genere par le modele (static::creating), pas besoin de le definir ici
        ];
    }
}
