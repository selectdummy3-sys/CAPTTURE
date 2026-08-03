import type { ProductWithDetails } from "@/types";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PackageX } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products?: ProductWithDetails[];
  loading?: boolean;
  skeletons?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function ProductGrid({
  products,
  loading,
  skeletons = 8,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your filters or search for something else.",
  className,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className={cn("grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4", className)}>
        {Array.from({ length: skeletons }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[4/5] w" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
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
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
