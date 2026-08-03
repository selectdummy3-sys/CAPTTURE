import { Link } from "react-router-dom";
import { PackageOpen } from "lucide-react";

import { useMyOrders } from "@/hooks/useOrders";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/ui/status-badge";
import { buttonClass } from "@/components/ui/button";
import { formatDate, formatZAR } from "@/lib/utils";

export function OrdersPage() {
  const { data: orders, isLoading } = useMyOrders();

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-400">Loading orders…</p>;

  if ((orders ?? []).length === 0) {
    return (
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
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Orders</h1>
      <div className="mt-6 space-y-4">
        {(orders ?? []).map((order) => (
          <Link
            key={order.id}
            to={`/account/orders/${order.id}`}
            className="block border border-neutral-200 p-5 transition-colors hover:border-brand-300 hover:shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-neutral-400">{order.order_number}</p>
                <p className="mt-0.5 text-sm font-semibold text-neutral-900">
                  {order.seller?.business_name ?? "Store"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-neutral-900">{formatZAR(order.total)}</span>
                <PaymentMethodBadge method={order.payment_method ?? "cod"} />
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
              <span>{formatDate(order.created_at)}</span>
              <span>·</span>
              <span>{order.items?.length ?? 0} item{(order.items?.length ?? 0) === 1 ? "" : "s"}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
