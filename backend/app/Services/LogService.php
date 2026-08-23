<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Intervention;
use App\Models\InterventionHistory;
use App\Models\LoginAudit;
use App\Models\Order;
use App\Models\OrderHistory;
use App\Models\User;
use Illuminate\Http\Request;

class LogService
{
    /**
     * Log a generic action into activity_logs.
     * Covers everything EXCEPT order status changes, intervention events,
     * and login/logout/register/access_denied (which have their own methods).
     */
    public function activity(?User $user, string $action, string $entity, int|string|null $entityId, array $meta = [], ?Request $request = null): ActivityLog
    {
        return ActivityLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'entity' => $entity,
            'entity_id' => $entityId,
            'meta' => $meta,
            'ip' => $request?->ip(),
        ]);
    }

    /**
     * Log an order status change into order_history.
     */
    public function orderStatusChange(Order $order, string $statusFrom, string $statusTo, User $changedBy): OrderHistory
    {
        return OrderHistory::create([
            'order_id' => $order->id,
            'status_from' => $statusFrom,
            'status_to' => $statusTo,
            'changed_by' => $changedBy->id,
        ]);
    }

    /**
     * Log an intervention event into intervention_history.
     * event: created | assigned | reassigned | status_changed | report_uploaded
     */
    public function interventionEvent(Intervention $intervention, string $event, User $actor, array $meta = []): InterventionHistory
    {
        return InterventionHistory::create([
            'intervention_id' => $intervention->id,
            'event' => $event,
            'actor' => $actor->id,
            'meta' => $meta,
        ]);
    }

    /**
     * Log an authentication-related event into login_audit.
     * action: login | logout | register | access_denied
     */
    public function loginAudit(
        ?User $user,
        string $action,
        bool $success,
        ?Request $request = null,
        ?string $reason = null
    ): LoginAudit {
        return LoginAudit::create([
            'user_id' => $user?->id,
            'action' => $action,
            'ip' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'success' => $success,
            'reason' => $reason,
        ]);
    }
}
