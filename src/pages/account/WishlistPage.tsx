import { Link } from "react-router-dom";
import { Heart, X } from "lucide-react";

import { useWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { formatZAR } from "@/lib/utils";

export function WishlistPage() {
  const { data: items, isLoading } = useWishlist();
  const remove = useRemoveFromWishlist();

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-7 w-32" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[4/5] w-full" />
              <div className="mt-2 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if ((items ?? []).length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-8 w-8" />}
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it here."
        action={
          <Link to="/shop" className={buttonClass("primary", "md")}>
            Browse products
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Wishlist</h1>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(items ?? []).map(({ id, product }) =>
          product ? (
            <div key={id} className="group relative">
              <Link to={`/p/${product.slug}`} className="block">
                <div className="aspect-[4/5] overflow-hidden bg-neutral-100">
                  {product.featured_image ? (
                    <img
                      src={productImageUrl(product.featured_image) ?? ""}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm text-neutral-400">No image</div>
                  )}
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="line-clamp-1 text-sm font-medium text-neutral-900">{product.name}</p>
                  <p className="text-sm font-semibold text-neutral-900">
                    {formatZAR(product.sale_price ?? product.price)}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => void remove.mutateAsync(product.id)}
                aria-label="Remove from wishlist"
                className="absolute right-2 top-2 bg-neutral-900/70 p-1.5 text-white transition-colors hover:bg-neutral-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
