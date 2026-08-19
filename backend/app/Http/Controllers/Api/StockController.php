<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\User;
use App\Notifications\LowStockAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class StockController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->when($request->filled('category'), fn ($q) => $q->where('category_id', $request->query('category')))
            ->orderBy('stock_qty')
            ->paginate(15);

        return response()->json($products);
    }

    public function notifyLowStock(Product $product): JsonResponse
    {
        $admins = User::whereHas('role', fn ($q) => $q->where('name', 'admin'))->get();

        Notification::send($admins, new LowStockAlert($product));

        return response()->json(['message' => 'Admins notifiés.']);
    }
}
