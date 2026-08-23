<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignInterventionRequest;
use App\Models\Intervention;
use App\Models\Role;
use App\Models\User;
use App\Services\LogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class InterventionAssignmentController extends Controller
{
    public function __construct(private LogService $logService)
    {
    }

    public function assign(AssignInterventionRequest $request, Intervention $intervention): JsonResponse
    {
        if (!in_array($intervention->statut, ['nouvelle', 'assignee'], true)) {
            throw ValidationException::withMessages([
                'statut' => ["Réassignation impossible : l'intervention est au statut '{$intervention->statut}' (autorisé uniquement pour 'nouvelle' ou 'assignee')."],
            ]);
        }

        $technicien = User::findOrFail($request->validated('technicien_id'));

        if (!$technicien->role || $technicien->role->name !== 'technicien') {
            throw ValidationException::withMessages([
                'technicien_id' => ["L'utilisateur sélectionné n'a pas le rôle technicien."],
            ]);
        }

        $previousTechnicienId = $intervention->technicien_id;
        $isReassignment = $previousTechnicienId !== null && $previousTechnicienId !== $technicien->id;

        $intervention->update([
            'technicien_id' => $technicien->id,
            'statut' => 'assignee',
        ]);

        $this->logService->interventionEvent(
            $intervention,
            $isReassignment ? 'reassigned' : 'assigned',
            $request->user(),
            [
                'technicien_id' => $technicien->id,
                'previous_technicien_id' => $previousTechnicienId,
            ]
        );

        return response()->json([
            'message' => 'Intervention assignée avec succès.',
            'intervention' => $intervention->fresh(['client', 'technicien']),
        ]);
    }
}
