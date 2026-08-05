<?php


use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);


it('can create a category manually', function () {
    $category = Category::create([
        'name' => 'Informatique',
        'slug' => 'informatique'
    ]);

    expect($category)->toBeInstanceOf(Category::class)
        ->and($category->name)->toBe('Informatique')
        ->and($category->slug)->toBe('informatique');
});

it('has a products relationship', function () {
    $category = Category::create([
        'name' => 'Réseaux',
        'slug' => 'reseaux'
    ]);

    $product = Product::create([
        'name' => 'Routeur Cisco',
        'description' => 'Routeur professionnel',
        'price' => 199.99,
        'stock_qty' => 10,
        'category_id' => $category->id,
        'is_active' => true
    ]);

    expect($category->products)->toHaveCount(1)
        ->and($category->products->first()->name)->toBe('Routeur Cisco');
});

it('has the correct fillable attributes', function () {
    $category = new Category();
    expect($category->getFillable())->toBe(['name', 'slug']);
});