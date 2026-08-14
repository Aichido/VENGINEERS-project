<?php
namespace App\Services;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;
use Intervention\Image\Format;

class ProductImageService
{
    private const MAX_IMAGES = 5;
    private const MAIN_MAX_WIDTH = 1200;
    private const THUMB_SIZE = 300;
    private const WEBP_QUALITY = 80;

    public function store(Product $product, UploadedFile $file): ProductImage
    {
        if ($product->images()->count() >= self::MAX_IMAGES) {
            throw new \DomainException('Nombre maximum de ' . self::MAX_IMAGES . ' images atteint pour ce produit.');
        }

        $dir = "products/{$product->id}";
        $filename = Str::uuid() . '.webp';

        // Image principale : redimensionnée + compressée en WebP
        $main = Image::decode($file)
            ->scaleDown(width: self::MAIN_MAX_WIDTH)
            ->encodeUsingFormat(Format::WEBP, quality: self::WEBP_QUALITY);

        $mainPath = "{$dir}/{$filename}";
        Storage::disk('public')->put($mainPath, (string) $main);

        // Thumbnail : carré recadré
        $thumb = Image::decode($file)
            ->cover(self::THUMB_SIZE, self::THUMB_SIZE)
            ->encodeUsingFormat(Format::WEBP, quality: self::WEBP_QUALITY);

        $thumbPath = "{$dir}/thumb_{$filename}";
        Storage::disk('public')->put($thumbPath, (string) $thumb);

        $isFirstImage = $product->images()->count() === 0;
        $nextPosition = ($product->images()->max('position') ?? -1) + 1;

        return $product->images()->create([
            'path' => $mainPath,
            'thumbnail_path' => $thumbPath,
            'position' => $nextPosition,
            'is_primary' => $isFirstImage,
        ]);
    }


    public function delete(ProductImage $image): void
    {
        Storage::disk('public')->delete(array_filter([$image->path, $image->thumbnail_path]));

        $product = $image->product;
        $wasPrimary = $image->is_primary;

        $image->delete();

        // si l'image supprimée était la primary, promouvoir la suivante (position la plus basse)
        if ($wasPrimary) {
            $next = $product->images()->orderBy('position')->first();
            $next?->update(['is_primary' => true]);
        }
    }

    public function setPrimary(Product $product, ProductImage $image): void
    {
        $product->images()->where('id', '!=', $image->id)->update(['is_primary' => false]);
        $image->update(['is_primary' => true]);
    }

    public function reorder(Product $product, array $orderedImageIds): void
    {
        foreach ($orderedImageIds as $position => $imageId) {
            $product->images()->where('id', $imageId)->update(['position' => $position]);
        }
    }
}