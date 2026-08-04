// Resolves the image to display for a product coming from the API.
// A product can have several product_images rows; prefer the one flagged
// is_primary, falling back to the first available image, then a placeholder.

export function getPrimaryImage(product) {
  const images = product?.images || []
  const primary = images.find((img) => img.is_primary) || images[0]
  return (
    primary?.thumbnail_path ||
    primary?.path ||
    `https://picsum.photos/seed/product-${product?.id ?? 'placeholder'}/600/400`
  )
}

// Full gallery for the product detail page: every image, primary first, then by position.
export function getGalleryImages(product) {
  const images = product?.images || []
  if (images.length === 0) {
    return [`https://picsum.photos/seed/product-${product?.id ?? 'placeholder'}/800/600`]
  }
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return (a.position ?? 0) - (b.position ?? 0)
  })
  return sorted.map((img) => img.path || img.thumbnail_path)
}