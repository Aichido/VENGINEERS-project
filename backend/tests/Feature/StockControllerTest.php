<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use App\Notifications\LowStockAlert;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function actingCommercialForStockTest(): array
{
    $role = Role::firstOrCreate(['name' => 'commercial']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function actingClientForStockTest(): array
{
    $role = Role::firstOrCreate(['name' => 'client']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function makeCategoryForStockTest(): Category
{
    return Category::firstOrCreate(
        ['slug' => 'cat-' . uniqid()],
        ['name' => 'Catégorie ' . uniqid()]
    );
}

it('rejects stock listing without authentication', function () {
    $this->getJson('/api/commercial/stock')->assertStatus(401);
});

it('rejects stock listing for a non-commercial role', function () {
    [$user, $token] = actingClientForStockTest();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/commercial/stock')
        ->assertStatus(403);
});

it('lists products ordered by ascending stock quantity', function () {
    [$commercial, $token] = actingCommercialForStockTest();
    $category = makeCategoryForStockTest();

    Product::factory()->create(['category_id' => $category->id, 'stock_qty' => 20]);
    Product::factory()->create(['category_id' => $category->id, 'stock_qty' => 2]);
    Product::factory()->create(['category_id' => $category->id, 'stock_qty' => 10]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/commercial/stock');

    $response->assertStatus(200);
    expect($response->json('data.0.stock_qty'))->toBe(2);
});

it('filters stock by category', function () {
    [$commercial, $token] = actingCommercialForStockTest();
    $categoryA = makeCategoryForStockTest();
    $categoryB = makeCategoryForStockTest();

    Product::factory()->create(['category_id' => $categoryA->id]);
    Product::factory()->create(['category_id' => $categoryB->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/commercial/stock?category=' . $categoryA->id);

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(1);
});

it('notifies all admins when low stock alert is triggered', function () {
    Notification::fake();

    [$commercial, $token] = actingCommercialForStockTest();
    $adminRole = Role::firstOrCreate(['name' => 'admin']);
    $admin1 = User::factory()->create(['role_id' => $adminRole->id]);
    $admin2 = User::factory()->create(['role_id' => $adminRole->id]);

    $category = makeCategoryForStockTest();
    $product = Product::factory()->create(['category_id' => $category->id, 'stock_qty' => 0]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/commercial/stock/{$product->id}/notify-low-stock");

    $response->assertStatus(200);

    Notification::assertSentTo([$admin1, $admin2], LowStockAlert::class);
});

it('rejects low stock notification for a non-commercial role', function () {
    [$client, $token] = actingClientForStockTest();
    $category = makeCategoryForStockTest();
    $product = Product::factory()->create(['category_id' => $category->id]);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/commercial/stock/{$product->id}/notify-low-stock")
        ->assertStatus(403);
});