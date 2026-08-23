<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

class CustomCors
{
    public function handle(Request $request, Closure $next)
    {
        dd('CUSTOM CORS EXECUTED');
        $allowedOrigins = Config::get('cors.allowed_origins', []);
        $origin = $request->headers->get('Origin');

        // Si l'origine est autorisée, on ajoute le header
        if (in_array($origin, $allowedOrigins)) {
            return $next($request)
                ->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Methods', '*')
                ->header('Access-Control-Allow-Headers', '*');
        }

        // Sinon, on ne renvoie aucun header CORS
        return $next($request);
    }
}