import { Link } from "react-router-dom";
import { Heart, X } from "lucide-react";

import { useWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";
import { MobilePageNav } from "@/components/account/MobilePageNav";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { isNative } from "@/lib/capacitor";
import { formatPrice } from "@/lib/utils";

export function WishlistPage() {
  const { data: items, isLoading } = useWishlist();
  const remove = useRemoveFromWishlist();

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-canvas text-neutral-900"
        style={isNative ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
      >
        <div className="sticky top-0 z-20">
          <MobilePageNav title="Wishlist" backTo="/account" />
        </div>
        <div className="mx-auto w-full max-w-md px-4 pb-40 pt-6">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                <div className="mt-2 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if ((items ?? []).length === 0) {
    return (
      <div
        className="min-h-screen bg-canvas text-neutral-900"
        style={isNative ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
      >
        <div className="sticky top-0 z-20">
          <MobilePageNav title="Wishlist" backTo="/account" />
        </div>
        <div className="mx-auto w-full max-w-md px-4 pb-40 pt-6">
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
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-canvas text-neutral-900"
      style={isNative ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
    >
      <div className="sticky top-0 z-20">
        <MobilePageNav title="Wishlist" backTo="/account" />
      </div>
      <div className="mx-auto w-full max-w-md px-4 pb-40 pt-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {(items ?? []).map(({ id, product }) =>
            product ? (
              <div key={id} className="relative">
                <Link to={`/p/${product.slug}`} className="block">
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                    {product.featured_image ? (
                      <img
                        src={productImageUrl(product.featured_image) ?? ""}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-sm text-neutral-400">No image</div>
                    )}
                  </div>
                  <div className="mt-2 space-y-0.5 px-0.5">
                    <p className="line-clamp-1 text-sm font-medium text-neutral-900">{product.name}</p>
                    <p className="text-sm font-bold text-neutral-900">
                      {formatPrice(product.sale_price ?? product.price)}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => void remove.mutateAsync(product.id)}
                  aria-label="Remove from wishlist"
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-neutral-900/60 text-white backdrop-blur-sm transition-colors active:bg-neutral-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}