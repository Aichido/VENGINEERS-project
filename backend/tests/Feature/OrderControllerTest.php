<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingClient(): array
{
    $role = Role::firstOrCreate(['name' => 'client']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function makeProduct(array $overrides = []): Product
{
    $category = Category::firstOrCreate(
        ['slug' => 'cat-' . uniqid()],
        ['name' => 'Catégorie ' . uniqid()]
    );

    return Product::factory()->create(array_merge([
        'category_id' => $category->id,
        'price'       => 100,
        'stock_qty'   => 10,
        'is_active'   => true,
    ], $overrides));
}

it('rejects order creation without authentication', function () {
    $this->postJson('/api/client/orders', ['items' => []])
        ->assertStatus(401);
});

it('creates an order with correct total computed server-side', function () {
    [$user, $token] = actingClient();
    $product = makeProduct(['price' => 250]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/orders', [
            'items' => [['product_id' => $product->id, 'qty' => 3]],
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('client_id', $user->id)
        ->assertJsonPath('status', 'en_attente')
        ->assertJsonPath('total', '750.00');

    $this->assertDatabaseHas('order_items', [
        'product_id' => $product->id,
        'qty'        => 3,
        'unit_price' => 250,
    ]);
});

it('ignores a client-supplied price and uses the database price', function () {
    [$user, $token] = actingClient();
    $product = makeProduct(['price' => 500]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/orders', [
            'items' => [[
                'product_id' => $product->id,
                'qty'        => 1,
                'unit_price' => 1, // tentative de triche, doit être ignorée
            ]],
        ]);

    $response->assertStatus(201)->assertJsonPath('total', '500.00');
});

it('rejects order with empty items', function () {
    [$user, $token] = actingClient();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/orders', ['items' => []])
        ->assertStatus(422);
});

it('rejects order with nonexistent product', function () {
    [$user, $token] = actingClient();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/orders', [
            'items' => [['product_id' => 999999, 'qty' => 1]],
        ])->assertStatus(422);
});

it('rejects order when quantity exceeds stock', function () {
    [$user, $token] = actingClient();
    $product = makeProduct(['stock_qty' => 2]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/orders', [
            'items' => [['product_id' => $product->id, 'qty' => 5]],
        ]);

    $response->assertStatus(422);
    $this->assertDatabaseCount('orders', 0);
});

it('does not persist a partial order when one item fails validation', function () {
    [$user, $token] = actingClient();
    $ok = makeProduct(['stock_qty' => 10]);
    $tooMuch = makeProduct(['stock_qty' => 1]);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/orders', [
            'items' => [
                ['product_id' => $ok->id, 'qty' => 1],
                ['product_id' => $tooMuch->id, 'qty' => 5],
            ],
        ])->assertStatus(422);

    $this->assertDatabaseCount('orders', 0);
    $this->assertDatabaseCount('order_items', 0);
});

it('lists only the authenticated client own orders', function () {
    [$userA, $tokenA] = actingClient();
    [$userB, $tokenB] = actingClient();
    $product = makeProduct();

    $this->withHeader('Authorization', "Bearer {$tokenA}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 1]]]);

    $this->app['auth']->forgetGuards();

    $this->withHeader('Authorization', "Bearer {$tokenB}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 1]]]);

    $this->app['auth']->forgetGuards();

    $response = $this->withHeader('Authorization', "Bearer {$tokenA}")
        ->getJson('/api/client/orders');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.client_id'))->toBe($userA->id);
});

it('forbids a client from viewing another client order', function () {
    [$userA, $tokenA] = actingClient();
    [$userB, $tokenB] = actingClient();
    $product = makeProduct();

    $order = $this->withHeader('Authorization', "Bearer {$tokenB}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 1]]])
        ->json();

    $this->app['auth']->forgetGuards();

    $this->withHeader('Authorization', "Bearer {$tokenA}")
    ->getJson('/api/client/orders/' . rawurlencode($order['public_id']))
    ->assertStatus(403);
});
it('rejects order access for a non-client role', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin']);
    $admin = User::factory()->create(['role_id' => $adminRole->id]);
    $token = $admin->createToken('test')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/orders', ['items' => []])
        ->assertStatus(403);
});
it('shows order details for the owning client', function () {
    [$user, $token] = actingClient();
    $product = makeProduct();

    $order = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 1]]])
        ->json();

    $this->app['auth']->forgetGuards();
    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/client/orders/' . rawurlencode($order['public_id']));

    $response->assertStatus(200)
        ->assertJsonPath('public_id', $order['public_id'])
        ->assertJsonPath('client_id', $user->id)
        ->assertJsonPath('items.0.product.id', $product->id);
});