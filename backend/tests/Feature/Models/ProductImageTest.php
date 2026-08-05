<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// Plus de beforeEach avec delete() – RefreshDatabase nettoie tout automatiquement

it('can create a product image manually', function () {
    $category = Category::create(['name' => 'Électronique', 'slug' => 'electronique']);
    $product = Product::create([
        'name' => 'Smartphone',
        'description' => 'Un smartphone dernier cri',
        'price' => 599.99,
        'stock_qty' => 10,
        'category_id' => $category->id,
        'is_active' => true
    ]);

    $image = ProductImage::create([
        'product_id' => $product->id,
        'path' => 'images/smartphone.jpg',
        'thumbnail_path' => 'images/smartphone_thumb.jpg',
        'position' => 0,
        'is_primary' => true
    ]);

    expect($image)->toBeInstanceOf(ProductImage::class)
        ->and($image->product_id)->toBe($product->id)
        ->and($image->path)->toBe('images/smartphone.jpg')
        ->and($image->is_primary)->toBeTrue()
        ->and($image->position)->toBe(0);
});

it('belongs to a product', function () {
    $category = Category::create(['name' => 'Informatique', 'slug' => 'informatique']);
    $product = Product::create([
        'name' => 'Ordinateur portable',
        'description' => 'PC puissant',
        'price' => 1299.00,
        'stock_qty' => 5,
        'category_id' => $category->id,
        'is_active' => true
    ]);

    $image = ProductImage::create([
        'product_id' => $product->id,
        'path' => 'images/ordi.jpg',
        'thumbnail_path' => 'images/ordi_thumb.jpg',
        'position' => 1,
        'is_primary' => false
    ]);

    expect($image->product)->toBeInstanceOf(Product::class)
        ->and($image->product->id)->toBe($product->id)
        ->and($image->product->name)->toBe('Ordinateur portable');
});

it('has correct fillable attributes', function () {
    $image = new ProductImage();
    expect($image->getFillable())->toBe([
        'product_id', 'path', 'thumbnail_path', 'position', 'is_primary'
    ]);
});

it('has correct casts', function () {
    $category = Category::create(['name' => 'Accessoires', 'slug' => 'accessoires']);
    $product = Product::create([
        'name' => 'Souris',
        'description' => 'Souris ergonomique',
        'price' => 29.99,
        'stock_qty' => 20,
        'category_id' => $category->id,
        'is_active' => true
    ]);

    $image = ProductImage::create([
        'product_id' => $product->id,
        'path' => 'images/souris.jpg',
        'thumbnail_path' => 'images/souris_thumb.jpg',
        'position' => 2,
        'is_primary' => true
    ]);

    $image->refresh();
    expect($image->position)->toBeInt()
        ->and($image->is_primary)->toBeBool()
        ->and($image->is_primary)->toBeTrue();
});