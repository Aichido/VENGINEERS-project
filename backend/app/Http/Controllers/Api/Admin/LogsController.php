<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\InterventionHistory;
use App\Models\LoginAudit;
use App\Models\OrderHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class LogsController extends Controller
{
    /**
     * Types exposés côté API et leur correspondance avec les collections/modèles Mongo.
     */
    private const TYPES = [
        'activity_log' => ActivityLog::class,
        'order_history' => OrderHistory::class,
        'intervention_history' => InterventionHistory::class,
        'login_audit' => LoginAudit::class,
    ];

    /**
     * GET /admin/logs
     *
     * Filtres supportés : ?type=, ?user_id=, ?action=, ?date_from=, ?date_to=
     * Pagination : ?page=, ?per_page= (défaut 15)
     *
     * Note d'implémentation : MongoDB ne permet pas un OFFSET/LIMIT croisé propre
     * sur 4 collections distinctes. On récupère un lot suffisant par collection
     * (proportionnel à la page demandée), on fusionne, on trie en mémoire, puis
     * on découpe la page voulue. Le total renvoyé dans la pagination est un
     * comptage exact (requêtes ->count() séparées, peu coûteuses).
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $page = (int) $request->query('page', 1);

        $requestedTypes = $request->filled('type')
            ? array_intersect(explode(',', $request->query('type')), array_keys(self::TYPES))
            : array_keys(self::TYPES);

        if (empty($requestedTypes)) {
            return response()->json(['message' => 'Type de log inconnu.'], 422);
        }

        // Lot par collection : suffisant pour couvrir la page demandée sans
        // devoir tout charger. Capé pour éviter un abus via ?page= énorme.
        $fetchLimit = min($page * $perPage, 500);

        $entries = collect();
        $total = 0;

        foreach ($requestedTypes as $type) {
            $query = $this->buildFilteredQuery($type, $request);

            // Comptage exact pour la pagination (avant limit)
            $total += (clone $query)->count();

            $documents = $query->orderBy('timestamp', 'desc')
                ->limit($fetchLimit)
                ->get();

            foreach ($documents as $document) {
                $entries->push($this->normalize($type, $document));
            }
        }

        $sorted = $entries->sortByDesc('timestamp')->values();

        $page = max($page, 1);
        $paged = $sorted->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'data' => $paged,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => (int) ceil(max($total, 1) / $perPage),
            ],
        ]);
    }

    private function buildFilteredQuery(string $type, Request $request)
    {
        /** @var \MongoDB\Laravel\Eloquent\Model $modelClass */
        $modelClass = self::TYPES[$type];
        $query = $modelClass::query();

        if ($request->filled('date_from')) {
            $query->where('timestamp', '>=', Carbon::parse($request->query('date_from'))->startOfDay());
        }

        if ($request->filled('date_to')) {
            $query->where('timestamp', '<=', Carbon::parse($request->query('date_to'))->endOfDay());
        }

        if ($request->filled('user_id')) {
            $userId = (int) $request->query('user_id');

            match ($type) {
                'activity_log', 'login_audit' => $query->where('user_id', $userId),
                'order_history' => $query->where('changed_by', $userId),
                'intervention_history' => $query->where('actor', $userId),
            };
        }

        if ($request->filled('action')) {
            $action = $request->query('action');

            match ($type) {
                'activity_log', 'login_audit' => $query->where('action', $action),
                'order_history' => $query->where('status_to', $action),
                'intervention_history' => $query->where('event', $action),
            };
        }

        return $query;
    }

    private function normalize(string $type, $document): array
    {
        $raw = $document->toArray();

        return match ($type) {
            'activity_log' => [
                'type' => 'activity_log',
                'timestamp' => $document->timestamp,
                'user_id' => $document->user_id,
                'action_or_event' => $document->action,
                'summary' => sprintf('%s — %s #%s', $document->action, $document->entity, $document->entity_id),
                'raw' => $raw,
            ],
            'order_history' => [
                'type' => 'order_history',
                'timestamp' => $document->timestamp,
                'user_id' => $document->changed_by,
                'action_or_event' => $document->status_to,
                'summary' => sprintf(
                    'Commande #%s : %s → %s',
                    $document->order_id,
                    $document->status_from,
                    $document->status_to
                ),
                'raw' => $raw,
            ],
            'intervention_history' => [
                'type' => 'intervention_history',
                'timestamp' => $document->timestamp,
                'user_id' => $document->actor,
                'action_or_event' => $document->event,
                'summary' => sprintf('Intervention #%s : %s', $document->intervention_id, $document->event),
                'raw' => $raw,
            ],
            'login_audit' => [
                'type' => 'login_audit',
                'timestamp' => $document->timestamp,
                'user_id' => $document->user_id,
                'action_or_event' => $document->action,
                'summary' => sprintf(
                    '%s%s%s',
                    $document->action,
                    $document->success ? ' (succès)' : ' (échec)',
                    $document->reason ? " — {$document->reason}" : ''
                ),
                'raw' => $raw,
            ],
        };
    }
}
