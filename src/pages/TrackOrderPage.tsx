import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, PackageSearch, Search, Store, Truck } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/ui/status-badge";
import { productImageUrl } from "@/components/storefront/ProductCard";
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex items-center gap-2 text-brand-700">
        <PackageSearch className="h-4 w-4" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-editorial">Customer care</p>
      </div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        Track your order
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600">
        Enter the order number from your confirmation email and the email address you checked out
        with to see the status of every parcel — no sign-in needed.
      </p>

      <div className="mt-8 border border-neutral-200 bg-white p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-neutral-800">Order number</span>
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. CPT-260921-8K4Q9Z"
              autoComplete="off"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-neutral-800">Email address</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" aria-hidden />
              {loading ? "Looking up…" : "Find my order"}
            </Button>
          </div>
        </form>

        {error && !result && (
          <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {result && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                {result.order_number}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Placed {formatDate(result.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PaymentMethodBadge method={result.payment_method ?? "cod"} />
              <OrderStatusBadge status={result.status} />
            </div>
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-2 text-sm font-medium text-brand-700 hover:underline"
          >
            Track another order
          </button>

          {result.tracking_number ? (
            <section className="mt-6 border border-neutral-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                <div className="text-sm">
                  <p className="font-semibold text-neutral-900">CAPPTURE tracking code</p>
                  <p className="mt-1 text-neutral-600">
                    Use this code with any of our partners to follow your parcels.
                  </p>
                  <p className="mt-2 inline-flex items-center rounded border border-neutral-200 bg-neutral-50 px-3 py-1.5 font-mono text-sm font-bold text-neutral-900">
                    {result.tracking_number}
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="mt-6 border border-neutral-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                <p className="text-sm text-neutral-600">
                  Your CAPPTURE tracking code will appear here once your order is dispatched.
                </p>
              </div>
            </section>
          )}

          <section className="mt-6 border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-900">
              Items ({result.items.length})
            </div>
            <div className="divide-y divide-neutral-100">
              {result.items.map((item, i) => (
                <div key={`${item.product_name}-${i}`} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden bg-neutral-100">
                    {item.product_image && productImageUrl(item.product_image) && (
                      <img
                        src={productImageUrl(item.product_image)!}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {item.product_name}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {[item.size, item.colour].filter(Boolean).join(" · ") || "Standard"} · Qty{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {formatPrice(item.line_total)}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 border-t border-neutral-100 px-5 py-4 text-sm">
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
              <div className="flex justify-between pt-2 text-base font-semibold text-neutral-900">
                <span>Total</span>
                <span>{formatPrice(result.total)}</span>
              </div>
            </div>
          </section>

          <section className="mt-6 border border-neutral-200 bg-white p-5">
            {result.delivery_method === "pep_collect" && result.pep_store ? (
              <div className="flex items-start gap-3">
                <Store className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                <div className="text-sm">
                  <p className="font-semibold text-neutral-900">Collect at PEP store</p>
                  <p className="mt-1 text-neutral-600">
                    {shipping?.full_name ?? "—"}
                    {shipping?.phone ? ` · ${shipping.phone}` : ""}
                  </p>
                  <p className="mt-1 font-medium text-neutral-800">
                    {result.pep_store.store_name} ·{" "}
                    <span className="text-brand-700">
                      Paxi / PEP code: {result.pep_store.store_code}
                    </span>
                  </p>
                  <p className="text-neutral-600">
                    {result.pep_store.city}, {result.pep_store.province}
                  </p>
                  <p className="text-neutral-500">{result.pep_store.address_line}</p>
                  <p className="mt-1.5 text-xs font-medium uppercase tracking-editorial text-brand-700">
                    {result.pep_delivery_tier === "express"
                      ? `Express delivery · 3–5 days · ${formatPrice(result.shipping)}`
                      : `Standard delivery · 7–9 days · ${formatPrice(result.shipping)}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                <div className="text-sm">
                  <p className="font-semibold text-neutral-900">Estimated delivery address</p>
                  <p className="mt-1 text-neutral-600">
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
            <Link to="/account/orders" className="font-medium text-brand-700 hover:underline">
              Sign in to your account
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}