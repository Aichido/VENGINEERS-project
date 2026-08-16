<?php

use App\Models\Intervention;
use App\Models\InterventionReport;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function actingAdminForDownloadTest(): User
{
    $role = Role::firstOrCreate(['name' => 'admin']);
    return User::factory()->create(['role_id' => $role->id]);
}

function actingClientForDownloadTest(): User
{
    $role = Role::firstOrCreate(['name' => 'client']);
    return User::factory()->create(['role_id' => $role->id]);
}

function actingTechnicienForDownloadTest(): User
{
    $role = Role::firstOrCreate(['name' => 'technicien']);
    return User::factory()->create(['role_id' => $role->id]);
}

function actingCommercialForDownloadTest(): User
{
    $role = Role::firstOrCreate(['name' => 'commercial']);
    return User::factory()->create(['role_id' => $role->id]);
}

function makeInterventionWithReportForDownloadTest(): array
{
    $client = actingClientForDownloadTest();
    $technicien = actingTechnicienForDownloadTest();

    $intervention = Intervention::create([
        'client_id' => $client->id,
        'technicien_id' => $technicien->id,
        'titre' => 'Test download',
        'description' => 'Description test',
        'statut' => 'en_cours',
        'priorite' => 'normale',
    ]);

    Storage::fake('local');
    Storage::disk('local')->put('intervention-reports/test.pdf', 'contenu-fake-pdf');

    $report = InterventionReport::create([
        'intervention_id' => $intervention->id,
        'technicien_id' => $technicien->id,
        'contenu' => 'Rapport de test',
        'fichier_path' => 'intervention-reports/test.pdf',
    ]);

    return [$intervention, $report, $client, $technicien];
}

function downloadUrlForTest(Intervention $intervention, InterventionReport $report): string
{
    return '/api/interventions/' . rawurlencode($intervention->public_id) . "/reports/{$report->id}/download";
}

it('permet a un admin de telecharger un rapport', function () {
    [$intervention, $report] = makeInterventionWithReportForDownloadTest();
    $admin = actingAdminForDownloadTest();
    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->get(downloadUrlForTest($intervention, $report));

    $response->assertOk();
});

it('permet au client concerne de telecharger le rapport', function () {
    [$intervention, $report, $client] = makeInterventionWithReportForDownloadTest();
    $token = $client->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->get(downloadUrlForTest($intervention, $report));

    $response->assertOk();
});

it('permet au technicien auteur de telecharger son rapport', function () {
    [$intervention, $report, $client, $technicien] = makeInterventionWithReportForDownloadTest();
    $token = $technicien->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->get(downloadUrlForTest($intervention, $report));

    $response->assertOk();
});

it('refuse le telechargement sans authentification', function () {
    [$intervention, $report] = makeInterventionWithReportForDownloadTest();

    $response = $this->get(downloadUrlForTest($intervention, $report));

    $response->assertUnauthorized();
});

it('refuse un client non concerne par l intervention', function () {
    [$intervention, $report] = makeInterventionWithReportForDownloadTest();
    $autreClient = actingClientForDownloadTest();
    $token = $autreClient->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->get(downloadUrlForTest($intervention, $report));

    $response->assertForbidden();
});

it('refuse un technicien qui n est pas l auteur du rapport', function () {
    [$intervention, $report] = makeInterventionWithReportForDownloadTest();
    $autreTechnicien = actingTechnicienForDownloadTest();
    $token = $autreTechnicien->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->get(downloadUrlForTest($intervention, $report));

    $response->assertForbidden();
});

it('refuse un commercial quel que soit le contexte', function () {
    [$intervention, $report] = makeInterventionWithReportForDownloadTest();
    $commercial = actingCommercialForDownloadTest();
    $token = $commercial->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->get(downloadUrlForTest($intervention, $report));

    $response->assertForbidden();
});

it('retourne 404 si le rapport n appartient pas a l intervention', function () {
    [$intervention1] = makeInterventionWithReportForDownloadTest();
    [$intervention2, $reportIntervention2] = makeInterventionWithReportForDownloadTest();

    $admin = actingAdminForDownloadTest();
    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->get(downloadUrlForTest($intervention1, $reportIntervention2));

    $response->assertNotFound();
});

it('retourne 404 si le fichier est absent du disque', function () {
    [$intervention, $report] = makeInterventionWithReportForDownloadTest();

    Storage::disk('local')->delete($report->fichier_path);

    $admin = actingAdminForDownloadTest();
    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->get(downloadUrlForTest($intervention, $report));

    $response->assertNotFound();
});

it('autorise l ancien technicien auteur meme apres reassignation de l intervention', function () {
    [$intervention, $report, $client, $ancienTechnicien] = makeInterventionWithReportForDownloadTest();

    $nouveauTechnicien = actingTechnicienForDownloadTest();
    $intervention->update(['technicien_id' => $nouveauTechnicien->id]);

    $token = $ancienTechnicien->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->get(downloadUrlForTest($intervention, $report));

    $response->assertOk();
});

it('refuse le nouveau technicien assigne qui n est pas l auteur du rapport', function () {
    [$intervention, $report, $client, $ancienTechnicien] = makeInterventionWithReportForDownloadTest();

    $nouveauTechnicien = actingTechnicienForDownloadTest();
    $intervention->update(['technicien_id' => $nouveauTechnicien->id]);

    $token = $nouveauTechnicien->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->get(downloadUrlForTest($intervention, $report));

    $response->assertForbidden();
});