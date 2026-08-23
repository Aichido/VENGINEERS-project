<?php

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

beforeEach(function () {
    ActivityLog::truncate();

    $this->app['auth']->forgetGuards();
});

function makeUserForAdminActivityLogsTest(string $roleName): User
{
    $role = Role::firstOrCreate(['name' => $roleName]);

    return User::factory()->create(['role_id' => $role->id]);
}

// ---------- Users ----------

it('logs user_created, user_updated, toggle and user_deleted', function () {
    $admin = makeUserForAdminActivityLogsTest('admin');
    Role::firstOrCreate(['name' => 'technicien']);

    $this->actingAs($admin, 'sanctum')->postJson('/api/admin/users', [
        'name' => 'Jean Technicien',
        'email' => 'jean.technicien@vengineers.mu',
        'password' => 'Password123!',
        'role' => 'technicien',
    ])->assertCreated();

    expect(ActivityLog::where('action', 'user_created')->count())->toBe(1);

    $createdUser = User::where('email', 'jean.technicien@vengineers.mu')->first();

    $this->actingAs($admin, 'sanctum')->putJson("/api/admin/users/{$createdUser->id}", [
        'name' => 'Jean T. Modifié',
    ])->assertOk();

    expect(ActivityLog::where('action', 'user_updated')->count())->toBe(1);

    $this->actingAs($admin, 'sanctum')
        ->patchJson("/api/admin/users/{$createdUser->id}/toggle-active")
        ->assertOk();

    expect(ActivityLog::whereIn('action', ['user_activated', 'user_deactivated'])->count())->toBe(1);

    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/admin/users/{$createdUser->id}")
        ->assertNoContent();

    expect(ActivityLog::where('action', 'user_deleted')->count())->toBe(1);
});

it('logs the acting admin as user_id, not the target user', function () {
    $admin = makeUserForAdminActivityLogsTest('admin');
    Role::firstOrCreate(['name' => 'technicien']);

    $this->actingAs($admin, 'sanctum')->postJson('/api/admin/users', [
        'name' => 'Jean Technicien',
        'email' => 'jean2.technicien@vengineers.mu',
        'password' => 'Password123!',
        'role' => 'technicien',
    ])->assertCreated();

    $log = ActivityLog::where('action', 'user_created')->first();

    expect($log->user_id)->toBe($admin->id);
});

// ---------- Categories ----------

it('logs category_created, category_updated and category_deleted', function () {
    $admin = makeUserForAdminActivityLogsTest('admin');

    $this->actingAs($admin, 'sanctum')->postJson('/api/admin/categories', [
        'name' => 'Accessoires',
    ])->assertCreated();

    expect(ActivityLog::where('action', 'category_created')->count())->toBe(1);

    $category = Category::where('name', 'Accessoires')->first();

    $this->actingAs($admin, 'sanctum')->putJson("/api/admin/categories/{$category->id}", [
        'name' => 'Accessoires Pro',
    ])->assertOk();

    expect(ActivityLog::where('action', 'category_updated')->count())->toBe(1);

    $this->actingAs($admin, 'sanctum')->deleteJson("/api/admin/categories/{$category->id}")
        ->assertNoContent();

    expect(ActivityLog::where('action', 'category_deleted')->count())->toBe(1);
});

it('does not log anything when category deletion is blocked by a foreign key', function () {
    $admin = makeUserForAdminActivityLogsTest('admin');

    $category = Category::create(['name' => 'Écrans', 'slug' => 'ecrans']);
    Product::create([
        'name' => 'Écran 65"',
        'description' => 'Écran interactif',
        'price' => 800,
        'stock_qty' => 5,
        'category_id' => $category->id,
        'is_active' => true,
    ]);

    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/admin/categories/{$category->id}")
        ->assertStatus(422);

    expect(ActivityLog::where('action', 'category_deleted')->count())->toBe(0);
});

// ---------- Products ----------

