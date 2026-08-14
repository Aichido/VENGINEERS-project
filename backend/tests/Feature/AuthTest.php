<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed minimal des rôles nécessaires (équivalent de RoleSeeder)
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'commercial']);
    Role::firstOrCreate(['name' => 'technicien']);
    Role::firstOrCreate(['name' => 'client']);
});

function createUserWithRole(string $roleName, array $overrides = []): User
{
    $role = Role::where('name', $roleName)->firstOrFail();

    return User::factory()->create(array_merge([
        'role_id' => $role->id,
        'password' => Hash::make('Test@1234'),
    ], $overrides));
}

// ---------------------------------------------------------------------
// Test 1 : Register force toujours le rôle "client"
// ---------------------------------------------------------------------
test('register force le rôle client même si un autre rôle est envoyé', function () {
    $adminRole = Role::where('name', 'admin')->firstOrFail();

    $response = $this->postJson('/api/register', [
        'name' => 'Jean Dupont',
        'email' => 'jean.dupont@example.com',
        'password' => 'Test@1234',
        'password_confirmation' => 'Test@1234',
        'role_id' => $adminRole->id, // tentative de forcer le rôle admin
    ]);

    // Le contrôleur renvoie response()->json([...]) sans code explicite -> 200 par défaut.
    $response->assertStatus(200);

    $clientRole = Role::where('name', 'client')->firstOrFail();

    $this->assertDatabaseHas('users', [
        'email' => 'jean.dupont@example.com',
        'role_id' => $clientRole->id, // toujours client, jamais admin
    ]);
});

// ---------------------------------------------------------------------
// Test 2 : Login avec le bon mot de passe
// ---------------------------------------------------------------------
test('login réussit avec le bon mot de passe et retourne user + token', function () {
    $user = createUserWithRole('client', [
        'email' => 'client@example.com',
        'password' => Hash::make('Test@1234'),
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'client@example.com',
        'password' => 'Test@1234',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'user' => ['id', 'name', 'email', 'role'],
            'token',
        ]);
});

// ---------------------------------------------------------------------
// Test 3 : Login avec le mauvais mot de passe
// ---------------------------------------------------------------------
test('login échoue avec un mauvais mot de passe', function () {
    createUserWithRole('client', [
        'email' => 'client2@example.com',
        'password' => Hash::make('Test@1234'),
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'client2@example.com',
        'password' => 'mauvais-mot-de-passe',
    ]);

    $response->assertStatus(401);
});

// ---------------------------------------------------------------------
// Test 4 : /me sans token
// ---------------------------------------------------------------------
test('/me sans token retourne 401 Unauthenticated', function () {
    $response = $this->getJson('/api/me');

    $response->assertStatus(401)
        ->assertJson(['message' => 'Unauthenticated.']);
});

// ---------------------------------------------------------------------
// Test 5 : /me avec token valide
// ---------------------------------------------------------------------
test('/me avec token valide retourne l’utilisateur et son rôle', function () {
    $user = createUserWithRole('client');
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/me');

    $response->assertStatus(200)
        ->assertJsonPath('id', $user->id)
        ->assertJsonStructure(['role']);
});

// ---------------------------------------------------------------------
// Test 6 : Admin crée un commercial
// ---------------------------------------------------------------------
test('un admin peut créer un compte commercial', function () {
    $admin = createUserWithRole('admin');
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/users', [
            'name' => 'Nouveau Commercial',
            'email' => 'commercial@example.com',
            'password' => 'Test@1234',
            'password_confirmation' => 'Test@1234',
            'role' => 'commercial',
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('users', [
        'email' => 'commercial@example.com',
    ]);
});

// ---------------------------------------------------------------------
// Test 7 : Client tente de créer un admin (test critique du middleware)
// ---------------------------------------------------------------------
test('un client ne peut pas créer un compte admin (403 Accès refusé)', function () {
    $client = createUserWithRole('client');
    $token = $client->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/users', [
            'name' => 'Tentative Admin',
            'email' => 'fauxadmin@example.com',
            'password' => 'Test@1234',
            'password_confirmation' => 'Test@1234',
            'role' => 'admin',
        ]);

    $response->assertStatus(403)
        ->assertJson(['message' => 'Accès refusé']);

    $this->assertDatabaseMissing('users', [
        'email' => 'fauxadmin@example.com',
    ]);
});

// ---------------------------------------------------------------------
// Test 8 : Token réutilisé après logout
// ---------------------------------------------------------------------
test('un token ne fonctionne plus après logout', function () {
    $user = createUserWithRole('client');
    $token = $user->createToken('test-token')->plainTextToken;

    // Logout réussi
    $logoutResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/logout');

    $logoutResponse->assertStatus(200);

    // Vérification directe en base : le token doit avoir été supprimé.
    // (plus fiable que de refaire un appel HTTP dans le même test, car le
    // guard Sanctum met en cache l'utilisateur résolu pour la durée du test)
    $this->assertDatabaseCount('personal_access_tokens', 0);

    // Rejoue quand même l'appel HTTP pour valider le comportement "réel",
    // en forçant Laravel à oublier le guard mis en cache entre les deux appels.
    $this->app['auth']->forgetGuards();

    $reuseResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/me');

    $reuseResponse->assertStatus(401);
});