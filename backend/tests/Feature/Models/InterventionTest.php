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
        'statut',
        'priorite',
        'date_souhaitee',
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