<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Vengineers : les origines autorisées sont pilotées par la variable
    | d'environnement FRONTEND_URL (une ou plusieurs URLs séparées par des
    | virgules, sans espace), pour rester flexible entre dev/staging/prod
    | sans jamais toucher au code.
    |
    | Exemple .env :
    |   FRONTEND_URL=http://localhost:5173
    |   FRONTEND_URL=https://app.vengineers.mu,https://staging.vengineers.mu
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],
    
    'allowed_origins' => ['http://localhost:5173'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // false : pas de cookies httpOnly cross-origin dans cette config (auth par
    // Bearer token). À repasser à true uniquement si un mode cookie Sanctum
    // SPA est explicitement adopté plus tard (cf. point de vigilance soutenance).
    'supports_credentials' => false,

];
