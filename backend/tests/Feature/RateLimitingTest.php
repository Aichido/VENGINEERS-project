<?php

test('rate limiting allows 60 requests per minute then returns 429', function () {
    // 60 requêtes autorisées
    for ($i = 0; $i < 60; $i++) {
        $response = $this->getJson('/api/products');
        $response->assertStatus(200);
    }

    // 61ème → 429 Too Many Requests
    $response = $this->getJson('/api/products');
    $response->assertStatus(429);
    $response->assertHeader('X-RateLimit-Limit', 60);
    $response->assertHeader('X-RateLimit-Remaining', 0);
    $response->assertHeader('Retry-After');
});