<?php

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('has the correct fillable attributes', function () {
    $order = new Order();

    expect($order->getFillable())->toEqual([
        'client_id',
        'commercial_id',
        'status',
        'total',
        'public_id',
    ]);
});

it('casts total to a decimal', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    $order = Order::create([
        'client_id' => $client->id,
        'status'    => 'en_attente',
        'total'     => 199.5,
    ]);

    expect($order->total)->toBe('199.50');
});

it('belongs to a client', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    $order = Order::create([
        'client_id' => $client->id,
        'status'    => 'en_attente',
        'total'     => 0,
    ]);

    expect($order->client)->toBeInstanceOf(User::class);
    expect($order->client->id)->toBe($client->id);
});

it('belongs to a commercial when assigned', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $commercialRole = Role::firstOrCreate(['name' => 'commercial']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);
    $commercial = User::factory()->create(['role_id' => $commercialRole->id]);

    $order = Order::create([
        'client_id'     => $client->id,
        'commercial_id' => $commercial->id,
        'status'        => 'validee',
        'total'         => 0,
    ]);

    expect($order->commercial)->toBeInstanceOf(User::class);
    expect($order->commercial->id)->toBe($commercial->id);
});

it('has a null commercial when not yet assigned', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    $order = Order::create([
        'client_id' => $client->id,
        'status'    => 'en_attente',
        'total'     => 0,
    ]);

    expect($order->commercial)->toBeNull();
});

it('has many items', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);
    $product = Product::factory()->create();

    $order = Order::create([
        'client_id' => $client->id,
        'status'    => 'en_attente',
        'total'     => 100,
    ]);

    OrderItem::create([
        'order_id'   => $order->id,
        'product_id' => $product->id,
        'qty'        => 1,
        'unit_price' => 100,
    ]);

    expect($order->items)->toHaveCount(1);
    expect($order->items->first())->toBeInstanceOf(OrderItem::class);
});