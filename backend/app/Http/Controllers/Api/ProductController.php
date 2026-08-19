<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\ProductImage;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->where('is_active', true)
            ->with(['category', 'images']);

        if ($request->filled('category')) {
            $query->where('category_id', $request->input('category'));
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->input('min_price'));
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->input('max_price'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 9);
        $perPage = max(1, min($perPage, 50)); // guard against 0, negative, or abusive values

        $products = $query->paginate($perPage);

        return response()->json($products);
    }

    public function show(int $id): JsonResponse
    {
        $product = Product::where('is_active', true)
            ->with(['category', 'images'])
            ->find($id);

        if (! $product) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        return response()->json($product);
    }
}
