<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInterventionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titre'          => ['required', 'string', 'max:255'],
            'description'    => ['required', 'string'],
            'equipement'     => ['nullable', 'string', 'max:255'],
            'date_souhaitee' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }
}