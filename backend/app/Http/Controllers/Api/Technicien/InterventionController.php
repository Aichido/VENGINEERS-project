<?php

namespace App\Http\Controllers\Api\Technicien;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInterventionReportRequest;
use App\Http\Requests\UpdateInterventionStatusRequest;
use App\Models\Intervention;
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

        return response()->json($intervention->fresh(['client', 'reports']));
    }

    public function storeReport(StoreInterventionReportRequest $request, Intervention $intervention): JsonResponse
    {
        $this->authorizeOwnership($request, $intervention);

        $path = $request->file('fichier')->store('intervention-reports', 'local');

        $report = $intervention->reports()->create([
            'technicien_id' => $request->user()->id,
            'contenu' => $request->validated('contenu'),
            'fichier_path' => $path,
        ]);

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
