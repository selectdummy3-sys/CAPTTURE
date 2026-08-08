import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, CreditCard } from "lucide-react";

import { buttonClass } from "@/components/ui/button";
import { formatZAR } from "@/lib/utils";

interface SuccessState {
  orderNumbers?: string[];
  paymentMethod?: "cod" | "eft";
  grandTotal?: number;
}

export function OrderSuccessPage() {
  const { state } = useLocation() as { state: SuccessState | null };
  const numbers = state?.orderNumbers ?? [];
  const total = state?.grandTotal ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="border border-neutral-200 bg-white p-8 text-center shadow-card">
        <CheckCircle2 className="mx-auto h-14 w-14 text-brand-500" />
        <h1 className="mt-4 font-display text-4xl font-medium uppercase leading-tight tracking-tight text-neutral-900">
          Order{numbers.length > 1 ? "s" : ""} placed!
        </h1>
        <p className="mt-2 text-neutral-500">
          Thanks for shopping local. Your sellers have been notified and will start preparing your
          order{numbers.length > 1 ? "s" : ""}.
        </p>

        {numbers.length > 0 && (
          <div className="mt-6 border border-neutral-200 bg-paper p-4 text-sm">
            <p className="font-semibold text-neutral-900">Order number{numbers.length > 1 ? "s" : ""}</p>
            <div className="mt-1 space-y-0.5 font-mono text-neutral-700">
              {numbers.map((n) => (
                <p key={n}>{n}</p>
              ))}
            </div>
            <p className="mt-2 text-neutral-500">Total: <span className="font-semibold text-neutral-900">{formatZAR(total)}</span></p>
            <div className="mt-3 flex items-center justify-center gap-2 text-neutral-600">
              <CreditCard className="h-4 w-4" /> Awaiting EFT confirmation
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/account/orders" className={buttonClass("primary", "md")}>
            Track your orders
          </Link>
          <Link to="/shop" className={buttonClass("accent", "md")}>
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
