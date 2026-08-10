<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Models\Order;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CommercialOrderController extends Controller
{
    /**
     * Transitions de statut autorisées. Une transition vers le même
     * statut (idempotence) est toujours acceptée sans effet de bord.
     */
    private const ALLOWED_TRANSITIONS = [
        'en_attente' => ['validee', 'annulee'],
        'validee'    => ['expediee', 'annulee'],
        'expediee'   => ['livree'],
        'livree'     => [],
        'annulee'    => [],
    ];

    public function index(Request $request): JsonResponse
    {
        $query = Order::with('items.product', 'client');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $orders = $query->latest()->paginate(10);

        return response()->json($orders);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $order->load('items.product', 'client', 'commercial');

        return response()->json($order);
    }

    public function update(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $newStatus = $request->validated()['status'];
        $currentStatus = $order->status;

        if ($newStatus !== $currentStatus
            && ! in_array($newStatus, self::ALLOWED_TRANSITIONS[$currentStatus] ?? [], true)
        ) {
            throw ValidationException::withMessages([
                'status' => "Transition de « {$currentStatus} » vers « {$newStatus} » non autorisée.",
            ]);
        }

        DB::transaction(function () use ($order, $newStatus, $currentStatus, $request) {
            // Passage à "validee" : décrémente le stock (une seule fois)
            if ($newStatus === 'validee' && $currentStatus !== 'validee') {
                foreach ($order->items as $item) {
                    $product = $item->product()->lockForUpdate()->first();

                    if ($item->qty > $product->stock_qty) {
                        throw ValidationException::withMessages([
                            'items' => "Stock insuffisant pour le produit « {$product->name} ».",
                        ]);
                    }

                    $product->decrement('stock_qty', $item->qty);

                    StockMovement::create([
                        'product_id' => $product->id,
                        'type'       => 'sortie',
                        'qty'        => $item->qty,
                        'reason'     => "Validation commande {$order->public_id}",
                        'user_id'    => $request->user()->id,
                    ]);
                }

                $order->commercial_id = $request->user()->id;
            }

            // Annulation d'une commande déjà validée : restaure le stock
            if ($newStatus === 'annulee' && $currentStatus === 'validee') {
                foreach ($order->items as $item) {
                    $product = $item->product()->lockForUpdate()->first();

                    $product->increment('stock_qty', $item->qty);

                    StockMovement::create([
                        'product_id' => $product->id,
                        'type'       => 'entree',
                        'qty'        => $item->qty,
                        'reason'     => "Annulation commande {$order->public_id}",
                        'user_id'    => $request->user()->id,
                    ]);
                }
            }

            $order->status = $newStatus;
            $order->save();
        });

        $order->load('items.product', 'client', 'commercial');

        return response()->json($order);
    }
}
