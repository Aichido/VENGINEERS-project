<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Foundation\Testing\RefreshDatabase;

beforeEach(function () {
    // Supprimer dans l'ordre inverse des dépendances
    ProductImage::query()->delete();
    Product::query()->delete();
    Category::query()->delete();
});

uses(RefreshDatabase::class);

function createCategory(?string $name = null): Category
{
    $name ??= 'Catégorie '.uniqid();

    return Category::create([
        'name' => $name,
        'slug' => str($name)->slug(),
    ]);
}

function createProduct(array $attributes = []): Product
{
    $category = $attributes['category_id'] ?? createCategory()->id;

    return Product::create(array_merge([
        'name' => 'Produit test',
        'description' => 'Description du produit test',
        'price' => 100,
        'stock_qty' => 10,
        'category_id' => $category,
        'is_active' => true,
    ], $attributes, ['category_id' => $category]));
}

function attachImages(Product $product, int $count = 2): void
{
    for ($i = 0; $i < $count; $i++) {
        ProductImage::create([
            'product_id' => $product->id,
            'path' => "https://picsum.photos/800/600?random={$i}",
            'thumbnail_path' => "https://picsum.photos/200/150?random={$i}",
            'position' => $i,
            'is_primary' => $i === 0,
        ]);
    }
}

// --- index() ---

test('index retourne uniquement les produits actifs, paginés à 9 par défaut', function () {
    createProduct(['name' => 'Actif 1', 'is_active' => true]);
    createProduct(['name' => 'Actif 2', 'is_active' => true]);
    createProduct(['name' => 'Inactif', 'is_active' => false]);

    $response = $this->getJson('/api/products');

    $response->assertOk();
    $response->assertJsonPath('total', 2);
    $response->assertJsonCount(2, 'data');

    $names = collect($response->json('data'))->pluck('name');
    expect($names)->not->toContain('Inactif');
});

test('index exclut explicitement les produits is_active=false du listing', function () {
    $inactive = createProduct(['name' => 'Produit désactivé', 'is_active' => false]);

    $response = $this->getJson('/api/products');

    $response->assertOk();
    $ids = collect($response->json('data'))->pluck('id');
    expect($ids)->not->toContain($inactive->id);
});

test('index respecte la pagination par défaut (9 par page)', function () {
    for ($i = 1; $i <= 15; $i++) {
        createProduct(['name' => "Produit {$i}"]);
    }

    $expectedTotal = Product::where('is_active', true)->count();
    expect($expectedTotal)->toBe(15);

    $response = $this->getJson('/api/products');

    $response->assertOk();
    $response->assertJsonCount(min(9, $expectedTotal), 'data');
    $response->assertJsonPath('total', $expectedTotal);
    $response->assertJsonPath('last_page', (int) ceil($expectedTotal / 9));
});

test('index respecte un per_page personnalisé', function () {
    for ($i = 1; $i <= 15; $i++) {
        createProduct(['name' => "Produit {$i}"]);
    }

    $response = $this->getJson('/api/products?per_page=5');

    $response->assertOk();
    $response->assertJsonCount(5, 'data');
    $response->assertJsonPath('total', 15);
    $response->assertJsonPath('last_page', 3);
});

test('index plafonne per_page à 50 même si une valeur plus grande est demandée', function () {
    for ($i = 1; $i <= 60; $i++) {
        createProduct(['name' => "Produit {$i}"]);
    }

    $response = $this->getJson('/api/products?per_page=999');

    $response->assertOk();
    $response->assertJsonCount(50, 'data');
});

test('index ramène per_page à 1 si une valeur nulle ou négative est demandée', function () {
    for ($i = 1; $i <= 3; $i++) {
        createProduct(['name' => "Produit {$i}"]);
    }

    $responseZero = $this->getJson('/api/products?per_page=0');
    $responseZero->assertOk();
    $responseZero->assertJsonCount(1, 'data');

    $responseNegative = $this->getJson('/api/products?per_page=-5');
    $responseNegative->assertOk();
    $responseNegative->assertJsonCount(1, 'data');
});

test('index filtre par category', function () {
    $catA = createCategory('Vidéoprojecteurs');
    $catB = createCategory('Solutions réseau');

    createProduct(['name' => 'Produit A', 'category_id' => $catA->id]);
    createProduct(['name' => 'Produit B', 'category_id' => $catB->id]);

    $response = $this->getJson("/api/products?category={$catA->id}");

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.name', 'Produit A');
});

test('index filtre par min_price et max_price', function () {
    createProduct(['name' => 'Pas cher', 'price' => 50]);
    createProduct(['name' => 'Prix moyen', 'price' => 150]);
    createProduct(['name' => 'Cher', 'price' => 500]);

    $response = $this->getJson('/api/products?min_price=100&max_price=200');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.name', 'Prix moyen');
});

test('index filtre par search sur le nom et la description', function () {
    createProduct(['name' => 'Écran tactile 55 pouces', 'description' => 'Grand écran']);
    createProduct(['name' => 'Vidéoprojecteur', 'description' => 'Compatible écran tactile']);
    createProduct(['name' => 'Routeur réseau', 'description' => 'Solution réseau']);

    $response = $this->getJson('/api/products?search=écran');

    $response->assertOk();
    $response->assertJsonCount(2, 'data');
});

test('index combine plusieurs filtres (category + prix + search)', function () {
    $cat = createCategory('Écrans tactiles');
    createProduct([
        'name' => 'Écran tactile pro',
        'description' => 'Modèle professionnel',
        'category_id' => $cat->id,
        'price' => 300,
    ]);
    createProduct([
        'name' => 'Écran tactile basique',
        'description' => 'Modèle simple',
        'category_id' => $cat->id,
        'price' => 50,
    ]);
    createProduct([
        'name' => 'Autre écran',
        'description' => 'Non concerné',
        'price' => 300,
    ]);

    $response = $this->getJson("/api/products?category={$cat->id}&min_price=200&max_price=400&search=pro");

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.name', 'Écran tactile pro');
});

// --- show() ---

test('show retourne le produit avec sa category et ses images', function () {
    $category = createCategory();
    $product = createProduct(['category_id' => $category->id]);
    attachImages($product, 2);

    $response = $this->getJson("/api/products/{$product->id}");

    $response->assertOk();
    $response->assertJsonPath('id', $product->id);
    $response->assertJsonPath('category.id', $category->id);
    $response->assertJsonCount(2, 'images');
});

test('show retourne 404 pour un produit inactif', function () {
    $product = createProduct(['is_active' => false]);

    $response = $this->getJson("/api/products/{$product->id}");

    $response->assertNotFound();
    $response->assertJson(['message' => 'Produit introuvable']);
});

test('show retourne 404 pour un produit inexistant', function () {
    $response = $this->getJson('/api/products/999999');

    $response->assertNotFound();
    $response->assertJson(['message' => 'Produit introuvable']);
});