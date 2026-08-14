<?php

// database/factories/ProductImageFactory.php
namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductImageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'path' => 'products/1/' . fake()->uuid() . '.webp',
            'thumbnail_path' => 'products/1/thumb_' . fake()->uuid() . '.webp',
            'position' => 0,
            'is_primary' => false,
        ];
    }
}
