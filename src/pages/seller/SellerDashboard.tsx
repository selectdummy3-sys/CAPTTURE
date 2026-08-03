import { Link } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";

import { useSellerStats, useSellerOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/ui/stat-card";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { buttonClass } from "@/components/ui/button";
import { formatCompactZAR, formatDate, formatZAR } from "@/lib/utils";

export function SellerDashboard() {
  const { seller } = useAuth();
  const stats = useSellerStats();
  const { data: orders } = useSellerOrders();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500">Welcome back to {seller?.business_name}.</p>
        </div>
        <Link to="/seller/products/new" className={buttonClass("primary", "sm")}>
          + New product
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatCompactZAR(stats.revenue)} />
        <StatCard label="Orders" value={stats.orders} />
        <StatCard label="Pending" value={stats.pendingOrders} />
        <StatCard label="Products" value={stats.products} />
      </div>

      <section className="border border-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h2 className="font-semibold text-neutral-900">Recent orders</h2>
          <Link to="/seller/orders" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-neutral-100">
          {(orders ?? []).slice(0, 8).map((order) => (
            <div key={order.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <p className="font-mono text-xs text-neutral-400">{order.order_number}</p>
                <p className="mt-0.5 font-medium text-neutral-900">{formatZAR(order.total)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-neutral-400 sm:inline">{formatDate(order.created_at)}</span>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          ))}
          {(orders ?? []).length === 0 && (
            <div className="px-5 py-10 text-center">
              <Package className="mx-auto h-6 w-6 text-neutral-300" />
              <p className="mt-2 text-sm text-neutral-400">No orders yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
