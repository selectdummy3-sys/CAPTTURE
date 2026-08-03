import { useMemo } from "react";
import { Zap } from "lucide-react";

import type { ProductWithDetails } from "@/types";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { Countdown } from "@/components/ui/countdown";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  product: ProductWithDetails;
  activeImage: number;
  onSelect: (index: number) => void;
}

export function useGalleryImages(product: ProductWithDetails | null | undefined): string[] {
  return useMemo(() => {
    if (!product) return [];
    const sorted = [...(product.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const paths = sorted.map((i) => i.url);
    if (product.featured_image) paths.unshift(product.featured_image);
    const urls = paths.map((p) => productImageUrl(p)).filter(Boolean) as string[];
    return urls;
  }, [product]);
}

export function ProductGallery({ product, activeImage, onSelect }: ProductGalleryProps) {
  const images = useGalleryImages(product);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
        <div className="aspect-square w-full">
          {images[activeImage] ? (
            <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm text-neutral-400">
              No image yet
            </div>
          )}
        </div>
        {product.is_flash_sale && product.flash_sale_ends_at && (
          <div className="absolute left-4 top-4 rounded-xl bg-neutral-900/90 px-4 py-2 text-white backdrop-blur">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 fill-brand-400 text-brand-400" />
              <span className="text-xs font-semibold uppercase tracking-wide">Flash sale</span>
            </div>
            <Countdown endsAt={product.flash_sale_ends_at} compact className="mt-1" />
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "shrink-0 overflow-hidden rounded-lg border-2",
                i === activeImage ? "border-brand-500" : "border-transparent hover:border-neutral-300"
              )}
            >
              <img src={img} alt="" className="h-20 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
