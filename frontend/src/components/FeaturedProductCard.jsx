// src/components/FeaturedProductCard.jsx
import { Link } from "react-router-dom";

// Local, self-contained helpers (kept independent from the Products page ProductCard/productImage/formatPrice utils)

function getFeaturedImage(product) {
  const images = product.images || [];
  if (images.length === 0) {
    return `https://picsum.photos/seed/product-${product.id}/600/400`;
  }
  const primary = images.find((img) => img.is_primary);
  return primary ? primary.path : images[0].path;
}

function isRecentlyAdded(createdAt) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  return now - created < thirtyDaysMs;
}

export default function FeaturedProductCard({ product }) {
  const image = getFeaturedImage(product);
  const isNew = isRecentlyAdded(product.created_at);

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-xl border border-[#E1E3E4] p-3 flex flex-col hover:shadow-xl transition-all duration-300"
    >
      <div className="h-64 overflow-hidden rounded-lg mb-3 bg-[#F7F7F7] relative">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {isNew && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-[#ECB115] text-black text-[10px] font-bold rounded uppercase tracking-wide">
            New
          </span>
        )}
      </div>

      {product.category?.name && (
        <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-wide text-[#707070]">
          {product.category.name}
        </span>
      )}

      <h3 className="font-bold text-lg text-black mb-1">{product.name}</h3>

      {product.description && (
        <p className="text-sm text-[#404040] mb-3 flex-grow line-clamp-2">
          {product.description}
        </p>
      )}

      <span className="w-full text-center py-2 border border-[#F80000] text-[#F80000] font-semibold text-sm rounded-lg group-hover:bg-[#F80000] group-hover:text-white transition-colors">
        View details
      </span>
    </Link>
  );
}