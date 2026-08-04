import { Link } from "react-router-dom";
import { ArrowRight, Banknote, CircleDollarSign, Clock, Percent, Wallet } from "lucide-react";

import { useSellerEarnings, useSellerPayoutHistory } from "@/hooks/useSellerDashboard";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { formatDate, formatZAR } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PAYOUT_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700" },
  approved: { label: "Approved", color: "bg-green-50 text-green-700" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700" },
  paid: { label: "Paid", color: "bg-blue-50 text-blue-700" },
};

export function SellerEarnings() {
  const { data: earnings, isLoading } = useSellerEarnings();
  const { data: payouts = [], isLoading: payoutsLoading } = useSellerPayoutHistory();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Earnings</h1>
        <p className="text-sm text-neutral-500">Track your payouts and marketplace commission.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available balance"
          value={formatZAR(earnings?.availableBalance ?? 0)}
          icon={<Wallet className="h-5 w-5 text-green-600" />}
          loading={isLoading}
        />
        <StatCard
          label="Pending balance"
          value={formatZAR(earnings?.pendingBalance ?? 0)}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          loading={isLoading}
          hint="Orders in progress, paid out on delivery"
        />
        <StatCard
          label="Total earnings"
          value={formatZAR(earnings?.totalEarnings ?? 0)}
          icon={<CircleDollarSign className="h-5 w-5 text-brand-600" />}
          loading={isLoading}
        />
        <StatCard
          label="Marketplace commission"
          value={formatZAR(earnings?.marketplaceCommission ?? 0)}
          icon={<Percent className="h-5 w-5 text-purple-600" />}
          loading={isLoading}
        />
      </div>

      <div className="border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-500">Next payout</p>
            <p className="mt-0.5 text-lg font-semibold text-neutral-900">
              {earnings?.nextPayoutDate ? formatDate(earnings.nextPayoutDate) : "No payout scheduled"}
            </p>
          </div>
          <Link to="/seller/withdrawals" className={buttonClass("primary")}>
            <Banknote className="h-4 w-4" /> Request withdrawal
          </Link>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Payout history</h2>
          <Link to="/seller/withdrawals" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
            Manage withdrawals <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {payoutsLoading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse bg-neutral-100" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Banknote className="h-8 w-8" />}
            title="No payouts yet"
            description="When you request a withdrawal it will appear here."
          />
        ) : (
          <div className="mt-4 space-y-2">
            {payouts.map((p) => {
              const cfg = PAYOUT_LABELS[p.status] ?? PAYOUT_LABELS.pending;
              return (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border border-neutral-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{formatZAR(p.amount)}</p>
                    <p className="text-xs text-neutral-400">Requested {formatDate(p.created_at)}</p>
                  </div>
                  <span className={cn("px-2.5 py-0.5 text-xs font-medium", cfg.color)}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}