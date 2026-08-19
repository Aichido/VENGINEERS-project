<?php

// app/Http/Controllers/Api/Admin/InterventionController.php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminInterventionRequest;
use App\Models\Intervention;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterventionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Intervention::query()->with(['client', 'technicien']);

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }

        if ($request->filled('technicien_id')) {
            $query->where('technicien_id', $request->query('technicien_id'));
        }

        if ($request->filled('priorite')) {
            $query->where('priorite', $request->query('priorite'));
        }

        $interventions = $query->latest()->paginate(15);

        return response()->json($interventions);
    }

    public function store(StoreAdminInterventionRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $intervention = Intervention::create([
            'client_id' => $validated['client_id'],
            'titre' => $validated['titre'],
            'description' => $validated['description'],
            'equipement' => $validated['equipement'] ?? null,
            'priorite' => $validated['priorite'] ?? 'normale',
            'date_souhaitee' => $validated['date_souhaitee'] ?? null,
            'statut' => 'nouvelle',
        ]);

        return response()->json($intervention->load('client'), 201);
    }
    public function reports(Intervention $intervention): JsonResponse
    {
        return response()->json(
            $intervention->reports()->with('technicien')->latest()->get()
        );
    }

}
