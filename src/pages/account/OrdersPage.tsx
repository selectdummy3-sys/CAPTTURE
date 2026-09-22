import { Link } from "react-router-dom";
import { ChevronRight, PackageOpen } from "lucide-react";

import { useMyOrders } from "@/hooks/useOrders";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/ui/status-badge";
import { buttonClass } from "@/components/ui/button";
import { MobilePageNav } from "@/components/account/MobilePageNav";
import { isNative } from "@/lib/capacitor";
import { formatDate, formatPrice } from "@/lib/utils";

export function OrdersPage() {
  const { data: orders, isLoading } = useMyOrders();

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-canvas text-neutral-900"
        style={isNative ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
      >
        <div className="sticky top-0 z-20">
          <MobilePageNav title="Orders" backTo="/account" />
        </div>
        <div className="mx-auto w-full max-w-md px-4 pb-40 pt-6">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3.5 w-40" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
                <Skeleton className="mt-3 h-3 w-36" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if ((orders ?? []).length === 0) {
    return (
      <div
        className="min-h-screen bg-canvas text-neutral-900"
        style={isNative ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
      >
        <div className="sticky top-0 z-20">
          <MobilePageNav title="Orders" backTo="/account" />
        </div>
        <div className="mx-auto w-full max-w-md px-4 pb-40 pt-6">
          <EmptyState
            icon={<PackageOpen className="h-8 w-8" />}
            title="No orders yet"
            description="When you place an order it will show up here."
            action={
              <Link to="/shop" className={buttonClass("primary", "md")}>
                Start shopping
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-canvas text-neutral-900"
      style={isNative ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
    >
      <div className="sticky top-0 z-20">
        <MobilePageNav title="Orders" backTo="/account" />
      </div>
      <div className="mx-auto w-full max-w-md px-4 pb-40 pt-6">
        <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
          <div className="divide-y divide-neutral-100">
            {(orders ?? []).map((order) => (
              <Link
                key={order.id}
                to={`/account/orders/${order.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-neutral-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                    {order.seller?.business_name ?? "Store"}
                    <PaymentMethodBadge method={order.payment_method ?? "cod"} />
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500">
                    <span className="font-mono text-neutral-400">{order.order_number}</span>
                    <span>·</span>
                    <span>{formatDate(order.created_at)}</span>
                    <span>·</span>
                    <span>
                      {order.items?.length ?? 0} item{(order.items?.length ?? 0) === 1 ? "" : "s"}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-neutral-900">{formatPrice(order.total)}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}