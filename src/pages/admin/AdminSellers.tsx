import { useState } from "react";
import { BadgeCheck } from "lucide-react";

import { useAllSellers, useSetSellerStatus } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export function AdminSellers() {
  const { data: sellers, isLoading } = useAllSellers();
  const setStatus = useSetSellerStatus();
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const act = async (id: string, status: string, withReason: boolean) => {
    setBusyId(id);
    try {
      await setStatus.mutateAsync({
        sellerId: id,
        status,
        ...(withReason ? { reason: reason[id] || "No reason provided." } : {}),
      });
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-400">Loading sellers…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Sellers</h1>

      {(sellers ?? []).length === 0 ? (
        <EmptyState icon={<BadgeCheck className="h-8 w-8" />} title="No sellers yet" className="mt-8" />
      ) : (
        <div className="mt-6 space-y-4">
          {(sellers ?? []).map((seller) => (
            <div key={seller.id} className="rounded-xl border border-neutral-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-neutral-900">{seller.business_name}</p>
                    <Badge
                      tone={
                        seller.application_status === "approved"
                          ? "green"
                          : seller.application_status === "rejected" || seller.application_status === "suspended"
                            ? "red"
                            : "amber"
                      }
                    >
                      {APPLICATION_STATUS_LABELS[seller.application_status] ?? seller.application_status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    @{seller.store_username} · {seller.province || "—"} · joined {formatDate(seller.created_at)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {seller.products?.count ?? 0} products · {seller.followers?.count ?? 0} followers
                  </p>
                  {seller.rejection_reason && (
                    <p className="mt-1 text-xs text-amber-700">Reason: {seller.rejection_reason}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex gap-2">
                    {seller.application_status !== "approved" && (
                      <Button size="sm" disabled={busyId === seller.id} onClick={() => void act(seller.id, "approved", false)}>
                        Approve
                      </Button>
                    )}
                    {seller.application_status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === seller.id}
                        onClick={() => void act(seller.id, "rejected", true)}
                      >
                        Reject
                      </Button>
                    )}
                    {seller.application_status !== "suspended" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === seller.id}
                        onClick={() => void act(seller.id, "suspended", false)}
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                  <input
                    value={reason[seller.id] ?? ""}
                    onChange={(e) => setReason((r) => ({ ...r, [seller.id]: e.target.value }))}
                    placeholder="Rejection reason (optional)"
                    className="h-8 w-56 rounded-md border border-neutral-300 px-2 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
