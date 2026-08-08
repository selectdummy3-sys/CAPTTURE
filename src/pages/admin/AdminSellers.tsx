import { useEffect, useState, type ReactNode } from "react";
import { BadgeCheck, Check, Eye, FileText, Mail, Phone, RotateCcw, Trash2, X } from "lucide-react";

import { useAdminSellerFinance, useAllSellers, useDeleteSeller, useSetSellerStatus } from "@/hooks/useAdmin";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatZAR } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type AdminSellerRow = NonNullable<ReturnType<typeof useAllSellers>["data"]>[number];

type StatusAction =
  | { kind: "approve"; label: string; variant: ButtonVariant }
  | { kind: "reinstate"; label: string; variant: ButtonVariant }
  | { kind: "reject"; label: string; variant: ButtonVariant }
  | { kind: "suspend"; label: string; variant: ButtonVariant };

function statusActions(status: string): StatusAction[] {
  switch (status) {
    case "pending":
      return [
        { kind: "approve", label: "Approve", variant: "primary" },
        { kind: "reject", label: "Reject", variant: "danger-outline" },
      ];
    case "approved":
      return [{ kind: "suspend", label: "Suspend", variant: "danger-outline" }];
    case "suspended":
      return [{ kind: "reinstate", label: "Reinstate", variant: "primary" }];
    default:
      return [];
  }
}

function actionIcon(action: StatusAction) {
  switch (action.kind) {
    case "reject":
    case "suspend":
      return <X className="h-4 w-4" />;
    case "reinstate":
      return <RotateCcw className="h-4 w-4" />;
    default:
      return <Check className="h-4 w-4" />;
  }
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-neutral-800">{children}</dd>
    </div>
  );
}

function FinanceBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}

