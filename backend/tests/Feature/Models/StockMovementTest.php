<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeProductForStockMovementTest(): Product
{
    $category = Category::firstOrCreate(
        ['slug' => 'cat-' . uniqid()],
        ['name' => 'Catégorie ' . uniqid()]
    );

    return Product::factory()->create(['category_id' => $category->id]);
}

function makeCommercialForStockMovementTest(): User
{
    $role = Role::firstOrCreate(['name' => 'commercial']);

    return User::factory()->create(['role_id' => $role->id]);
}

it('has the correct fillable attributes', function () {
    $movement = new StockMovement();

    expect($movement->getFillable())->toEqual([
        'product_id',
        'type',
        'qty',
        'reason',
        'user_id',
    ]);
});

it('casts qty to an integer', function () {
    $product = makeProductForStockMovementTest();
    $user = makeCommercialForStockMovementTest();

    $movement = StockMovement::create([
        'product_id' => $product->id,
        'type'       => 'sortie',
        'qty'        => '5',
        'reason'     => 'Test',
        'user_id'    => $user->id,
    ]);

    expect($movement->qty)->toBeInt();
    expect($movement->qty)->toBe(5);
});

it('belongs to a product', function () {
    $product = makeProductForStockMovementTest();
    $user = makeCommercialForStockMovementTest();

    $movement = StockMovement::create([
        'product_id' => $product->id,
        'type'       => 'entree',
        'qty'        => 3,
        'user_id'    => $user->id,
    ]);

    expect($movement->product)->toBeInstanceOf(Product::class);
    expect($movement->product->id)->toBe($product->id);
});

it('belongs to a user', function () {
    $product = makeProductForStockMovementTest();
    $user = makeCommercialForStockMovementTest();

    $movement = StockMovement::create([
        'product_id' => $product->id,
        'type'       => 'sortie',
        'qty'        => 1,
        'user_id'    => $user->id,
    ]);

    expect($movement->user)->toBeInstanceOf(User::class);
    expect($movement->user->id)->toBe($user->id);
});

it('allows a null reason', function () {
    $product = makeProductForStockMovementTest();
    $user = makeCommercialForStockMovementTest();

    $movement = StockMovement::create([
        'product_id' => $product->id,
        'type'       => 'entree',
        'qty'        => 2,
        'user_id'    => $user->id,
    ]);

    expect($movement->reason)->toBeNull();
});