import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useLiveSellerNames } from "@/hooks/useStores";
import { useCartStore, useCartSubtotal, type CartItem } from "@/store/useCartStore";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatZAR } from "@/lib/utils";

const FREE_SHIPPING_ABOVE = 1000;
const SHIPPING_FEE = 60;

function Line({ item, sellerName }: { item: CartItem; sellerName: string }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const remove = useCartStore((s) => s.remove);
  const key = `${item.productId}|${item.size ?? ""}|${item.colour ?? ""}`;
  const image = productImageUrl(item.image);

  return (
    <div className="flex gap-4 border-b border-neutral-100 py-5 last:border-0">
      <Link to={`/p/${item.slug}`} className="shrink-0 overflow-hidden bg-neutral-100">
        {image ? (
          <img src={image} alt={item.name} className="h-24 w-20 object-cover" />
        ) : (
          <div className="grid h-24 w-20 place-items-center text-xs text-neutral-400">No img</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link to={`/p/${item.slug}`} className="font-medium text-neutral-900 hover:text-brand-700">
              {item.name}
            </Link>
            <p className="mt-0.5 text-xs text-neutral-500">
              {[item.size, item.colour].filter(Boolean).join(" · ") || "One size"}
            </p>
            <p className="mt-0.5 text-xs text-neutral-400">Sold by {sellerName}</p>
          </div>
          <button
            type="button"
            onClick={() => remove(key)}
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
              onClick={() => updateQuantity(key, item.quantity - 1)}
              className="p-2 text-neutral-500 hover:text-neutral-900"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(key, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              className="p-2 text-neutral-500 hover:text-neutral-900 disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-right">
            <p className="font-semibold text-neutral-900">{formatZAR(item.price * item.quantity)}</p>
            {item.originalPrice > item.price && (
              <p className="text-xs text-neutral-400 line-through">{formatZAR(item.originalPrice * item.quantity)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartSubtotal();
  const { user } = useAuth();
  const navigate = useNavigate();

  const sellerIds = useMemo(
    () => Array.from(new Set(items.map((i) => i.sellerId).filter(Boolean))),
    [items]
  );
  const { data: sellerMap } = useLiveSellerNames(sellerIds);

  const groups = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    for (const item of items) {
      const list = map.get(item.sellerId) ?? [];
      list.push(item);
      map.set(item.sellerId, list);
    }
    return Array.from(map.values());
  }, [items]);

  const shipping = groups.reduce((acc, group) => {
    const groupSubtotal = group.reduce((a, i) => a + i.price * i.quantity, 0);
    return acc + (groupSubtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE);
  }, 0);

  const total = subtotal + shipping;

  const goToCheckout = () => {
    if (!user) {
      navigate("/login?redirect=" + encodeURIComponent("/checkout"));
      return;
    }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-1440 px-4 py-16 sm:px-6">
        <h1 className="font-display text-5xl font-medium uppercase leading-[1.02] tracking-tight text-neutral-900 sm:text-6xl">
          Your bag
        </h1>
        <div className="mt-6">
          <EmptyState
            icon={<ShoppingBag className="h-10 w-10" />}
            title="Your bag is empty"
            description="Explore the marketplace and find something you love."
            action={
              <Link to="/shop" className={buttonClass("accent", "md")}>
                Start shopping
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-1440 px-4 py-12 sm:px-6 lg:py-16">
      <p className="flex items-center gap-3 text-[11px] uppercase tracking-editorial text-neutral-500">
        <span className="h-px w-8 bg-brand-500" />
        Checkout
      </p>
      <h1 className="mt-4 font-display text-5xl font-medium uppercase leading-[1.02] tracking-tight text-neutral-900 sm:text-6xl">
        Your bag
      </h1>
      <p className="mt-3 text-sm text-neutral-500">
        {items.length} item{items.length === 1 ? "" : "s"} · orders ship per seller
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {groups.map((group, gi) => {
            const groupSubtotal = group.reduce((a, i) => a + i.price * i.quantity, 0);
            const groupShipping = groupSubtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
            const live = sellerMap?.[group[0].sellerId];
            const sellerName = live?.business_name ?? group[0].sellerName;
            const sellerUsername = live?.store_username ?? group[0].sellerUsername;
            return (
              <div key={gi} className="mb-6 border border-neutral-200 p-5">
                <Link
                  to={sellerUsername ? `/store/${sellerUsername}` : "#"}
                  className="text-sm font-semibold text-neutral-900 hover:text-brand-700"
                >
                  {sellerName}
                </Link>
                <div className="mt-2">
                  {group.map((item) => (
                    <Line key={`${item.productId}|${item.size ?? ""}|${item.colour ?? ""}`} item={item} sellerName={sellerName} />
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 text-sm">
                  <span className="text-neutral-500">
                    Shipping: {groupShipping === 0 ? "Free" : formatZAR(groupShipping)}
                  </span>
                  <span className="font-semibold text-neutral-900">
                    {formatZAR(groupSubtotal + groupShipping)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="h-fit border border-neutral-200 bg-white p-6 shadow-sm lg:sticky lg:top-32">
          <h2 className="font-display text-2xl font-medium uppercase tracking-tight text-neutral-900">Order summary</h2>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Subtotal</dt>
              <dd className="font-medium text-neutral-900">{formatZAR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Shipping estimate</dt>
              <dd className="font-medium text-neutral-900">{shipping === 0 ? "Free" : formatZAR(shipping)}</dd>
            </div>
            {subtotal < FREE_SHIPPING_ABOVE && (
              <p className="border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-800">
                Add {formatZAR(FREE_SHIPPING_ABOVE - subtotal)} more to unlock free shipping on qualifying orders.
              </p>
            )}
          </dl>
          <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4">
            <span className="font-semibold text-neutral-900">Total</span>
            <span className="text-lg font-bold text-neutral-900">{formatZAR(total)}</span>
          </div>
          <Button variant="accent" className="mt-5 w-full" size="lg" onClick={goToCheckout}>
            Checkout · {formatZAR(total)}
          </Button>
          <p className="mt-3 text-center text-xs text-neutral-400">
            EFT accepted
          </p>
        </aside>
      </div>
    </div>
  );
}
