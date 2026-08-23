<?php

use App\Models\ActivityLog;
use App\Models\InterventionHistory;
use App\Models\LoginAudit;
use App\Models\OrderHistory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    ActivityLog::truncate();
    OrderHistory::truncate();
    InterventionHistory::truncate();
    LoginAudit::truncate();

    $this->app['auth']->forgetGuards();
});

function makeUserForAdminLogsEndpointTest(string $roleName): User
{
    $role = Role::firstOrCreate(['name' => $roleName]);

    return User::factory()->create(['role_id' => $role->id]);
}

it('aggregates entries from all 4 collections without a type filter', function () {
    $admin = makeUserForAdminLogsEndpointTest('admin');
    $client = makeUserForAdminLogsEndpointTest('client');

    ActivityLog::create(['user_id' => $admin->id, 'action' => 'product_created', 'entity' => 'product', 'entity_id' => 1, 'meta' => []]);
    OrderHistory::create(['order_id' => 1, 'status_from' => 'en_attente', 'status_to' => 'validee', 'changed_by' => $admin->id]);
    InterventionHistory::create(['intervention_id' => 1, 'event' => 'created', 'actor' => $client->id, 'meta' => []]);
    LoginAudit::create(['user_id' => $client->id, 'action' => 'login', 'success' => true]);

    $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/logs');

    $response->assertOk();
    $response->assertJsonCount(4, 'data');
    expect($response->json('meta.total'))->toBe(4);

    $types = collect($response->json('data'))->pluck('type')->sort()->values()->all();
    expect($types)->toBe(['activity_log', 'intervention_history', 'login_audit', 'order_history']);
});

it('filters by a single type', function () {
    $admin = makeUserForAdminLogsEndpointTest('admin');

    ActivityLog::create(['user_id' => $admin->id, 'action' => 'product_created', 'entity' => 'product', 'entity_id' => 1, 'meta' => []]);
    LoginAudit::create(['user_id' => $admin->id, 'action' => 'login', 'success' => true]);

    $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/logs?type=login_audit');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    expect($response->json('data.0.type'))->toBe('login_audit');
});

it('filters by user_id across the relevant collections', function () {
    $admin = makeUserForAdminLogsEndpointTest('admin');
    $otherAdmin = makeUserForAdminLogsEndpointTest('admin');

    ActivityLog::create(['user_id' => $admin->id, 'action' => 'product_created', 'entity' => 'product', 'entity_id' => 1, 'meta' => []]);
    ActivityLog::create(['user_id' => $otherAdmin->id, 'action' => 'product_deleted', 'entity' => 'product', 'entity_id' => 2, 'meta' => []]);

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson("/api/admin/logs?type=activity_log&user_id={$admin->id}");

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    expect($response->json('data.0.raw.action'))->toBe('product_created');
});

it('filters by action, mapped correctly per collection', function () {
    $admin = makeUserForAdminLogsEndpointTest('admin');

    OrderHistory::create(['order_id' => 1, 'status_from' => 'en_attente', 'status_to' => 'validee', 'changed_by' => $admin->id]);
    OrderHistory::create(['order_id' => 2, 'status_from' => 'validee', 'status_to' => 'expediee', 'changed_by' => $admin->id]);

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/admin/logs?type=order_history&action=validee');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    expect($response->json('data.0.raw.order_id'))->toBe(1);
});

it('paginates results and reports correct meta', function () {
    $admin = makeUserForAdminLogsEndpointTest('admin');

    foreach (range(1, 25) as $i) {
        ActivityLog::create([
            'user_id' => $admin->id,
            'action' => "action_{$i}",
            'entity' => 'product',
            'entity_id' => $i,
            'meta' => [],
        ]);
    }

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/admin/logs?type=activity_log&per_page=10&page=1');

    $response->assertOk();
    $response->assertJsonCount(10, 'data');
    expect($response->json('meta.total'))->toBe(25);
    expect($response->json('meta.last_page'))->toBe(3);

    $page2 = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/admin/logs?type=activity_log&per_page=10&page=2');

    $page2->assertOk();
    $page2->assertJsonCount(10, 'data');

    // Pas de doublon entre page 1 et page 2
    $idsPage1 = collect($response->json('data'))->pluck('raw.entity_id');
    $idsPage2 = collect($page2->json('data'))->pluck('raw.entity_id');
    expect($idsPage1->intersect($idsPage2))->toBeEmpty();
});

it('rejects access for a non-admin user', function () {
    $client = makeUserForAdminLogsEndpointTest('client');

    $this->actingAs($client, 'sanctum')
        ->getJson('/api/admin/logs')
        ->assertStatus(403);
});
