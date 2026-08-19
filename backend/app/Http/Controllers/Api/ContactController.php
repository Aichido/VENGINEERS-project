<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(StoreContactRequest $request): JsonResponse
    {
        $contactMessage = ContactMessage::create($request->validated());

        Mail::to(config('mail.admin_address'))
            ->send(new ContactMessageReceived($contactMessage));

        return response()->json([
            'message' => 'Votre message a bien été envoyé.',
            'data' => $contactMessage,
        ], 201);
    }
}
