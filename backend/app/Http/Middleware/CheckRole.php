<?php

namespace App\Http\Middleware;

use App\Services\LogService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function __construct(private LogService $logService)
    {
    }

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->role || ! in_array($user->role->name, $roles)) {
            $this->logService->loginAudit(
                $user,
                'access_denied',
                false,
                $request,
                sprintf(
                    'route=%s required=%s has=%s',
                    $request->path(),
                    implode('|', $roles),
                    $user?->role?->name ?? 'none'
                )
            );

            return response()->json(['message' => 'Accès refusé'], 403);
        }

        return $next($request);
    }
}
