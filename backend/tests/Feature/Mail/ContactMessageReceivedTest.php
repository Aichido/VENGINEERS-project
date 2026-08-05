<?php

use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('has correct envelope', function () {
    $contact = ContactMessage::create([
        'name' => 'Jean Dupont',
        'email' => 'jean@exemple.com',
        'subject' => 'Demande de devis',
        'message' => 'Bonjour, je souhaite un devis.',
    ]);
    $mailable = new ContactMessageReceived($contact);
    $envelope = $mailable->envelope();

    expect($envelope->subject)->toBe('Nouveau message de contact — Demande de devis');
});

it('has correct content', function () {
    $contact = ContactMessage::create([
        'name' => 'Jean Dupont',
        'email' => 'jean@exemple.com',
        'subject' => 'Demande de devis',
        'message' => 'Bonjour, je souhaite un devis.',
    ]);
    $mailable = new ContactMessageReceived($contact);
    $content = $mailable->content();

    expect($content->markdown)->toBe('emails.contact-message-received');
});