import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, PackageX } from "lucide-react";

import type { ProductWithDetails } from "@/types";
import { ProductCard } from "@/components/storefront/ProductCard";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface ProductCarouselProps {
  products?: ProductWithDetails[];
  loading?: boolean;
  skeletons?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  dark?: boolean;
}

export function ProductCarousel({
  products,
  loading,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your filters or search for something else.",
  className,
  dark,
}: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 0);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      updateArrows();
      el.querySelectorAll("img").forEach((img) => {
        if (!img.complete) img.addEventListener("load", updateArrows, { once: true });
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [products]);

  const scrollCards = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center gap-3 py-20 text-neutral-400", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        <span className="text-sm">Loading products…</span>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={<PackageX className="h-10 w-10" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={trackRef}
        onScroll={updateArrows}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-1 px-1 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div
            key={product.id}
            data-carousel-card
            className="grow-0 shrink-0 w-[calc(100%/2.09)] snap-start md:w-[calc(100%/3.33)] lg:w-[calc(100%/4)] xl:w-[calc(100%/4.5)]"
          >
            <ProductCard product={product} dark={dark} />
          </div>
        ))}
      </div>

      {products.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous products"
            onClick={() => scrollCards(-1)}
            disabled={!canPrev}
            className={cn(
              "absolute -left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-ink p-2.5 text-white shadow-lg transition-opacity sm:flex",
              !canPrev && "opacity-40"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next products"
            onClick={() => scrollCards(1)}
            disabled={!canNext}
            className={cn(
              "absolute -right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-ink p-2.5 text-white shadow-lg transition-opacity sm:flex",
              !canNext && "opacity-40"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}