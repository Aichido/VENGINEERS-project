<?php

use App\Models\LoginAudit;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    LoginAudit::truncate();
});

function makeUserForAuthLogsTest(string $roleName, string $password = 'password123'): User
{
    $role = Role::firstOrCreate(['name' => $roleName]);

    return User::factory()->create([
        'role_id' => $role->id,
        'password' => Hash::make($password),
    ]);
}

it('logs a successful login into login_audit', function () {
    $user = makeUserForAuthLogsTest('client');

    $response = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'password123',
    ]);

    $response->assertOk();

    $log = LoginAudit::where('action', 'login')->latest('timestamp')->first();

    expect($log)->not->toBeNull();
    expect($log->user_id)->toBe($user->id);
    expect($log->success)->toBeTrue();
});

it('logs a failed login into login_audit', function () {
    $user = makeUserForAuthLogsTest('client');

    $response = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(401);

    $log = LoginAudit::where('action', 'login')->latest('timestamp')->first();

    expect($log)->not->toBeNull();
    expect($log->success)->toBeFalse();
    expect($log->reason)->toBe('invalid_credentials');
});

it('logs a register into login_audit', function () {
    Role::firstOrCreate(['name' => 'client']);

    $response = $this->postJson('/api/register', [
        'name' => 'Nouveau Client',
        'email' => 'nouveau.client@example.com',
        'password' => 'Test@1234',
        'password_confirmation' => 'Test@1234',
    ]);

    $response->assertOk();

    $log = LoginAudit::where('action', 'register')->latest('timestamp')->first();

    expect($log)->not->toBeNull();
    expect($log->success)->toBeTrue();
});

it('logs a logout into login_audit', function () {
    $user = makeUserForAuthLogsTest('client');

    $token = $user->createToken('api')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/logout');

    $response->assertOk();

    $log = LoginAudit::where('action', 'logout')->latest('timestamp')->first();

    expect($log)->not->toBeNull();
    expect($log->user_id)->toBe($user->id);
    expect($log->success)->toBeTrue();
});

it('logs an access_denied entry when a role mismatch triggers the CheckRole middleware', function () {
    $client = makeUserForAuthLogsTest('client');

    $response = $this->actingAs($client, 'sanctum')
        ->getJson('/api/admin/users');

    $response->assertStatus(403);

    $log = LoginAudit::where('action', 'access_denied')->latest('timestamp')->first();

    expect($log)->not->toBeNull();
    expect($log->user_id)->toBe($client->id);
    expect($log->reason)->toContain('required=admin');
    expect($log->reason)->toContain('has=client');
});