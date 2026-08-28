import { useState } from "react";
import {
  ChevronDown,
  ClipboardList,
  FileText,
  Loader2,
  MapPin,
  Phone,
  Printer,
  Truck,
  UserRound,
  Mail,
} from "lucide-react";

import { useSellerOrders, useUpdateOrderStatus, useUpdateOrderTracking } from "@/hooks/useOrders";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatDate, formatDateTime, formatZAR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Address } from "@/types";
import type { OrderWithRelations } from "@/types";

const STATUSES = ["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;

function ShippingAddress({ address }: { address: Address | null }) {
  if (!address) return <p className="text-sm text-neutral-500">No shipping address recorded.</p>;
  return (
    <div className="space-y-1 text-sm text-neutral-600">
      <p className="font-medium text-neutral-900">{address.recipient}</p>
      <p>{address.line1}</p>
      {address.line2 && <p>{address.line2}</p>}
      <p>
        {address.city}, {address.province} {address.postal_code}
      </p>
      <p className="flex items-center gap-1.5 text-neutral-500">
        <Phone className="h-3.5 w-3.5" /> {address.phone}
      </p>
    </div>
  );
}

function InvoiceView({ order }: { order: OrderWithRelations }) {
  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-neutral-900">{order.seller?.business_name ?? "CAPTTURE"}</p>
          <p className="text-xs text-neutral-400">captture.co.za</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-neutral-900">{order.order_number}</p>
          <p className="text-xs text-neutral-400">{formatDateTime(order.created_at)}</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Bill to</p>
          <div className="mt-2 space-y-1 text-sm text-neutral-600">
            <p className="font-medium text-neutral-900">{order.user?.full_name ?? "Customer"}</p>
            {order.user?.email && <p>{order.user.email}</p>}
            {order.user?.phone && <p>{order.user.phone}</p>}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Ship to</p>
          <ShippingAddress address={order.shipping_address as Address | null} />
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-400">
            <th className="pb-2 font-semibold">Item</th>
            <th className="pb-2 text-center font-semibold">Qty</th>
            <th className="pb-2 text-right font-semibold">Price</th>
            <th className="pb-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {(order.items ?? []).map((item) => (
            <tr key={item.id}>
              <td className="py-2.5">
                <p className="font-medium text-neutral-900">{item.product_name}</p>
                {(item.size || item.colour) && (
                  <p className="text-xs text-neutral-400">
                    {item.size ? `Size ${item.size}` : ""}
                    {item.size && item.colour ? " · " : ""}
                    {item.colour ? item.colour : ""}
                  </p>
                )}
              </td>
              <td className="py-2.5 text-center text-neutral-600">{item.quantity}</td>
              <td className="py-2.5 text-right text-neutral-600">{formatZAR(item.price)}</td>
              <td className="py-2.5 text-right font-medium text-neutral-900">
                {formatZAR(item.price * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1.5 border-t border-neutral-200 pt-4 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal</span>
          <span>{formatZAR(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-neutral-600">
            <span>Discount</span>
            <span>-{formatZAR(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-neutral-600">
          <span>Shipping</span>
          <span>{order.shipping === 0 ? "Free" : formatZAR(order.shipping)}</span>
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold text-neutral-900">
          <span>Total</span>
          <span>{formatZAR(order.total)}</span>
        </div>
      </div>

      <p className="text-xs text-neutral-400">
        Payment method: {(order.payment_method ?? "cod").toUpperCase()} · Status: {order.status}
      </p>
    </div>
  );
}

function OrderCard({ order }: { order: OrderWithRelations }) {
  const [expanded, setExpanded] = useState(false);
  const updateStatus = useUpdateOrderStatus();
  const updateTracking = useUpdateOrderTracking();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [savedTracking, setSavedTracking] = useState(order.tracking_number ?? "");

  const changeStatus = async (id: string, next: string) => {
    setUpdatingId(id);
    try {
      await updateStatus.mutateAsync({ id, status: next });
    } finally {
      setUpdatingId(null);
    }
  };

  const saveTracking = async () => {
    setUpdatingId(order.id);
    try {
      await updateTracking.mutateAsync({ id: order.id, trackingNumber: tracking.trim() });
      setSavedTracking(tracking.trim());
    } finally {
      setUpdatingId(null);
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
            {formatDate(order.created_at)} · {order.user?.full_name ?? "Customer"} · {(order.items ?? []).length} item
            {(order.items ?? []).length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <PaymentMethodBadge method={order.payment_method ?? "cod"} />
            <OrderStatusBadge status={order.status} />
          </div>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-neutral-400 transition-transform", expanded && "rotate-180")} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 px-5 pb-5">
          <div className="mt-5 grid gap-8 lg:grid-cols-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <UserRound className="h-4 w-4" /> Customer
              </p>
              <div className="mt-2 space-y-1 text-sm text-neutral-600">
                <p className="font-medium text-neutral-900">{order.user?.full_name ?? "Guest customer"}</p>
                {order.user?.email && (
                  <p className="flex items-center gap-1.5 text-neutral-500">
                    <Mail className="h-3.5 w-3.5" /> {order.user.email}
                  </p>
                )}
                {order.user?.phone && (
                  <p className="flex items-center gap-1.5 text-neutral-500">
                    <Phone className="h-3.5 w-3.5" /> {order.user.phone}
                  </p>
                )}
                <div className="pt-2">
                  <p className="flex items-center gap-1.5 text-neutral-500">
                    <MapPin className="h-3.5 w-3.5" /> Shipping address
                  </p>
                  <div className="ml-5 mt-1">
                    <ShippingAddress address={order.shipping_address as Address | null} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Items</p>
              <div className="mt-2 space-y-2">
                {(order.items ?? []).map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900">{item.product_name}</p>
                      <p className="text-xs text-neutral-400">
                        {item.size ? `Size ${item.size}` : ""}
                        {item.size && item.colour ? " · " : ""}
                        {item.colour ? item.colour : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-neutral-600">
                      {item.quantity} × {formatZAR(item.price)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>{formatZAR(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Discount</span>
                    <span>-{formatZAR(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span>{order.shipping === 0 ? "Free" : formatZAR(order.shipping)}</span>
                </div>
                <div className="flex justify-between font-semibold text-neutral-900">
                  <span>Total</span>
                  <span>{formatZAR(order.total)}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <Truck className="h-4 w-4" /> Fulfilment
              </p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-neutral-500">Status</label>
                  <div className="w-40">
                    <Select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => void changeStatus(order.id, e.target.value)}
                      className="h-9 text-xs"
                    >
                      {["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {updatingId === order.id && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
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
                      disabled={updatingId === order.id || tracking.trim() === savedTracking}
                    >
                      Save
                    </Button>
                  </div>
                  {order.delivered_at && (
                    <p className="mt-1.5 text-xs text-neutral-400">Delivered on {formatDate(order.delivered_at)}</p>
                  )}
                </div>

                {order.notes && (
                  <div>
                    <p className="text-xs font-medium text-neutral-500">Notes</p>
                    <p className="mt-1 text-sm text-neutral-600">{order.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => setInvoiceOpen(true)}>
                    <FileText className="h-4 w-4" /> Invoice / Packing slip
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        title={`Invoice · ${order.order_number}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </>
        }
      >
        <InvoiceView order={order} />
      </Dialog>
    </div>
  );
}

export function SellerOrders() {
  const [status, setStatus] = useState<string>("all");
  const { data: orders, isLoading } = useSellerOrders(status);

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
              "shrink-0 px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
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
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}