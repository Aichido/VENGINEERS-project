<?php

use App\Models\Intervention;
use App\Models\Order;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

function actingAdminForStatsTest(): User
{
    $adminRole = Role::firstOrCreate(['name' => 'admin']);
    $admin = User::factory()->create(['role_id' => $adminRole->id]);

    app('auth')->forgetGuards();

    return $admin;
}

function actingClientForStatsTest(): User
{
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    app('auth')->forgetGuards();

    return $client;
}

function clientRoleForStatsTest(): Role
{
    return Role::firstOrCreate(['name' => 'client']);
}

function technicienRoleForStatsTest(): Role
{
    return Role::firstOrCreate(['name' => 'technicien']);
}

it('calcule le CA total sur les commandes validee/expediee/livree uniquement', function () {
    $admin = actingAdminForStatsTest();
    $token = $admin->createToken('test')->plainTextToken;

    $client = User::factory()->create(['role_id' => clientRoleForStatsTest()->id]);

    Order::factory()->create(['client_id' => $client->id, 'status' => 'validee', 'total' => 100]);
    Order::factory()->create(['client_id' => $client->id, 'status' => 'expediee', 'total' => 200]);
    Order::factory()->create(['client_id' => $client->id, 'status' => 'livree', 'total' => 300]);
    Order::factory()->create(['client_id' => $client->id, 'status' => 'en_attente', 'total' => 999]); // exclu
    Order::factory()->create(['client_id' => $client->id, 'status' => 'annulee', 'total' => 999]); // exclu

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/stats');

    $response->assertOk();
    expect((float) $response->json('ca_total'))->toBe(600.0);
});

it('calcule le CA du mois en cours en excluant les commandes des mois precedents', function () {
    $admin = actingAdminForStatsTest();
    $token = $admin->createToken('test')->plainTextToken;

    $client = User::factory()->create(['role_id' => clientRoleForStatsTest()->id]);

    $orderCeMois = Order::factory()->create([
        'client_id' => $client->id,
        'status' => 'validee',
        'total' => 150,
    ]);

    $orderMoisDernier = Order::factory()->create([
        'client_id' => $client->id,
        'status' => 'validee',
        'total' => 500,
    ]);
    $orderMoisDernier->created_at = Carbon::now()->subMonth();
    $orderMoisDernier->save();

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/stats');

    $response->assertOk();
    expect((float) $response->json('ca_mois_en_cours'))->toBe(150.0);
});

it('compte les commandes par statut', function () {
    $admin = actingAdminForStatsTest();
    $token = $admin->createToken('test')->plainTextToken;

    $client = User::factory()->create(['role_id' => clientRoleForStatsTest()->id]);

    Order::factory()->count(2)->create(['client_id' => $client->id, 'status' => 'en_attente']);
    Order::factory()->create(['client_id' => $client->id, 'status' => 'livree']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/stats');

    $response->assertOk();
    expect($response->json('commandes_par_statut.en_attente'))->toBe(2);
    expect($response->json('commandes_par_statut.livree'))->toBe(1);
});

it('compte les interventions ouvertes par priorite en excluant terminee', function () {
    $admin = actingAdminForStatsTest();
    $token = $admin->createToken('test')->plainTextToken;

    $client = User::factory()->create(['role_id' => clientRoleForStatsTest()->id]);

    Intervention::factory()->create(['client_id' => $client->id, 'statut' => 'nouvelle', 'priorite' => 'urgente']);
    Intervention::factory()->create(['client_id' => $client->id, 'statut' => 'assignee', 'priorite' => 'urgente']);
    Intervention::factory()->create(['client_id' => $client->id, 'statut' => 'en_cours', 'priorite' => 'basse']);
    Intervention::factory()->create(['client_id' => $client->id, 'statut' => 'terminee', 'priorite' => 'urgente']); // exclu

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/stats');

    $response->assertOk();
    expect($response->json('interventions_ouvertes_par_priorite.urgente'))->toBe(2);
    expect($response->json('interventions_ouvertes_par_priorite.basse'))->toBe(1);
    expect($response->json('interventions_ouvertes_par_priorite'))->not->toHaveKey('terminee');
});

it('compte les utilisateurs par role', function () {
    $admin = actingAdminForStatsTest();
    $token = $admin->createToken('test')->plainTextToken;

    User::factory()->count(3)->create(['role_id' => clientRoleForStatsTest()->id]);
    User::factory()->count(2)->create(['role_id' => technicienRoleForStatsTest()->id]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/stats');

    $response->assertOk();
    // +1 car l'admin de ce test est lui-meme cree avec le role admin
    expect($response->json('utilisateurs_par_role.client'))->toBe(3);
    expect($response->json('utilisateurs_par_role.technicien'))->toBe(2);
    expect($response->json('utilisateurs_par_role.admin'))->toBe(1);
});

it('exclut les utilisateurs soft deletes du comptage par role', function () {
    $admin = actingAdminForStatsTest();
    $token = $admin->createToken('test')->plainTextToken;

    $client = User::factory()->create(['role_id' => clientRoleForStatsTest()->id]);
    $client->delete(); // soft delete

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/stats');

    $response->assertOk();
    expect($response->json('utilisateurs_par_role.client') ?? 0)->toBe(0);
});

it('refuse les statistiques a un non-admin', function () {
    $client = actingClientForStatsTest();
    $token = $client->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/stats');

    $response->assertForbidden();
});

it('refuse les statistiques sans authentification', function () {
    $response = $this->getJson('/api/admin/stats');

    $response->assertUnauthorized();
});