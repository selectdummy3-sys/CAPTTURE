import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Minus, PackageX, Plus, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";

import { supplyImageUrl, useSupplyProduct } from "@/hooks/useSupply";
import { useSupplyCartStore } from "@/store/useSupplyCartStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { discountPercent, formatZAR } from "@/lib/utils";

export function SupplyProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const add = useSupplyCartStore((s) => s.add);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useSupplyProduct(slug);

  if (isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="border border-dashed border-neutral-300 p-12 text-center">
        <PackageX className="mx-auto h-10 w-10 text-neutral-300" />
        <p className="mt-3 font-medium text-neutral-700">This supply item is not available.</p>
        <Link to="/supplies/shop" className="mt-3 inline-block text-sm text-brand-700 hover:underline">
          Back to the store
        </Link>
      </div>
    );
  }

  const p = product;
  const percent = discountPercent(p.price, p.sale_price);
  const image = supplyImageUrl(p.featured_image);
  const isPhysical = p.type === "physical";
  const soldOut = isPhysical && p.stock === 0;
  const maxQty = isPhysical ? (p.stock ?? 1) : Number.MAX_SAFE_INTEGER;
  const specs = Object.entries((p.specifications ?? {}) as Record<string, unknown>);

  const addToCart = (thenGoToCart: boolean) => {
    if (soldOut) {
      toast.error("This item is currently sold out");
      return;
    }
    add({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      price: p.sale_price ?? p.price,
      originalPrice: p.price,
      image: p.featured_image,
      stock: p.stock,
      type: p.type as "physical" | "digital" | "service",
      quantity,
    });
    toast.success(`${p.name} added to your cart`);
    if (thenGoToCart) navigate("/supplies/cart");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="overflow-hidden bg-neutral-100">
        <div className="aspect-[4/5] w-full">
          {image ? (
            <img src={image} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm text-neutral-400">No image</div>
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/supplies/shop?category=${p.category?.slug ?? ""}`}
            className="text-xs font-medium text-brand-700 hover:underline"
          >
            {p.category?.name ?? "Supplies"}
          </Link>
          {p.type === "digital" && <Badge tone="purple">Digital</Badge>}
          {p.type === "service" && <Badge tone="blue">Service</Badge>}
        </div>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{p.name}</h1>

        <div className="mt-4 flex items-center gap-3">
          <p className="text-3xl font-bold text-neutral-900">{formatZAR(p.sale_price ?? p.price)}</p>
          {percent != null && (
            <>
              <p className="text-base text-neutral-400 line-through">{formatZAR(p.price)}</p>
              <Badge tone="green">-{percent}%</Badge>
            </>
          )}
        </div>

        <div className="mt-4 space-y-2 text-sm text-neutral-600">
          {isPhysical ? (
            <>
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-neutral-400" />
                Estimated delivery: {p.delivery_days ? `${p.delivery_days} business days` : "varies"}
              </p>
              <p className={soldOut ? "font-semibold text-red-600" : "text-neutral-500"}>
                {soldOut ? "Sold out" : p.stock != null && p.stock <= 10 ? `Only ${p.stock} left in stock` : "In stock"}
              </p>
            </>
          ) : (
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Instant digital delivery after purchase
            </p>
          )}
        </div>

        {p.description && <p className="mt-5 leading-relaxed text-neutral-600">{p.description}</p>}

        {specs.length > 0 && (
          <div className="mt-6 border border-neutral-200">
            <p className="border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Specifications
            </p>
            <dl className="divide-y divide-neutral-100 text-sm">
              {specs.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className="text-neutral-500">{key}</dt>
                  <dd className="text-right font-medium text-neutral-900">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!soldOut && (
            <div className="flex items-center border border-neutral-300">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 text-neutral-500 hover:text-neutral-900"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                className="p-2.5 text-neutral-500 hover:text-neutral-900"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
          <Button size="lg" variant="outline" disabled={soldOut} onClick={() => addToCart(false)}>
            <ShoppingCart className="h-4 w-4" /> Add to cart
          </Button>
          <Button size="lg" variant="accent" disabled={soldOut} onClick={() => addToCart(true)}>
            Buy now
          </Button>
        </div>
      </div>
    </div>
  );
}
