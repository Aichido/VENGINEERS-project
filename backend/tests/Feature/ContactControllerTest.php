<?php

use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Nécessaire car le controller fait Mail::to(config('mail.admin_address'))->send(...)
    // Assure-toi que MAIL_ADMIN_ADDRESS est bien lu dans config/mail.php ('admin_address' => env('MAIL_ADMIN_ADDRESS')).
    config(['mail.admin_address' => 'admin@vengineers.com']);
});

test('store cree un message de contact et envoie le mail avec des donnees valides', function () {
    Mail::fake();

    $payload = [
        'name' => 'Jean Dupont',
        'email' => 'jean.dupont@example.com',
        'subject' => 'Demande de devis',
        'message' => 'Bonjour, je souhaite un devis pour un écran tactile 55 pouces.',
    ];

    $response = $this->postJson('/api/contact', $payload);

    $response->assertCreated();
    $response->assertJsonPath('message', 'Votre message a bien été envoyé.');

    $this->assertDatabaseHas('contact_messages', [
        'name' => 'Jean Dupont',
        'email' => 'jean.dupont@example.com',
        'subject' => 'Demande de devis',
    ]);

    Mail::assertSent(ContactMessageReceived::class, function (ContactMessageReceived $mail) {
        return $mail->hasTo('admin@vengineers.com');
    });
});

test('store envoie le mail exactement une fois', function () {
    Mail::fake();

    $this->postJson('/api/contact', [
        'name' => 'Marie Curie',
        'email' => 'marie@example.com',
        'subject' => 'Question',
        'message' => 'Un message de test suffisamment long.',
    ]);

    Mail::assertSent(ContactMessageReceived::class, 1);
});

test('store retourne 422 si des champs obligatoires sont manquants', function () {
    Mail::fake();

    $response = $this->postJson('/api/contact', [
        'name' => '',
        'email' => '',
        'subject' => '',
        'message' => '',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['name', 'email', 'subject', 'message']);

    Mail::assertNothingSent();
    expect(ContactMessage::count())->toBe(0);
});

test('store retourne 422 si l\'email est invalide', function () {
    Mail::fake();

    $response = $this->postJson('/api/contact', [
        'name' => 'Jean Dupont',
        'email' => 'pas-un-email',
        'subject' => 'Demande de devis',
        'message' => 'Bonjour, je souhaite un devis.',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['email']);

    Mail::assertNothingSent();
    expect(ContactMessage::count())->toBe(0);
});

test('store retourne 422 si name/email/subject depassent 255 caracteres', function () {
    Mail::fake();

    $response = $this->postJson('/api/contact', [
        'name' => str_repeat('a', 256),
        'email' => str_repeat('a', 250).'@example.com',
        'subject' => str_repeat('a', 256),
        'message' => 'Un message valide.',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['name', 'email', 'subject']);

    Mail::assertNothingSent();
});

test('store retourne 422 si message depasse 5000 caracteres', function () {
    Mail::fake();

    $response = $this->postJson('/api/contact', [
        'name' => 'Jean Dupont',
        'email' => 'jean.dupont@example.com',
        'subject' => 'Demande de devis',
        'message' => str_repeat('a', 5001),
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['message']);

    Mail::assertNothingSent();
});
