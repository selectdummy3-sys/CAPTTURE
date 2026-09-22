import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, PackageSearch, Search, Store, Truck } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/ui/status-badge";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { isNative } from "@/lib/capacitor";
import { formatDate, formatPrice } from "@/lib/utils";

interface TrackedItem {
  product_name: string;
  size: string | null;
  colour: string | null;
  quantity: number;
  price: number;
  line_total: number;
  product_image: string | null;
}

interface PepStoreInfo {
  store_name: string | null;
  store_code: string | null;
  address_line: string | null;
  city: string | null;
  province: string | null;
}

interface TrackedOrder {
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  delivery_method: string | null;
  pep_delivery_tier: string | null;
  shipping_address: Record<string, unknown> | null;
  tracking_number: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  pep_store: PepStoreInfo | null;
  items: TrackedItem[];
}

const NOT_FOUND_MESSAGE =
  "We couldn't find an order matching that number and email address. Double-check both and try again.";

export function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackedOrder | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!orderNumber.trim() || !email.trim()) {
      setError("Please enter both your order number and the email you used to check out.");
      return;
    }

    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("lookup_order", {
      p_order_number: orderNumber.trim(),
      p_email: email.trim(),
    });
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message.includes("no_match") ? NOT_FOUND_MESSAGE : rpcError.message);
      return;
    }

    const order = data as unknown as TrackedOrder;
    if (!order?.order_number) {
      setError(NOT_FOUND_MESSAGE);
      return;
    }
    setResult(order);
  };

  const shipping = result?.shipping_address as
    | {
        full_name?: string;
        phone?: string;
        province?: string;
        city?: string;
        postal_code?: string;
        address_line?: string;
      }
    | null;

  const reset = () => {
    setResult(null);
    setError(null);
  };

  const inputClass =
    "h-12 w-full rounded-xl border border-transparent bg-neutral-100 px-3.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-royal-500 focus:ring-2 focus:ring-royal-500/30";

  return (
    <div
      className="min-h-screen bg-canvas text-neutral-900"
      style={isNative ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
    >
      <div className="mx-auto w-full max-w-md px-4 pb-40 pt-8">
        <div className="flex items-center gap-2 text-royal-700">
          <PackageSearch className="h-4 w-4" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-editorial">Customer care</p>
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-neutral-900">
          Track your order
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Enter the order number from your confirmation email and the email address you checked out
          with to see the status of every parcel — no sign-in needed.
        </p>

        <div className="mt-6 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold text-neutral-800">Order number</span>
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. CPT-260921-8K4Q9Z"
                autoComplete="off"
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold text-neutral-800">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass}
              />
            </label>
            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl">
              <Search className="mr-2 h-4 w-4" aria-hidden />
              {loading ? "Looking up…" : "Find my order"}
            </Button>
          </form>

          {error && !result && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

      {result && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
                {result.order_number}
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500">
                Placed {formatDate(result.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PaymentMethodBadge method={result.payment_method ?? "cod"} />
              <OrderStatusBadge status={result.status} />
            </div>
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-2 text-sm font-semibold text-royal-700 hover:underline"
          >
            Track another order
          </button>

          {result.tracking_number ? (
            <section className="mt-4 rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-royal-50 text-royal-600">
                  <Truck className="h-4 w-4" aria-hidden />
                </span>
                <div className="text-sm">
                  <p className="font-semibold text-neutral-900">CAPPTURE tracking code</p>
                  <p className="mt-0.5 text-neutral-600">
                    Use this code with any of our partners to follow your parcels.
                  </p>
                  <p className="mt-2 inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 font-mono text-sm font-bold text-neutral-900">
                    {result.tracking_number}
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="mt-4 rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500">
                  <Truck className="h-4 w-4" aria-hidden />
                </span>
                <p className="text-sm text-neutral-600">
                  Your CAPPTURE tracking code will appear here once your order is dispatched.
                </p>
              </div>
            </section>
          )}

          <section className="mt-4 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
            <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-900">
              Items ({result.items.length})
            </div>
            <div className="divide-y divide-neutral-100">
              {result.items.map((item, i) => (
                <div key={`${item.product_name}-${i}`} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                    {item.product_image && productImageUrl(item.product_image) && (
                      <img
                        src={productImageUrl(item.product_image)!}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {item.product_name}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {[item.size, item.colour].filter(Boolean).join(" · ") || "Standard"} · Qty{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-neutral-900">
                    {formatPrice(item.line_total)}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 border-t border-neutral-100 px-4 py-4 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span>{formatPrice(result.subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>{result.delivery_method === "pep_collect" ? "Collection" : "Shipping"}</span>
                <span>{formatPrice(result.shipping)}</span>
              </div>
              {result.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(result.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-base font-bold text-neutral-900">
                <span>Total</span>
                <span>{formatPrice(result.total)}</span>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
            {result.delivery_method === "pep_collect" && result.pep_store ? (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-royal-50 text-royal-600">
                  <Store className="h-4 w-4" aria-hidden />
                </span>
                <div className="text-sm">
                  <p className="font-semibold text-neutral-900">Collect at PEP store</p>
                  <p className="mt-0.5 text-neutral-600">
                    {shipping?.full_name ?? "—"}
                    {shipping?.phone ? ` · ${shipping.phone}` : ""}
                  </p>
                  <p className="mt-1 font-medium text-neutral-800">
                    {result.pep_store.store_name} ·{" "}
                    <span className="text-royal-700">
                      Paxi / PEP code: {result.pep_store.store_code}
                    </span>
                  </p>
                  <p className="text-neutral-600">
                    {result.pep_store.city}, {result.pep_store.province}
                  </p>
                  <p className="text-neutral-500">{result.pep_store.address_line}</p>
                  <p className="mt-1.5 text-xs font-medium uppercase text-royal-700">
                    {result.pep_delivery_tier === "express"
                      ? `Express delivery · 3–5 days · ${formatPrice(result.shipping)}`
                      : `Standard delivery · 7–9 days · ${formatPrice(result.shipping)}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500">
                  <MapPin className="h-4 w-4" aria-hidden />
                </span>
                <div className="text-sm">
                  <p className="font-semibold text-neutral-900">Estimated delivery address</p>
                  <p className="mt-0.5 text-neutral-600">
                    {shipping?.full_name ?? "—"}
                    {shipping?.phone ? ` · ${shipping.phone}` : ""}
                  </p>
                  <p className="text-neutral-600">
                    {shipping?.address_line ?? "—"}, {shipping?.city ?? ""}{" "}
                    {shipping?.province ?? ""} {shipping?.postal_code ?? ""}
                  </p>
                </div>
              </div>
            )}
          </section>

          <p className="mt-6 text-sm text-neutral-600">
            Want to manage this order?{" "}
            <Link to="/account/orders" className="font-semibold text-royal-700 hover:underline">
              Sign in to your account
            </Link>
          </p>
        </div>
      )}
      </div>
    </div>
  );
}