it('logs product_created, product_updated and product_deleted', function () {
    $admin = makeUserForAdminActivityLogsTest('admin');
    $category = Category::create(['name' => 'Écrans', 'slug' => 'ecrans']);

    $this->actingAs($admin, 'sanctum')->postJson('/api/admin/products', [
        'name' => 'Écran 75"',
        'description' => 'Écran interactif 75 pouces',
        'price' => 1200,
        'stock_qty' => 10,
        'category_id' => $category->id,
        'is_active' => true,
    ])->assertCreated();

    expect(ActivityLog::where('action', 'product_created')->count())->toBe(1);

    $product = Product::where('name', 'Écran 75"')->first();

    $this->actingAs($admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
        'price' => 1100,
    ])->assertOk();

    expect(ActivityLog::where('action', 'product_updated')->count())->toBe(1);

    $this->actingAs($admin, 'sanctum')->deleteJson("/api/admin/products/{$product->id}")
        ->assertNoContent();

    expect(ActivityLog::where('action', 'product_deleted')->count())->toBe(1);
});

it('logs image actions on a product (add, set primary, reorder, delete)', function () {
    $admin = makeUserForAdminActivityLogsTest('admin');
    $category = Category::create(['name' => 'Écrans', 'slug' => 'ecrans-2']);

    $product = Product::create([
        'name' => 'Écran 55"',
        'description' => 'Écran interactif',
        'price' => 500,
        'stock_qty' => 10,
        'category_id' => $category->id,
        'is_active' => true,
    ]);

    \Illuminate\Support\Facades\Storage::fake('public');

    $image1 = UploadedFile::fake()->image('produit1.jpg');
    $image2 = UploadedFile::fake()->image('produit2.jpg');

    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/admin/products/{$product->id}/images", ['image' => $image1])
        ->assertCreated();

    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/admin/products/{$product->id}/images", ['image' => $image2])
        ->assertCreated();

    expect(ActivityLog::where('action', 'product_image_added')->count())->toBe(2);

    $images = $product->images()->orderBy('position')->get();

    $this->actingAs($admin, 'sanctum')
        ->patchJson("/api/admin/products/{$product->id}/images/{$images[1]->id}/set-primary")
        ->assertOk();

    expect(ActivityLog::where('action', 'product_image_set_primary')->count())->toBe(1);

    $this->actingAs($admin, 'sanctum')
        ->patchJson("/api/admin/products/{$product->id}/images/reorder", [
            'image_ids' => [$images[1]->id, $images[0]->id],
        ])->assertOk();

    expect(ActivityLog::where('action', 'product_images_reordered')->count())->toBe(1);

    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/admin/products/{$product->id}/images/{$images[0]->id}")
        ->assertNoContent();

    expect(ActivityLog::where('action', 'product_image_deleted')->count())->toBe(1);
});

// ---------- Stock bas (Commercial) ----------

it('logs low_stock_alert_triggered with the commercial as actor', function () {
    $commercial = makeUserForAdminActivityLogsTest('commercial');
    makeUserForAdminActivityLogsTest('admin'); // destinataire de la notification

    $category = Category::create(['name' => 'Écrans', 'slug' => 'ecrans-3']);
    $product = Product::create([
        'name' => 'Écran 43"',
        'description' => 'Écran interactif',
        'price' => 300,
        'stock_qty' => 1,
        'category_id' => $category->id,
        'is_active' => true,
    ]);

    $this->actingAs($commercial, 'sanctum')
        ->postJson("/api/commercial/stock/{$product->id}/notify-low-stock")
        ->assertOk();

    $log = ActivityLog::where('action', 'low_stock_alert_triggered')->first();

    expect($log)->not->toBeNull();
    expect($log->user_id)->toBe($commercial->id);
    expect($log->entity_id)->toBe($product->id);
});

// ---------- Contact public ----------

it('logs contact_message_submitted with a null user_id (public, unauthenticated)', function () {
    $response = $this->postJson('/api/contact', [
        'name' => 'Visiteur',
        'email' => 'visiteur@example.com',
        'subject' => 'Demande de devis',
        'message' => 'Bonjour, je souhaite un devis pour un écran interactif.',
    ]);

    $response->assertCreated();

    $log = ActivityLog::where('action', 'contact_message_submitted')->first();

    expect($log)->not->toBeNull();
    expect($log->user_id)->toBeNull();
    expect($log->meta['email'])->toBe('visiteur@example.com');
});