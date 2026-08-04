import { useState } from "react";
import { ClipboardList, ChevronDown, Truck, MapPin } from "lucide-react";

import {
  useAdminSupplyOrders,
  useAdminSupplyUpdateOrderStatus,
  useAdminSupplyUpdatePaymentStatus,
  useAdminSupplyUpdateTracking,
} from "@/hooks/useSupply";
import { EmptyState } from "@/components/ui/empty-state";
import {
  SupplyOrderStatusBadge,
  SupplyPaymentMethodBadge,
} from "@/components/supply/SupplyStatus";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, formatDate, formatZAR } from "@/lib/utils";
import type { SupplyOrderWithRelations } from "@/types";

const STATUSES = ["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;

const PAYMENT_STATUSES = ["unpaid", "pending_confirmation", "paid", "refunded"] as const;

interface SupplyOrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  line_total: number;
}

function OrderCard({ order }: { order: SupplyOrderWithRelations }) {
  const [expanded, setExpanded] = useState(false);
  const updateStatus = useAdminSupplyUpdateOrderStatus();
  const updatePayment = useAdminSupplyUpdatePaymentStatus();
  const updateTracking = useAdminSupplyUpdateTracking();
  const [busy, setBusy] = useState(false);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [savedTracking, setSavedTracking] = useState(order.tracking_number ?? "");

  const items = (order.items ?? []) as SupplyOrderItem[];

  const changeStatus = async (status: string) => {
    setBusy(true);
    try {
      await updateStatus.mutateAsync({ id: order.id, status });
    } finally {
      setBusy(false);
    }
  };

  const changePayment = async (paymentStatus: string) => {
    setBusy(true);
    try {
      await updatePayment.mutateAsync({ id: order.id, paymentStatus });
    } finally {
      setBusy(false);
    }
  };

  const saveTracking = async () => {
    setBusy(true);
    try {
      await updateTracking.mutateAsync({ id: order.id, trackingNumber: tracking.trim() });
      setSavedTracking(tracking.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <div className="min-w-0">
          <p className="font-mono text-xs text-neutral-400">{order.order_number}</p>
          <p className="mt-0.5 text-sm font-semibold text-neutral-900">{formatZAR(order.total)}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {formatDate(order.created_at)} · {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <SupplyPaymentMethodBadge method={order.payment_method ?? "online"} />
            <SupplyOrderStatusBadge status={order.status} />
          </div>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-neutral-400 transition-transform", expanded && "rotate-180")}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 px-5 pb-5">
          <div className="mt-5 grid gap-8 lg:grid-cols-3">
            {/* Delivery address */}
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <MapPin className="h-4 w-4" /> Delivery address
              </p>
              <div className="mt-2 space-y-1 text-sm text-neutral-600">
                {(() => {
                  const addr = order.shipping_address as Record<string, string> | null;
                  if (!addr) return <p className="text-neutral-500">No address on file.</p>;
                  return (
                    <>
                      {addr.recipient && <p className="font-medium text-neutral-900">{addr.recipient}</p>}
                      {addr.line1 && <p>{addr.line1}</p>}
                      {addr.line2 && <p>{addr.line2}</p>}
                      {addr.city && (
                        <p>
                          {addr.city}
                          {addr.province ? `, ${addr.province}` : ""} {addr.postal_code}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Items</p>
              <div className="mt-2 space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                    <p className="min-w-0 font-medium text-neutral-900">{item.product_name}</p>
                    <p className="shrink-0 text-neutral-600">
                      {item.quantity} × {formatZAR(item.price)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-neutral-100 pt-3 text-sm">
                <div className="flex justify-between font-semibold text-neutral-900">
                  <span>Total</span>
                  <span>{formatZAR(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <Truck className="h-4 w-4" /> Manage
              </p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="w-16 text-xs font-medium text-neutral-500">Order</label>
                  <div className="flex-1">
                    <Select
                      value={order.status}
                      disabled={busy}
                      onChange={(e) => void changeStatus(e.target.value)}
                      className="h-9 text-xs"
                    >
                      {STATUSES.filter((s) => s !== "all").map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-16 text-xs font-medium text-neutral-500">Payment</label>
                  <div className="flex-1">
                    <Select
                      value={order.payment_status ?? "unpaid"}
                      disabled={busy}
                      onChange={(e) => void changePayment(e.target.value)}
                      className="h-9 text-xs"
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500">Tracking number</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      placeholder="e.g. ZZ1234567890"
                      className="h-9 flex-1 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void saveTracking()}
                      disabled={busy || tracking.trim() === savedTracking}
                    >
                      Save
                    </Button>
                  </div>
                </div>
                {order.courier && (
                  <p className="text-xs text-neutral-500">Courier: {order.courier}</p>
                )}
                {order.delivered_at && (
                  <p className="text-xs text-green-600">Delivered {formatDate(order.delivered_at)}</p>
                )}
                {order.notes && (
                  <div>
                    <p className="text-xs font-medium text-neutral-500">Notes</p>
                    <p className="mt-1 text-sm text-neutral-600">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminSupplyOrders() {
  const [status, setStatus] = useState<string>("all");
  const { data: orders, isLoading } = useAdminSupplyOrders(status);

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-400">Loading orders…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Supply Orders</h1>

      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
              status === s
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {(orders ?? []).length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No supply orders"
          description="Supply orders will appear here once sellers start purchasing."
          className="mt-8"
        />
      ) : (
        <div className="mt-6 space-y-4">
          {(orders ?? []).map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
