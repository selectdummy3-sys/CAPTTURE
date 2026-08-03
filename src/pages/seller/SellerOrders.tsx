import { useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";

import { useSellerOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/select";
import { formatDate, formatZAR } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUSES = ["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;

export function SellerOrders() {
  const [status, setStatus] = useState<string>("all");
  const { data: orders, isLoading } = useSellerOrders(status);
  const updateStatus = useUpdateOrderStatus();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const changeStatus = async (id: string, next: string) => {
    setUpdatingId(id);
    try {
      await updateStatus.mutateAsync({ id, status: next });
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-400">Loading orders…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Orders</h1>

      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "shrink-0-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
              status === s ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {(orders ?? []).length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No orders here"
          description="Orders placed for your store will appear here."
          className="mt-8"
        />
      ) : (
        <div className="mt-6 space-y-4">
          {(orders ?? []).map((order) => (
            <div key={order.id} className="border border-neutral-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-neutral-400">{order.order_number}</p>
                  <p className="mt-0.5 text-sm font-semibold text-neutral-900">{formatZAR(order.total)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <PaymentMethodBadge method={order.payment_method ?? "cod"} />
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                <span>{formatDate(order.created_at)}</span>
                <span>·</span>
                <span>{(order.items ?? []).length} item{(order.items ?? []).length === 1 ? "" : "s"}</span>
                {order.shipping_address && (
                  <>
                    <span>·</span>
                    <span className="text-neutral-500">
                      {(order.shipping_address as { city?: string })?.city ??
                        (order.shipping_address as { line1?: string })?.line1 ?? "—"}
                    </span>
                  </>
                )}
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <label className="text-xs font-medium text-neutral-500">Update status</label>
                <div className="w-40">
                  <Select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => void changeStatus(order.id, e.target.value)}
                    className="h-9 text-xs"
                  >
                    {["pending", "paid", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
                {updatingId === order.id && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
