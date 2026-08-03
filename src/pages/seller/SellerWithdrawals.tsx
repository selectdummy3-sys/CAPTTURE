import { useState } from "react";
import { Banknote, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

import {
  useSellerBalance,
  useSellerWithdrawals,
  useRequestWithdrawal,
} from "@/hooks/useWithdrawals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/Field";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-600 bg-amber-50" },
  approved: { label: "Approved", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-red-600 bg-red-50" },
  paid: { label: "Paid", icon: Banknote, color: "text-blue-600 bg-blue-50" },
};

export default function SellerWithdrawals() {
  const { data: balance = 0, isLoading: balanceLoading } = useSellerBalance();
  const { data: withdrawals = [], isLoading } = useSellerWithdrawals();
  const requestWithdrawal = useRequestWithdrawal();

  const [openRequest, setOpenRequest] = useState(false);
  const [amount, setAmount] = useState("");

  const handleRequest = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (num > balance) {
      toast.error("Amount exceeds your available balance");
      return;
    }
    try {
      await requestWithdrawal.mutateAsync(num);
      toast.success("Withdrawal request submitted");
      setOpenRequest(false);
      setAmount("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Withdrawals</h1>
      <p className="mt-1 text-sm text-neutral-500">Request payouts from your earnings.</p>

      {/* Balance card */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <p className="text-sm font-medium text-neutral-500">Available balance</p>
        {balanceLoading ? (
          <div className="mt-2 h-8 w-32 animate-pulse rounded bg-neutral-100" />
        ) : (
          <p className="mt-1 text-3xl font-bold text-neutral-900">
            R{balance.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
          </p>
        )}
        <Button
          className="mt-4"
          onClick={() => setOpenRequest(true)}
          disabled={balance <= 0 || balanceLoading}
        >
          <Banknote className="mr-2 h-4 w-4" /> Request withdrawal
        </Button>
      </div>

      {/* History */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900">History</h2>
        {isLoading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <EmptyState
            icon={<Banknote className="h-12 w-12" />}
            title="No withdrawal requests"
            description="When you have earnings, you can request a payout here."
          />
        ) : (
          <div className="mt-4 space-y-2">
            {withdrawals.map((w) => {
              const cfg = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div key={w.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-9 w-9 place-items-center rounded-lg ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        R{Number(w.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-neutral-400">{formatDate(w.created_at)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request dialog */}
      <Dialog
        open={openRequest}
        onClose={() => setOpenRequest(false)}
        title="Request withdrawal"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenRequest(false)}>Cancel</Button>
            <Button onClick={handleRequest} disabled={requestWithdrawal.isPending || !amount}>
              {requestWithdrawal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit request
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            Available:{" "}
            <span className="font-semibold text-neutral-900">
              R{balance.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
            </span>
          </p>
          <Field label="Amount (ZAR)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">R</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </Field>
          <p className="text-xs text-neutral-400">
            Funds will be transferred to your bank account on file within 3–5 business days after approval.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
