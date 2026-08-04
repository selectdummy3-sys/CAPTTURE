import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, SUPPLY_PAYMENT_METHOD_LABELS } from "@/lib/constants";

const orderTones: Record<string, BadgeTone> = {
  pending: "amber",
  paid: "blue",
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  cancelled: "red",
  refunded: "neutral",
};

const paymentTones: Record<string, BadgeTone> = {
  unpaid: "amber",
  pending_confirmation: "amber",
  paid: "green",
};

const methodTones: Record<string, BadgeTone> = {
  online: "brand",
  eft: "neutral",
};

export function SupplyOrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={orderTones[status] ?? "neutral"}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function SupplyPaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={paymentTones[status] ?? "neutral"}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export function SupplyPaymentMethodBadge({ method }: { method: string }) {
  return (
    <Badge tone={methodTones[method] ?? "neutral"}>
      {SUPPLY_PAYMENT_METHOD_LABELS[method] ?? method}
    </Badge>
  );
}
