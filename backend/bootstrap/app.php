<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['role' => \App\Http\Middleware\CheckRole::class]);
        $middleware->redirectGuestsTo(fn () => null);

        // Ajout explicite du middleware CORS au groupe api (Laravel 11 ne l'ajoute plus automatiquement)
        $middleware->appendToGroup('api', \Illuminate\Http\Middleware\HandleCors::class);
        
        $middleware->prependToGroup('api', \App\Http\Middleware\SecureHeaders::class);

        // Phase 8 : rate limiting global sur toute l'API (limiteur 'api'
        // défini dans AppServiceProvider::boot()).
        $middleware->throttleApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
         $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }
    });
    })->create();