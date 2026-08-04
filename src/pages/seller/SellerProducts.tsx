import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, PackagePlus, Trash2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useSellerProducts } from "@/hooks/useProducts";
import { useDeleteProduct, useToggleProductStatus } from "@/hooks/useSeller";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductStatusBadge } from "@/components/ui/status-badge";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { formatZAR } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TABS = ["all", "published", "draft", "pending", "rejected", "archived"] as const;

export function SellerProducts() {
  const { seller } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const { data: products, isLoading } = useSellerProducts(seller?.id, tab === "all" ? undefined : tab);
  const toggleStatus = useToggleProductStatus();
  const deleteProduct = useDeleteProduct();
  const [busyId, setBusyId] = useState<string | null>(null);

  const onToggle = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await toggleStatus.mutateAsync({ id, status: status === "published" ? "draft" : "published" });
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

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-400">Loading products…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Products</h1>
        <Link to="/seller/products/new" className={buttonClass("primary", "sm")}>
          <PackagePlus className="h-4 w-4" /> New product
        </Link>
      </div>

      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
              tab === t ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {(products ?? []).length === 0 ? (
        <EmptyState
          icon={<PackagePlus className="h-8 w-8" />}
          title="No products yet"
          description="List your first product to start selling."
          action={
            <Link to="/seller/products/new" className={buttonClass("primary", "md")}>
              Add a product
            </Link>
          }
          className="mt-8"
        />
      ) : (
        <div className="mt-6 overflow-hidden border border-neutral-200">
          <div className="divide-y divide-neutral-100">
            {(products ?? []).map((product) => (
              <div key={product.id} className="flex items-center gap-4 px-4 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden bg-neutral-100">
                  {product.featured_image && (
                    <img
                      src={productImageUrl(product.featured_image) ?? ""}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {formatZAR(product.sale_price ?? product.price)} · {product.stock} in stock
                  </p>
                  {product.status === "rejected" && product.moderation_reason && (
                    <p className="mt-0.5 text-xs text-red-600">Rejected: {product.moderation_reason}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ProductStatusBadge status={product.status} />
                  {product.status === "published" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === product.id}
                      onClick={() => void onToggle(product.id, product.status)}
                    >
                      Unpublish
                    </Button>
                  ) : product.status === "pending" ? (
                    <span className="px-3 py-1.5 text-xs font-medium text-amber-700">In review</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === product.id}
                      onClick={() => void onToggle(product.id, product.status)}
                    >
                      Submit for review
                    </Button>
                  )}
                  <Link
                    to={`/seller/products/${product.id}/edit`}
                    aria-label="Edit"
                    className="p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    aria-label="Delete"
                    disabled={busyId === product.id}
                    onClick={() => void onDelete(product.id, product.name)}
                    className="p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
