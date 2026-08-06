<?php

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeOrderForItem(): Order
{
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    return Order::create([
        'client_id' => $client->id,
        'status'    => 'en_attente',
        'total'     => 0,
    ]);
}

it('has the correct fillable attributes', function () {
    $item = new OrderItem();

    expect($item->getFillable())->toEqual([
        'order_id',
        'product_id',
        'qty',
        'unit_price',
    ]);
});

it('casts unit_price to a decimal', function () {
    $order = makeOrderForItem();
    $product = Product::factory()->create();

    $item = OrderItem::create([
        'order_id'   => $order->id,
        'product_id' => $product->id,
        'qty'        => 2,
        'unit_price' => 49.9,
    ]);

    expect($item->unit_price)->toBe('49.90');
});

it('belongs to an order', function () {
    $order = makeOrderForItem();
    $product = Product::factory()->create();

    $item = OrderItem::create([
        'order_id'   => $order->id,
        'product_id' => $product->id,
        'qty'        => 1,
        'unit_price' => 10,
    ]);

    expect($item->order)->toBeInstanceOf(Order::class);
    expect($item->order->id)->toBe($order->id);
});

it('belongs to a product', function () {
    $order = makeOrderForItem();
    $product = Product::factory()->create();

    $item = OrderItem::create([
        'order_id'   => $order->id,
        'product_id' => $product->id,
        'qty'        => 1,
        'unit_price' => 10,
    ]);

    expect($item->product)->toBeInstanceOf(Product::class);
    expect($item->product->id)->toBe($product->id);
});