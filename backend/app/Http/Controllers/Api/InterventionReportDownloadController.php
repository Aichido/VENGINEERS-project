<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\InterventionReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InterventionReportDownloadController extends Controller
{
    public function download(Request $request, Intervention $intervention, InterventionReport $report): StreamedResponse
    {
        // vérifie que le rapport appartient bien à cette intervention (pas juste un id valide au hasard)
        abort_unless($report->intervention_id === $intervention->id, 404);

        $user = $request->user();
        $role = $user->role->name ?? null;

        $authorized = match ($role) {
            'admin' => true,
            'client' => $intervention->client_id === $user->id,
            'technicien' => $report->technicien_id === $user->id,
            default => false,
        };

        abort_unless($authorized, 403, 'Accès refusé');

        abort_unless(
            $report->fichier_path && Storage::disk('local')->exists($report->fichier_path),
            404,
            'Fichier introuvable'
        );

        return Storage::disk('local')->download($report->fichier_path);
    }
}
