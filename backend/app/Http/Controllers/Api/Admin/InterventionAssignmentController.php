<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignInterventionRequest;
use App\Models\Intervention;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class InterventionAssignmentController extends Controller
{
    public function assign(AssignInterventionRequest $request, Intervention $intervention): JsonResponse
    {
        if ($intervention->statut !== 'nouvelle') {
            throw ValidationException::withMessages([
                'statut' => ["Cette intervention n'est plus au statut 'nouvelle' et ne peut pas être assignée."],
            ]);
        }

        $technicien = User::findOrFail($request->validated('technicien_id'));

        if (!$technicien->role || $technicien->role->name !== 'technicien') {
            throw ValidationException::withMessages([
                'technicien_id' => ["L'utilisateur sélectionné n'a pas le rôle technicien."],
            ]);
        }

        $intervention->update([
            'technicien_id' => $technicien->id,
            'statut' => 'assignee',
        ]);

        return response()->json([
            'message' => 'Intervention assignée avec succès.',
            'intervention' => $intervention->fresh(['client', 'technicien']),
        ]);
    }
}