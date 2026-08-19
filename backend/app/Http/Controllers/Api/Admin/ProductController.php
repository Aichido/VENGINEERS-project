<?php

// app/Http/Controllers/Api/Admin/ProductController.php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Http\Requests\Admin\StoreProductImageRequest;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function __construct(private ProductImageService $imageService) {}

    public function index(Request $request)
    {
        $query = Product::query()->with(['category', 'images']);

        if ($request->filled('category')) {
            $query->where('category_id', $request->input('category'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        return response()->json($query->paginate(15));
    }

    public function store(StoreProductRequest $request)
    {
        $product = Product::create($request->validated());

        return response()->json($product->load(['category', 'images']), 201);
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        $product->update($request->validated());

        return response()->json($product->load(['category', 'images']));
    }

    public function destroy(Product $product)
    {
        // supprime les fichiers physiques avant la cascade DB
        foreach ($product->images as $image) {
            Storage::disk('public')->delete(array_filter([$image->path, $image->thumbnail_path]));
        }

        $product->delete(); // cascade sur product_images en base

        return response()->json(null, 204);
    }

    // ---- Images ----

    public function storeImage(StoreProductImageRequest $request, Product $product)
    {
        try {
            $image = $this->imageService->store($product, $request->file('image'));
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($image, 201);
    }

    public function destroyImage(Product $product, ProductImage $image)
    {
        if ($image->product_id !== $product->id) {
            return response()->json(['message' => 'Cette image n\'appartient pas à ce produit.'], 404);
        }

        $this->imageService->delete($image);

        return response()->json(null, 204);
    }

    public function setPrimaryImage(Product $product, ProductImage $image)
    {
        if ($image->product_id !== $product->id) {
            return response()->json(['message' => 'Cette image n\'appartient pas à ce produit.'], 404);
        }

        $this->imageService->setPrimary($product, $image);

        return response()->json($product->images()->orderBy('position')->get());
    }

    public function reorderImages(Request $request, Product $product)
    {
        $validated = $request->validate([
            'image_ids' => ['required', 'array'],
            'image_ids.*' => ['integer', 'exists:product_images,id'],
        ]);

        $this->imageService->reorder($product, $validated['image_ids']);

        return response()->json($product->images()->orderBy('position')->get());
    }
}
