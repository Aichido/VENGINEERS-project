<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAdminForCategoryTest(): User
{
    $adminRole = Role::firstOrCreate(['name' => 'admin']);
    $admin = User::factory()->create(['role_id' => $adminRole->id]);

    app('auth')->forgetGuards();

    return $admin;
}

function actingClientForCategoryTest(): User
{
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    app('auth')->forgetGuards();

    return $client;
}

it('cree une categorie avec slug auto-genere', function () {
    $admin = actingAdminForCategoryTest();
    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/categories', ['name' => 'Écrans interactifs']);

    $response->assertCreated();
    expect($response->json('slug'))->toBe('ecrans-interactifs');
});

it('cree une categorie avec un slug fourni explicitement', function () {
    $admin = actingAdminForCategoryTest();
    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/categories', ['name' => 'Test', 'slug' => 'mon-slug-perso']);

    $response->assertCreated();
    expect($response->json('slug'))->toBe('mon-slug-perso');
});

it('rejette un slug deja utilise', function () {
    $admin = actingAdminForCategoryTest();
    $token = $admin->createToken('test')->plainTextToken;

    Category::factory()->create(['slug' => 'deja-pris']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/categories', ['name' => 'Test', 'slug' => 'deja-pris']);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors('slug');
});

it('met a jour une categorie', function () {
    $admin = actingAdminForCategoryTest();
    $token = $admin->createToken('test')->plainTextToken;

    $category = Category::factory()->create(['name' => 'Ancien nom']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson("/api/admin/categories/{$category->id}", ['name' => 'Nouveau nom']);

    $response->assertOk();
    expect($response->json('name'))->toBe('Nouveau nom');
});

it('supprime une categorie sans produits lies', function () {
    $admin = actingAdminForCategoryTest();
    $token = $admin->createToken('test')->plainTextToken;

    $category = Category::factory()->create();

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/admin/categories/{$category->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('categories', ['id' => $category->id]);
});

it('bloque la suppression dune categorie avec des produits lies', function () {
    $admin = actingAdminForCategoryTest();
    $token = $admin->createToken('test')->plainTextToken;

    $category = Category::factory()->create();
    Product::factory()->create(['category_id' => $category->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/admin/categories/{$category->id}");

    $response->assertUnprocessable();
    $this->assertDatabaseHas('categories', ['id' => $category->id]);
});

it('refuse la gestion des categories a un non-admin', function () {
    $client = actingClientForCategoryTest();
    $token = $client->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/categories', ['name' => 'Test']);

    $response->assertForbidden();
});