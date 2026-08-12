<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInterventionReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contenu' => ['required', 'string'],
            'fichier' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,docx', 'max:10240'],
        ];
    }
}