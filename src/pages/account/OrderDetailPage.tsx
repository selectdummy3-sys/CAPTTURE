import { Link, useParams } from "react-router-dom";
import { MapPin, PackageOpen, Store, Truck } from "lucide-react";

import { useOrder } from "@/hooks/useOrders";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/ui/status-badge";
import { buttonClass } from "@/components/ui/button";
import { MobilePageNav } from "@/components/account/MobilePageNav";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { isNative } from "@/lib/capacitor";
import { formatDate, formatPrice } from "@/lib/utils";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);

  const shell = (content: React.ReactNode) => (
    <div
      className="min-h-screen bg-canvas text-neutral-900"
      style={isNative ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
    >
      <div className="sticky top-0 z-20">
        <MobilePageNav title="Order" backTo="/account/orders" />
      </div>
      <div className="mx-auto w-full max-w-md px-4 pb-40 pt-6">{content}</div>
    </div>
  );

  if (isLoading) {
    return shell(
      <div>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-56 max-w-full" />
        <div className="mt-4 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
            <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="divide-y divide-neutral-100">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="skeleton h-14 w-14 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-3.5 w-14" />
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return shell(
      <EmptyState
        icon={<PackageOpen className="h-8 w-8" />}
        title="Order not found"
        description="We couldn't find that order."
        action={
          <Link to="/account/orders" className={buttonClass("outline", "md")}>
            Back to orders
          </Link>
        }
      />
    );
  }

  const shipping = order.shipping_address as {
    full_name?: string;
    phone?: string;
    province?: string;
    city?: string;
    postal_code?: string;
    address_line?: string;
  } | null;

  return shell(
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          Placed {formatDate(order.created_at)} · {order.seller?.business_name ?? "Store"}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <PaymentMethodBadge method={order.payment_method ?? "cod"} />
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-900">
          Items
        </div>
        <div className="divide-y divide-neutral-100">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                {item.product_image && productImageUrl(item.product_image) && (
                  <img src={productImageUrl(item.product_image)!} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900">{item.product_name}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {[item.size, item.colour].filter(Boolean).join(" · ") || "Standard"} · Qty {item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-neutral-900">{formatPrice(item.line_total)}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 border-t border-neutral-100 px-4 py-4 text-sm">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>{order.delivery_method === "pep_collect" ? "Collection" : "Shipping"}</span>
            <span>{formatPrice(order.shipping)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount {order.coupon?.code ? `(${order.coupon.code})` : ""}</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 text-base font-bold text-neutral-900">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>

      {order.tracking_number && (
        <section className="mt-3 rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-royal-50 text-royal-600">
              <Truck className="h-4 w-4" />
            </span>
            <div className="text-sm">
              <p className="font-semibold text-neutral-900">Track every parcel</p>
              <p className="mt-0.5 text-neutral-600">
                Use your CAPPTURE tracking code to follow all the parcels in this order.
              </p>
              <p className="mt-2 inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 font-mono text-sm font-bold text-neutral-900">
                {order.tracking_number}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-3 rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
        {order.delivery_method === "pep_collect" && order.pep_store ? (
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-royal-50 text-royal-600">
              <Store className="h-4 w-4" />
            </span>
            <div className="text-sm">
              <p className="font-semibold text-neutral-900">Collect at PEP store</p>
              <p className="mt-0.5 text-neutral-600">
                {shipping?.full_name ?? "—"}
                {shipping?.phone ? ` · ${shipping.phone}` : ""}
              </p>
              <p className="mt-1 font-medium text-neutral-800">
                {order.pep_store.store_name} ({order.pep_store.store_code})
              </p>
              <p className="text-neutral-600">
                {order.pep_store.city}, {order.pep_store.province}
              </p>
              <p className="text-neutral-500">{order.pep_store.address_line}</p>
              <p className="mt-1.5 text-xs font-medium uppercase text-royal-700">
                {order.pep_delivery_tier === "express"
                  ? `Express delivery · 3–5 days · ${formatPrice(order.shipping)}`
                  : `Standard delivery · 7–9 days · ${formatPrice(order.shipping)}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="text-sm">
              <p className="font-semibold text-neutral-900">Delivery to</p>
              <p className="mt-0.5 text-neutral-600">
                {shipping?.full_name ?? "—"}
                {shipping?.phone ? ` · ${shipping.phone}` : ""}
              </p>
              <p className="text-neutral-600">
                {shipping?.address_line ?? "—"}, {shipping?.city ?? ""} {shipping?.province ?? ""}{" "}
                {shipping?.postal_code ?? ""}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}