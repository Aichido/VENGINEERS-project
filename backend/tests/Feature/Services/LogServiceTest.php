<?php

use App\Models\ActivityLog;
use App\Models\Intervention;
use App\Models\InterventionHistory;
use App\Models\LoginAudit;
use App\Models\Order;
use App\Models\OrderHistory;
use App\Models\Role;
use App\Models\User;
use App\Services\LogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

uses(RefreshDatabase::class);

beforeEach(function () {
    ActivityLog::truncate();
    OrderHistory::truncate();
    InterventionHistory::truncate();
    LoginAudit::truncate();
});

function makeUserForLogServiceTest(string $roleName = 'client'): User
{
    $role = Role::firstOrCreate(['name' => $roleName]);

    return User::factory()->create(['role_id' => $role->id]);
}

it('writes an activity log with the expected fields', function () {
    $user = makeUserForLogServiceTest('admin');
    $request = Request::create('/admin/categories', 'POST');
    $request->server->set('REMOTE_ADDR', '10.0.0.5');

    $log = app(LogService::class)->activity($user, 'category_created', 'category', 42, ['name' => 'Écrans'], $request);

    expect(ActivityLog::count())->toBe(1);
    expect($log->user_id)->toBe($user->id);
    expect($log->action)->toBe('category_created');
    expect($log->entity)->toBe('category');
    expect($log->entity_id)->toBe(42);
    expect($log->meta)->toMatchArray(['name' => 'Écrans']);
    expect($log->ip)->toBe('10.0.0.5');
    expect($log->timestamp)->not->toBeNull();
});

it('allows a null user on activity logs (public contact form)', function () {
    $log = app(LogService::class)->activity(null, 'contact_message_submitted', 'contact_message', 1, []);

    expect($log->user_id)->toBeNull();
    expect(ActivityLog::count())->toBe(1);
});

it('writes an order status change into order_history', function () {
    $client = makeUserForLogServiceTest('client');
    $commercial = makeUserForLogServiceTest('commercial');

    $order = Order::create(['client_id' => $client->id, 'status' => 'en_attente', 'total' => 100]);

    $log = app(LogService::class)->orderStatusChange($order, 'en_attente', 'validee', $commercial);

    expect(OrderHistory::count())->toBe(1);
    expect($log->order_id)->toBe($order->id);
    expect($log->status_from)->toBe('en_attente');
    expect($log->status_to)->toBe('validee');
    expect($log->changed_by)->toBe($commercial->id);
});

it('writes an intervention event into intervention_history', function () {
    $client = makeUserForLogServiceTest('client');

    $intervention = Intervention::create([
        'client_id' => $client->id,
        'titre' => 'Écran HS',
        'description' => 'Ne s\'allume plus',
        'statut' => 'nouvelle',
        'priorite' => 'normale',
    ]);

    $log = app(LogService::class)->interventionEvent($intervention, 'created', $client, ['source' => 'client']);

    expect(InterventionHistory::count())->toBe(1);
    expect($log->intervention_id)->toBe($intervention->id);
    expect($log->event)->toBe('created');
    expect($log->actor)->toBe($client->id);
    expect($log->meta)->toMatchArray(['source' => 'client']);
});

it('writes a login audit entry with success and failure states', function () {
    $user = makeUserForLogServiceTest('client');
    $request = Request::create('/login', 'POST');

    $success = app(LogService::class)->loginAudit($user, 'login', true, $request);
    $failure = app(LogService::class)->loginAudit($user, 'login', false, $request, 'invalid_credentials');

    expect(LoginAudit::count())->toBe(2);
    expect($success->success)->toBeTrue();
    expect($failure->success)->toBeFalse();
    expect($failure->reason)->toBe('invalid_credentials');
});

it('allows a null user on login audit (access denied without resolvable actor)', function () {
    $log = app(LogService::class)->loginAudit(null, 'access_denied', false, null, 'no user resolved');

    expect($log->user_id)->toBeNull();
    expect(LoginAudit::count())->toBe(1);
});
