<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'commercial']);
    Role::firstOrCreate(['name' => 'technicien']);
    Role::firstOrCreate(['name' => 'client']);
});

// ---------------------------------------------------------------------
// Role model
// ---------------------------------------------------------------------
test('un role a bien un nom fillable', function () {
    $role = Role::create(['name' => 'testeur']);

    expect($role->name)->toBe('testeur');
});

test('la relation Role->users() retourne les utilisateurs de ce rôle', function () {
    $clientRole = Role::where('name', 'client')->firstOrFail();

    $user = User::factory()->create(['role_id' => $clientRole->id]);

    expect($clientRole->users)->toHaveCount(1);
    expect($clientRole->users->first()->id)->toBe($user->id);
});

// ---------------------------------------------------------------------
// User model
// ---------------------------------------------------------------------
test('la relation User->role() retourne le bon rôle', function () {
    $adminRole = Role::where('name', 'admin')->firstOrFail();
    $user = User::factory()->create(['role_id' => $adminRole->id]);

    expect($user->role)->not->toBeNull();
    expect($user->role->name)->toBe('admin');
});

test('le mot de passe est automatiquement caché (hidden) dans le tableau/JSON', function () {
    $role = Role::where('name', 'client')->firstOrFail();
    $user = User::factory()->create(['role_id' => $role->id]);

    $array = $user->toArray();

    expect($array)->not->toHaveKey('password');
    expect($array)->not->toHaveKey('remember_token');
});

test('is_active est bien casté en booléen', function () {
    $role = Role::where('name', 'client')->firstOrFail();
    $user = User::factory()->create(['role_id' => $role->id, 'is_active' => 1]);

    expect($user->is_active)->toBeBool();
    expect($user->is_active)->toBeTrue();
});

test('le mot de passe est haché automatiquement grâce au cast "hashed"', function () {
    $role = Role::where('name', 'client')->firstOrFail();

    $user = User::factory()->create([
        'role_id' => $role->id,
        'password' => 'motdepasseclair',
    ]);

    expect($user->password)->not->toBe('motdepasseclair');
    expect(\Illuminate\Support\Facades\Hash::check('motdepasseclair', $user->password))->toBeTrue();
});

it('la relation User->orders() retourne les commandes du client', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    \App\Models\Order::create([
        'client_id' => $client->id,
        'status'    => 'en_attente',
        'total'     => 0,
    ]);

    expect($client->orders)->toHaveCount(1);
});

it('la relation User->interventions() retourne les interventions du client', function () {
    $clientRole = Role::firstOrCreate(['name' => 'client']);
    $client = User::factory()->create(['role_id' => $clientRole->id]);

    \App\Models\Intervention::create([
        'client_id'   => $client->id,
        'titre'       => 'Test',
        'description' => 'Test',
        'statut'      => 'nouvelle',
        'priorite'    => 'normale',
    ]);

    expect($client->interventions)->toHaveCount(1);
});
