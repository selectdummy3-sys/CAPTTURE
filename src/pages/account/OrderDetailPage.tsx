import { Link, useParams } from "react-router-dom";
import { MapPin, PackageOpen, Store } from "lucide-react";

import { useOrder } from "@/hooks/useOrders";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/ui/status-badge";
import { buttonClass } from "@/components/ui/button";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { formatDate, formatPrice } from "@/lib/utils";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4">
          <Skeleton className="h-7 w-72 max-w-full" />
          <Skeleton className="mt-2 h-4 w-56 max-w-full" />
        </div>
        <div className="mt-8 border border-neutral-200">
          <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-3">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="divide-y divide-neutral-100">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="skeleton h-16 w-16 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-neutral-100 px-5 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-3.5 w-full" />
            ))}
          </div>
        </div>
        <Skeleton className="mt-6 h-24 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
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

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/account/orders" className="text-sm font-medium text-brand-700 hover:underline">
        ← Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{order.order_number}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Placed {formatDate(order.created_at)} · {order.seller?.business_name ?? "Store"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PaymentMethodBadge method={order.payment_method ?? "cod"} />
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <section className="mt-8 border border-neutral-200">
        <div className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-900">
          Items
        </div>
        <div className="divide-y divide-neutral-100">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden bg-neutral-100">
                {item.product_image && productImageUrl(item.product_image) && (
                  <img src={productImageUrl(item.product_image)!} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{item.product_name}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {[item.size, item.colour].filter(Boolean).join(" · ") || "Standard"} · Qty {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-neutral-900">{formatPrice(item.line_total)}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 border-t border-neutral-100 px-5 py-4 text-sm">
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
          <div className="flex justify-between pt-2 text-base font-semibold text-neutral-900">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>

      <section className="mt-6 border border-neutral-200 p-5">
        {order.delivery_method === "pep_collect" && order.pep_store ? (
          <div className="flex items-start gap-3">
            <Store className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <div className="text-sm">
              <p className="font-semibold text-neutral-900">Collect at PEP store</p>
              <p className="mt-1 text-neutral-600">
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
              <p className="mt-1.5 text-xs font-medium uppercase tracking-editorial text-brand-700">
                {order.pep_delivery_tier === "express"
                  ? `Express delivery · 3–5 days · ${formatPrice(order.shipping)}`
                  : `Standard delivery · 7–9 days · ${formatPrice(order.shipping)}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
            <div className="text-sm">
              <p className="font-semibold text-neutral-900">Delivery to</p>
              <p className="mt-1 text-neutral-600">
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
