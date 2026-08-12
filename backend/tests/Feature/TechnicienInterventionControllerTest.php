<?php

use App\Models\Intervention;
use App\Models\InterventionReport;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingTechnicienForInterventionTest(): array
{
    $role = Role::firstOrCreate(['name' => 'technicien']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function actingClientForInterventionTest(): array
{
    $role = Role::firstOrCreate(['name' => 'client']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function makeAssignedInterventionForInterventionTest(User $technicien, array $overrides = []): Intervention
{
    [$client] = actingClientForInterventionTest();

    return Intervention::create(array_merge([
        'client_id' => $client->id,
        'technicien_id' => $technicien->id,
        'titre' => 'Panne routeur',
        'description' => 'Description test',
        'statut' => 'assignee',
        'priorite' => 'normale',
    ], $overrides));
}

it('rejects interventions listing without authentication', function () {
    $this->getJson('/api/technicien/interventions')->assertStatus(401);
});

it('rejects interventions listing for a non-technicien role', function () {
    [$client, $token] = actingClientForInterventionTest();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/technicien/interventions')
        ->assertStatus(403);
});

it('lists only interventions assigned to the authenticated technicien', function () {
    [$technicien, $token] = actingTechnicienForInterventionTest();
    [$other] = actingTechnicienForInterventionTest();

    makeAssignedInterventionForInterventionTest($technicien);
    makeAssignedInterventionForInterventionTest($other);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/technicien/interventions');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(1);
});

it('filters interventions by statut', function () {
    [$technicien, $token] = actingTechnicienForInterventionTest();

    makeAssignedInterventionForInterventionTest($technicien, ['statut' => 'assignee']);
    makeAssignedInterventionForInterventionTest($technicien, ['statut' => 'en_cours']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/technicien/interventions?statut=en_cours');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(1);
});

it('shows intervention detail for its own technicien', function () {
    [$technicien, $token] = actingTechnicienForInterventionTest();
    $intervention = makeAssignedInterventionForInterventionTest($technicien);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id));

    $response->assertStatus(200)->assertJsonPath('public_id', $intervention->public_id);
});

it('rejects intervention detail for another technicien', function () {
    [$owner] = actingTechnicienForInterventionTest();
    [$other, $otherToken] = actingTechnicienForInterventionTest();

    $intervention = makeAssignedInterventionForInterventionTest($owner);

    $this->withHeader('Authorization', "Bearer {$otherToken}")
        ->getJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id))
        ->assertStatus(403);
});

it('returns 404 for a non-existent intervention', function () {
    [$technicien, $token] = actingTechnicienForInterventionTest();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/technicien/interventions/' . rawurlencode('#VEN-INT-INEXISTANT'))
        ->assertStatus(404);
});

it('transitions from assignee to en_cours', function () {
    [$technicien, $token] = actingTechnicienForInterventionTest();
    $intervention = makeAssignedInterventionForInterventionTest($technicien, ['statut' => 'assignee']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id), ['statut' => 'en_cours']);

    $response->assertStatus(200)->assertJsonPath('statut', 'en_cours');
});

it('rejects an out-of-order transition', function () {
    [$technicien, $token] = actingTechnicienForInterventionTest();
    $intervention = makeAssignedInterventionForInterventionTest($technicien, ['statut' => 'assignee']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id), ['statut' => 'terminee'])
        ->assertStatus(422);
});

it('is idempotent when resubmitting the same statut', function () {
    [$technicien, $token] = actingTechnicienForInterventionTest();
    $intervention = makeAssignedInterventionForInterventionTest($technicien, ['statut' => 'en_cours']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id), ['statut' => 'en_cours']);

    $response->assertStatus(200)->assertJsonPath('statut', 'en_cours');
});

it('blocks closing an intervention without a submitted report', function () {
    [$technicien, $token] = actingTechnicienForInterventionTest();
    $intervention = makeAssignedInterventionForInterventionTest($technicien, ['statut' => 'en_cours']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id), ['statut' => 'terminee'])
        ->assertStatus(422);
});

it('allows closing an intervention once a report exists', function () {
    [$technicien, $token] = actingTechnicienForInterventionTest();
    $intervention = makeAssignedInterventionForInterventionTest($technicien, ['statut' => 'en_cours']);

    InterventionReport::create([
        'intervention_id' => $intervention->id,
        'technicien_id' => $technicien->id,
        'contenu' => 'Rapport de test',
        'fichier_path' => 'intervention-reports/fake.pdf',
    ]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id), ['statut' => 'terminee']);

    $response->assertStatus(200)->assertJsonPath('statut', 'terminee');
});

it('rejects updates on interventions owned by another technicien', function () {
    [$owner] = actingTechnicienForInterventionTest();
    [$other, $otherToken] = actingTechnicienForInterventionTest();

    $intervention = makeAssignedInterventionForInterventionTest($owner, ['statut' => 'assignee']);

    $this->withHeader('Authorization', "Bearer {$otherToken}")
        ->putJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id), ['statut' => 'en_cours'])
        ->assertStatus(403);
});