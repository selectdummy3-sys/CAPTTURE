import { Link } from "react-router-dom";

import { supplyImageUrl } from "@/hooks/useSupply";
import type { SupplyProductWithCategory } from "@/types";
import { discountPercent, formatZAR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SupplyProductCardProps {
  product: SupplyProductWithCategory;
  className?: string;
}

export function SupplyProductCard({ product, className }: SupplyProductCardProps) {
  const percent = discountPercent(product.price, product.sale_price);
  const image = supplyImageUrl(product.featured_image);
  const isPhysical = product.type === "physical";
  const soldOut = isPhysical && product.stock === 0;

  return (
    <Link to={`/supplies/product/${product.slug}`} className={`group block ${className ?? ""}`}>
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
            <div className="grid h-full w-full place-items-center text-sm text-neutral-400">No image</div>
          )}
        </div>
        {percent != null && (
          <span className="absolute left-3 top-3 bg-brand-500 px-2.5 py-1 text-xs font-bold text-neutral-950 shadow">
            -{percent}%
          </span>
        )}
        {product.type === "digital" && (
          <span className="absolute left-3 top-3 bg-neutral-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            Digital
          </span>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 bg-neutral-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="line-clamp-1 text-sm font-medium text-neutral-900">{product.name}</p>
        <p className="text-xs text-neutral-500">{product.category?.name ?? "Supplies"}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-neutral-900">
            {formatZAR(product.sale_price ?? product.price)}
          </p>
          {product.sale_price != null && product.sale_price < product.price && (
            <p className="text-xs text-neutral-400 line-through">{formatZAR(product.price)}</p>
          )}
        </div>
        {isPhysical && product.stock != null && product.stock <= 5 && (
          <Badge tone="amber">Only {product.stock} left</Badge>
        )}
      </div>
    </Link>
  );
}
