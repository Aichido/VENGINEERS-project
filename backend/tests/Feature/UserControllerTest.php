<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'commercial']);
    Role::firstOrCreate(['name' => 'technicien']);
    Role::firstOrCreate(['name' => 'client']);
});

function createAdminUser(): User
{
    $adminRole = Role::where('name', 'admin')->firstOrFail();

    return User::factory()->create([
        'role_id' => $adminRole->id,
        'password' => Hash::make('password123'),
    ]);
}

test('un admin peut créer un compte commercial', function () {
    $admin = createAdminUser();
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/users', [
            'name' => 'Nouveau Commercial',
            'email' => 'commercial-user@example.com',
            'password' => 'password123',
            'role' => 'commercial',
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('name', 'Nouveau Commercial')
        ->assertJsonPath('role.name', 'commercial');

    $this->assertDatabaseHas('users', ['email' => 'commercial-user@example.com']);
});

test('un admin peut créer un compte technicien', function () {
    $admin = createAdminUser();
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/users', [
            'name' => 'Nouveau Technicien',
            'email' => 'technicien-user@example.com',
            'password' => 'password123',
            'role' => 'technicien',
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('role.name', 'technicien');
});

test('impossible de créer un compte avec un rôle invalide (ex: client)', function () {
    $admin = createAdminUser();
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/users', [
            'name' => 'Tentative Client',
            'email' => 'client-via-admin@example.com',
            'password' => 'password123',
            'role' => 'client', // non autorisé par la validation 'in:commercial,technicien,admin'
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['role']);
});

test('impossible de créer un compte avec un rôle qui n’existe pas du tout', function () {
    $admin = createAdminUser();
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/users', [
            'name' => 'Rôle Bidon',
            'email' => 'role-bidon@example.com',
            'password' => 'password123',
            'role' => 'superadmin',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['role']);
});

test('impossible de créer un compte avec un email déjà utilisé', function () {
    $admin = createAdminUser();
    $token = $admin->createToken('test-token')->plainTextToken;

    User::factory()->create(['email' => 'deja-utilise@example.com']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/users', [
            'name' => 'Doublon',
            'email' => 'deja-utilise@example.com',
            'password' => 'password123',
            'role' => 'commercial',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('impossible de créer un compte avec un mot de passe trop court', function () {
    $admin = createAdminUser();
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/users', [
            'name' => 'Mot de passe court',
            'email' => 'mdp-court@example.com',
            'password' => '1234',
            'role' => 'commercial',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});
