import { useState } from "react";
import { Check, Eye, Package, Search, Trash2, X } from "lucide-react";

import { useAdminProducts, useAdminDeleteProduct, useAdminSetProductStatus } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { ProductStatusBadge } from "@/components/ui/status-badge";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { formatZAR } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TABS = ["all", "pending", "published", "draft", "rejected", "archived"] as const;

type AdminProductRow = NonNullable<ReturnType<typeof useAdminProducts>["data"]>[number];

export function AdminProducts() {
  const { data: products = [], isLoading } = useAdminProducts();
  const deleteProduct = useAdminDeleteProduct();
  const setStatus = useAdminSetProductStatus();
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminProductRow | null>(null);
  const [reason, setReason] = useState("");
  const [showReasonError, setShowReasonError] = useState(false);
  const [viewImages, setViewImages] = useState<{ name: string; images: { url: string }[] } | null>(null);

  const pendingCount = products.filter((p) => p.status === "pending").length;

  const filtered = products.filter((p) => {
    if (tab !== "all" && p.status !== tab) return false;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.seller?.business_name?.toLowerCase().includes(q) ||
      p.seller?.store_username?.toLowerCase().includes(q)
    );
  });

  const run = async (id: string, status: string, reason?: string) => {
    setBusyId(id);
    try {
      await setStatus.mutateAsync({ id, status, ...(reason ? { reason } : {}) });
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    setBusyId(id);
    try {
      await deleteProduct.mutateAsync(id);
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    if (!reason.trim()) {
      setShowReasonError(true);
      return;
    }
    const id = rejectTarget.id;
    const trimmed = reason.trim();
    setRejectTarget(null);
    setReason("");
    setShowReasonError(false);
    await run(id, "rejected", trimmed);
  };

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-400">Loading products…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">All Products</h1>
        <p className="text-sm text-neutral-500">{filtered.length} products</p>
      </div>

      <div className="mt-4 relative flex gap-1.5 overflow-x-auto pb-1 scroll-hint-x">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
              tab === t ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            {t}
            {t === "pending" && pendingCount > 0 && (
              <span className={cn("h-5 min-w-5 px-1.5 text-[10px] font-bold leading-5", tab === t ? "bg-white text-neutral-900" : "bg-amber-500 text-white")}>
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by product name or seller…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-neutral-400"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          title="No products found"
          description={search ? "Try a different search term." : tab === "pending" ? "No products awaiting review." : "No products in this view yet."}
          className="mt-12"
        />
      ) : (
        <div className="mt-4 overflow-hidden border border-neutral-200">
          <div className="divide-y divide-neutral-100">
            {filtered.map((product) => (
              <div key={product.id} className="flex items-center gap-4 px-4 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden bg-neutral-100">
                  {product.featured_image ? (
                    <img
                      src={productImageUrl(product.featured_image) ?? ""}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-neutral-300">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {product.seller?.business_name ?? "Unknown seller"} · {product.category?.name ?? "Uncategorised"} · {formatZAR(product.sale_price ?? product.price)}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {product.stock} in stock · {product.images?.length ?? 0} images
                  </p>
                  {product.status === "rejected" && product.moderation_reason && (
                    <p className="mt-0.5 text-xs text-red-600">Rejected: {product.moderation_reason}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5 flex-wrap sm:flex-nowrap">
                  <ProductStatusBadge status={product.status} />
                  {product.images && product.images.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="touch-target"
                      onClick={() => setViewImages({ name: product.name, images: product.images })}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View images</span>
                    </Button>
                  )}
                  {product.status === "pending" ? (
                    <div className="flex flex-col sm:flex-row gap-1.5 flex-1 sm:flex-none">
                      <Button
                        variant="primary"
                        size="sm"
                        className="touch-target w-full sm:w-auto"
                        disabled={busyId === product.id}
                        onClick={() => void run(product.id, "published")}
                      >
                        <Check className="h-4 w-4" />
                        <span className="hidden sm:inline">Approve</span>
                        <span className="sm:hidden">Approve</span>
                      </Button>
                      <Button
                        variant="danger-outline"
                        size="sm"
                        className="touch-target w-full sm:w-auto"
                        disabled={busyId === product.id}
                        onClick={() => {
                          setReason("");
                          setShowReasonError(false);
                          setRejectTarget(product);
                        }}
                      >
                        <X className="h-4 w-4" />
                        <span className="hidden sm:inline">Reject</span>
                        <span className="sm:hidden">Reject</span>
                      </Button>
                    </div>
                  ) : product.status === "rejected" ? (
                    <div className="flex flex-col sm:flex-row gap-1.5 flex-1 sm:flex-none">
                      <Button
                        variant="primary"
                        size="sm"
                        className="touch-target w-full sm:w-auto"
                        disabled={busyId === product.id}
                        onClick={() => void run(product.id, "published")}
                      >
                        <Check className="h-4 w-4" />
                        <span className="hidden sm:inline">Approve</span>
                        <span className="sm:hidden">Approve</span>
                      </Button>
                      <Button
                        variant="danger-outline"
                        size="sm"
                        className="touch-target w-full sm:w-auto"
                        disabled={busyId === product.id}
                        onClick={() => void run(product.id, "draft")}
                      >
                        <span className="hidden sm:inline">Move to draft</span>
                        <span className="sm:hidden">Draft</span>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="touch-target w-full sm:w-auto"
                      disabled={busyId === product.id}
                      onClick={() => void run(product.id, product.status === "published" ? "draft" : "published")}
                    >
                      {product.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                  )}
                  <button
                    type="button"
                    aria-label="Delete"
                    disabled={busyId === product.id}
                    onClick={() => void onDelete(product.id, product.name)}
                    className="p-2 touch-target text-neutral-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejectTarget && (
        <Dialog
          open={!!rejectTarget}
          onClose={() => {
            setRejectTarget(null);
            setReason("");
            setShowReasonError(false);
          }}
          title={`Reject "${rejectTarget.name}"?`}
          description="The seller will be told why the product was declined."
        >
          <label htmlFor="reject-reason" className="block text-sm font-medium text-neutral-900">
            Rejection reason (required)
          </label>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (showReasonError && e.target.value.trim()) setShowReasonError(false);
            }}
            rows={4}
            placeholder="e.g. Misleading description or prohibited item."
            className="mt-2 w-full border border-neutral-300 p-3 text-sm outline-none focus:border-neutral-900"
          />
          {showReasonError && !reason.trim() && (
            <p className="mt-1 text-xs text-red-600">A reason is required to reject this product.</p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setReason("");
                setShowReasonError(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={setStatus.isPending} onClick={() => void confirmReject()}>
              Reject product
            </Button>
          </div>
        </Dialog>
      )}

      {/* Image viewer dialog */}
      <Dialog open={!!viewImages} onClose={() => setViewImages(null)}>
        <div className="p-6">
          <h2 className="mb-1 text-lg font-semibold">{viewImages?.name}</h2>
          <p className="mb-4 text-sm text-neutral-500">{viewImages?.images.length} product images</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {viewImages?.images.map((img, i) => (
              <div key={i} className="aspect-square overflow-hidden bg-neutral-100">
                <img
                  src={productImageUrl(img.url) ?? ""}
                  alt={`Image ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setViewImages(null)}>Close</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
