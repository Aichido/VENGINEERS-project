<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingClientForCommercialTest(): array
{
    $role = Role::firstOrCreate(['name' => 'client']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function actingCommercial(): array
{
    $role = Role::firstOrCreate(['name' => 'commercial']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function makeProductForCommercialTest(array $overrides = []): Product
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

it('rejects commercial orders listing without authentication', function () {
    $this->getJson('/api/commercial/orders')->assertStatus(401);
});

it('rejects commercial orders listing for a non-commercial role', function () {
    [$user, $token] = actingClientForCommercialTest();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/commercial/orders')
        ->assertStatus(403);
});

it('lists all orders for a commercial regardless of client', function () {
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest();

    $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 1]]]);

    $this->app['auth']->forgetGuards();

    [$commercial, $commercialToken] = actingCommercial();

    $response = $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->getJson('/api/commercial/orders');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(1);
});

it('filters commercial orders by status', function () {
    [$commercial, $token] = actingCommercial();
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest();

    $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 1]]]);

    $this->app['auth']->forgetGuards();

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/commercial/orders?status=validee');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(0);
});

it('validates an order, decrements stock, and records a stock movement', function () {
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest(['stock_qty' => 5]);

    $order = $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 2]]])
        ->json();

    $this->app['auth']->forgetGuards();

    [$commercial, $commercialToken] = actingCommercial();

    $response = $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), [
            'status' => 'validee',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('status', 'validee')
        ->assertJsonPath('commercial_id', $commercial->id);

    $this->assertDatabaseHas('products', [
        'id'        => $product->id,
        'stock_qty' => 3,
    ]);

    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $product->id,
        'type'       => 'sortie',
        'qty'        => 2,
        'user_id'    => $commercial->id,
    ]);
});

it('rejects validation when stock is insufficient', function () {
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest(['stock_qty' => 2]);

    $order = $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 2]]])
        ->json();

    $this->app['auth']->forgetGuards();

    // Le stock chute sous la quantité commandée après coup (ex: autre commande écoulée entre-temps)
    $product->update(['stock_qty' => 1]);

    [$commercial, $commercialToken] = actingCommercial();

    $response = $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), [
            'status' => 'validee',
        ]);

    $response->assertStatus(422);

    $this->assertDatabaseHas('products', [
        'id'        => $product->id,
        'stock_qty' => 1,
    ]);

    $this->assertDatabaseCount('stock_movements', 0);
});

it('does not decrement stock twice when re-validating an already validated order', function () {
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest(['stock_qty' => 5]);

    $order = $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 2]]])
        ->json();

    $this->app['auth']->forgetGuards();

    [$commercial, $commercialToken] = actingCommercial();

    $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'validee']);

    $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'validee'])
        ->assertStatus(200);

    $this->assertDatabaseHas('products', [
        'id'        => $product->id,
        'stock_qty' => 3,
    ]);

    $this->assertDatabaseCount('stock_movements', 1);
});

it('rejects an invalid status value', function () {
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest();

    $order = $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 1]]])
        ->json();

    $this->app['auth']->forgetGuards();

    [$commercial, $commercialToken] = actingCommercial();

    $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), [
            'status' => 'statut_inexistant',
        ])
        ->assertStatus(422);
});

it('shows order details for the commercial', function () {
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest();

    $order = $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 1]]])
        ->json();

    $this->app['auth']->forgetGuards();

    [$commercial, $commercialToken] = actingCommercial();

    $response = $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->getJson('/api/commercial/orders/' . rawurlencode($order['public_id']));

    $response->assertStatus(200)
        ->assertJsonPath('public_id', $order['public_id'])
        ->assertJsonPath('client.id', $client->id);
});

it('rejects order detail view for a non-commercial role', function () {
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest();

    $order = $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 1]]])
        ->json();

    $this->app['auth']->forgetGuards();

    $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->getJson('/api/commercial/orders/' . rawurlencode($order['public_id']))
        ->assertStatus(403);
});

it('cancels a pending order without touching stock', function () {
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest(['stock_qty' => 5]);

    $order = $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 2]]])
        ->json();

    $this->app['auth']->forgetGuards();

    [$commercial, $commercialToken] = actingCommercial();

    $response = $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), [
            'status' => 'annulee',
        ]);

    $response->assertStatus(200)->assertJsonPath('status', 'annulee');

    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock_qty' => 5]);
    $this->assertDatabaseCount('stock_movements', 0);
});

it('cancels a validated order and restores stock', function () {
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest(['stock_qty' => 5]);

    $order = $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 2]]])
        ->json();

    $this->app['auth']->forgetGuards();

    [$commercial, $commercialToken] = actingCommercial();

    $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'validee']);

    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock_qty' => 3]);

    $response = $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'annulee']);

    $response->assertStatus(200)->assertJsonPath('status', 'annulee');

    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock_qty' => 5]);

    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $product->id,
        'type'       => 'entree',
        'qty'        => 2,
        'reason'     => "Annulation commande {$order['public_id']}",
    ]);
});

it('ships a validated order', function () {
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest();

    $order = $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 1]]])
        ->json();

    $this->app['auth']->forgetGuards();

    [$commercial, $commercialToken] = actingCommercial();

    $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'validee']);

    $response = $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'expediee']);

    $response->assertStatus(200)->assertJsonPath('status', 'expediee');
});

it('delivers a shipped order', function () {
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest();

    $order = $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 1]]])
        ->json();

    $this->app['auth']->forgetGuards();

    [$commercial, $commercialToken] = actingCommercial();

    $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'validee']);
    $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'expediee']);

    $response = $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'livree']);

    $response->assertStatus(200)->assertJsonPath('status', 'livree');
});

it('rejects an out-of-order transition', function () {
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest();

    $order = $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 1]]])
        ->json();

    $this->app['auth']->forgetGuards();

    [$commercial, $commercialToken] = actingCommercial();

    // en_attente → expediee directement, sans passer par validee
    $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'expediee'])
        ->assertStatus(422);
});

it('rejects any transition from a terminal delivered order', function () {
    [$client, $clientToken] = actingClientForCommercialTest();
    $product = makeProductForCommercialTest();

    $order = $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/client/orders', ['items' => [['product_id' => $product->id, 'qty' => 1]]])
        ->json();

    $this->app['auth']->forgetGuards();

    [$commercial, $commercialToken] = actingCommercial();

    $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'validee']);
    $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'expediee']);
    $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'livree']);

    $this->withHeader('Authorization', "Bearer {$commercialToken}")
        ->putJson('/api/commercial/orders/' . rawurlencode($order['public_id']), ['status' => 'annulee'])
        ->assertStatus(422);
});