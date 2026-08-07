<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'        => $this->faker->words(3, true),
            'description' => $this->faker->paragraph(),
            'price'       => $this->faker->randomFloat(2, 50, 5000),
            'stock_qty'   => $this->faker->numberBetween(0, 50),
            'category_id' => Category::factory(),
            'is_active'   => true,
        ];
    }
}