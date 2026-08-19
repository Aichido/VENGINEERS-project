<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAdminForUserTest(): User
{
    $adminRole = Role::firstOrCreate(['name' => 'admin']);
    $admin = User::factory()->create(['role_id' => $adminRole->id, 'is_active' => true]);

    app('auth')->forgetGuards();

    return $admin;
}

function actingClientForUserTest(): User
{
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id, 'is_active' => true]);

    app('auth')->forgetGuards();

    return $client;
}
function technicienRoleForUserTest(): Role
{
    return Role::firstOrCreate(['name' => 'technicien']);
}

// ---------- INDEX ----------

it('liste les utilisateurs pour un admin', function () {
    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    User::factory()->count(3)->create(['role_id' => technicienRoleForUserTest()->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/users');

    $response->assertOk();
    expect($response->json('total'))->toBeGreaterThanOrEqual(4); // +admin lui-même
});

it('filtre les utilisateurs par role', function () {
    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    $technicienRole = technicienRoleForUserTest();
    User::factory()->count(2)->create(['role_id' => $technicienRole->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/users?role=technicien');

    $response->assertOk();
    collect($response->json('data'))->each(
        fn ($u) => expect($u['role']['name'])->toBe('technicien')
    );
});

it('recherche les utilisateurs par nom ou email', function () {
    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    User::factory()->create([
        'role_id' => technicienRoleForUserTest()->id,
        'name' => 'Alizée Rakoto',
        'email' => 'alizee@vengineers.mu',
    ]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/users?search=Alizée');

    $response->assertOk();
    expect($response->json('total'))->toBe(1);
});

it('refuse la liste des utilisateurs a un non-admin', function () {
    $client = actingClientForUserTest();
    $token = $client->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/users');

    $response->assertForbidden();
});

it('refuse la liste des utilisateurs sans authentification', function () {
    $response = $this->getJson('/api/admin/users');

    $response->assertUnauthorized();
});

// ---------- STORE ----------

it('cree un compte staff avec un mot de passe conforme', function () {
 technicienRoleForUserTest(); // ← ligne manquante

    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/users', [
            'name' => 'Jean Test',
            'email' => 'jean.test@vengineers.mu',
            'password' => 'Test@1234',
            'role' => 'technicien',
        ]);

    $response->assertCreated();
    expect($response->json('email'))->toBe('jean.test@vengineers.mu');

    $this->assertDatabaseHas('users', ['email' => 'jean.test@vengineers.mu']);

    $created = User::where('email', 'jean.test@vengineers.mu')->first();
    expect(Hash::check('Test@1234', $created->password))->toBeTrue();
});

it('rejette un mot de passe non conforme a la creation', function () {
    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/users', [
            'name' => 'Jean Test',
            'email' => 'jean2@vengineers.mu',
            'password' => 'weak',
            'role' => 'technicien',
        ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors('password');
});

it('rejette un role invalide a la creation', function () {
    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/users', [
            'name' => 'Jean Test',
            'email' => 'jean3@vengineers.mu',
            'password' => 'Test@1234',
            'role' => 'super_admin',
        ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors('role');
});

it('rejette un email deja utilise a la creation', function () {
    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    User::factory()->create([
        'role_id' => technicienRoleForUserTest()->id,
        'email' => 'existant@vengineers.mu',
    ]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/users', [
            'name' => 'Doublon',
            'email' => 'existant@vengineers.mu',
            'password' => 'Test@1234',
            'role' => 'technicien',
        ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors('email');
});

it('refuse la creation a un non-admin', function () {
    $client = actingClientForUserTest();
    $token = $client->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/users', [
            'name' => 'Jean Test',
            'email' => 'jean4@vengineers.mu',
            'password' => 'Test@1234',
            'role' => 'technicien',
        ]);

    $response->assertForbidden();
});

// ---------- UPDATE ----------

it('met a jour un utilisateur (champ partiel)', function () {
    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    $user = User::factory()->create(['role_id' => technicienRoleForUserTest()->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson("/api/admin/users/{$user->id}", [
            'phone' => '+230 5123 4567',
        ]);

    $response->assertOk();
    expect($response->json('phone'))->toBe('+230 5123 4567');
    expect($response->json('name'))->toBe($user->name); // inchangé
});

it('met a jour le mot de passe si fourni et conforme', function () {
    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    $user = User::factory()->create(['role_id' => technicienRoleForUserTest()->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson("/api/admin/users/{$user->id}", [
            'password' => 'NouveauMdp@1',
        ]);

    $response->assertOk();
    expect(Hash::check('NouveauMdp@1', $user->fresh()->password))->toBeTrue();
});

it('rejette la mise a jour avec un email deja pris par un autre utilisateur', function () {
    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    $technicienRole = technicienRoleForUserTest();
    User::factory()->create(['role_id' => $technicienRole->id, 'email' => 'pris@vengineers.mu']);
    $userToUpdate = User::factory()->create(['role_id' => $technicienRole->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson("/api/admin/users/{$userToUpdate->id}", [
            'email' => 'pris@vengineers.mu',
        ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors('email');
});

it('permet de garder son propre email inchange lors dune mise a jour', function () {
    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    $user = User::factory()->create([
        'role_id' => technicienRoleForUserTest()->id,
        'email' => 'moi@vengineers.mu',
    ]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson("/api/admin/users/{$user->id}", [
            'email' => 'moi@vengineers.mu',
            'phone' => '123',
        ]);

    $response->assertOk();
});

// ---------- TOGGLE ACTIVE ----------

it('desactive puis reactive un utilisateur', function () {
    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    $user = User::factory()->create(['role_id' => technicienRoleForUserTest()->id, 'is_active' => true]);

    $response1 = $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/admin/users/{$user->id}/toggle-active");
    $response1->assertOk();
    expect($response1->json('is_active'))->toBeFalse();

    $response2 = $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/admin/users/{$user->id}/toggle-active");
    $response2->assertOk();
    expect($response2->json('is_active'))->toBeTrue();
});

// ---------- DESTROY (soft delete) ----------

it('soft delete un utilisateur et preserve la ligne en base', function () {
    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    $user = User::factory()->create(['role_id' => technicienRoleForUserTest()->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/admin/users/{$user->id}");

    $response->assertNoContent();

    // absent des requetes standard (soft delete actif)
    $this->assertDatabaseMissing('users', ['id' => $user->id, 'deleted_at' => null]);

    // toujours present en base avec deleted_at renseigne
    $this->assertSoftDeleted('users', ['id' => $user->id]);
});

it('exclut les utilisateurs soft deletes de la liste admin', function () {
    $admin = actingAdminForUserTest();
    $token = $admin->createToken('test')->plainTextToken;

    $user = User::factory()->create([
        'role_id' => technicienRoleForUserTest()->id,
        'name' => 'A Supprimer',
    ]);
    $user->delete();

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/users?search=A Supprimer');

    $response->assertOk();
    expect($response->json('total'))->toBe(0);
});

it('refuse la suppression a un non-admin', function () {
    $client = actingClientForUserTest();
    $token = $client->createToken('test')->plainTextToken;

    $user = User::factory()->create(['role_id' => technicienRoleForUserTest()->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/admin/users/{$user->id}");

    $response->assertForbidden();
    $this->assertDatabaseHas('users', ['id' => $user->id, 'deleted_at' => null]);
});