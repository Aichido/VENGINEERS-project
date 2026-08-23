<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInterventionRequest;
use App\Models\Intervention;
use App\Services\LogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterventionController extends Controller
{
    public function __construct(private LogService $logService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $interventions = Intervention::where('client_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return response()->json($interventions);
    }

    public function history(Request $request, Intervention $intervention): JsonResponse
    {
        if ($intervention->client_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $history = \App\Models\InterventionHistory::where('intervention_id', $intervention->id)
            ->orderBy('timestamp', 'desc')
            ->paginate(15);

        return response()->json($history);
    }

    public function store(StoreInterventionRequest $request): JsonResponse
    {
        $intervention = Intervention::create([
            ...$request->validated(),
            'client_id' => $request->user()->id,
            'statut'    => 'nouvelle',
            'priorite'  => 'normale', // forcé côté serveur
        ]);

        $this->logService->interventionEvent(
            $intervention,
            'created',
            $request->user(),
            ['titre' => $intervention->titre, 'source' => 'client']
        );

        return response()->json($intervention, 201);
    }
}
