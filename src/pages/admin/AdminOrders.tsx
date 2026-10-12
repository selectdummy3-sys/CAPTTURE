import { useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { toast } from "sonner";

import { useAllOrders, useSetOrderStatus } from "@/hooks/useAdmin";
import { can, useAdminAccess } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/select";
import { formatDate, formatZAR } from "@/lib/utils";
import type { Address } from "@/types";

export function AdminOrders() {
  const { data: orders, isLoading } = useAllOrders();
  const { access } = useAdminAccess();
  const setStatus = useSetOrderStatus();
  const canManage = can(access, PERMISSIONS.ordersManage);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (orders ?? []).filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      const recipient = (o.shipping_address as Address | null)?.recipient ?? "";
      return (
        o.order_number.toLowerCase().includes(q) ||
        (o.seller?.business_name ?? "").toLowerCase().includes(q) ||
        (o.user?.full_name ?? "").toLowerCase().includes(q) ||
        (o.user?.email ?? "").toLowerCase().includes(q) ||
        recipient.toLowerCase().includes(q) ||
        (o.tracking_number ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, filter, search]);

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Orders</h1>
        <SkeletonTable rows={6} className="mt-6" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Orders</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 text-xs">
            <option value="all">All statuses</option>
            {["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="relative w-full sm:ml-auto sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, customer, email…"
            className="h-9 w-full border border-neutral-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      {(visible ?? []).length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-8 w-8" />} title="No orders found" className="mt-8" />
      ) : (
        <div className="mt-6 overflow-x-auto border border-neutral-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
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
                  <td className="px-4 py-3">
                    <p className="text-neutral-800">{order.user?.full_name ?? "Guest"}</p>
                    {order.user?.email && <p className="text-xs text-neutral-400">{order.user.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-neutral-800">{order.seller?.business_name ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3">
                    <PaymentMethodBadge method={order.payment_method ?? "cod"} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">{formatZAR(order.total)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                    {canManage && (
                      <Select
                        value={order.status}
                        disabled={setStatus.isPending}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (next === order.status) return;
                          setStatus.mutate(
                            { orderId: order.id, status: next },
                            {
                              onSuccess: () => toast.success(`Order ${order.order_number} → ${next}`),
                              onError: (err) =>
                                toast.error(err instanceof Error ? err.message : "Failed to update status"),
                            }
                          );
                        }}
                        className="mt-2 h-8 text-xs"
                      >
                        {["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"].map(
                          (s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          )
                        )}
                      </Select>
                    )}
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
