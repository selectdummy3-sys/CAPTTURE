import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  APPLICATION_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PRODUCT_STATUS_LABELS,
} from "@/lib/constants";

const orderTones: Record<string, BadgeTone> = {
  pending: "amber",
  paid: "blue",
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  cancelled: "red",
  refunded: "neutral",
};

const appTones: Record<string, BadgeTone> = {
  pending: "amber",
  approved: "green",
  rejected: "red",
  suspended: "red",
};

const productTones: Record<string, BadgeTone> = {
  draft: "neutral",
  published: "green",
  archived: "neutral",
};

const paymentTones: Record<string, BadgeTone> = {
  unpaid: "amber",
  pending_confirmation: "amber",
  paid: "green",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return <Badge tone={orderTones[status] ?? "neutral"}>{ORDER_STATUS_LABELS[status] ?? status}</Badge>;
}

export function ApplicationStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={appTones[status] ?? "neutral"}>{APPLICATION_STATUS_LABELS[status] ?? status}</Badge>
  );
}

export function ProductStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={productTones[status] ?? "neutral"}>{PRODUCT_STATUS_LABELS[status] ?? status}</Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return <Badge tone={paymentTones[status] ?? "neutral"}>{status.replace("_", " ")}</Badge>;
}

export function PaymentMethodBadge({ method }: { method: string }) {
  return <Badge tone="neutral">{PAYMENT_METHOD_LABELS[method] ?? method}</Badge>;
}
