<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignInterventionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // gated par le middleware role:admin sur la route
    }

    public function rules(): array
    {
        return [
            'technicien_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }
}