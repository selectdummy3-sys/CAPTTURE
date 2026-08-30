import { Link, useLocation, Navigate } from "react-router-dom";
import { CheckCircle2, Download, ShoppingBag } from "lucide-react";

import { SupplyPaymentMethodBadge } from "@/components/supply/SupplyStatus";
import { buttonClass } from "@/components/ui/button";
import { formatZAR } from "@/lib/utils";

interface LocationState {
  orderNumber: string;
  paymentMethod: string;
  total: number;
  hasPhysical: boolean;
}

export function SupplySuccessPage() {
  const { state } = useLocation() as { state: LocationState | null };

  if (!state?.orderNumber) return <Navigate to="/supplies/orders" replace />;

  return (
    <div className="mx-auto max-w-lg text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">Order placed!</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Thank you for your purchase. We're processing your order now.
      </p>

      <div className="mt-6 space-y-2 border border-neutral-200 p-5 text-left">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">Order number</span>
          <span className="font-mono text-sm font-semibold text-neutral-900">{state.orderNumber}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">Payment method</span>
          <SupplyPaymentMethodBadge method={state.paymentMethod} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">Total</span>
          <span className="text-sm font-bold text-neutral-900">{formatZAR(state.total)}</span>
        </div>
      </div>

      {state.paymentMethod === "wallet" && (
        <div className="mt-4 rounded border border-green-100 bg-green-50 p-4 text-left text-sm text-green-800">
          <p className="font-semibold">Paid from your wallet balance</p>
          <p className="mt-1">
            Your order is paid in full. The amount was deducted from your seller wallet balance
            immediately.
          </p>
        </div>
      )}

      {state.hasPhysical && state.paymentMethod === "online" && (
        <div className="mt-4 rounded border border-blue-100 bg-blue-50 p-4 text-left text-sm text-blue-800">
          <p className="flex items-center gap-2 font-semibold">
            <Download className="h-4 w-4" /> Delivery information
          </p>
          <p className="mt-1">
            A tracking number will appear in your order details once your package ships. Digital items
            (if any) are available instantly.
          </p>
        </div>
      )}

      {!state.hasPhysical && (
        <div className="mt-4 rounded border border-green-100 bg-green-50 p-4 text-left text-sm text-green-800">
          <p className="font-semibold">Digital delivery</p>
          <p className="mt-1">
            Your digital downloads are ready. Check your order details for access links.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/supplies/orders" className={buttonClass("accent", "md")}>
          <ShoppingBag className="mr-2 h-4 w-4" /> View my orders
        </Link>
        <Link to="/supplies/shop" className={buttonClass("outline", "md")}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
