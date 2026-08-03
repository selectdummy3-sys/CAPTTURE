import { useState } from "react";
import { Clock, DollarSign } from "lucide-react";

import { useAllWithdrawals, useProcessWithdrawal } from "@/hooks/useWithdrawals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form/Field";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; tone: "amber" | "green" | "red" | "blue" }> = {
  pending: { label: "Pending", tone: "amber" },
  approved: { label: "Approved", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
  paid: { label: "Paid", tone: "blue" },
};

type WithdrawalRow = NonNullable<ReturnType<typeof useAllWithdrawals>["data"]>[number];

export default function AdminWithdrawals() {
  const { data: withdrawals = [], isLoading } = useAllWithdrawals();
  const process = useProcessWithdrawal();

  const [selected, setSelected] = useState<WithdrawalRow | null>(null);
  const [action, setAction] = useState<"approved" | "rejected" | "paid">("approved");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const openDialog = (row: WithdrawalRow, act: "approved" | "rejected" | "paid") => {
    setSelected(row);
    setAction(act);
    setNotes("");
  };

  const handleProcess = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await process.mutateAsync({ requestId: selected.id, action, notes: notes || undefined });
      toast.success(
        action === "approved"
          ? "Withdrawal approved"
          : action === "rejected"
            ? "Withdrawal rejected"
            : "Marked as paid"
      );
      setSelected(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setProcessing(false);
    }
  };

  const pending = withdrawals.filter((w) => w.status === "pending");
  const processed = withdrawals.filter((w) => w.status !== "pending");

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Withdrawals</h1>
        <p className="text-sm text-neutral-500">Review and process seller withdrawal requests.</p>
      </div>

      {/* Pending requests */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Pending ({pending.length})
        </h2>
        {isLoading ? (
          <div className="mt-3 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-12 w-12" />}
            title="No pending requests"
            description="All withdrawal requests have been processed."
          />
        ) : (
          <div className="mt-3 space-y-3">
            {pending.map((w) => (
              <div key={w.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-700">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">
                        R{Number(w.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-neutral-500">{w.seller?.business_name}</p>
                      <p className="text-xs text-neutral-400">
                        Bank: {(w.bank_snapshot as Record<string, string>)?.bank_name ?? "—"} •
                        Acc: {(w.bank_snapshot as Record<string, string>)?.account_number ?? "—"}
                      </p>
                      <p className="text-xs text-neutral-400">{formatDate(w.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openDialog(w, "rejected")}>
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => openDialog(w, "approved")}>
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed requests */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Processed ({processed.length})
        </h2>
        {processed.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-400">No processed requests yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {processed.map((w) => {
              const cfg = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.pending;
              return (
                <div key={w.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        R{Number(w.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-neutral-500">{w.seller?.business_name}</p>
                      {w.admin_notes && (
                        <p className="text-xs text-neutral-400 italic">Note: {w.admin_notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={cfg.tone}>{cfg.label}</Badge>
                    {w.status === "approved" && (
                      <Button size="sm" variant="outline" onClick={() => openDialog(w, "paid")}>
                        Mark paid
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Process dialog */}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          action === "approved"
            ? "Approve withdrawal"
            : action === "rejected"
              ? "Reject withdrawal"
              : "Mark as paid"
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              onClick={handleProcess}
              disabled={processing}
              variant={action === "rejected" ? "danger" : "primary"}
            >
              {processing ? "Processing..." : "Confirm"}
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              <span className="font-semibold">
                R{Number(selected.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
              </span>{" "}
              to <span className="font-semibold">{selected.seller?.business_name}</span>
            </p>
            <Field label="Notes (optional)">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add a note..."
              />
            </Field>
          </div>
        )}
      </Dialog>
    </div>
  );
}
