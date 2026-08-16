<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function actingAdminForProductTest(): User
{
    $adminRole = Role::firstOrCreate(['name' => 'admin']);
    $admin = User::factory()->create(['role_id' => $adminRole->id]);

    app('auth')->forgetGuards();

    return $admin;
}

function actingClientForProductTest(): User
{
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    app('auth')->forgetGuards();

    return $client;
}

// ---------- CRUD PRODUIT ----------

it('liste les produits pour un admin', function () {
    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    Product::factory()->count(3)->create();

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/products');

    $response->assertOk();
    expect($response->json('total'))->toBe(3);
});

it('cree un produit', function () {
    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $category = Category::factory()->create();

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/products', [
            'name' => 'Écran Test',
            'price' => 45000,
            'stock_qty' => 10,
            'category_id' => $category->id,
        ]);

    $response->assertCreated();
    $this->assertDatabaseHas('products', ['name' => 'Écran Test']);
});

it('rejette un produit avec une categorie inexistante', function () {
    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/products', [
            'name' => 'Écran Test',
            'price' => 45000,
            'stock_qty' => 10,
            'category_id' => 999,
        ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors('category_id');
});

it('met a jour un produit (champ partiel)', function () {
    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $product = Product::factory()->create(['price' => 100]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson("/api/admin/products/{$product->id}", ['price' => 150]);

    $response->assertOk();
    expect($response->json('price'))->toBe('150.00');
});

it('supprime un produit sans images', function () {
    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $product = Product::factory()->create();

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/admin/products/{$product->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('products', ['id' => $product->id]);
});

it('supprime un produit avec images et nettoie le disque', function () {
    Storage::fake('public');

    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $product = Product::factory()->create();
    $image = ProductImage::factory()->create([
        'product_id' => $product->id,
        'path' => "products/{$product->id}/fake.webp",
        'thumbnail_path' => "products/{$product->id}/thumb_fake.webp",
    ]);

    Storage::disk('public')->put($image->path, 'contenu-fake');
    Storage::disk('public')->put($image->thumbnail_path, 'contenu-fake-thumb');

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/admin/products/{$product->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('products', ['id' => $product->id]);
    $this->assertDatabaseMissing('product_images', ['id' => $image->id]); // cascade FK
    Storage::disk('public')->assertMissing($image->path);
    Storage::disk('public')->assertMissing($image->thumbnail_path);
});

it('refuse la gestion des produits a un non-admin', function () {
    $client = actingClientForProductTest();
    $token = $client->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/products');

    $response->assertForbidden();
});

// ---------- IMAGES ----------

it('upload une image et la definit comme primary automatiquement', function () {
    Storage::fake('public');

    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $product = Product::factory()->create();
    $file = UploadedFile::fake()->image('test.jpg', 800, 600);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/admin/products/{$product->id}/images", ['image' => $file]);

    $response->assertCreated();
    expect($response->json('is_primary'))->toBeTrue();
    expect($response->json('position'))->toBe(0);
    expect($response->json('path'))->toEndWith('.webp');

    Storage::disk('public')->assertExists($response->json('path'));
    Storage::disk('public')->assertExists($response->json('thumbnail_path'));
});

it('bloque le upload au dela de 5 images', function () {
    Storage::fake('public');

    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $product = Product::factory()->create();
    ProductImage::factory()->count(5)->create(['product_id' => $product->id]);

    $file = UploadedFile::fake()->image('test.jpg', 800, 600);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/admin/products/{$product->id}/images", ['image' => $file]);

    $response->assertUnprocessable();
    expect($response->json('message'))->toContain('maximum de 5');
});

it('rejette un fichier non-image', function () {
    Storage::fake('public');

    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $product = Product::factory()->create();
    $file = UploadedFile::fake()->create('document.pdf', 100);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/admin/products/{$product->id}/images", ['image' => $file]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors('image');
});

it('definit une nouvelle image comme primary et retire lancienne', function () {
    Storage::fake('public');

    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $product = Product::factory()->create();
    $img1 = ProductImage::factory()->create(['product_id' => $product->id, 'is_primary' => true, 'position' => 0]);
    $img2 = ProductImage::factory()->create(['product_id' => $product->id, 'is_primary' => false, 'position' => 1]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/admin/products/{$product->id}/images/{$img2->id}/set-primary");

    $response->assertOk();
    expect($img1->fresh()->is_primary)->toBeFalse();
    expect($img2->fresh()->is_primary)->toBeTrue();
});

it('reordonne les images dun produit', function () {
    Storage::fake('public');

    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $product = Product::factory()->create();
    $img1 = ProductImage::factory()->create(['product_id' => $product->id, 'position' => 0]);
    $img2 = ProductImage::factory()->create(['product_id' => $product->id, 'position' => 1]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/admin/products/{$product->id}/images/reorder", [
            'image_ids' => [$img2->id, $img1->id],
        ]);

    $response->assertOk();
    expect($img2->fresh()->position)->toBe(0);
    expect($img1->fresh()->position)->toBe(1);
});

it('supprime une image non-primary et nettoie le disque', function () {
    Storage::fake('public');

    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $product = Product::factory()->create();
    $image = ProductImage::factory()->create([
        'product_id' => $product->id,
        'is_primary' => false,
        'path' => "products/{$product->id}/fake.webp",
        'thumbnail_path' => "products/{$product->id}/thumb_fake.webp",
    ]);
    Storage::disk('public')->put($image->path, 'contenu');
    Storage::disk('public')->put($image->thumbnail_path, 'contenu-thumb');

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/admin/products/{$product->id}/images/{$image->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('product_images', ['id' => $image->id]);
    Storage::disk('public')->assertMissing($image->path);
});

it('promeut automatiquement une nouvelle primary apres suppression de lancienne', function () {
    Storage::fake('public');

    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $product = Product::factory()->create();
    $primaryImg = ProductImage::factory()->create([
        'product_id' => $product->id,
        'is_primary' => true,
        'position' => 0,
    ]);
    $nextImg = ProductImage::factory()->create([
        'product_id' => $product->id,
        'is_primary' => false,
        'position' => 1,
    ]);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/admin/products/{$product->id}/images/{$primaryImg->id}")
        ->assertNoContent();

    expect($nextImg->fresh()->is_primary)->toBeTrue();
});

it('rejette une action sur une image nappartenant pas au produit', function () {
    Storage::fake('public');

    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $productA = Product::factory()->create();
    $productB = Product::factory()->create();
    $image = ProductImage::factory()->create(['product_id' => $productA->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/admin/products/{$productB->id}/images/{$image->id}");

    $response->assertNotFound();
});

it('refuse le upload dimage a un non-admin', function () {
    Storage::fake('public');

    $client = actingClientForProductTest();
    $token = $client->createToken('test')->plainTextToken;

    $product = Product::factory()->create();
    $file = UploadedFile::fake()->image('test.jpg');

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/admin/products/{$product->id}/images", ['image' => $file]);

    $response->assertForbidden();
});
it('filtre les produits par categorie', function () {
    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $categorie1 = Category::factory()->create();
    $categorie2 = Category::factory()->create();
    Product::factory()->create(['category_id' => $categorie1->id]);
    Product::factory()->create(['category_id' => $categorie2->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson("/api/admin/products?category={$categorie1->id}");

    $response->assertOk();
    expect($response->json('total'))->toBe(1);
});

it('filtre les produits par recherche sur le nom', function () {
    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    Product::factory()->create(['name' => 'Écran Dell 65']);
    Product::factory()->create(['name' => 'Vidéoprojecteur Epson']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/products?search=Dell');

    $response->assertOk();
    expect($response->json('total'))->toBe(1);
});

it('rejette set-primary sur une image nappartenant pas au produit', function () {
    Storage::fake('public');

    $admin = actingAdminForProductTest();
    $token = $admin->createToken('test')->plainTextToken;

    $productA = Product::factory()->create();
    $productB = Product::factory()->create();
    $image = ProductImage::factory()->create(['product_id' => $productA->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/admin/products/{$productB->id}/images/{$image->id}/set-primary");

    $response->assertNotFound();
});