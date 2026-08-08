<?php

use App\Models\Category;
use App\Models\Product;
use App\Notifications\LowStockAlert;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeProductForLowStockAlertTest(array $overrides = []): Product
{
    $category = Category::firstOrCreate(
        ['slug' => 'cat-' . uniqid()],
        ['name' => 'Catégorie ' . uniqid()]
    );

    return Product::factory()->create(array_merge([
        'category_id' => $category->id,
    ], $overrides));
}

it('routes via the database channel only', function () {
    $product = makeProductForLowStockAlertTest();
    $notification = new LowStockAlert($product);

    expect($notification->via((object) []))->toBe(['database']);
});

it('formats the correct database payload', function () {
    $product = makeProductForLowStockAlertTest([
        'name'      => 'Écran tactile test',
        'stock_qty' => 2,
    ]);

    $notification = new LowStockAlert($product);
    $data = $notification->toArray((object) []);

    expect($data)->toBe([
        'product_id'   => $product->id,
        'product_name' => 'Écran tactile test',
        'stock_qty'    => 2,
        'message'      => "Stock bas signalé pour « Écran tactile test » (2 restant(s)).",
    ]);
});