<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use App\Services\LogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function __construct(private LogService $logService)
    {
    }

    public function store(StoreContactRequest $request): JsonResponse
    {
        $contactMessage = ContactMessage::create($request->validated());

        Mail::to(config('mail.admin_address'))
            ->send(new ContactMessageReceived($contactMessage));

        // Requête publique, non authentifiée : $request->user() sera toujours null ici
        $this->logService->activity(
            null,
            'contact_message_submitted',
            'contact_message',
            $contactMessage->id,
            ['email' => $contactMessage->email, 'subject' => $contactMessage->subject],
            $request
        );

        return response()->json([
            'message' => 'Votre message a bien été envoyé.',
            'data' => $contactMessage,
        ], 201);
    }
}
