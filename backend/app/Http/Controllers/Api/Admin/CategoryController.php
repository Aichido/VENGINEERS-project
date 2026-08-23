<?php
// app/Http/Controllers/Api/Admin/CategoryController.php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use App\Services\LogService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function __construct(private LogService $logService)
    {
    }

    public function store(StoreCategoryRequest $request)
    {
        $validated = $request->validated();
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        $category = Category::create($validated);

        $this->logService->activity(
            $request->user(),
            'category_created',
            'category',
            $category->id,
            ['name' => $category->name, 'slug' => $category->slug],
            $request
        );

        return response()->json($category, 201);
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $category->update($request->validated());

        $this->logService->activity(
            $request->user(),
            'category_updated',
            'category',
            $category->id,
            ['fields' => array_keys($request->validated())],
            $request
        );

        return response()->json($category);
    }

    public function destroy(Request $request, Category $category)
    {
        $categoryName = $category->name;

        try {
            $category->delete();
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'Impossible de supprimer cette catégorie : des produits y sont encore rattachés.',
            ], 422);
        }

        $this->logService->activity(
            $request->user(),
            'category_deleted',
            'category',
            $category->id,
            ['name' => $categoryName],
            $request
        );

        return response()->json(null, 204);
    }
}
