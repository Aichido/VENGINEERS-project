<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::with('items.product')
            ->where('client_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return response()->json($orders);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        if ($order->client_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $order->load('items.product');

        return response()->json($order);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $order = DB::transaction(function () use ($validated, $request) {
            $total = 0;
            $itemsToCreate = [];

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                if ($item['qty'] > $product->stock_qty) {
                    throw ValidationException::withMessages([
                        'items' => "Stock insuffisant pour le produit « {$product->name} »."
                    ]);
                }

                $lineTotal = $product->price * $item['qty'];
                $total += $lineTotal;

                $itemsToCreate[] = [
                    'product_id' => $product->id,
                    'qty'        => $item['qty'],
                    'unit_price' => $product->price,
                ];
            }

            $order = Order::create([
                'client_id' => $request->user()->id,
                'status'    => 'en_attente',
                'total'     => $total,
            ]);

            $order->items()->createMany($itemsToCreate);

            return $order;
        });

        $order->load('items.product');

        return response()->json($order, 201);
    }
}
