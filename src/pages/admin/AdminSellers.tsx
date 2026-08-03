import { useEffect, useState, type ReactNode } from "react";
import { BadgeCheck, Eye, FileText, Mail, Phone } from "lucide-react";

import { useAllSellers, useSetSellerStatus } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type AdminSellerRow = NonNullable<ReturnType<typeof useAllSellers>["data"]>[number];

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-neutral-800">{children}</dd>
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
  }, [open, seller]);

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
          <div className="rounded-xl border border-neutral-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Products</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{seller.products ?? 0}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Followers</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{seller.followers ?? 0}</p>
          </div>
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
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = (sellers ?? []).find((s) => s.id === selectedId) ?? null;

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
                    {seller.products ?? 0} products · {seller.followers ?? 0} followers
                  </p>
                  {seller.rejection_reason && (
                    <p className="mt-1 text-xs text-amber-700">Reason: {seller.rejection_reason}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedId(seller.id)}>
                      <Eye className="h-4 w-4" /> Details
                    </Button>
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
                        onClick={() => void act(seller.id, "suspended", true)}
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                  <input
                    value={reason[seller.id] ?? ""}
                    onChange={(e) => setReason((r) => ({ ...r, [seller.id]: e.target.value }))}
                    placeholder="Reason (optional)"
                    className="h-8 w-56 rounded-md border border-neutral-300 px-2 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <SellerDetailDialog seller={selected} open={selected != null} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