function SellerDetailDialog({
  seller,
  open,
  onClose,
}: {
  seller: AdminSellerRow;
  open: boolean;
  onClose: () => void;
}) {
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const { data: finance, isLoading: financeLoading } = useAdminSellerFinance(seller.id);

  useEffect(() => {
    let cancelled = false;
    setDocUrl(null);
    setProofUrl(null);
    if (open && seller.id_document_url) {
      void supabase.storage
        .from("documents")
        .createSignedUrl(seller.id_document_url, 300)
        .then(({ data, error }) => {
          if (!cancelled && !error) setDocUrl(data?.signedUrl ?? null);
        });
    }
    if (open && seller.proof_of_residence_url) {
      void supabase.storage
        .from("documents")
        .createSignedUrl(seller.proof_of_residence_url, 300)
        .then(({ data, error }) => {
          if (!cancelled && !error) setProofUrl(data?.signedUrl ?? null);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [open, seller.id_document_url, seller.proof_of_residence_url]);

  const bank = (seller.bank_details ?? {}) as Record<string, string>;
  const socials = (seller.social_links ?? {}) as Record<string, string>;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          {seller.business_name}
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
        </span>
      }
      description={`@${seller.store_username} · ${seller.id}`}
    >
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Contact</h3>
            <dl className="mt-3 space-y-3">
              <DetailRow label="Owner">
                <span className="inline-flex items-center gap-1.5">
                  {seller.user?.full_name ?? "—"}
                  {seller.user?.role === "admin" && (
                    <span className="text-xs text-brand-600">(admin)</span>
                  )}
                </span>
              </DetailRow>
              <DetailRow label="Business email">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-neutral-400" /> {seller.email}
                </span>
              </DetailRow>
              <DetailRow label="Phone">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-neutral-400" /> {seller.phone}
                </span>
              </DetailRow>
              <DetailRow label="Province">{seller.province}</DetailRow>
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Address</h3>
            <dl className="mt-3 space-y-3">
              <DetailRow label="Street">{seller.address_line1}</DetailRow>
              <DetailRow label="City">{seller.city}</DetailRow>
              <DetailRow label="Postal code">{seller.postal_code}</DetailRow>
            </dl>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Business</h3>
            <dl className="mt-3 space-y-3">
              <DetailRow label="Description">{seller.description}</DetailRow>
              <DetailRow label="Commission rate">
                {seller.commission_rate != null ? `${(seller.commission_rate * 100).toFixed(1)}%` : null}
              </DetailRow>
              <DetailRow label="Featured">{seller.featured ? "Yes" : "No"}</DetailRow>
              <DetailRow label="Joined">{formatDate(seller.created_at)}</DetailRow>
              <DetailRow label="Approved">{seller.approved_at ? formatDate(seller.approved_at) : null}</DetailRow>
              {seller.rejection_reason && (
                <DetailRow label="Status reason">
                  <span className="text-amber-700">{seller.rejection_reason}</span>
                </DetailRow>
              )}
            </dl>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border border-neutral-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Products</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{seller.products ?? 0}</p>
          </div>
          <div className="border border-neutral-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Followers</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{seller.followers ?? 0}</p>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-5">
          <h3 className="text-sm font-semibold text-neutral-900">Finances</h3>
          <p className="mt-1 text-xs text-neutral-500">Net figures after marketplace commission.</p>
          {financeLoading ? (
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-neutral-100" />
              ))}
            </div>
          ) : finance ? (
            <>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <FinanceBox label="Seller earned (net)" value={formatZAR(finance.net)} />
                <FinanceBox label="Platform commission" value={formatZAR(finance.commission)} />
                <FinanceBox label="Gross sales" value={formatZAR(finance.gross)} />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <FinanceBox label="Available" value={formatZAR(finance.available)} />
                <FinanceBox label="Pending" value={formatZAR(finance.pending)} />
                <FinanceBox label="Withdrawn" value={formatZAR(finance.withdrawn)} />
              </div>
              <p className="mt-3 text-xs text-neutral-400">
                {finance.orders} order{finance.orders === 1 ? "" : "s"}
              </p>
            </>
          ) : null}
        </div>

        {Object.keys(bank).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Payout details</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              {Object.entries(bank).map(([key, value]) => (
                <DetailRow key={key} label={key.replace(/_/g, " ")}>
                  {value}
                </DetailRow>
              ))}
            </dl>
          </div>
        )}

        {Object.keys(socials).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Social links</h3>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              {Object.entries(socials).map(([key, value]) => (
                <DetailRow key={key} label={key}>
                  {value.startsWith("http") ? (
                    <a
                      href={value}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 underline hover:text-brand-700"
                    >
                      {value.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    value
                  )}
                </DetailRow>
              ))}
            </dl>
          </div>
        )}

        {seller.id_document_url && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">ID document</h3>
            {docUrl ? (
              <a
                href={docUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-600 underline hover:text-brand-700"
              >
                <FileText className="h-4 w-4" /> Open document
              </a>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">Generating secure link…</p>
            )}
          </div>
        )}

        {seller.proof_of_residence_url && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Proof of residence</h3>
            {proofUrl ? (
              <a
                href={proofUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-600 underline hover:text-brand-700"
              >
                <FileText className="h-4 w-4" /> Open document
              </a>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">Generating secure link…</p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}

export function AdminSellers() {
  const { data: sellers, isLoading } = useAllSellers();
  const setStatus = useSetSellerStatus();
  const deleteSeller = useDeleteSeller();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ seller: AdminSellerRow; action: StatusAction } | null>(null);
  const [reason, setReason] = useState("");
  const [showReasonError, setShowReasonError] = useState(false);

  const selected = (sellers ?? []).find((s) => s.id === selectedId) ?? null;

  const act = async (id: string, status: string, reason?: string) => {
    setBusyId(id);
    try {
      await setStatus.mutateAsync({ sellerId: id, status, ...(reason ? { reason } : {}) });
    } finally {
      setBusyId(null);
    }
  };

  const runAction = (seller: AdminSellerRow, action: StatusAction) => {
    if (action.kind === "reject" || action.kind === "suspend") {
      setReason("");
      setShowReasonError(false);
      setStatusDialog({ seller, action });
      return;
    }
    void act(seller.id, "approved");
  };

  const confirmStatusDialog = async () => {
    if (!statusDialog) return;
    const next = statusDialog.action.kind === "reject" ? "rejected" : "suspended";
    if (!reason.trim()) {
      setShowReasonError(true);
      return;
    }
    const id = statusDialog.seller.id;
    const trimmed = reason.trim();
    setStatusDialog(null);
    setReason("");
    setShowReasonError(false);
    await act(id, next, trimmed);
  };

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-400">Loading sellers…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Sellers</h1>

      {(sellers ?? []).length === 0 ? (
        <EmptyState icon={<BadgeCheck className="h-8 w-8" />} title="No sellers yet" className="mt-8" />
      ) : (
        <div className="mt-6 space-y-4">
          {(sellers ?? []).map((seller) => {
            const actions = statusActions(seller.application_status);
            return (
              <div key={seller.id} className="border border-neutral-200 p-5">
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
                      {seller.products ?? 0} products · {seller.followers ?? 0} followers
                    </p>
                    {seller.rejection_reason && (
                      <p className="mt-1 text-xs text-amber-700">Reason: {seller.rejection_reason}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedId(seller.id)}>
                      <Eye className="h-4 w-4" /> Details
                    </Button>
                    {actions.map((action) => (
                      <Button
                        key={action.kind}
                        size="sm"
                        variant={action.variant}
                        disabled={busyId === seller.id}
                        onClick={() => runAction(seller, action)}
                      >
                        {actionIcon(action)}
                        {action.label}
                      </Button>
                    ))}
                    {seller.application_status === "suspended" && (
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busyId === seller.id}
                        onClick={() => setDeleteConfirmId(seller.id)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <SellerDetailDialog seller={selected} open={selected != null} onClose={() => setSelectedId(null)} />
      )}

      {statusDialog && (
        <Dialog
          open
          onClose={() => {
            setStatusDialog(null);
            setReason("");
            setShowReasonError(false);
          }}
          title={
            statusDialog.action.kind === "reject"
              ? `Reject ${statusDialog.seller.business_name}?`
              : `Suspend ${statusDialog.seller.business_name}?`
          }
          description={
            statusDialog.action.kind === "reject"
              ? "The seller will lose dashboard access and will be told why the application was declined."
              : "All products will be hidden from the marketplace and the seller will lose dashboard access until reinstated."
          }
        >
          <label htmlFor="status-reason" className="block text-sm font-medium text-neutral-900">
            {statusDialog.action.kind === "reject" ? "Rejection reason" : "Suspension reason"} (required)
          </label>
          <textarea
            id="status-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (showReasonError && e.target.value.trim()) setShowReasonError(false);
            }}
            rows={4}
            placeholder={statusDialog.action.kind === "reject" ? "e.g. Failed identity verification." : "e.g. Violation of marketplace policies."}
            className="mt-2 w-full border border-neutral-300 p-3 text-sm outline-none focus:border-neutral-900"
          />
          {showReasonError && !reason.trim() && (
            <p className="mt-1 text-xs text-red-600">A reason is required to {statusDialog.action.kind} this seller.</p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStatusDialog(null);
                setReason("");
                setShowReasonError(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={statusDialog.action.kind === "reject" ? "danger" : "danger"}
              loading={setStatus.isPending}
              onClick={() => void confirmStatusDialog()}
            >
              {statusDialog.action.kind === "reject" ? "Reject seller" : "Suspend seller"}
            </Button>
          </div>
        </Dialog>
      )}

      {deleteConfirmId && (
        <Dialog
          open={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete seller permanently?"
        >
          <p className="text-sm text-neutral-600">
            This will permanently remove the seller, all their products, orders, and associated data. This action cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={deleteSeller.isPending}
              onClick={async () => {
                await deleteSeller.mutateAsync(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
            >
              {deleteSeller.isPending ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
