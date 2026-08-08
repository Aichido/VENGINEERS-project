<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use App\Notifications\LowStockAlert;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAdminForNotificationTest(): array
{
    $role = Role::firstOrCreate(['name' => 'admin']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function actingCommercialForNotificationTest(): array
{
    $role = Role::firstOrCreate(['name' => 'commercial']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function makeLowStockProductForNotificationTest(): Product
{
    $category = Category::firstOrCreate(
        ['slug' => 'cat-' . uniqid()],
        ['name' => 'Catégorie ' . uniqid()]
    );

    return Product::factory()->create(['category_id' => $category->id, 'stock_qty' => 0]);
}

it('rejects notifications listing without authentication', function () {
    $this->getJson('/api/admin/notifications')->assertStatus(401);
});

it('rejects notifications listing for a non-admin role', function () {
    [$commercial, $token] = actingCommercialForNotificationTest();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/notifications')
        ->assertStatus(403);
});

it('lists only the authenticated admin own notifications', function () {
    [$adminA, $tokenA] = actingAdminForNotificationTest();
    [$adminB, $tokenB] = actingAdminForNotificationTest();
    $product = makeLowStockProductForNotificationTest();

    $adminA->notify(new LowStockAlert($product));
    $adminB->notify(new LowStockAlert($product));
    $adminB->notify(new LowStockAlert($product));

    $response = $this->withHeader('Authorization', "Bearer {$tokenA}")
        ->getJson('/api/admin/notifications');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(1);
});

it('returns the correct unread count', function () {
    [$admin, $token] = actingAdminForNotificationTest();
    $product = makeLowStockProductForNotificationTest();

    $admin->notify(new LowStockAlert($product));
    $admin->notify(new LowStockAlert($product));

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/notifications/unread-count');

    $response->assertStatus(200)->assertJsonPath('count', 2);
});

it('marks a notification as read', function () {
    [$admin, $token] = actingAdminForNotificationTest();
    $product = makeLowStockProductForNotificationTest();

    $admin->notify(new LowStockAlert($product));
    $notificationId = $admin->notifications()->first()->id;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/admin/notifications/{$notificationId}/read");

    $response->assertStatus(200);

    $this->assertDatabaseHas('notifications', [
        'id' => $notificationId,
    ]);

    expect($admin->notifications()->find($notificationId)->read_at)->not->toBeNull();
});

it('rejects marking a notification as read for a non-admin role', function () {
    [$commercial, $token] = actingCommercialForNotificationTest();
    $product = makeLowStockProductForNotificationTest();

    [$admin] = actingAdminForNotificationTest();
    $admin->notify(new LowStockAlert($product));
    $notificationId = $admin->notifications()->first()->id;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/admin/notifications/{$notificationId}/read")
        ->assertStatus(403);
});