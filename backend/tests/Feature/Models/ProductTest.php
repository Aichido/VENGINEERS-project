<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Role;
use App\Models\StockMovement;
use App\Models\User;

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('has correct fillable attributes', function () {
    $product = new Product();
    expect($product->getFillable())->toBe([
        'name',
        'description',
        'price',
        'stock_qty',
        'category_id',
        'is_active',
    ]);
});

it('has correct casts', function () {
    $category = Category::create(['name' => 'Test Cat', 'slug' => 'test-cat']);
    $product = Product::create([
        'name' => 'Test Product',
        'description' => 'Description',
        'price' => '99.99',
        'stock_qty' => '5',
        'category_id' => $category->id,
        'is_active' => '1',
    ]);

    $product->refresh();

    // price est une string avec 2 décimales
    expect($product->price)->toBeString()->and($product->price)->toBe('99.99');
    expect($product->stock_qty)->toBeInt()->and($product->stock_qty)->toBe(5);
    expect($product->is_active)->toBeBool()->and($product->is_active)->toBeTrue();
});
it('belongs to a category', function () {
    $category = Category::create(['name' => 'Cat', 'slug' => 'cat']);
    $product = Product::create([
        'name' => 'Test',
        'description' => 'Desc',
        'price' => 10,
        'stock_qty' => 1,
        'category_id' => $category->id,
        'is_active' => true,
    ]);

    expect($product->category)->toBeInstanceOf(Category::class)
        ->and($product->category->id)->toBe($category->id);
});

it('has many images', function () {
    $category = Category::create(['name' => 'Cat', 'slug' => 'cat']);
    $product = Product::create([
        'name' => 'Test',
        'description' => 'Desc',
        'price' => 10,
        'stock_qty' => 1,
        'category_id' => $category->id,
        'is_active' => true,
    ]);

    ProductImage::create([
        'product_id' => $product->id,
        'path' => 'img1.jpg',
        'thumbnail_path' => 'thumb1.jpg',
        'position' => 1,
        'is_primary' => false,
    ]);
    ProductImage::create([
        'product_id' => $product->id,
        'path' => 'img2.jpg',
        'thumbnail_path' => 'thumb2.jpg',
        'position' => 0,
        'is_primary' => true,
    ]);

    $images = $product->images;
    expect($images)->toHaveCount(2)
        ->and($images->first()->position)->toBe(0) // orderBy position
        ->and($images->first()->is_primary)->toBeTrue();
});

it('has a primary image', function () {
    $category = Category::create(['name' => 'Cat', 'slug' => 'cat']);
    $product = Product::create([
        'name' => 'Test',
        'description' => 'Desc',
        'price' => 10,
        'stock_qty' => 1,
        'category_id' => $category->id,
        'is_active' => true,
    ]);

    ProductImage::create([
        'product_id' => $product->id,
        'path' => 'img1.jpg',
        'thumbnail_path' => 'thumb1.jpg',
        'position' => 1,
        'is_primary' => false,
    ]);
    $primary = ProductImage::create([
        'product_id' => $product->id,
        'path' => 'img2.jpg',
        'thumbnail_path' => 'thumb2.jpg',
        'position' => 0,
        'is_primary' => true,
    ]);

    expect($product->primaryImage)->toBeInstanceOf(ProductImage::class)
        ->and($product->primaryImage->id)->toBe($primary->id);
});
it('has many stock movements', function () {
    $category = Category::create(['name' => 'Cat', 'slug' => 'cat']);
    $product = Product::create([
        'name' => 'Test',
        'description' => 'Desc',
        'price' => 10,
        'stock_qty' => 1,
        'category_id' => $category->id,
        'is_active' => true,
    ]);

    $role = Role::firstOrCreate(['name' => 'commercial']);
    $user = User::factory()->create(['role_id' => $role->id]);

    StockMovement::create([
        'product_id' => $product->id,
        'type'       => 'sortie',
        'qty'        => 1,
        'user_id'    => $user->id,
    ]);

    expect($product->stockMovements)->toHaveCount(1)
        ->and($product->stockMovements->first())->toBeInstanceOf(StockMovement::class);
});