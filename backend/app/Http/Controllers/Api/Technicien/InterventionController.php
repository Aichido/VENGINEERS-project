<?php

namespace App\Http\Controllers\Api\Technicien;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInterventionReportRequest;
use App\Http\Requests\UpdateInterventionStatusRequest;
use App\Models\Intervention;
use App\Services\LogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class InterventionController extends Controller
{
    private const ALLOWED_TRANSITIONS = [
        'assignee' => ['en_cours'],
        'en_cours' => ['terminee'],
    ];

    public function __construct(private LogService $logService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Intervention::where('technicien_id', $request->user()->id)
            ->with('client');

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }

        $interventions = $query->latest()->paginate(10);

        return response()->json($interventions);
    }

    public function show(Request $request, Intervention $intervention): JsonResponse
    {
        $this->authorizeOwnership($request, $intervention);

        return response()->json(
            $intervention->load(['client', 'reports'])
        );
    }

    public function update(UpdateInterventionStatusRequest $request, Intervention $intervention): JsonResponse
    {
        $this->authorizeOwnership($request, $intervention);

        $current = $intervention->statut;
        $target = $request->validated('statut');

        // Idempotent : re-soumettre le même statut ne fait rien
        if ($current === $target) {
            return response()->json($intervention->fresh(['client', 'reports']));
        }

        $allowed = self::ALLOWED_TRANSITIONS[$current] ?? [];

        if (!in_array($target, $allowed, true)) {
            throw ValidationException::withMessages([
                'statut' => ["Transition de '{$current}' vers '{$target}' non autorisée."],
            ]);
        }

        if ($target === 'terminee' && $intervention->reports()->doesntExist()) {
            throw ValidationException::withMessages([
                'statut' => ["Un rapport doit être soumis avant de clôturer l'intervention."],
            ]);
        }

        $intervention->update(['statut' => $target]);

        $this->logService->interventionEvent(
            $intervention,
            'status_changed',
            $request->user(),
            ['statut_from' => $current, 'statut_to' => $target]
        );

        return response()->json($intervention->fresh(['client', 'reports']));
    }

    public function history(Request $request, Intervention $intervention): JsonResponse
    {
        $this->authorizeOwnership($request, $intervention);

        $history = \App\Models\InterventionHistory::where('intervention_id', $intervention->id)
            ->orderBy('timestamp', 'desc')
            ->paginate(15);

        return response()->json($history);
    }

    public function storeReport(StoreInterventionReportRequest $request, Intervention $intervention): JsonResponse
    {
        $this->authorizeOwnership($request, $intervention);
        $path = $request->file('fichier')->store('intervention-reports', 'local');

        // store() retourne `false` (pas une exception) en cas d'échec d'écriture
        // (permissions, disque plein, disque mal configuré...). Sans ce contrôle,
        // `false` est casté en 0 par MySQL et on obtient un rapport "fantôme"
        // avec un fichier_path invalide.
        if ($path === false) {
            throw new RuntimeException(
                "Échec de l'enregistrement du fichier sur le disque 'local' (intervention #{$intervention->id})."
            );
        }

        // Garde-fou supplémentaire : le fichier doit réellement exister sur le disque
        // après le store(), sinon on ne persiste pas le rapport en base.
        if (!Storage::disk('local')->exists($path)) {
            throw new RuntimeException(
                "Le fichier rapporté comme stocké est introuvable sur le disque (path: {$path})."
            );
        }

        $report = $intervention->reports()->create([
            'technicien_id' => $request->user()->id,
            'contenu' => $request->validated('contenu'),
            'fichier_path' => $path,
        ]);

        $this->logService->interventionEvent(
            $intervention,
            'report_uploaded',
            $request->user(),
            ['report_id' => $report->id]
        );

        $this->logService->activity(
            $request->user(),
            'intervention_report_uploaded',
            'intervention',
            $intervention->id,
            ['report_id' => $report->id, 'public_id' => $intervention->public_id],
            $request
        );

        return response()->json($report, 201);
    }

    public function reports(Request $request): JsonResponse
    {
        $reports = \App\Models\InterventionReport::where('technicien_id', $request->user()->id)
            ->with('intervention')
            ->latest()
            ->paginate(10);

        return response()->json($reports);
    }

    private function authorizeOwnership(Request $request, Intervention $intervention): void
    {
        abort_if(
            $intervention->technicien_id !== $request->user()->id,
            403,
            'Accès refusé'
        );
    }
}
