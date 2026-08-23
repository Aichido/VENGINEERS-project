<?php

use App\Models\ActivityLog;
use App\Models\Intervention;
use App\Models\InterventionHistory;
use App\Models\Order;
use App\Models\OrderHistory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    ActivityLog::truncate();
    OrderHistory::truncate();
    InterventionHistory::truncate();

    $this->app['auth']->forgetGuards();
});

function makeUserForHistoryEndpointsTest(string $roleName): User
{
    $role = Role::firstOrCreate(['name' => $roleName]);

    return User::factory()->create(['role_id' => $role->id]);
}

// ---------- Orders ----------

it('lets a client view their own order history', function () {
    $client = makeUserForHistoryEndpointsTest('client');
    $order = Order::create(['client_id' => $client->id, 'status' => 'validee', 'total' => 500]);

    OrderHistory::create([
        'order_id' => $order->id,
        'status_from' => 'en_attente',
        'status_to' => 'validee',
        'changed_by' => $client->id,
    ]);

    $response = $this->actingAs($client, 'sanctum')
        ->getJson('/api/client/orders/' . rawurlencode($order->public_id) . '/history');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
});

it('forbids a client from viewing another client\'s order history', function () {
    $client = makeUserForHistoryEndpointsTest('client');
    $otherClient = makeUserForHistoryEndpointsTest('client');
    $order = Order::create(['client_id' => $otherClient->id, 'status' => 'validee', 'total' => 500]);

    $this->actingAs($client, 'sanctum')
        ->getJson('/api/client/orders/' . rawurlencode($order->public_id) . '/history')
        ->assertStatus(403);
});

it('lets a commercial view any order history without ownership restriction', function () {
    $commercial = makeUserForHistoryEndpointsTest('commercial');
    $client = makeUserForHistoryEndpointsTest('client');
    $order = Order::create(['client_id' => $client->id, 'status' => 'validee', 'total' => 500]);

    OrderHistory::create([
        'order_id' => $order->id,
        'status_from' => 'en_attente',
        'status_to' => 'validee',
        'changed_by' => $commercial->id,
    ]);

    $this->actingAs($commercial, 'sanctum')
        ->getJson('/api/commercial/orders/' . rawurlencode($order->public_id) . '/history')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

// ---------- Interventions ----------

it('lets a client view their own intervention history', function () {
    $client = makeUserForHistoryEndpointsTest('client');
    $intervention = Intervention::create([
        'client_id' => $client->id,
        'titre' => 'Test',
        'description' => 'Test',
        'statut' => 'nouvelle',
        'priorite' => 'normale',
    ]);

    InterventionHistory::create(['intervention_id' => $intervention->id, 'event' => 'created', 'actor' => $client->id, 'meta' => []]);

    $this->actingAs($client, 'sanctum')
        ->getJson('/api/client/interventions/' . rawurlencode($intervention->public_id) . '/history')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('forbids a client from viewing another client\'s intervention history', function () {
    $client = makeUserForHistoryEndpointsTest('client');
    $otherClient = makeUserForHistoryEndpointsTest('client');
    $intervention = Intervention::create([
        'client_id' => $otherClient->id,
        'titre' => 'Test',
        'description' => 'Test',
        'statut' => 'nouvelle',
        'priorite' => 'normale',
    ]);

    $this->actingAs($client, 'sanctum')
        ->getJson('/api/client/interventions/' . rawurlencode($intervention->public_id) . '/history')
        ->assertStatus(403);
});

it('lets an assigned technicien view the intervention history', function () {
    $client = makeUserForHistoryEndpointsTest('client');
    $technicien = makeUserForHistoryEndpointsTest('technicien');
    $intervention = Intervention::create([
        'client_id' => $client->id,
        'technicien_id' => $technicien->id,
        'titre' => 'Test',
        'description' => 'Test',
        'statut' => 'assignee',
        'priorite' => 'normale',
    ]);

    InterventionHistory::create(['intervention_id' => $intervention->id, 'event' => 'assigned', 'actor' => $client->id, 'meta' => []]);

    $this->actingAs($technicien, 'sanctum')
        ->getJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id) . '/history')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('forbids a technicien from viewing the history of an intervention not assigned to them', function () {
    $client = makeUserForHistoryEndpointsTest('client');
    $technicien = makeUserForHistoryEndpointsTest('technicien');
    $otherTechnicien = makeUserForHistoryEndpointsTest('technicien');
    $intervention = Intervention::create([
        'client_id' => $client->id,
        'technicien_id' => $otherTechnicien->id,
        'titre' => 'Test',
        'description' => 'Test',
        'statut' => 'assignee',
        'priorite' => 'normale',
    ]);

    $this->actingAs($technicien, 'sanctum')
        ->getJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id) . '/history')
        ->assertStatus(403);
});

// ---------- Pas de log sur simple consultation ----------

it('does not write any activity_log when consulting a history endpoint (read-only)', function () {
    $client = makeUserForHistoryEndpointsTest('client');
    $order = Order::create(['client_id' => $client->id, 'status' => 'validee', 'total' => 500]);

    $this->actingAs($client, 'sanctum')
        ->getJson('/api/client/orders/' . rawurlencode($order->public_id) . '/history')
        ->assertOk();

    expect(ActivityLog::count())->toBe(0);
});
