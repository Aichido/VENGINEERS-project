<?php

use App\Http\Middleware\CheckRole;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'commercial']);
    Role::firstOrCreate(['name' => 'technicien']);
    Role::firstOrCreate(['name' => 'client']);
});

function makeRequestAs(?User $user): Request
{
    $request = Request::create('/api/test-route', 'GET');
    $request->setUserResolver(fn () => $user);

    return $request;
}

$next = fn (Request $request) => response()->json(['ok' => true]);

test('laisse passer un utilisateur dont le rôle correspond exactement', function () use ($next) {
    $role = Role::where('name', 'admin')->firstOrFail();
    $user = User::factory()->create(['role_id' => $role->id]);

    $middleware = new CheckRole();
    $response = $middleware->handle(makeRequestAs($user), $next, 'admin');

    expect($response->getStatusCode())->toBe(200);
});

test('laisse passer un utilisateur dont le rôle fait partie de plusieurs rôles autorisés', function () use ($next) {
    $role = Role::where('name', 'technicien')->firstOrFail();
    $user = User::factory()->create(['role_id' => $role->id]);

    $middleware = new CheckRole();
    // Simule une route protégée par plusieurs rôles : role:admin,technicien
    $response = $middleware->handle(makeRequestAs($user), $next, 'admin', 'technicien');

    expect($response->getStatusCode())->toBe(200);
});

test('bloque un utilisateur dont le rôle ne correspond à aucun rôle autorisé', function () use ($next) {
    $role = Role::where('name', 'client')->firstOrFail();
    $user = User::factory()->create(['role_id' => $role->id]);

    $middleware = new CheckRole();
    $response = $middleware->handle(makeRequestAs($user), $next, 'admin');

    expect($response->getStatusCode())->toBe(403);
    expect($response->getData(true))->toMatchArray(['message' => 'Accès refusé']);
});

test('bloque une requête sans utilisateur authentifié', function () use ($next) {
    $middleware = new CheckRole();
    $response = $middleware->handle(makeRequestAs(null), $next, 'admin');

    expect($response->getStatusCode())->toBe(403);
});

// NOTE : pas de test pour "role_id inexistant" — la contrainte de clé
// étrangère `users_role_id_foreign` empêche structurellement ce cas en base
// (confirmé le 23/07/2026 : QueryException / Integrity constraint violation
// 1452 dès l'insertion). Le code défensif `! $user->role` dans CheckRole
// reste utile en ceinture-bretelles, mais ce scénario précis est
// inatteignable tant que cette contrainte existe.