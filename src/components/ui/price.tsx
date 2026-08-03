import { cn, discountPercent, formatZAR } from "@/lib/utils";

interface PriceProps {
  price: number;
  salePrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Price({ price, salePrice, size = "md", className }: PriceProps) {
  const hasSale = salePrice != null && salePrice < price;
  const percent = discountPercent(price, salePrice);
  const sizeClass = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-semibold tracking-tight text-neutral-900", sizeClass)}>
        {formatZAR(hasSale ? salePrice : price)}
      </span>
      {hasSale && (
        <>
          <span className="text-sm text-neutral-400 line-through">{formatZAR(price)}</span>
          {percent != null && (
            <span className="text-xs font-semibold text-green-600">-{percent}%</span>
          )}
        </>
      )}
    </span>
  );
}
