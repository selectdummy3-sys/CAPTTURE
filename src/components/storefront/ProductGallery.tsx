import { useMemo } from "react";

import type { ProductWithDetails } from "@/types";
import { productImageUrl } from "@/components/storefront/ProductCard";
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
      <div className="relative overflow-hidden bg-neutral-100">
        <div className="aspect-square w">
          {images[activeImage] ? (
            <img src={images[activeImage]} alt={product.name} className="h w object-cover" />
          ) : (
            <div className="grid h w place-items-center text-sm text-neutral-400">
              No image yet
            </div>
          )}
        </div>
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
                "shrink-0 overflow-hidden border-2",
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
