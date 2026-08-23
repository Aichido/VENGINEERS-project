<?php

test('secure headers are present in api responses', function () {
    $response = $this->getJson('/api/products');

    $response->assertStatus(200);
    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertHeader('X-Frame-Options', 'DENY');
    $response->assertHeader('X-XSS-Protection', '1; mode=block');
    $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
});

test('secure headers are present in admin api responses', function () {
    // On utilise une route admin protégée pour vérifier que le middleware s'applique bien à tout le groupe api
    $response = $this->getJson('/api/admin/products');
    
    // Sans authentification, on attend un 401, mais les headers doivent être présents
    $response->assertStatus(401);
    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertHeader('X-Frame-Options', 'DENY');
    $response->assertHeader('X-XSS-Protection', '1; mode=block');
    $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
});