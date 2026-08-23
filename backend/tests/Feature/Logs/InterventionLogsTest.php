<?php

use App\Models\ActivityLog;
use App\Models\Intervention;
use App\Models\InterventionHistory;
use App\Models\InterventionReport;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

beforeEach(function () {
    ActivityLog::truncate();
    InterventionHistory::truncate();

    $this->app['auth']->forgetGuards();
});

function makeUserForInterventionLogsTest(string $roleName): User
{
    $role = Role::firstOrCreate(['name' => $roleName]);

    return User::factory()->create(['role_id' => $role->id]);
}

it('logs a created event (source client) when a client creates an intervention', function () {
    $client = makeUserForInterventionLogsTest('client');

    $response = $this->actingAs($client, 'sanctum')->postJson('/api/client/interventions', [
        'titre' => 'Écran tactile ne répond plus',
        'description' => 'Aucune réaction depuis ce matin',
    ]);

    $response->assertCreated();

    $log = InterventionHistory::where('event', 'created')->first();

    expect($log)->not->toBeNull();
    expect($log->actor)->toBe($client->id);
    expect($log->meta['source'])->toBe('client');
});

it('logs a created event (source admin) when an admin creates an intervention', function () {
    $admin = makeUserForInterventionLogsTest('admin');
    $client = makeUserForInterventionLogsTest('client');

    $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/interventions', [
        'client_id' => $client->id,
        'titre' => 'Maintenance préventive',
        'description' => 'Contrôle trimestriel',
    ]);

    $response->assertCreated();

    $log = InterventionHistory::where('event', 'created')->first();

    expect($log)->not->toBeNull();
    expect($log->actor)->toBe($admin->id);
    expect($log->meta['source'])->toBe('admin');
});

it('logs an assigned event on first assignment and reassigned on a second one', function () {
    $admin = makeUserForInterventionLogsTest('admin');
    $client = makeUserForInterventionLogsTest('client');
    $technicien1 = makeUserForInterventionLogsTest('technicien');
    $technicien2 = makeUserForInterventionLogsTest('technicien');

    $intervention = Intervention::create([
        'client_id' => $client->id,
        'titre' => 'Panne réseau',
        'description' => 'Perte de connexion intermittente',
        'statut' => 'nouvelle',
        'priorite' => 'haute',
    ]);

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/admin/interventions/' . rawurlencode($intervention->public_id) . '/assign', [
            'technicien_id' => $technicien1->id,
        ])->assertOk();

    $first = InterventionHistory::where('event', 'assigned')->first();
    expect($first)->not->toBeNull();
    expect($first->meta['previous_technicien_id'])->toBeNull();

    $this->app['auth']->forgetGuards();

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/admin/interventions/' . rawurlencode($intervention->public_id) . '/assign', [
            'technicien_id' => $technicien2->id,
        ])->assertOk();

    $second = InterventionHistory::where('event', 'reassigned')->first();
    expect($second)->not->toBeNull();
    expect($second->meta['previous_technicien_id'])->toBe($technicien1->id);
    expect($second->meta['technicien_id'])->toBe($technicien2->id);
});

it('logs a status_changed event when a technicien updates intervention status', function () {
    $client = makeUserForInterventionLogsTest('client');
    $technicien = makeUserForInterventionLogsTest('technicien');

    $intervention = Intervention::create([
        'client_id' => $client->id,
        'technicien_id' => $technicien->id,
        'titre' => 'Vidéoprojecteur HS',
        'description' => 'Lampe grillée',
        'statut' => 'assignee',
        'priorite' => 'normale',
    ]);

    $response = $this->actingAs($technicien, 'sanctum')
        ->putJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id), [
            'statut' => 'en_cours',
        ]);

    $response->assertOk();

    $log = InterventionHistory::where('event', 'status_changed')->first();

    expect($log)->not->toBeNull();
    expect($log->meta['statut_from'])->toBe('assignee');
    expect($log->meta['statut_to'])->toBe('en_cours');
});

it('logs both an intervention_history and an activity_log entry when a report is uploaded', function () {
    $client = makeUserForInterventionLogsTest('client');
    $technicien = makeUserForInterventionLogsTest('technicien');

    $intervention = Intervention::create([
        'client_id' => $client->id,
        'technicien_id' => $technicien->id,
        'titre' => 'Écran tactile',
        'description' => 'Calibration nécessaire',
        'statut' => 'en_cours',
        'priorite' => 'normale',
    ]);

    $file = UploadedFile::fake()->create('rapport.pdf', 100, 'application/pdf');

    $response = $this->actingAs($technicien, 'sanctum')
        ->postJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id) . '/report', [
            'contenu' => 'Calibration effectuée, tout fonctionne.',
            'fichier' => $file,
        ]);

    $response->assertCreated();

    expect(InterventionHistory::where('event', 'report_uploaded')->count())->toBe(1);
    expect(ActivityLog::where('action', 'intervention_report_uploaded')->count())->toBe(1);

    $activityLog = ActivityLog::where('action', 'intervention_report_uploaded')->first();
    expect($activityLog->user_id)->toBe($technicien->id);
});

it('logs an activity_log entry on each authorized report download', function () {
    $client = makeUserForInterventionLogsTest('client');
    $technicien = makeUserForInterventionLogsTest('technicien');
    $admin = makeUserForInterventionLogsTest('admin');

    $intervention = Intervention::create([
        'client_id' => $client->id,
        'technicien_id' => $technicien->id,
        'titre' => 'Écran tactile',
        'description' => 'Calibration nécessaire',
        'statut' => 'en_cours',
        'priorite' => 'normale',
    ]);

    $report = InterventionReport::create([
        'intervention_id' => $intervention->id,
        'technicien_id' => $technicien->id,
        'contenu' => 'Test',
        'fichier_path' => 'intervention-reports/rapport-test.pdf',
    ]);

    \Illuminate\Support\Facades\Storage::disk('local')->put($report->fichier_path, 'contenu-test');

    $downloadUrl = '/api/interventions/' . rawurlencode($intervention->public_id) . "/reports/{$report->id}/download";

    foreach ([$technicien, $admin, $client] as $user) {
        $this->app['auth']->forgetGuards();
        $this->actingAs($user, 'sanctum')->get($downloadUrl)->assertOk();
    }

    expect(ActivityLog::where('action', 'intervention_report_downloaded')->count())->toBe(3);
});

it('does not log anything when a report download is unauthorized', function () {
    $client = makeUserForInterventionLogsTest('client');
    $otherClient = makeUserForInterventionLogsTest('client');
    $technicien = makeUserForInterventionLogsTest('technicien');

    $intervention = Intervention::create([
        'client_id' => $client->id,
        'technicien_id' => $technicien->id,
        'titre' => 'Écran tactile',
        'description' => 'Calibration nécessaire',
        'statut' => 'en_cours',
        'priorite' => 'normale',
    ]);

    $report = InterventionReport::create([
        'intervention_id' => $intervention->id,
        'technicien_id' => $technicien->id,
        'contenu' => 'Test',
        'fichier_path' => 'intervention-reports/rapport-test.pdf',
    ]);

    \Illuminate\Support\Facades\Storage::disk('local')->put($report->fichier_path, 'contenu-test');

    $downloadUrl = '/api/interventions/' . rawurlencode($intervention->public_id) . "/reports/{$report->id}/download";

    $this->actingAs($otherClient, 'sanctum')->get($downloadUrl)->assertStatus(403);

    expect(ActivityLog::where('action', 'intervention_report_downloaded')->count())->toBe(0);
});
