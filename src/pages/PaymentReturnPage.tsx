import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Hourglass, Loader2, Package, Truck, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { buttonClass } from "@/components/ui/button";
import { formatZAR } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/hooks/useAuth";

interface ReturnedOrder {
  id: string;
  order_number: string;
  tracking_number: string | null;
  status: string;
  payment_status: string;
}

type PaymentStatus = "complete" | "pending" | "cancelled" | "failed" | null;

function statusFromParam(param: string | null): PaymentStatus {
  const s = (param ?? "").toUpperCase();
  if (s === "COMPLETE") return "complete";
  if (s === "PENDING") return "pending";
  if (s === "CANCELLED" || s === "FAILED") return "cancelled";
  return null;
}

const ACTIONS = (
  <>
    <Link to="/account/orders" className={buttonClass("primary", "md")}>
      View your orders
    </Link>
    <Link to="/shop" className={buttonClass("accent", "md")}>
      Continue shopping
    </Link>
  </>
);

function OrdersPanel({ orders }: { orders: ReturnedOrder[] }) {
  if (orders.length === 0) return null;
  return (
    <div className="mt-8 border border-neutral-200 bg-white text-left">
      <p className="border-b border-neutral-100 px-5 py-3 font-display text-sm font-medium uppercase tracking-tight text-neutral-900">
        Your orders
      </p>
      <ul className="divide-y divide-neutral-100">
        {orders.map((o) => (
          <li key={o.id} className="px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                to={`/account/orders/${o.id}`}
                className="font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                {o.order_number}
              </Link>
              <span className="flex flex-wrap items-center gap-2">
                <PaymentStatusBadge status={o.payment_status} />
                <OrderStatusBadge status={o.status} />
              </span>
            </div>
            <div className="mt-2 flex items-start gap-2 text-sm text-neutral-600">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
              {o.tracking_number ? (
                <p>
                  Tracking code:{" "}
                  <span className="font-mono font-semibold text-neutral-900">{o.tracking_number}</span>
                </p>
              ) : (
                <p>
                  {o.payment_status === "paid"
                    ? "Your seller is preparing your parcel — a tracking code will appear here once it ships."
                    : "A tracking code will appear here once the order is paid and dispatched."}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PaymentReturnPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const paramRef = params.get("m_payment_id");
  const paramStatus = statusFromParam(params.get("pstatus"));

  const { data: latestRef, isLoading: latestLoading } = useQuery({
    queryKey: ["payfast-latest", user?.id, paramRef],
    queryFn: async () => {
      if (paramRef || !user) return null;
      const { data } = await supabase
        .from("payfast_payments")
        .select("payment_ref")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.payment_ref ?? null;
    },
    enabled: !paramRef,
    retry: false,
  });

  const paymentRef = paramRef ?? latestRef ?? null;
  const fromLatest = !paramRef && paymentRef !== null;

  const { data, isFetching, isPending } = useQuery({
    queryKey: ["payfast-payment", paymentRef],
    queryFn: async () => {
      const { data: payment, error } = await supabase
        .from("payfast_payments")
        .select("id, payment_ref, amount, status")
        .eq("payment_ref", paymentRef ?? "")
        .maybeSingle();
      if (error) throw error;
      if (!payment) return { payment: null as { id: number; payment_ref: string; amount: number | null; status: string } | null, orders: [] as ReturnedOrder[] };

      const { data: links } = await supabase
        .from("payfast_order_links")
        .select("order_id")
        .eq("payment_id", payment.id);

      const ids = (links ?? []).map((l) => l.order_id);
      let orders: ReturnedOrder[] = [];
      if (ids.length > 0) {
        const { data: rows } = await supabase
          .from("orders")
          .select("id, order_number, tracking_number, status, payment_status")
          .in("id", ids);
        orders = (rows ?? []) as ReturnedOrder[];
      }
      return { payment, orders };
    },
    enabled: Boolean(paymentRef),
    refetchInterval: (query) => (query.state.data?.payment?.status === "pending" ? 3000 : false),
    refetchIntervalInBackground: true,
    retry: 1,
  });

  if (!paymentRef) {
    if (latestLoading) {
      return (
        <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
          <p className="mt-4 text-neutral-500">Checking your payment…</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="border border-neutral-200 bg-white p-8 text-center shadow-card">
          <Package className="mx-auto h-14 w-14 text-neutral-400" />
          <h1 className="mt-4 font-display text-4xl font-medium uppercase leading-tight tracking-tight text-neutral-900">
            No payment session found
          </h1>
          <p className="mt-2 text-neutral-500">
            This link is missing the payment reference. If you've just paid, your order will appear in your
            account — tracking codes appear there once a seller dispatches your parcel.
          </p>
{fromLatest && (
          <p className="mt-3 text-xs text-neutral-400">Showing your most recent payment.</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">{ACTIONS}</div>
        </div>
      </div>
    );
  }

  if (isPending && !data) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
        <p className="mt-4 text-neutral-500">Checking your payment…</p>
      </div>
    );
  }

  const payment = data?.payment;
  const orders = data?.orders ?? [];

  const dbStatus = payment?.status as PaymentStatus | undefined;
  const status =
    (dbStatus === "complete" && "complete") ||
    (dbStatus === "failed" && "cancelled") ||
    (dbStatus === "cancelled" && "cancelled") ||
    (dbStatus === "pending" && "pending") ||
    paramStatus ||
    null;

  const amount = payment?.amount;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="border border-neutral-200 bg-white p-8 text-center shadow-card">
        {status === "complete" && (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
            <h1 className="mt-4 font-display text-4xl font-medium uppercase leading-tight tracking-tight text-neutral-900">
              Payment received
            </h1>
            <p className="mt-2 text-neutral-500">
              Thanks!{amount !== undefined && amount !== null ? <> Your payment of <span className="font-semibold text-neutral-900">{formatZAR(amount)}</span> (charged in ZAR)</> : null} for{" "}
              {paymentRef} was successful. Your sellers have been notified.
            </p>
          </>
        )}

        {status === "pending" && (
          <>
            <Hourglass className="mx-auto h-14 w-14 text-amber-500" />
            <h1 className="mt-4 font-display text-4xl font-medium uppercase leading-tight tracking-tight text-neutral-900">
              Payment being confirmed
            </h1>
            <p className="mt-2 text-neutral-500">
              PayFast is still confirming your payment. This page updates automatically — nothing else is needed
              from you.
            </p>
          </>
        )}

        {(status === "cancelled" || status === null) && (
          <>
            <XCircle className="mx-auto h-14 w-14 text-neutral-400" />
            <h1 className="mt-4 font-display text-4xl font-medium uppercase leading-tight tracking-tight text-neutral-900">
              {status === "cancelled" ? "Payment not completed" : "No payment found"}
            </h1>
            <p className="mt-2 text-neutral-500">
              {status === "cancelled"
                ? "No money was taken. Your orders remain unpaid — you can place them again whenever you're ready."
                : "We couldn't find a matching payment session."}
            </p>
          </>
        )}

        {isFetching && status === "pending" && (
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Still checking…
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">{ACTIONS}</div>
      </div>

      <OrdersPanel orders={orders} />
    </div>
  );
}