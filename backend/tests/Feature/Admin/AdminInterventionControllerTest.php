<?php

use App\Models\Intervention;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAdminForAdminInterventionTest(): User
{
    $adminRole = Role::firstOrCreate(['name' => 'admin']);
    $admin = User::factory()->create(['role_id' => $adminRole->id]);

    app('auth')->forgetGuards();

    return $admin;
}

function actingClientForAdminInterventionTest(): User
{
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    app('auth')->forgetGuards();

    return $client;
}

function clientRoleForAdminInterventionTest(): Role
{
    return Role::firstOrCreate(['name' => 'client']);
}

function technicienRoleForAdminInterventionTest(): Role
{
    return Role::firstOrCreate(['name' => 'technicien']);
}

// ---------- INDEX ----------

it('liste toutes les interventions pour un admin', function () {
    $admin = actingAdminForAdminInterventionTest();
    $token = $admin->createToken('test')->plainTextToken;

    $client = User::factory()->create(['role_id' => clientRoleForAdminInterventionTest()->id]);
    Intervention::factory()->count(3)->create(['client_id' => $client->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/interventions');

    $response->assertOk();
    expect($response->json('total'))->toBe(3);
});

it('filtre les interventions par statut', function () {
    $admin = actingAdminForAdminInterventionTest();
    $token = $admin->createToken('test')->plainTextToken;

    $client = User::factory()->create(['role_id' => clientRoleForAdminInterventionTest()->id]);
    Intervention::factory()->create(['client_id' => $client->id, 'statut' => 'nouvelle']);
    Intervention::factory()->create(['client_id' => $client->id, 'statut' => 'terminee']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/interventions?statut=nouvelle');

    $response->assertOk();
    expect($response->json('total'))->toBe(1);
});

it('filtre les interventions par technicien_id', function () {
    $admin = actingAdminForAdminInterventionTest();
    $token = $admin->createToken('test')->plainTextToken;

    $client = User::factory()->create(['role_id' => clientRoleForAdminInterventionTest()->id]);
    $technicien = User::factory()->create(['role_id' => technicienRoleForAdminInterventionTest()->id]);

    Intervention::factory()->create(['client_id' => $client->id, 'technicien_id' => $technicien->id]);
    Intervention::factory()->create(['client_id' => $client->id, 'technicien_id' => null]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson("/api/admin/interventions?technicien_id={$technicien->id}");

    $response->assertOk();
    expect($response->json('total'))->toBe(1);
});

it('filtre les interventions par priorite', function () {
    $admin = actingAdminForAdminInterventionTest();
    $token = $admin->createToken('test')->plainTextToken;

    $client = User::factory()->create(['role_id' => clientRoleForAdminInterventionTest()->id]);
    Intervention::factory()->create(['client_id' => $client->id, 'priorite' => 'urgente']);
    Intervention::factory()->create(['client_id' => $client->id, 'priorite' => 'basse']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/interventions?priorite=urgente');

    $response->assertOk();
    expect($response->json('total'))->toBe(1);
});

it('refuse la liste des interventions a un non-admin', function () {
    $client = actingClientForAdminInterventionTest();
    $token = $client->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/interventions');

    $response->assertForbidden();
});

// ---------- STORE ----------

it('permet a un admin de creer une intervention pour un client existant', function () {
    $admin = actingAdminForAdminInterventionTest();
    $token = $admin->createToken('test')->plainTextToken;

    $client = User::factory()->create(['role_id' => clientRoleForAdminInterventionTest()->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/interventions', [
            'client_id' => $client->id,
            'titre' => 'Panne climatiseur',
            'description' => 'Ne refroidit plus',
            'priorite' => 'haute',
        ]);

    $response->assertCreated();
    expect($response->json('statut'))->toBe('nouvelle');
    expect($response->json('client_id'))->toBe($client->id);
    $this->assertDatabaseHas('interventions', ['titre' => 'Panne climatiseur']);
});

it('force le statut a nouvelle meme si un autre statut est envoye', function () {
    $admin = actingAdminForAdminInterventionTest();
    $token = $admin->createToken('test')->plainTextToken;

    $client = User::factory()->create(['role_id' => clientRoleForAdminInterventionTest()->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/interventions', [
            'client_id' => $client->id,
            'titre' => 'Test',
            'description' => 'Test',
            'statut' => 'terminee',
        ]);

    $response->assertCreated();
    expect($response->json('statut'))->toBe('nouvelle');
});

it('rejette la creation avec un client_id qui nest pas un client', function () {
    $admin = actingAdminForAdminInterventionTest();
    $token = $admin->createToken('test')->plainTextToken;

    $technicien = User::factory()->create(['role_id' => technicienRoleForAdminInterventionTest()->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/interventions', [
            'client_id' => $technicien->id,
            'titre' => 'Test',
            'description' => 'Test',
        ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors('client_id');
});

it('rejette la creation avec un client_id inexistant', function () {
    $admin = actingAdminForAdminInterventionTest();
    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/interventions', [
            'client_id' => 999999,
            'titre' => 'Test',
            'description' => 'Test',
        ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors('client_id');
});

it('rejette la creation sans titre ni description', function () {
    $admin = actingAdminForAdminInterventionTest();
    $token = $admin->createToken('test')->plainTextToken;

    $client = User::factory()->create(['role_id' => clientRoleForAdminInterventionTest()->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/interventions', [
            'client_id' => $client->id,
        ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['titre', 'description']);
});

it('refuse la creation dintervention a un non-admin', function () {
    $client = actingClientForAdminInterventionTest();
    $token = $client->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/interventions', [
            'client_id' => $client->id,
            'titre' => 'Test',
            'description' => 'Test',
        ]);

    $response->assertForbidden();
});