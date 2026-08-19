<?php
// app/Http/Requests/Admin/StoreAdminInterventionRequest.php
namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdminInterventionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'client_id' => [
                'required',
                'integer',
                function ($attribute, $value, $fail) {
                    $client = User::with('role')->find($value);
                    if (!$client || !$client->role || $client->role->name !== 'client') {
                        $fail("Le client sélectionné n'existe pas ou n'a pas le rôle client.");
                    }
                },
            ],
            'titre' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'equipement' => ['nullable', 'string', 'max:255'],
            'priorite' => ['nullable', Rule::in(['basse', 'normale', 'haute', 'urgente'])],
            'date_souhaitee' => ['nullable', 'date'],
        ];
    }
}