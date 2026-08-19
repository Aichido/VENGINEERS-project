<?php
// app/Http/Controllers/Api/Admin/StatsController.php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class StatsController extends Controller
{
    private const CA_STATUSES = ['validee', 'expediee', 'livree'];
    private const OPEN_INTERVENTION_STATUSES = ['nouvelle', 'assignee', 'en_cours'];

    public function index(): JsonResponse
    {
        return response()->json([
            'ca_total' => $this->caTotal(),
            'ca_mois_en_cours' => $this->caMoisEnCours(),
            'commandes_par_statut' => $this->commandesParStatut(),
            'interventions_ouvertes_par_priorite' => $this->interventionsOuvertesParPriorite(),
            'utilisateurs_par_role' => $this->utilisateursParRole(),
        ]);
    }

    private function caTotal(): string
    {
        return (string) Order::whereIn('status', self::CA_STATUSES)->sum('total');
    }

    private function caMoisEnCours(): string
    {
        return (string) Order::whereIn('status', self::CA_STATUSES)
            ->whereDate('created_at', '>=', Carbon::now()->startOfMonth())
            ->sum('total');
    }

    private function commandesParStatut(): array
{
    return Order::query()
        ->selectRaw('status, count(*) as nombre')
        ->groupBy('status')
        ->pluck('nombre', 'status')
        ->toArray();
}

    private function interventionsOuvertesParPriorite(): array
{
    return Intervention::query()
        ->whereIn('statut', self::OPEN_INTERVENTION_STATUSES)
        ->selectRaw('priorite, count(*) as nombre')
        ->groupBy('priorite')
        ->pluck('nombre', 'priorite')
        ->toArray();
}

private function utilisateursParRole(): array
{
    return User::query()
        ->join('roles', 'users.role_id', '=', 'roles.id')
        ->selectRaw('roles.name as role, count(*) as nombre')
        ->groupBy('roles.name')
        ->pluck('nombre', 'role')
        ->toArray();
}
}
