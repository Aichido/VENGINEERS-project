<?php

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderHistory;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    ActivityLog::truncate();
    OrderHistory::truncate();

    $this->app['auth']->forgetGuards();
});

function makeUserForOrderLogsTest(string $roleName): User
{
    $role = Role::firstOrCreate(['name' => $roleName]);

    return User::factory()->create(['role_id' => $role->id]);
}

function makeProductForOrderLogsTest(int $stockQty = 10): Product
{
    $category = Category::create(['name' => 'Écrans tactiles', 'slug' => 'ecrans-tactiles']);

    return Product::create([
        'name' => 'Écran 55"',
        'description' => 'Écran interactif 55 pouces',
        'price' => 500,
        'stock_qty' => $stockQty,
        'category_id' => $category->id,
        'is_active' => true,
    ]);
}

it('logs an activity_log entry when a client creates an order', function () {
    $client = makeUserForOrderLogsTest('client');
    $product = makeProductForOrderLogsTest();

    $response = $this->actingAs($client, 'sanctum')->postJson('/api/client/orders', [
        'items' => [
            ['product_id' => $product->id, 'qty' => 2],
        ],
    ]);

    $response->assertCreated();

    expect(ActivityLog::where('action', 'order_created')->count())->toBe(1);

    $log = ActivityLog::where('action', 'order_created')->first();
    expect($log->user_id)->toBe($client->id);
    expect($log->entity)->toBe('order');
});

it('does not log anything when order creation fails due to insufficient stock', function () {
    $client = makeUserForOrderLogsTest('client');
    $product = makeProductForOrderLogsTest(stockQty: 1);

    $response = $this->actingAs($client, 'sanctum')->postJson('/api/client/orders', [
        'items' => [
            ['product_id' => $product->id, 'qty' => 999],
        ],
    ]);

    $response->assertStatus(422);
    expect(ActivityLog::where('action', 'order_created')->count())->toBe(0);
});

it('logs an order_history entry when a commercial validates an order', function () {
    $client = makeUserForOrderLogsTest('client');
    $commercial = makeUserForOrderLogsTest('commercial');
    $product = makeProductForOrderLogsTest();

    $order = Order::create(['client_id' => $client->id, 'status' => 'en_attente', 'total' => 1000]);
    OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'qty' => 2, 'unit_price' => 500]);

    $response = $this->actingAs($commercial, 'sanctum')
        ->putJson('/api/commercial/orders/' . rawurlencode($order->public_id), ['status' => 'validee']);

    $response->assertOk();

    expect(OrderHistory::count())->toBe(1);

    $history = OrderHistory::first();
    expect($history->order_id)->toBe($order->id);
    expect($history->status_from)->toBe('en_attente');
    expect($history->status_to)->toBe('validee');
    expect($history->changed_by)->toBe($commercial->id);
});

it('does not log a new order_history entry on an idempotent status resubmission', function () {
    $client = makeUserForOrderLogsTest('client');
    $commercial = makeUserForOrderLogsTest('commercial');
    $product = makeProductForOrderLogsTest();

    $order = Order::create(['client_id' => $client->id, 'status' => 'validee', 'total' => 500]);
    OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'qty' => 1, 'unit_price' => 500]);

    $response = $this->actingAs($commercial, 'sanctum')
        ->putJson('/api/commercial/orders/' . rawurlencode($order->public_id), ['status' => 'validee']);

    $response->assertOk();
    expect(OrderHistory::count())->toBe(0);
});

it('does not log anything on an invalid status transition', function () {
    $client = makeUserForOrderLogsTest('client');
    $commercial = makeUserForOrderLogsTest('commercial');

    $order = Order::create(['client_id' => $client->id, 'status' => 'livree', 'total' => 500]);

    $response = $this->actingAs($commercial, 'sanctum')
        ->putJson('/api/commercial/orders/' . rawurlencode($order->public_id), ['status' => 'en_attente']);

    $response->assertStatus(422);
    expect(OrderHistory::count())->toBe(0);
});
