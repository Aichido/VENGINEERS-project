<?php

use App\Models\Intervention;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAdminForAssignTest(): array
{
    $role = Role::firstOrCreate(['name' => 'admin']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function actingTechnicienForAssignTest(): array
{
    $role = Role::firstOrCreate(['name' => 'technicien']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function actingClientForAssignTest(): array
{
    $role = Role::firstOrCreate(['name' => 'client']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function makeInterventionForAssignTest(array $overrides = []): Intervention
{
    [$client] = actingClientForAssignTest();

    return Intervention::create(array_merge([
        'client_id' => $client->id,
        'titre' => 'Panne routeur',
        'description' => 'Description test',
        'statut' => 'nouvelle',
        'priorite' => 'normale',
    ], $overrides));
}

it('rejects assignment without authentication', function () {
    $intervention = makeInterventionForAssignTest();

    $this->postJson('/api/admin/interventions/' . rawurlencode($intervention->public_id) . '/assign', ['technicien_id' => 1])
        ->assertStatus(401);
});

it('rejects assignment for a non-admin role', function () {
    $intervention = makeInterventionForAssignTest();
    [$technicien] = actingTechnicienForAssignTest();
    [$client, $clientToken] = actingClientForAssignTest();

    $this->withHeader('Authorization', "Bearer {$clientToken}")
        ->postJson('/api/admin/interventions/' . rawurlencode($intervention->public_id) . '/assign', ['technicien_id' => $technicien->id])
        ->assertStatus(403);
});

it('assigns an intervention to a technicien successfully', function () {
    $intervention = makeInterventionForAssignTest();
    [$technicien] = actingTechnicienForAssignTest();
    [$admin, $adminToken] = actingAdminForAssignTest();

    $this->app['auth']->forgetGuards();

    $response = $this->withHeader('Authorization', "Bearer {$adminToken}")
        ->postJson('/api/admin/interventions/' . rawurlencode($intervention->public_id) . '/assign', ['technicien_id' => $technicien->id]);

    $response->assertStatus(200)
        ->assertJsonPath('intervention.statut', 'assignee')
        ->assertJsonPath('intervention.technicien_id', $technicien->id);
});

it('rejects assignment when the intervention is en_cours', function () {
    [$technicien] = actingTechnicienForAssignTest();
    $intervention = makeInterventionForAssignTest([
        'statut' => 'en_cours',
        'technicien_id' => $technicien->id,
    ]);
    [$admin, $adminToken] = actingAdminForAssignTest();

    $this->withHeader('Authorization', "Bearer {$adminToken}")
        ->postJson('/api/admin/interventions/' . rawurlencode($intervention->public_id) . '/assign', ['technicien_id' => $technicien->id])
        ->assertStatus(422);
});

it('allows reassignment when the intervention status is assignee', function () {
    [$technicien1] = actingTechnicienForAssignTest();
    [$technicien2] = actingTechnicienForAssignTest();
    $intervention = makeInterventionForAssignTest([
        'statut' => 'assignee',
        'technicien_id' => $technicien1->id,
    ]);
    [$admin, $adminToken] = actingAdminForAssignTest();

    $response = $this->withHeader('Authorization', "Bearer {$adminToken}")
        ->postJson('/api/admin/interventions/' . rawurlencode($intervention->public_id) . '/assign', ['technicien_id' => $technicien2->id]);

    $response->assertStatus(200)
        ->assertJsonPath('intervention.statut', 'assignee')
        ->assertJsonPath('intervention.technicien_id', $technicien2->id);
});

it('rejects reassignment when the intervention status is terminee', function () {
    [$technicien] = actingTechnicienForAssignTest();
    $intervention = makeInterventionForAssignTest([
        'statut' => 'terminee',
        'technicien_id' => $technicien->id,
    ]);
    [$admin, $adminToken] = actingAdminForAssignTest();

    $this->withHeader('Authorization', "Bearer {$adminToken}")
        ->postJson('/api/admin/interventions/' . rawurlencode($intervention->public_id) . '/assign', ['technicien_id' => $technicien->id])
        ->assertStatus(422);
});

it('rejects assignment when the target user is not a technicien', function () {
    $intervention = makeInterventionForAssignTest();
    [$client] = actingClientForAssignTest();
    [$admin, $adminToken] = actingAdminForAssignTest();

    $this->withHeader('Authorization', "Bearer {$adminToken}")
        ->postJson('/api/admin/interventions/' . rawurlencode($intervention->public_id) . '/assign', ['technicien_id' => $client->id])
        ->assertStatus(422);
});

it('rejects assignment with a non-existent technicien_id', function () {
    $intervention = makeInterventionForAssignTest();
    [$admin, $adminToken] = actingAdminForAssignTest();

    $this->withHeader('Authorization', "Bearer {$adminToken}")
        ->postJson('/api/admin/interventions/' . rawurlencode($intervention->public_id) . '/assign', ['technicien_id' => 999999])
        ->assertStatus(422);
});