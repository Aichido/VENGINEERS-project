<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInterventionStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // scoping fait dans le contrôleur (technicien_id === auth id)
    }

    public function rules(): array
    {
        return [
            'statut' => ['required', 'string', 'in:assignee,en_cours,terminee'],
        ];
    }
}