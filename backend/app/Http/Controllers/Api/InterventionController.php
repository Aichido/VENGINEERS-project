<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInterventionRequest;
use App\Models\Intervention;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterventionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $interventions = Intervention::where('client_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return response()->json($interventions);
    }

    public function store(StoreInterventionRequest $request): JsonResponse
    {
        $intervention = Intervention::create([
            ...$request->validated(),
            'client_id' => $request->user()->id,
            'statut'    => 'nouvelle',
            'priorite'  => 'normale', // forcé côté serveur
        ]);

        return response()->json($intervention, 201);
    }
}
