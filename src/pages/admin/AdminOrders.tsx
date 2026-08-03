import { useState } from "react";
import { ClipboardList } from "lucide-react";

import { useAllOrders } from "@/hooks/useAdmin";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/select";
import { formatDate, formatZAR } from "@/lib/utils";

export function AdminOrders() {
  const { data: orders, isLoading } = useAllOrders();
  const [filter, setFilter] = useState("all");

  const visible = filter === "all" ? orders : (orders ?? []).filter((o) => o.status === filter);

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-400">Loading orders…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Orders</h1>

      <div className="mt-4 w-44">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 text-xs">
          <option value="all">All statuses</option>
          {["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {(visible ?? []).length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-8 w-8" />} title="No orders found" className="mt-8" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(visible ?? []).map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">{order.order_number}</td>
                  <td className="px-4 py-3 text-neutral-800">{order.seller?.business_name ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3">
                    <PaymentMethodBadge method={order.payment_method ?? "cod"} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">{formatZAR(order.total)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
