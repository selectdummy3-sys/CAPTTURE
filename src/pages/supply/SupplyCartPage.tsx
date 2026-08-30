import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2, Truck } from "lucide-react";

import { supplyImageUrl, useSupplyCouriers } from "@/hooks/useSupply";
import {
  supplyHasPhysical,
  useSupplyCartStore,
  useSupplyCartSubtotal,
} from "@/store/useSupplyCartStore";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatZAR } from "@/lib/utils";

function Line({ productId }: { productId: string }) {
  const item = useSupplyCartStore((s) => s.items.find((i) => i.productId === productId));
  const updateQuantity = useSupplyCartStore((s) => s.updateQuantity);
  const remove = useSupplyCartStore((s) => s.remove);

  if (!item) return null;
  const image = supplyImageUrl(item.image);
  const isPhysical = item.type === "physical";
  const maxQty = isPhysical ? (item.stock ?? 1) : Number.MAX_SAFE_INTEGER;

  return (
    <div className="flex gap-4 border-b border-neutral-100 py-5 last:border-0">
      <Link to={`/supplies/product/${item.slug}`} className="shrink-0 overflow-hidden bg-neutral-100">
        {image ? (
          <img src={image} alt={item.name} className="h-24 w-20 object-cover" />
        ) : (
          <div className="grid h-24 w-20 place-items-center text-xs text-neutral-400">No img</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              to={`/supplies/product/${item.slug}`}
              className="font-medium text-neutral-900 hover:text-brand-700"
            >
              {item.name}
            </Link>
            <p className="mt-0.5 text-xs text-neutral-400">
              {item.type === "digital" ? "Digital download" : "Physical product"}
            </p>
            {isPhysical && item.stock != null && item.stock <= 5 && (
              <p className="mt-0.5 text-xs text-amber-600">Only {item.stock} left</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => remove(item.productId)}
            aria-label={`Remove ${item.name}`}
            className="p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center border border-neutral-300">
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              className="p-2 text-neutral-500 hover:text-neutral-900"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= maxQty}
              className="p-2 text-neutral-500 hover:text-neutral-900 disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-right">
            <p className="font-semibold text-neutral-900">{formatZAR(item.price * item.quantity)}</p>
            {item.originalPrice != null && item.originalPrice > item.price && (
              <p className="text-xs text-neutral-400 line-through">
                {formatZAR(item.originalPrice * item.quantity)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SupplyCartPage() {
  const items = useSupplyCartStore((s) => s.items);
  const subtotal = useSupplyCartSubtotal();
  const { data: couriers } = useSupplyCouriers();

  const hasPhysical = supplyHasPhysical(items);
  const lowestFee = couriers && couriers.length > 0 ? Math.min(...couriers.map((c) => c.fee)) : null;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-10 w-10" />}
        title="Your supply cart is empty"
        description="Add branding, packaging and equipment to stock up your brand."
        action={
          <Link to="/supplies/shop" className={buttonClass("primary", "md")}>
            Browse supplies
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Your cart</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {items.length} item{items.length === 1 ? "" : "s"} · delivered by courier
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="border border-neutral-200 px-5">
          {items.map((item) => (
            <Line key={item.productId} productId={item.productId} />
          ))}
        </div>

        <aside className="h-fit border border-neutral-200 p-5 lg:sticky lg:top-8">
          <h2 className="font-semibold text-neutral-900">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Subtotal</dt>
              <dd className="font-medium text-neutral-900">{formatZAR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Delivery estimate</dt>
              <dd className="font-medium text-neutral-900">
                {hasPhysical ? (lowestFee != null ? `From ${formatZAR(lowestFee)}` : "Calculated at checkout") : "Free (digital)"}
              </dd>
            </div>
            {hasPhysical && (
              <p className="bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                <Truck className="mr-1 inline h-3.5 w-3.5" />
                Choose your courier at checkout. Digital items ship instantly with no delivery fee.
              </p>
            )}
          </dl>
          <Link
            to="/supplies/checkout"
            className={buttonClass("accent", "lg", "mt-5 w-full justify-center")}
          >
            Checkout
          </Link>
          <p className="mt-3 text-center text-xs text-neutral-400">Pay online or with your wallet balance</p>
        </aside>
      </div>
    </div>
  );
}
