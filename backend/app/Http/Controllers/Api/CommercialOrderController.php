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
    public function index(Request $request): JsonResponse
    {
        $query = Order::with('items.product', 'client');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $orders = $query->latest()->paginate(10);

        return response()->json($orders);
    }

    public function update(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $newStatus = $request->validated()['status'];

        DB::transaction(function () use ($order, $newStatus, $request) {
            // Décrémentation du stock uniquement lors du premier passage à "validee"
            if ($newStatus === 'validee' && $order->status !== 'validee') {
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

            $order->status = $newStatus;
            $order->save();
        });

        $order->load('items.product', 'client', 'commercial');

        return response()->json($order);
    }
}