import { Link, useParams } from "react-router-dom";
import { MapPin, PackageOpen } from "lucide-react";

import { useOrder } from "@/hooks/useOrders";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/ui/status-badge";
import { buttonClass } from "@/components/ui/button";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { formatDate, formatZAR } from "@/lib/utils";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-400">Loading order…</p>;

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
                  <img src={productImageUrl(item.product_image)!} alt="" className="h w object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{item.product_name}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {[item.size, item.colour].filter(Boolean).join(" · ") || "Standard"} · Qty {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-neutral-900">{formatZAR(item.line_total)}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 border-t border-neutral-100 px-5 py-4 text-sm">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span>{formatZAR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Shipping</span>
            <span>{formatZAR(order.shipping)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount {order.coupon?.code ? `(${order.coupon.code})` : ""}</span>
              <span>-{formatZAR(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 text-base font-semibold text-neutral-900">
            <span>Total</span>
            <span>{formatZAR(order.total)}</span>
          </div>
        </div>
      </section>

      <section className="mt-6 border border-neutral-200 p-5">
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
      </section>
    </div>
  );
}
