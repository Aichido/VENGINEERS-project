<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\User;
use App\Notifications\LowStockAlert;
use App\Services\LogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class StockController extends Controller
{
    public function __construct(private LogService $logService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->when($request->filled('category'), fn ($q) => $q->where('category_id', $request->query('category')))
            ->orderBy('stock_qty')
            ->paginate(15);

        return response()->json($products);
    }

    public function notifyLowStock(Request $request, Product $product): JsonResponse
    {
        $admins = User::whereHas('role', fn ($q) => $q->where('name', 'admin'))->get();

        Notification::send($admins, new LowStockAlert($product));

        $this->logService->activity(
            $request->user(),
            'low_stock_alert_triggered',
            'product',
            $product->id,
            ['name' => $product->name, 'stock_qty' => $product->stock_qty, 'admins_notified' => $admins->count()],
            $request
        );

        return response()->json(['message' => 'Admins notifiés.']);
    }
}
