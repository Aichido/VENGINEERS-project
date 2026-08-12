<?php

use App\Models\Intervention;
use App\Models\InterventionReport;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function actingTechnicienForReportTest(): array
{
    $role = Role::firstOrCreate(['name' => 'technicien']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function actingClientForReportTest(): array
{
    $role = Role::firstOrCreate(['name' => 'client']);
    $user = User::factory()->create(['role_id' => $role->id]);

    return [$user, $user->createToken('test')->plainTextToken];
}

function makeAssignedInterventionForReportTest(User $technicien, array $overrides = []): Intervention
{
    [$client] = actingClientForReportTest();

    return Intervention::create(array_merge([
        'client_id' => $client->id,
        'technicien_id' => $technicien->id,
        'titre' => 'Panne routeur',
        'description' => 'Description test',
        'statut' => 'en_cours',
        'priorite' => 'normale',
    ], $overrides));
}

it('uploads a report successfully and stores the file', function () {
    Storage::fake('local');

    [$technicien, $token] = actingTechnicienForReportTest();
    $intervention = makeAssignedInterventionForReportTest($technicien);

    $file = UploadedFile::fake()->create('rapport.pdf', 500, 'application/pdf');

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id) . '/report', [
            'contenu' => 'Intervention terminée avec succès.',
            'fichier' => $file,
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('intervention_id', $intervention->id)
        ->assertJsonPath('technicien_id', $technicien->id);

    $this->assertDatabaseHas('intervention_reports', [
        'intervention_id' => $intervention->id,
        'technicien_id' => $technicien->id,
    ]);

    Storage::disk('local')->assertExists($response->json('fichier_path'));
});

it('rejects report submission without a file', function () {
    [$technicien, $token] = actingTechnicienForReportTest();
    $intervention = makeAssignedInterventionForReportTest($technicien);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id) . '/report', [
            'contenu' => 'Sans fichier',
        ])
        ->assertStatus(422);
});

it('rejects report submission with a disallowed file type', function () {
    [$technicien, $token] = actingTechnicienForReportTest();
    $intervention = makeAssignedInterventionForReportTest($technicien);

    $file = UploadedFile::fake()->create('script.exe', 100, 'application/x-msdownload');

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id) . '/report', [
            'contenu' => 'Fichier non autorisé',
            'fichier' => $file,
        ])
        ->assertStatus(422);
});

it('rejects report submission with a file exceeding the size limit', function () {
    [$technicien, $token] = actingTechnicienForReportTest();
    $intervention = makeAssignedInterventionForReportTest($technicien);

    $file = UploadedFile::fake()->create('rapport.pdf', 10241, 'application/pdf'); // > 10 Mo

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id) . '/report', [
            'contenu' => 'Fichier trop lourd',
            'fichier' => $file,
        ])
        ->assertStatus(422);
});

it('rejects report submission for an intervention owned by another technicien', function () {
    [$owner] = actingTechnicienForReportTest();
    [$other, $otherToken] = actingTechnicienForReportTest();

    $intervention = makeAssignedInterventionForReportTest($owner);

    $file = UploadedFile::fake()->create('rapport.pdf', 500, 'application/pdf');

    $this->withHeader('Authorization', "Bearer {$otherToken}")
        ->postJson('/api/technicien/interventions/' . rawurlencode($intervention->public_id) . '/report', [
            'contenu' => 'Tentative non autorisée',
            'fichier' => $file,
        ])
        ->assertStatus(403);
});

it('lists only reports submitted by the authenticated technicien', function () {
    [$technicien, $token] = actingTechnicienForReportTest();
    [$other] = actingTechnicienForReportTest();

    $ownIntervention = makeAssignedInterventionForReportTest($technicien);
    $otherIntervention = makeAssignedInterventionForReportTest($other);

    InterventionReport::create([
        'intervention_id' => $ownIntervention->id,
        'technicien_id' => $technicien->id,
        'contenu' => 'Mon rapport',
        'fichier_path' => 'intervention-reports/own.pdf',
    ]);

    InterventionReport::create([
        'intervention_id' => $otherIntervention->id,
        'technicien_id' => $other->id,
        'contenu' => 'Rapport autre technicien',
        'fichier_path' => 'intervention-reports/other.pdf',
    ]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/technicien/reports');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(1);
});