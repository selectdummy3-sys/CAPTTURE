import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Hourglass, Loader2, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { buttonClass } from "@/components/ui/button";
import { formatZAR } from "@/lib/utils";

function statusFromParam(param: string | null): "complete" | "pending" | "cancelled" | null {
  const s = (param ?? "").toUpperCase();
  if (s === "COMPLETE") return "complete";
  if (s === "PENDING") return "pending";
  if (s === "CANCELLED" || s === "FAILED") return "cancelled";
  return null;
}

export function PaymentReturnPage() {
  const [params] = useSearchParams();
  const paymentRef = params.get("m_payment_id");
  const paramStatus = statusFromParam(params.get("pstatus"));

  const { data, isFetching, isPending } = useQuery({
    queryKey: ["payfast-payment", paymentRef],
    queryFn: async () => {
      if (!paymentRef) return null;
      const { data, error } = await supabase
        .from("payfast_payments")
        .select("payment_ref, amount, status")
        .eq("payment_ref", paymentRef)
        .maybeSingle();
      if (error) throw error;
      return data as { payment_ref: string; amount: number; status: string } | null;
    },
    enabled: Boolean(paymentRef),
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 3000 : false),
    refetchIntervalInBackground: true,
    retry: false,
  });

  if (isPending && !data) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
        <p className="mt-4 text-neutral-500">Checking your payment…</p>
      </div>
    );
  }

  const dbStatus = data?.status;
  const status =
    (dbStatus === "complete" && "complete") ||
    (dbStatus === "failed" && "cancelled") ||
    (dbStatus === "cancelled" && "cancelled") ||
    (dbStatus === "pending" && "pending") ||
    paramStatus ||
    null;

  const amount = data?.amount;

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
              Thanks!{amount !== undefined ? <> Your payment of <span className="font-semibold text-neutral-900">{formatZAR(amount)}</span></> : null} for{" "}
              {paymentRef ?? "your order"} was successful. Your sellers have been notified.
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

        {isFetching && !isPending && status === "pending" && (
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Still checking…
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/account/orders" className={buttonClass("primary", "md")}>
            View your orders
          </Link>
          <Link to="/shop" className={buttonClass("accent", "md")}>
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}