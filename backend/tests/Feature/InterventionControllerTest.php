<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingClientForIntervention(): array
{
    $role = Role::firstOrCreate(['name' => 'client']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

it('rejects intervention creation without authentication', function () {
    $this->postJson('/api/client/interventions', [])
        ->assertStatus(401);
});

it('creates an intervention request with default status nouvelle', function () {
    [$user, $token] = actingClientForIntervention();

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/interventions', [
            'titre'          => 'Écran hors service',
            'description'    => 'Plus aucun signal depuis ce matin.',
            'priorite'       => 'haute',
            'date_souhaitee' => now()->addDays(3)->toDateString(),
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('client_id', $user->id)
        ->assertJsonPath('statut', 'nouvelle')
        ->assertJsonPath('titre', 'Écran hors service');
});

it('rejects intervention with missing required fields', function () {
    [$user, $token] = actingClientForIntervention();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/interventions', ['titre' => ''])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['titre', 'description']);
});

it('always forces priorite to normale regardless of client input', function () {
    [$user, $token] = actingClientForIntervention();

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/interventions', [
            'titre'       => 'Test',
            'description' => 'Test',
            'priorite'    => 'extreme',
        ])->assertStatus(201);

    $response->assertJsonPath('priorite', 'normale');
});

it('rejects intervention with a date_souhaitee in the past', function () {
    [$user, $token] = actingClientForIntervention();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/interventions', [
            'titre'          => 'Test',
            'description'    => 'Test',
            'priorite'       => 'normale',
            'date_souhaitee' => '2020-01-01',
        ])->assertStatus(422)
        ->assertJsonValidationErrors(['date_souhaitee']);
});

it('allows intervention without date_souhaitee since it is nullable', function () {
    [$user, $token] = actingClientForIntervention();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/interventions', [
            'titre'       => 'Test',
            'description' => 'Test',
            'priorite'    => 'basse',
        ])->assertStatus(201);
});

it('lists only the authenticated client own interventions', function () {
    [$userA, $tokenA] = actingClientForIntervention();
    [$userB, $tokenB] = actingClientForIntervention();

    $this->withHeader('Authorization', "Bearer {$tokenA}")
        ->postJson('/api/client/interventions', [
            'titre' => 'A', 'description' => 'A', 'priorite' => 'basse',
        ]);

    $this->app['auth']->forgetGuards();

    $this->withHeader('Authorization', "Bearer {$tokenB}")
        ->postJson('/api/client/interventions', [
            'titre' => 'B', 'description' => 'B', 'priorite' => 'basse',
        ]);

    $this->app['auth']->forgetGuards();

    $response = $this->withHeader('Authorization', "Bearer {$tokenA}")
        ->getJson('/api/client/interventions');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.client_id'))->toBe($userA->id);
});

it('rejects intervention access for a non-client role', function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin']);
    $admin = User::factory()->create(['role_id' => $adminRole->id]);
    $token = $admin->createToken('test')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/client/interventions', [])
        ->assertStatus(403);
});