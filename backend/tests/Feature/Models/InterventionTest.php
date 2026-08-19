<?php

use App\Models\Intervention;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('has the correct fillable attributes', function () {
    $intervention = new Intervention();

    expect($intervention->getFillable())->toEqual([
           'client_id',
            'technicien_id',
            'titre',
            'description',
            'equipement',
            'statut',
            'priorite',
            'date_souhaitee',
            'public_id',
    ]);
});

it('casts date_souhaitee to a date', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    $intervention = Intervention::create([
        'client_id'      => $client->id,
        'titre'          => 'Test',
        'description'    => 'Test',
        'statut'         => 'nouvelle',
        'priorite'       => 'normale',
        'date_souhaitee' => '2026-12-01',
    ]);

    expect($intervention->date_souhaitee)->toBeInstanceOf(\Illuminate\Support\Carbon::class);
});

it('belongs to a client', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    $intervention = Intervention::create([
        'client_id'   => $client->id,
        'titre'       => 'Test',
        'description' => 'Test',
        'statut'      => 'nouvelle',
        'priorite'    => 'normale',
    ]);

    expect($intervention->client)->toBeInstanceOf(User::class);
    expect($intervention->client->id)->toBe($client->id);
});

it('belongs to a technicien when assigned', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $technicienRole = Role::firstOrCreate(['name' => 'technicien']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);
    $technicien = User::factory()->create(['role_id' => $technicienRole->id]);

    $intervention = Intervention::create([
        'client_id'     => $client->id,
        'technicien_id' => $technicien->id,
        'titre'         => 'Test',
        'description'   => 'Test',
        'statut'        => 'assignee',
        'priorite'      => 'normale',
    ]);

    expect($intervention->technicien)->toBeInstanceOf(User::class);
    expect($intervention->technicien->id)->toBe($technicien->id);
});

it('has a null technicien when not yet assigned', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    $intervention = Intervention::create([
        'client_id'   => $client->id,
        'titre'       => 'Test',
        'description' => 'Test',
        'statut'      => 'nouvelle',
        'priorite'    => 'normale',
    ]);

    expect($intervention->technicien)->toBeNull();
});
it('generates a public_id with the correct prefix on creation', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    $intervention = Intervention::create([
        'client_id'   => $client->id,
        'titre'       => 'Test',
        'description' => 'Test',
        'statut'      => 'nouvelle',
        'priorite'    => 'normale',
    ]);

    expect($intervention->public_id)->toStartWith('#VEN-INT-');
    expect(strlen($intervention->public_id))->toBe(strlen('#VEN-INT-') + 8);
});

it('generates unique public_ids across multiple interventions', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    $publicIds = collect(range(1, 5))->map(fn () => Intervention::create([
        'client_id'   => $client->id,
        'titre'       => 'Test',
        'description' => 'Test',
        'statut'      => 'nouvelle',
        'priorite'    => 'normale',
    ])->public_id);

    expect($publicIds->unique())->toHaveCount(5);
});

it('uses public_id as the route key', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    $intervention = Intervention::create([
        'client_id'   => $client->id,
        'titre'       => 'Test',
        'description' => 'Test',
        'statut'      => 'nouvelle',
        'priorite'    => 'normale',
    ]);

    expect($intervention->getRouteKeyName())->toBe('public_id');
});

it('has many reports', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $technicienRole = Role::firstOrCreate(['name' => 'technicien']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);
    $technicien = User::factory()->create(['role_id' => $technicienRole->id]);

    $intervention = Intervention::create([
        'client_id'     => $client->id,
        'technicien_id' => $technicien->id,
        'titre'         => 'Test',
        'description'   => 'Test',
        'statut'        => 'en_cours',
        'priorite'      => 'normale',
    ]);

    \App\Models\InterventionReport::create([
        'intervention_id' => $intervention->id,
        'technicien_id'   => $technicien->id,
        'contenu'         => 'Rapport 1',
        'fichier_path'    => 'intervention-reports/one.pdf',
    ]);

    \App\Models\InterventionReport::create([
        'intervention_id' => $intervention->id,
        'technicien_id'   => $technicien->id,
        'contenu'         => 'Rapport 2',
        'fichier_path'    => 'intervention-reports/two.pdf',
    ]);

    expect($intervention->reports)->toHaveCount(2);
    expect($intervention->reports->first())->toBeInstanceOf(\App\Models\InterventionReport::class);
});

it('deletes reports when the intervention is deleted', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $technicienRole = Role::firstOrCreate(['name' => 'technicien']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);
    $technicien = User::factory()->create(['role_id' => $technicienRole->id]);

    $intervention = Intervention::create([
        'client_id'     => $client->id,
        'technicien_id' => $technicien->id,
        'titre'         => 'Test',
        'description'   => 'Test',
        'statut'        => 'en_cours',
        'priorite'      => 'normale',
    ]);

    $report = \App\Models\InterventionReport::create([
        'intervention_id' => $intervention->id,
        'technicien_id'   => $technicien->id,
        'contenu'         => 'Rapport',
        'fichier_path'    => 'intervention-reports/one.pdf',
    ]);

    $intervention->delete();

    $this->assertDatabaseMissing('intervention_reports', ['id' => $report->id]);
});

it('conserve technicien_id sur l\'intervention meme apres soft delete du technicien', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $technicienRole = Role::firstOrCreate(['name' => 'technicien']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);
    $technicien = User::factory()->create(['role_id' => $technicienRole->id]);

    $intervention = Intervention::create([
        'client_id'     => $client->id,
        'technicien_id' => $technicien->id,
        'titre'         => 'Test',
        'description'   => 'Test',
        'statut'        => 'assignee',
        'priorite'      => 'normale',
    ]);

    $technicien->delete(); // soft delete — historique preserve (decision Phase 6.1)

    // technicien_id reste renseigne, pas mis a null par une contrainte FK
    expect($intervention->fresh()->technicien_id)->toBe($technicien->id);

    // la relation reste resolvable via withTrashed()
    expect($intervention->fresh()->technicien)->not->toBeNull();
    expect($intervention->fresh()->technicien->id)->toBe($technicien->id);

    // mais le technicien n'apparait plus dans les requetes standard (soft-delete actif)
    expect(User::find($technicien->id))->toBeNull();
});