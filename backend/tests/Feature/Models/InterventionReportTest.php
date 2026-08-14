<?php

use App\Models\Intervention;
use App\Models\InterventionReport;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);
function makeInterventionForReportModelTest(): array
{
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

    return [$intervention, $technicien];
}

it('has the correct fillable attributes', function () {
    $report = new InterventionReport();

    expect($report->getFillable())->toEqual([
        'intervention_id',
        'technicien_id',
        'contenu',
        'fichier_path',
    ]);
});

it('belongs to an intervention', function () {
    [$intervention, $technicien] = makeInterventionForReportModelTest();

    $report = InterventionReport::create([
        'intervention_id' => $intervention->id,
        'technicien_id'   => $technicien->id,
        'contenu'         => 'Rapport',
        'fichier_path'    => 'intervention-reports/one.pdf',
    ]);

    expect($report->intervention)->toBeInstanceOf(Intervention::class);
    expect($report->intervention->id)->toBe($intervention->id);
});

it('belongs to a technicien', function () {
    [$intervention, $technicien] = makeInterventionForReportModelTest();

    $report = InterventionReport::create([
        'intervention_id' => $intervention->id,
        'technicien_id'   => $technicien->id,
        'contenu'         => 'Rapport',
        'fichier_path'    => 'intervention-reports/one.pdf',
    ]);

    expect($report->technicien)->toBeInstanceOf(User::class);
    expect($report->technicien->id)->toBe($technicien->id);
});

it('allows a nullable fichier_path', function () {
    [$intervention, $technicien] = makeInterventionForReportModelTest();

    $report = InterventionReport::create([
        'intervention_id' => $intervention->id,
        'technicien_id'   => $technicien->id,
        'contenu'         => 'Rapport sans fichier',
        'fichier_path'    => null,
    ]);

    expect($report->fichier_path)->toBeNull();
});

it('is deleted when its intervention is deleted', function () {
    [$intervention, $technicien] = makeInterventionForReportModelTest();

    $report = InterventionReport::create([
        'intervention_id' => $intervention->id,
        'technicien_id'   => $technicien->id,
        'contenu'         => 'Rapport',
        'fichier_path'    => 'intervention-reports/one.pdf',
    ]);

    $intervention->delete();

    $this->assertDatabaseMissing('intervention_reports', ['id' => $report->id]);
});

it('conserve le rapport meme apres soft delete du technicien auteur', function () {
    [$intervention, $technicien] = makeInterventionForReportModelTest();

    $report = InterventionReport::create([
        'intervention_id' => $intervention->id,
        'technicien_id'   => $technicien->id,
        'contenu'         => 'Rapport',
        'fichier_path'    => 'intervention-reports/one.pdf',
    ]);

    $technicien->delete(); // soft delete — historique preserve (decision Phase 6.1)

    // le rapport reste en base, non supprime physiquement
    $this->assertDatabaseHas('intervention_reports', ['id' => $report->id]);
    expect($report->fresh()->technicien_id)->toBe($technicien->id);
});