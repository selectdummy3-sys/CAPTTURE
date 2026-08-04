import { Link } from "react-router-dom";

import type { ProductWithDetails } from "@/types";
import { supabase } from "@/lib/supabase";
import { discountPercent, formatZAR } from "@/lib/utils";
import { WishlistButton } from "@/components/storefront/WishlistButton";
import { cn } from "@/lib/utils";

export function productImageUrl(path: string | null | undefined, bucket = "product-images"): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

interface ProductCardProps {
  product: ProductWithDetails;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const percent = discountPercent(product.price, product.sale_price);
  const image = productImageUrl(product.featured_image);

  return (
    <div className={cn("group relative", className)}>
      <Link to={`/p/${product.slug}`} className="block">
        <div className="relative overflow-hidden bg-neutral-100">
          <div className="aspect-[4/5] w-full">
            {image ? (
              <img
                src={image}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm text-neutral-400">
                No image
              </div>
            )}
          </div>

          {percent != null && (
            <span className="absolute left-3 top-3 bg-brand-500 px-2.5 py-1 text-xs font-bold text-neutral-950 shadow">
              -{percent}%
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute left-3 top-3 bg-neutral-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              Sold out
            </span>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <p className="line-clamp-1 text-sm font-medium text-neutral-900">{product.name}</p>
          <p className="text-xs text-neutral-500">{product.seller?.business_name ?? "Independent seller"}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-neutral-900">
              {formatZAR(product.sale_price ?? product.price)}
            </p>
            {product.sale_price != null && product.sale_price < product.price && (
              <p className="text-xs text-neutral-400 line-through">{formatZAR(product.price)}</p>
            )}
          </div>
        </div>
      </Link>

      <div className="absolute right-3 top-3">
        <WishlistButton productId={product.id} size="sm" />
      </div>
    </div>
  );
}
