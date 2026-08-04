import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Eye, Package, Search } from "lucide-react";

import { useAdminProducts, useAdminDeleteProduct, useAdminToggleProductStatus } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { formatZAR } from "@/lib/utils";

export function AdminProducts() {
  const { data: products = [], isLoading } = useAdminProducts();
  const deleteProduct = useAdminDeleteProduct();
  const toggleStatus = useAdminToggleProductStatus();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewImages, setViewImages] = useState<{ name: string; images: { url: string }[] } | null>(null);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.seller?.business_name?.toLowerCase().includes(q) ||
      p.seller?.store_username?.toLowerCase().includes(q)
    );
  });

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
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">All Products</h1>
        <p className="text-sm text-neutral-500">{filtered.length} products</p>
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
          description={search ? "Try a different search term." : "No products have been listed yet."}
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
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge tone={product.status === "published" ? "green" : product.status === "draft" ? "neutral" : "amber"}>
                    {product.status}
                  </Badge>
                  {product.images && product.images.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewImages({ name: product.name, images: product.images })}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === product.id}
                    onClick={() => void onToggle(product.id, product.status)}
                  >
                    {product.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Link
                    to={`/admin/sellers`}
                    aria-label="View seller"
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
