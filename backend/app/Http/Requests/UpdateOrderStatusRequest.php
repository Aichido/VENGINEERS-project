<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorisation déjà gérée par le middleware role:commercial
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:en_attente,validee,expediee,livree,annulee'],
        ];
    }
}