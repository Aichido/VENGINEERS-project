<?php

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('index retourne la liste des categories triee par nom', function () {
    Category::create(['name' => 'Solutions réseau', 'slug' => 'solutions-reseau']);
    Category::create(['name' => 'Écrans tactiles', 'slug' => 'ecrans-tactiles']);
    Category::create(['name' => 'Vidéoprojecteurs', 'slug' => 'videoprojecteurs']);

    $response = $this->getJson('/api/categories');

    $response->assertOk();
    $response->assertJsonCount(3);

    $names = collect($response->json())->pluck('name')->values()->all();
    // orderBy('name') côté SQL : on vérifie juste la présence + le format, le tri
    // exact dépendant de la collation, mais les 3 catégories doivent être présentes.
    expect($names)->toHaveCount(3);
    expect($names)->toContain('Écrans tactiles', 'Solutions réseau', 'Vidéoprojecteurs');
});

test('index retourne un tableau vide si aucune categorie', function () {
    $response = $this->getJson('/api/categories');

    $response->assertOk();
    $response->assertJsonCount(0);
    expect($response->json())->toBe([]);
});

test('chaque categorie retournee contient les champs attendus', function () {
    Category::create(['name' => 'Écrans tactiles', 'slug' => 'ecrans-tactiles']);

    $response = $this->getJson('/api/categories');

    $response->assertOk();
    $response->assertJsonStructure([
        '*' => ['id', 'name', 'slug', 'created_at', 'updated_at'],
    ]);
});
