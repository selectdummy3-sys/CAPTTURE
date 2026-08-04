import { useState } from "react";
import { Package, Pencil, Plus, Search, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

import {
  useAdminSupplyProducts,
  useAdminSupplyCategories,
  useAdminSupplyDeleteProduct,
  useAdminSupplyToggleProduct,
  useAdminSupplyUpsertProduct,
} from "@/hooks/useSupply";
import { supplyImageUrl } from "@/hooks/useSupply";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form/Field";
import { SUPPLY_PRODUCT_TYPES, SUPPLY_PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { cn, discountPercent, formatZAR, slugify } from "@/lib/utils";
import { toast } from "sonner";

interface ProductForm {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  type: string;
  description: string;
  price: number;
  salePrice: string;
  stock: string;
  sku: string;
  deliveryDays: string;
  isActive: boolean;
  featuredImage: string;
}

const DEFAULT_FORM: ProductForm = {
  name: "",
  slug: "",
  categoryId: "",
  type: "physical",
  description: "",
  price: 0,
  salePrice: "",
  stock: "",
  sku: "",
  deliveryDays: "",
  isActive: true,
  featuredImage: "",
};

export function AdminSupplyProducts() {
  const { data: products = [], isLoading } = useAdminSupplyProducts();
  const { data: categories = [] } = useAdminSupplyCategories();
  const deleteProduct = useAdminSupplyDeleteProduct();
  const toggleProduct = useAdminSupplyToggleProduct();
  const upsertProduct = useAdminSupplyUpsertProduct();

  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(DEFAULT_FORM);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  const setField = <K extends keyof ProductForm>(key: K, val: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setFormOpen(true);
  };

  const openEdit = (product: (typeof products)[number]) => {
    setForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      categoryId: product.category_id ?? "",
      type: product.type ?? "physical",
      description: product.description ?? "",
      price: product.price,
      salePrice: product.sale_price != null ? String(product.sale_price) : "",
      stock: product.stock != null ? String(product.stock) : "",
      sku: product.sku ?? "",
      deliveryDays: product.delivery_days != null ? String(product.delivery_days) : "",
      isActive: product.is_active,
      featuredImage: product.featured_image ?? "",
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.price || form.price <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    try {
      await upsertProduct.mutateAsync({
        id: form.id,
        name: form.name.trim(),
        slug: form.slug || slugify(form.name),
        categoryId: form.categoryId || null,
        type: form.type,
        description: form.description.trim() || undefined,
        price: form.price,
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        stock: form.type === "physical" && form.stock ? Number(form.stock) : undefined,
        sku: form.sku || undefined,
        deliveryDays: form.deliveryDays ? Number(form.deliveryDays) : null,
        specifications: {},
        featuredImage: form.featuredImage || null,
        images: form.featuredImage ? [form.featuredImage] : [],
        isActive: form.isActive,
      });
      toast.success(form.id ? "Product updated" : "Product created");
      setFormOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save product");
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

  const onToggle = async (id: string, currentActive: boolean) => {
    setBusyId(id);
    try {
      await toggleProduct.mutateAsync({ id, isActive: !currentActive });
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-400">Loading products…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Supply Products</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add product
        </Button>
      </div>

      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-neutral-400"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          title="No supply products"
          description="Create your first supply product to get started."
          className="mt-12"
        />
      ) : (
        <div className="mt-4 overflow-hidden border border-neutral-200">
          <div className="divide-y divide-neutral-100">
            {filtered.map((product) => {
              const percent = discountPercent(product.price, product.sale_price);
              return (
                <div key={product.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden bg-neutral-100">
                    {supplyImageUrl(product.featured_image) ? (
                      <img
                        src={supplyImageUrl(product.featured_image)!}
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
                      {product.category?.name ?? "Uncategorised"} · {product.type} ·{" "}
                      {formatZAR(product.sale_price ?? product.price)}
                      {percent != null && ` (-${percent}%)`}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {product.type === "physical"
                        ? `${product.stock ?? 0} in stock`
                        : "Digital"}{" "}
                      · {product.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={product.is_active ? "Deactivate" : "Activate"}
                      disabled={busyId === product.id}
                      onClick={() => void onToggle(product.id, product.is_active)}
                      className={cn(
                        "p-2 touch-target",
                        product.is_active
                          ? "text-green-600 hover:bg-green-50"
                          : "text-neutral-400 hover:bg-neutral-100"
                      )}
                    >
                      {product.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button
                      type="button"
                      aria-label="Edit"
                      onClick={() => openEdit(product)}
                      className="p-2 touch-target text-neutral-500 hover:bg-neutral-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
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
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? "Edit supply product" : "New supply product"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={upsertProduct.isPending} onClick={() => void save()}>
              {form.id ? "Save changes" : "Create product"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" error={!form.name.trim() ? undefined : undefined}>
              <Input
                value={form.name}
                onChange={(e) => {
                  setField("name", e.target.value);
                  if (!form.id) setField("slug", slugify(e.target.value));
                }}
                placeholder="Branded paper bags"
              />
            </Field>
            <Field label="Slug">
              <Input value={form.slug} onChange={(e) => setField("slug", e.target.value)} placeholder="branded-paper-bags" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select value={form.categoryId} onChange={(e) => setField("categoryId", e.target.value)}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setField("type", e.target.value)}>
                {SUPPLY_PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SUPPLY_PRODUCT_TYPE_LABELS[t] ?? t}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
              placeholder="Describe the product…"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price (ZAR)">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.price || ""}
                onChange={(e) => setField("price", Number(e.target.value))}
              />
            </Field>
            <Field label="Sale price (optional)">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.salePrice}
                onChange={(e) => setField("salePrice", e.target.value)}
              />
            </Field>
            {form.type === "physical" && (
              <Field label="Stock">
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setField("stock", e.target.value)}
                />
              </Field>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SKU (optional)">
              <Input value={form.sku} onChange={(e) => setField("sku", e.target.value)} placeholder="SUP-001" />
            </Field>
            {form.type === "physical" && (
              <Field label="Delivery days">
                <Input
                  type="number"
                  min={1}
                  value={form.deliveryDays}
                  onChange={(e) => setField("deliveryDays", e.target.value)}
                  placeholder="2"
                />
              </Field>
            )}
          </div>
          <Field label="Featured image URL (optional)">
            <Input
              value={form.featuredImage}
              onChange={(e) => setField("featuredImage", e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Active (visible in store)
          </label>
        </div>
      </Dialog>
    </div>
  );
}
