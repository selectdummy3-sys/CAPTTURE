import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShieldCheck, ShoppingBag, Truck, Zap } from "lucide-react";
import { toast } from "sonner";

import type { ProductWithDetails } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useIsWishlisted, useToggleWishlist } from "@/hooks/useWishlist";
import { useCartStore } from "@/store/useCartStore";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { cn, formatZAR } from "@/lib/utils";

interface ProductInfoProps {
  product: ProductWithDetails;
  size: string | null;
  onSize: (v: string) => void;
  colour: string | null;
  onColour: (v: string) => void;
  qty: number;
  onQty: (v: number) => void;
}

export function ProductInfo({ product, size, onSize, colour, onColour, qty, onQty }: ProductInfoProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const addToCart = useCartStore((s) => s.add);
  const { data: wishlisted = false } = useIsWishlisted(product.id);
  const toggleWishlist = useToggleWishlist(product.id);

  const outOfStock = product.stock === 0;

  const validateSelection = (): boolean => {
    if (product.sizes.length > 0 && !size) {
      toast.error("Please select a size");
      return false;
    }
    if (product.colours.length > 0 && !colour) {
      toast.error("Please select a colour");
      return false;
    }
    return true;
  };

  const addToCartHandler = () => {
    if (!validateSelection()) return;
    addToCart({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.sale_price ?? product.price,
      originalPrice: product.price,
      image: product.featured_image,
      sellerId: product.seller_id,
      sellerName: product.seller?.business_name ?? "Independent seller",
      sellerUsername: product.seller?.store_username ?? "",
      stock: product.stock,
      size,
      colour,
      quantity: qty,
    });
    toast.success("Added to bag");
  };

  const buyNow = () => {
    if (!validateSelection()) return;
    addToCartHandler();
    navigate("/checkout");
  };

  const wishlistClick = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/p/${product.slug}`)}`);
      return;
    }
    toggleWishlist.mutate(wishlisted);
  };

  return (
    <div className="space-y-6">
      {product.seller && (
        <Link
          to={`/store/${product.seller.store_username}`}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <span className="text-brand-600 font-medium">{product.seller.business_name}</span>
          <span className="text-neutral-400">·</span>
          <span>@{product.seller.store_username}</span>
        </Link>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{product.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {product.is_flash_sale && (
            <span className="inline-flex items-center gap-1 bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
              <Zap className="h-3 w-3 fill-current" /> Flash sale
            </span>
          )}
        </div>
      </div>

      <Price price={product.price} salePrice={product.sale_price} size="lg" />

      <div className="border-t border-neutral-100 pt-5">
        <div className="flex items-center gap-2 text-sm">
          {outOfStock ? (
            <span className="font-semibold text-red-600">Sold out</span>
          ) : product.stock <= 5 ? (
            <span className="font-semibold text-amber-600">Only {product.stock} left in stock</span>
          ) : (
            <span className="font-medium text-green-600">In stock</span>
          )}
        </div>

        {product.sizes.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">Size</span>
              <span className="text-xs text-neutral-400">Size guide</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSize(s)}
                  className={cn(
                    "h-10 min-w-12 border px-3 text-sm font-medium transition-colors",
                    size === s
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.colours.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">Colour</span>
              {colour && <span className="text-xs text-neutral-400">{colour}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.colours.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onColour(c)}
                  className={cn(
                    "h-10 border px-3 text-sm font-medium transition-colors",
                    colour === c
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-4">
          <div className="flex items-center border border-neutral-300">
            <button
              type="button"
              onClick={() => onQty(Math.max(1, qty - 1))}
              disabled={outOfStock}
              className="p-3 text-neutral-500 hover:text-neutral-900 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={() => onQty(Math.min(product.stock, qty + 1))}
              disabled={outOfStock || qty >= product.stock}
              className="p-3 text-neutral-500 hover:text-neutral-900 disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={wishlistClick}
            aria-pressed={wishlisted}
            className={cn(
              "border px-4 py-3 text-sm font-medium transition-colors",
              wishlisted
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-neutral-300 text-neutral-600 hover:border-neutral-900"
            )}
          >
            {wishlisted ? "Saved" : "Save"}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <Button className="w-full" size="lg" disabled={outOfStock} onClick={addToCartHandler}>
            <ShoppingBag className="h-5 w-5" />
            {outOfStock ? "Sold out" : "Add to bag"}
          </Button>
          <Button
            variant="accent"
            size="lg"
            className="w-full"
            disabled={outOfStock}
            onClick={buyNow}
          >
            {formatZAR(product.sale_price ?? product.price)} · Buy now
          </Button>
        </div>
      </div>

      <div className="space-y-3 border border-neutral-200 bg-neutral-50 p-4 text-sm">
        <div className="flex items-start gap-3">
          <Truck className="mt-0.5 h-4 w-4 text-neutral-400" />
          <p className="text-neutral-600">
            R60 flat shipping per order. <span className="font-medium text-neutral-800">Free over R1,000</span>.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-neutral-400" />
          <p className="text-neutral-600">Pay with cash on delivery or EFT. Your order is backed by our buyer protection.</p>
        </div>
      </div>
    </div>
  );
}
